<template>
  <div :class="style['container']">
    <svg :class="style['svg']" ref="svgEle">
      <g ref="gEle"></g>
    </svg>
    <svg ref="asstSvgEle"></svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, PropType, Ref, ref } from 'vue'
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
      default: 20
    },
    strokeWidth: {
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
    const asstSvg: Ref<d3.Selection<SVGSVGElement, null, null, undefined> | undefined> = ref()
    const zoom = d3.zoom() as d3.ZoomBehavior<SVGSVGElement, null>

    onMounted(() => {
      if (!svgEle.value || !gEle.value || !asstSvgEle.value) { return }
      svg.value = d3.select(svgEle.value)
      g.value = d3.select(gEle.value)
      asstSvg.value = d3.select(asstSvgEle.value)

      const mmdata = new ImData(
        JSON.parse(JSON.stringify(props.modelValue[0])),
        props.xSpacing,
        props.ySpacing,
        getSize
      )

      draw([mmdata.data], g.value)
      makeZoom()

      reflow(svgEle.value)
      zoom.translateTo(svg.value, 0, 0)
      console.log(mmdata.data)
    })

    const getGKey = (d: Mdata) => { return d.gKey }
    const getGClass = (d: Mdata) => { return `.depth-${d.depth}` }
    const getGTransform = (d: Mdata) => { return `translate(${d.dx},${d.dy})` }
    const appendNode = (enter: d3.Selection<d3.EnterElement, Mdata, SVGGElement, undefined | Mdata>) => {
      const enterG = enter.append('g').attr('class', getGClass).attr('transform', getGTransform)
      enterG.append('text').text((d) => d.name)
      enterG.append('rect').attr('width', (d) => d.width).attr('height', (d) => d.height)

      enterG.each((d, i) => {
        if (!d.children) { return }
        draw(d.children, enterG.filter((a, b) => i === b))
      })

      return enterG
    }
    // const updateNode = (update: d3.Selection<any, any, any, any>) => {
    //   return update
    // }
    // const exitNode = (exit: any) => {
    //   return exit
    // }
    const draw = (d: Mdata[], sele: d3.Selection<SVGGElement, any, any, undefined | Mdata>) => {
      const temp = sele.selectAll(`g${getGClass(d[0])}`) as d3.Selection<SVGGElement, Mdata, SVGGElement, undefined | Mdata>
      temp.data(d, getGKey).join(appendNode)
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
      const t = asstSvg.value.append('text').text(text).node() as SVGTextElement
      const tBox = t.getBBox()
      t.remove()
      return { width: tBox.width, height: tBox.height }
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
