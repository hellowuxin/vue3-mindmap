# vue3-mindmap

[![npm](https://img.shields.io/npm/v/vue3-mindmap)](https://www.npmjs.com/package/vue3-mindmap)
[![build](https://github.com/hellowuxin/vue3-mindmap/actions/workflows/blank.yml/badge.svg)](https://github.com/hellowuxin/vue3-mindmap/actions)
[![coveralls](https://img.shields.io/coveralls/github/hellowuxin/vue3-mindmap)](https://coveralls.io/github/hellowuxin/vue3-mindmap)

> Mindmap component for Vue3 inspired by [MindNode](https://mindnode.com)

live demo: <https://5xin.xyz/vue3-mindmap/>

## Install

```sh
npm install vue3-mindmap
```

## PROPS

| Name         | Type             | Default    | Description          |
| ---          | ---              | ---        | ---                  |
| v-model      | Data[]           | undefined  | 设置思维导图数据        |
| x-gap        | Number           | 84         | 设置节点横向间隔        |
| y-gap        | Number           | 18         | 设置节点纵向间隔        |
| branch       | Number           | 4          | 设置连线的宽度          |
| scale-extent | [Number, Number] | [0.1, 0.8] | 设置缩放范围           |
| timetravel   | Boolean          | false      | 是否显示撤销重做按钮     |
| drag         | Boolean          | false      | 设置节点是否可拖拽      |
| zoom         | Boolean          | false      | 是否可缩放、拖移        |
| edit         | Boolean          | false      | 是否可编辑             |
| center-btn   | Boolean          | false      | 是否显示居中按钮        |
| fit-btn      | Boolean          | false      | 是否显示缩放按钮        |
| add-node-btn | Boolean          | false      | 是否显示添加节点按钮     |
| download-btn | Boolean          | false      | 是否显示下载按钮        |
| sharp-corner | Boolean          | false      | 设置分支为圆角或直角     |
| ctm          | Boolean          | false      | 是否响应右键菜单        |

## Example

```html
<template>
  <mindmap v-model="data"></mindmap>
</template>

<script>
import mindmap from 'vue3-mindmap'
import 'vue3-mindmap/dist/style.css'

export default defineComponent({
  components: { mindmap },
  setup () => {
    const data = [{
      "name":"如何学习D3",
      "children": [
        {
          "name":"预备知识",
          "children": [
            { "name":"HTML & CSS" },
            { "name":"JavaScript" },
            ...
          ]
        },
        {
          "name":"安装",
          "collapse": true,
          "children": [ { "name": "折叠节点" } ]
        },
        { "name":"进阶", "left": true },
        ...
      ]
    }]

    return { data }
  }
})
</script>
```

## 注意

- 当xGap小于一定数值，父节点的trigger由于添加按钮的存在可能遮挡住子节点的trigger，无法响应子节点的点击

## 待解决

- 直角分支radius

## Todo

- 多选节点
- 多主节点
- 更多节点样式
