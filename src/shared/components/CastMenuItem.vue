<template>
  <b-dropdown-item-button
    :class="{ 'cast-menu-item': true, 'selected': store.sonicastUrl === url }"
    @click="store.sonicastUrl = url"
  >
    <Icon icon="check" /> {{ name }}
  </b-dropdown-item-button>
</template>
<script lang="ts">
  import { defineComponent, PropType } from 'vue'
  import { useMainStore } from '@/shared/store'

  export default defineComponent({
    props: {
      name: { type: String, required: true },
      url: { type: [String, null] as PropType<string | null>, required: true },
    },
    setup() {
      return {
        store: useMainStore(),
      }
    }
  })
</script>
<style>
.cast-menu-item svg {
  visibility:hidden;
}
.cast-menu-item.selected button {
  color:var(--bs-primary);
}
.cast-menu-item.selected svg {
  visibility:visible;
}
</style>
