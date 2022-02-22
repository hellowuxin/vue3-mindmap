import { TspanData, Mdata, SelectionG, IsMdata } from '@/components/Mindmap/interface'
import * as d3 from '../d3'
import { attrA, attrAddBtnRect, attrExpandBtnCircle, attrExpandBtnRect, attrG, attrPath, attrText, attrTspan, getSiblingGClass, getTspanData } from '../attribute'
import { getAddPath, makeTransition } from '../assistant'
import { addBtnRect, addNodeBtn, drag, mmprops, selection } from '../variable'
import { mmdata } from '../data'
import { addAndEdit, onClickExpandBtn, onEdit, onMouseEnter, onMouseLeave, onSelect } from '../listener'
import style from '../css'

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

export const appendAddBtn = (g: SelectionG): d3.Selection<SVGGElement, Mdata, SVGGElement, IsMdata> => {
  const gAddBtn = g.append('g')
  attrAddBtnRect(gAddBtn.append('rect'))
  gAddBtn.append('path').attr('d', getAddPath(2, addBtnRect.side))
  return gAddBtn
}

const appendAndBindAddBtn = (g: SelectionG) => {
  const gAddBtn = appendAddBtn(g)
  gAddBtn.on('click', addAndEdit)
  return gAddBtn
}

export const appendExpandBtn = (g: SelectionG): d3.Selection<SVGGElement, Mdata, SVGGElement, IsMdata> => {
  const expandBtn = g.append('g')
  attrExpandBtnRect(expandBtn.append('rect'))
  attrExpandBtnCircle(expandBtn.append('circle'), -4)
  attrExpandBtnCircle(expandBtn.append('circle'), 0)
  attrExpandBtnCircle(expandBtn.append('circle'), 4)
  return expandBtn
}

const bindEvent = (g: SelectionG, isRoot: boolean) => {
  const gExpandBtn = g.select(`:scope > g.${style.content} > g.${style['expand-btn']}`)
  gExpandBtn.on('click', onClickExpandBtn)
  if (mmprops.value.drag || mmprops.value.edit) {
    const gText = g.select<SVGGElement>(`:scope > g.${style.content} > g.${style.text}`)
    gText.on('mousedown', onSelect)
    if (mmprops.value.drag && !isRoot) { drag(gText) }
    if (mmprops.value.edit) { gText.on('click', onEdit) }
  }
  if (addNodeBtn.value) {
    g.select<SVGGElement>(`:scope > g.${style.content}`)
      .on('mouseenter', onMouseEnter)
      .on('mouseleave', onMouseLeave)
  }
}

const appendNode = (enter: d3.Selection<d3.EnterElement, Mdata, SVGGElement, IsMdata>) => {
  const isRoot = !enter.data()[0]?.depth
  const enterG = enter.append('g')
  attrG(enterG)
  // 绘制线
  attrPath(enterG.append('path'))
  // 节点容器
  const gContent = enterG.append('g').attr('class', style.content)
  const gTrigger = gContent.append('rect')
  // 绘制文本
  const gText = gContent.append('g').attr('class', style.text)
  const gTextRect = gText.append('rect')
  const text = gText.append('text')
  attrText(text)
  const tspan = text.selectAll('tspan').data(getTspanData).enter().append('tspan')
  attrTspan(tspan)
  // 绘制添加按钮
  let gAddBtn
  if (addNodeBtn.value) { gAddBtn = appendAndBindAddBtn(gContent) }
  // 绘制折叠按钮
  const gExpandBtn = appendExpandBtn(gContent)

  attrA(isRoot, gTrigger, gTextRect, gExpandBtn, gAddBtn)

  bindEvent(enterG, isRoot)

  enterG.each((d, i) => {
    if (!d.children) { return }
    draw(d.children, enterG.filter((a, b) => i === b))
  })
  gContent.raise()
  return enterG
}

const updateNode = (update: SelectionG) => {
  const isRoot = !update.data()[0]?.depth
  const tran = makeTransition(500, d3.easePolyOut)
  attrG(update, tran)
  attrPath(update.select<SVGPathElement>(':scope > path'), tran)
  const gContent = update.select<SVGGElement>(`:scope > g.${style.content}`)
  const gTrigger = gContent.select<SVGRectElement>(':scope > rect')
  const gText = gContent.select<SVGGElement>(`g.${style.text}`)
  const gTextRect = gText.select<SVGRectElement>('rect')
  const text = gText.select<SVGTextElement>('text')
  attrText(text, tran)
  text.selectAll<SVGTSpanElement, TspanData>('tspan')
    .data(getTspanData)
    .join(appendTspan, updateTspan, exit => exit.remove())
  let gAddBtn = gContent.select<SVGGElement>(`g.${style['add-btn']}`)
  const gExpandBtn = gContent.select<SVGGElement>(`g.${style['expand-btn']}`)
  if (addNodeBtn.value) {
    if (!gAddBtn.node()) { gAddBtn = appendAndBindAddBtn(gContent) }
  } else {
    gAddBtn.remove()
  }

  attrA(isRoot, gTrigger, gTextRect, gExpandBtn, gAddBtn)

  update.each((d, i) => {
    if (!d.children) { return }
    draw(d.children, update.filter((a, b) => i === b))
  })
  gContent.raise()
  return update
}

export const draw = (d = [mmdata.data], sele = selection.g as d3.Selection<SVGGElement, any, any, any>): void => {
  const temp = sele.selectAll<SVGGElement, Mdata>(`g.${getSiblingGClass(d[0]).join('.')}`)
  temp.data(d, (d) => d.gKey).join(appendNode, updateNode)
}