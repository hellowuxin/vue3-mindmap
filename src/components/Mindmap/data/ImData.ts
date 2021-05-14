import * as d3ScaleChromatic from 'd3-scale-chromatic'
import * as d3Scale from 'd3-scale'
import { Data, Mdata, IsMdata } from '@/components/Mindmap/interface'
import { BoundingBox, Layout } from './flextree'

type GetSize = (text: string) => { width: number, height: number }
type Processer = (d: Mdata, id: string) => void

const swapWidthAndHeight = (d: Mdata) => [d.width, d.height] = [d.height, d.width]

const renewDelta = (d: Mdata) => {
  if (d.parent) {
    d.dx = d.x - d.parent.x
    d.dy = d.y - d.parent.y
  } else {
    d.dx = 0
    d.dy = 0
  }
}

const renewId = (d: Mdata, id: string) => d.id = id
const renewDepth = (d: Mdata) => {
  if (d.parent) {
    d.depth = d.parent.depth + 1
  } else {
    d.depth = 0
  }
}

const renewColor = (d: Mdata): void => {
  if (d.parent && d.parent.color) {
    d.color = d.parent.color
  }
}

const renewLeft = (d: Mdata) => {
  if (d.depth > 1 && d.parent) {
    d.left = d.parent.left
  }
}

const separateLeftAndRight = (d: Mdata): { left: Mdata, right: Mdata } => {
  const ld = Object.assign({}, d)
  const rd = Object.assign({}, d)
  if (d.collapse) {
    //
  } else {
    const { children } = d
    ld.children = []
    rd.children = []
    children.forEach((child) => {
      if (child.left) {
        ld.children.push(child)
      } else {
        rd.children.push(child)
      }
      if (child.parent) { child.parent = rd }
    })
  }
  return { left: ld, right: rd }
}

/**
 * 遍历数据d，在此过程中会对每个数据调用指定函数，同时删除id为del的数据，不处理被折叠的数据
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
        d.rawData.children?.splice(index, 1)
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

class ImData {
  data: Mdata
  private getSize: GetSize
  private layout: Layout
  private colorScale: d3Scale.ScaleOrdinal<string, string, never>
  private colorNumber = 0
  private gKey = 0
  private rootWidth = 0
  private diffY = 0 // 左树与右树的差值

  constructor (
    d: Data,
    xGap: number,
    yGap: number,
    getSize: GetSize,
    colorScale = d3Scale.scaleOrdinal(d3ScaleChromatic.schemePaired)
  ) {
    this.colorScale = colorScale
    this.getSize = getSize
    this.layout = getLayout(xGap, yGap)
    this.data = this.createMdataFromData(d, '0')
    this.renew()
  }

  private createMdataFromData (rawData: Data, id: string, parent: IsMdata = null): Mdata {
    const { name, collapse, children: rawChildren } = rawData
    const { width, height } = this.getSize(name)
    const depth = parent ? parent.depth + 1 : 0
    let left = false
    let color = parent ? parent.color : ''
    if (depth === 1) {
      left = !!rawData.left
      color = this.colorScale(`${this.colorNumber += 1}`)
    } else if (depth !== 0 && parent) {
      left = parent.left
    }
    const data: Mdata = {
      id, name, rawData, parent, left, color, depth,
      x: 0, y: 0, dx: 0, dy: 0, px: 0, py: 0,
      width, height, children: [], _children: [],
      collapse: !!collapse,
      gKey: this.gKey += 1,
    }
    if (rawChildren) {
      if (!data.collapse) {
        rawChildren.forEach((c, j) => {
          data.children.push(this.createMdataFromData(c, `${id}-${j}`, data))
        })
      } else {
        rawChildren.forEach((c, j) => {
          data._children.push(this.createMdataFromData(c, `${id}-${j}`, data))
        })
      }
    }

    return data
  }

  /**
   * 默认更新x, y, dx, dy, left, depth
   * @param plugins - 需要更新其他属性时的函数
   */
  private renew (...plugins: Processer[]): void {
    traverse(this.data, [swapWidthAndHeight, renewDepth, renewLeft])
    this.data = this.l(this.data)
    const temp: Processer[] = [swapWidthAndHeight, this.renewXY.bind(this), renewDelta]
    traverse(this.data, temp.concat(plugins))
  }

  /**
   * 分别计算左右树，最后合并成一颗树，右树为主树
   */
  private l (data: Mdata): Mdata {
    const { left, right } = separateLeftAndRight(data)
    this.layout.layout(left) // 更新x,y
    this.layout.layout(right)
    this.diffY = right.x - left.x
    this.rootWidth = left.height
    right.children = data.children // children原顺序
    return right
  }

  private renewXY (d: Mdata): void {
    [d.x, d.y] = [d.y, d.x]
    if (d.left) {
      d.x = -d.x + this.rootWidth
      d.y += this.diffY
    }
  }

  getRootWidth (): number { return this.rootWidth }

  setBoundingBox (xGap: number, yGap: number): void {
    this.layout = getLayout(xGap, yGap)
    this.renew()
  }

  find (id: string): IsMdata { // 根据id找到数据
    const array = id.split('-').map(n => ~~n)
    let data = this.data
    for (let i = 1; i < array.length; i++) {
      const index = array[i]
      const { children } = data
      if (index < children.length) {
        data = children[index]
      } else { // No data matching id
        return null
      }
    }
    return data.id === id ? data : null
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

  /**
   * 将b节点移动到a节点下
   * @param parentId - 目标节点a
   * @param delId - 被移动节点b
   */
  moveChild (parentId: string, delId: string): IsMdata {
    if (parentId === delId) { return null }
    const np = this.find(parentId)
    const del = this.find(delId)
    const delIndex = delId.split('-').pop()
    if (delIndex && np && del) {
      const delParent = del.parent
      delParent?.children?.splice(~~delIndex, 1)
      delParent?.rawData.children?.splice(~~delIndex, 1)
      del.parent = np
      del.gKey = this.gKey += 1
      del.depth = del.parent.depth + 1
      if (del.depth === 1) {
        del.color = this.colorScale(`${this.colorNumber += 1}`)
      } else {
        del.left = del.parent.left
      }
      if (np.collapse) {
        np._children.push(del)
      } else {
        np.children.push(del)
      }
      np.rawData.children ? np.rawData.children.push(del.rawData) : np.rawData.children = [del.rawData]
      this.renew(renewId, renewColor)
    }
    return del
  }

  moveSibling (id: string, referenceId: string, after = 0): IsMdata { // 同层调换顺序
    const idArr = id.split('-')
    const refArr = referenceId.split('-')
    let index: number | string | undefined = idArr.pop()
    let refIndex: number | string | undefined = refArr.pop()
    if (id === referenceId || idArr.length !== refArr.length || !index || !refIndex) {
      return null
    }
    const d = this.find(id)
    const r = this.find(referenceId)
    if (r && d && d.parent) {
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
        if (d.depth === 1) { d.left = r.left }
        this.renew(renewId)
        return d
      }
    }
    return null
  }

  add (id: string, variable: string | Data): IsMdata {
    const p = this.find(id)
    if (p) {
      if (p.collapse) { this.expand(id) }
      if (!p.rawData.children) { p.rawData.children = [] }
      if (typeof variable === 'string') {
        const name = variable
        const size = this.getSize(name)
        const rawData: Data = { name }
        const color = p.color ? p.color : this.colorScale(`${this.colorNumber += 1}`)
        const d: Mdata = {
          id: `${p.id}-${p.children.length}`,
          name,
          rawData,
          parent: p,
          left: p.left,
          collapse: false,
          color,
          gKey: this.gKey += 1,
          width: size.width,
          height: size.height,
          depth: p.depth + 1,
          x: 0,
          y: 0,
          dx: 0,
          dy: 0,
          px: 0,
          py: 0,
          children: [],
          _children: []
        }
        p.children.push(d)
        p.rawData.children.push(rawData)
        this.renew()
        return d
      } else {
        const rawData = variable
        const m = this.createMdataFromData(rawData, `${p.id}-${p.children.length}`, p)
        p.children.push(m)
        p.rawData.children.push(rawData)
        this.renew()
        return m
      }
    }

    return null
  }

  expand (id: string): IsMdata { return this.eoc(id, false, [renewColor, renewId]) }
  collapse (id: string): IsMdata { return this.eoc(id, true) }

  /**
   * 展开或折叠(expand or collapse)
   */
  eoc (id: string, collapse: boolean, plugins: Processer[] = []): IsMdata {
    const d = this.find(id)
    if (d) {
      d.collapse = collapse
      d.rawData.collapse = collapse
      ;[d._children, d.children] = [d.children, d._children]
      this.renew(...plugins)
    }
    return d
  }

  delete (id: string): void {
    const del = this.find(id)
    if (del && del.parent) {
      del.id = 'del'
      this.renew(renewId)
    } else {
      throw new Error(del ? '暂不支持删除根节点' : '未找到需要删除的节点')
    }
  }

  deleteOne (id: string): void {
    const del = this.find(id)
    if (del && del.parent) {
      const { parent, children, _children, collapse, rawData } = del
      const index = parseInt(id.split('-').pop() as string, 10)
      parent.children.splice(index, 1, ...(collapse ? _children : children))
      parent.rawData.children?.splice(index, 1, ...(rawData.children || []))
      children.forEach(c => {
        c.parent = parent
        if (c.depth === 1) { c.rawData.left = c.left }
      })
      this.renew(renewId)
    }
  }

  addSibling (id: string, name: string, before = false): IsMdata {
    const d = this.find(id)
    if (d && d.parent) {
      const index = parseInt(id.split('-').pop() as string, 10)
      const { parent, left } = d
      const rawSibling: Data = { name, left }
      const size = this.getSize(name)
      const start = before ? index : index + 1
      const color = parent.color ? parent.color : this.colorScale(`${this.colorNumber += 1}`)
      const sibling: Mdata = {
        name,
        parent,
        children: [],
        _children: [],
        color,
        collapse: false,
        rawData: rawSibling,
        id: `${parent.id}-${start}`,
        left,
        gKey: this.gKey += 1,
        depth: d.depth,
        width: size.width,
        height: size.height,
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
        px: 0,
        py: 0,
      }
      parent.children.splice(start, 0, sibling)
      parent.rawData.children?.splice(start, 0, rawSibling)
      this.renew(renewId)
      return sibling
    }
    return null
  }

  addParent (id: string, name: string): IsMdata {
    const d = this.find(id)
    if (d && d.parent) {
      const { parent: oldP, left, color } = d
      const size = this.getSize(name)
      const index = parseInt(d.id.split('-').pop() as string, 10)
      const rawP: Data = { name, children: [d.rawData], left }
      oldP.rawData.children?.splice(index, 1, rawP)
      const p: Mdata = {
        rawData: rawP,
        left,
        name,
        color,
        collapse: false,
        parent: oldP,
        id: d.id,
        depth: d.depth,
        width: size.width,
        height: size.height,
        gKey: this.gKey += 1,
        children: [d],
        _children: [],
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
        px: 0,
        py: 0
      }
      d.parent = p
      oldP.children.splice(index, 1, p)
      this.renew(renewId)
      return p
    }
    return null
  }

  changeLeft (id: string): IsMdata {
    const d = this.find(id)
    if (d) {
      d.left = !d.left
      this.renew()
    }
    return d
  }
}

export default ImData
