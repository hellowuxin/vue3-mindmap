import { TspanData, Mdata, SelectionG } from '@/components/Mindmap/interface'
import * as d3 from '../d3'
import { attrAddBtnRect, attrExpandBtnCircle, attrExpandBtnRect, attrTspan } from '../attribute'
import { getAddPath } from '../tool'
import { addBtnRect } from '../variable'

export const appendTspan = (
  enter: d3.Selection<d3.EnterElement, TspanData, SVGTextElement, Mdata>
): d3.Selection<SVGTSpanElement, TspanData, SVGTextElement, Mdata> => {
  const tspan = enter.append('tspan')
  attrTspan(tspan)
  return tspan
}

export const updateTspan = (
  update: d3.Selection<SVGTSpanElement, TspanData, SVGTextElement, Mdata>
): d3.Selection<SVGTSpanElement, TspanData, SVGTextElement, Mdata> => {
  attrTspan(update)
  return update
}

export const appendAddBtn = (g: SelectionG): d3.Selection<SVGGElement, Mdata, SVGGElement, Mdata | null> => {
  const gAddBtn = g.append('g')
  attrAddBtnRect(gAddBtn.append('rect'))
  gAddBtn.append('path').attr('d', getAddPath(2, addBtnRect.side))
  return gAddBtn
}

export const appendExpandBtn = (g: SelectionG): d3.Selection<SVGGElement, Mdata, SVGGElement, Mdata | null> => {
  const expandBtn = g.append('g')
  attrExpandBtnRect(expandBtn.append('rect'))
  attrExpandBtnCircle(expandBtn.append('circle'), -4)
  attrExpandBtnCircle(expandBtn.append('circle'), 0)
  attrExpandBtnCircle(expandBtn.append('circle'), 4)
  return expandBtn
}