import * as d3ScaleChromatic from 'd3-scale-chromatic'
import * as d3Scale from 'd3-scale'
import { Data, Mdata } from '@/components/Mindmap/interface'
import { BoundingBox, Layout } from './flextree'

type GetSize = (text: string) => { width: number, height: number }
type Processer = (d: Mdata, id: string) => void
type IsMdata = Mdata | null

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
// id gKey depth dx dy name left color px py
const init = (d: TreeData, id = '0', p: IsMdata = null, c?: string) => {
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

const swapWidthAndHeight = <T extends { width: number, height: number }> (d: T) => {
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

const renewId = <T extends { id: string }>(d: T, id: string) => {
  d.id = id
}

const renewColor = <T extends { color: string, parent: T | null }>(d: T) => {
  if (d.parent) {
    if (d.parent.color) {
      d.color = d.parent.color
    } else if (!d.color) {
      d.color = colorScale(`${colorNumber += 1}`)
    }
  }
}

/**
 * 遍历数据d，在此过程中会对每个数据调用指定函数，同时删除id为del的数据
 * @param d - 数据
 * @param processers - 函数
 * @param id - 新id
 */
const traverse = (d: Mdata, processers: Processer[], id = '0') => {
  processers.forEach((p) => { p(d, id) })
  const { children } = d
  if (children) {
    for (let index = 0; index < children.length; ) {
      const child = children[index]
      if (child.id === 'del') {
        children.splice(index, 1)
      } else {
        traverse(child, processers, `${id}-${index}`) 
        index += 1
      }
    }
  }
}

const getLayout = (xGap: number, yGap: number) => {
  const bb = new BoundingBox(yGap, xGap)
  return new Layout(bb)
}

export class ImData {
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
    this.renew()
  }

  find (id: string): IsMdata { // 根据id找到数据
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

  rename (id: string, name: string): IsMdata { // 修改名称
    if (id.length > 0) {
      const d = this.find(id)
      if (d && d.name !== name) {
        d.name = name
        d.rawData.name = name
        //
        const size = this.getSize(d.name)
        d.width = size.width
        d.height = size.height
        this.renew()
      }
      return d
    } else {
      return null
    }
  }

  reparent (parentId: string, delId: string): IsMdata { // 节点移动到其他层
    if (parentId === delId) { return null }
    const np = this.find(parentId)
    const del = this.find(delId)
    const delIndex = delId.split('-').pop()
    if (delIndex && np && del) {
      const delParent = del.parent
      delParent?.children?.splice(~~delIndex, 1)
      delParent?.rawData.children?.splice(~~delIndex, 1)
      del.parent = np
      del.gKey = gKey += 1
      del.depth = del.parent.depth + 1
      if (del.depth === 1) { del.color = colorScale(`${colorNumber += 1}`) }
      np.children ? np.children.push(del) : np.children = [del]
      np.rawData.children ? np.rawData.children.push(del.rawData) : np.rawData.children = [del.rawData]
      this.renew(renewId, renewColor)
    }
    return del
  }

  move (id: string, referenceId: string, after = 0): IsMdata { // 同层调换顺序
    const idArr = id.split('-')
    const refArr = referenceId.split('-')
    let index: number | string | undefined = idArr.pop()
    let refIndex: number | string | undefined = refArr.pop()
    if (id === referenceId || idArr.length !== refArr.length || !index || !refIndex) { return null }
    const d = this.find(id)
    if (d && d.parent) {
      index = parseInt(index, 10)
      refIndex = parseInt(refIndex, 10)
      if (index < refIndex) { refIndex -= 1 } // 删除时可能会改变插入的序号
      const { children } = d.parent
      const { children: rawChildren } = d.parent.rawData
      if (children && rawChildren) {
        children.splice(index, 1)
        children.splice(refIndex + after, 0, d)
        rawChildren.splice(index, 1)
        rawChildren.splice(refIndex + after, 0, d.rawData)
        this.renew(renewId)
        return d
      }
    }
    return null
  }

  add (id: string, name: string): IsMdata {
    const p = this.find(id)
    if (p) {
      if (!p.children) { p.children = [] }
      if (!p.rawData.children) { p.rawData.children = [] }
      const size = this.getSize(name)
      const rawData = { name }
      const color = p.color ? p.color : colorScale(`${colorNumber += 1}`)
      const d = {
        id: `${p.id}-${p.children.length}`,
        name,
        rawData,
        parent: p,
        left: p.left,
        color,
        gKey: gKey += 1,
        width: size.width,
        height: size.height,
        depth: p.depth + 1,
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
        px: 0,
        py: 0
      }
      p.children.push(d)
      p.rawData.children.push(rawData)
      this.renew()
      return d
    }
    return null
  }
  /**
   * 默认更新dx、dy、width、height、x、y
   * @param plugins - 需要更新其他属性时的函数
   */
  renew (...plugins: Processer[]): void {
    traverse(this.data, [swapWidthAndHeight])
    this.layout.layout(this.data)
    const temp: Processer[] = [swapWidthAndHeight, swapXAndY, renewDelta]
    traverse(this.data, temp.concat(plugins))
  }

  delete (id: string): void {
    const idArr = id.split('-')
    if (idArr.length >= 2) { // 有parent
      const delIndex = idArr.pop()
      const parent = this.find(idArr.join('-'))
      if (delIndex && parent) {
        if (parent.children) {
          parent.children[~~delIndex].id = 'del' // 更新id时删除
        }
      }
      this.renew(renewId)
    } else {
      throw new Error('暂不支持删除根节点')
    }
  }
}

export default ImData
