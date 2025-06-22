<template>
  <div class="skill-tracker">
    <!-- Arctic Barrage Tracker -->
    <div v-if="player.frostMasteryLevel > 0" class="skill-item arctic">
      <div class="skill-header">
        <span class="skill-icon">🏹</span>
        <span class="skill-name">Arctic Barrage</span>
        <span class="skill-level">Lv.{{ player.frostMasteryLevel }}</span>
      </div>
      <div class="progress-container">
        <div class="progress-bar">
          <div
            class="progress-fill arctic-fill"
            :style="{ width: arcticProgress + '%' }"
          ></div>
        </div>
        <span class="progress-text">
          {{ player.frostMasteryKills }}/{{ player.frostMasteryKillsRequired }} kills
        </span>
      </div>
      <div class="skill-effect">{{ player.frozenBulletCount }} ice arrows</div>
    </div>

    <!-- Meteor Storm Tracker -->
    <div v-if="player.fireMasteryLevel > 0" class="skill-item meteor">
      <div class="skill-header">
        <span class="skill-icon">☄️</span>
        <span class="skill-name">Meteor Storm</span>
        <span class="skill-level">Lv.{{ player.fireMasteryLevel }}</span>
      </div>
      <div class="progress-container">
        <div class="progress-bar">
          <div
            class="progress-fill meteor-fill"
            :style="{ width: meteorProgress + '%' }"
          ></div>
        </div>
        <span class="progress-text">
          {{ player.fireMasteryKills }}/{{ player.fireMasteryKillsRequired }} kills
        </span>
      </div>
      <div class="skill-effect">Screen-wide fire meteors</div>
    </div>

    <!-- Multi-Shot Tracker -->
    <div v-if="player.multiShotTargets >= 2" class="skill-item multishot">
      <div class="skill-header">
        <span class="skill-icon">🔱</span>
        <span class="skill-name">Rapid Fire</span>
        <span class="skill-level">Lv.{{ Math.max(0, player.multiShotTargets - 2) }}</span>
      </div>
      <div class="progress-container">
        <div class="progress-bar">
          <div
            class="progress-fill multishot-fill"
            :style="{ width: multishotProgress + '%' }"
          ></div>
        </div>
        <span class="progress-text">
          {{ player.purpleKillCount }}/3 kills
        </span>
      </div>
      <div class="skill-effect">{{ player.multiShotTargets }} targets per shot</div>
    </div>

    <!-- Bouncing Shot Tracker -->
    <div class="skill-item bouncing">
      <div class="skill-header">
        <span class="skill-icon">↩️</span>
        <span class="skill-name">Ricochet</span>
        <span class="skill-level">Lv.{{ Math.max(0, player.bounceCount - 1) }}</span>
      </div>
      <div class="progress-container">
        <div class="progress-text blue-text">
          Blue enemies trigger bouncing shots
        </div>
      </div>
      <div class="skill-effect">{{ player.bounceCount }} bounces, {{ player.bounceRange }} range</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Player } from '~/utils/gameModels';

interface Props {
  player: Player;
}

const props = defineProps<Props>();

// Computed progress percentages
const arcticProgress = computed(() => {
  if (props.player.frostMasteryKillsRequired === 0) return 0;
  return Math.min(100, (props.player.frostMasteryKills / props.player.frostMasteryKillsRequired) * 100);
});

const meteorProgress = computed(() => {
  if (props.player.fireMasteryKillsRequired === 0) return 0;
  return Math.min(100, (props.player.fireMasteryKills / props.player.fireMasteryKillsRequired) * 100);
});

const multishotProgress = computed(() => {
  return Math.min(100, (props.player.purpleKillCount / 3) * 100);
});
</script>

<style scoped>
.skill-tracker {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.skill-item {
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid;
  border-radius: 8px;
  padding: 12px;
  min-width: 280px;
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.skill-item.arctic {
  border-color: #87ceeb;
  box-shadow: 0 0 12px rgba(135, 206, 235, 0.4);
}

.skill-item.meteor {
  border-color: #ff6b47;
  box-shadow: 0 0 12px rgba(255, 107, 71, 0.4);
}

.skill-item.multishot {
  border-color: #8b5cf6;
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.4);
}

.skill-item.bouncing {
  border-color: #4a90e2;
  box-shadow: 0 0 12px rgba(74, 144, 226, 0.4);
}

.skill-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.skill-icon {
  font-size: 18px;
}

.skill-name {
  color: #ffffff;
  font-weight: bold;
  font-size: 14px;
  flex: 1;
}

.skill-level {
  color: #ffd700;
  font-size: 12px;
  font-weight: bold;
}

.progress-container {
  margin-bottom: 6px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.arctic-fill {
  background: linear-gradient(90deg, #87ceeb, #00bfff);
  box-shadow: 0 0 8px rgba(135, 206, 235, 0.6);
}

.meteor-fill {
  background: linear-gradient(90deg, #ff6b47, #ff4500);
  box-shadow: 0 0 8px rgba(255, 107, 71, 0.6);
}

.multishot-fill {
  background: linear-gradient(90deg, #8b5cf6, #a855f7);
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.6);
}

.progress-text {
  color: #cccccc;
  font-size: 11px;
  font-weight: 500;
}

.blue-text {
  color: #4a90e2;
  font-weight: bold;
}

.skill-effect {
  color: #aaaaaa;
  font-size: 10px;
  font-style: italic;
}

/* Glow animation for ready skills */
.skill-item.arctic .progress-fill.arctic-fill[style*="100%"] {
  animation: arcticGlow 1s ease-in-out infinite alternate;
}

.skill-item.meteor .progress-fill.meteor-fill[style*="100%"] {
  animation: meteorGlow 1s ease-in-out infinite alternate;
}

.skill-item.multishot .progress-fill.multishot-fill[style*="100%"] {
  animation: multishotGlow 1s ease-in-out infinite alternate;
}

@keyframes arcticGlow {
  from { box-shadow: 0 0 8px rgba(135, 206, 235, 0.6); }
  to { box-shadow: 0 0 16px rgba(135, 206, 235, 1), 0 0 24px rgba(135, 206, 235, 0.5); }
}

@keyframes meteorGlow {
  from { box-shadow: 0 0 8px rgba(255, 107, 71, 0.6); }
  to { box-shadow: 0 0 16px rgba(255, 107, 71, 1), 0 0 24px rgba(255, 107, 71, 0.5); }
}

@keyframes multishotGlow {
  from { box-shadow: 0 0 8px rgba(139, 92, 246, 0.6); }
  to { box-shadow: 0 0 16px rgba(139, 92, 246, 1), 0 0 24px rgba(139, 92, 246, 0.5); }
}
</style>