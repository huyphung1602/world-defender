<template>
  <div class="game-container">
    <!-- Game Canvas -->
    <canvas
      ref="gameCanvas"
      class="game-canvas"
      :width="canvasWidth"
      :height="canvasHeight"
    ></canvas>

    <!-- In-game UI Elements -->
    <div v-if="gameState.isPlaying && !gameState.isGameOver" class="game-ui-elements">
      <!-- HUD with timer and shield -->
      <GameHUD
        :player="gameState.player"
        :gameState="gameState"
        :isPaused="isPaused"
        :currentTime="currentTime"
        @togglePause="togglePause"
      />

      <!-- Wrong Typing Visual Feedback -->
      <div
        v-if="wrongTypingEffect > 0"
        class="wrong-typing-overlay"
        :style="{ opacity: wrongTypingEffect }"
      ></div>

      <!-- Pause Screen -->
      <PauseScreen
        v-if="isPaused"
        :player="gameState.player"
        :gameState="gameState"
        :activeSkills="activeSkills"
        @togglePause="togglePause"
        @restartGame="restartGame"
      />

      <!-- Level Up Screen -->
      <LevelUpScreen
        v-if="gameState.isPausedForLevelUp"
        :playerLevel="gameState.player.level"
        :availableSkills="availableSkillChoices"
        @confirmLevelUp="handleLevelUpConfirmation"
      />

      <!-- Relic Announcement -->
      <RelicAnnouncement
        v-if="announcedRelic"
        :relic="announcedRelic"
        @close="closeRelicAnnouncement"
      />

      <!-- Skill Tracker -->
      <SkillTracker
        :player="gameState.player"
      />
    </div>

    <!-- Start Screen -->
    <StartScreen
      v-if="!gameState.isPlaying && !gameState.isGameOver"
      :isGameOver="false"
      :wave="gameState.wave"
      :finalScore="gameState.score"
      @startGame="startGame"
    />

    <!-- Game Over Screen -->
    <GameOverScreen
      v-if="gameState.isGameOver"
      :player="gameState.player"
      :gameState="gameState"
      :activeSkills="activeSkills"
      :gameWon="gameState.gameWon"
      :survivalTime="currentTime"
      @restartGame="restartGame"
      @backToMenu="backToMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useGameEngine } from '../composables/useGameEngine';
import { useGameRenderer } from '../composables/useGameRenderer';

// Import UI components
import StartScreen from './GameUI/StartScreen.vue';
import PauseScreen from './GameUI/PauseScreen.vue';
import LevelUpScreen from './GameUI/LevelUpScreen.vue';
import GameHUD from './GameUI/GameHUD.vue';
import RelicAnnouncement from './GameUI/RelicAnnouncement.vue';
import GameOverScreen from './GameUI/GameOverScreen.vue';
import SkillTracker from './SkillTracker.vue';

// Canvas dimensions
const canvasWidth = ref(1600);
const canvasHeight = ref(900);

// Refs
const gameCanvas = ref<HTMLCanvasElement | null>(null);

// Initialize game engine and renderer
const gameEngine = useGameEngine(canvasWidth.value, canvasHeight.value);
const gameRenderer = useGameRenderer(canvasWidth.value, canvasHeight.value);

// Destructure game engine properties and methods
const {
  gameState,
  isPaused,
  isRelicAnnouncementPaused,
  availableSkillChoices,
  currentTypedText,
  wrongTypingEffect,
  highlightedRelicStarId,
  startGame: engineStartGame,
  restartGame: engineRestartGame,
  togglePause: engineTogglePause,
  updateGame,
  handleKeyPress,
  resetTyping,
  handleLevelUpConfirmation,
  announcedRelic,
  closeRelicAnnouncement,
  isEffectivelyPaused
} = gameEngine;

// Timer tracking
const currentTimestamp = ref(0);

const currentTime = computed(() => {
  if (gameState.value.startTime === 0) return 0;
  // Use reactive timestamp instead of Date.now() for reactivity
  return currentTimestamp.value - gameState.value.startTime;
});

// Computed properties
const activeSkills = computed(() => {
  return gameState.value.availableSkills.filter(skill => skill.level > 0);
});

// Animation frame reference
const animationFrameId = ref<number>(0);

// Handle keyboard events
const handleKeyDown = (event: KeyboardEvent) => {
  if (gameState.value.isPlaying && !gameState.value.isGameOver && !isEffectivelyPaused()) {
    // Handle typing keys only when not effectively paused
    handleKeyPress(event.key);
  }

  if (event.key === 'Escape' && gameState.value.isPlaying && !gameState.value.isGameOver) {
    // Don't allow ESC pause when relic announcement is showing
    if (!isRelicAnnouncementPaused.value) {
      togglePause();
    }
  }

  // Handle Enter key to start/play game
  if (event.key === 'Enter' && (!gameState.value.isPlaying || gameState.value.isGameOver)) {
    startGame();
  }
};

// Start the game
const startGame = () => {
  // Initialize canvas context for renderer
  if (gameCanvas.value) {
    const context = gameCanvas.value.getContext('2d');
    if (context) {
      gameRenderer.initializeCanvas(context);
    }
  }

  // Start game engine
  engineStartGame();

  // Start the game loop
  gameLoop();
};

// Game loop with frame rate limiting for better performance
const targetFPS = 60;
const targetFrameTime = 1000 / targetFPS;
let lastFrameTime = 0;

const gameLoop = (currentTime: number = performance.now()) => {
  // Update reactive timestamp for timer ONLY when not effectively paused
  if (!isEffectivelyPaused()) {
    currentTimestamp.value = Date.now();
  }

  // Limit frame rate for better performance
  if (currentTime - lastFrameTime < targetFrameTime) {
    if (gameState.value.isPlaying && !gameState.value.isGameOver) {
      animationFrameId.value = requestAnimationFrame(gameLoop);
    }
    return;
  }

  lastFrameTime = currentTime;

  // Update game state
  updateGame();

  // Render the game
  gameRenderer.render(
    gameState.value,
    gameEngine.projectiles.value,
    gameEngine.explosions.value,
    gameEngine.damageNumbers.value,
    gameEngine.stars.value,
    gameEngine.backgroundGradient.value,
    gameEngine.autoFireTarget.value,
    gameEngine.autoFireLaserOpacity.value,
    gameEngine.deltaTime.value,
    gameEngine.highlightedRelicStarId.value,
    gameEngine.currentTypedText.value
  );

  // Continue the loop if game is still active
  if (gameState.value.isPlaying && !gameState.value.isGameOver) {
    animationFrameId.value = requestAnimationFrame(gameLoop);
  }
};

// Toggle pause
const togglePause = () => {
  engineTogglePause();
};

// Restart the game
const restartGame = () => {
  // Initialize canvas context for renderer
  if (gameCanvas.value) {
    const context = gameCanvas.value.getContext('2d');
    if (context) {
      gameRenderer.initializeCanvas(context);
    }
  }

  // Restart game engine
  engineRestartGame();

  // Start the game loop
  gameLoop();
};

// Back to menu
const backToMenu = () => {
  // Reset game state to show start screen
  gameState.value.isPlaying = false;
  gameState.value.isGameOver = false;
};

// Initialize canvas when component is mounted
onMounted(() => {
  if (gameCanvas.value) {
    const context = gameCanvas.value.getContext('2d');
    if (context) {
      gameRenderer.initializeCanvas(context);
    }

    // Set canvas dimensions for crisp rendering
    gameCanvas.value.width = canvasWidth.value;
    gameCanvas.value.height = canvasHeight.value;
  }

  // Add keyboard event listener for pause
  window.addEventListener('keydown', handleKeyDown);
});

// Clean up resources when component is unmounted
onUnmounted(() => {
  cancelAnimationFrame(animationFrameId.value);
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #0a0a0a;
}

.game-canvas {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 90vh;
  display: block;
  object-fit: contain;
}

.game-ui-elements {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.wrong-typing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 0, 0, 0.3) 0%, rgba(255, 0, 0, 0.1) 50%, rgba(255, 0, 0, 0.05) 100%);
  pointer-events: none;
  z-index: 10;
  animation: wrongTypingPulse 0.3s ease-out;
}

@keyframes wrongTypingPulse {
  0% {
    transform: scale(1.05);
  }
  50% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.02);
  }
}
</style>