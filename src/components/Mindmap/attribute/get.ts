import { Mdata, TspanData, TwoNumber } from "@/components/Mindmap/interface"
import { getMultiline } from "../tool"
import style from '../css/Mindmap.module.scss'
import { addBtnSide, link, textRectPadding, sharpCorner, expandBtnRect } from "../variable"
const getYOffset = () => 3 // max-branch / 2

export const getSiblingGClass = (d?: Mdata): string[] => {
  const arr = ['node']
  if (d) { arr.push(`depth-${d.depth}`) }
  return arr
}
export const getGClass = (d?: Mdata): string[] => {
  const arr = getSiblingGClass(d)
  if (d) {
    if (d.depth === 0) { arr.push(style.root) }
    if (d.collapse) {
      arr.push(style['collapse'])
    } else if (!d.children || d.children.length === 0) {
      arr.push('leaf')
    }
  }
  return arr
}
export const getAddBtnClass = (d: Mdata): string[] => {
  const arr = [style['add-btn']]
  if (d.collapse) {
    arr.push(style['hidden'])
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
export const getPath = (d: Mdata): string => {
  let dpw = 0
  let dph = 0
  const trp = Math.max(textRectPadding - 3, 0) // -3为了不超过选中框
  const targetOffset = getYOffset()
  let sourceOffset = targetOffset
  if (d.parent) {
    dpw = d.parent.width
    dph = d.parent.height
    if (d.parent.depth === 0) {
      if (!sharpCorner) { dpw /= 2 }
      dph /= 2
      sourceOffset = 0
    }
  }
  const source: TwoNumber = [-d.dx + dpw - d.px, -d.dy + dph + sourceOffset - d.py]
  const target: TwoNumber = [0, d.height + targetOffset]
  return `${link({ source, target })}L${d.width + trp},${target[1]}`
}
export const getAddBtnTransform = (d: Mdata, trp: number): string => {
  const gap = 8
  const y = d.depth === 0 ? d.height / 2 : d.height + getYOffset()
  return `translate(${d.width + trp + addBtnSide / 2 + gap},${y})`
}
export const getExpandBtnTransform = (d: Mdata, trp: number): string => {
  const gap = 4
  const y = d.depth === 0 ? d.height / 2 : d.height + getYOffset()
  return `translate(${d.width + trp + expandBtnRect.width / 2 + gap},${y})`
}