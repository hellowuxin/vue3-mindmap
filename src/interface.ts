export interface Data {
  name: string
  children?: Array<Data>
  _children?: Array<Data>
  left?: boolean
}

export interface Mdata {
  rawData: Data
  name: string
  parent: Mdata
  children?: Array<Mdata>
  _children?: Array<Mdata>
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
}
