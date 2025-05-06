<template>
  <div class="d-flex align-items-center h-100 mt-5">
    <div v-if="!displayForm" class="mx-auto">
      <span class="spinner-border " />
    </div>
    <div v-else class="mx-auto card" style="width: 22rem">
      <b-overlay rounded :show="busy" opacity="0.1">
        <div class="card-body">
          <form @submit.prevent="login">
            <div class="d-flex mb-2">
              <Logo class="mx-auto" />
            </div>

            <template v-if="!showLoginFields">
              <div class="btn-group-vertical mt-2 w-100" role="group" aria-label="Login options">
                <button v-if="config.guestEnabled" class="btn btn-primary w-100 p-3" :disabled="busy" @click="guestLogin">
                  <span v-show="false" class="spinner-border spinner-border-sm" /> Continue as Guest
                </button>

                <button v-if="!showUsernamePasswordInput" class="btn btn-secondary w-100 p-3" @click="setShowLoginFields">
                  Log in
                </button>
              </div>
            </template>
            <template v-else>
              <div v-if="!config.serverUrl" class="mb-3">
                <label class="form-label">Server</label>
                <input v-model="server" name="server" type="text"
                       class="form-control" :class="{'is-invalid': hasError}">
              </div>
              <div class="mb-3">
                <label class="form-label">Username</label>
                <input v-model="username" name="username" type="text"
                       class="form-control" :class="{'is-invalid': hasError}">
              </div>
              <div class="mb-3">
                <label class="form-label">Password</label>
                <input v-model="password" name="password" type="password"
                       class="form-control" :class="{'is-invalid': hasError}">
              </div>
              <div v-if="error != null" class="alert alert-danger">
                Could not log in. ({{ error.message }})
              </div>
              <button class="btn btn-primary w-100" :disabled="busy" @click="login">
                <span v-show="false" class="spinner-border spinner-border-sm" /> Log in
              </button>
              <button v-if="config.guestEnabled" class="btn btn-secondary w-100 mt-3" :disabled="busy" @click="guestLogin">
                <span v-show="false" class="spinner-border spinner-border-sm" /> Continue as Guest
              </button>
            </template>
          </form>
        </div>
      </b-overlay>
    </div>
  </div>
</template>
<script lang="ts">
  import { defineComponent } from 'vue'
  import { config } from '@/shared/config'
  import Logo from '@/app/Logo.vue'
  import { useMainStore } from '@/shared/store'
  import { useAuth } from '@/auth/service'
  import { BOverlay } from 'bootstrap-vue'

  export default defineComponent({
    components: {
      BOverlay,
      Logo,
    },
    props: {
      returnTo: { type: String, required: true },
    },
    setup() {
      return {
        store: useMainStore(),
        auth: useAuth(),
      }
    },
    data() {
      return {
        server: '',
        username: '',
        password: '',
        busy: false,
        error: null,
        displayForm: false,
        showLoginFields: !config.guestEnabled,
      }
    },
    computed: {
      hasError(): boolean {
        return this.error !== null
      },
      config: () => config
    },
    async created() {
      this.server = this.auth.server
      this.username = this.auth.username
      const success = await this.auth.autoLogin()
      if (success) {
        this.store.setLoginSuccess(this.username, this.server)
        await this.$router.replace(this.returnTo)
      } else {
        this.displayForm = true
      }
    },
    methods: {
      setShowLoginFields() {
        this.showLoginFields = true
      },
      guestLogin() {
        this.loginWithCredentials('guest', '')
      },
      login() {
        this.loginWithCredentials(this.username, this.password)
      },
      loginWithCredentials(username: string, password: string) {
        this.error = null
        this.busy = true
        this.auth.loginWithPassword(this.server, username, password)
          .then(() => {
            this.store.setLoginSuccess(username, this.server)
            this.$router.replace(this.returnTo)
          })
          .catch(err => {
            this.error = err
          })
          .finally(() => {
            this.busy = false
          })
      }
    }
  })
</script>
