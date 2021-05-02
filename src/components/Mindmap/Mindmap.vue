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
import { defineComponent, onMounted, PropType, watch, watchEffect } from 'vue'
import { Data, TwoNumber } from './interface'
import style from './css'
import * as d3 from './d3'
import { afterOperation, ImData, mmdata } from './data'
import { hasNext, hasPrev } from './state'
import { fitView, getSize, centerView, next, prev, download } from './assistant'
import { xGap, yGap, branch, scaleExtent, ctm, selection, observer, changeSharpCorner, addNodeBtn, mmprops } from './variable'
import { wrapperEle, svgEle, gEle, asstSvgEle, foreignEle, foreignDivEle  } from './variable/element'
import { draw } from './draw'
import { switchZoom, switchEdit, switchSelect, switchContextmenu, onEditBlur, switchDrag, onClickMenu } from './listener'
import Contextmenu from '../Contextmenu.vue'
import { cloneDeep } from 'lodash'

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
    watchEffect(() => emitter.emit('mindmap-context', context))
    watchEffect(() => addNodeBtn.value = props.edit && props.addNodeBtn)
    watchEffect(() => mmprops.drag = props.drag)
    watchEffect(() => mmprops.edit = props.edit)
    // onMounted
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
