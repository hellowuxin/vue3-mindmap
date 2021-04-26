import { MenuItem } from '../interface'
import { ref, Ref } from '@vue/reactivity'
import { computed } from 'vue'
import { scaleExtent, zoomTransform } from '.'

export const pos = ref({ left: 0, top: 0 })
export const collapseItem: Ref<MenuItem> = ref({ title: '折叠节点', name: 'collapse', disabled: true })
export const expandItem: Ref<MenuItem> = ref({ title: '展开节点', name: 'expand', disabled: true })
export const deleteItem: Ref<MenuItem> = ref({ title: '删除节点', name: 'delete', disabled: false })
export const addItem: Ref<MenuItem> = ref({ title: '新建子节点', name: 'add', disabled: false })

export const nodeMenu = computed(() => [
  [ addItem.value ],
  [ deleteItem.value ],
  [ { title: '全选', name: 'selectall', disabled: true } ],
  [ collapseItem.value, expandItem.value ]
])

export const viewMenu = computed(() => [
  [
    {
      title: '放大',
      name: 'zoomin',
      disabled: zoomTransform.value.k >= scaleExtent[1] 
    },
    {
      title: '缩小',
      name: 'zoomout',
      disabled: zoomTransform.value.k <= scaleExtent[0]
    },
    { title: '缩放至合适大小', name: 'zoomfit', disabled: false }
  ],
  [
    { title: '全选', name: 'selectall', disabled: true }
  ]
])
