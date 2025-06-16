<template>
  <div class="pause-screen-overlay">
    <div class="pause-content">
      <h2>Game Paused</h2>
      <p>Press the Resume button or ESC key to continue</p>

      <div class="controls-info">
        <p>Controls:</p>
        <ul>
          <li>Type words to shoot enemies</li>
          <li>Press ESC to pause/resume</li>
          <li>Defeat enemies to gain XP and level up</li>
        </ul>
      </div>

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
            <span class="stat-value">{{ player.damage }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Shield:</span>
            <span class="stat-value">{{ Math.floor(player.shield) }}/{{ player.maxShield }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Shield Regen:</span>
            <span class="stat-value">{{ player.shieldRegenRate }}/s</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Crit Chance:</span>
            <span class="stat-value">{{ Math.round(player.critChance * 100) }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Crit Multiplier:</span>
            <span class="stat-value">{{ player.critMultiplier }}x</span>
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

      <div class="button-container">
        <button @click="$emit('togglePause')" class="resume-button">Resume Game</button>
        <button @click="$emit('restartGame')" class="restart-button">Restart Run</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player, Skill, GameState } from '../../utils/gameModels';

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

// Get a description for a skill that includes its current level effects
const getSkillDescription = (skill: Skill) => {
  switch (skill.id) {
    case 'damage':
      return `Increases damage by ${5 * skill.level}`;
    case 'crit':
      return `Increases critical chance by ${5 * skill.level}%`;
    case 'multi_shoot':
      return `${skill.level} extra targets with ${skill.level * 5}% chance`;
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
  z-index: 100;
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
  max-width: 600px;
  max-height: 80vh;
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
  gap: 15px;
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
</style>