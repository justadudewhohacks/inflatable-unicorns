import { splitArray } from '../../../common/common';
import { shuffleArray } from 'face-api.js';

export function splitData(files: string[], getLabelsForFile: (file: string) => any): [string[], string[]] {

  const cleanFiles = files
    .filter(file => getLabelsForFile(file).gender !== null)
    .filter(file => getLabelsForFile(file).age !== null)
    .filter(file => getLabelsForFile(file).age > 0)
    .filter(file => getLabelsForFile(file).age < 95)

  const filesByGender: string[][][] = [[], []]

  const ageStep = 5

  cleanFiles.forEach(file => {
    const { age, gender } = getLabelsForFile(file)
    const ageIdx = Math.floor(age / ageStep)
    filesByGender[gender][ageIdx] = filesByGender[gender][ageIdx] || []
    filesByGender[gender][ageIdx].push(file)
  })

  const trainAll: string[] = []
  const testAll: string[] = []

  filesByGender.forEach((genderArr, i) => {
    console.log(i === 0 ? 'female' : 'male:')
    console.log('')
    genderArr.forEach((ageArr, j) => {
      console.log('age range %s - %s:', j * 5, (j + 1) * 5, ageArr.length)
      const [train, test] = splitArray(shuffleArray(ageArr), 0.7 * ageArr.length, Infinity)
      train.forEach(t => trainAll.push(t))
      test.forEach(t => testAll.push(t))
    })
    console.log('')
  })

  return [trainAll, testAll]
}