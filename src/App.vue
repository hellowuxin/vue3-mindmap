<template>
  <div class="container">
    <div class="left-top">
      <a href="https://github.com/hellowuxin/vue3-mindmap" target="_blank">GitHub</a>
    </div>
    <div class="right-top">
      <span>Props</span>
    </div>
    <mindmap
      class="left-bottom"
      v-model="learn"
      :branch-width="rangeList['branch-width'].value"
      :x-spacing="rangeList['x-spacing'].value"
      :y-spacing="rangeList['y-spacing'].value"
      :zoom="checkboxList['zoom'].value"
      :fit-btn="checkboxList['fit-btn'].value"
      :center-btn="checkboxList['center-btn'].value"
    ></mindmap>
    <div class="right-bottom">
      <div v-for="(item, key) in checkboxList" :key="key">
        <input type="checkbox" :name="key" v-model="item.value" :disabled="item.disabled">
        <label :for="key">{{ key }}</label>
      </div>
      <div v-for="(item, key) in rangeList" :key="key">
        <input type="range" :name="key" v-model.number="item.value" :min="item.min" :max="item.max">
        <label :for="key">{{ key }}</label>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import learn from '../public/learn.json'
import { defineComponent, reactive } from 'vue'
import Mindmap from './components/Mindmap'
type checkbox = { [key: string]: { value: boolean, disabled?: boolean } }
export default defineComponent({
  name: 'App',
  components: {
    Mindmap
  },
  setup () {
    const checkboxList = reactive<checkbox>({
      'center-btn': { value: true },
      'fit-btn': { value: true },
      'undo-btn': { value: false, disabled: true },
      'download-btn': { value: false, disabled: true },
      keyboard: { value: false, disabled: true },
      draggable: { value: false },
      showNodeAdd: { value: false },
      contextMenu: { value: false },
      zoom: { value: true },
      'sharp-corner': { value: false, disabled: true },
      vertical: { value: false, disabled: true }
    })
    const rangeList = reactive({
      'branch-width': { value: 4, min: 0, max: 10 },
      'x-spacing': { value: 50, min: 0, max: 100 },
      'y-spacing': { value: 10, min: 0, max: 100 }
    })
    return {
      learn,
      checkboxList,
      rangeList
    }
  }
})
</script>

<style lang="scss">
.container {
  width: 100%;
  height: calc(100vh - 16px);
  border-radius: 4px;
  border: thin solid rgba(0,0,0,.12);
  overflow: hidden;
  background-color: rgba(0,0,0,.12);
  display: grid;
  grid-template-columns: 75% 1px 25%;
  grid-template-rows: 48px 1px auto;
}

.right-top {
  grid-column: 3 / 4;
}

.left-bottom {
  grid-row: 3 / 4;
}

.right-bottom {
  grid-column: 3 / 4;
  grid-row: 3 / 4;
  background-color: white;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  div {
    display: flex;
    align-items: center;
    gap: 5px;
  }
}

.left-top,
.right-top {
  background-color: #eee;
  padding: 0 12px;
  display: flex;
  align-items: center;
}

input[type='checkbox'] {
  cursor: pointer;
}

input:disabled {
  cursor: not-allowed;
}
</style>
