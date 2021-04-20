// TDD 单元测试
import ImData from '../ImData'
import learnData from '@/learn.json'
import { xGap, yGap } from '@/components/Mindmap/variable'

const getSize = () => ({ width: 10, height: 10 })

describe('思维导图数据测试', () => {
  let mmdata: ImData

  beforeAll(() => {
    mmdata = new ImData(learnData[0], xGap, yGap, getSize)
  })

  it('根据Data生成思维导图数据', () => {
    expect(mmdata).toMatchSnapshot()
  })

  it('根据id找到对应的节点', () => {
    const d = mmdata.find('0-2-2')
    expect(d).toBeTruthy()
    expect(d?.id).toBe('0-2-2')
  })

  it('根据id添加子节点', () => {
    mmdata.add('0-1', '子节点')
    
    expect
  })
})

