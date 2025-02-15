import 'vue-router'

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {}
}

declare module 'vue-router' {
  interface RouteMeta {
    layout?: string
    transition?: string
    public?: boolean
    enabled_for?: string[]
  }
}
