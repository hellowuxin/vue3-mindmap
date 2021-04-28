import style from './css/Mindmap.module.scss'
import { selection, textRectPadding, zoomTransform } from './variable'
import * as d3 from './d3'
import { Mdata } from './interface'
import { moveNode, selectGNode } from './tool'
import { mmdata } from './data'
import { svgEle, gEle } from './variable/element'

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
      const rect = {
        x0: other.x - textRectPadding,
        x1: other.x + other.width + textRectPadding,
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
