import ImData from '../ImData'
import learnData from '@/learn.json'
import { xGap, yGap, getSize } from './config'
import { cloneDeep } from 'lodash'
import { Data } from '../../interface'

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
    }
  })

  it('添加新子树时，颜色保持一致', () => {
    const tree: Data = {
      name: '1',
      children: [
        { name: '2' },
        { name: '3' },
      ]
    }
    const p = mmdata.find('0-0')
    const d = mmdata.add('0-0', tree)
    expect(d?.color).toBe(p?.color)
  })

  it('删除单个目标节点', () => {
    mmdata.deleteOne('0-2')
    const d = mmdata.find('0-2')
    expect(d?.name).toBe('选择集')
    expect(d?.depth).toBe(1)
    expect(d?.left).toBe(true)
  })
})