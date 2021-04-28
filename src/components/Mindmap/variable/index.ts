import * as d3 from '../d3'
import { TwoNumber } from '../interface'
import emitter from '@/mitt'
import { Ref, ref } from 'vue'
import { onZoomMove } from '../listener'
export * as ctm from './contextmenu'
export * as selection from './selection'

// 连线样式
type CurveStepLink = ({ source, target }: { source: TwoNumber, target: TwoNumber }) => string | null
type Link = d3.Link<unknown, d3.DefaultLinkObject, [number, number]> | CurveStepLink

const linkHorizontal = d3.linkHorizontal().source((d) => d.source).target((d) => d.target)
const curveStepLine = d3.line().curve(d3.curveStep)

export const curveStepLink: CurveStepLink = ({ source, target }) => curveStepLine([source, target])
export let sharpCorner = false
export let link: Link = linkHorizontal
emitter.on<boolean>('sharp-corner', (value) => {
  sharpCorner = !!value
  link = value ? curveStepLink : linkHorizontal
})

// 连线宽度
export let branch = 4
emitter.on<number>('branch', (value) => branch = value || branch)

// 缩放程度
export let scaleExtent: TwoNumber = [0.1, 8]
emitter.on<TwoNumber>('scale-extent', (value) => scaleExtent = value || scaleExtent)

// 可编辑指示
export let editFlag = false
emitter.on<boolean>('edit-flag', (val) => editFlag = !!val)

// 其他
export const rootTextRectRadius = 6
export const rootTextRectPadding = 10
export const addBtnRect = { side: 12, padding: 2 }
export const addBtnSide = addBtnRect.side + addBtnRect.padding * 2
export const expandBtnRect = { width: 16, height: 4, radius: 2 }
export const zoomTransform: Ref<d3.ZoomTransform> = ref(d3.zoomIdentity)
export const zoom = d3.zoom<SVGSVGElement, null>().on('zoom', onZoomMove).scaleExtent(scaleExtent)

// 节点边距与间隔
export let yGap = 18
export let xGap = 84
export let textRectPadding = Math.min(yGap / 2 - 1, rootTextRectPadding)
emitter.on<{ xGap: number, yGap: number}>('gap', (gap) => {
  if (!gap) { return }
  xGap = gap.xGap
  yGap = gap.yGap
  textRectPadding = Math.min(yGap / 2 - 1, rootTextRectPadding)
  textRectPadding = Math.min(xGap / 2 - 1, textRectPadding)
})

