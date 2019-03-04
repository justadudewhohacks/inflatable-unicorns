import * as fs from 'fs';
import * as path from 'path';

import { cv, DATA_PATH } from '../.env';
import { augmentImage } from '../common/augmentImage';

const utkFiles = fs.readdirSync(path.join(DATA_PATH, 'utk-db/cropped-images'))
const wikiFiles = fs.readdirSync(path.join(DATA_PATH, 'wiki-db/cropped-images'))
const apparealFiles = fs.readdirSync(path.join(DATA_PATH, 'appareal-db/cropped-images'))

if (!fs.existsSync('./tmp/utk-db')) fs.mkdirSync('./tmp/utk-db')
if (!fs.existsSync('./tmp/wiki-db')) fs.mkdirSync('./tmp/wiki-db')
if (!fs.existsSync('./tmp/appareal-db')) fs.mkdirSync('./tmp/appareal-db')

const augmentationIdx = Array(10).fill(0).map((_, i) => i)

for (const idx of augmentationIdx) {
  let outDir = path.join('./tmp/utk-db', `${idx}`)
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)
  console.log(idx, 'utk-db')
  utkFiles.forEach(file => cv.imwrite(path.join(outDir, file), augmentImage('utk-db', file)))

  outDir = path.join('./tmp/wiki-db', `${idx}`)
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)
  console.log(idx, 'wiki-db')
  wikiFiles.forEach(file => cv.imwrite(path.join(outDir, file), augmentImage('wiki-db', file)))

  outDir = path.join('./tmp/appareal-db', `${idx}`)
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)
  console.log(idx, 'appareal-db')
  apparealFiles.forEach(file => cv.imwrite(path.join(outDir, file), augmentImage('appareal-db', file)))
}