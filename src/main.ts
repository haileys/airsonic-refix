import '@/style/main.scss'
import Vue, { markRaw, watch } from 'vue'
import Router from 'vue-router'
import AppComponent from '@/app/App.vue'
import { createApp } from '@/shared/compat'
import { components } from '@/shared/components'
import { setupRouter } from '@/shared/router'
import { useMainStore } from '@/shared/store'
import { API } from '@/shared/api'
import { createAuth } from '@/auth/service'
import { findPlayingSonicast, setupPlayer, usePlayerStore } from './player/store'
import { createApi } from '@/shared'
import { createPinia, PiniaVuePlugin } from 'pinia'
import { useFavouriteStore } from '@/library/favourite/store'
import { usePlaylistStore } from '@/library/playlist/store'

declare module 'vue/types/vue' {
  interface Vue {
    $api: API
  }
}

declare module 'pinia' {
  export interface PiniaCustomProperties {
    api: API;
  }
}

Vue.use(Router)
Vue.use(PiniaVuePlugin)

const auth = createAuth()
const api = createApi(auth)
const router = setupRouter(auth)

const pinia = createPinia()
  .use(({ store }) => {
    store.api = markRaw(api)
    // store.sonicast = sonicast
  })

const mainStore = useMainStore(pinia)
const playerStore = usePlayerStore(pinia)

setupPlayer(playerStore, mainStore, auth, api)

async function selectPlayingSonicast() {
  // find any configured sonicast which is currently playing
  const url = await findPlayingSonicast(playerStore, auth)
  // select it if we're not already playing and no sonicast is selected
  if (url && !playerStore.isPlaying && !mainStore.sonicastUrl) {
    mainStore.sonicastUrl = url
  }
}

selectPlayingSonicast()

watch(
  () => mainStore.isLoggedIn,
  (value) => {
    if (value) {
      return Promise.all([
        useFavouriteStore().load(),
        usePlaylistStore().load(),
        playerStore.loadQueue(),
      ])
    }
  })

router.beforeEach((to, from, next) => {
  mainStore.clearError()
  next()
})

const app = createApp(AppComponent, { router, pinia, store: playerStore })

app.config.errorHandler = (err: Error) => {
  // eslint-disable-next-line
  console.error(err)
  mainStore.setError(err)
}

app.use(auth)
app.use(api)

Object.entries(components).forEach(([key, value]) => {
  app.component(key, value as any)
})

app.mount('#app')
