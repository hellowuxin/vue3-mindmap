import { Mdata, SelectionG, Transition, TspanData } from "@/interface"
import { d3 } from "@/tools"
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
