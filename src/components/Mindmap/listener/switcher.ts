import style from '../css'
import { Mdata } from '../interface'
import { onContextmenu, onEdit, onSelect } from './listener'
import { selection, zoom, drag } from '../variable'
import { foreignDivEle, wrapperEle } from '../variable/element'

export const switchZoom = (zoomable: boolean): void => {
  const { svg } = selection
  if (!svg) { return }
  if (zoomable) {
    zoom(svg)
    svg.on('dblclick.zoom', null)
  } else {
    svg.on('.zoom', null)
  }
}

export const switchEdit = (editable: boolean): void => {
  const { g } = selection
  if (!foreignDivEle.value || !g) { return }
  const gText = g.selectAll<SVGGElement, Mdata>(`g.${style.text}`)
  if (editable) {
    gText.on('click', onEdit)
  } else {
    gText.on('click', null)
  }
}

export const switchSelect = (selectable: boolean): void => {
  const { g } = selection
  if (!g) { return }
  const gText = g.selectAll<SVGGElement, Mdata>(`g.${style.text}`)
  if (selectable) {
    gText.on('mousedown', onSelect)
  } else {
    gText.on('mousedown', null)
  }
}

export const switchContextmenu = (val: boolean): void => {
  if (!wrapperEle.value) { return }
  if (val) {
    wrapperEle.value.addEventListener('contextmenu', onContextmenu)
  } else {
    wrapperEle.value.removeEventListener('contextmenu', onContextmenu)
  }
}

export const switchDrag = (draggable: boolean): void => {
  const { g } = selection
  if (!g) { return }
  const gText = g.selectAll<SVGGElement, Mdata>(`g.node:not(.${style.root}) > g > g.${style.text}`)
  if (draggable) {
    drag(gText)
  } else {
    gText.on('.drag', null)
  }
}