<template>
  <div>
    <svg ref="svgEle">
      <g ref="gEle"></g>
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, PropType, Ref, ref } from 'vue'
import * as d3 from 'd3-selection'
import { Data } from '@/interface'
import ImData from '@/tools/ImData'
import { BoundingBox, Layout } from '@/tools/flextree'

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
    const g: Ref<d3.Selection<SVGGElement, unknown, null, undefined> | undefined> = ref()

    const bb = new BoundingBox(props.ySpacing, props.xSpacing)
    const layout = new Layout(bb)
    const mmdata = new ImData(props.modelValue[0])
    const { result, boundingBox } = layout.layout(mmdata.data)

    console.log(result, boundingBox)

    onMounted(() => {
      if (svgEle.value) {
        svg.value = d3.select(svgEle.value)
      }
      if (gEle.value) {
        g.value = d3.select(gEle.value)
      }
    })

    return {
      svgEle,
      gEle
    }
  }
})
</script>

<style>

</style>
