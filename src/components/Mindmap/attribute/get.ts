import { Mdata, TspanData, TwoNumber } from "@/components/Mindmap/interface"
import { getMultiline } from "@/components/Mindmap/tools"
import style from '../Mindmap.module.scss'
import { addBtnSide, link } from "../variable"

export const getGClass = (d?: Mdata): string[] => {
  const arr = ['node']
  if (d) {
    arr.push(`depth-${d.depth}`)
    if (d.depth === 0) { arr.push(style.root) }
  }
  return arr
}
export const getGTransform = (d: Mdata): string => { return `translate(${d.dx + d.px},${d.dy + d.py})` }
export const getDataId = (d: Mdata): string => { return d.id }
export const getTspanData = (d: Mdata): TspanData[] => {
  const multiline = getMultiline(d.name)
  const height = d.height / multiline.length
  return multiline.map((name) => ({ name, height }))
}
export const getPath = (d: Mdata, branch: number, textRectPadding: number): string => {
  let dpw = 0
  let dph = 0
  if (d.parent) {
    dpw = d.parent.width
    dph = d.parent.height
    if (d.parent.depth === 0) {
      dpw /= 2
      dph /= 2
    }
  }
  const temp = branch / 2
  const source: TwoNumber = [-d.dx + dpw - d.px, -d.dy + dph + temp - d.py]
  const target: TwoNumber = [0, d.height + temp]
  const trp = Math.max(textRectPadding - 3, 0) // -3为了不超过选中框
  return `${link({ source, target })}L${d.width + trp},${target[1]}`
}
export const getAddBtnTransform = (d: Mdata, trp: number, branch: number): string => {
  const gap = 8
  const y = d.depth === 0 ? d.height / 2 : d.height + branch / 2
  return `translate(${d.width + trp + addBtnSide / 2 + gap},${y})`
}
