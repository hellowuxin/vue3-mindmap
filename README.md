# vue3-mindmap（开发中）

> 相比[mindmap](https://github.com/hellowuxin/mindmap)更新了技术栈：Vue3、d3v6  
> 目前打算对项目进行重构，解决一些老旧问题（图片生成、加载慢...）

在线演示：<https://hellowuxin.github.io/vue3-mindmap/>

## PROPS

| Name         | Type             | Default    | Description          |
| ---          | ---              | ---        | ---                  |
| v-model      | Data[]           | undefined  | 设置思维导图数据        |
| x-gap        | Number           | 50         | 设置节点横向间隔        |
| y-gap        | Number           | 18         | 设置节点纵向间隔        |
| branch       | Number           | 4          | 设置连线的宽度          |
| drag         | Boolean          | false      | 设置节点是否可拖拽      |
| zoom         | Boolean          | false      | 是否可缩放、拖移        |
| edit         | Boolean          | false      | 是否可编辑             |
| center-btn   | Boolean          | false      | 是否显示居中按钮        |
| fit-btn      | Boolean          | false      | 是否显示缩放按钮        |
| add-node-btn | Boolean          | false      | 是否显示添加节点按钮     |
| download-btn | Boolean          | false      | 是否显示下载按钮        |
| scale-extent | [Number, Number] | [0.1, 0.8] | 设置缩放范围           |
