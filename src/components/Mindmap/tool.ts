import emitter from '@/mitt'
import html2canvas from 'html2canvas'
import { getDataId, getGTransform, getPath } from './attribute'
import * as d3 from './d3'
import style from './css/Mindmap.module.scss'
import { Mdata, TwoNumber } from './interface'
import { selection } from './variable'

/**
 * 使页面重排
 * @param ele - Element
 */
export const reflow = (ele: Element): number => ele.clientHeight

/**
 * 获取一个加号图形的path路径，图形的中心坐标为（0，0）
 * @param stroke - 线条的粗细
 * @param side - 图形的边长
 */
export const getAddPath = (stroke: number, side: number): string => {
  const temp0 = -side / 2
  const temp1 = -stroke / 2
  const temp2 = stroke / 2
  const temp3 = side / 2
  return `M${temp3},${temp2}H${temp2}V${temp3}H${temp1}V${temp2}H${temp0}V${temp1}H${temp1}V${temp0}H${temp2}V${temp1}H${temp3}V${temp2}Z`
}

/**
 * 将一个字符串按换行符切分，返回字符串数组
 * @param str - 字符串
 */
export const getMultiline = (str: string): string[] => {
  const multiline = str.split('\n')
  if (multiline.length > 2 && multiline[multiline.length - 1] === '') {
    multiline.pop()
  }
  return multiline
}

export const convertToImg = (svgdiv: HTMLDivElement, name: string): void => {
  html2canvas(svgdiv).then((canvas) => {
    const dataUrl = canvas.toDataURL()
    const window = open()
    if (window) {
      window.document.write(`<img src='${dataUrl}'>`)
      window.document.title = name
      window.document.close()
    }
  })
}

export const makeTransition = (
  dura: number, easingFn: (normalizedTime: number) => number
): d3.Transition<any, Mdata, null, undefined> => {
  return d3.transition<Mdata>().duration(dura).ease(easingFn) as d3.Transition<any, Mdata, null, undefined>
}

export const getRelativePos = (wrapper: HTMLElement, e: MouseEvent): { left: number, top: number } => {
  const { pageX, pageY } = e
  const wrapperPos = wrapper.getBoundingClientRect()
  const wrapperLeft = wrapperPos.left + window.pageXOffset
  const wrapperTop = wrapperPos.top + window.pageYOffset

  return {
    left: pageX - wrapperLeft,
    top: pageY - wrapperTop
  }
}

/**
 * @param this - gText
 */
export function getDragContainer (this: SVGGElement): SVGGElement {
  return this.parentNode?.parentNode?.parentNode as SVGGElement
}

export function selectGNode (d: SVGGElement): void
export function selectGNode (d: Mdata): void
export function selectGNode (d: SVGGElement | Mdata): void {
  const ele = d instanceof SVGGElement ? d : document.querySelector<SVGGElement>(`g[data-id='${getDataId(d)}']`)
  const oldSele = document.getElementsByClassName(style.selected)[0]
  if (ele) {
    if (oldSele) {
      if (oldSele !== ele) {
        oldSele.classList.remove(style.selected)
        ele.classList.add(style.selected)
      } else {
        emitter.emit('edit-flag', true)
      }
    } else {
      ele.classList.add(style.selected)
    }
  } else {
    throw new Error(`g[data-id='${getDataId(d as Mdata)}'] is null`)
  }
}

/**
 * 获取文本在tspan中的宽度与高度
 * @param text -
 * @returns -
 */
export const getSize = (text: string): { width: number, height: number } => {
  const { asstSvg } = selection
  if (!asstSvg) { throw new Error('asstSvg undefined') }
  const multiline = getMultiline(text)
  const t = asstSvg.append('text')
  t.selectAll('tspan').data(multiline).enter().append('tspan').text((d) => d).attr('x', 0)
  const tBox = (t.node() as SVGTextElement).getBBox()
  t.remove()
  return {
    width: Math.max(tBox.width, 22),
    height: Math.max(tBox.height, 22) * multiline.length
  }
}

export const moveNode = (node: SVGGElement, d: Mdata, p: TwoNumber, dura = 0): void => {
  const tran = makeTransition(dura, d3.easePolyOut)
  d.px = p[0]
  d.py = p[1]
  d3.select<SVGGElement, Mdata>(node).transition(tran).attr('transform', getGTransform)
  d3.select<SVGPathElement, Mdata>(`g[data-id='${getDataId(d)}'] > path`)
    .transition(tran)
    .attr('d', (d) => getPath(d))
}
