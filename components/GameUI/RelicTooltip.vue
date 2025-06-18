<template>
  <Teleport to="body">
    <div
      v-if="visible && relic"
      class="relic-tooltip"
      :style="tooltipStyle"
    >
      <div class="tooltip-header">
        <strong>{{ relic.name }}</strong>
        <span class="tooltip-rarity" :class="`rarity-${relic.rarity}`">
          {{ relic.rarity.toUpperCase() }}
        </span>
      </div>
      <div class="tooltip-description">{{ relic.description }}</div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import type { Relic } from '../../utils/gameModels';

interface Props {
  relic: Relic | null;
  visible: boolean;
  targetElement: HTMLElement | null;
}

const props = defineProps<Props>();

const tooltipStyle = computed((): CSSProperties => {
  if (!props.targetElement || !props.visible) {
    return { display: 'none' };
  }

  const rect = props.targetElement.getBoundingClientRect();
  const tooltipWidth = 250; // Approximate tooltip width
  const tooltipHeight = 80; // Approximate tooltip height
  
  // Calculate position relative to viewport
  let left = rect.left + rect.width / 2 - tooltipWidth / 2;
  let top = rect.top - tooltipHeight - 10; // Position above the element

  // Ensure tooltip stays within viewport bounds
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Adjust horizontal position if tooltip goes off screen
  if (left < 10) {
    left = 10;
  } else if (left + tooltipWidth > viewportWidth - 10) {
    left = viewportWidth - tooltipWidth - 10;
  }

  // Adjust vertical position if tooltip goes off screen
  if (top < 10) {
    // If there's no room above, position below the element
    top = rect.bottom + 10;
  }

  return {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 999999,
  };
});
</script>

<style scoped>
.relic-tooltip {
  background: rgba(0, 0, 0, 0.95);
  color: white;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  border: 2px solid #444;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.9);
  pointer-events: none;
  max-width: 250px;
  white-space: normal;
  text-align: left;
  min-width: 200px;
  /* Animation for smooth appearance */
  animation: tooltipFadeIn 0.2s ease-out;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.relic-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 8px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.95);
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.tooltip-rarity {
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tooltip-rarity.rarity-common { color: #ffffff; }
.tooltip-rarity.rarity-rare { color: #3498db; }
.tooltip-rarity.rarity-epic { color: #9b59b6; }
.tooltip-rarity.rarity-legendary { color: #f39c12; }

.tooltip-description {
  font-size: 0.9rem;
  color: #cccccc;
}
</style> 