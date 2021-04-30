import ImData from '../ImData'
import learnData from '@/learn.json'
import { xGap, yGap, getSize } from './config'
import { cloneDeep } from 'lodash'

describe('思维导图数据-单元测试', () => {
  let mmdata = new ImData(JSON.parse(JSON.stringify(learnData[0])), xGap, yGap, getSize)
  const clone = cloneDeep(mmdata)

  beforeEach(() => {
    mmdata = cloneDeep(clone)
  })

  describe('根据Data生成思维导图数据', () => {
    it('生成成功', () => {
      expect(mmdata.data).toMatchSnapshot()
    })
  })

  describe('找到目标节点', () => {
    it('成功', () => {
      const id = '0-2-2'
      const d = mmdata.find(id)
      expect(d?.id).toBe(id)
    })
  })

  describe('给目标节点添加新子节点', () => {
    it('添加成功', () => {
      const d = mmdata.add('0-0', '子节点')
      expect(d?.id).toBe('0-0-5')
      expect(d?.name).toBe('子节点')
      expect(d).toMatchSnapshot()
    })

    it('目标节点处于折叠状态下时，添加失败', () => {
      const d = mmdata.add('0-1', '子节点')
      expect(d).toBeNull()
    })
  })

  describe('删除目标节点', () => {
    it('删除成功', () => {
      mmdata.delete('0-1')
      expect(mmdata.data).toMatchSnapshot()
    })
  })

  describe('修改目标节点内容' , () => {
    it('修改成功', () => {
      const name = '新安装'
      const d = mmdata.rename('0-1', name)
      expect(d?.name).toBe(name)
      expect(d).toMatchSnapshot()
    })
  })

  describe('移动目标节点到指定的父亲节点下', () => {
    it('移动成功', () => {
      const pId = '0'
      const d = mmdata.moveChild(pId, '0-2-2')
      expect(d?.parent?.id).toBe(pId)
      expect(d?.id).toBe('0-3')
      expect(d).toMatchSnapshot()
    })
  })

  describe('移动目标节点到指定的兄弟节点之前', () => {
    it('移动成功', () => {
      const d = mmdata.moveSibling('0-2-0', '0-2-2')
      expect(d?.id).toBe('0-2-1')
      expect(d).toMatchSnapshot()
    })

    it('兄弟节点不存在时，移动失败', () => {
      const d = mmdata.moveSibling('0-2-0', '0-2-3')
      expect(d).toBeNull()
    })
  })

  describe('展开目标节点', () => {
    it('展开成功', () => {
      const d = mmdata.expand('0-1')
      expect(d?.collapse).toBeFalsy()
      expect(d).toMatchSnapshot()
    })
  })

  describe('折叠目标节点', () => {
    it('折叠成功', () => {
      const d = mmdata.collapse('0-3-4')
      expect(d?.collapse).toBeTruthy()
      expect(d).toMatchSnapshot()
    })
  })
})
