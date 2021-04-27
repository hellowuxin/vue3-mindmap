import { layout, Tree } from './algorithm'

interface TreeData {
  width: number
  height: number
  children?: TreeData[]
  x: number
  y: number
}
interface Box {
  left: number
  right: number
  top: number
  bottom: number
}

export class BoundingBox {
  gap: number
  bottomPadding: number
  /**
   * @param gap - the gap between sibling nodes
   * @param bottomPadding - the height reserved for connection drawing
   */
  constructor (gap: number, bottomPadding: number) {
    this.gap = gap
    this.bottomPadding = bottomPadding
  }

  addBoundingBox (width: number, height: number): { width: number, height: number } {
    return { width: width + this.gap, height: height + this.bottomPadding }
  }

  /**
   * Return the coordinate without the bounding box for a node
   */
  removeBoundingBox (x: number, y: number): { x: number, y: number } {
    return { x: x + this.gap / 2, y }
  }
}

export class Layout {
  bb: BoundingBox
  constructor (boundingBox: BoundingBox) {
    this.bb = boundingBox
  }

  /**
   * Layout treeData.
   * Return modified treeData and the bounding box encompassing all the nodes.
   *
   * See getSize() for more explanation.
   */
  layout<T extends TreeData> (treeData: T): { result: T, boundingBox: Box } {
    const tree = this.convert(treeData)
    layout(tree)
    const { boundingBox, result } = this.assignLayout(tree, treeData)

    return { result, boundingBox }
  }

  /**
   * Returns Tree to layout, with bounding boxes added to each node.
   */
  convert (treeData: TreeData, y = 0): Tree {
    const { width, height } = this.bb.addBoundingBox(
      treeData.width,
      treeData.height
    )
    const children = []
    if (treeData.children && treeData.children.length) {
      for (let i = 0; i < treeData.children.length; i++) {
        children[i] = this.convert(treeData.children[i], y + height)
      }
    }

    return new Tree(width, height, y, children)
  }

  /**
   * Assign layout tree x, y coordinates back to treeData,
   * with bounding boxes removed.
   */
  assignCoordinates (tree: Tree, treeData: TreeData): void {
    const { x, y } = this.bb.removeBoundingBox(tree.x, tree.y)
    treeData.x = x
    treeData.y = y
    for (let i = 0; i < tree.c.length; i++) {
      this.assignCoordinates(tree.c[i], (treeData.children as TreeData[])[i])
    }
  }

  /**
   * Return the bounding box that encompasses all the nodes.
   * The result has a structure of
   * \{ left: number, right: number, top: number, bottom: nubmer \}.
   * This is not the same bounding box concept as the `BoundingBox` class
   * used to construct `Layout` class.
   */
  getSize (treeData: TreeData, box?: Box): Box {
    const { x, y, width, height } = treeData
    if (!box) {
      box = { left: x, right: x + width, top: y, bottom: y + height }
    }
    box.left = Math.min(box.left, x)
    box.right = Math.max(box.right, x + width)
    box.top = Math.min(box.top, y)
    box.bottom = Math.max(box.bottom, y + height)

    if (treeData.children) {
      for (const child of treeData.children) {
        this.getSize(child, box)
      }
    }

    return box
  }

  /**
   * This function does assignCoordinates and getSize in one pass.
   */
  assignLayout<T extends TreeData> (tree: Tree, treeData: T, box?: Box): { result: T, boundingBox: Box } {
    const { x, y } = this.bb.removeBoundingBox(tree.x, tree.y)
    treeData.x = x
    treeData.y = y

    const { width, height } = treeData
    if (!box) {
      box = { left: x, right: x + width, top: y, bottom: y + height }
    }
    box.left = Math.min(box.left, x)
    box.right = Math.max(box.right, x + width)
    box.top = Math.min(box.top, y)
    box.bottom = Math.max(box.bottom, y + height)

    for (let i = 0; i < tree.c.length; i++) {
      this.assignLayout(tree.c[i], (treeData.children as T[])[i], box)
    }

    return { result: treeData, boundingBox: box }
  }
}
