<template>
  <form @submit.prevent="search">
    <input
      v-model="query"
      class="form-control" type="search"
      placeholder="Search">
  </form>
</template>
<script lang="ts">
  import { defineComponent } from 'vue'

  export default defineComponent({
    data() {
      return {
        query: ''
      }
    },
    methods: {
      search(): void {
        this.$router.push({ name: 'search', query: { query: this.query } })
      }
    }
  })
</script>
