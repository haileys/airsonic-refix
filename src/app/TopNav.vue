<template>
  <div class="d-flex align-items-center mb-2">
    <button class="btn navbar-toggler text-white d-md-none me-2" @click="store.showMenu">
      <Icon icon="nav" />
    </button>

    <SearchForm class="flex-grow-1 flex-md-grow-0 ms-auto me-2" />

    <template v-if="store.username">
      <b-dropdown variant="link" right no-caret toggle-class="px-0" class="me-2">
        <template #button-content>
          <TopNavIcon>
            <Icon icon="person" />
          </TopNavIcon>
        </template>
        <div class="px-3 py-1">
          {{ store.username }}
        </div>
        <b-dropdown-divider />
        <b-dropdown-item :href="store.server" target="_blank" rel="noopener noreferrer">
          Server <Icon icon="link" />
        </b-dropdown-item>
        <b-dropdown-item-button @click="scan">
          Scan media folders
        </b-dropdown-item-button>
        <b-dropdown-item-button @click="showAboutModal = true">
          About
        </b-dropdown-item-button>
        <b-dropdown-divider />
        <b-dropdown-item-button @click="logout">
          Log out
        </b-dropdown-item-button>
      </b-dropdown>
    </template>

    <template v-if="sonicastTargets.length > 0">
      <b-dropdown variant="link" right no-caret toggle-class="px-0">
        <template #button-content>
          <TopNavIcon>
            <Icon icon="cast" :class="{ casting: store.isCasting }" />
          </TopNavIcon>
        </template>

        <CastMenuItem :url="null" name="This computer" />

        <b-dropdown-divider />

        <template v-for="target in sonicastTargets">
          <CastMenuItem :key="target.url" :url="target.url" :name="target.name" />
        </template>
      </b-dropdown>
    </template>

    <About :visible="showAboutModal" @close="showAboutModal = false" />
  </div>
</template>
<script lang="ts">
  import { defineComponent } from 'vue'
  import About from './About.vue'
  import CastMenuItem from '@/shared/components/CastMenuItem.vue'
  import SearchForm from '@/library/search/SearchForm.vue'
  import { useMainStore } from '@/shared/store'
  import { useAuth } from '@/auth/service'
  import { config } from '@/shared/config'

  export default defineComponent({
    components: {
      About,
      CastMenuItem,
      SearchForm,
    },
    setup() {
      return {
        store: useMainStore(),
        auth: useAuth(),
      }
    },
    data() {
      return {
        showAboutModal: false,
        sonicastTargets: config.sonicastTargets,
      }
    },
    methods: {
      scan() {
        return this.$api.scan()
      },
      logout() {
        this.auth.logout()
        this.$router.go(0)
      }
    }
  })
</script>
<style>
  .casting {
    color:var(--bs-primary);
  }
</style>
