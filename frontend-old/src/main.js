import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './styles.css'
import { i18n } from './i18n'
import { applyThemePreference, resolveThemePreference } from './utils/theme'

applyThemePreference(resolveThemePreference())

const app = createApp(App)

app.use(createPinia())
app.use(i18n)
app.use(router)
app.mount('#app')
