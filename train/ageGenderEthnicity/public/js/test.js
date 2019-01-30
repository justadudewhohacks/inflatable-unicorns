async function test(dbs) {
  dbs = dbs || ['utk', 'wiki', 'imdb']
  dbs = Array.isArray(dbs) ? dbs : [dbs]

  const resultsByDb = []
  for (let db of dbs) {
    const res = await testForDb(db)
    resultsByDb.push({ db, ...res })
  }

  const resultTxt = []

  resultsByDb.forEach(({ db, size, ageError, genderPreds, genderError, ethnicityPreds, ethnicityPreds05 }) => {
    resultTxt.push('')
    resultTxt.push(db + '')
    resultTxt.push('------')
    resultTxt.push('ageError:' + (ageError / size))
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
    total.genderPreds = (total.genderPreds || 0) + curr.genderPreds
    total.genderError = (total.genderError || 0) + curr.genderError
    total.ethnicityPreds = (total.ethnicityPreds || 0) + (curr.ethnicityPreds || 0)
    total.ethnicityPreds05 = (total.ethnicityPreds05 || 0) + (curr.ethnicityPreds05 || 0)
  })

  resultTxt.push('')
  resultTxt.push('total accuracy')
  resultTxt.push('------')
  resultTxt.push('ageError: ' + (total.ageError / total.size))
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
  let ageError = 0
  let genderPreds = 0
  let genderError = 0
  let ethnicityPreds = 0
  let ethnicityPreds05 = 0

  const container = document.getElementById('container')
  const span = document.createElement('div')
  container.appendChild(span)

  for (let [idx, data] of testData.entries()) {
    span.innerHTML =  db + ': ' + faceapi.round(idx / testData.length) * 100 + '%'

    const img = await faceapi.fetchImage(getImageUri(data))
    const pred = await window.net.predictAgeGenderAndEthnicity(img)

    const [{ age, gender, ethnicity }] = getLabels([data])

    ageError = ageError + Math.abs(age - pred.age)

    if (gender.length === 2) {
      const expectedGender = faceapi.AgeGenderEthnicityNet.decodeGenderProbabilities(gender)
        .find(p => p.probability === 1).gender
      const bestGenderPred = pred.gender.find(p => p.probability > 0.5)
      genderError += (1 - bestGenderPred.probability)
      genderPreds += (expectedGender === bestGenderPred.gender ? 1 : 0)
    } else {
      console.warn('skipping gender for file:', data.file)
    }

    if (db === 'utk') {
      if (ethnicity.length === 5) {
        const expectedEthnicity = (faceapi.AgeGenderEthnicityNet.decodeEthnicityProbabilities(ethnicity)
          .find(p => p.probability === 1) || {}).ethnicity
        const bestEthnicityPred = pred.ethnicity.reduce((best, curr) => curr.probability > best.probability ? curr : best)
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
  console.log('genderPreds:', genderPreds / size)
  console.log('genderError:', genderError / size)
  if (db === 'utk') {
    console.log('ethnicityPreds:', ethnicityPreds / size)
    console.log('ethnicityPreds05:', ethnicityPreds05 / size)
  }

  return { ageError, size, genderPreds, genderError, ethnicityPreds, ethnicityPreds05 }
}