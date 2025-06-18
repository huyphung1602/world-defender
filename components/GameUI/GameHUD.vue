<template>
  <div class="game-hud">
    <!-- Full-width XP bar at top -->
    <div class="xp-container">
      <div class="xp-bar">
        <div class="xp-fill" :style="{width: `${(player.xp / player.xpToNextLevel) * 100}%`}"></div>
        <div class="xp-text">
          Level {{ player.level }} • {{ player.xp }}/{{ player.xpToNextLevel }} XP
        </div>
      </div>
    </div>

    <!-- Score at top-right beside the bar -->
    <div class="score-display">
      {{ gameState.score.toLocaleString() }}
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
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 30;
}

/* Full-width XP bar at top */
.xp-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 120px; /* Leave space for score */
  height: 50px;
  pointer-events: none;
}

.xp-bar {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4));
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.xp-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(135deg, #2ecc71, #27ae60, #1abc9c);
  transition: width 0.5s ease;
  box-shadow: inset 0 2px 10px rgba(255, 255, 255, 0.2);
}

.xp-text {
  position: relative;
  z-index: 2;
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  font-family: 'Arial', sans-serif;
  pointer-events: none;
}

/* Score at top-right */
.score-display {
  position: absolute;
  top: 0;
  right: 0;
  width: 120px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5));
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  font-family: 'Arial', sans-serif;
  pointer-events: none;
}
</style> 