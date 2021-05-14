import ImData from '../ImData'
import learnData from '@/learn.json'
import { xGap, yGap, getSize } from './config'
import { cloneDeep } from 'lodash'
import { Data } from '../../interface'

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

    it('目标节点处于折叠状态下时，转换为展开状态并添加成功', () => {
      const d = mmdata.add('0-1', '子节点')
      expect(d?.parent?.collapse).toBeFalsy()
      expect(d?.id).toBe('0-1-1')
      expect(d?.name).toBe('子节点')
    })

    it('添加新子树', () => {
      const tree: Data = {
        name: '1',
        children: [
          { name: '2' },
          { name: '3' },
        ]
      }
      const d = mmdata.add('0-0', tree)
      expect(d?.id).toBe('0-0-5')
      expect(d?.name).toBe('1')
      expect(d?.children[0].id).toBe('0-0-5-0')
      expect(d?.children[0].name).toBe('2')
      expect(d).toMatchSnapshot()
    })
  })

  describe('删除目标节点', () => {
    it('删除成功', () => {
      mmdata.delete('0-1')
      expect(mmdata.data).toMatchSnapshot()
    })
  })

  describe('删除单个目标节点', () => {
    it('删除成功', () => {
      mmdata.deleteOne('0-1')
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
      const d = mmdata.moveChild('0-3', '0-2')
      expect(d?.parent?.id).toBe('0-2')
      expect(d?.id).toBe('0-2-0')
      expect(d?.children[0].depth).toBe(3)
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
      const d = mmdata.moveSibling('0-4-0', '0-4-3')
      expect(d).toBeNull()
    })

    it('左边移到右边', () => {
      const d = mmdata.moveSibling('0-3', '0-1')
      expect(d?.left).toBeFalsy()
      expect(d?.id).toBe('0-1')
      expect(d).toMatchSnapshot()
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
      const d = mmdata.collapse('0-2-4')
      expect(d?.collapse).toBeTruthy()
      expect(d).toMatchSnapshot()
    })
  })

  describe('给目标节点添加新兄弟节点', () => {
    it('添加成功', () => {
      const d = mmdata.addSibling('0-2-0', '新兄弟节点')
      expect(d?.id).toBe('0-2-1')
      expect(d?.name).toBe('新兄弟节点')
      expect(d).toMatchSnapshot()
    })
  })

  describe('给目标节点添加新父节点', () => {
    it('添加成功', () => {
      const d = mmdata.addParent('0-0', '新父节点')
      expect(d?.id).toBe('0-0')
      expect(d?.name).toBe('新父节点')
      expect(d?.children[0].depth).toBe(2)
      expect(d?.color).toBe(d?.children[0].color)
      expect(d).toMatchSnapshot()
    })
  })

  describe('变更目标节点的左右布局', () => {
    it('变更成功', () => {
      const d = mmdata.changeLeft('0-0')
      expect(d?.left).toBe(true)
    })
  })
})
