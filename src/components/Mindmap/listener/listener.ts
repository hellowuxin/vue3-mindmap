import style from '../css'
import { ctm, editFlag, selection, textRectPadding, zoomTransform } from '../variable'
import * as d3 from '../d3'
import { Mdata, MenuEvent } from '../interface'
import { fitView, getRelativePos, moveNode, scaleView, selectGNode } from '../assistant'
import { add, collapse, del, expand, mmdata, moveChild, moveSibling, rename } from '../data'
import { svgEle, gEle, foreignDivEle, wrapperEle, foreignEle } from '../variable/element'
import emitter from '@/mitt'
import { getDataId, getSiblingGClass } from '../attribute'

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

export const onEditBlur = (): void => {
  document.getElementsByClassName(style.edited)[0]?.classList.remove(style.edited, style.selected)

  if (foreignEle.value && foreignDivEle.value) {
    foreignEle.value.style.display = 'none'
    const id = foreignEle.value.getAttribute('data-id')
    const oldname = foreignEle.value.getAttribute('data-name')
    const name = foreignDivEle.value.textContent
    if (id && name !== null && name !== oldname) {
      rename(id, name)
    }
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

export const onClickMenu = (name: MenuEvent): void => {
  if (name === 'zoomfit') {
    fitView()
  } else if (name === 'zoomin') {
    scaleView(true)
  } else if (name === 'zoomout') {
    scaleView(false)
  } else if (name === 'add') {
    const sele = d3.select<SVGGElement, Mdata>(`.${style.selected}`)
    const seleData = sele.data()[0]
    addAndEdit(new MouseEvent('click'), seleData)
  } else if (name === 'delete') {
    const sele = d3.select<SVGGElement, Mdata>(`.${style.selected}`)
    const seleData = sele.data()[0]
    del(seleData.id)
  } else if (name === 'collapse') {
    const sele = d3.select<SVGGElement, Mdata>(`.${style.selected}`)
    const seleData = sele.data()[0]
    collapse(seleData.id)
  } else if (name === 'expand') {
    const sele = d3.select<SVGGElement, Mdata>(`.${style.selected}`)
    const seleData = sele.data()[0]
    expand(seleData.id)
  }
}

/**
 * 添加子节点并进入编辑模式
 */
export const addAndEdit = (e: MouseEvent, d: Mdata): void => {
  const child = add(d.id, '')
  const { g } = selection
  if (!g || !child) { return }
  const gText = g.selectAll<SVGGElement, Mdata>(`g[data-id='${getDataId(child)}'] g.${style.text}`)
  const node = gText.node()

  if (node) {
    emitter.emit('edit-flag', true)
    onEdit.call(node, e, child)
  }
}

export const onClickExpandBtn = (e: MouseEvent, d: Mdata): void => {
  expand(d.id)
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
export function onDragEnd (this: SVGGElement, e: d3.D3DragEvent<SVGGElement, Mdata, Mdata>, d: Mdata): void {
  const gNode = this.parentNode?.parentNode as SVGGElement
  if (svgEle.value) { svgEle.value.classList.remove(style.dragging) }
  // 判断是否找到了新的父节点
  const np = document.getElementsByClassName(style.outline)[0]
  if (np) {
    np.classList.remove(style.outline)
    const pid = np.getAttribute('data-id')
    if (pid) {
      d.px = 0
      d.py = 0
      moveChild(pid, d.id)
    } else {
      throw new Error('outline data-id null')
    }
    return
  }
  // 判断是否变换left
  const xToCenter = d.x - mmdata.getRootWidth() / 2
  const lr = d.depth === 1 && (xToCenter * (xToCenter + d.px) < 0)
  const getSameSide = lr ? (a: Mdata) => a.left !== d.left : (a: Mdata) => a.left === d.left
  // 判断是否需要调换节点顺序
  const p = gNode.parentNode as SVGGElement
  let downD = lr ? { y: Infinity, id: d.id } : d
  let upD = lr ? { y: -Infinity, id: d.id } : d
  const brothers = d3.select<SVGGElement, Mdata>(p)
    .selectAll<SVGGElement, Mdata>(`g.${getSiblingGClass(d).join('.')}`)
    .filter((a) => a !== d && getSameSide(a))
  const endY = d.y + d.py
  brothers.each((b) => {
    if ((lr || b.y > d.y) && b.y < endY && b.y > upD.y) { upD = b } // 找新哥哥节点
    if ((lr || b.y < d.y) && b.y > endY && b.y < downD.y) { downD = b } // 找新弟弟节点
  })
  if (downD.id !== d.id) {
    d.px = 0
    d.py = 0
    moveSibling(d.id, downD.id)
    return
  } else if (upD.id !== d.id) {
    d.px = 0
    d.py = 0
    moveSibling(d.id, upD.id, 1)
    return
  }
  // 复原
  moveNode(gNode, d, [0, 0], 500)
}