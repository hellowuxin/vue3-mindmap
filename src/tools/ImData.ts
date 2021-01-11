import * as d3ScaleChromatic from 'd3-scale-chromatic'
import * as d3Scale from 'd3-scale'
import { Data, Mdata } from '@/interface'
import { BoundingBox, Layout } from '@/tools/flextree'

type GetSize = (text: string) => { width: number, height: number }
type Processer = (d: Mdata) => void

interface TreeData {
  rawData: Data
  width: number
  height: number
  x: number
  y: number
  children?: TreeData[]
}

const colorScale = d3Scale.scaleOrdinal(d3ScaleChromatic.schemePaired) // 颜色列表
let colorNumber = 0
let gKey = 0

// rawData width height x y children
function initTreeData (d: Data, getSize: GetSize) {
  const size = getSize(d.name)
  const data: TreeData = {
    rawData: d,
    width: size.height,
    height: size.width,
    x: 0,
    y: 0
  }

  const { children } = d
  if (children) {
    const dataChildren: TreeData[] = data.children = []
    children.forEach((child) => {
      dataChildren.push(initTreeData(child, getSize))
    })
  }

  return data
}
// id gKey depth dx dy name left color _children px py
const init = (d: TreeData, id = '0', p: Mdata | null = null, c?: string) => {
  const x = d.y
  const y = d.x
  let color = ''
  let left = false
  let px = x
  let py = y
  if (p) {
    left = p.left
    px = p.x
    py = p.y
    color = c || colorScale(`${colorNumber += 1}`)
  }
  const data: Mdata = {
    x,
    y,
    width: d.height,
    height: d.width,
    id,
    gKey: (gKey += 1),
    depth: Math.floor(id.length / 2),
    name: d.rawData.name,
    px: 0,
    py: 0,
    rawData: d.rawData,
    parent: p,
    color,
    left,
    dx: x - px,
    dy: y - py
  }
  if (d.children) {
    data.children = []
    d.children.forEach((c, j) => {
      data.children?.push(init(c, `${id}-${j}`, data, color))
    })
  }
  return data
}

function swapWidthAndHeight<T extends { width: number, height: number }> (d: T) {
  [d.width, d.height] = [d.height, d.width]
}

const swapXAndY = <T extends { x: number, y: number }>(d: T) => {
  [d.x, d.y] = [d.y, d.x]
}

const renewDelta = <T extends { x: number, y: number, parent: T | null, dx: number, dy: number }>(d: T) => {
  if (d.parent) {
    d.dx = d.x - d.parent.x
    d.dy = d.y - d.parent.y
  } else {
    d.dx = 0
    d.dy = 0
  }
}

const traverse = (d: Mdata, process: Processer[]) => {
  process.forEach((p) => { p(d) })
  d.children?.forEach((child) => { traverse(child, process) })
}

const getLayout = (xGap: number, yGap: number) => {
  const bb = new BoundingBox(yGap, xGap)
  return new Layout(bb)
}
class ImData {
  data: Mdata
  private getSize: GetSize
  private layout: Layout

  constructor (d: Data, xGap: number, yGap: number, getSize: GetSize) {
    const data = initTreeData(d, getSize)
    this.layout = getLayout(xGap, yGap)
    this.layout.layout(data)
    this.data = init(data)
    this.getSize = getSize
  }

  setBoundingBox (xGap: number, yGap: number): void {
    this.layout = getLayout(xGap, yGap)
    traverse(this.data, [swapWidthAndHeight])
    this.layout.layout(this.data)
    traverse(this.data, [swapWidthAndHeight, swapXAndY, renewDelta])
  }

  find (id: string): Mdata | null { // 根据id找到数据
    const array = id.split('-').map(n => ~~n)
    let data = this.data
    for (let i = 1; i < array.length; i++) {
      if (data && data.children) {
        data = data.children[array[i]]
      } else { // No data matching id
        return null
      }
    }
    return data
  }

  rename (id: string, name: string): Mdata | null { // 修改名称
    if (id.length > 0) {
      const d = this.find(id)
      if (d && d.name !== name) {
        d.name = name
        d.rawData.name = name
        //
        const size = this.getSize(d.name)
        d.width = size.width
        d.height = size.height
        traverse(this.data, [swapWidthAndHeight])
        this.layout.layout(this.data)
        traverse(this.data, [swapWidthAndHeight, swapXAndY, renewDelta])
      }
      return d
    } else {
      return null
    }
  }
}

export default ImData
