<template>
  <div :class="style['container']">
    <svg :class="style['svg']" ref="svgEle">
      <g ref="gEle"></g>
    </svg>
    <svg ref="asstSvgEle"></svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, PropType, Ref, ref, watch } from 'vue'
import { Data, Mdata } from '@/interface'
import style from './Mindmap.module.scss'
import { d3, ImData, reflow } from '@/tools'
import { D3ZoomEvent } from 'd3-zoom'

export default defineComponent({
  name: 'Mindmap',
  props: {
    width: Number,
    height: Number,
    xSpacing: {
      type: Number,
      default: 50
    },
    ySpacing: {
      type: Number,
      default: 10
    },
    branchWidth: {
      type: Number,
      default: 4
    },
    draggable: {
      type: Boolean,
      default: true
    },
    gps: {
      type: Boolean,
      default: true
    },
    fitView: {
      type: Boolean,
      default: true
    },
    download: {
      type: Boolean,
      default: true
    },
    keyboard: {
      type: Boolean,
      default: true
    },
    showNodeAdd: {
      type: Boolean,
      default: true
    },
    contextMenu: {
      type: Boolean,
      default: true
    },
    zoomable: {
      type: Boolean,
      default: true
    },
    showUndo: {
      type: Boolean,
      default: true
    },
    modelValue: {
      type: Array as PropType<Data[]>,
      required: true
    }
  },
  setup (props) {
    const svgEle: Ref<SVGSVGElement | undefined> = ref()
    const gEle: Ref<SVGGElement | undefined> = ref()
    const asstSvgEle: Ref<SVGSVGElement | undefined> = ref()
    const svg: Ref<d3.Selection<SVGSVGElement, null, null, undefined> | undefined> = ref()
    const g: Ref<d3.Selection<SVGGElement, null, null, undefined> | undefined> = ref()
    const asstSvg: Ref<d3.Selection<SVGSVGElement, unknown, null, undefined> | undefined> = ref()
    const zoom = d3.zoom<SVGSVGElement, null>()
    const link = d3.linkHorizontal().source((d) => d.source).target((d) => d.target)
    let mmdata: ImData

    onMounted(() => {
      if (!svgEle.value || !gEle.value || !asstSvgEle.value) { return }
      svg.value = d3.select(svgEle.value)
      g.value = d3.select(gEle.value)
      asstSvg.value = d3.select(asstSvgEle.value).attr('width', 0).attr('height', 0)

      mmdata = new ImData(
        JSON.parse(JSON.stringify(props.modelValue[0])),
        props.xSpacing,
        props.ySpacing,
        getSize
      )
      const { data } = mmdata
      draw()
      makeZoom()

      reflow(svgEle.value)
      zoom.translateTo(svg.value, 0 + data.width / 2, 0 + data.height / 2) // 中心
    })

    watch(() => props.branchWidth, () => { draw() })
    watch(() => [props.xSpacing, props.ySpacing], (val) => {
      mmdata.setBoundingBox(val[0], val[1])
      draw()
    })
    watch(() => props.fitView, (val) => {
      console.log(val, typeof val)
    })
    // 每个属性的计算方法
    const getGKey = (d: Mdata) => { return d.gKey }
    const getGClass = (d: Mdata) => { return `depth-${d.depth}` }
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
      const temp = props.branchWidth / 2
      const source = [-d.dx + dpw, -d.dy + dph + temp] as [number, number]
      const target = [0, d.height + temp] as [number, number]
      return `${link({ source, target })}L${d.width},${target[1]}`
    }
    const getTspanData = (d: Mdata) => {
      const multiline = d.name.split('\n')
      const height = d.height / multiline.length
      return multiline.map((name) => ({ name, height }))
    }
    // 每个图形的绘制方法
    const attrG = (g: d3.Selection<SVGGElement, Mdata, SVGGElement, Mdata | null>) => {
      return g.attr('class', getGClass).attr('transform', getGTransform)
    }
    const attrTspan = (tspan: d3.Selection<SVGTSpanElement, { name: string, height: number }, SVGTextElement, Mdata>) => {
      return tspan.attr('alignment-baseline', 'before-edge')
        .text((d) => d.name)
        .attr('x', 0)
        .attr('dy', (d, i) => i ? d.height : 0)
    }
    const attrRootRect = (rect: d3.Selection<SVGRectElement, Mdata, SVGGElement, Mdata | null>) => {
      const rectPadding = 10
      const radius = 6
      return rect.attr('x', -rectPadding)
        .attr('y', -rectPadding)
        .attr('rx', radius)
        .attr('ry', radius)
        .attr('width', (d) => d.width + rectPadding * 2)
        .attr('height', (d) => d.height + rectPadding * 2)
        .attr('fill', 'white')
    }
    const attrPath = (p: d3.Selection<SVGPathElement, Mdata, SVGGElement, Mdata | null>) => {
      return p.attr('d', getPath).attr('stroke', getColor).attr('stroke-width', props.branchWidth)
    }
    // 绘制节点的方法
    const appendNode = (enter: d3.Selection<d3.EnterElement, Mdata, SVGGElement, Mdata | null>) => {
      const isRoot = !enter.data()[0]?.depth
      const enterG = attrG(enter.append('g'))
      const gText = enterG.append('g').attr('class', 'text')
      if (isRoot) { attrRootRect(gText.append('rect')) }
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
      const gClass = getGClass(update.data()[0] || {})
      attrG(update)
      const gText = update.select<SVGGElement>(`g.${gClass} > g.text`)
      if (isRoot) {
        attrRootRect(gText.select('rect'))
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
    const draw = (d = [mmdata.data], sele = g.value as d3.Selection<SVGGElement, any, any, any>) => {
      const temp = sele.selectAll<SVGGElement, Mdata>(`g.${getGClass(d[0])}`)
      temp.data(d, getGKey).join(appendNode, updateNode)
    }
    const makeZoom = () => {
      if (!svg.value) { return }
      zoom.on('zoom', (e: D3ZoomEvent<SVGSVGElement, null>) => {
        if (!g.value) { return }
        g.value.attr('transform', e.transform.toString())
      })
      zoom(svg.value)
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

    return {
      svgEle,
      gEle,
      style,
      asstSvgEle
    }
  }
})
</script>

<style>

</style>
