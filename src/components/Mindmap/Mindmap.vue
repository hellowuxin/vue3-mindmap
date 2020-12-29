<template>
  <div :class="style['container']">
    <svg :class="style['svg']" ref="svgEle">
      <g ref="gEle"></g>
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, PropType, Ref, ref } from 'vue'
import { Data, Mdata } from '@/interface'
import style from './Mindmap.module.scss'
import { d3, ImData, reflow } from '@/tools'

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
    const svg: Ref<d3.Selection<SVGSVGElement, unknown, null, undefined> | undefined> = ref()
    const g: Ref<d3.Selection<SVGGElement, Mdata, null, undefined> | undefined> = ref()
    const zoom = d3.zoom() as d3.ZoomBehavior<SVGSVGElement, unknown>

    const mmdata = new ImData(
      JSON.parse(JSON.stringify(props.modelValue[0])),
      props.xSpacing,
      props.ySpacing
    )

    onMounted(() => {
      if (svgEle.value && gEle.value) {
        svg.value = d3.select(svgEle.value)
        g.value = d3.select(gEle.value)

        draw()
        makeZoom()

        reflow(svgEle.value)
        zoom.translateTo(svg.value, 0, 0)
      }
    })

    const getGKey = (d: Mdata) => { return d.gKey }
    const getGClass = (d: Mdata) => { return `.depth-${d.depth}` }
    const getGTransform = (d: Mdata) => { return `translate(${d.dx},${d.dy})` }
    const appendNode = (enter: d3.Selection<d3.EnterElement, Mdata, SVGGElement, Mdata>) => {
      const enterG = enter.append('g').attr('class', getGClass).attr('transform', getGTransform)
      enterG.append('text').text((d) => d.name)
      return enterG
    }
    const updateNode = (update: d3.Selection<any, any, any, any>) => {
      return update
    }
    const exitNode = (exit: any) => {
      return exit
    }
    const draw = () => {
      if (!g.value) { return }
      const d = [mmdata.data]

      ;(g.value.selectAll(`g${getGClass(d[0])}`) as d3.Selection<SVGGElement, Mdata, SVGGElement, Mdata>)
        .data(d, getGKey)
        .join(appendNode, updateNode, exitNode)
    }
    const makeZoom = () => {
      if (!svg.value) { return }

      zoom.on('zoom', (e) => {
        console.log(e)
        if (!g.value) { return }
        g.value.attr('transform', e.transform)
      })

      svg.value.call(zoom)
    }

    return {
      svgEle,
      gEle,
      style
    }
  }
})
</script>

<style>

</style>
