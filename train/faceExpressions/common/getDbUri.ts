export function getDbUri(fileName: string) {
    const id = parseInt(fileName.replace('.jpg', ''))
    const dirNr = Math.floor(id / 5000)
    return `face-classification/cropped-faces/jpgs${dirNr + 1}/${fileName}`
}