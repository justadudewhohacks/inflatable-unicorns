import * as fs from 'fs';
import * as path from 'path';

import { DATA_PATH } from '../.env';

const CONTEMPT = 'contempt'

const EXPRESSION_NAME_MAP = {
  happiness: 'happy',
  neutral: 'neutral',
  sadness: 'sad',
  surprise: 'surprised',
  anger: 'angry',
  disgust: 'disgusted',
  fear: 'fearful'
}

const baseDir = path.resolve(DATA_PATH, 'face-classification')
const outName = 'face-classification'

const THRESH = 0.5
const THRESH_NEUTRAL_HAPPY = 0.9

const jsonsDir = path.resolve(baseDir, './azure-classification')
const jsonFiles = fs.readdirSync(jsonsDir)

const vectorData: any[] = []
const classificationData = {}

jsonFiles.forEach(jsonFile => {
  const rects = JSON.parse(fs.readFileSync(path.join(jsonsDir, jsonFile)).toString()) as any[]

  if (!rects.length) {
    return
  }

  const area = (rect: any) => {
    const { width, height } = rect.faceRectangle
    return width * height
  }
  const rect = rects.reduce((r1, r2) => area(r1) < area(r2) ? r2 : r1, { faceRectangle: { width: 0, height: 0 } })

  const expressions = Object.keys(rect.faceAttributes.emotion)
    .filter(expression => expression !== CONTEMPT)
    .map(expression => ({ expression, prob: rect.faceAttributes.emotion[expression] }))

  const classificationResult = expressions.find(({ prob }) => prob > THRESH)

  const img = jsonFile.replace('.json', '.jpg')

  if (classificationResult) {
    const actualLabel = EXPRESSION_NAME_MAP[classificationResult.expression]

    if ((actualLabel === 'neutral' || actualLabel === 'happy') && classificationResult.prob < THRESH_NEUTRAL_HAPPY) {
      return
    }

    classificationData[actualLabel] = classificationData[actualLabel] || []
    classificationData[actualLabel].push(img)
    return
  }

  const sum = expressions.reduce((res, { prob }) => res + prob, 0)

  const vector = expressions.map(({ expression, prob }) => {
    const actualLabel = EXPRESSION_NAME_MAP[expression]
    return {
      expression: actualLabel,
      prob: prob / sum
    }
  })

  vectorData.push({ img, vector })
})

Object.keys(classificationData).forEach(expr => {
  console.log(expr, classificationData[expr].length)
})
console.log('vectorData:', vectorData.length)

fs.writeFileSync(outName + '_expressions.json', JSON.stringify(classificationData))
fs.writeFileSync(outName + '_expression_vectors.json', JSON.stringify(vectorData))