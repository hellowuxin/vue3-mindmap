<template>
  <div :class="style['container']" v-show="show" @mousedown="onMousedown">
    <div
      :id="style['menu']"
      :style="{ top: position.top+'px', left: position.left+'px' }"
    >
      <ul>
        <li v-for="item in items" :key="item.name">{{ item.title }}</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, useCssModule, PropType, ref } from 'vue'
import { Emitter } from '@/mitt'

interface Item {
  title: string
  name: string
  disabled: boolean
}

export default defineComponent({
  name: 'contextmenu',
  props: {
    position: {
      default: { top: 0, left: 0 }
    },
    items: Array as PropType<Item[]>
  },
  setup () {
    const show = ref(false)
    const style = useCssModule()
    Emitter.on('showContextmenu', (val) => show.value = val)
    const onMousedown = (e: MouseEvent) => show.value = false

    return {
      style,
      show,
      onMousedown
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

    ul {
      list-style-type: none;
      margin: 0;
      padding: 0;
      border-radius: inherit;

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
          cursor: not-allowed;
        }
      }
    }
  }
</style>
