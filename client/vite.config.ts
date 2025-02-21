import path from 'path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import Pages from 'vite-plugin-pages'
import Layouts from 'vite-plugin-vue-layouts'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
      styles: 'sass', // ✅ Fixed Vuetify styles
    }),
    Pages(),
    Layouts(),
    Components({
      resolvers: [IconsResolver()],
    }),
    Icons({ autoInstall: true }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    allowedHosts: true,
    port: 5173,
  },
})
