import * as d3 from './d3'
import ImData from './ImData'

export { d3, ImData }
/**
 * 使页面重排
 * @param ele Element
 */
export const reflow = (ele: Element): number => ele.clientHeight
/**
 * 获取一个加号图形的path路径，图形的中心坐标为（0，0）
 * @param stroke 线条的粗细
 * @param side 图形的边长
 */
export const getAddPath = (stroke: number, side: number): string => {
  const temp0 = -side / 2
  const temp1 = -stroke / 2
  const temp2 = stroke / 2
  const temp3 = side / 2
  return `M${temp3},${temp2}H${temp2}V${temp3}H${temp1}V${temp2}H${temp0}V${temp1}H${temp1}V${temp0}H${temp2}V${temp1}H${temp3}V${temp2}Z`
}
/**
 * 将一个字符串按换行符切分，返回字符串数组
 * @param str 字符串
 */
export const getMultiline = (str: string): string[] => {
  const multiline = str.split('\n')
  if (multiline.length > 2 && multiline[multiline.length - 1] === '') {
    multiline.pop()
  }
  return multiline
}
