import style from '../css/Mindmap.module.scss'
import { ctm, editFlag, selection, textRectPadding, zoomTransform } from '../variable'
import * as d3 from '../d3'
import { Mdata } from '../interface'
import { getRelativePos, moveNode, selectGNode } from '../tool'
import { mmdata } from '../data'
import { svgEle, gEle, foreignDivEle, wrapperEle } from '../variable/element'
import emitter from '@/mitt'

/**
 * @param this - gContent
 */
export function onMouseEnter (this: SVGGElement): void {
  const temp = this.querySelector<HTMLElement>(`g.${style['add-btn']}`)
  if (temp) { temp.style.opacity = '1' }
}

/**
 * @param this - gContent
 */
export function onMouseLeave (this: SVGGElement): void {
  const temp = this.querySelector<HTMLElement>(`g.${style['add-btn']}`)
  if (temp) { temp.style.opacity = '0' }
}

export const onZoomMove = (e: d3.D3ZoomEvent<SVGSVGElement, null>): void => {
  const { g } = selection
  if (!g) { return }
  zoomTransform.value = e.transform
  g.attr('transform', e.transform.toString())
}

export const onSelect = (e: MouseEvent, d: Mdata): void => {
  e.stopPropagation()
  selectGNode(d)
}

/**
 * @param this - gText
 */
export function onDragMove (this: SVGGElement, e: d3.D3DragEvent<SVGGElement, Mdata, Mdata>, d: Mdata): void {
  const gNode = this.parentNode?.parentNode as SVGGElement
  if (svgEle.value) { svgEle.value.classList.add(style.dragging) }
  const { g } = selection
  if (!g) { return }
  moveNode(gNode, d, [e.x - d.x, e.y - d.y])
  // 鼠标相对gEle左上角的位置
  const mousePos = d3.pointer(e, gEle.value)
  mousePos[1] += mmdata.data.y

  const temp = g.selectAll<SVGGElement, Mdata>('g.node').filter((other) => {
    if (other !== d && other !== d.parent && !other.id.startsWith(d.id)) {
      let diffx0 = textRectPadding
      let diffx1 = other.width + textRectPadding
      if (other.left && other.depth !== 0) {
        [diffx0, diffx1] = [diffx1, diffx0]
      }
      const rect = {
        x0: other.x - diffx0,
        x1: other.x + diffx1,
        y0: other.y - textRectPadding,
        y1: other.y + other.height + textRectPadding
      }

      return mousePos[0] > rect.x0 && mousePos[1] > rect.y0 && mousePos[0] < rect.x1 && mousePos[1] < rect.y1
    }
    return false
  })
  const old = Array.from(document.getElementsByClassName(style.outline))
  const n = temp.node()
  old.forEach((o) => { if (o !== n) { o.classList.remove(style.outline) } })
  n?.classList.add(style.outline)
}

/**
 * @param this - gText
 */
export function onEdit (this: SVGGElement, e: MouseEvent, d: Mdata): void {
  const gNode = this.parentNode?.parentNode as SVGGElement
  const { foreign } = selection
  if (editFlag && foreign && foreignDivEle.value) {
    gNode.classList.add(style.edited)
    emitter.emit('edit-flag', false)
    foreign.attr('x', d.x - 2 - (d.left ? d.width : 0))
      .attr('y', d.y - mmdata.data.y - 2)
      .attr('data-id', d.id)
      .attr('data-name', d.name)
      .style('display', '')
    const div = foreignDivEle.value
    div.textContent = d.name
    div.focus()
    getSelection()?.selectAllChildren(div)
  }
}

export const onContextmenu = (e: MouseEvent): void => {
  e.preventDefault()
  if (!wrapperEle.value) { return }
  const relativePos = getRelativePos(wrapperEle.value, e)
  ctm.pos.value = relativePos
  const eventTargets = e.composedPath() as SVGElement[]
  const gNode = eventTargets.find((et) => et.classList?.contains('node')) as SVGGElement
  if (gNode) {
    const { classList } = gNode
    const collapseFlag = classList.contains(style['collapse'])
    if (!classList.contains(style.selected)) { selectGNode(gNode) }
    ctm.addItem.value.disabled = collapseFlag
    ctm.deleteItem.value.disabled = classList.contains(style.root)
    ctm.expandItem.value.disabled = !collapseFlag
    ctm.collapseItem.value.disabled = collapseFlag || classList.contains('leaf')
  }
  ctm.showViewMenu.value = gNode ? false : true
  emitter.emit('showContextmenu', true)
}