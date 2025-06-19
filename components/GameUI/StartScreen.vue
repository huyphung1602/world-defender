<template>
  <div class="start-screen-overlay">
    <div class="space-background">
      <div v-for="i in 50" :key="i" class="star" :style="getRandomStarStyle()"></div>
      <div v-for="i in 5" :key="`planet-${i}`" class="planet" :style="getRandomPlanetStyle()"></div>
      <div class="shooting-star"></div>
      <div class="shooting-star delayed"></div>
    </div>

    <div class="start-screen-content">
      <h1 class="game-title">{{ isGameOver ? 'Game Over!' : 'World Defender' }}</h1>

      <div v-if="isGameOver" class="game-over-stats">
        <p class="wave">You reached wave: {{ wave }}</p>
        <p class="final-score">Final Score: {{ finalScore.toLocaleString() }}</p>
      </div>

      <div v-if="!isGameOver" class="controls-info">
        <h3>How to Play:</h3>
        <ul>
          <li>Type words to shoot enemies</li>
          <li>Press ESC to pause/resume</li>
          <li>Press ENTER to start/play</li>
          <li>Defeat enemies to gain XP and level up</li>
          <li>Protect Earth from space invaders!</li>
        </ul>
      </div>

      <button class="start-button" @click="$emit('startGame')">
        {{ isGameOver ? 'Play Again' : 'Start Game' }} <KeyPrompt>Enter</KeyPrompt>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import KeyPrompt from '../UI/KeyPrompt.vue';

interface Props {
  isGameOver: boolean;
  wave: number;
  finalScore: number;
}

defineProps<Props>();

defineEmits<{
  startGame: []
}>();

// Generate random star style for the space background
const getRandomStarStyle = () => {
  const size = Math.random() * 3 + 1;
  const opacity = Math.random() * 0.7 + 0.3;
  const top = Math.random() * 100;
  const left = Math.random() * 100;
  const animationDuration = Math.random() * 3 + 2;

  return {
    width: `${size}px`,
    height: `${size}px`,
    opacity: opacity,
    top: `${top}%`,
    left: `${left}%`,
    boxShadow: `0 0 ${size}px rgba(255, 255, 255, ${opacity})`,
    animation: `twinkle ${animationDuration}s infinite alternate`
  };
};

// Generate random planet style for the space background
const getRandomPlanetStyle = () => {
  const size = Math.random() * 40 + 20;
  const top = Math.random() * 100;
  const left = Math.random() * 100;

  const colors = [
    'rgba(255, 100, 100, 0.6)',  // Red (Mars-like)
    'rgba(255, 200, 100, 0.6)',  // Orange (Venus-like)
    'rgba(200, 200, 255, 0.6)',  // Blue (Neptune-like)
    'rgba(255, 255, 200, 0.6)',  // Yellow (Saturn-like)
    'rgba(150, 150, 150, 0.6)',  // Grey (Moon-like)
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return {
    width: `${size}px`,
    height: `${size}px`,
    top: `${top}%`,
    left: `${left}%`,
    backgroundColor: color,
    boxShadow: `0 0 ${size/2}px ${color}`
  };
};
</script>

<style scoped>
.start-screen-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(30, 30, 80, 0.8) 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.space-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: radial-gradient(ellipse at center, rgba(30, 30, 70, 0.8) 0%, rgba(5, 5, 20, 0.9) 100%);
  overflow: hidden;
}

.star {
  position: absolute;
  width: 2px;
  height: 2px;
  background-color: #ffffff;
  border-radius: 50%;
  opacity: 0.5;
}

@keyframes twinkle {
  0% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.planet {
  position: absolute;
  border-radius: 50%;
  opacity: 0.5;
}

.shooting-star {
  position: absolute;
  top: 20%;
  left: 0;
  width: 4px;
  height: 4px;
  background-color: #ffffff;
  border-radius: 50%;
  opacity: 0.7;
  animation: shoot 6s linear infinite;
  box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.7),
              0 0 20px 5px rgba(255, 255, 255, 0.5),
              0 0 30px 10px rgba(255, 255, 255, 0.3);
}

.shooting-star.delayed {
  top: 70%;
  left: 30%;
  animation-delay: 3s;
  animation-duration: 8s;
}

@keyframes shoot {
  0% {
    transform: translateX(0) translateY(0);
    opacity: 0;
  }
  5% {
    opacity: 0.7;
  }
  95% {
    opacity: 0.7;
  }
  100% {
    transform: translateX(100vw) translateY(-50vh);
    opacity: 0;
  }
}

.start-screen-content {
  max-width: 600px;
  width: 90%;
  background-color: rgba(30, 30, 50, 0.95);
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  border: 3px solid #3498db;
  box-shadow: 0 0 30px rgba(52, 152, 219, 0.5);
  backdrop-filter: blur(10px);
  animation: pulse 2s infinite alternate;
}

.game-title {
  font-size: 3rem;
  margin-bottom: 2rem;
  color: #3498db;
  text-shadow: 0 0 15px rgba(52, 152, 219, 0.8);
  animation: glow 1.5s infinite alternate;
  font-weight: bold;
}

.game-over-stats {
  margin-bottom: 2rem;
}

.wave {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #ffffff;
}

.final-score {
  font-size: 1.5rem;
  margin-top: 0.5rem;
  color: #ffffff;
}

.controls-info {
  margin: 2rem 0;
  text-align: left;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 1.5rem;
  border-radius: 10px;
}

.controls-info h3 {
  margin-bottom: 1rem;
  color: #3498db;
  font-weight: bold;
  text-align: center;
}

.controls-info ul {
  list-style-type: none;
  padding-left: 0;
}

.controls-info li {
  margin-bottom: 0.8rem;
  color: #ffffff;
  position: relative;
  padding-left: 1.5rem;
}

.controls-info li:before {
  content: "•";
  color: #3498db;
  font-weight: bold;
  position: absolute;
  left: 0;
}

.start-button {
  padding: 15px 30px;
  border: none;
  border-radius: 25px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #3498db;
  color: white;
  box-shadow: 0 0 15px rgba(52, 152, 219, 0.5);
}

.start-button:hover {
  background-color: #2980b9;
  transform: scale(1.05);
  box-shadow: 0 0 25px rgba(52, 152, 219, 0.8);
}

@keyframes pulse {
  from {
    box-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
  }
  to {
    box-shadow: 0 0 30px rgba(52, 152, 219, 0.9);
  }
}

@keyframes glow {
  from {
    text-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
  }
  to {
    text-shadow: 0 0 20px rgba(52, 152, 219, 1);
  }
}
</style>