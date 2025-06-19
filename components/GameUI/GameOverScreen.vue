<template>
  <div class="game-over-overlay">
    <div class="game-over-content custom-scrollbar-modal">
      <!-- Victory/Defeat Header -->
      <div class="game-over-header" :class="{ victory: gameWon, defeat: !gameWon }">
        <h1 v-if="gameWon">🏆 VICTORY! 🏆</h1>
        <h1 v-else>💀 DEFEAT 💀</h1>
        <p v-if="gameWon">You survived the full 20 minutes!</p>
        <p v-else>Your defenses have been breached...</p>
      </div>

      <!-- Main Stats Grid -->
      <div class="main-stats-grid">
        <!-- Final Statistics -->
        <div class="final-stats-section">
          <h3>Final Statistics</h3>
          <div class="stats-grid">
            <div class="stat-item large">
              <span class="stat-label">Final Score</span>
              <span class="stat-value">{{ gameState.score.toLocaleString() }}</span>
            </div>
            <div class="stat-item large">
              <span class="stat-label">Enemies Defeated</span>
              <span class="stat-value">{{ gameState.enemiesKilled.toLocaleString() }}</span>
            </div>
            <div class="stat-item large">
              <span class="stat-label">Survival Time</span>
              <span class="stat-value">{{ formattedSurvivalTime }}</span>
            </div>
            <div class="stat-item large">
              <span class="stat-label">Final Level</span>
              <span class="stat-value">{{ player.level }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Damage</span>
              <span class="stat-value">{{ Math.floor(player.damage * player.damageMultiplier) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Shield</span>
              <span class="stat-value">{{ Math.floor(player.shield) }}/{{ player.maxShield }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Crit Chance</span>
              <span class="stat-value">{{ Math.round(player.critChance * 100) }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Projectile Size</span>
              <span class="stat-value">{{ player.projectileSize.toFixed(1) }}</span>
            </div>
          </div>
        </div>

        <!-- Collected Relics -->
        <div class="relics-section">
          <h3>Collected Relics ({{ player.relics.length }})</h3>
          <div v-if="player.relics.length === 0" class="no-items">
            <p>No relics were collected this run.</p>
          </div>
          <div v-else class="relics-grid custom-scrollbar-gold">
            <div
              v-for="relic in player.relics"
              :key="relic.id"
              :ref="el => setRelicRef(relic.id, el as HTMLElement)"
              class="relic-item"
              :class="`rarity-${relic.rarity}`"
              @mouseenter="showTooltip(relic, $event.currentTarget as HTMLElement)"
              @mouseleave="hideTooltip"
            >
              <div class="relic-icon" :style="{ boxShadow: `0 0 10px ${relic.auraColor}` }">
                {{ relic.icon }}
              </div>
              <div class="relic-name">{{ relic.name }}</div>
              <div class="relic-rarity">{{ relic.rarity.toUpperCase() }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Skills Section -->
      <div class="skills-section">
        <h3>Mastered Skills</h3>
        <div v-if="activeSkills.length === 0" class="no-items">
          <p>No skills were learned this run.</p>
        </div>
        <div v-else class="skills-grid custom-scrollbar-purple">
          <div v-for="skill in activeSkills" :key="skill.id" class="skill-item">
            <div class="skill-icon">{{ skill.icon }}</div>
            <div class="skill-info">
              <div class="skill-name">{{ skill.name }} (Lvl {{ skill.level }})</div>
              <div class="skill-description">{{ skill.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="button-container">
        <button @click="$emit('restartGame')" class="play-again-button">
          🔄 Play Again <KeyPrompt>Enter</KeyPrompt>
        </button>
        <button @click="$emit('backToMenu')" class="menu-button">
          🏠 Main Menu <KeyPrompt>ESC</KeyPrompt>
        </button>
      </div>
    </div>

    <!-- Reusable Tooltip Component using Teleport -->
    <RelicTooltip
      :relic="tooltipRelic"
      :visible="tooltipVisible"
      :targetElement="tooltipTargetElement"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import type { Player, Skill, GameState, Relic } from '../../utils/gameModels';
import RelicTooltip from './RelicTooltip.vue';
import KeyPrompt from '../UI/KeyPrompt.vue';

interface Props {
  player: Player;
  gameState: GameState;
  activeSkills: Skill[];
  gameWon: boolean;
  survivalTime: number; // Time in milliseconds
}

const props = defineProps<Props>();

const emit = defineEmits<{
  restartGame: [];
  backToMenu: [];
}>();

// Tooltip state
const tooltipVisible = ref(false);
const tooltipRelic = ref<Relic | null>(null);
const tooltipTargetElement = ref<HTMLElement | null>(null);
const relicRefs = ref<Map<string, HTMLElement>>(new Map());

// Set ref for each relic element
const setRelicRef = (relicId: string, el: HTMLElement | null) => {
  if (el) {
    relicRefs.value.set(relicId, el);
  } else {
    relicRefs.value.delete(relicId);
  }
};

// Show tooltip
const showTooltip = (relic: Relic, targetElement: HTMLElement) => {
  tooltipRelic.value = relic;
  tooltipTargetElement.value = targetElement;
  tooltipVisible.value = true;
};

// Hide tooltip
const hideTooltip = () => {
  tooltipVisible.value = false;
  tooltipRelic.value = null;
  tooltipTargetElement.value = null;
};

// Format survival time in MM:SS format
const formattedSurvivalTime = computed(() => {
  const totalSeconds = Math.floor(props.survivalTime / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

// Keyboard event handler
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    emit('restartGame');
  } else if (event.key === 'Escape') {
    emit('backToMenu');
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
</script>

<style scoped>
.game-over-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 20, 40, 0.9));
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  pointer-events: auto;
}

.game-over-content {
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.95), rgba(40, 40, 60, 0.95));
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  border: 3px solid;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
  color: white;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.game-over-content.victory {
  border-color: #f39c12;
  box-shadow: 0 0 30px rgba(243, 156, 18, 0.6);
}

.game-over-content.defeat {
  border-color: #e74c3c;
  box-shadow: 0 0 30px rgba(231, 76, 60, 0.6);
}

.game-over-header {
  margin-bottom: 30px;
  padding: 20px;
  border-radius: 15px;
  border: 2px solid;
}

.game-over-header.victory {
  background: linear-gradient(135deg, rgba(243, 156, 18, 0.2), rgba(241, 196, 15, 0.1));
  border-color: #f39c12;
}

.game-over-header.defeat {
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.2), rgba(192, 57, 43, 0.1));
  border-color: #e74c3c;
}

.game-over-header h1 {
  font-size: 3rem;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.game-over-header.victory h1 {
  color: #f39c12;
  animation: victoryPulse 2s ease-in-out infinite alternate;
}

.game-over-header.defeat h1 {
  color: #e74c3c;
}

.game-over-header p {
  font-size: 1.3rem;
  margin: 0;
  opacity: 0.9;
}

.main-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin: 30px 0;
  text-align: left;
}

.final-stats-section, .relics-section {
  background: rgba(0, 0, 0, 0.4);
  padding: 25px;
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.final-stats-section h3, .relics-section h3 {
  color: #3498db;
  margin-bottom: 20px;
  border-bottom: 2px solid rgba(52, 152, 219, 0.3);
  padding-bottom: 8px;
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.stat-item {
  background: rgba(52, 152, 219, 0.1);
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid rgba(52, 152, 219, 0.2);
}

.stat-item.large {
  grid-column: 1 / -1;
  background: rgba(52, 152, 219, 0.2);
  border: 2px solid rgba(52, 152, 219, 0.4);
}

.stat-label {
  font-weight: bold;
  color: #3498db;
  display: block;
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.stat-value {
  color: white;
  font-size: 1.4rem;
  font-weight: bold;
}

.stat-item.large .stat-value {
  font-size: 1.8rem;
}

.relics-section h3 {
  color: #ffd700;
  border-bottom-color: rgba(255, 215, 0, 0.3);
}

.no-items {
  text-align: center;
  color: #cccccc;
  padding: 20px;
  font-style: italic;
}

.relics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  overflow-y: auto;
}

.relic-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  position: relative;
}

.relic-item:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.2);
}

.relic-rarity {
  font-size: 0.65rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.relic-item.rarity-common .relic-rarity { color: #ffffff; }
.relic-item.rarity-rare .relic-rarity { color: #3498db; }
.relic-item.rarity-epic .relic-rarity { color: #9b59b6; }
.relic-item.rarity-legendary .relic-rarity { color: #f39c12; }

.relic-item.rarity-common { border-color: rgba(255, 255, 255, 0.3); }
.relic-item.rarity-rare { border-color: rgba(52, 152, 219, 0.6); background: rgba(52, 152, 219, 0.1); }
.relic-item.rarity-epic { border-color: rgba(155, 89, 182, 0.6); background: rgba(155, 89, 182, 0.1); }
.relic-item.rarity-legendary {
  border-color: rgba(243, 156, 18, 0.8);
  background: rgba(243, 156, 18, 0.1);
  animation: legendaryPulse 2s ease-in-out infinite alternate;
}

.relic-icon {
  font-size: 1.8rem;
  margin-bottom: 6px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.relic-name {
  font-size: 0.75rem;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 3px;
  line-height: 1.1;
}

.skills-section {
  margin: 30px 0;
  background: rgba(0, 0, 0, 0.4);
  padding: 25px;
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: left;
}

.skills-section h3 {
  color: #9b59b6;
  margin-bottom: 20px;
  border-bottom: 2px solid rgba(155, 89, 182, 0.3);
  padding-bottom: 8px;
  text-align: center;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
  overflow-y: auto;
}

.skill-item {
  display: flex;
  align-items: center;
  background: rgba(155, 89, 182, 0.1);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(155, 89, 182, 0.2);
}

.skill-icon {
  font-size: 28px;
  margin-right: 12px;
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(155, 89, 182, 0.2);
  border-radius: 50%;
}

.skill-info {
  flex: 1;
}

.skill-name {
  font-weight: bold;
  color: #9b59b6;
  margin-bottom: 3px;
}

.skill-description {
  font-size: 0.9rem;
  color: #cccccc;
  line-height: 1.3;
}

.button-container {
  margin-top: 30px;
  display: flex;
  gap: 20px;
  justify-content: center;
}

.play-again-button, .menu-button {
  padding: 15px 30px;
  border: none;
  border-radius: 30px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.play-again-button {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
}

.play-again-button:hover {
  background: linear-gradient(135deg, #229954, #27ae60);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
}

.menu-button {
  background: linear-gradient(135deg, #34495e, #2c3e50);
  color: white;
}

.menu-button:hover {
  background: linear-gradient(135deg, #2c3e50, #34495e);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 73, 94, 0.4);
}

@keyframes victoryPulse {
  from {
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 10px rgba(243, 156, 18, 0.3);
  }
  to {
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 20px rgba(243, 156, 18, 0.6), 0 0 30px rgba(243, 156, 18, 0.3);
  }
}

@keyframes legendaryPulse {
  from {
    box-shadow: 0 0 5px rgba(243, 156, 18, 0.3);
  }
  to {
    box-shadow: 0 0 15px rgba(243, 156, 18, 0.6), 0 0 25px rgba(243, 156, 18, 0.3);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .main-stats-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .button-container {
    flex-direction: column;
    align-items: center;
  }

  .play-again-button, .menu-button {
    width: 100%;
    max-width: 300px;
  }
}
</style>
