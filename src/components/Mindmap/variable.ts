import * as d3 from './d3'
import { Emitter } from './mitt'

export const link = d3.linkHorizontal().source((d) => d.source).target((d) => d.target)
export const rootTextRectRadius = 6
export const rootTextRectPadding = 10
export const addBtnRect = { side: 12, padding: 2 }
export const addBtnSide = addBtnRect.side + addBtnRect.padding * 2
export let branch = 4
export let yGap = 18
export let textRectPadding = Math.min(yGap / 2 - 1, rootTextRectPadding)

Emitter.on('branch', (value) => branch = value)
Emitter.on('y-gap', (value) => {
  yGap = value
  textRectPadding = Math.min(yGap / 2 - 1, rootTextRectPadding)
})


