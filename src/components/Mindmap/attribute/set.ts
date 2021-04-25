import { Mdata, SelectionCircle, SelectionG, SelectionRect, Transition, TspanData } from "../interface"
import * as d3 from '../d3'
import { addBtnRect, addBtnSide, branch, expandBtnRect, rootTextRectPadding, rootTextRectRadius, textRectPadding } from "../variable"
import { getAddBtnTransform, getDataId, getExpandBtnTransform, getGClass, getGTransform, getPath } from "./get"
import style from '../css/Mindmap.module.scss'

/**
 * 根据该节点是否是根节点，绘制不同的效果
 */
export const attrA = (
  isRoot: boolean, 
  gTrigger: SelectionRect, 
  gTextRect: SelectionRect, 
  gExpandBtn: SelectionG, 
  gAddBtn?: SelectionG
): void => {
  if (isRoot) {
      attrTrigger(gTrigger, rootTextRectPadding)
      attrTextRect(gTextRect, rootTextRectPadding, rootTextRectRadius)
      attrExpandBtn(gExpandBtn, rootTextRectPadding)
      if (gAddBtn) { attrAddBtn(gAddBtn, rootTextRectPadding) }
    } else {
      attrTrigger(gTrigger, textRectPadding)
      attrTextRect(gTextRect, textRectPadding)
      attrExpandBtn(gExpandBtn, textRectPadding)
      if (gAddBtn) { attrAddBtn(gAddBtn, textRectPadding) }
    }
}

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
  const { side, padding } = addBtnRect
  const radius = 4
  const temp0 = -padding - side / 2
  const temp1 = side + padding * 2
  rect.attr('x', temp0).attr('y', temp0).attr('rx', radius).attr('ry', radius).attr('width', temp1).attr('height', temp1)
}

export const attrExpandBtnRect = (rect: SelectionRect): void => {
  rect.attr('x', -expandBtnRect.width/2).attr('y', -expandBtnRect.height/2)
    .attr('width', expandBtnRect.width).attr('height', expandBtnRect.height)
    .attr('rx', expandBtnRect.radius).attr('ry', expandBtnRect.radius)
    .attr('stroke', (d) => d.color || 'grey')
    .attr('fill', (d) => d.color || 'grey')
}

export const attrExpandBtnCircle = (circle: SelectionCircle, cx: number): void => {
  circle.attr('cx', cx).attr('cy', 0).attr('r', 1)
}

export const attrTextRect = (rect: SelectionRect, padding: number, radius = 4): void => {
  rect.attr('x', -padding).attr('y', -padding)
    .attr('rx', radius).attr('ry', radius)
    .attr('width', (d) => d.width + padding * 2)
    .attr('height', (d) => d.height + padding * 2)
}

export const attrExpandBtn = (g: SelectionG, trp: number): void => {
  g.attr('class', style['expand-btn'])
    .attr('transform', (d) => getExpandBtnTransform(d, trp))
    .style('color', d => d.color)
}
 
export const attrAddBtn = (g: SelectionG, trp: number): void => {
  g.attr('class', style['add-btn']).attr('transform', (d) => getAddBtnTransform(d, trp))
    .style('visibility', (d) => d.collapse ? 'hidden' : 'visible')
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
  tran?: Transition
): void => {
  const temp1 = p.attr('stroke', (d) => d.color).attr('stroke-width', branch)
  const temp2 = tran ? temp1.transition(tran) : temp1
  temp2.attr('d', (d) => getPath(d))
}