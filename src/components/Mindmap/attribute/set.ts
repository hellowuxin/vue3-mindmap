import { IsMdata, Mdata, SelectionCircle, SelectionG, SelectionRect, Transition, TspanData } from '../interface'
import * as d3 from '../d3'
import { addBtnRect, addBtnSide, branch, changeSharpCorner, expandBtnRect, rootTextRectPadding, rootTextRectRadius, textRectPadding } from '../variable'
import { getAddBtnClass, getAddBtnTransform, getDataId, getExpandBtnTransform, getGClass, getGTransform, getPath } from './get'
import style from '../css'

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
  const g1 = g.attr('class', (d) => getGClass(d).join(' ')).attr('data-id', getDataId)
  const g2 = tran ? g1.transition(tran) : g1
  g2.attr('transform', getGTransform)
}

export const attrText = (text: d3.Selection<SVGTextElement, Mdata, SVGGElement, IsMdata>, tran?: Transition): void => {
  const t1 = tran ? text.transition(tran) : text
  t1.attr('transform', (d) => `translate(${d.left ? -d.width : 0},0)`)
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
  rect.attr('x', (d) => -padding - (d.left ? d.width : 0))
    .attr('y', -padding)
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
  g.attr('class', (d) => getAddBtnClass(d).join(' ')).attr('transform', (d) => getAddBtnTransform(d, trp))
}

export const attrTrigger = (rect: SelectionRect, padding: number): void => {
  const w = addBtnSide + addBtnRect.margin
  const p = padding * 2
  rect.attr('class', style.trigger)
    .attr('x', (d) => -padding - (d.left ? d.width + w : 0))
    .attr('y', -padding)
    .attr('width', (d) => d.width + p + w)
    .attr('height', (d) => d.height + p)
}

export const attrPath = (
  p: d3.Selection<SVGPathElement, Mdata, SVGGElement, IsMdata>,
  tran?: Transition
): void => {
  const p1 = p.attr('stroke', (d) => d.color).attr('stroke-width', branch)

  if (tran) {
    const p2 = p1.transition(tran)
    if (changeSharpCorner.value) { // 只有在改变sharpCorner的时候才应该调用
      p2.attrTween('d', pathTween)
    } else {
      p2.attr('d', getPath)
    }
  } else {
    p1.attr('d', getPath)
  }
}

function pathTween (data: Mdata, index: number, paths: ArrayLike<SVGPathElement>) {
  const precision = 10
  const d = getPath(data)
  const path0 = paths[index]
  const path1 = path0.cloneNode() as SVGPathElement
  const n0 = path0.getTotalLength()
  path1.setAttribute('d', d)
  const n1 = path1.getTotalLength()

  // Uniform sampling of distance based on specified precision.
  const distances = [0]
  const dt = precision / Math.max(n0, n1)
  let i = 0
  while ((i += dt) < 1) distances.push(i)
  distances.push(1)

  // Compute point-interpolators at each distance.
  const points = distances.map((t) => {
    const p0 = path0.getPointAtLength(t * n0)
    const p1 = path1.getPointAtLength(t * n1)
    return d3.interpolate([p0.x, p0.y], [p1.x, p1.y])
  })

  return (t: number) => {
    return t < 1 ? 'M' + points.map(p => p(t)).join('L') : d
  }
}