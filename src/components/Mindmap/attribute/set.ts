import { Mdata, SelectionG, SelectionRect, Transition, TspanData } from "../interface"
import * as d3 from '../d3'
import { addBtnRect, addBtnSide } from "../variable"
import { getAddBtnTransform, getDataId, getGClass, getGTransform, getPath } from "./get"
import style from '../css/Mindmap.module.scss'

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

export const attrTextRect = (rect: SelectionRect, padding: number, radius = 4): void => {
  rect.attr('x', -padding).attr('y', -padding).attr('rx', radius).attr('ry', radius)
    .attr('width', (d) => d.width + padding * 2).attr('height', (d) => d.height + padding * 2)
}

export const attrAddBtn = (g: SelectionG, trp: number, branch: number): void => {
  g.attr('class', style['add-btn']).attr('transform', (d) => getAddBtnTransform(d, trp, branch))
}

export const attrTrigger = (rect: SelectionRect, padding: number): void => {
  rect.attr('class', style.trigger)
    .attr('x', -padding)
    .attr('y', -padding)
    .attr('width', (d) => d.width + padding * 2 + 8 + addBtnSide)
    .attr('height', (d) => d.height + padding * 2)
}

export const attrPath = (
  p: d3.Selection<SVGPathElement, Mdata, SVGGElement, Mdata | null>,
  branch: number,
  textRectPadding: number,
  tran?: Transition
): void => {
  const temp1 = p.attr('stroke', (d) => d.color).attr('stroke-width', branch)
  const temp2 = tran ? temp1.transition(tran) : temp1
  temp2.attr('d', (d) => getPath(d, branch, textRectPadding))
}