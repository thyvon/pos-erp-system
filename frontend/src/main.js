import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './styles.css'

const themeKey = 'erp_theme'

const applyInitialTheme = () => {
  const root = document.documentElement
  const savedTheme = localStorage.getItem(themeKey)
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const useDark = savedTheme ? savedTheme === 'dark' : prefersDark

  root.classList.toggle('dark', useDark)
}

applyInitialTheme()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')
