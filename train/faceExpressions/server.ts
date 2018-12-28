import * as path from 'path';

import { DATA_PATH } from './.env';
import * as express from 'express';

const app = express()

const publicDir = path.join(__dirname, './public')

app.use(express.static(publicDir))
app.use(express.static(path.resolve(DATA_PATH)))
app.use(express.static(path.join(__dirname, '../js')))
app.use(express.static(path.join(__dirname, '../../node_modules/file-saver/dist')))

app.get('/', (_, res) => res.redirect('/train'))
app.get('/train', (_, res) => res.sendFile(path.join(publicDir, 'train.html')))
app.get('/test', (_, res) => res.sendFile(path.join(publicDir, 'test.html')))
app.get('/debug', (_, res) => res.sendFile(path.join(publicDir, 'debug.html')))
app.get('/browse', (_, res) => res.sendFile(path.join(publicDir, 'browse.html')))

app.listen(8000, () => console.log('Listening on port 8000!'))