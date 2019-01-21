export const splitArray = (arr: any[], idx: number, maxElems: number) => [arr.slice(0, idx), arr.slice(idx).slice(0, maxElems)]
