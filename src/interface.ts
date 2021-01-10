export interface Data {
  name: string
  children?: Array<Data>
  _children?: Array<Data>
  left?: boolean
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
