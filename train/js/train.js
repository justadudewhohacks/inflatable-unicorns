async function train() {
  await load()

  for (let epoch = startEpoch; epoch < Infinity; epoch++) {

    if (epoch !== startEpoch) {
      // ugly hack to wait for loss datas for that epoch to be resolved
      setTimeout(
        () => onEpochDone(
          epoch - 1,
          new Float32Array(
            (
              window.net.faceFeatureExtractor
                ? Array.from(window.net.faceFeatureExtractor.serializeParams())
                : []
            )
              .concat(Array.from(window.net.serializeParams()))
          )
        ),
        10000
      )
    }
    window.lossValues[epoch] = 0

    const createBatches = window.createBatches || function(data, batchSize) {
      const shuffledInputs = prepareDataForEpoch(data)
      const batches = []
      for (let dataIdx = 0; dataIdx < shuffledInputs.length; dataIdx += batchSize) {
        batches.push(shuffledInputs.slice(dataIdx, dataIdx + batchSize))
      }
      return batches
    }

    const batches = createBatches(window.trainData, window.batchSize)
    console.log(batches)

    for (const [batchIdx, batchData] of batches.entries()) {
      const tsIter = Date.now()

      let bImages = await Promise.all(
        batchData
          .map(data => faceapi.fetchImage(getImageUri(data)))
      )

      if (window.withRandomCrop) {
        const landmarks = await Promise.all(
          batchData
            .map(data => getLandmarksUri(data))
            .map(url => url ? faceapi.fetchJson(url) : null)
        )

        bImages = bImages.map((img, i) => {
          if (!landmarks[i]) {
            return img
          }

          const absoluteLandmarks = landmarks[i].map(pos => ({ x: pos.x * img.width, y: pos.y * img.height }))
          const { croppedImage } = randomCrop(img, absoluteLandmarks)

          return croppedImage
        })
      }

      let tsBackward = Date.now()

      const netInput = await faceapi.toNetInput(bImages)
      const loss = computeLoss(netInput, batchData)

      tsBackward = Date.now() - tsBackward

      // start next iteration without waiting for loss data

      loss.data().then(data => {
        const lossValue = data[0]
        window.lossValues[epoch] += lossValue
        window.withLogging && log(`epoch ${epoch}, batchIdx ${batchIdx} - loss: ${lossValue}, ( ${window.lossValues[epoch]})`)
        loss.dispose()
        window.displayProgress && window.displayProgress(epoch, batchIdx, batches.length, window.lossValues[epoch])
      })

      window.withLogging && log(`epoch ${epoch}, batchIdx ${batchIdx} - backprop: ${tsBackward} ms, iter: ${Date.now() - tsIter} ms`)

      if (window.iterDelay) {
        await delay(window.iterDelay)
      } else {
        await tf.nextFrame()
      }
    }
  }
}