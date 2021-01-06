<template>
  <div :class="style['container']">
    <svg :class="style['svg']" ref="svgEle">
      <g ref="gEle"></g>
    </svg>
    <svg ref="asstSvgEle"></svg>
    <div :class="[style['button-list'], style['right-bottom']]">
      <button v-if="centerBtn" @click="centerView()"><i :class="style['gps']"></i></button>
      <button v-if="fitBtn" @click="fitView()"><i :class="style['fit']"></i></button>
      <button v-if="downloadBtn" @click="showPopUps=true"><i class="download"></i></button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, PropType, Ref, ref, watch } from 'vue'
import { Data, Mdata } from '@/interface'
import style from './Mindmap.module.scss'
import { d3, ImData } from '@/tools'
import { D3ZoomEvent } from 'd3-zoom'

export default defineComponent({
  name: 'Mindmap',
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
      default: 4
    },
    centerBtn: Boolean,
    fitBtn: Boolean,
    downloadBtn: Boolean,
    undoBtn: Boolean,
    edit: Boolean,
    keyboard: Boolean,
    showNodeAdd: Boolean,
    contextMenu: Boolean,
    zoom: Boolean,
    draggable: Boolean
  },
  setup (props) {
    const svgEle: Ref<SVGSVGElement | undefined> = ref()
    const gEle: Ref<SVGGElement | undefined> = ref()
    const asstSvgEle: Ref<SVGSVGElement | undefined> = ref()
    const svg: Ref<d3.Selection<SVGSVGElement, null, null, undefined> | undefined> = ref()
    const g: Ref<d3.Selection<SVGGElement, null, null, undefined> | undefined> = ref()
    const asstSvg: Ref<d3.Selection<SVGSVGElement, unknown, null, undefined> | undefined> = ref()
    const zoom = d3.zoom<SVGSVGElement, null>().on('zoom', (e: D3ZoomEvent<SVGSVGElement, null>) => {
      if (!g.value) { return }
      g.value.attr('transform', e.transform.toString())
    }).scaleExtent([0.1, 8])
    const link = d3.linkHorizontal().source((d) => d.source).target((d) => d.target)
    let mmdata: ImData

    onMounted(() => {
      if (!svgEle.value || !gEle.value || !asstSvgEle.value) { return }
      svg.value = d3.select(svgEle.value)
      g.value = d3.select(gEle.value)
      asstSvg.value = d3.select(asstSvgEle.value).attr('width', 0).attr('height', 0)

      mmdata = new ImData(
        JSON.parse(JSON.stringify(props.modelValue[0])),
        props.xGap,
        props.yGap,
        getSize
      )

      draw()
      centerView()
      fitView()

      makeZoom(props.zoom)
      makeEdit(props.edit)
    })
    // watch
    watch(() => props.branch, () => { draw() })
    watch(() => [props.xGap, props.yGap], (val) => {
      mmdata.setBoundingBox(val[0], val[1])
      draw()
    })
    watch(() => props.zoom, (val) => { makeZoom(val) })
    // 每个属性的计算方法
    const getGKey = (d: Mdata) => { return d.gKey }
    const getGClass = (d: Mdata) => {
      const arr = [`depth-${d.depth}`]
      if (d.depth === 0) { arr.push(style.root) }
      return arr
    }
    const getGTransform = (d: Mdata) => { return `translate(${d.dx},${d.dy})` }
    const getColor = (d: Mdata) => { return d.color }
    const getPath = (d: Mdata) => {
      let dpw = 0
      let dph = 0
      if (d.parent) {
        dpw = d.parent.width
        dph = d.parent.height
        if (d.parent.depth === 0) {
          dpw /= 2
          dph /= 2
        }
      }
      const temp = props.branch / 2
      const source = [-d.dx + dpw, -d.dy + dph + temp] as [number, number]
      const target = [0, d.height + temp] as [number, number]
      return `${link({ source, target })}L${d.width},${target[1]}`
    }
    const getTspanData = (d: Mdata) => {
      const multiline = d.name.split('\n')
      const height = d.height / multiline.length
      return multiline.map((name) => ({ name, height }))
    }
    const getDataId = (d: Mdata) => { return d.id }
    // 每个图形的绘制方法
    const attrG = (g: d3.Selection<SVGGElement, Mdata, SVGGElement, Mdata | null>) => {
      return g.attr('class', (d) => getGClass(d).join(' ')).attr('transform', getGTransform).attr('data-id', getDataId)
    }
    const attrTspan = (tspan: d3.Selection<SVGTSpanElement, { name: string, height: number }, SVGTextElement, Mdata>) => {
      return tspan.attr('alignment-baseline', 'before-edge')
        .text((d) => d.name)
        .attr('x', 0)
        .attr('dy', (d, i) => i ? d.height : 0)
    }
    const attrRootRect = (rect: d3.Selection<SVGRectElement, Mdata, SVGGElement, Mdata | null>) => {
      return attrRect(rect, 10, 6)
    }
    const attrPath = (p: d3.Selection<SVGPathElement, Mdata, SVGGElement, Mdata | null>) => {
      return p.attr('d', getPath).attr('stroke', getColor).attr('stroke-width', props.branch)
    }
    const attrRect = (rect: d3.Selection<SVGRectElement, Mdata, SVGGElement, Mdata | null>, rectPadding = props.branch + 3, radius = 4) => {
      return rect.attr('x', -rectPadding)
        .attr('y', -rectPadding)
        .attr('rx', radius)
        .attr('ry', radius)
        .attr('width', (d) => d.width + rectPadding * 2)
        .attr('height', (d) => d.height + rectPadding * 2)
    }
    // 绘制节点的方法
    const appendNode = (enter: d3.Selection<d3.EnterElement, Mdata, SVGGElement, Mdata | null>) => {
      const isRoot = !enter.data()[0]?.depth
      const enterG = attrG(enter.append('g'))
      const gText = enterG.append('g').attr('class', 'text')
      if (isRoot) {
        attrRootRect(gText.append('rect'))
      } else {
        attrRect(gText.append('rect'))
      }
      const tspan = gText.append('text').selectAll('tspan').data(getTspanData).enter().append('tspan')
      attrTspan(tspan)
      attrPath(enterG.append('path'))

      enterG.each((d, i) => {
        if (!d.children) { return }
        draw(d.children, enterG.filter((a, b) => i === b))
      })
      gText.raise()
      return enterG
    }
    const updateNode = (update: d3.Selection<SVGGElement, Mdata, SVGGElement, Mdata | null>) => {
      const isRoot = !update.data()[0]?.depth
      const gClass = getGClass(update.data()[0] || {}).join('.')
      attrG(update)
      const gText = update.select<SVGGElement>(`g.${gClass} > g.text`)
      if (isRoot) {
        attrRootRect(gText.select('rect'))
      } else {
        attrRect(gText.select('rect'))
      }
      attrTspan(gText.select<SVGTextElement>('text').selectAll('tspan'))
      attrPath(update.selectAll<SVGPathElement, Mdata>(`g.${gClass} > path`))

      update.each((d, i) => {
        if (!d.children) { return }
        draw(d.children, update.filter((a, b) => i === b))
      })
      return update
    }
    // const exitNode = (exit: any) => {
    //   return exit
    // }
    // 其他
    const draw = (d = [mmdata.data], sele = g.value as d3.Selection<SVGGElement, any, any, any>) => {
      const temp = sele.selectAll<SVGGElement, Mdata>(`g.${getGClass(d[0]).join('.')}`)
      temp.data(d, getGKey).join(appendNode, updateNode)
    }
    const getSize = (text: string): { width: number, height: number } => {
      if (!asstSvg.value) { throw new Error('asstSvg undefined') }
      const multiline = text.split('\n')
      const t = asstSvg.value.append('text')
      t.selectAll('tspan')
        .data(multiline)
        .enter()
        .append('tspan')
        .text((d) => d)
        .attr('x', 0)
      const tBox = (t.node() as SVGTextElement).getBBox()
      t.remove()
      // console.log(multiline, tBox)
      return { width: tBox.width, height: tBox.height * multiline.length }
    }
    const centerView = () => {
      if (!svg.value) { return }
      const { data } = mmdata
      zoom.translateTo(svg.value, 0 + data.width / 2, 0 + data.height / 2)
    }
    const fitView = () => { // 缩放至合适大小并移动至全部可见
      // bug: 缩放后的大小与容器不一致
      if (!svg.value || !gEle.value || !svgEle.value) { return }
      const gBB = gEle.value.getBBox()
      const svgBCR = svgEle.value.getBoundingClientRect()
      const multiple = Math.min(svgBCR.width / gBB.width, svgBCR.height / gBB.height)
      const t = d3.zoomIdentity.scale(multiple).translate(-gBB.x, -gBB.y)
      zoom.transform(svg.value, t)
    }
    // 插件
    const makeZoom = (zoomable: boolean) => {
      if (!svg.value) { return }
      if (zoomable) {
        zoom(svg.value)
      } else {
        svg.value.on('.zoom', null)
      }
    }
    const makeEdit = (editable: boolean) => {
      if (editable && g.value) {
        g.value.selectAll<SVGGElement, Mdata>('g.text').on('mousedown', (e: MouseEvent, d) => {
          const ele = document.querySelector(`g[data-id='${getDataId(d)}']`)
          const s = document.querySelector(`.${style.selected}`)
          if (s) {
            s.classList.remove(style.selected)
          }
          if (ele) {
            ele.classList.add(style.selected)
          }
          console.log('click', d.name, ele)
        })
      }
    }

    return {
      svgEle,
      gEle,
      style,
      asstSvgEle,
      centerView,
      fitView
    }
  }
})
</script>

<style>

</style>
