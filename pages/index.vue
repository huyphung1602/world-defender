<template>
  <div class="page-container">
    <Game />
  </div>
</template>

<script setup lang="ts">
import Game from '~/components/Game.vue';

// Set page meta for the typing game
useHead({
  title: 'Typing Game - Defend Earth',
  meta: [
    { name: 'description', content: 'An intense typing game where you defend Earth from alien invaders using your keyboard skills!' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ]
});
</script>

<style scoped>
.page-container {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #0a0a0a;
}
</style>
