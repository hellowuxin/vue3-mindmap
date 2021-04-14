import * as d3 from './d3'
import { TwoNumber } from './interface'
import { Emitter } from './mitt'

type CurveStepLink = ({ source, target }: { source: TwoNumber, target: TwoNumber }) => string | null
type Link = d3.Link<any, d3.DefaultLinkObject, [number, number]> | CurveStepLink

const linkHorizontal = d3.linkHorizontal().source((d) => d.source).target((d) => d.target)
const curveStepLine = d3.line().curve(d3.curveStep)
export let link: Link = linkHorizontal
export const curveStepLink: CurveStepLink = ({ source, target }) => curveStepLine([source, target])
export const rootTextRectRadius = 6
export const rootTextRectPadding = 10
export const addBtnRect = { side: 12, padding: 2 }
export const addBtnSide = addBtnRect.side + addBtnRect.padding * 2
export let branch = 4
export let yGap = 18
export let textRectPadding = Math.min(yGap / 2 - 1, rootTextRectPadding)
export let sharpCorner = false
export const contextmenuItems = [
  { title: '删除节点', name: 'delete', disabled: false },
  { title: '折叠节点', name: 'collapse', disabled: false },
  { title: '展开节点', name: 'expand', disabled: false },
]

Emitter.on('branch', (value) => branch = value)
Emitter.on('sharp-corner', (value) => {
  sharpCorner = value
  if (value) {
    link = curveStepLink
  } else {
    link = linkHorizontal
  }
})
Emitter.on('gap', (value: TwoNumber) => {
  const xGap = value[0]
  yGap = value[1]
  textRectPadding = Math.min(yGap / 2 - 1, rootTextRectPadding)
  textRectPadding = Math.min(xGap / 2 - 1, textRectPadding)
})


