import { cloneDeep } from 'lodash'

export default class Snapshot<T> {
  private length: number // 最大记录数
  private snapshots: Array<T>
  private cursor: number

  constructor (length = 20) {
    this.length = length
    this.snapshots = []
    this.cursor = -1
  }

  get hasPrev(): boolean { return this.cursor > 0 }
  get hasNext(): boolean { return this.snapshots.length > this.cursor + 1 }

  snap (data: T): void { // 记录数据快照
    const snapshot = cloneDeep(data)
    // 去除旧分支
    while (this.cursor < this.snapshots.length - 1) { this.snapshots.pop() }
    this.snapshots.push(snapshot)
    // 确保历史记录条数限制
    if (this.snapshots.length > this.length) { this.snapshots.shift() }
    this.cursor = this.snapshots.length - 1
  }

  prev (): T | null {
    if (this.hasPrev) {
      this.cursor -= 1
      return cloneDeep(this.snapshots[this.cursor])
    }
    return null
  }

  next (): T | null {
    if (this.hasNext) {
      this.cursor += 1
      return cloneDeep(this.snapshots[this.cursor])
    }
    return null
  }
}