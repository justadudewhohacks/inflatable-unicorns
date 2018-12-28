const relativeTo = (sizes, obj) => {
  res = {}
  Object.keys(sizes).forEach((faceExpression) => {
    res[faceExpression] = faceapi.round(
      obj[faceExpression] / sizes[faceExpression]
    )
  })
  return res
}

async function test(dbs) {
  dbs = dbs || ['db', 'kaggle', 'jaffe', 'ckplus', 'imfdb', 'actors-speech']
  dbs = Array.isArray(dbs) ? dbs : [dbs]

  const resultsByDb = []
  for (let db of dbs) {
    const res = await testForDb(db)
    resultsByDb.push({ db, ...res })
  }

  const resultTxt = []

  const totalPreds = {}
  const totalSizes = {}

  resultsByDb.forEach(({ db, sizes, preds, totalError}) => {


    const result = relativeTo(sizes, preds)

    resultTxt.push('')
    resultTxt.push(db + ':')
    resultTxt.push('total error: ' + totalError)
    Object.keys(result).forEach((faceExpression) => {
      resultTxt.push(faceExpression + ': ' + result[faceExpression])
      totalPreds[faceExpression] = (totalPreds[faceExpression] || 0) + preds[faceExpression]
      totalSizes[faceExpression] = (totalSizes[faceExpression] || 0) + sizes[faceExpression]
    })
  })

  const total = relativeTo(totalSizes, totalPreds)

  resultTxt.push('')
  resultTxt.push('total accuracy:')
  Object.keys(total).forEach((faceExpression) => {
    resultTxt.push(faceExpression + ': ' + total[faceExpression])
  })
  window.resultTxt = resultTxt
  saveAs(new Blob([resultTxt.join('\n')]), window.modelCheckpoint + '_test.txt')
}

async function testForDb(db) {

  console.log(db, window.modelCheckpoint)

  const faceExpressions = Object.keys(window.testData)
  let errors = {}
  let preds = {}
  let thresh03 = {}
  let thresh05 = {}
  let thresh08 = {}
  let sizes = {}

  for (let faceExpression of faceExpressions) {

    const container = document.getElementById('container')
    const span = document.createElement('div')
    container.appendChild(span)

    console.log(faceExpression)

    const dataForLabel = window.testData[faceExpression]
      .filter(data => data.db === db)
      .slice(0, window.numDataPerClass)

    errors[faceExpression] = 0
    preds[faceExpression] = 0
    thresh03[faceExpression] = 0
    thresh05[faceExpression] = 0
    thresh08[faceExpression] = 0
    sizes[faceExpression] = dataForLabel.length


    for (let [idx, data] of dataForLabel.entries()) {
      span.innerHTML =  faceExpression + ': ' + faceapi.round(idx / dataForLabel.length) * 100 + '%'

      const img = await faceapi.fetchImage(getImageUri({ ...data, label: faceExpression }))
      const pred = await window.net.predictExpressions(img)
      const bestPred = pred
        .reduce((best, curr) => curr.probability < best.probability ? best : curr)

      const { probability } = pred.find(p => p.expression === faceExpression)
      thresh03[faceExpression] += (probability > 0.3 ? 1 : 0)
      thresh05[faceExpression] += (probability > 0.5 ? 1 : 0)
      thresh08[faceExpression] += (probability > 0.8 ? 1 : 0)
      errors[faceExpression] += 1 - probability
      preds[faceExpression] += (bestPred.expression === faceExpression ? 1 : 0)
    }

    span.innerHTML = faceExpression + ': 100%'

  }

  const totalError = faceExpressions.reduce((err, faceExpression) => err + errors[faceExpression], 0)


  console.log('')
  console.log('preds:')
  const relativePreds = relativeTo(sizes, preds)
  Object.keys(relativePreds).forEach((faceExpression) => {
    console.log(faceExpression, relativePreds[faceExpression])
  })
  console.log('')
  console.log('total error:', totalError)

  return { sizes, preds, totalError}
}