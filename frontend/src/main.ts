import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'

const app = createApp(App)
app.use(createPinia())

// createApp(App).mount('#app')
createApp(App).use(router).mount('#app')