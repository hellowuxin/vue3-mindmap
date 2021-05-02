import ImData from '../ImData'
import learnData from '@/learn.json'
import { xGap, yGap, getSize } from './config'
import { cloneDeep } from 'lodash'

describe('思维导图数据-集成测试', () => {
  let mmdata = new ImData(JSON.parse(JSON.stringify(learnData[0])), xGap, yGap, getSize)
  const clone = cloneDeep(mmdata)

  beforeEach(() => { mmdata = cloneDeep(clone) })

  it('添加a节点到处于折叠状态的b节点下，然后展开b节点，a节点的color和id更新', () => {
    const aId = '0-0-0'
    const bId = '0-1'
    mmdata.moveChild(bId, aId)
    mmdata.expand(bId)
    const d = mmdata.find('0-1-1')
    expect(d).toBeTruthy()
    expect(d?.color).toBe(d?.parent?.color)
  })

  it('成功添加新子节点后，找得到该子节点', () => {
    const a = mmdata.add('0', '子节点')
    expect(a).toBeTruthy()
    if (a) {
      const d = mmdata.find(a.id)
      expect(d).toBeTruthy()
      expect(d?.name).toBe('子节点')
      // expect(d).toMatchSnapshot()
    }
  })
})