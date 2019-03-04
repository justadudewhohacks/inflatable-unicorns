function getImageUri(data) {
  if (window.withDataAugmentation) {
    return `augment/${getActualImageUri(data)}`
  }
  return getActualImageUri(data)
}

function getActualImageUri({ db, file }) {
  if (db === 'utk') {
    return `utk-db/cropped-images/${file}`
  }

  if (db === 'wiki') {
    return `wiki-db/cropped-images/${file}`
  }

  if (db === 'imdb') {
    return `imdb/cropped-images/${file}`
  }

  if (db === 'appareal') {
    return `appareal-db/cropped-images/${file}`
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

  if (db === 'appareal') {
    return `appareal-db/landmarks/${landmarksFile}`
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
      if (isNaN(age[0]) || age[0] < 0 || age[0] > 120)
        console.warn('invalid age (%s) for file: %s', age[0], file)
      if (!['0', '1'].some(val => val === g))
        console.warn('failed to parse gender (%s) for file: %s', g, file)
      if (!['0', '1', '2', '3', '4'].some(val => val === e))
        console.warn('failed to parse ethnicity (%s) for file: %s', e, file)
    } else if (db === 'wiki') {
      const l = window.wikiLabels[file.replace('_0.jpg', '.jpg')]
      age[0] = l.age
      gender[l.gender] = 1
    } else if (db === 'imdb') {
      const l = window.imdbLabels[file.replace('_0.jpg', '.jpg')]
      age[0] = l.age
      gender[l.gender] = 1
    } else if (db === 'appareal') {
      const l = window.apparealLabels[file]
      age[0] = l.age
      gender[l.gender] = 1
      // TODO ethnicity
    } else {
      throw new Error(`getLabels - unknown db ${db}`)
    }

    return { age, gender, ethnicity }
  })
}

let remainingBatches = []

function createBatches(data, batchSize) {

  const cat = []
  data.forEach(d => {
    const { age } = getLabels([d])[0]
    const idx = getAgeCategoryIndex(age)
    cat[idx] = (cat[idx] || 0) + 1
  })
  console.log(cat)

  if (!window.numBatchesPerEpoch) {
    throw new Error('window.numBatchesPerEpoch is undefined')
  }

  if (remainingBatches.length < window.numBatchesPerEpoch) {
    const dataWithEthnicity = faceapi.shuffleArray(data.filter(d => d.db === 'utk'))
    const dataWithoutEthnicity = faceapi.shuffleArray(data.filter(d => d.db !== 'utk'))

    const batches = []
    for (let dataIdx = 0; dataIdx < dataWithEthnicity.length; dataIdx += batchSize) {
      batches.push(dataWithEthnicity.slice(dataIdx, dataIdx + batchSize))
    }
    for (let dataIdx = 0; dataIdx < dataWithoutEthnicity.length; dataIdx += batchSize) {
      batches.push(dataWithoutEthnicity.slice(dataIdx, dataIdx + batchSize))
    }

    remainingBatches = remainingBatches.concat(faceapi.shuffleArray(batches))
  }

  const nextBatches = remainingBatches.slice(0, window.numBatchesPerEpoch)
  remainingBatches = remainingBatches.slice(window.numBatchesPerEpoch)
  return nextBatches
}

async function onEpochDone(epoch, params) {
  saveWeights(params || window.net, `age_gender_ethnicity_model_${epoch}.weights`)

  const numData = window.trainData.length
  const loss = window.lossValues[epoch]
  saveAs(new Blob([JSON.stringify({ loss, avgLoss: loss / numData })]), `age_gender_ethnicity_model_${epoch}.json`)
}

// estimated with function estimator
function getAgeMultiplier(age) {
  return 1 - (0.0050  * age)
  //return 1 - (0.018 * age) + 0.0001 * Math.pow(age, 2)
}

const ageCategories = [2, 4, 8, 12, 18, 24, 38, 54, 80, Infinity]

function getAgeCategoryIndex(age) {
  const idx = ageCategories.findIndex(a => a > age) - 1
  return idx < 0 ? 0 : idx
}

