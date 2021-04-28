import { ref } from 'vue'
import { Mdata } from '../interface'
import Snapshot from './Snapshot'

export const snapshot = new Snapshot<Mdata>()

// 时间旅行状态
export const hasPrev = ref(false)
export const hasNext = ref(false)

export const updateTimeTravelState = (): void => {
  hasPrev.value = snapshot.hasPrev
  hasNext.value = snapshot.hasNext
}
