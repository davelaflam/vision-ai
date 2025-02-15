import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import type { VuetifyOptions } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import * as labsComponents from 'vuetify/labs/components'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { en } from 'vuetify/locale'

const lightTheme = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    error: '#CC1900',
    gray: '#4D4F53',
    info: '#113267',
    primary: '#30b2c5',
    secondary: '#002244',
    success: '#62ce4d',
    surface: '#FFFFFF',
    warning: '#eb876d',
  },
}

const darkTheme = {
  dark: true,
  colors: {
    background: '#121212',
    error: '#FF4C4C',
    gray: '#4D4F53',
    info: '#4a90e2',
    primary: '#30b2c5',
    secondary: '#002244',
    success: '#62ce4d',
    surface: '#1c1c1c',
    warning: '#eb876d',
  },
}

let vuetifyConfig: VuetifyOptions = {
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  locale: { locale: 'en', fallback: 'en', messages: { en } },
  theme: {
    defaultTheme: 'darkTheme',
    themes: { lightTheme, darkTheme },
  },
}

if (import.meta.env.DEV) {
  vuetifyConfig = {
    components: { components, labsComponents },
    directives,
    ...vuetifyConfig,
  }
}

export default createVuetify(vuetifyConfig)
export { components, directives }
