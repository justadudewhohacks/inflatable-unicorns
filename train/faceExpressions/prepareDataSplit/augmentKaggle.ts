import * as fs from 'fs';
import * as path from 'path';

import { cv, DATA_PATH } from '../.env';
import { emotionMapFromFileStructure } from './common';

const classesToFlip = [
  'disgusted',
  'fearful',
  'angry',
  'sad'
]

const inputDir = path.resolve(DATA_PATH, 'kaggle-face-expressions-db/kaggle-face-expressions-db-cleaned')
const kaggleExpressionsMap = emotionMapFromFileStructure(inputDir)
const outputDir = path.resolve('./tmp/augmented')

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

classesToFlip.forEach(expr => {
  const outputExprDir = path.join(outputDir, expr)
  if (!fs.existsSync(outputExprDir)) fs.mkdirSync(outputExprDir)

  const files = kaggleExpressionsMap[expr] as string[]
  files.forEach(file => {
    const img = cv.imread(path.join(inputDir, expr, file))
    cv.imwrite(path.join(outputExprDir, file), img.flip(1))
  })
})