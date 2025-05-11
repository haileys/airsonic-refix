<template>
  <div class="d-flex flex-column flex-md-row align-items-center align-items-md-start mb-3">
    <div class="backdrop-container">
      <div class="backdrop" />
    </div>
    <img v-if="image" :src="image">
    <img v-else src="@/shared/assets/fallback.svg">
    <div class="body d-flex flex-column align-items-center align-items-md-start pt-4 pt-md-0 ps-md-4 pb-1 text-center text-md-start">
      <slot />
    </div>
  </div>
</template>
<script lang="ts">
  import { defineComponent } from 'vue'
  import fallbackImage from '@/shared/assets/fallback.svg'

  export default defineComponent({
    props: {
      image: { type: String, default: null },
    },
    computed: {
      backgroundImage(): string {
        return `url('${this.image || fallbackImage}')`
      }
    },
  })
</script>
<style scoped>
  img {
    display: block;
    width: 300px;
    height: auto;
    max-width: 75%;
    aspect-ratio: 1;
    object-fit: cover;
  }
  .body {
    max-height: 300px;
    overflow-y: auto;
  }
  .backdrop-container {
    position: absolute;
    z-index: -1;
    left: 0px;
    width: 100vw;
    top: -50%;
    height: calc(100vh + 300px);
    overflow: hidden;
  }
  .backdrop {
    --blur-radius: 8px;

    position: absolute;
    left: calc(var(--blur-radius) * -0.5);
    top: calc(var(--blur-radius) * -0.5);
    width: calc(100% + var(--blur-radius));
    height: calc(100% + var(--blur-radius));

    filter: blur(var(--blur-radius));
    opacity: 0.25;

    background-size: max(100%, 1000px) auto;
    background-position: center center;
    background-repeat: no-repeat;

    background-image:
      linear-gradient(to bottom, transparent, black),
      v-bind(backgroundImage);
  }
</style>
