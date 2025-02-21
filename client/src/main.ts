import '@/assets/styles/app.scss'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import 'vuetify/styles'
import vuetify from './plugins/vuetify'
import '@mdi/font/css/materialdesignicons.css'

const app = createApp(App)
const pinia = createPinia()

app.use(vuetify)
app.use(pinia)
app.provide('enable-route-transitions', true)
app.use(router)
app.mount('#app')
