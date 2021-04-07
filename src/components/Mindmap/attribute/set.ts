import { Mdata, SelectionG, SelectionRect, Transition, TspanData } from "../interface"
import { d3 } from "@/components/Mindmap/tools"
import { addBtnRect } from "../variable"
import { getDataId, getGClass, getGTransform } from "./get"

export const attrG = (g: SelectionG, tran?: Transition): void => {
  const temp1 = g.attr('class', (d) => getGClass(d).join(' ')).attr('data-id', getDataId)
  const temp2 = tran ? temp1.transition(tran) : temp1
  temp2.attr('transform', getGTransform)
}

export const attrTspan = (tspan: d3.Selection<SVGTSpanElement, TspanData, SVGTextElement, Mdata>): void => {
  tspan.attr('alignment-baseline', 'text-before-edge')
    .text((d) => d.name || ' ')
    .attr('x', 0)
    .attr('dy', (d, i) => i ? d.height : 0)
}

export const attrAddBtnRect = (rect: SelectionRect): void => {
  const side = addBtnRect.side
  const padding = addBtnRect.padding
  const radius = 4
  const temp0 = -padding - side / 2
  const temp1 = side + padding * 2
  rect.attr('x', temp0).attr('y', temp0).attr('rx', radius).attr('ry', radius).attr('width', temp1).attr('height', temp1)
}
