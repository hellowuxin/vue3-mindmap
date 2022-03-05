import * as d3 from './d3'

export interface Data {
  name: string
  children?: Array<Data>
  left?: boolean
  collapse?: boolean
}

export interface TreeData {
  rawData: Data
  width: number
  height: number
  x: number
  y: number
  children: TreeData[]
  _children: TreeData[]
  left: boolean,
  collapse: boolean
}

export interface Mdata {
  rawData: Data
  name: string
  parent: IsMdata
  children: Array<Mdata>
  _children: Array<Mdata> // 当折叠时保存children数据
  left: boolean
  collapse: boolean
  id: string // 代表着数据的顺序和嵌套层次
  color: string
  gKey: number
  width: number
  height: number
  depth: number
  x: number
  y: number
  dx: number
  dy: number
  // 拖拽时的偏移量
  px: number
  py: number
}

export interface TspanData {
  name: string,
  height: number
}

export type Transition = d3.Transition<d3.BaseType, Mdata, d3.BaseType, unknown>
export type SelectionG = d3.Selection<SVGGElement, Mdata, SVGGElement, IsMdata>
export type SelectionRect = d3.Selection<SVGRectElement, Mdata, SVGGElement, IsMdata>
export type SelectionCircle = d3.Selection<SVGCircleElement, Mdata, SVGGElement, IsMdata>
export type TwoNumber = [number, number]
export type IsMdata = Mdata | null
export type Locale = 'zh' | 'en' | 'ptBR'