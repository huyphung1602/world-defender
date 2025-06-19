<template>
  <div v-if="relic" class="relic-announcement-overlay" @click="closeModal">
    <div class="relic-announcement-content" @click.stop>
      <div class="relic-header">
        <h2>Relic Acquired!</h2>
        <div class="relic-icon-large" :style="{ boxShadow: `0 0 30px ${relic.auraColor}` }">
          {{ relic.icon }}
        </div>
      </div>

      <div class="relic-info">
        <h3 :class="`relic-name rarity-${relic.rarity}`">{{ relic.name }}</h3>
        <div :class="`rarity-badge rarity-${relic.rarity}`">{{ rarity.toUpperCase() }}</div>
        <p class="relic-description">{{ relic.description }}</p>
      </div>

      <div class="relic-effects">
        <h4>Effects:</h4>
        <div class="effects-list">
          <div v-for="effect in parsedEffects" :key="effect.stat" class="effect-item">
            <span class="effect-icon">{{ effect.icon }}</span>
            <span class="effect-text">{{ effect.text }}</span>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button @click="closeModal" class="continue-button">
          Continue Fighting! <KeyPrompt>⏎</KeyPrompt>/<KeyPrompt>ESC</KeyPrompt>
        </button>
      </div>

      <div class="sparkle-effect"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import type { Relic } from '../../utils/gameModels';
import KeyPrompt from '../UI/KeyPrompt.vue';

interface Props {
  relic: Relic | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

const rarity = computed(() => props.relic?.rarity || 'common');

// Keyboard event handler
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === 'Escape') {
    closeModal();
  }
};

// Add keyboard listener when component mounts
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

// Remove keyboard listener when component unmounts
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

const parsedEffects = computed(() => {
  if (!props.relic) return [];

  const effects = [];
  const desc = props.relic.description.toLowerCase();

  // Parse common effect patterns from description
  if (desc.includes('damage')) {
    if (desc.includes('100%')) effects.push({ icon: '⚔️', stat: 'damage', text: '+100% Damage' });
    else if (desc.includes('50%')) effects.push({ icon: '⚔️', stat: 'damage', text: '+50% Damage' });
    else if (desc.includes('25%')) effects.push({ icon: '⚔️', stat: 'damage', text: '+25% Damage' });
    else if (desc.includes('10')) effects.push({ icon: '⚔️', stat: 'damage', text: '+10 Damage' });
  }

  if (desc.includes('speed')) {
    if (desc.includes('100%')) effects.push({ icon: '💨', stat: 'speed', text: '+100% Speed' });
    else if (desc.includes('50%')) effects.push({ icon: '💨', stat: 'speed', text: '+50% Speed' });
    else if (desc.includes('25%')) effects.push({ icon: '💨', stat: 'speed', text: '+25% Speed' });
  }

  if (desc.includes('shield')) {
    if (desc.includes('efficiency')) effects.push({ icon: '🛡️', stat: 'shield', text: '+25% Shield Efficiency' });
    else effects.push({ icon: '🛡️', stat: 'shield', text: '+50 Shield' });
  }

  if (desc.includes('critical')) {
    effects.push({ icon: '💥', stat: 'crit', text: '+15% Crit Chance' });
  }

  if (desc.includes('experience')) {
    effects.push({ icon: '⭐', stat: 'exp', text: '+25% Experience' });
  }

  if (desc.includes('rage') || desc.includes('berserker')) {
    effects.push({ icon: '😡', stat: 'rage', text: 'Rage Mode: Low HP = High Damage' });
  }

  if (desc.includes('mystic') || desc.includes('sight')) {
    effects.push({ icon: '👁️', stat: 'sight', text: 'Reveals Enemy Weaknesses' });
  }

  if (desc.includes('storm')) {
    effects.push({ icon: '⚡', stat: 'storm', text: 'Chain Lightning Attacks' });
  }

  if (desc.includes('echo')) {
    effects.push({ icon: '🔊', stat: 'echo', text: 'Ability Echoes' });
  }

  if (desc.includes('fusion')) {
    effects.push({ icon: '⚛️', stat: 'fusion', text: 'Energy Fusion Reactions' });
  }

  if (desc.includes('quantum')) {
    effects.push({ icon: '🌀', stat: 'quantum', text: 'Quantum Processing' });
  }

  if (desc.includes('titan')) {
    effects.push({ icon: '🏛️', stat: 'titan', text: 'Massive Defensive Boost' });
  }

  if (desc.includes('omnipotent')) {
    effects.push({ icon: '👑', stat: 'omnipotent', text: '+100% ALL STATS!' });
  }

  if (desc.includes('time') || desc.includes('dilation')) {
    effects.push({ icon: '⏰', stat: 'time', text: 'Slows Down Time' });
  }

  // If no specific effects found, create a generic one
  if (effects.length === 0) {
    effects.push({ icon: '✨', stat: 'generic', text: props.relic.description });
  }

  return effects;
});

const closeModal = () => {
  emit('close');
};
</script>

<style scoped>
.relic-announcement-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
  pointer-events: auto;
  animation: fadeIn 0.3s ease;
}

.relic-announcement-content {
  background: linear-gradient(135deg, rgba(30, 30, 60, 0.95), rgba(50, 50, 80, 0.95));
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  border: 3px solid #ffd700;
  box-shadow: 0 0 40px rgba(255, 215, 0, 0.8), inset 0 0 20px rgba(255, 215, 0, 0.1);
  color: white;
  max-width: 500px;
  min-width: 400px;
  position: relative;
  animation: scaleIn 0.5s ease;
  overflow: hidden;
}

.relic-header {
  margin-bottom: 30px;
}

.relic-header h2 {
  color: #ffd700;
  font-size: 2.5rem;
  margin-bottom: 20px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
  animation: glow 2s ease-in-out infinite alternate;
}

.relic-icon-large {
  font-size: 4rem;
  width: 120px;
  height: 120px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1), transparent);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.relic-info {
  margin-bottom: 30px;
}

.relic-name {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 10px;
  text-shadow: 0 0 5px currentColor;
}

.relic-name.rarity-common { color: #ffffff; }
.relic-name.rarity-rare { color: #3498db; }
.relic-name.rarity-epic { color: #9b59b6; }
.relic-name.rarity-legendary { color: #f39c12; }

.rarity-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: bold;
  margin-bottom: 15px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.rarity-badge.rarity-common {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  border: 1px solid #ffffff;
}

.rarity-badge.rarity-rare {
  background: rgba(52, 152, 219, 0.3);
  color: #3498db;
  border: 1px solid #3498db;
}

.rarity-badge.rarity-epic {
  background: rgba(155, 89, 182, 0.3);
  color: #9b59b6;
  border: 1px solid #9b59b6;
}

.rarity-badge.rarity-legendary {
  background: rgba(243, 156, 18, 0.3);
  color: #f39c12;
  border: 1px solid #f39c12;
  animation: legendaryGlow 1.5s ease-in-out infinite alternate;
}

.relic-description {
  font-size: 1.1rem;
  color: #cccccc;
  line-height: 1.5;
  font-style: italic;
}

.relic-effects {
  background: rgba(0, 0, 0, 0.3);
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
}

.relic-effects h4 {
  color: #ffd700;
  margin-bottom: 15px;
  font-size: 1.3rem;
}

.effects-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.effect-item {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
}

.effect-icon {
  font-size: 1.2rem;
  margin-right: 10px;
  width: 25px;
  text-align: center;
}

.effect-text {
  color: #ffffff;
  font-weight: 500;
}

.continue-button {
  padding: 15px 30px;
  border: none;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  color: #333;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
}

.continue-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.6);
}

.sparkle-effect {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.8) 1px, transparent 1px),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.8) 1px, transparent 1px),
    radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.6) 1px, transparent 1px);
  animation: sparkle 3s ease-in-out infinite;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes glow {
  from { text-shadow: 0 0 10px rgba(255, 215, 0, 0.8); }
  to { text-shadow: 0 0 20px rgba(255, 215, 0, 1), 0 0 30px rgba(255, 215, 0, 0.8); }
}

@keyframes pulse {
  from { transform: scale(1); }
  to { transform: scale(1.1); }
}

@keyframes legendaryGlow {
  from { box-shadow: 0 0 5px rgba(243, 156, 18, 0.5); }
  to { box-shadow: 0 0 15px rgba(243, 156, 18, 0.8), 0 0 25px rgba(243, 156, 18, 0.6); }
}

@keyframes sparkle {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}
</style>
