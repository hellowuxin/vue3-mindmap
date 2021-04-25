import * as d3 from './d3'
import { MenuItem, TwoNumber } from './interface'
import emitter from '@/mitt'
import produce from 'immer'
import { ref } from '@vue/reactivity'

type CurveStepLink = ({ source, target }: { source: TwoNumber, target: TwoNumber }) => string | null
type Link = d3.Link<unknown, d3.DefaultLinkObject, [number, number]> | CurveStepLink

const linkHorizontal = d3.linkHorizontal().source((d) => d.source).target((d) => d.target)
const curveStepLine = d3.line().curve(d3.curveStep)

export let link: Link = linkHorizontal
export const curveStepLink: CurveStepLink = ({ source, target }) => curveStepLine([source, target])
export const rootTextRectRadius = 6
export const rootTextRectPadding = 10
export const addBtnRect = { side: 12, padding: 2 }
export const addBtnSide = addBtnRect.side + addBtnRect.padding * 2
export const expandBtnRect = { width: 16, height: 4, radius: 2 }
export let branch = 4
export let yGap = 18
export const xGap = 50
export let textRectPadding = Math.min(yGap / 2 - 1, rootTextRectPadding)
export let sharpCorner = false

emitter.on<number>('branch', (value) => branch = value ? value : branch)
emitter.on<boolean>('sharp-corner', (value) => {
  sharpCorner = value ? value : false
  link = value ? curveStepLink : linkHorizontal
})
emitter.on<TwoNumber>('gap', (value) => {
  if (!value) { return }
  const xGap = value[0]
  yGap = value[1]
  textRectPadding = Math.min(yGap / 2 - 1, rootTextRectPadding)
  textRectPadding = Math.min(xGap / 2 - 1, textRectPadding)
})

// contextmenu
const getMenuItem = produce<(draft: MenuItem, disabled: boolean) => void>((draft, disabled) => { draft.disabled = disabled })

export let collapseItem = getMenuItem({ title: '折叠节点', name: 'collapse', disabled: true }, true)
export let expandItem = getMenuItem({ title: '展开节点', name: 'expand', disabled: true }, true)
export let deleteItem = getMenuItem({ title: '删除节点', name: 'delete', disabled: false }, true)

const getNodeMenu = produce<MenuItem[][]>(() => {
  return [
    [ { title: '新建子节点', name: 'add', disabled: false } ],
    [ deleteItem ],
    [ { title: '全选', name: 'selectall', disabled: true } ],
    [ collapseItem, expandItem ]
  ]
})

export const nodeMenu = ref(getNodeMenu())

;[collapseItem, expandItem, deleteItem].forEach((item) => {
  emitter.on<boolean>(`${item.name}-item`, (disabled) => {
    if (typeof disabled === 'undefined') { return }
    switch (item.name) {
      case 'delete':
        deleteItem = getMenuItem(item, disabled)
        break
      case 'expand':
        expandItem = getMenuItem(item, disabled)
        break
      case 'collapse':
        collapseItem = getMenuItem(item, disabled)
        break
      default:
        break
    }
    nodeMenu.value = getNodeMenu()
  })
})
