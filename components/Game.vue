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
      <!-- Score display - now inside the viewport -->
      <div class="in-game-score">Score: {{ gameState.score }}</div>

      <!-- Typing Input - Centered above player -->
      <div class="typing-input-container">
        <input
          v-model="typedText"
          @keyup.enter="checkTyping"
          @blur="focusInput"
          ref="typingInputEl"
          class="typing-input"
          type="text"
          placeholder="Type words to defeat enemies"
          autocomplete="off"
          autocorrect="off"
        />
      </div>
    </div>

    <!-- Start/Restart Button -->
    <div v-if="!gameState.isPlaying || gameState.isGameOver" class="game-over">
      <h2>{{ gameState.isGameOver ? 'Game Over!' : 'Word Defender' }}</h2>
      <p v-if="gameState.isGameOver">Your score: {{ gameState.score }}</p>
      <button class="btn btn-primary" @click="startGame">
        {{ gameState.isGameOver ? 'Play Again' : 'Start Game' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import {
  getRandomWord,
  getRandomColor,
  getRandomPositionOnEdge,
  getRandomVelocity
} from '../utils/wordGenerator';
import {
  type Enemy,
  type GameState,
  createInitialGameState,
  createEnemy
} from '../utils/gameModels';

// Refs for visual effects
interface Projectile {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
}

interface Explosion {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  progress: number;
  color: string;
  particles: { x: number, y: number, vx: number, vy: number, size: number, color: string }[];
}

// Add these interfaces for background elements
interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

interface BackgroundGradient {
  colors: string[];
  positions: number[];
  currentIndex: number;
  transitionProgress: number;
}

// Responsive canvas dimensions
const containerRef = ref<HTMLDivElement | null>(null);
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1000);
const windowHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 800);

// Use fixed canvas dimensions for consistent rendering
const canvasWidth = ref(1600);
const canvasHeight = ref(900);

// Refs
const gameCanvas = ref<HTMLCanvasElement | null>(null);
const typingInputEl = ref<HTMLInputElement | null>(null);
const canvasContext = ref<CanvasRenderingContext2D | null>(null);
const typedText = ref('');
const animationFrameId = ref<number>(0);
const spawnTimerId = ref<number>(0);
const projectiles = ref<Projectile[]>([]);
const explosions = ref<Explosion[]>([]);

// Add these refs for background elements
const stars = ref<Star[]>([]);
const backgroundGradient = ref<BackgroundGradient>({
  colors: ['#0f2027', '#203a43', '#2c5364', '#24243e', '#302b63', '#0f0c29'],
  positions: [0, 0.3, 0.6, 0.8, 0.9, 1],
  currentIndex: 0,
  transitionProgress: 0
});

// Game state
const gameState = ref<GameState>(createInitialGameState(canvasWidth.value, canvasHeight.value));

// Game loop timing
const lastUpdateTime = ref<number>(0);
const now = ref<number>(0);
const deltaTime = ref<number>(0);

// Handle window resize
const handleResize = () => {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
};

// Focus the typing input
const focusInput = () => {
  if (gameState.value.isPlaying && !gameState.value.isGameOver && typingInputEl.value) {
    typingInputEl.value.focus();
  }
};

// Start the game
const startGame = () => {
  // Reset game state
  gameState.value = createInitialGameState(canvasWidth.value, canvasHeight.value);
  gameState.value.isPlaying = true;
  projectiles.value = [];
  explosions.value = [];

  // Focus the typing input
  setTimeout(focusInput, 100);

  // Start the enemy spawner
  startEnemySpawner();

  // Start the game loop
  lastUpdateTime.value = performance.now();
  gameLoop();
};

// Game loop
const gameLoop = () => {
  // Calculate delta time
  now.value = performance.now();
  deltaTime.value = (now.value - lastUpdateTime.value) / 1000; // convert to seconds
  lastUpdateTime.value = now.value;

  // Update and render
  updateGameState();
  renderGameState();

  // Continue the loop if game is still active
  if (gameState.value.isPlaying && !gameState.value.isGameOver) {
    animationFrameId.value = requestAnimationFrame(gameLoop);
  }
};

// Update game state
const updateGameState = () => {
  const { enemies, player } = gameState.value;

  // Ensure player is always at the center
  player.x = canvasWidth.value / 2;
  player.y = canvasHeight.value / 2;

  // Move enemies
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];

    // Update position
    enemy.x += enemy.velocityX * deltaTime.value;
    enemy.y += enemy.velocityY * deltaTime.value;

    // Update pulse phase for visual effect
    if (enemy.pulsePhase !== undefined) {
      enemy.pulsePhase += deltaTime.value * 3; // Speed of pulsing
      if (enemy.pulsePhase > Math.PI * 2) {
        enemy.pulsePhase -= Math.PI * 2;
      }
    }

    // Check collision with player
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < enemy.radius + player.radius) {
      // Collision detected - game over
      gameState.value.isGameOver = true;
      clearInterval(spawnTimerId.value);
      break;
    }
  }

  // Update projectiles
  for (let i = projectiles.value.length - 1; i >= 0; i--) {
    const projectile = projectiles.value[i];
    projectile.progress += projectile.speed * deltaTime.value;

    if (projectile.progress >= 1) {
      // Projectile reached target
      projectiles.value.splice(i, 1);
    }
  }

  // Update explosions
  for (let i = explosions.value.length - 1; i >= 0; i--) {
    const explosion = explosions.value[i];
    explosion.progress += deltaTime.value * 2; // Control explosion speed

    if (explosion.progress >= 1) {
      explosions.value.splice(i, 1);
    } else {
      // Update particles
      for (const particle of explosion.particles) {
        particle.x += particle.vx * deltaTime.value * 60;
        particle.y += particle.vy * deltaTime.value * 60;
        particle.size *= 0.95; // Shrink particles over time
      }
    }
  }
};

// Render game state
const renderGameState = () => {
  if (!canvasContext.value || !gameCanvas.value) return;

  const ctx = canvasContext.value;

  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);

  // Draw animated background
  drawBackground(ctx);

  // Draw player
  const { player, enemies } = gameState.value;

  // Draw player with enhanced visuals
  drawPlayer(ctx, player);

  // Draw enemies
  enemies.forEach(enemy => {
    // Draw enemy with enhanced visuals
    drawEnemy(ctx, enemy);
  });

  // Draw projectiles
  projectiles.value.forEach(projectile => {
    const x = player.x + (projectile.targetX - player.x) * projectile.progress;
    const y = player.y + (projectile.targetY - player.y) * projectile.progress;

    // Draw projectile glow
    const projectileGradient = ctx.createRadialGradient(
      x, y, 2,
      x, y, 10
    );
    projectileGradient.addColorStop(0, '#2ecc71');
    projectileGradient.addColorStop(1, 'rgba(46, 204, 113, 0)');

    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = projectileGradient;
    ctx.fill();
    ctx.closePath();

    // Draw projectile core
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#2ecc71';
    ctx.fill();
    ctx.closePath();

    // Draw trail with gradient
    ctx.beginPath();
    const trailGradient = ctx.createLinearGradient(
      player.x, player.y,
      x, y
    );
    trailGradient.addColorStop(0, 'rgba(46, 204, 113, 0.1)');
    trailGradient.addColorStop(1, 'rgba(46, 204, 113, 0.6)');

    ctx.moveTo(player.x, player.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = trailGradient;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.closePath();
  });

  // Draw explosions
  explosions.value.forEach(explosion => {
    // Draw main explosion circle with gradient
    const currentRadius = explosion.radius + (explosion.maxRadius - explosion.radius) * explosion.progress;
    const alpha = 1 - explosion.progress;

    const explosionGradient = ctx.createRadialGradient(
      explosion.x, explosion.y, currentRadius * 0.3,
      explosion.x, explosion.y, currentRadius
    );
    explosionGradient.addColorStop(0, `rgba(255, 165, 0, ${alpha * 0.8})`);
    explosionGradient.addColorStop(0.7, `rgba(255, 100, 0, ${alpha * 0.5})`);
    explosionGradient.addColorStop(1, `rgba(255, 0, 0, 0)`);

    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = explosionGradient;
    ctx.fill();
    ctx.closePath();

    // Draw particles with glow
    explosion.particles.forEach(particle => {
      const particleGradient = ctx.createRadialGradient(
        particle.x, particle.y, particle.size * 0.3,
        particle.x, particle.y, particle.size * 2
      );
      particleGradient.addColorStop(0, particle.color);
      particleGradient.addColorStop(1, 'rgba(255, 165, 0, 0)');

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
      ctx.fillStyle = particleGradient;
      ctx.fill();
      ctx.closePath();

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();
      ctx.closePath();
    });
  });
};

// Start enemy spawner
const startEnemySpawner = () => {
  spawnTimerId.value = window.setInterval(() => {
    if (gameState.value.isGameOver) return;

    // Get random position on edge
    const [x, y] = getRandomPositionOnEdge(canvasWidth.value, canvasHeight.value);

    // Create new enemy
    const enemyId = ++gameState.value.lastEnemyId;
    const word = getRandomWord();
    const color = getRandomColor();

    // Speed increases with difficulty but starts slower
    const minSpeed = 30 + (gameState.value.difficulty * 4); // Reduced from 50 to 30
    const maxSpeed = 50 + (gameState.value.difficulty * 8); // Reduced from 80 to 50
    const speed = getRandomVelocity(minSpeed, maxSpeed);

    // Add enemy to game state
    const enemy = createEnemy(
      enemyId,
      x,
      y,
      word,
      color,
      speed,
      canvasWidth.value,
      canvasHeight.value
    );

    gameState.value.enemies.push(enemy);

    // Increase difficulty over time (more gradually)
    gameState.value.difficulty += 0.05; // Reduced from 0.1 to 0.05

    // Spawn enemies faster as game progresses (but more gradually)
    if (gameState.value.spawnInterval > 1000) {
      gameState.value.spawnInterval -= 25; // Reduced from 50 to 25
      clearInterval(spawnTimerId.value);
      startEnemySpawner();
    }
  }, gameState.value.spawnInterval);
};

// Helper function to shade a color (darken or lighten)
const shadeColor = (color: string, percent: number): string => {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.floor(R * (100 + percent) / 100);
  G = Math.floor(G * (100 + percent) / 100);
  B = Math.floor(B * (100 + percent) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  R = R > 0 ? R : 0;
  G = G > 0 ? G : 0;
  B = B > 0 ? B : 0;

  const RR = R.toString(16).padStart(2, '0');
  const GG = G.toString(16).padStart(2, '0');
  const BB = B.toString(16).padStart(2, '0');

  return `#${RR}${GG}${BB}`;
};

// Check typing input
const checkTyping = () => {
  const word = typedText.value.trim().toLowerCase();
  if (!word) return;

  // Find enemy with matching word
  const enemyIndex = gameState.value.enemies.findIndex(
    enemy => enemy.word.toLowerCase() === word
  );

  if (enemyIndex !== -1) {
    const enemy = gameState.value.enemies[enemyIndex];

    // Create projectile from player to enemy
    projectiles.value.push({
      x: gameState.value.player.x,
      y: gameState.value.player.y,
      targetX: enemy.x,
      targetY: enemy.y,
      progress: 0,
      speed: 3 // Projectile speed (units per second)
    });

    // Schedule enemy removal and explosion after projectile reaches target
    setTimeout(() => {
      // Calculate score based on enemy speed
      const scoreIncrease = Math.round(enemy.speed);

      // Update score
      gameState.value.score += scoreIncrease;

      // Create explosion effect
      createExplosion(enemy.x, enemy.y, enemy.color);

      // Remove enemy
      const currentIndex = gameState.value.enemies.findIndex(e => e.id === enemy.id);
      if (currentIndex !== -1) {
        gameState.value.enemies.splice(currentIndex, 1);
      }
    }, 333); // Time for projectile to reach enemy
  }

  // Clear typing input
  typedText.value = '';
};

// Create explosion effect
const createExplosion = (x: number, y: number, color: string) => {
  const particleCount = 15;
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 / particleCount) * i;
    const speed = 1 + Math.random() * 2;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 3,
      color: i % 2 === 0 ? color : '#ff9500'
    });
  }

  explosions.value.push({
    x,
    y,
    radius: 10,
    maxRadius: 30,
    progress: 0,
    color,
    particles
  });
};

// Add this function to draw the background
const drawBackground = (ctx: CanvasRenderingContext2D) => {
  // Update background gradient transition
  backgroundGradient.value.transitionProgress += deltaTime.value * 0.05;
  if (backgroundGradient.value.transitionProgress >= 1) {
    backgroundGradient.value.transitionProgress = 0;
    backgroundGradient.value.currentIndex = (backgroundGradient.value.currentIndex + 1) % (backgroundGradient.value.colors.length - 1);
  }
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, canvasWidth.value, canvasHeight.value);
  
  // Get current and next colors
  const currentIdx = backgroundGradient.value.currentIndex;
  const nextIdx = (currentIdx + 1) % backgroundGradient.value.colors.length;
  const progress = backgroundGradient.value.transitionProgress;
  
  // Interpolate between colors
  for (let i = 0; i < backgroundGradient.value.positions.length; i++) {
    const color1 = hexToRgb(backgroundGradient.value.colors[i]);
    const color2 = hexToRgb(backgroundGradient.value.colors[(i + 1) % backgroundGradient.value.colors.length]);
    
    if (color1 && color2) {
      const r = Math.floor(color1.r + (color2.r - color1.r) * progress);
      const g = Math.floor(color1.g + (color2.g - color1.g) * progress);
      const b = Math.floor(color1.b + (color2.b - color1.b) * progress);
      
      gradient.addColorStop(backgroundGradient.value.positions[i], `rgb(${r}, ${g}, ${b})`);
    }
  }
  
  // Draw background
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
  
  // Update and draw stars
  for (const star of stars.value) {
    // Move stars
    star.y += star.speed * deltaTime.value;
    
    // Wrap stars around when they go off screen
    if (star.y > canvasHeight.value) {
      star.y = 0;
      star.x = Math.random() * canvasWidth.value;
    }
    
    // Draw star
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
    ctx.fill();
    ctx.closePath();
  }
  
  // Add a subtle grid effect
  drawGrid(ctx);
};

// Helper function to convert hex to rgb
const hexToRgb = (hex: string): { r: number, g: number, b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Add a grid effect to the background
const drawGrid = (ctx: CanvasRenderingContext2D) => {
  const gridSize = 40;
  const time = performance.now() / 5000;
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 0.5;
  
  // Draw horizontal lines
  for (let y = 0; y < canvasHeight.value; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth.value, y);
    ctx.stroke();
  }
  
  // Draw vertical lines
  for (let x = 0; x < canvasWidth.value; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight.value);
    ctx.stroke();
  }
  
  // Draw accent lines that move
  const accentOffset = Math.sin(time) * 100 + 100;
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  
  ctx.beginPath();
  ctx.moveTo(0, accentOffset);
  ctx.lineTo(canvasWidth.value, accentOffset);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(accentOffset, 0);
  ctx.lineTo(accentOffset, canvasHeight.value);
  ctx.stroke();
};

// Draw player with enhanced visuals
const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player) => {
  // Draw outer glow
  const outerGlowSize = player.glowSize + Math.sin(performance.now() / 500) * 5;
  const gradient = ctx.createRadialGradient(
    player.x, player.y, player.radius * 0.8,
    player.x, player.y, outerGlowSize
  );
  gradient.addColorStop(0, player.glowColor);
  gradient.addColorStop(1, 'rgba(124, 214, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(player.x, player.y, outerGlowSize, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw shield effect (rotating circle segments)
  const shieldSegments = 8;
  const shieldRadius = player.radius * 1.3;
  const shieldWidth = 4;
  const shieldRotation = performance.now() / 2000;
  
  for (let i = 0; i < shieldSegments; i++) {
    const startAngle = (Math.PI * 2 / shieldSegments) * i + shieldRotation;
    const endAngle = startAngle + (Math.PI * 2 / shieldSegments) * 0.6;
    
    ctx.beginPath();
    ctx.arc(player.x, player.y, shieldRadius, startAngle, endAngle);
    ctx.strokeStyle = `rgba(124, 214, 255, ${0.3 + Math.sin(performance.now() / 300 + i) * 0.2})`;
    ctx.lineWidth = shieldWidth;
    ctx.stroke();
  }
  
  // Draw outer circle with gradient
  const outerGradient = ctx.createRadialGradient(
    player.x, player.y, player.radius * 0.7,
    player.x, player.y, player.radius
  );
  outerGradient.addColorStop(0, player.color);
  outerGradient.addColorStop(1, shadeColor(player.color, -20));
  
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = outerGradient;
  ctx.fill();
  
  // Draw inner circle with gradient
  const innerGradient = ctx.createRadialGradient(
    player.x - player.radius * 0.3, player.y - player.radius * 0.3, 0,
    player.x, player.y, player.radius * 0.7
  );
  innerGradient.addColorStop(0, lightenColor(player.innerColor, 40));
  innerGradient.addColorStop(1, player.innerColor);
  
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius * 0.7, 0, Math.PI * 2);
  ctx.fillStyle = innerGradient;
  ctx.fill();
  
  // Draw core
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fill();
  
  // Draw highlight
  ctx.beginPath();
  ctx.arc(player.x - player.radius * 0.35, player.y - player.radius * 0.35, player.radius * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fill();
};

// Draw enemy with enhanced visuals
const drawEnemy = (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
  // Calculate pulse effect (0 to 1)
  const pulseEffect = enemy.pulsePhase !== undefined ? 
    (Math.sin(enemy.pulsePhase) + 1) / 2 : 0;
  
  // Draw enemy glow
  if (enemy.glowColor) {
    const glowSize = enemy.radius * (1.5 + pulseEffect * 0.3);
    const enemyGradient = ctx.createRadialGradient(
      enemy.x, enemy.y, enemy.radius * 0.8,
      enemy.x, enemy.y, glowSize
    );
    enemyGradient.addColorStop(0, enemy.glowColor);
    enemyGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = enemyGradient;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, glowSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw energy rings
  const ringCount = 2;
  const maxRingRadius = enemy.radius * 1.2;
  const ringTime = performance.now() / 1000;
  
  for (let i = 0; i < ringCount; i++) {
    const ringProgress = ((ringTime + i * 0.5) % 1);
    const ringRadius = enemy.radius * 0.6 + ringProgress * (maxRingRadius - enemy.radius * 0.6);
    const ringOpacity = 0.7 * (1 - ringProgress);
    
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${hexToRgb(enemy.color)?.r || 0}, ${hexToRgb(enemy.color)?.g || 0}, ${hexToRgb(enemy.color)?.b || 0}, ${ringOpacity})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // Draw outer circle with gradient
  const outerGradient = ctx.createRadialGradient(
    enemy.x, enemy.y, enemy.radius * 0.6,
    enemy.x, enemy.y, enemy.radius
  );
  outerGradient.addColorStop(0, enemy.color);
  outerGradient.addColorStop(1, shadeColor(enemy.color, -20));
  
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
  ctx.fillStyle = outerGradient;
  ctx.fill();
  
  // Draw inner circle with gradient
  const innerGradient = ctx.createRadialGradient(
    enemy.x - enemy.radius * 0.2, enemy.y - enemy.radius * 0.2, 0,
    enemy.x, enemy.y, enemy.radius * 0.6
  );
  innerGradient.addColorStop(0, lightenColor(enemy.color, 40));
  innerGradient.addColorStop(1, shadeColor(enemy.color, -30));
  
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, enemy.radius * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = innerGradient;
  ctx.fill();
  
  // Draw core
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, enemy.radius * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fill();
  
  // Draw highlight
  ctx.beginPath();
  ctx.arc(enemy.x - enemy.radius * 0.3, enemy.y - enemy.radius * 0.3, enemy.radius * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fill();
  
  // Draw word above enemy with shadow for better visibility
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#ffffff'; // White text for better contrast on dark background
  ctx.fillText(enemy.word, enemy.x, enemy.y - enemy.radius - 8);
  
  // Add a second layer of text with glow for better visibility
  ctx.shadowColor = 'rgba(52, 152, 219, 0.9)';
  ctx.shadowBlur = 4;
  ctx.fillText(enemy.word, enemy.x, enemy.y - enemy.radius - 8);
  
  // Reset shadow properties
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
};

// Helper function to lighten a color
const lightenColor = (color: string, amount: number): string => {
  // Remove the # if it exists
  color = color.replace('#', '');
  
  // Parse the color
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  // Lighten each component
  const newR = Math.min(255, r + amount);
  const newG = Math.min(255, g + amount);
  const newB = Math.min(255, b + amount);
  
  // Convert back to hex
  return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
};

// Initialize canvas when component is mounted
onMounted(() => {
  if (gameCanvas.value) {
    canvasContext.value = gameCanvas.value.getContext('2d');

    // Set canvas resolution to be crisp on high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = gameCanvas.value.getBoundingClientRect();

    // Set the canvas dimensions for crisp rendering
    gameCanvas.value.width = canvasWidth.value;
    gameCanvas.value.height = canvasHeight.value;

    // Scale the context for high-DPI displays
    if (canvasContext.value) {
      canvasContext.value.scale(1, 1);
    }
  }

  // Add resize event listener
  window.addEventListener('resize', handleResize);

  // Initial resize
  handleResize();

  // Initialize stars
  for (let i = 0; i < 100; i++) {
    stars.value.push({
      x: Math.random() * canvasWidth.value,
      y: Math.random() * canvasHeight.value,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 15 + 5,
      opacity: Math.random() * 0.8 + 0.2
    });
  }
});

// Clean up resources when component is unmounted
onUnmounted(() => {
  cancelAnimationFrame(animationFrameId.value);
  clearInterval(spawnTimerId.value);
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.typing-input-container {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -100px);
  z-index: 20;
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

.in-game-score {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 255, 255, 0.8);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 24px;
  font-weight: bold;
  z-index: 30;
}

/* Make the typing input clickable */
.typing-input-container {
  pointer-events: auto;
}
</style>