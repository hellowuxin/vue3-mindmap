import * as d3ScaleChromatic from 'd3-scale-chromatic'
import * as d3Scale from 'd3-scale'
import { Data, Mdata } from '@/interface'
import { BoundingBox, Layout, TreeData as TD } from '@/tools/flextree'

type GetSize = (text: string) => { width: number, height: number }
interface TreeData {
  rawData: Data
  width: number
  height: number
  x: number
  y: number
  children?: TreeData[]
  [key: string]: any
}

const colorScale = d3Scale.scaleOrdinal(d3ScaleChromatic.schemePaired) // 颜色列表
let colorNumber = 0
let gKey = 0

function initColor (d: Mdata, c?: string) { // 初始化颜色
  let color
  if (d.id !== '0') {
    color = c || colorScale(`${colorNumber += 1}`)
    d.color = color
  }
  const { children, _children } = d
  if (children) {
    for (let i = 0; i < children.length; i += 1) {
      initColor(children[i], color)
    }
  }
  if (_children) {
    for (let i = 0; i < _children.length; i += 1) {
      initColor(_children[i], color)
    }
  }
}

function _getSource (d: Mdata) { // 返回源数据
  const { children, _children } = d
  const nd: Data = { name: d.name }
  nd.left = d.left
  if (children) {
    const { length } = children
    nd.children = new Array(length)
    for (let i = 0; i < length; i++) {
      nd.children[i] = _getSource(children[i])
    }
  }
  if (_children) {
    const { length } = _children
    nd._children = new Array(length)
    for (let i = 0; i < length; i++) {
      nd._children[i] = _getSource(_children[i])
    }
  }
  return nd
}

function initId (d: Mdata, id = '0') { // 初始化唯一标识：待优化
  d.id = id
  d.gKey = d.gKey || (gKey += 1)
  d.depth = Math.floor(d.id.length / 2)
  const { children, _children } = d

  if (children?.length && _children?.length) {
    console.error('[Mindmap warn]: Error in data: data.children and data._children cannot contain data at the same time')
  } else {
    if (children) {
      for (let i = 0; i < children.length;) {
        if (children[i].id === 'del') {
          children.splice(i, 1)
        } else {
          initId(children[i], `${id}-${i}`)
          i += 1
        }
      }
    }
    if (_children) {
      for (let i = 0; i < _children.length;) {
        if (_children[i].id === 'del') {
          _children.splice(i, 1)
        } else {
          initId(_children[i], `${id}-${i}`)
          i += 1
        }
      }
    }
  }
}

function initLeft (d: Mdata, left = false) {
  d.left = left
  const { children, _children } = d
  if (children) {
    for (let i = 0; i < children.length; i += 1) {
      initLeft(children[i], d.left)
    }
  }
  if (_children) {
    for (let i = 0; i < _children.length; i += 1) {
      initLeft(_children[i], d.left)
    }
  }
}

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
function init (d: TreeData, id = '0', c?: string) {
  [d.x, d.y] = [d.y, d.x]
  ;[d.width, d.height] = [d.height, d.width]
  d.id = id
  d.gKey = d.gKey || (gKey += 1)
  d.depth = Math.floor(d.id.length / 2)
  d.name = d.rawData.name
  d.px = 0
  d.py = 0

  let color: string
  if (id === '0') {
    d.left = false
    d.parent = null
    d.dx = 0
    d.dy = 0
    d.color = ''
  } else {
    d.left = d.parent.left || false
    d.dx = d.x - d.parent.x
    d.dy = d.y - d.parent.y
    color = d.color = c || colorScale(`${colorNumber += 1}`)
  }

  if (d.depth === 1) {
    d.left = d.rawData.left || false
  }

  const { children } = d
  if (children) {
    children.forEach((child, i) => {
      child.parent = d
      init(child, `${id}-${i}`, color)
    })
  }

  return d as Mdata
}

function swapWidthAndHeight<T extends { width: number, height: number, children?: T[] }> (d: T) {
  [d.width, d.height] = [d.height, d.width]
  d.children?.forEach((child) => {
    swapWidthAndHeight(child)
  })
}

function renewAfterSetBoundingBox (d: Mdata) {
  [d.x, d.y] = [d.y, d.x]
  ;[d.width, d.height] = [d.height, d.width]

  if (d.parent) {
    d.dx = d.x - d.parent.x
    d.dy = d.y - d.parent.y
  } else {
    d.dx = 0
    d.dy = 0
  }

  d.children?.forEach((child) => {
    renewAfterSetBoundingBox(child)
  })

  return d
}

function layout<T extends TD> (d: T, xGap: number, yGap: number) {
  const bb = new BoundingBox(yGap, xGap)
  const layout = new Layout(bb)
  return layout.layout(d)
}

class ImData {
  data: Mdata
  constructor (d: Data, xGap: number, yGap: number, getSize: GetSize) {
    const data = initTreeData(d, getSize)
    layout(data, xGap, yGap)
    this.data = init(data)
  }

  setBoundingBox (xGap: number, yGap: number): void {
    swapWidthAndHeight(this.data)
    layout(this.data, xGap, yGap)
    this.data = renewAfterSetBoundingBox(this.data)
  }

  getSource (id = '0'): Data {
    const d = this.find(id)
    return d ? _getSource(d) : { name: '' }
  }

  find (id: string): null | Mdata { // 根据id找到数据
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
      if (d) {
        d.name = name
      }
      return d
    } else {
      return null
    }
  }

  collapse (id: string | string[]): void { // 折叠
    const arr = Array.isArray(id) ? id : [id]
    for (let i = 0; i < arr.length; i++) {
      const idChild = arr[i]
      const d = this.find(idChild)
      if (d && (!d._children || d._children.length === 0)) {
        d._children = d.children
        d.children = []
      }
    }
  }

  expand (id: string | string[]): void { // 展开
    const arr = Array.isArray(id) ? id : [id]
    for (let i = 0; i < arr.length; i++) {
      const idChild = arr[i]
      const d = this.find(idChild)
      if (d && (!d.children || d.children.length === 0)) {
        d.children = d._children
        d._children = []
      }
    }
  }

  del (id: string | string[]): void { // 删除指定id的数据
    const arr = Array.isArray(id) ? id : [id]
    let p
    for (let i = 0; i < arr.length; i++) {
      const idChild = arr[i]
      const idArr = idChild.split('-')
      if (idArr.length >= 2) { // 有parent
        const delIndex = idArr.pop()
        const parent = this.find(idArr.join('-'))
        if (delIndex && parent) {
          if (parent.children) {
            parent.children[~~delIndex].id = 'del' // 更新id时删除
          }
          if (p === undefined || (p.id.split('-').length > parent.id.split('-').length)) { // 找出最高的parent
            p = parent
          }
        }
      }
    }
    if (p) {
      initId(p, p.id)
    }
  }

  add (id: string, child: Data): Mdata | null { // 添加新的子节点
    if (id.length > 0) {
      const parent = this.find(id)
      if (parent) {
        if ((parent._children?.length || 0) > 0) { // 判断是否折叠，如果折叠，展开
          parent.children = parent._children
          parent._children = []
        }
        const c: Mdata = JSON.parse(JSON.stringify(child))
        parent.children ? parent.children.push(c) : parent.children = [c]
        initColor(c, parent.color || colorScale(`${colorNumber += 1}`))
        initId(c, `${parent.id}-${parent.children.length - 1}`)
        c.left = parent.left
        return c
      } else {
        return null
      }
    } else {
      return null
    }
  }

  insert (id: string, d: Data, i = 0): Mdata | null { // 插入新的节点在前（或在后）
    if (id.length > 2) {
      const idArr = id.split('-')
      const bId = idArr.pop()
      const pId = idArr.join('-')
      const parent = this.find(pId)
      if (bId && parent) {
        const c: Mdata = JSON.parse(JSON.stringify(d))
        const pChildren = parent.children
        if (pChildren) {
          pChildren.splice(~~bId + i, 0, c)
          c.left = pChildren[~~bId].left
        }
        initColor(c, parent.color || colorScale(`${colorNumber += 1}`))
        initId(parent, parent.id)
        return c
      } else {
        return null
      }
    } else {
      return null
    }
  }

  move (delId: string, insertId?: string, i = 0): void { // 节点在同层移动
    if (delId.length > 2) {
      if (!insertId) { // 左右转换
        const del = this.find(delId)
        if (del) {
          initLeft(del, !del.left)
        }
      } else if (insertId.length > 2) {
        const insert = this.find(insertId)
        const idArr = delId.split('-')
        const delIndexS = idArr.pop()
        const pId = idArr.join('-')
        const parent = this.find(pId)
        const insertIndexS = insertId.split('-').pop()

        if (delIndexS && insertIndexS && insert && parent && parent.children) {
          const delIndex = ~~delIndexS
          let insertIndex = ~~insertIndexS
          // 删除时可能会改变插入的序号
          if (delIndex < insertIndex) {
            insertIndex -= 1
          }
          const del = parent.children.splice(delIndex, 1)[0]
          if (del.left !== insert.left) { // 左右转换
            initLeft(del, insert.left)
          }
          parent.children.splice(insertIndex + i, 0, del)
          initId(parent, parent.id)
        }
      }
    }
  }

  reparent (parentId: string, delId: string): void { // 节点移动到其他层
    if (delId.length > 2 && parentId.length > 0 && parentId !== delId) {
      const np = this.find(parentId)
      const idArr = delId.split('-')
      const delIndex = idArr.pop()
      const delParentId = idArr.join('-')
      const delParent = this.find(delParentId)
      if (delIndex && delParent && np) {
        const del = delParent.children?.splice(~~delIndex, 1)[0] // 删除
        if (del) {
          if (np.children && np.children.length > 0) {
            np.children.push(del)
          } else if (np._children && np._children.length > 0) {
            np._children.push(del)
          } else {
            np.children = [del]
          }

          initColor(del, parentId === '0' ? colorScale(`${colorNumber += 1}`) : np.color)
          initLeft(del, parentId === '0' ? del.left : np.left)
          initId(np, np.id)
          initId(delParent, delParent.id)
        }
      }
    }
  }
}

export default ImData
