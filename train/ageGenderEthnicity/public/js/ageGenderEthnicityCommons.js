function getImageUri({ db, file }) {
  if (db === 'utk') {
    return `utk-db/cropped-images/${file}`
  }

  if (db === 'wiki') {
    return `wiki-db/cropped-images/${file}`
  }

  if (db === 'imdb') {
    return `imdb/cropped-images/${file}`
  }

  throw new Error(`getImageUri - unknown db ${db}`)
}

function getLandmarksUri({ db, file }) {
  const landmarksFile = file.replace('_0.jpg', '_0.json')
  if (db === 'utk') {
    return `utk-db/landmarks/${landmarksFile}`
  }

  if (db === 'wiki') {
    return `wiki-db/landmarks/${landmarksFile}`
  }

  if (db === 'imdb') {
    return `imdb/landmarks/${landmarksFile}`
  }

  return null
}

function getLabels(batchData) {
  return batchData.map(({ db, file }) => {
    let age = [null]
    let gender = [0, 0]
    let ethnicity = null
    if (db === 'utk') {
      const [a, g, e] = file.split('_')
      age[0] = parseInt(a)
      // utk male is labeled with 0
      gender = [1, 1]
      gender[g] = 0
      ethnicity = [0, 0, 0, 0, 0]
      ethnicity[e] = 1
    } else if (db === 'wiki') {
      const l = wikiLabels[file.replace('_0.jpg', '.jpg')]
      age[0] = l.age
      gender[l.gender] = 1
    } else if (db === 'imdb') {
      const l = imdbLabels[file.replace('_0.jpg', '.jpg')]
      age[0] = l.age
      gender[l.gender] = 1
    } else {
      throw new Error(`getLabels - unknown db ${db}`)
    }

    return { age, gender, ethnicity }
  })
}

function createBatches(data, batchSize) {
  const dataWithEthnicity = faceapi.shuffleArray(data.filter(d => d.db === 'utk'))
  const dataWithoutEthnicity = faceapi.shuffleArray(data.filter(d => d.db !== 'utk'))

  const batches = []
  for (let dataIdx = 0; dataIdx < dataWithEthnicity.length; dataIdx += batchSize) {
    batches.push(dataWithEthnicity.slice(dataIdx, dataIdx + batchSize))
  }
  for (let dataIdx = 0; dataIdx < dataWithoutEthnicity.length; dataIdx += batchSize) {
    batches.push(dataWithoutEthnicity.slice(dataIdx, dataIdx + batchSize))
  }

  return faceapi.shuffleArray(batches)
}

async function onEpochDone(epoch, params) {
  saveWeights(params || window.net, `age_gender_ethnicity_model_${epoch}.weights`)

  const numData = window.trainData.length
  const loss = window.lossValues[epoch]
  saveAs(new Blob([JSON.stringify({ loss, avgLoss: loss / numData })]), `age_gender_ethnicity_model_${epoch}.json`)
}

