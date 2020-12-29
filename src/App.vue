<template>
  <mindmap v-model="learn"></mindmap>
</template>

<script lang="ts">
import learn from '../public/learn.json'
import { defineComponent } from 'vue'
import Mindmap from './components/Mindmap'

export default defineComponent({
  name: 'App',
  components: {
    Mindmap
  },
  setup () {
    return {
      learn
    }
  }
})
</script>

<style>

</style>
