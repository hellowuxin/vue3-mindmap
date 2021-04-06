import { Mdata, TspanData } from "@/interface"
import { getMultiline } from "@/tools"
import style from '../Mindmap.module.scss'

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
