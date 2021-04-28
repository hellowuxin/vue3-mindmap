import emitter from '@/mitt'
import ImData from './ImData'

// 思维导图数据
export let mmdata: ImData
emitter.on<ImData>('mmdata', (val) => mmdata = val || mmdata)

export { ImData }
