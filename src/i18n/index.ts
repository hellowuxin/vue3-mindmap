import i18next from 'i18next'
import zh from './zh'
import en from './en'

i18next.init({
  fallbackLng: 'zh',
  lng: 'zh', // if you're using a language detector, do not define the lng option
  // debug: true,
  resources: {
    zh,
    en
  }
})

export default i18next