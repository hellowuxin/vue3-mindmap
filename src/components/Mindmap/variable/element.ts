import emitter from '@/mitt'
import * as d3 from '../d3'

export let g: d3.Selection<SVGGElement, null, null, undefined> | undefined
emitter.on('selection-g', (val) => g = val)
