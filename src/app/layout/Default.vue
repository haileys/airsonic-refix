<template>
  <div>
    <div class="min-vh-100 d-flex">
      <template v-if="store.isLoggedIn">
        <Sidebar />
        <main class="container-fluid">
          <TopNav />
          <slot />
        </main>
      </template>
      <template v-else>
        <main class="container-fluid logged-out">
          <div class="floatable-action-row">
            <button class="btn bg-secondary text-white rounded floatable-login-btn mb-3" @click="login">
              Login
            </button>
          </div>

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
    padding-top: 0.75rem;
    margin-bottom: 80px;
    overflow-x: hidden;
  }
  .floatable-action-row {
    display: flex;
    flex-flow: row nowrap;
    justify-content: right;
  }
  @media (min-width: 768px) {
    .floatable-action-row {
      float: right;
    }
    main.logged-out {
      padding: 1.5rem;
    }
  }
</style>
