import { computed, ref, Ref } from 'vue'
import { mmprops, scaleExtent, zoomTransform } from '.'

export type MenuEvent = 'zoomin' | 'zoomout' | 'zoomfit' | 'add' | 'delete' |
  'selectall' | 'collapse' | 'expand' | 'add-sibling' | 'add-sibling-before' |
  'add-parent' | 'copy' | 'paste' | 'cut' | 'delete-one'
export interface MenuItem {
  name: string
  disabled: boolean
}
export const showViewMenu = ref(true)
export const pos = ref({ left: 0, top: 0 })
export const collapseItem: Ref<MenuItem> = ref({ name: 'collapse', disabled: true })
export const expandItem: Ref<MenuItem> = ref({ name: 'expand', disabled: true })
export const deleteItem: Ref<MenuItem> = ref({ name: 'delete', disabled: false })
export const addItem: Ref<MenuItem> = ref({ name: 'add', disabled: false })
export const addParentItem: Ref<MenuItem> = ref({ name: 'add-parent', disabled: false })
export const addSiblingItem: Ref<MenuItem> = ref({ name: 'add-sibling', disabled: false })
export const addSiblingBeforeItem: Ref<MenuItem> = ref({ name: 'add-sibling-before', disabled: true })
export const cutItem: Ref<MenuItem> = ref({ name: 'cut', disabled: false })
export const copyItem: Ref<MenuItem> = ref({ name: 'copy', disabled: false })
export const pasteItem: Ref<MenuItem> = ref({ name: 'paste', disabled: false })
export const deleteOneItem: Ref<MenuItem> = ref({ name: 'delete-one', disabled: false })


const nodeMenu = computed<MenuItem[][]>(() => [
  [ addItem.value, addParentItem.value, addSiblingItem.value, addSiblingBeforeItem.value ],
  [ cutItem.value, copyItem.value, pasteItem.value, deleteItem.value, deleteOneItem.value ],
  [ { name: 'selectall', disabled: true } ],
  [ collapseItem.value, expandItem.value ]
].filter((item, index) => {
  if (index === 0 || index === 1) {
    return mmprops.value.edit
  } else {
    return true
  }
}))

const viewMenu = computed(() => [
  [
    {
      name: 'zoomin',
      disabled: zoomTransform.value.k >= scaleExtent[1]
    },
    {
      name: 'zoomout',
      disabled: zoomTransform.value.k <= scaleExtent[0]
    },
    { name: 'zoomfit', disabled: false }
  ],
  [
    { name: 'selectall', disabled: true }
  ]
])

export const menu = computed(() => showViewMenu.value ? viewMenu.value : nodeMenu.value)