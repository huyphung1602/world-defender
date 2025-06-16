<template>
  <div class="game-hud">
    <div class="hud-item">Level: {{ player.level }}</div>
    <div class="hud-item">Score: {{ gameState.score.toLocaleString() }}</div>
    <div class="hud-item shield">
      <div class="shield-bar">
        <div class="shield-fill" :style="{width: `${(player.shield / player.maxShield) * 100}%`}"></div>
      </div>
      <span>Shield: {{ Math.floor(player.shield) }}/{{ player.maxShield }}</span>
    </div>
    <div class="hud-item">
      <div class="xp-bar">
        <div class="xp-fill" :style="{width: `${(player.xp / player.xpToNextLevel) * 100}%`}"></div>
      </div>
      <span>XP: {{ player.xp }}/{{ player.xpToNextLevel }}</span>
    </div>
    <div class="hud-item">
      <button @click="$emit('togglePause')" class="pause-button">
        {{ isPaused ? 'Resume' : 'Pause (ESC)' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player, GameState } from '../../utils/gameModels';

interface Props {
  player: Player;
  gameState: GameState;
  isPaused: boolean;
}

defineProps<Props>();

defineEmits<{
  togglePause: []
}>();
</script>

<style scoped>
.game-hud {
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 10px;
  padding: 10px;
  color: white;
  font-size: 16px;
  font-weight: bold;
  z-index: 30;
  pointer-events: auto;
}

.hud-item {
  margin-bottom: 5px;
  display: flex;
  align-items: center;
}

.shield-bar, .xp-bar {
  width: 150px;
  height: 10px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  margin-right: 10px;
  overflow: hidden;
}

.shield-fill {
  height: 100%;
  background-color: #3498db;
  border-radius: 5px;
  transition: width 0.3s ease;
}

.xp-fill {
  height: 100%;
  background-color: #2ecc71;
  border-radius: 5px;
  transition: width 0.3s ease;
}

.pause-button {
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

.pause-button:hover {
  background-color: #2980b9;
  transform: scale(1.05);
}
</style> 