<template>
  <div class="pause-screen-overlay">
    <div class="pause-content custom-scrollbar-modal">
      <h2>Game Paused</h2>
      <p>Press the Resume button or <KeyPrompt>ESC</KeyPrompt> key to continue</p>

      <div class="controls-info">
        <p>Controls:</p>
        <ul>
          <li>Type words to shoot enemies</li>
          <li>Type flying star words to collect relics</li>
          <li>Press ESC to pause/resume</li>
          <li>Defeat enemies to gain XP and level up</li>
        </ul>
      </div>

      <!-- Main Content Grid: Relics on left, Stats and Skills on right -->
      <div class="main-content-grid">
        <!-- Left Side: Relics -->
        <div class="relics-section">
          <h3>Collected Relics ({{ player.relics.length }})</h3>
          <div v-if="player.relics.length === 0" class="no-relics">
            <p>No relics collected yet.</p>
            <p>Look for flying ⭐ stars and type their words!</p>
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

        <!-- Right Side: Stats and Skills -->
        <div class="stats-skills-section">
          <!-- Player Stats Section -->
          <div class="player-stats">
            <h3>Earth Stats</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">Level:</span>
                <span class="stat-value">{{ player.level }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Score:</span>
                <span class="stat-value">{{ gameState.score.toLocaleString() }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Damage:</span>
                <span class="stat-value">{{ Math.floor(player.damage * player.damageMultiplier) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Shield:</span>
                <span class="stat-value">{{ Math.floor(player.shield) }}/{{ player.maxShield }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Shield Regen:</span>
                <span class="stat-value">{{ Math.floor(player.shieldRegenRate * player.shieldEfficiency) }}/s</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Crit Chance:</span>
                <span class="stat-value">{{ Math.round(player.critChance * 100) }}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Crit Multiplier:</span>
                <span class="stat-value">{{ player.critMultiplier.toFixed(1) }}x</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Projectile Size:</span>
                <span class="stat-value">{{ player.projectileSize.toFixed(1) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Experience Boost:</span>
                <span class="stat-value">{{ Math.round((player.experienceMultiplier - 1) * 100) }}%</span>
              </div>
            </div>
          </div>

          <!-- Skills Section -->
          <div class="skills-section">
            <h3>Active Skills</h3>
            <div class="skills-grid">
              <div v-for="skill in activeSkills" :key="skill.id" class="skill-item">
                <div class="skill-icon">{{ skill.icon }}</div>
                <div class="skill-info">
                  <div class="skill-name">{{ skill.name }} (Lvl {{ skill.level }})</div>
                  <div class="skill-description">{{ getSkillDescription(skill) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="button-container">
        <button @click="$emit('togglePause')" class="resume-button">Resume Game <KeyPrompt>ESC</KeyPrompt></button>
        <button @click="$emit('restartGame')" class="restart-button">Restart Run</button>
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
import { ref } from 'vue';
import type { Player, Skill, GameState, Relic } from '../../utils/gameModels';
import RelicTooltip from './RelicTooltip.vue';
import KeyPrompt from '../UI/KeyPrompt.vue';

interface Props {
  player: Player;
  gameState: GameState;
  activeSkills: Skill[];
}

defineProps<Props>();

defineEmits<{
  togglePause: [];
  restartGame: [];
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

// Get a description for a skill that includes its current level effects
const getSkillDescription = (skill: Skill) => {
  switch (skill.id) {
    case 'damage':
      return `Increases damage by ${5 * skill.level}`;
    case 'crit':
      return `Increases critical chance by ${5 * skill.level}%`;
    case 'triple_shot':
      if (skill.level === 0) {
        return `Unlocks triple shot ability`;
      } else {
        const chance = skill.level === 1 ? 10 : 10 + ((skill.level - 1) * 5);
        return `${chance}% chance to fire ${2 + skill.level} shots`;
      }
    case 'shield':
      return `Increases max shield by ${25 * skill.level}`;
    case 'regen':
      return `Shield regenerates at ${skill.level}/s`;
    case 'explosive':
      return `${skill.level * 10}% chance for explosions`;
    case 'frozen_bullets':
      return `Fires ${12 + skill.level} ice bullets every ${Math.max(10, 20 - skill.level * 2)}s`;
    case 'smart_auto':
      return `Auto-fires every ${Math.max(3, 10 - skill.level * 1.5)}s`;
    case 'bounce':
      return `Bullets bounce ${skill.level} times with 25% chance`;
    default:
      return skill.description;
  }
};
</script>

<style scoped>
.pause-screen-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  pointer-events: auto;
}

.pause-content {
  background-color: rgba(30, 30, 50, 0.95);
  padding: 30px;
  border-radius: 15px;
  text-align: center;
  border: 2px solid #3498db;
  box-shadow: 0 0 20px rgba(52, 152, 219, 0.5);
  color: white;
  max-width: 1000px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1001;
  overflow-y: auto;
}

.pause-content h2 {
  margin-bottom: 20px;
  color: #3498db;
}

.pause-content p {
  margin-bottom: 20px;
  color: #ffffff;
}

.controls-info {
  margin: 20px 0;
  text-align: left;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 15px;
  border-radius: 10px;
}

.controls-info p {
  margin-bottom: 10px;
  color: #3498db;
  font-weight: bold;
}

.controls-info ul {
  list-style-type: none;
  padding-left: 10px;
}

.controls-info li {
  margin-bottom: 8px;
  color: #ffffff;
  position: relative;
  padding-left: 20px;
}

.controls-info li:before {
  content: "•";
  color: #3498db;
  font-weight: bold;
  position: absolute;
  left: 0;
}

.player-stats {
  margin: 20px 0;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 15px;
  border-radius: 10px;
}

.player-stats h3 {
  color: #3498db;
  margin-bottom: 15px;
  border-bottom: 1px solid rgba(52, 152, 219, 0.3);
  padding-bottom: 5px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stat-item {
  text-align: center;
  background-color: rgba(52, 152, 219, 0.1);
  padding: 8px;
  border-radius: 5px;
}

.stat-label {
  font-weight: bold;
  color: #3498db;
  display: block;
  margin-bottom: 5px;
}

.stat-value {
  color: white;
  font-size: 1.2rem;
}

.skills-section {
  margin: 20px 0;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 15px;
  border-radius: 10px;
}

.skills-section h3 {
  color: #3498db;
  margin-bottom: 15px;
  border-bottom: 1px solid rgba(52, 152, 219, 0.3);
  padding-bottom: 5px;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.skill-item {
  display: flex;
  align-items: center;
  background-color: rgba(52, 152, 219, 0.1);
  padding: 10px;
  border-radius: 5px;
}

.skill-icon {
  font-size: 24px;
  margin-right: 10px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(52, 152, 219, 0.2);
  border-radius: 50%;
}

.skill-info {
  flex: 1;
}

.skill-name {
  font-weight: bold;
  color: #3498db;
}

.skill-description {
  margin-top: 5px;
  font-size: 0.9rem;
  color: #cccccc;
}

.resume-button {
  padding: 12px 20px;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #3498db;
  color: white;
}

.resume-button:hover {
  background-color: #2980b9;
  transform: scale(1.05);
}

.button-container {
  margin-top: 20px;
}

.restart-button {
  padding: 12px 20px;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #e74c3c;
  color: white;
  margin-left: 10px;
}

.restart-button:hover {
  background-color: #c0392b;
  transform: scale(1.05);
}

.main-content-grid {
  display: flex;
  gap: 30px;
  margin: 20px 0;
  text-align: left;
  flex: 1;
  overflow: visible;
}

.relics-section {
  background-color: rgba(0, 0, 0, 0.3);
  padding: 20px;
  border-radius: 10px;
  flex: 1;
  overflow: visible;
}

.relics-section h3 {
  color: #ffd700;
  margin-bottom: 15px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  padding-bottom: 5px;
  text-align: center;
}

.no-relics {
  text-align: center;
  color: #cccccc;
  padding: 20px;
}

.no-relics p {
  margin-bottom: 10px;
}

.relics-grid {
  display: grid;
  height: auto;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  overflow-y: auto;
  padding: 10px;
  overflow-x: visible;
}

.relic-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px;
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

.relic-item.rarity-common {
  border-color: rgba(255, 255, 255, 0.3);
}

.relic-item.rarity-rare {
  border-color: rgba(52, 152, 219, 0.6);
  background: rgba(52, 152, 219, 0.1);
}

.relic-item.rarity-epic {
  border-color: rgba(155, 89, 182, 0.6);
  background: rgba(155, 89, 182, 0.1);
}

.relic-item.rarity-legendary {
  border-color: rgba(243, 156, 18, 0.8);
  background: rgba(243, 156, 18, 0.1);
  animation: legendaryPulse 2s ease-in-out infinite alternate;
}

.relic-icon {
  font-size: 1.5rem;
  margin-bottom: 4px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.relic-name {
  font-size: 0.7rem;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 2px;
  line-height: 1.1;
}

.relic-rarity {
  font-size: 0.6rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.relic-item.rarity-common .relic-rarity { color: #ffffff; }
.relic-item.rarity-rare .relic-rarity { color: #3498db; }
.relic-item.rarity-epic .relic-rarity { color: #9b59b6; }
.relic-item.rarity-legendary .relic-rarity { color: #f39c12; }

.stats-skills-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow: visible;
}

@keyframes legendaryPulse {
  from {
    box-shadow: 0 0 5px rgba(243, 156, 18, 0.3);
  }
  to {
    box-shadow: 0 0 15px rgba(243, 156, 18, 0.6), 0 0 25px rgba(243, 156, 18, 0.3);
  }
}
</style>
