<template>
  <div :class="style['container']" v-show="show">
    <div @mousedown="close"></div>
    <div
      :id="style['menu']"
      :style="{ top: position.top+'px', left: position.left+'px' }"
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
        >{{ item.title }}</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, useCssModule, PropType, ref } from 'vue'
import emitter from '@/mitt'
import { MenuItem } from './Mindmap/interface'

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
    emitter.on<boolean>('showContextmenu', (val) => show.value = !!val)
    const close = () => show.value = false
    const onClick = (name: string) => {
      close()
      context.emit('click-item', name)
    }

    return {
      style,
      show,
      close,
      onClick
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
