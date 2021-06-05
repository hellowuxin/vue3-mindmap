# Changelog

### [0.5.8](https://github.com/hellowuxin/vue3-mindmap/compare/v0.5.7...v0.5.8) (2021-06-05)


### Bug Fixes

* 修复编辑状态下换行的异常行为（[#12](https://github.com/hellowuxin/vue3-mindmap/issues/12)） ([654305c](https://github.com/hellowuxin/vue3-mindmap/commit/654305c818a5bd77497aa8844fb61f2f8d19e83a))

### [0.5.7](https://github.com/hellowuxin/vue3-mindmap/compare/v0.5.6...v0.5.7) (2021-05-14)


### Features

* 现在可以剪切节点 ([3db4349](https://github.com/hellowuxin/vue3-mindmap/commit/3db43498ac6bf96e929c1d7fe6af8c7d03691903))
* 现在可以只删除单个节点 ([69678df](https://github.com/hellowuxin/vue3-mindmap/commit/69678df3a837bc950cafd2667f027401f4d50375))
* 现在折叠状态下也可以添加子节点 ([b206658](https://github.com/hellowuxin/vue3-mindmap/commit/b20665871519a35bd9d8fbdcdb41a96031fc9cdc))

### [0.5.6](https://github.com/hellowuxin/vue3-mindmap/compare/v0.5.5...v0.5.6) (2021-05-13)


### Features

* 新增节点被遮挡时，移动至可见 ([a534ac7](https://github.com/hellowuxin/vue3-mindmap/commit/a534ac7c961844018e98459151f5d18c60f29ea4))
* 现在可以复制和粘贴单个节点 ([51ac02c](https://github.com/hellowuxin/vue3-mindmap/commit/51ac02c0c54687b9a2093b192b4d275a056f8026))
* 现在可以复制粘贴子树 ([843528d](https://github.com/hellowuxin/vue3-mindmap/commit/843528d5cf06a24715bc608724e249db26ce1f00))
* 编辑文本时也保持可见 ([e1cf965](https://github.com/hellowuxin/vue3-mindmap/commit/e1cf9656389d094ba2088cce4a904e420b02462d))


### Bug Fixes

* 修正判断是否遮挡的元素 ([92908a5](https://github.com/hellowuxin/vue3-mindmap/commit/92908a525ed464d65b7d6a72da94036758615efa))
* 修正当更新asstSvg内容时，可能挤占空间的错误情况 ([09e6f0f](https://github.com/hellowuxin/vue3-mindmap/commit/09e6f0f420ded45edb8fadefa36c66368b4248e6))
* 增加元素与视图的空隙，方便区分 ([b77b430](https://github.com/hellowuxin/vue3-mindmap/commit/b77b4306ad3771c044eba8ce7191be8d106cf4e6))
* 当元素宽度或高度超过视图的宽度或高度，保持右下角可见 ([f93d531](https://github.com/hellowuxin/vue3-mindmap/commit/f93d5319167157276dd09bc611e6f6c0b69dc6c6))
* 避免产生空隙 ([2ae4939](https://github.com/hellowuxin/vue3-mindmap/commit/2ae4939d29bd4d42460db21394a49e70c6c49900))

### [0.5.5](https://github.com/hellowuxin/vue3-mindmap/compare/v0.5.4...v0.5.5) (2021-05-09)


### Bug Fixes

* 修复节点都在同侧时不能改变左右布局的问题（[#11](https://github.com/hellowuxin/vue3-mindmap/issues/11)） ([656cf0a](https://github.com/hellowuxin/vue3-mindmap/commit/656cf0ae637f9f632ed166864b625b81333e42a4))
* 修正了添加一级节点的新父节点时颜色不统一的问题 ([4e3221c](https://github.com/hellowuxin/vue3-mindmap/commit/4e3221c64eafaa2299ad3c7c50adcf0800d2fa5f))

### [0.5.4](https://github.com/hellowuxin/vue3-mindmap/compare/v0.5.3...v0.5.4) (2021-05-08)

### Features

* 可以直接添加兄弟节点 ([0ede6a1](https://github.com/hellowuxin/vue3-mindmap/commit/0ede6a1d91ecda23546cf1dc678e8f8175d685d1))
* 可以直接添加新父节点 ([ce7ad06](https://github.com/hellowuxin/vue3-mindmap/commit/ce7ad063d787673cf5ada4b5cd13376d5f816a8a))
* 添加兄弟节点也会立刻进入编辑模式 ([731ac89](https://github.com/hellowuxin/vue3-mindmap/commit/731ac893fbcf0f81a8dd4e6ef41ed37d96439f72))

### Bug Fixes

* [#10](https://github.com/hellowuxin/vue3-mindmap/issues/10) ([e965ce7](https://github.com/hellowuxin/vue3-mindmap/commit/e965ce74064b87ae1a8b6a5222b7c44d3c0cf3f3))
* 避免与html attr冲突 ([859b8eb](https://github.com/hellowuxin/vue3-mindmap/commit/859b8eb4777cdaa292c74c090749dbdbe4213252))

### [0.5.3](https://github.com/hellowuxin/vue3-mindmap/compare/v0.5.2...v0.5.3) (2021-05-02)

### Bug Fixes

* 纠正右键某些位置时，菜单内容不能完全展示 ([f4656c0](https://github.com/hellowuxin/vue3-mindmap/commit/f4656c0389b6f2c2ec27e14dd4944c414bd8d48d))
* 纠正左树中trigger的位置 ([d11e32d](https://github.com/hellowuxin/vue3-mindmap/commit/d11e32d047851e9e6254f060510cbafe0c9c7a6f))
