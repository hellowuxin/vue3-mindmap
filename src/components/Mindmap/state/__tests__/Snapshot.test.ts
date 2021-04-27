import Snapshot from '../Snapshot'

describe('时间旅行测试', () => {
  const snapshot = new Snapshot<number>()

  it('记录1，此时不能撤销，不能重做，撤销返回null，重做返回null', () => {
    snapshot.snap(1)
    expect(snapshot.hasPrev).toBe(false)
    expect(snapshot.hasNext).toBe(false)
    expect(snapshot.prev()).toBeNull()
    expect(snapshot.next()).toBeNull()
  })

  it('记录2，此时能撤销', () => {
    snapshot.snap(2)
    expect(snapshot.hasPrev).toBe(true)
  })

  it('撤销，返回1，此时能重做', () => {
    const prev = snapshot.prev()
    expect(prev).toBe(1)
    expect(snapshot.hasNext).toBe(true)
  })

  it('重做，返回2', () => {
    const next = snapshot.next()
    expect(next).toBe(2)
  })
})