<template>
  <div>
    <div class="min-vh-100 d-flex">
      <Sidebar v-if="store.isAuthenticated" />
      <main :class="{ 'container-fluid': true, 'py-2': true, 'mx-4': !store.isAuthenticated }">
        <TopNav />
        <slot />
      </main>
    </div>
    <Player />
  </div>
</template>
<script lang="ts">
  import { defineComponent } from 'vue'
  import TopNav from '@/app/TopNav.vue'
  import Sidebar from '@/app/Sidebar.vue'
  import Player from '@/player/Player.vue'
  import { useMainStore } from '@/shared/store'

  export default defineComponent({
    components: {
      TopNav,
      Sidebar,
      Player,
    },
    setup() {
      return {
        store: useMainStore(),
      }
    },
  })
</script>
<style scoped>
  main {
    margin-bottom: 80px;
    overflow-x: hidden;
  }
</style>
