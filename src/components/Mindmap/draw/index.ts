import { TspanData, Mdata } from "@/components/Mindmap/interface"
import { d3 } from "@/components/Mindmap/tools"
import { attrTspan } from "../attribute"

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