async function test(dbs) {
  dbs = dbs || ['utk', 'appareal', 'wiki']//, 'imdb']
  dbs = Array.isArray(dbs) ? dbs : [dbs]

  const resultsByDb = []
  for (let db of dbs) {
    const res = await testForDb(db)
    resultsByDb.push({ db, ...res })
  }

  const resultTxt = []

  resultsByDb.forEach(({ db, size, ageError, weightedAgeError, genderPreds, genderError, ethnicityPreds, ethnicityPreds05 }) => {
    resultTxt.push('')
    resultTxt.push(db + '')
    resultTxt.push('------')
    resultTxt.push('ageError:' + (ageError / size))
    resultTxt.push('weightedAgeError:' + (weightedAgeError / size))
    resultTxt.push('genderPreds: ' + (genderPreds / size))
    resultTxt.push('genderError: ' + (genderError / size))
    if (db === 'utk') {
      resultTxt.push('ethnicityPreds: ' + (ethnicityPreds / size))
      resultTxt.push('ethnicityPreds05: ' + (ethnicityPreds05 / size))
    }
    resultTxt.push('')
  })

  const total = {}
  resultsByDb.forEach((curr) => {
    total.size = (total.size || 0) + curr.size
    total.sizeEthnicity = (total.sizeEthnicity || 0) + (curr.db === 'utk' ? curr.size : 0)
    total.ageError = (total.ageError || 0) + curr.ageError
    total.weightedAgeError = (total.weightedAgeError || 0) + curr.weightedAgeError
    total.genderPreds = (total.genderPreds || 0) + curr.genderPreds
    total.genderError = (total.genderError || 0) + curr.genderError
    total.ethnicityPreds = (total.ethnicityPreds || 0) + (curr.ethnicityPreds || 0)
    total.ethnicityPreds05 = (total.ethnicityPreds05 || 0) + (curr.ethnicityPreds05 || 0)
  })

  resultTxt.push('')
  resultTxt.push('total accuracy')
  resultTxt.push('------')
  resultTxt.push('ageError: ' + (total.ageError / total.size))
  resultTxt.push('weightedAgeError: ' + (total.weightedAgeError / total.size))
  resultTxt.push('genderPreds: ' + (total.genderPreds / total.size))
  resultTxt.push('genderError: ' + (total.genderError / total.size))
  resultTxt.push('ethnicityPreds: ' + (total.ethnicityPreds / total.sizeEthnicity))
  resultTxt.push('ethnicityPreds05: ' + (total.ethnicityPreds05 / total.sizeEthnicity))
  resultTxt.push('')
  window.resultTxt = resultTxt
  saveAs(new Blob([resultTxt.join('\n')]), window.modelCheckpoint + '_test.txt')
}

async function testForDb(db) {

  console.log(db, window.modelCheckpoint)

  let testData = window.testData.filter(data => data.db === db)
  let ageCategoryCounts = []
  let ageCategoryErrors = []
  let ageError = 0
  let weightedAgeError = 0
  let genderPreds = 0
  let genderError = 0
  let ethnicityPreds = 0
  let ethnicityPreds05 = 0

  const container = document.getElementById('container')
  const span = document.createElement('div')
  container.appendChild(span)

  for (let [idx, data] of testData.entries()) {
    span.innerHTML =  db + ': ' + faceapi.round(idx / testData.length) * 100 + '%'

    let img = await faceapi.fetchImage(getImageUri(data))
    if (window.withFaceAlignment) {
      const landmarks = await faceapi.fetchJson(getLandmarksUri(data))
      const alignedRect = new faceapi.FaceLandmarks68(landmarks.map(({ x, y }) => new faceapi.Point(x, y)), img).align()
      const [alignedFace] = await faceapi.extractFaces(img, [alignedRect])
      img = alignedFace
    }

    const pred = await window.net.predictAgeGenderAndEthnicity(img)

    const [{ age, gender, ethnicity }] = getLabels([data])

    const errAge = Math.abs(age - pred.age)
    ageError = ageError + errAge
    weightedAgeError = weightedAgeError + (getAgeMultiplier(age) * errAge)
    ageCategoryErrors[getAgeCategoryIndex(age)] = (ageCategoryErrors[getAgeCategoryIndex(age)] || 0) + errAge
    ageCategoryCounts[getAgeCategoryIndex(age)] = (ageCategoryCounts[getAgeCategoryIndex(age)] || 0) + 1

    if (gender.length === 2) {
      const expectedGender = faceapi.GenderPrediction.fromProbabilities(gender).getTop().gender
      const bestGenderPred = pred.gender.getTop()
      genderError += (1 - bestGenderPred.probability)
      genderPreds += (expectedGender === bestGenderPred.gender ? 1 : 0)
    } else {
      console.warn('skipping gender for file:', data.file)
    }

    if (db === 'utk') {
      if (ethnicity.length === 5) {
        const expectedEthnicity = faceapi.EthnicityPrediction.fromProbabilities(ethnicity).getTop().ethnicity
        const bestEthnicityPred = pred.ethnicity.getTop()
        const isEthnicityPredicted = expectedEthnicity === bestEthnicityPred.ethnicity
        ethnicityPreds += (isEthnicityPredicted ? 1 : 0)
        ethnicityPreds05 += (isEthnicityPredicted && bestEthnicityPred.probability > 0.5 ? 1 : 0)
      } else {
        console.warn('skipping ethnicity for file:', data.file)
      }
    }
  }

  span.innerHTML = db + ': 100%'

  const size = testData.length

  console.log('')
  console.log('ageError:', ageError / size)
  console.log('weightedAgeError:', weightedAgeError / size)
  console.log('ageCategoryErrors:', ageCategoryErrors.map((err, i) => ({ err: err / ageCategoryCounts[i], age: ageCategories[i] })))
  console.log('genderPreds:', genderPreds / size)
  console.log('genderError:', genderError / size)
  if (db === 'utk') {
    console.log('ethnicityPreds:', ethnicityPreds / size)
    console.log('ethnicityPreds05:', ethnicityPreds05 / size)
  }

  return { ageError, weightedAgeError, ageCategoryErrors, ageCategoryCounts, size, genderPreds, genderError, ethnicityPreds, ethnicityPreds05 }
}