import { d3 } from "./tools";

export interface Data {
  name: string
  children?: Array<Data>
  left?: boolean
  collapse?: boolean
}

export interface Mdata {
  rawData: Data
  name: string
  parent: Mdata | null
  children?: Array<Mdata>
  left: boolean
  id: string
  color: string
  gKey: number
  width: number
  height: number
  depth: number
  x: number
  y: number
  dx: number
  dy: number
  px: number
  py: number
}

export interface TspanData {
  name: string,
  height: number
}

export type Transition = d3.Transition<d3.BaseType, Mdata, SVGGElement, unknown>
export type SelectionG = d3.Selection<SVGGElement, Mdata, SVGGElement, Mdata | null>
export type SelectionRect = d3.Selection<SVGRectElement, Mdata, SVGGElement, Mdata | null>
export type TwoNumber = [number, number]

