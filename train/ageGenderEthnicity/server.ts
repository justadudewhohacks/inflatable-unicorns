import * as express from 'express';
import * as path from 'path';

import { cv, DATA_PATH } from './.env';
import { augmentImage } from './common/augmentImage';

const app = express()

const publicDir = path.join(__dirname, './public')

app.use(express.static(publicDir))
app.use(express.static(path.resolve(DATA_PATH)))
app.use(express.static(path.join(__dirname, '../js')))
app.use(express.static(path.join(__dirname, '../../node_modules/file-saver/dist')))

app.get('/', (_, res) => res.redirect('/train'))
app.get('/train', (_, res) => res.sendFile(path.join(publicDir, 'train.html')))
app.get('/test', (_, res) => res.sendFile(path.join(publicDir, 'test.html')))
app.get('/browse', (_, res) => res.sendFile(path.join(publicDir, 'browse.html')))
app.get('/augment', (_, res) => res.sendFile(path.join(publicDir, 'augment.html')))

app.get('/augment/:db/*/:fileName', (req, res) => {
  const db = req.params['db']
  const fileName = req.params['fileName']

  try {
    const augmentationResult = augmentImage(db, fileName)
    const enc = cv.imencode('.jpg', augmentationResult)
    res.set('Content-Type', 'image/jpeg')
    return res.status(200).send(enc)
  } catch (err) {
    return res.status(404).send(err)
  }
})

app.listen(8000, () => console.log('Listening on port 8000!'))