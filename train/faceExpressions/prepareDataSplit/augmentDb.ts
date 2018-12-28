import * as fs from 'fs';
import * as path from 'path';

import { cv, DATA_PATH } from '../.env';
import { getDbUri } from '../common/getDbUri';
import { loadJson } from './common';

const classesToFlip = [
  'disgusted',
  'fearful',
  'angry',
  'sad'
]

const dbExpressionsMap = loadJson('db_expressions.json', './tmp/')

const outputDir = path.resolve('./tmp/augmented')

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

classesToFlip.forEach(expr => {
  const outputExprDir = path.join(outputDir, expr)
  if (!fs.existsSync(outputExprDir)) fs.mkdirSync(outputExprDir)

  const files = dbExpressionsMap[expr] as string[]
  files.forEach(file => {
    const imgFile = path.join(DATA_PATH, getDbUri(file))
    console.log(imgFile)
    const img = cv.imread(imgFile)
    cv.imwrite(path.join(outputExprDir, file), img.flip(1))
  })
})