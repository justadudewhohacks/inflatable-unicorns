import { shuffleArray } from 'face-api.js';
import * as fs from 'fs';
import * as path from 'path';

import { splitArray } from '../../../common/common';
import { DATA_PATH } from '../../faceExpressions/.env';
import { splitData } from './splitData';

// UTK

const utkFiles = fs.readdirSync(path.join(DATA_PATH, 'utk-db/cropped-images'))

const utkFilesByVec = {}

utkFiles.forEach(filename => {
  const [age, gender, ethnicity] = filename.split('_')
  const vec = `${age}_${gender}_${ethnicity}`
  utkFilesByVec[vec] = utkFilesByVec[vec] || []
  utkFilesByVec[vec].push(filename)
})

const utkTrain: any[] = []
const utkTest: any[] = []

Object.keys(utkFilesByVec).forEach(vec => {
  const [train, test] = splitArray(shuffleArray(utkFilesByVec[vec]), 0.7 * utkFilesByVec[vec].length, Infinity)
  train.forEach(t => utkTrain.push(t))
  test.forEach(t => utkTest.push(t))
})

console.log('')
console.log('utk:')
console.log('')
console.log('train:', utkTrain.length)
console.log('test:', utkTest.length)
console.log('')

// wiki

const wikiFiles = fs.readdirSync(path.join(DATA_PATH, 'wiki-db/cropped-images'))
const wikiLabels = JSON.parse(fs.readFileSync(path.join(DATA_PATH, 'wiki-db/labels.json')).toString())

console.log('')
console.log('wiki:')
console.log('')

const [wikiTrain, wikiTest] = splitData(wikiFiles, (file: string) => wikiLabels[file.replace('_0.jpg', '.jpg')])

console.log('train:', wikiTrain.length)
console.log('test:', wikiTest.length)
console.log('')

// imdb

const imdbFiles = fs.readdirSync(path.join(DATA_PATH, 'imdb/cropped-images'))
const imdbLabels = JSON.parse(fs.readFileSync(path.join(DATA_PATH, 'imdb/labels.json')).toString())

console.log('')
console.log('imdb:')
console.log('')

const [imdbTrain, imdbTest] = splitData(imdbFiles, (file: string) => imdbLabels[file.replace('_0.jpg', '.jpg')])

console.log('train:', imdbTrain.length)
console.log('test:', imdbTest.length)
console.log('')

// appareal

const apparealFiles = fs.readdirSync(path.join(DATA_PATH, 'appareal-db/cropped-images'))
const apparealLabels = JSON.parse(fs.readFileSync(path.join(DATA_PATH, 'appareal-db/labels.json')).toString())

console.log('')
console.log('appareal:')
console.log('')

const [apparealTrain, apparealTest] = splitData(apparealFiles, (file: string) => apparealLabels[file])

console.log('train:', apparealTrain.length)
console.log('test:', apparealTest.length)
console.log('')

const trainData = utkTrain.map(file => ({ db: 'utk', file }))
  .concat(wikiTrain.map(file => ({ db: 'wiki', file })))
  .concat(imdbTrain.map(file => ({ db: 'imdb', file })))
  .concat(apparealTrain.map(file => ({ db: 'appareal', file })))
const testData = utkTest.map(file => ({ db: 'utk', file }))
  .concat(wikiTest.map(file => ({ db: 'wiki', file })))
  .concat(imdbTest.map(file => ({ db: 'imdb', file })))
  .concat(apparealTest.map(file => ({ db: 'appareal', file })))

console.log('')
console.log('total:')
console.log('')
console.log('train:', trainData.length)
console.log('test:', testData.length)
console.log('')

fs.writeFileSync('trainData.json', JSON.stringify(trainData))
fs.writeFileSync('testData.json', JSON.stringify(testData))