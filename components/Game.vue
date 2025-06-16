<template>
  <div class="game-container" @click="focusInput">
    <!-- Game Canvas -->
    <canvas
      ref="gameCanvas"
      class="game-canvas"
      :width="canvasWidth"
      :height="canvasHeight"
    ></canvas>

    <!-- In-game UI Elements -->
    <div v-if="gameState.isPlaying && !gameState.isGameOver" class="game-ui-elements">
      <!-- HUD with wave and shield -->
      <GameHUD
        :player="gameState.player"
        :gameState="gameState"
        :isPaused="isPaused"
        @togglePause="togglePause"
      />

      <!-- Typing Input - Centered above player -->
      <TypingInput
        ref="typingInputRef"
        :disabled="isPaused || gameState.isPausedForLevelUp"
        :autoFocus="true"
        @textSubmitted="handleTyping"
        @focusRequested="focusInput"
      />

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
    </div>

    <!-- Start/Game Over Screen -->
    <StartScreen
      v-if="!gameState.isPlaying || gameState.isGameOver"
      :isGameOver="gameState.isGameOver"
      :wave="gameState.wave"
      :finalScore="gameState.score"
      @startGame="startGame"
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
import TypingInput from './GameUI/TypingInput.vue';

// Canvas dimensions
const canvasWidth = ref(1600);
const canvasHeight = ref(900);

// Refs
const gameCanvas = ref<HTMLCanvasElement | null>(null);
const typingInputRef = ref<InstanceType<typeof TypingInput> | null>(null);

// Initialize game engine and renderer
const gameEngine = useGameEngine(canvasWidth.value, canvasHeight.value);
const gameRenderer = useGameRenderer(canvasWidth.value, canvasHeight.value);

// Destructure game engine properties and methods
const {
  gameState,
  isPaused,
  availableSkillChoices,
  startGame: engineStartGame,
  restartGame: engineRestartGame,
  togglePause: engineTogglePause,
  updateGame,
  handleTyping,
  handleLevelUpConfirmation
} = gameEngine;

// Computed properties
const activeSkills = computed(() => {
  return gameState.value.availableSkills.filter(skill => skill.level > 0);
});

// Animation frame reference
const animationFrameId = ref<number>(0);

// Focus the typing input
const focusInput = () => {
  if (gameState.value.isPlaying && !gameState.value.isGameOver && !isPaused.value && !gameState.value.isPausedForLevelUp && typingInputRef.value) {
    typingInputRef.value.focus();
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

  // Focus the typing input
  setTimeout(focusInput, 100);

  // Start the game loop
  gameLoop();
};

// Game loop with frame rate limiting for better performance
const targetFPS = 60;
const targetFrameTime = 1000 / targetFPS;
let lastFrameTime = 0;

const gameLoop = (currentTime: number = performance.now()) => {
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
    gameEngine.deltaTime.value
  );

  // Continue the loop if game is still active
  if (gameState.value.isPlaying && !gameState.value.isGameOver) {
    animationFrameId.value = requestAnimationFrame(gameLoop);
  }
};

// Handle keyboard events
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && gameState.value.isPlaying && !gameState.value.isGameOver) {
    togglePause();
  }
  
  // Handle Enter key to start/play game
  if (event.key === 'Enter' && (!gameState.value.isPlaying || gameState.value.isGameOver)) {
    startGame();
  }
};

// Toggle pause
const togglePause = () => {
  const wasPaused = isPaused.value;
  engineTogglePause();

  // If we're unpausing, focus the input
  if (wasPaused && !isPaused.value) {
    setTimeout(focusInput, 100);
  }
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

  // Focus the typing input
  setTimeout(focusInput, 100);

  // Start the game loop
  gameLoop();
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
</style>