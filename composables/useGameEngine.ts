import { ref, onMounted, onUnmounted } from 'vue';
import type {
  GameState,
  Enemy,
  Skill
} from '../utils/gameModels';
import { createInitialGameState} from '../utils/gameModels';
import {
  type Projectile,
  type Explosion,
  type DamageNumber,
  type Star,
  type BackgroundGradient,
  createExplosion as importedCreateExplosion,
  createDamageNumber as importedCreateDamageNumber,
  createProjectile,
  initializeStars,
  initializeBackgroundGradient,
  updateExplosions,
  updateDamageNumbers,
  updateProjectiles
} from '../utils/effects/gameEffects';
import {
  startWave as startWaveMechanic,
  applyDamageToEnemy as applyDamageToEnemyMechanic,
  autoFireAtEnemies,
} from '../utils/mechanics/gameMechanics';

export function useGameEngine(canvasWidth: number, canvasHeight: number) {
  // Core game state
  const gameState = ref<GameState>(createInitialGameState(canvasWidth, canvasHeight));
  const isPaused = ref(false);

  // Visual effects state
  const projectiles = ref<Projectile[]>([]);
  const explosions = ref<Explosion[]>([]);
  const damageNumbers = ref<DamageNumber[]>([]);
  const stars = ref<Star[]>([]);
  const backgroundGradient = ref<BackgroundGradient>(initializeBackgroundGradient());

  // Auto-fire system state
  const autoFireTarget = ref<Enemy | null>(null);
  const autoFireLaserOpacity = ref(0);

  // Level up state
  const availableSkillChoices = ref<Skill[]>([]);

  // Timer tracking
  const spawnTimerId = ref<number>(0);
  const autoFireTimerId = ref<number>(0);
  const animationFrameId = ref<number>(0);

  // Game loop timing
  const lastUpdateTime = ref<number>(0);
  const deltaTime = ref<number>(0);
  const targetFPS = 60;
  const targetFrameTime = 1000 / targetFPS; // 16.67ms per frame
  const lastRenderTime = ref<number>(0);

  // Initialize stars
  onMounted(() => {
    stars.value = initializeStars(100, canvasWidth, canvasHeight);
  });

  // Cleanup on unmount
  onUnmounted(() => {
    clearInterval(spawnTimerId.value);
    clearInterval(autoFireTimerId.value);
    cancelAnimationFrame(animationFrameId.value);
  });

  // Start the game
  const startGame = () => {
    // Reset game state
    gameState.value = createInitialGameState(canvasWidth, canvasHeight);
    gameState.value.isPlaying = true;
    projectiles.value = [];
    explosions.value = [];
    damageNumbers.value = [];
    isPaused.value = false;

    // Initialize stars
    stars.value = initializeStars(100, canvasWidth, canvasHeight);

    // Start the first wave
    startWave(1);

    // Start game loop
    lastUpdateTime.value = performance.now();
    lastRenderTime.value = performance.now();
    updateGame();
  };

  // Restart the current game
  const restartGame = () => {
    // Clear any existing timers
    clearInterval(spawnTimerId.value);
    clearInterval(autoFireTimerId.value);
    cancelAnimationFrame(animationFrameId.value);

    // Reset game state completely (same as startGame)
    gameState.value = createInitialGameState(canvasWidth, canvasHeight);
    gameState.value.isPlaying = true;
    projectiles.value = [];
    explosions.value = [];
    damageNumbers.value = [];
    isPaused.value = false;

    // Initialize stars
    stars.value = initializeStars(100, canvasWidth, canvasHeight);

    // Start the first wave
    startWave(1);

    // Start game loop
    lastUpdateTime.value = performance.now();
    lastRenderTime.value = performance.now();
    updateGame();
  };

  // Toggle pause
  const togglePause = () => {
    if (gameState.value.isPlaying && !gameState.value.isGameOver && !gameState.value.isPausedForLevelUp) {
      isPaused.value = !isPaused.value;
    }
  };

  // Game update loop
  const updateGame = () => {
    const now = performance.now();
    deltaTime.value = (now - lastUpdateTime.value) / 1000;

    // Frame rate limiting - only update if enough time has passed
    const timeSinceLastRender = now - lastRenderTime.value;
    if (timeSinceLastRender < targetFrameTime) {
      // Schedule next frame
      if (gameState.value.isPlaying && !gameState.value.isGameOver) {
        animationFrameId.value = requestAnimationFrame(updateGame);
      }
      return;
    }

    lastUpdateTime.value = now;
    lastRenderTime.value = now;

    // Only update game state if not paused, not level up screen, and game is active
    if (!isPaused.value && gameState.value.isPlaying && !gameState.value.isGameOver && !gameState.value.isPausedForLevelUp) {
      updateGameState();
    }

    if (gameState.value.isPlaying && !gameState.value.isGameOver) {
      animationFrameId.value = requestAnimationFrame(updateGame);
    }
  };

  // Update game state
  const updateGameState = () => {
    const { player, enemies } = gameState.value;

    // Update frozen effects on enemies
    for (const enemy of enemies) {
      if (enemy.isFrozen && enemy.frozenUntil && Date.now() > enemy.frozenUntil) {
        // Remove frozen effect
        enemy.isFrozen = false;
        enemy.frozenUntil = null;
        enemy.speed = enemy.originalSpeed;
        // Remove the frozen color overlay
        if (enemy.color.includes('88')) {
          enemy.color = enemy.color.replace('88', '');
        }
      }
    }

    // Update enemy positions - batch process for performance
    const margin = 100; // Same margin used in renderer
    const cleanupMargin = 200; // Larger margin for cleanup
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      enemy.x += enemy.velocityX * deltaTime.value;
      enemy.y += enemy.velocityY * deltaTime.value;

      // Cleanup enemies that are too far off-screen to prevent memory bloat
      if (enemy.x < -cleanupMargin || enemy.x > canvasWidth + cleanupMargin ||
          enemy.y < -cleanupMargin || enemy.y > canvasHeight + cleanupMargin) {
        // Only remove if enemy has been moving away from center for a while
        const distanceFromCenter = Math.sqrt(
          Math.pow(enemy.x - canvasWidth/2, 2) +
          Math.pow(enemy.y - canvasHeight/2, 2)
        );
        const maxDistance = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight) + cleanupMargin;

        if (distanceFromCenter > maxDistance) {
          enemies.splice(i, 1);
          continue; // Skip further processing for this enemy
        }
      }

      // Only update visual effects for enemies that are near the visible area
      const isNearScreen = enemy.x > -margin &&
                          enemy.x < canvasWidth + margin &&
                          enemy.y > -margin &&
                          enemy.y < canvasHeight + margin;

      // Update pulse phase for visual effects only for visible enemies
      if (isNearScreen && enemy.pulsePhase !== undefined) {
        enemy.pulsePhase += deltaTime.value * 3;
        if (enemy.pulsePhase > Math.PI * 2) {
          enemy.pulsePhase -= Math.PI * 2;
        }
      }

      // Check collision with player
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < enemy.radius + player.radius) {
        let collisionDamage = 25;
        if (enemy.isElite) collisionDamage = 50;
        else if (enemy.isBoss) collisionDamage = 100;

        player.shield -= collisionDamage;
        createDamageNumber(player.x, player.y, collisionDamage, '#ff0000');
        createExplosion(enemy.x, enemy.y, enemy.color, 30, 0);

        gameState.value.waveEnemiesDefeated++;
        enemies.splice(i, 1);

        if (player.shield <= 0) {
          gameState.value.isGameOver = true;
          clearInterval(spawnTimerId.value);
          clearInterval(autoFireTimerId.value);
          break;
        }
      }
    }

    // Update projectiles
    updateProjectiles(
      projectiles.value,
      deltaTime.value,
      gameState.value.enemies,
      handleProjectileHit,
      createExplosion
    );

    // Update effects
    updateExplosions(explosions.value, deltaTime.value);
    updateDamageNumbers(damageNumbers.value, deltaTime.value);

    // Check wave completion
    if (gameState.value.waveEnemiesDefeated >= gameState.value.waveEnemyCount &&
        enemies.length === 0 &&
        !gameState.value.isPausedForLevelUp &&
        !gameState.value.isPausedBetweenWaves) {
      startWave(gameState.value.wave + 1);
    }

    // Update auto-fire
    updateAutoFire();

    // Update frozen bullets
    updateFrozenBullets();

    // Shield regeneration
    if (player.shield < player.maxShield) {
      player.shield = Math.min(
        player.maxShield,
        player.shield + player.shieldRegenRate * deltaTime.value
      );
    }
  };

  // Handle typing input
  const handleTyping = (typedText: string) => {
    if (!typedText.trim() || isPaused.value || gameState.value.isPausedForLevelUp) return;

    const { enemies, player } = gameState.value;

    // Find matching enemy
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (enemy.word.toLowerCase().startsWith(typedText.toLowerCase())) {
        // Calculate damage and critical hit
        const baseDamage = player.damage;
        const isCritical = Math.random() < player.critChance;
        const damage = isCritical ? baseDamage * 2 : baseDamage;

        // Fire projectile
        fireProjectile(enemy, damage, isCritical);

        // Multi-shot chance
        if (Math.random() < player.multiShotChance) {
          setTimeout(() => {
            const remainingEnemies = gameState.value.enemies.filter(e => e.id !== enemy.id);
            if (remainingEnemies.length > 0) {
              const randomEnemy = remainingEnemies[Math.floor(Math.random() * remainingEnemies.length)];
              fireProjectile(randomEnemy, damage, isCritical, true);
            }
          }, 100);
        }

        break;
      }
    }
  };

  // Fire projectile
  const fireProjectile = (target: Enemy, damage: number, isCritical: boolean, isMultiShot: boolean = false) => {
    const { player } = gameState.value;
    const projectile = createProjectile(
      player.x,
      player.y,
      target.x,
      target.y,
      damage,
      player.projectileSpeed,
      player.projectileSize,
      isCritical,
      player.aoeRadius,
      target.id,
      isMultiShot,
      false, // isDoubleShot (frozen bullets)
      player.bounceCount,
      0.25
    );
    projectiles.value.push(projectile);
  };

  // Fire frozen bullets
  const fireFrozenBullets = () => {
    const { player } = gameState.value;
    const numBullets = 12 + (player.frozenBulletCount || 0);

    createDamageNumber(player.x, player.y - 30, 0, '#00ffff', false, "FROZEN BULLETS!");

    for (let i = 0; i < numBullets; i++) {
      const angle = (2 * Math.PI / numBullets) * i;
      const target = findClosestEnemyInDirection(angle);

      if (target) {
        const damage = player.damage * 0.2;
        const projectile = createProjectile(
          player.x,
          player.y,
          target.x,
          target.y,
          damage,
          player.projectileSpeed,
          player.projectileSize,
          false, // isCritical
          0, // aoeRadius
          target.id,
          false, // isMultiShot
          true, // isFrozenBullet
          0, // bounceCount
          0 // bounceChance
        );
        projectiles.value.push(projectile);
      }
    }
  };

  // Find closest enemy in direction
  const findClosestEnemyInDirection = (angle: number): Enemy | null => {
    if (gameState.value.enemies.length === 0) return null;

    const directionX = Math.cos(angle);
    const directionY = Math.sin(angle);
    let closestEnemy = null;
    let closestDistance = Infinity;

    for (const enemy of gameState.value.enemies) {
      const dx = enemy.x - gameState.value.player.x;
      const dy = enemy.y - gameState.value.player.y;
      const dotProduct = dx * directionX + dy * directionY;

      if (dotProduct > 0) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestEnemy = enemy;
        }
      }
    }

    return closestEnemy;
  };

  // Handle projectile hit
  const handleProjectileHit = (enemyId: number, damage: number, isCritical: boolean, isMultiShot: boolean, isDoubleShot: boolean) => {
    const enemy = gameState.value.enemies.find(e => e.id === enemyId);
    if (!enemy) return;

    applyDamageToEnemy(enemy, damage, isCritical);

    if (isMultiShot) {
      createDamageNumber(enemy.x + 15, enemy.y - 15, damage, '#00ffff', isCritical);
    }

    if (isDoubleShot) {
      applyFrozenEffect(enemy);
    }

    if (Math.random() < gameState.value.player.explosiveChance) {
      createExplosion(enemy.x, enemy.y, '#ff9500', 80, damage * 0.8);
    }
  };

  // Apply damage to enemy
  const applyDamageToEnemy = (enemy: Enemy, damage: number, isCritical: boolean) => {
    applyDamageToEnemyMechanic(
      enemy,
      damage,
      isCritical,
      gameState.value,
      createExplosion,
      createDamageNumber,
      () => {
        createExplosion(gameState.value.player.x, gameState.value.player.y, '#ffffff', 50, 0);
      },
      availableSkillChoices
    );
  };

  // Apply frozen effect to enemy
  const applyFrozenEffect = (enemy: Enemy) => {
    enemy.isFrozen = true;
    enemy.frozenUntil = Date.now() + 5000;

    if (!enemy.originalSpeed) {
      enemy.originalSpeed = enemy.speed;
    }

    enemy.speed = enemy.originalSpeed * 0.5;

    if (!enemy.color.includes('88')) {
      enemy.color = enemy.color + '88';
    }

    createDamageNumber(enemy.x, enemy.y - 20, 0, '#00ffff', false, "FROZEN!");
    createExplosion(enemy.x, enemy.y, '#00ffff', 30, 0);
  };

  // Create explosion effect
  const createExplosion = (x: number, y: number, color: string, radius: number = 30, damage: number = 0) => {
    const explosion = importedCreateExplosion(
      x, y, color, radius, damage,
      damage > 0 ? gameState.value.enemies : [],
      (enemy, dmg, isCritical) => applyDamageToEnemy(enemy, dmg, isCritical)
    );
    explosions.value.push(explosion);
  };

  // Create damage number
  const createDamageNumber = (x: number, y: number, value: number, color: string, isCritical: boolean = false, text: string = '') => {
    const damageNumber = importedCreateDamageNumber(x, y, value, color, isCritical, text);
    damageNumbers.value.push(damageNumber);
  };

  // Start a new wave
  const startWave = (waveNumber: number) => {
    gameState.value.wave = waveNumber;

    startWaveMechanic(
      gameState.value,
      canvasWidth,
      canvasHeight,
      () => {},
      () => {},
      { value: spawnTimerId.value }
    );
  };

  // Update auto-fire system
  const updateAutoFire = () => {
    const { player } = gameState.value;

    if (player.autoFireCooldown !== null) {
      const now = Date.now();
      const autoFireInterval = player.autoFireCooldown;

      if (player.nextAutoFireTime && now >= player.nextAutoFireTime) {
        autoFireAtEnemies(gameState.value, (enemy) => {
          autoFireTarget.value = enemy;
          autoFireLaserOpacity.value = 1;

          setTimeout(() => {
            fireProjectile(enemy, player.damage * 0.8, false);

            setTimeout(() => {
              autoFireTarget.value = null;
              autoFireLaserOpacity.value = 0;
            }, 200);
          }, 500);
        });

        player.nextAutoFireTime = now + autoFireInterval;
      }
    }

    if (autoFireLaserOpacity.value > 0) {
      autoFireLaserOpacity.value = Math.max(0, autoFireLaserOpacity.value - deltaTime.value * 2);
    }
  };

  // Update frozen bullets system
  const updateFrozenBullets = () => {
    const { player } = gameState.value;

    if (player.frozenBulletCooldown !== null) {
      const now = Date.now();

      if (player.nextFrozenBulletTime && now >= player.nextFrozenBulletTime) {
        fireFrozenBullets();

        const cooldown = player.frozenBulletCooldown;
        player.nextFrozenBulletTime = now + cooldown;
      }
    }
  };

  // Handle level up confirmation
  const handleLevelUpConfirmation = (skill: Skill) => {
    const gameStateSkill = gameState.value.availableSkills.find(s => s.id === skill.id);
    if (gameStateSkill) {
      gameStateSkill.level++;
      gameStateSkill.applyEffect(gameState.value.player);
    }

    gameState.value.isPausedForLevelUp = false;
    availableSkillChoices.value = [];
  };

  return {
    gameState,
    isPaused,
    projectiles,
    explosions,
    damageNumbers,
    stars,
    backgroundGradient,
    autoFireTarget,
    autoFireLaserOpacity,
    availableSkillChoices,
    deltaTime,
    startGame,
    restartGame,
    togglePause,
    updateGame,
    handleTyping,
    handleLevelUpConfirmation,
  };
}