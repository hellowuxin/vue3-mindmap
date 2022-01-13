import { createApp } from 'vue'
import App from './App.vue'
import { createI18n } from 'vue-i18n'
import zhMesasge from './locales/zh.json'
import enMessage from './locales/en.json'
import { PRIMARY_LOCALE, FALLBACK_LOCALE } from './constants'

type MessageSchema = typeof zhMesasge

const i18n = createI18n<[MessageSchema], 'zh' | 'en'>({
  legacy: false,
  locale: PRIMARY_LOCALE,
  fallbackLocale: FALLBACK_LOCALE,
  messages: {
    zh: zhMesasge,
    en: enMessage,
  }
})

const app = createApp(App)

app.use(i18n)
app.mount('#app')
