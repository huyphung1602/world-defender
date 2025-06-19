<template>
  <span class="key-prompt">
    <slot />
  </span>
</template>

<script setup lang="ts">
// No props needed - just use slots for the key text
</script>

<style scoped>
.key-prompt {
  display: inline-block;
  background: linear-gradient(145deg, #f0f0f0, #d0d0d0) !important;
  color: #333 !important;
  border: 1px solid #bbb;
  border-radius: 4px;
  padding: 2px 6px;
  margin: 0 2px;
  font-size: 0.9rem;
  font-weight: bold;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.8),
    inset 0 -1px 1px rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);
}
</style>
