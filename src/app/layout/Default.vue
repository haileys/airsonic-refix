<template>
  <div>
    <div class="min-vh-100 d-flex">
      <template v-if="store.isLoggedIn">
        <Sidebar />
        <main class="container-fluid py-2">
          <TopNav />
          <slot />
        </main>
      </template>
      <template v-else>
        <main class="container-fluid p-4">
          <button class="btn bg-secondary text-white rounded float-right" @click="login">
            Login
          </button>

          <slot />
        </main>
      </template>
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
  .float-right {
    float: right;
  }
</style>
