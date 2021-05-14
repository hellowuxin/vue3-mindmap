import emitter from '@/mitt'
import cloneDeep from 'lodash.clonedeep'
import { draw } from '../draw'
import { Data, IsMdata } from '../interface'
import { snapshot, updateTimeTravelState } from '../state'
import { mmcontext } from '../variable'
import ImData from './ImData'

export { ImData }

// 思维导图数据
export let mmdata: ImData
emitter.on<ImData>('mmdata', (val) => val ? mmdata = val : null)

export const afterOperation = (snap = true): void => {
  if (snap) { snapshot.snap(mmdata.data) }
  mmcontext.emit('update:modelValue', cloneDeep([mmdata.data.rawData]))
  updateTimeTravelState()
  draw()
}
export const rename = (id: string, name: string): void => {
  mmdata.rename(id, name)
  afterOperation()
}
export const moveChild = (pid: string, id: string): void => {
  mmdata.moveChild(pid, id)
  afterOperation()
}
export const moveSibling = (id: string, referenceId: string, after = 0): void => {
  mmdata.moveSibling(id, referenceId, after)
  afterOperation()
}
export const add = (id: string, name: string | Data): IsMdata => {
  const d = mmdata.add(id, name)
  afterOperation()
  return d
}
export const del = (id: string): void => {
  mmdata.delete(id)
  afterOperation()
}
export const delOne = (id: string): void => {
  mmdata.deleteOne(id)
  afterOperation()
}
export const expand = (id: string): void => {
  mmdata.expand(id)
  afterOperation()
}
export const collapse = (id: string): void => {
  mmdata.collapse(id)
  afterOperation()
}
export const addSibling = (id: string, name: string, before = false): IsMdata => {
  const d = mmdata.addSibling(id, name, before)
  afterOperation()
  return d
}
export const addParent = (id: string, name: string): IsMdata => {
  const d = mmdata.addParent(id, name)
  afterOperation()
  return d
}
export const changeLeft = (id: string): void => {
  mmdata.changeLeft(id)
  afterOperation()
}