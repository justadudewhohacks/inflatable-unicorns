import { shuffleArray } from 'face-api.js';
import * as fs from 'fs';
import * as path from 'path';

import { DATA_PATH } from './.env';
import { emotionMapFromFileStructure, EXPRESSIONS, loadJson } from './common';

const splitArray = (arr: any[], idx: number, maxElems: number) => [arr.slice(0, idx), arr.slice(idx).slice(0, maxElems)]

const withDb = (db: string) => (obj: any) => ({ ...obj, db })

function createExpressionDataExtractor(expression: string) {
  return function prepareExpressionData(
    expressionsMap: any,
    db: string,
    filterFunction: (file: string) => boolean = () => true
  ) {
    return shuffleArray(
      ((expressionsMap[expression] || []) as string[])
        .filter(filterFunction)
        .map(img => withDb(db)({ img }))
    )
  }
}

const jaffeExpressionsMap = loadJson('jaffe-db/expressions.json', DATA_PATH)
const kdefExpressionsMap = loadJson('kdef-db/expressions.json', DATA_PATH)
const ckplusExpressionsMap = loadJson('ckplus-db/expressions.json', DATA_PATH)
const actorsSpeechStrongExpressionsMap = loadJson('actors-db/speech/expressionsStrong.json', DATA_PATH)
const actorsSpeechNormalExpressionsMap = loadJson('actors-db/speech/expressionsNormal.json', DATA_PATH)

const dbExpressionsMap = loadJson('db_expressions.json', './tmp/')
const imfdbExpressionsMap = loadJson('imfdb_expressions.json', './tmp/')

const dbVectorData = loadJson('db_expression_vectors.json', './tmp/')
const imfdbVectorData = loadJson('imfdb_expression_vectors.json', './tmp/')


const kaggleExpressionsMap = emotionMapFromFileStructure(
  path.resolve(DATA_PATH, 'kaggle-face-expressions-db/kaggle-face-expressions-db-cleaned')
)

const dbAugmentedExpressionsMap = emotionMapFromFileStructure(
  path.resolve(DATA_PATH, 'augmented/db')
)
const kaggleAugmentedExpressionsMap = emotionMapFromFileStructure(
  path.resolve(DATA_PATH, 'augmented/kaggle')
)

const trainData = {}
const testData = {}

EXPRESSIONS.forEach(expression => {
  const extractData = createExpressionDataExtractor(expression)
  const isFramePos60 = (file: string) => file.endsWith('_60_0.jpg')

  const kaggleImages = extractData(kaggleExpressionsMap, 'kaggle')
  const jaffeImages = extractData(jaffeExpressionsMap, 'jaffe')
  const kdefImages = extractData(kdefExpressionsMap, 'kdef')
  const ckplusImages = extractData(ckplusExpressionsMap, 'ckplus')
  const actorsSpeechStrongImages = extractData(actorsSpeechStrongExpressionsMap, 'actors-speech', isFramePos60)
  const actorsSpeechNormalImages = extractData(actorsSpeechNormalExpressionsMap, 'actors-speech', isFramePos60)

  const dbImages = extractData(dbExpressionsMap, 'db')
  const imfdbImages = extractData(imfdbExpressionsMap, 'imfdb')

  let numKaggle = 0.7 * kaggleImages.length
  const numJaffe = 0.7 * jaffeImages.length
  const numKdef = 1.0 * kdefImages.length
  const numCkplus = 0.7 * ckplusImages.length
  const numActorsSpeechStrong = 0.7 * actorsSpeechStrongImages.length
  let numActorsSpeechNormal = 0

  let numDb = 0.7 * dbImages.length
  let numImfdb = 0.7 * imfdbImages.length

  if (expression === 'happy') {
    numDb = 1000
    numKaggle = 1000
  }
  if (expression === 'neutral') {
    numDb = 1000
    numImfdb = 1000
    numActorsSpeechNormal = 0.7 * actorsSpeechNormalImages.length
  }

  const MAX_TEST_IMGS = 1000

  const [kaggleTrain, kaggleTest] = splitArray(kaggleImages, numKaggle, MAX_TEST_IMGS)
  const [jaffeTrain, jaffeTest] = splitArray(jaffeImages, numJaffe, MAX_TEST_IMGS)
  const [kdefTrain, kdefTest] = splitArray(kdefImages, numKdef, MAX_TEST_IMGS)
  const [ckplusTrain, ckplusTest] = splitArray(ckplusImages, numCkplus, MAX_TEST_IMGS)
  const [actorsSpeechNormalTrain, actorsSpeechNormalTest] = splitArray(actorsSpeechNormalImages, numActorsSpeechNormal, MAX_TEST_IMGS)
  const [actorsSpeechStrongTrain, actorsSpeechStrongTest] = splitArray(actorsSpeechStrongImages, numActorsSpeechStrong, MAX_TEST_IMGS)

  const [dbTrain, dbTest] = splitArray(dbImages, numDb, MAX_TEST_IMGS)
  const [imfdbTrain, imfdbTest] = splitArray(imfdbImages, numImfdb, MAX_TEST_IMGS)


  // augmented data

  const excludeAugmentedTestData = (augmentedData: any[], testData: any[]) => {
    const testDataSet = new Set<string>(testData.map(d => d.img))
    return augmentedData.filter(d => !testDataSet.has(d.img))
  }

  const dbAugmentedImages = excludeAugmentedTestData(
    extractData(dbAugmentedExpressionsMap, 'db-augmented'),
    dbTest
  )
  const kaggleAugmentedImages = excludeAugmentedTestData(
    extractData(kaggleAugmentedExpressionsMap, 'kaggle-augmented'),
    kaggleTest
  )

  const numDbAugmented = 1.0 * dbAugmentedImages.length
  const numKaggleAugmented = 1.0 * kaggleAugmentedImages.length

  const [dbAugmentedTrain, dbAugmentedTest] = splitArray(dbAugmentedImages, numDbAugmented, MAX_TEST_IMGS)
  const [kaggleAugmentedTrain, kaggleAugmentedTest] = splitArray(kaggleAugmentedImages, numKaggleAugmented, MAX_TEST_IMGS)



  console.log()
  console.log('%s:', expression)
  console.log('#train | #test')
  console.log('kaggle: %s | %s', kaggleTrain.length, kaggleTest.length)
  console.log('jaffe: %s | %s', jaffeTrain.length, jaffeTest.length)
  console.log('kdef: %s | %s', kdefTrain.length, kdefTest.length)
  console.log('ckplus: %s | %s', ckplusTrain.length, ckplusTest.length)
  console.log('actorsSpeechNormal: %s | %s', actorsSpeechNormalTrain.length, actorsSpeechNormalTest.length)
  console.log('actorsSpeechStrong: %s | %s', actorsSpeechStrongTrain.length, actorsSpeechStrongTest.length)
  console.log('db: %s | %s', dbTrain.length, dbTest.length)
  console.log('imfdb: %s | %s', imfdbTrain.length, imfdbTest.length)
  console.log('db augmented: %s | %s', dbAugmentedTrain.length, dbAugmentedTest.length)
  console.log('kaggle augmented: %s | %s', kaggleAugmentedTrain.length, kaggleAugmentedTest.length)

  trainData[expression] = dbTrain
    .concat(kaggleTrain)
    .concat(jaffeTrain)
    .concat(kdefTrain)
    .concat(ckplusTrain)
    .concat(actorsSpeechNormalTrain)
    .concat(actorsSpeechStrongTrain)
    .concat(imfdbTrain)
    .concat(dbAugmentedTrain)
    .concat(kaggleAugmentedTrain)
  testData[expression] = dbTest
    .concat(kaggleTest)
    .concat(jaffeTest)
    .concat(kdefTest)
    .concat(ckplusTest)
    .concat(actorsSpeechNormalTest)
    .concat(actorsSpeechStrongTest)
    .concat(imfdbTest)
    .concat(dbAugmentedTest)
    .concat(kaggleAugmentedTest)
})

EXPRESSIONS.forEach(expression => {
  console.log()
  console.log('%s:', expression)
  console.log('train: %s', trainData[expression].length)
  console.log('test: %s', testData[expression].length)
})

const vectorData = dbVectorData.map(withDb('db'))
  .concat(imfdbVectorData.map(withDb('imfdb')))

console.log()
console.log('vector data:', vectorData.length)
console.log()
console.log('db:', dbVectorData.length)
console.log('imfdb:', imfdbVectorData.length)

const summary = EXPRESSIONS.reduce((acc, expr) => {
  const numTrain = trainData[expr].length
  const numTest = testData[expr].length
  return {
    summaryTrain: acc.summaryTrain + `${expr}: ${numTrain}\n`,
    summaryTest: acc.summaryTest + `${expr}: ${numTest}\n`,
    numTrain: acc.numTrain + numTrain,
    numTest: acc.numTest + numTest
  }
}, { summaryTrain: '', summaryTest: '', numTrain: 0, numTest: 0 })


console.log()
console.log('train: %s', summary.numTrain)
console.log()
console.log(summary.summaryTrain)
console.log()
console.log('test: %s', summary.numTest)
console.log()
console.log(summary.summaryTest)

trainData['vectorData'] = vectorData
fs.writeFileSync('trainData.json', JSON.stringify(trainData))
fs.writeFileSync('testData.json', JSON.stringify(testData))


