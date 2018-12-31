import * as express from 'express';
import * as path from 'path';

const app = express()

const publicDir = path.join(__dirname, './public')

app.use(express.static(publicDir))
app.use(express.static(path.join(__dirname, '../node_modules/file-saver/dist')))

app.get('/', (req, res) => res.redirect('/quantize_model'))
app.get('/quantize_model', (req, res) => res.sendFile(path.join(publicDir, 'quantizeModel.html')))

app.listen(7000, () => console.log('Listening on port 7000!'))