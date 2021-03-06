import * as fs from 'fs';
import * as path from 'path';

import { augmentjs, cv, DATA_PATH } from '../.env';

export function augmentImage(db: string, fileName: string) {
  const landmarksFileName = db === 'utk-db'
    ? fileName.replace('chip_0.jpg', 'chip_0.json')
    : (db === 'appareal-db'
      ? fileName.replace('face_0.jpg', 'face_0.json')
      : fileName.replace('.jpg', '.json')
    )

  const imgPath = path.resolve(DATA_PATH, db, 'cropped-images', fileName)
  const landmarksJsonPath = path.resolve(DATA_PATH, db, 'landmarks', landmarksFileName)
  if (!fs.existsSync(imgPath)) throw new Error(`image not found: ${imgPath}`)
  if (!fs.existsSync(landmarksJsonPath)) throw new Error(`landmarks json not found: ${landmarksJsonPath}`)

  const img = cv.imread(imgPath)
  const landmarks = JSON.parse(fs.readFileSync(landmarksJsonPath).toString()) as { x: number, y: number }[]

  const xCoords = landmarks.map(pt => pt.x)
  const yCoords = landmarks.map(pt => pt.y)
  const x0 = xCoords.reduce((x, min) => x < min ? x : min, img.cols)
  const y0 = yCoords.reduce((y, min) => y < min ? y : min, img.rows)
  const x1 = xCoords.reduce((x, max) => x < max ? max : x, 0)
  const y1 = yCoords.reduce((y, max) => y < max ? max : y, 0)

  const { random, augment } = augmentjs

  const config = {
    randomCrop: { x0, y0, x1, y1 },
    flip: random.bool(0.5),
    rotate: random.number(-20, 20),
    blur: { kernelSize:  random.option([3, 5, 7, 11]), stddev: random.number(0.8, 2.8) },
    intensity: { alpha: random.number(0.5, 1.5), beta: random.number(-20, 20) },
    toGray:  random.bool(0.2),
    resize: 112,
    toSquare: { centerContent: true }
  }

  return augment(img, config)
}