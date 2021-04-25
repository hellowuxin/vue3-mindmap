<template>
  <div :class="style['container']">
    <div :id="style['svg-wrapper']" ref="wrapperEle">
      <svg :class="style['svg']" ref="svgEle">
        <g ref="gEle">
          <foreignObject ref="foreignEle" style="display: none">
            <div ref="foreignDivEle" contenteditable></div>
          </foreignObject>
        </g>
      </svg>
    </div>
    <svg ref="asstSvgEle"></svg>
    <div :class="[style['button-list'], style['right-bottom']]">
      <button v-if="centerBtn" @click="centerView()"><i :class="style['gps']"></i></button>
      <button v-if="fitBtn" @click="fitView()"><i :class="style['fit']"></i></button>
      <button v-if="downloadBtn" @click="download()"><i :class="style['download']"></i></button>
    </div>
    <contextmenu
      v-if="contextmenu"
      :position="contextmenuPos"
      :groups="showViewMenu ? viewMenu : nodeMenu"
      @click-item="onClickMenu"
    ></contextmenu>
  </div>
</template>

<script lang="ts">
import emitter from '@/mitt'
import { computed, defineComponent, onMounted, PropType, Ref, ref, watch } from 'vue'
import { Data, Mdata, TspanData, SelectionG, TwoNumber } from './interface'
import style from './css/Mindmap.module.scss'
import * as d3 from './d3'
import { ImData } from './data'
import { getMultiline, convertToImg, makeTransition, getDragContainer, getRelativePos } from './tool'
import { getGClass, getGTransform, getDataId, getTspanData, attrG, attrTspan, getPath, attrPath, attrA } from './attribute'
import { textRectPadding } from './variable'
import { appendAddBtn, appendExpandBtn, appendTspan, updateTspan } from './draw'
import { onMouseEnter, onMouseLeave } from './Listener'
import Contextmenu from '../Contextmenu.vue'

type MenuEvent = 'zoomin' | 'zoomout' | 'zoomfit' | 'add' | 'delete' | 'selectall' | 'collapse' | 'expand'

export default defineComponent({
  name: 'Mindmap',
  components: {
    Contextmenu
  },
  props: {
    modelValue: {
      type: Array as PropType<Data[]>,
      required: true
    },
    width: Number,
    height: Number,
    xGap: {
      type: Number,
      default: 50
    },
    yGap: {
      type: Number,
      default: 18
    },
    branch: {
      type: Number,
      default: 4,
      validator: (val: number) => val >= 1 && val <= 6 
    },
    scaleExtent: {
      default: (): TwoNumber => [0.1, 8]
    },
    centerBtn: Boolean,
    fitBtn: Boolean,
    downloadBtn: Boolean,
    undoBtn: Boolean,
    addNodeBtn: Boolean,
    edit: Boolean,
    drag: Boolean,
    keyboard: Boolean,
    contextmenu: Boolean,
    zoom: Boolean,
    sharpCorner: Boolean,
  },
  setup (props) {
    // 变量
      let zoomTransform: Ref<d3.ZoomTransform> = ref(d3.zoomIdentity)
      const contextmenuPos = ref({ left: 0, top: 0 })
      const wrapperEle: Ref<HTMLDivElement | undefined> = ref()
      const svgEle: Ref<SVGSVGElement | undefined> = ref()
      const gEle: Ref<SVGGElement | undefined> = ref()
      const asstSvgEle: Ref<SVGSVGElement | undefined> = ref()
      const foreignEle: Ref<SVGForeignObjectElement | undefined> = ref()
      const foreignDivEle: Ref<HTMLDivElement | undefined> = ref()
      const svg: Ref<d3.Selection<SVGSVGElement, null, null, undefined> | undefined> = ref()
      const g: Ref<d3.Selection<SVGGElement, null, null, undefined> | undefined> = ref()
      const asstSvg: Ref<d3.Selection<SVGSVGElement, unknown, null, undefined> | undefined> = ref()
      const foreign: Ref<d3.Selection<SVGForeignObjectElement, null, null, undefined> | undefined> = ref()
      const zoom = d3.zoom<SVGSVGElement, null>().on('zoom', onZoomMove).scaleExtent(props.scaleExtent)
      const drag = d3.drag<SVGGElement, Mdata>().container(getDragContainer).on('drag', onDragMove).on('end', onDragEnd)
      const observer = new ResizeObserver((arr: any) => {
        if (!foreign.value) { return }
        const temp = arr[0]
        const target = temp.target
        const pl = parseInt(getComputedStyle(target).paddingLeft || '0', 10)
        const b = parseInt(getComputedStyle(target.parentNode as Element).borderTopWidth || '0', 10)
        const gap = (pl + b) * 2
        foreign.value.attr('width', temp.contentRect.width + gap).attr('height', temp.contentRect.height + gap)
      })
      let mmdata: ImData
      let editFlag = false
      const showAddNodeBtn = ref(true)
      const viewMenu = computed(() => [
        [
          {
            title: '放大',
            name: 'zoomin',
            disabled: zoomTransform.value.k >= props.scaleExtent[1] 
          },
          {
            title: '缩小',
            name: 'zoomout',
            disabled: zoomTransform.value.k <= props.scaleExtent[0]
          },
          { title: '缩放至合适大小', name: 'zoomfit', disabled: false }
        ],
        [
          { title: '全选', name: 'selectall', disabled: true }
        ]
      ])
      const nodeMenu = [
        [
          { title: '新建子节点', name: 'add', disabled: false }
        ],
        [
          { title: '删除节点', name: 'delete', disabled: false }
        ],
        [
          { title: '全选', name: 'selectall', disabled: true }
        ],
        [
          { title: '折叠节点', name: 'collapse', disabled: true },
          { title: '展开节点', name: 'expand', disabled: true }
        ]
      ]
      const showViewMenu = ref(true)

    onMounted(() => {
      if (!svgEle.value || !gEle.value || !asstSvgEle.value || !foreignEle.value || !foreignDivEle.value) { return }
      svg.value = d3.select(svgEle.value)
      g.value = d3.select(gEle.value)
      asstSvg.value = d3.select(asstSvgEle.value).attr('width', 0).attr('height', 0)
      foreign.value = d3.select(foreignEle.value)
      observer.observe(foreignDivEle.value)

      mmdata = new ImData(
        JSON.parse(JSON.stringify(props.modelValue[0])),
        props.xGap,
        props.yGap,
        getSize
      )

      draw()
      foreign.value.raise()
      foreignDivEle.value.addEventListener('blur', onEditBlur)
      foreignDivEle.value.addEventListener('mousedown', (e: MouseEvent) => e.stopPropagation())
      centerView()
      fitView()
      // mousedown与drag/zoom绑定的先后顺序会有影响
      svg.value.on('mousedown', () => {
        const oldSele = document.getElementsByClassName(style.selected)[0]
        oldSele?.classList.remove(style.selected)
      })
      switchZoom(props.zoom)
      switchContextmenu(props.contextmenu)
    })
    // watch
      watch(() => props.branch, (value) => emitter.emit('branch', value), { immediate: true })
      watch(() => props.sharpCorner, (val) => {
        emitter.emit('sharp-corner', val)
        draw()
      })
      watch(() => [props.branch, props.addNodeBtn], () => draw())
      watch(() => [props.xGap, props.yGap], (val) => {
        emitter.emit('gap', val)
        mmdata.setBoundingBox(val[0], val[1])
        draw()
      })
      watch(() => [props.drag, props.edit], (val) => {
        switchSelect(val[0] || val[1])
        switchDrag(val[0])
        switchEdit(val[1])
      })
      watch(() => props.zoom, (val) => switchZoom(val))
      watch(showAddNodeBtn, (val) => {
        g.value?.selectAll(`g.${style['add-btn']}`).style('display', val ? '' : 'none')
      })
      watch(() => props.contextmenu, (val) => switchContextmenu(val))
    //
    const appendAndBindAddBtn = (g: SelectionG) => {
      const gAddBtn = appendAddBtn(g)
      gAddBtn.on('click', addAndEdit)
      return gAddBtn
    }
    // 绘制节点的方法
      const appendNode = (enter: d3.Selection<d3.EnterElement, Mdata, SVGGElement, Mdata | null>) => {
        const isRoot = !enter.data()[0]?.depth
        const enterG = enter.append('g')
        attrG(enterG)
        // 绘制线
        attrPath(enterG.append('path'))
        // 节点容器
        const gContent = enterG.append('g').attr('class', style.content)
        const gTrigger = gContent.append('rect')
        // 绘制文本
        const gText = gContent.append('g').attr('class', style.text)
        const gTextRect = gText.append('rect')
        const tspan = gText.append('text').selectAll('tspan').data(getTspanData).enter().append('tspan')
        attrTspan(tspan)
        // 绘制添加按钮
        let gAddBtn
        if (props.addNodeBtn) { gAddBtn = appendAndBindAddBtn(gContent) }
        // 绘制折叠按钮
        const gExpandBtn = appendExpandBtn(gContent)

        attrA(isRoot, gTrigger, gTextRect, gExpandBtn, gAddBtn)

        bindEvent(enterG, isRoot)

        enterG.each((d, i) => {
          if (!d.children) { return }
          draw(d.children, enterG.filter((a, b) => i === b))
        })
        gContent.raise()
        return enterG
      }
      const updateNode = (update: SelectionG) => {
        const isRoot = !update.data()[0]?.depth
        const tran = makeTransition(500, d3.easePolyOut)
        attrG(update, tran)
        attrPath(update.select<SVGPathElement>(':scope > path'), tran)
        const gContent = update.select<SVGGElement>(`:scope > g.${style.content}`)
        const gTrigger = gContent.select<SVGRectElement>(':scope > rect')
        const gText = gContent.select<SVGGElement>(`g.${style.text}`)
        const gTextRect = gText.select<SVGRectElement>('rect')
        gText.select<SVGTextElement>('text').selectAll<SVGTSpanElement, TspanData>('tspan')
          .data(getTspanData)
          .join(appendTspan, updateTspan, exit => exit.remove())
        let gAddBtn = gContent.select<SVGGElement>(`g.${style['add-btn']}`)
        let gExpandBtn = gContent.select<SVGGElement>(`g.${style['expand-btn']}`)
        if (props.addNodeBtn) {
          if (!gAddBtn.node()) { gAddBtn = appendAndBindAddBtn(gContent) }
        } else {
          gAddBtn.remove()
        }

        attrA(isRoot, gTrigger, gTextRect, gExpandBtn, gAddBtn)

        update.each((d, i) => {
          if (!d.children) { return }
          draw(d.children, update.filter((a, b) => i === b))
        })
        gContent.raise()
        return update
      }
    // 其他
      const draw = (d = [mmdata.data], sele = g.value as d3.Selection<SVGGElement, any, any, any>) => {
        const temp = sele.selectAll<SVGGElement, Mdata>(`g.${getGClass(d[0]).join('.')}`)
        temp.data(d, (d) => d.gKey).join(appendNode, updateNode)
      }
      const getSize = (text: string): { width: number, height: number } => {
        if (!asstSvg.value) { throw new Error('asstSvg undefined') }
        const multiline = getMultiline(text)
        const t = asstSvg.value.append('text')
        t.selectAll('tspan').data(multiline).enter().append('tspan').text((d) => d).attr('x', 0)
        const tBox = (t.node() as SVGTextElement).getBBox()
        t.remove()
        return {
          width: Math.max(tBox.width, 22),
          height: Math.max(tBox.height, 22) * multiline.length
        }
      }
      function selectGNode (d: SVGGElement): void
      function selectGNode (d: Mdata): void
      function selectGNode (d: SVGGElement | Mdata) {
        const ele = d instanceof SVGGElement ? d : document.querySelector<SVGGElement>(`g[data-id='${getDataId(d)}']`)
        const oldSele = document.getElementsByClassName(style.selected)[0]
        if (ele) {
          if (oldSele) {
            if (oldSele !== ele) {
              oldSele.classList.remove(style.selected)
              ele.classList.add(style.selected)
            } else {
              editFlag = true
            }
          } else {
            ele.classList.add(style.selected)
          }
        } else {
          throw new Error(`g[data-id='${getDataId(d as Mdata)}'] is null`)
        }
      }
      const moveNode = (node: SVGGElement, d: Mdata, p: TwoNumber, dura = 0) => {
        const tran = makeTransition(dura, d3.easePolyOut)
        d.px = p[0]
        d.py = p[1]
        d3.select<SVGGElement, Mdata>(node).transition(tran).attr('transform', getGTransform)
        d3.select<SVGPathElement, Mdata>(`g[data-id='${getDataId(d)}'] > path`)
          .transition(tran)
          .attr('d', (d) => getPath(d))
      }
      const bindEvent = (g: SelectionG, isRoot: boolean) => {
        const gExpandBtn = g.select(`:scope > g.${style.content} > g.${style['expand-btn']}`)
        gExpandBtn.on('click', onClickExpandBtn)
        if (props.drag || props.edit) {
          const gText = g.select<SVGGElement>(`:scope > g.${style.content} > g.${style.text}`)
          gText.on('mousedown', onSelect)
          if (props.drag && !isRoot) { drag(gText) }
          if (props.edit) { gText.on('click', onEdit) }
        }
        if (props.addNodeBtn) {
          g.select<SVGGElement>(`:scope > g.${style.content}`)
            .on('mouseenter', onMouseEnter)
            .on('mouseleave', onMouseLeave)
        }
      }
    // 监听事件
      function onZoomMove (e: d3.D3ZoomEvent<SVGSVGElement, null>) {
        if (!g.value) { return }
        zoomTransform.value = e.transform
        g.value.attr('transform', e.transform.toString())
      }
      /**
       * @param this gText
       */
      function onDragMove (this: SVGGElement, e: d3.D3DragEvent<SVGGElement, Mdata, Mdata>, d: Mdata) {
        const gNode = this.parentNode?.parentNode as SVGGElement
        showAddNodeBtn.value = false
        if (!g.value) { return }
        moveNode(gNode, d, [e.x - d.x, e.y - d.y])
        // 鼠标相对gEle左上角的位置
        const mousePos = d3.pointer(e, gEle.value)
        mousePos[1] += mmdata.data.y

        const temp = g.value.selectAll<SVGGElement, Mdata>('g.node').filter((other) => {
          if (other !== d && other !== d.parent && !other.id.startsWith(d.id)) {
            const rect = {
              x0: other.x - textRectPadding,
              x1: other.x + other.width + textRectPadding,
              y0: other.y - textRectPadding,
              y1: other.y + other.height + textRectPadding
            }
            return mousePos[0] > rect.x0 && mousePos[1] > rect.y0 && mousePos[0] < rect.x1 && mousePos[1] < rect.y1
          }
          return false
        })
        const old = Array.from(document.getElementsByClassName(style.outline))
        const n = temp.node()
        old.forEach((o) => { if (o !== n) { o.classList.remove(style.outline) } })
        n?.classList.add(style.outline)
      }
      /**
       * @param this gText
       */
      function onDragEnd (this: SVGGElement, e: d3.D3DragEvent<SVGGElement, Mdata, Mdata>, d: Mdata) {
        const gNode = this.parentNode?.parentNode as SVGGElement
        showAddNodeBtn.value = true
        // 判断是否找到了新的父节点
        const np = document.getElementsByClassName(style.outline)[0]
        if (np) {
          np.classList.remove(style.outline)
          const pid = np.getAttribute('data-id')
          if (pid) {
            d.px = 0
            d.py = 0
            moveChild(pid, d.id)
          } else {
            throw new Error('outline data-id null')
          }
          return
        }
        // 判断是否需要调换节点顺序
        const p = gNode.parentNode as SVGGElement
        let downD = d
        let upD = d
        const brothers = d3.select<SVGGElement, Mdata>(p).selectAll<SVGGElement, Mdata>(`g.${getGClass(d).join('.')}`).filter((a) => a !== d)
        brothers.each((b) => {
          if (b.y > d.y && b.y < (d.y + d.py) && b.y > upD.y) { upD = b } // 找新哥哥节点
          if (b.y < d.y && b.y > (d.y + d.py) && b.y < downD.y) { downD = b } // 找新弟弟节点
        })
        if (downD !== d) {
          d.px = 0
          d.py = 0
          moveSibling(d.id, downD.id)
          return
        } else if (upD !== d) {
          d.px = 0
          d.py = 0
          moveSibling(d.id, upD.id, 1)
          return
        }
        // 复原
        moveNode(gNode, d, [0, 0], 500)
      }
      /**
       * @param this gText
       */
      function onEdit (this: SVGGElement, e: MouseEvent, d: Mdata) {
        const gNode = this.parentNode?.parentNode as SVGGElement
        if (editFlag && foreign.value && foreignDivEle.value) {
          gNode.classList.add(style.edited)
          editFlag = false
          foreign.value.attr('x', d.x - 2).attr('y', d.y - mmdata.data.y - 2)
            .attr('data-id', d.id).attr('data-name', d.name).style('display', '')
          const div = foreignDivEle.value
          div.textContent = d.name
          div.focus()
          getSelection()?.selectAllChildren(div)
        }
      }
      const onEditBlur = () => {
        document.getElementsByClassName(style.edited)[0]?.classList.remove(style.edited, style.selected)

        if (foreignEle.value && foreignDivEle.value) {
          foreignEle.value.style.display = 'none'
          const id = foreignEle.value.getAttribute('data-id')
          const oldname = foreignEle.value.getAttribute('data-name')
          const name = foreignDivEle.value.textContent
          if (id && name && name !== oldname) {
            rename(id, name)
          }
        }
      }
      const onSelect = (e: MouseEvent, d: Mdata) => {
        e.stopPropagation()
        selectGNode(d)
      }
      /**
       * 添加子节点并进入编辑模式
       */
      const addAndEdit = (e: MouseEvent, d: Mdata) => {
        const child = add(d.id, '')
        if (!g.value || !child) { return }
        const gText = g.value.selectAll<SVGGElement, Mdata>(`g[data-id='${getDataId(child)}'] g.${style.text}`)
        const node = gText.node()

        if (node) {
          editFlag = true
          onEdit.call(node, e, child)
        }
      }
      const onContextmenu = (e: MouseEvent) => {
        e.preventDefault()
        if (!wrapperEle.value) { return }
        const relativePos = getRelativePos(wrapperEle.value, e)
        contextmenuPos.value = relativePos
        const eventTargets = e.composedPath() as SVGElement[]
        const gNode = eventTargets.find((et) => et.classList?.contains('node')) as SVGGElement
        if (gNode) {
          if (!gNode.classList.contains(style.selected)) { selectGNode(gNode) }
          nodeMenu[1][0].disabled = gNode.classList.contains(style.root) ? true : false
        }
        showViewMenu.value = gNode ? false : true
        emitter.emit('showContextmenu', true)
        // this.clearSelection()
      }
      const onClickMenu = (name: MenuEvent) => {
        if (name === 'zoomfit') {
          fitView()
        } else if (name === 'zoomin') {
          scaleView(true)
        } else if (name === 'zoomout') {
          scaleView(false)
        } else if (name === 'add') {
          const sele = d3.select<SVGGElement, Mdata>(`.${style.selected}`)
          const seleData = sele.data()[0]
          addAndEdit(new MouseEvent('click'), seleData)
        } else if (name === 'delete') {
          const sele = d3.select<SVGGElement, Mdata>(`.${style.selected}`)
          const seleData = sele.data()[0]
          del(seleData.id)
        }
      }
      const onClickExpandBtn = (e: MouseEvent, d: Mdata) => {
        expand(d.id)
      }
    // 功能开关
      const switchZoom = (zoomable: boolean) => {
        if (!svg.value) { return }
        if (zoomable) {
          zoom(svg.value)
          svg.value.on('dblclick.zoom', null)
        } else {
          svg.value.on('.zoom', null)
        }
      }
      const switchEdit = (editable: boolean) => {
        if (!foreignDivEle.value || !g.value) { return }
        const gText = g.value.selectAll<SVGGElement, Mdata>(`g.${style.text}`)
        if (editable) {
          gText.on('click', onEdit)
        } else {
          gText.on('click', null)
        }
      }
      const switchDrag = (draggable: boolean) => {
        if (!g.value) { return }
        const gText = g.value.selectAll<SVGGElement, Mdata>(`g.node:not(.${style.root}) > g > g.${style.text}`)
        if (draggable) {
          drag(gText)
        } else {
          gText.on('.drag', null)
        }
      }
      const switchSelect = (selectable: boolean) => {
        if (!g.value) { return }
        const gText = g.value.selectAll<SVGGElement, Mdata>(`g.${style.text}`)
        if (selectable) {
          gText.on('mousedown', onSelect)
        } else {
          gText.on('mousedown', null)
        }
      }
      const switchContextmenu = (val: boolean) => {
        if (!wrapperEle.value) { return }
        if (val) {
          wrapperEle.value.addEventListener('contextmenu', onContextmenu)
        } else {
          wrapperEle.value.removeEventListener('contextmenu', onContextmenu)
        }
      }
    // 数据操作
      const rename = (id: string, name: string) => {
        mmdata.rename(id, name)
        draw()
      }
      const moveChild = (pid: string, id: string) => {
        mmdata.moveChild(pid, id)
        draw()
      }
      const moveSibling = (id: string, referenceId: string, after = 0) => {
        mmdata.moveSibling(id, referenceId, after)
        draw()
      }
      const add = (id: string, name: string) => {
        const d = mmdata.add(id, name)
        draw()
        return d
      }
      const del = (id: string) => {
        mmdata.delete(id)
        draw()
      }
      const expand = (id: string) => {
        mmdata.expand(id)
        draw()
      }
    // 辅助按钮的点击事件
      const centerView = () => {
        if (!svg.value) { return }
        const data = mmdata.data
        zoom.translateTo(svg.value, 0 + data.width / 2, 0 + data.height / 2)
      }
      /**
       * 缩放至合适大小并移动至全部可见
       */
      const fitView = () => {
        if (!svg.value || !gEle.value || !svgEle.value) { return }
        const gBB = gEle.value.getBBox()
        const svgBCR = svgEle.value.getBoundingClientRect()
        const multiple = Math.min(svgBCR.width / gBB.width, svgBCR.height / gBB.height)
        const svgCenter = { x: svgBCR.width / 2, y: svgBCR.height / 2 }
        // after scale
        const gCenter = { x: gBB.width * multiple / 2, y: gBB.height * multiple / 2 }
        const center = d3.zoomIdentity.translate(
          -gBB.x * multiple + svgCenter.x - gCenter.x,
          -gBB.y * multiple + svgCenter.y - gCenter.y
        ).scale(multiple)
        zoom.transform(svg.value, center)
      }
      /**
       * 按一定程度缩放
       * @param flag - 为true时放大，false缩小
       */
      const scaleView = (flag: boolean) => {
        if (!svg.value) { return }
        zoom.scaleBy(svg.value, flag ? 1.1 : 0.9)
      }
      const download = () => {
        if (!wrapperEle.value) { return }
        convertToImg(wrapperEle.value, mmdata.data.name)
      }

    return {
      wrapperEle,
      svgEle,
      gEle,
      style,
      asstSvgEle,
      foreignEle,
      foreignDivEle,
      centerView,
      fitView,
      download,
      showViewMenu,
      viewMenu,
      nodeMenu,
      contextmenuPos,
      onClickMenu
    }
  }
})
</script>
