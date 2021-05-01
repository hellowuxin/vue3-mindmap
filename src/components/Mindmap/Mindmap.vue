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
    <div v-if="timetravel" :class="[style['button-list'], style['right-top']]">
      <button @click="prev" :class="{ [style['disabled']]: !hasPrev }"><i :class="style['prev']"></i></button>
      <button @click="next" :class="{ [style['disabled']]: !hasNext }"><i :class="style['next']"></i></button>
    </div>
    <contextmenu
      v-if="contextmenu"
      :position="contextmenuPos"
      :groups="menu"
      @click-item="onClickMenu"
    ></contextmenu>
  </div>
</template>

<script lang="ts">
import emitter from '@/mitt'
import { computed, defineComponent, onMounted, PropType, watch, watchEffect } from 'vue'
import { Data, Mdata, TspanData, SelectionG, TwoNumber } from './interface'
import style from './css/Mindmap.module.scss'
import * as d3 from './d3'
import { ImData, mmdata } from './data'
import { snapshot, updateTimeTravelState, hasNext, hasPrev } from './state'
import { convertToImg, makeTransition, getDragContainer, getSize, moveNode } from './tool'
import { getDataId, getTspanData, attrG, attrTspan, attrPath, attrA, getSiblingGClass, attrText } from './attribute'
import { xGap, yGap, branch, scaleExtent, ctm, zoom, selection, observer, changeSharpCorner } from './variable'
import { wrapperEle, svgEle, gEle, asstSvgEle, foreignEle, foreignDivEle  } from './variable/element'
import { appendAddBtn, appendExpandBtn, appendTspan, updateTspan } from './draw'
import { onMouseEnter, onMouseLeave, onSelect, onDragMove, onEdit, switchZoom, switchEdit, switchSelect, switchContextmenu } from './feature'
import Contextmenu from '../Contextmenu.vue'
import { cloneDeep } from 'lodash'

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
    // 绘制所需的变量
    xGap: { type: Number, default: xGap },
    yGap: { type: Number, default: yGap },
    branch: {
      type: Number,
      default: branch,
      validator: (val: number) => val >= 1 && val <= 6 
    },
    scaleExtent: {
      type: Object as PropType<TwoNumber>,
      default: scaleExtent
    },
    sharpCorner: Boolean,
    // 操作许可
    centerBtn: Boolean,
    fitBtn: Boolean,
    downloadBtn: Boolean,
    timetravel: Boolean,
    addNodeBtn: Boolean,
    edit: Boolean,
    drag: Boolean,
    keyboard: Boolean,
    contextmenu: Boolean,
    zoom: Boolean,
  },
  setup (props, context) {
    // 立即执行
    watchEffect(() => emitter.emit('scale-extent', props.scaleExtent))
    watchEffect(() => emitter.emit('branch', props.branch))
    watchEffect(() => emitter.emit('sharp-corner', props.sharpCorner))
    watchEffect(() => emitter.emit('gap', { xGap: props.xGap, yGap: props.yGap }))
    // 变量
    const addNodeBtn = computed(() => props.edit && props.addNodeBtn)
    const drag = d3.drag<SVGGElement, Mdata>().container(getDragContainer).on('drag', onDragMove).on('end', onDragEnd)

    onMounted(() => {
      if (!svgEle.value || !gEle.value || !asstSvgEle.value || !foreignEle.value || !foreignDivEle.value) { return }
      emitter.emit('selection-svg', d3.select(svgEle.value))
      emitter.emit('selection-g', d3.select(gEle.value))
      emitter.emit('selection-asstSvg', d3.select(asstSvgEle.value).attr('width', 0).attr('height', 0))
      emitter.emit('selection-foreign',d3.select(foreignEle.value))
      observer.observe(foreignDivEle.value)
      emitter.emit('mmdata', new ImData(cloneDeep(props.modelValue[0]), xGap, yGap, getSize))

      changeSharpCorner.value = false
      afterOperation()
      const { svg, foreign } = selection
      foreign?.raise()
      foreignDivEle.value.addEventListener('blur', onEditBlur)
      foreignDivEle.value.addEventListener('mousedown', (e: MouseEvent) => e.stopPropagation())
      centerView()
      fitView()
      // mousedown与drag/zoom绑定的先后顺序会有影响
      svg?.on('mousedown', () => {
        const oldSele = document.getElementsByClassName(style.selected)[0]
        oldSele?.classList.remove(style.selected)
      })
      switchZoom(props.zoom)
      switchContextmenu(props.contextmenu)
    })
    // watch
      watch(() => [props.branch, addNodeBtn.value, props.sharpCorner], () => {
        draw()
        changeSharpCorner.value = false
      })
      watch(() => [props.xGap, props.yGap], (val) => {
        mmdata.setBoundingBox(val[0], val[1])
        draw()
      })
      watch(() => [props.drag, props.edit], (val) => {
        switchSelect(val[0] || val[1])
        switchDrag(val[0])
        switchEdit(val[1])
      })
      watch(() => props.zoom, (val) => switchZoom(val))
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
        const text = gText.append('text')
        attrText(text)
        const tspan = text.selectAll('tspan').data(getTspanData).enter().append('tspan')
        attrTspan(tspan)
        // 绘制添加按钮
        let gAddBtn
        if (addNodeBtn.value) { gAddBtn = appendAndBindAddBtn(gContent) }
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
        const text = gText.select<SVGTextElement>('text')
        attrText(text)
        text.selectAll<SVGTSpanElement, TspanData>('tspan')
          .data(getTspanData)
          .join(appendTspan, updateTspan, exit => exit.remove())
        let gAddBtn = gContent.select<SVGGElement>(`g.${style['add-btn']}`)
        let gExpandBtn = gContent.select<SVGGElement>(`g.${style['expand-btn']}`)
        if (addNodeBtn.value) {
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
      const draw = (d = [mmdata.data], sele = selection.g as d3.Selection<SVGGElement, any, any, any>) => {
        const temp = sele.selectAll<SVGGElement, Mdata>(`g.${getSiblingGClass(d[0]).join('.')}`)
        temp.data(d, (d) => d.gKey).join(appendNode, updateNode)
      }
    // 其他
      const bindEvent = (g: SelectionG, isRoot: boolean) => {
        const gExpandBtn = g.select(`:scope > g.${style.content} > g.${style['expand-btn']}`)
        gExpandBtn.on('click', onClickExpandBtn)
        if (props.drag || props.edit) {
          const gText = g.select<SVGGElement>(`:scope > g.${style.content} > g.${style.text}`)
          gText.on('mousedown', onSelect)
          if (props.drag && !isRoot) { drag(gText) }
          if (props.edit) { gText.on('click', onEdit) }
        }
        if (addNodeBtn.value) {
          g.select<SVGGElement>(`:scope > g.${style.content}`)
            .on('mouseenter', onMouseEnter)
            .on('mouseleave', onMouseLeave)
        }
      }
    // 监听事件
      /**
       * @param this gText
       */
      function onDragEnd (this: SVGGElement, e: d3.D3DragEvent<SVGGElement, Mdata, Mdata>, d: Mdata) {
        const gNode = this.parentNode?.parentNode as SVGGElement
        if (svgEle.value) { svgEle.value.classList.remove(style.dragging) }
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
        // 判断是否变换left
        const xToCenter = d.x - mmdata.getRootWidth() / 2
        const lr = d.depth === 1 && (xToCenter * (xToCenter + d.px) < 0)
        const getSameSide = lr ? (a: Mdata) => a.left !== d.left : (a: Mdata) => a.left === d.left
        // 判断是否需要调换节点顺序
        const p = gNode.parentNode as SVGGElement
        let downD = lr ? { y: Infinity, id: d.id } : d
        let upD = lr ? { y: -Infinity, id: d.id } : d
        const brothers = d3.select<SVGGElement, Mdata>(p)
          .selectAll<SVGGElement, Mdata>(`g.${getSiblingGClass(d).join('.')}`)
          .filter((a) => a !== d && getSameSide(a))
        const endY = d.y + d.py
        brothers.each((b) => {
          if ((lr || b.y > d.y) && b.y < endY && b.y > upD.y) { upD = b } // 找新哥哥节点
          if ((lr || b.y < d.y) && b.y > endY && b.y < downD.y) { downD = b } // 找新弟弟节点
        })
        if (downD.id !== d.id) {
          d.px = 0
          d.py = 0
          moveSibling(d.id, downD.id)
          return
        } else if (upD.id !== d.id) {
          d.px = 0
          d.py = 0
          moveSibling(d.id, upD.id, 1)
          return
        }
        // 复原
        moveNode(gNode, d, [0, 0], 500)
      }
      const onEditBlur = () => {
        document.getElementsByClassName(style.edited)[0]?.classList.remove(style.edited, style.selected)

        if (foreignEle.value && foreignDivEle.value) {
          foreignEle.value.style.display = 'none'
          const id = foreignEle.value.getAttribute('data-id')
          const oldname = foreignEle.value.getAttribute('data-name')
          const name = foreignDivEle.value.textContent
          if (id && name !== null && name !== oldname) {
            rename(id, name)
          }
        }
      }
      /**
       * 添加子节点并进入编辑模式
       */
      const addAndEdit = (e: MouseEvent, d: Mdata) => {
        const child = add(d.id, '')
        const { g } = selection
        if (!g || !child) { return }
        const gText = g.selectAll<SVGGElement, Mdata>(`g[data-id='${getDataId(child)}'] g.${style.text}`)
        const node = gText.node()

        if (node) {
          emitter.emit('edit-flag', true)
          onEdit.call(node, e, child)
        }
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
        } else if (name === 'collapse') {
          const sele = d3.select<SVGGElement, Mdata>(`.${style.selected}`)
          const seleData = sele.data()[0]
          collapse(seleData.id)
        } else if (name === 'expand') {
          const sele = d3.select<SVGGElement, Mdata>(`.${style.selected}`)
          const seleData = sele.data()[0]
          expand(seleData.id)
        }
      }
      const onClickExpandBtn = (e: MouseEvent, d: Mdata) => {
        expand(d.id)
      }
    // 功能开关
      const switchDrag = (draggable: boolean) => {
        const { g } = selection
        if (!g) { return }
        const gText = g.selectAll<SVGGElement, Mdata>(`g.node:not(.${style.root}) > g > g.${style.text}`)
        if (draggable) {
          drag(gText)
        } else {
          gText.on('.drag', null)
        }
      }
    // 数据操作
      const afterOperation = (snap = true) => { 
        if (snap) { snapshot.snap(mmdata.data) }
        context.emit('update:modelValue', cloneDeep([mmdata.data.rawData]))
        updateTimeTravelState()
        draw()
      }
      const rename = (id: string, name: string) => {
        mmdata.rename(id, name)
        afterOperation()
      }
      const moveChild = (pid: string, id: string) => {
        mmdata.moveChild(pid, id)
        afterOperation()
      }
      const moveSibling = (id: string, referenceId: string, after = 0) => {
        mmdata.moveSibling(id, referenceId, after)
        afterOperation()
      }
      const add = (id: string, name: string) => {
        const d = mmdata.add(id, name)
        afterOperation()
        return d
      }
      const del = (id: string) => {
        mmdata.delete(id)
        afterOperation()
      }
      const expand = (id: string) => {
        mmdata.expand(id)
        afterOperation()
      }
      const collapse = (id: string) => {
        mmdata.collapse(id)
        afterOperation()
      }
    // 辅助按钮的点击事件
      const centerView = () => {
        const { svg } = selection
        if (!svg) { return }
        const data = mmdata.data
        zoom.translateTo(svg, 0 + data.width / 2, 0 + data.height / 2)
      }
      /**
       * 缩放至合适大小并移动至全部可见
       */
      const fitView = () => {
        const { svg } = selection
        if (!svg || !gEle.value || !svgEle.value) { return }
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
        zoom.transform(svg, center)
      }
      /**
       * 按一定程度缩放
       * @param flag - 为true时放大，false缩小
       */
      const scaleView = (flag: boolean) => {
        const { svg } = selection
        if (!svg) { return }
        zoom.scaleBy(svg, flag ? 1.1 : 0.9)
      }
      const download = () => {
        if (!wrapperEle.value) { return }
        convertToImg(wrapperEle.value, mmdata.data.name)
      }
      const next = () => {
        const nextData = snapshot.next()
        if (nextData) {
          mmdata.data = nextData
          afterOperation(false)
        }
      }
      const prev = () => {
        const prevData = snapshot.prev()
        if (prevData) {
          mmdata.data = prevData
          afterOperation(false)
        }
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
      menu: ctm.menu,
      contextmenuPos: ctm.pos,
      onClickMenu,
      next,
      prev,
      hasPrev,
      hasNext
    }
  }
})
</script>
