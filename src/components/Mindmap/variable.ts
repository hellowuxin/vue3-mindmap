import * as d3 from './d3'

export const link = d3.linkHorizontal().source((d) => d.source).target((d) => d.target)
export const rootTextRectRadius = 6
export const rootTextRectPadding = 10
export const addBtnRect = { side: 12, padding: 2 }
export const addBtnSide = addBtnRect.side + addBtnRect.padding * 2
export const branch = 4
