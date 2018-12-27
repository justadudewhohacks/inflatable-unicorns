import * as fs from 'fs';
import * as path from 'path';

export const EXPRESSIONS = ['disgusted', 'fearful', 'surprised', 'sad', 'angry', 'happy', 'neutral']

export function emotionMapFromFileStructure(baseDir: string) {
  const expressionsMap = {}
  EXPRESSIONS.forEach(expr => {
    const exprDir = path.resolve(baseDir, expr)
    if (!fs.existsSync(exprDir)) return
    expressionsMap[expr] = fs.readdirSync(exprDir)
  })

  return expressionsMap
}

export function loadJson (filePath: string, basePath: string) {
  return JSON.parse(fs.readFileSync(path.resolve(basePath, filePath)).toString())
}