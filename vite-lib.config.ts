import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import stringHash from 'string-hash'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') }
    ]
  },
  plugins: [vue()],
  build: {
    lib: {
      entry: path.resolve(__dirname, './src/components/Mindmap'),
      name: 'mindmap'
    },
    rollupOptions: {
      // 请确保外部化那些你的库中不需要的依赖
      external: ['vue'],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          vue: 'Vue'
        }
      }
    }
  },
  css: {
    modules: {
      generateScopedName: (name, filename, css) => {
        const f = filename.split('?')[0].split('.')[0]
        const file = path.basename(f)
        const hash = stringHash(css).toString(36).substr(0, 5);
        return `${file}_${name}_${hash}`
      }
    }
  }
})
