import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { createCloudFunctionsSyncPlugin } from './build/syncCloudFunctions.js'

export default defineConfig({
  plugins: [uni(), createCloudFunctionsSyncPlugin()],
})
