<template>
  <div :class="style['container']" v-show="show" ref="containerEle">
    <div @mousedown="close"></div>
    <div
      ref="menuEle"
      :id="style['menu']"
      :style="{ top: pos.top+'px', left: pos.left+'px' }"
    >
      <ul 
        v-for="(group, index) in groups"
        :key="index"
      >
        <li
          :class="item.disabled ? style['disabled'] : ''"
          v-for="item in group"
          :key="item.name"
          @click="onClick(item.name)"
        >{{ i18n.t(`contextmenu.${item.name}`) }}</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, useCssModule, PropType, ref, Ref, nextTick, reactive } from 'vue'
import emitter from '@/mitt'
import { MenuItem } from './Mindmap/variable/contextmenu'
import i18n from '../i18n'

export default defineComponent({
  name: 'contextmenu',
  props: {
    position: {
      default: { top: 0, left: 0 }
    },
    groups: Array as PropType<MenuItem[][]>
  },
  emits: ['click-item'],
  setup (props, context) {
    const show = ref(false)
    const style = useCssModule()
    const containerEle: Ref<HTMLDivElement | undefined> = ref()
    const menuEle: Ref<HTMLDivElement | undefined> = ref()
    const pos = reactive({ top: 0, left: 0 })
    const margin = 8

    emitter.on<boolean>('showContextmenu', async (val) => {
      if (!containerEle.value || !menuEle.value) { return }
      show.value = !!val
      await nextTick()
      const { offsetWidth: w1, offsetHeight: h1 } = containerEle.value
      const { offsetWidth: w2, offsetHeight: h2 } = menuEle.value
      const { top, left } = props.position
      pos.top = top + h2 > h1 ? h1 - h2 - margin : top
      pos.left = left + w2 > w1 ? left - w2 : left
    })
    const close = () => show.value = false
    const onClick = (name: string) => {
      close()
      context.emit('click-item', name)
    }

    return {
      style,
      show,
      close,
      onClick,
      menuEle,
      containerEle,
      pos,
      i18n
    }
  }
})
</script>

<style lang="scss" module>
  .container {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;

    > div:first-child {
      width: 100%;
      height: 100%;
    }
  }

  #menu {
    position: absolute;
    border-radius: 4px;
    box-shadow: 0 5px 5px -3px rgb(0 0 0 / 20%), 0 8px 10px 1px rgb(0 0 0 / 14%), 0 3px 14px 2px rgb(0 0 0 / 12%);
    padding: 4px 4px;
    background-color: #eae9ed;
    color: #3a353d;
    font-weight: bold;
    font-size: small;
    white-space: nowrap;
  }

  #menu ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
    border-radius: inherit;

    &:not(:last-child)::after {
      display: block;
      content: '';
      background-color: #CBCBCB;
      height: 1px;
      margin: 4px 10px;
    }

    li {
      position: relative;
      padding: 2px 10px;
      cursor: pointer;
      border-radius: inherit;

      &::before {
        border-radius: inherit;
        background-color: black;
        bottom: 0;
        content: "";
        left: 0;
        opacity: 0;
        pointer-events: none;
        position: absolute;
        right: 0;
        top: 0;
        transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
      }

      &:not(.disabled):hover::before {
        opacity: 0.09;
      }

      &.disabled {
        color: #AEB2B5;
        pointer-events: none;
      }
    }
  }
</style>
