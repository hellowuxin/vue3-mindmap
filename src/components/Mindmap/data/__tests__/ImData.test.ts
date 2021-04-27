// TDD 单元测试
import ImData from '../ImData'
import learnData from '@/learn.json'
const yGap = 18
const xGap = 84

const getSize = () => ({ width: 10, height: 10 })

describe('思维导图数据测试', () => {
  let mmdata: ImData

  beforeEach(() => {
    mmdata = new ImData(JSON.parse(JSON.stringify(learnData[0])), xGap, yGap, getSize)
  })

  it('根据Data生成思维导图数据', () => {
    expect(mmdata.data).toMatchSnapshot()
  })

  it('找到指定id的节点', () => {
    const d = mmdata.find('0-2-2')
    expect(d).toMatchSnapshot()
  })

  it('给指定id的节点添加新子节点', () => {
    const d = mmdata.add('0-1', '子节点')
    expect(d).toMatchSnapshot()
  })

  it('删除指定id的节点', () => {
    mmdata.delete('0-1')
    expect(mmdata.data).toMatchSnapshot()
  })

  it('修改指定id的节点内容' , () => {
    const name = '新安装'
    const d = mmdata.rename('0-1', name)
    expect(d?.name).toBe(name)
  })

  it('移动指定id的节点的到指定的父亲节点下', () => {
    const d = mmdata.moveChild('0', '0-2-2')
    expect(d).toMatchSnapshot()
  })

  it('移动指定id的节点到指定的兄弟节点之前', () => {
    const d = mmdata.moveSibling('0-2-0', '0-2-3')
    expect(d).toMatchSnapshot()
  })

  it('展开指定id的节点', () => {
    const d = mmdata.expand('0-1')
    expect(d).toMatchSnapshot()
  })

  it('折叠指定id的节点', () => {
    const d = mmdata.collapse('0-2-4')
    expect(d).toMatchSnapshot()
  })
})

