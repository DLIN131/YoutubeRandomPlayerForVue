import { createApp } from 'vue'
import pinia from './stores'
import './style.css'
import App from './App.vue'
import router from './router'
import vue3GoogleLogin from 'vue3-google-login'
import { GOOGLE_CLIENT_ID } from './config/env'

const app = createApp(App)
app.use(router)
app.use(pinia) // pinia插件配置
app.use(vue3GoogleLogin, {
  clientId: GOOGLE_CLIENT_ID,
  scope: 'profile email'
}) // 登入插件
app.mount('#app') // 圖像建置
