import { ref, onMounted, onUnmounted } from 'vue';
import type {
  GameState,
  Enemy,
  Skill,
  Relic,
  RelicStar
} from '../utils/gameModels';
import {
  createInitialGameState,
  generateRelics,
  getRandomRelic,
  createRelicStar,
  getRandomSkills
} from '../utils/gameModels';
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
  pauseEnemySpawning,
  resumeEnemySpawning,
} from '../utils/mechanics/gameMechanics';
import { useGameRenderer } from './useGameRenderer';
import { getRandomWord } from '../utils/wordGenerator';

export function useGameEngine(canvasWidth: number, canvasHeight: number) {
  // Core game state
  const gameState = ref<GameState>(createInitialGameState(canvasWidth, canvasHeight));
  const isPaused = ref(false);
  const isRelicAnnouncementPaused = ref(false);

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

  // Relic system state
  const availableRelics = ref<Relic[]>(generateRelics());
  const relicStarSpawnTimer = ref<number>(0);
  const nextRelicStarSpawn = ref<number>(0);
  const highlightedRelicStarId = ref<number | null>(null);
  const announcedRelic = ref<Relic | null>(null);

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

  // Typing state
  const currentTypedText = ref('');
  const highlightedEnemyId = ref<number | null>(null);
  const wrongTypingEffect = ref(0); // For visual feedback on wrong typing

  // Centralized Pause System
  const pauseSystem = {
    isPaused: false,
    pauseStartTime: 0,
    totalPausedDuration: 0,
    savedTimerStates: {
      nextRelicStarSpawn: 0,
      autoFireNextTime: 0,
    },

    // Start pause (used by all pause types)
    startPause: () => {
      if (pauseSystem.isPaused) return; // Already paused

      const now = Date.now();
      pauseSystem.isPaused = true;
      pauseSystem.pauseStartTime = now;

      // Save relative timer states
      pauseSystem.savedTimerStates = {
        nextRelicStarSpawn: nextRelicStarSpawn.value - now,
        autoFireNextTime: gameState.value.player.nextAutoFireTime ? gameState.value.player.nextAutoFireTime - now : 0,
      };

      // Pause enemy spawning
      pauseEnemySpawning({ value: spawnTimerId.value });
    },

    // End pause (used by all pause types)
    endPause: () => {
      if (!pauseSystem.isPaused) return; // Not paused

      const now = Date.now();
      const pauseDuration = now - pauseSystem.pauseStartTime;

      // Update total paused duration and adjust game timer
      pauseSystem.totalPausedDuration += pauseDuration;
      gameState.value.startTime += pauseDuration;

      // Restore relative timers
      nextRelicStarSpawn.value = now + pauseSystem.savedTimerStates.nextRelicStarSpawn;

      if (pauseSystem.savedTimerStates.autoFireNextTime > 0) {
        gameState.value.player.nextAutoFireTime = now + pauseSystem.savedTimerStates.autoFireNextTime;
      }

      // Resume enemy spawning
      resumeEnemySpawning(
        gameState.value,
        canvasWidth,
        canvasHeight,
        () => {},
        () => {},
        { value: spawnTimerId.value },
        isEffectivelyPaused
      );

      pauseSystem.isPaused = false;
      pauseSystem.pauseStartTime = 0;
    }
  };

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
    gameState.value.startTime = Date.now(); // Set game start time
    projectiles.value = [];
    explosions.value = [];
    damageNumbers.value = [];
    isPaused.value = false;

    // Reset typing state
    resetTyping();

    // Reset timers
    clearInterval(spawnTimerId.value);
    clearInterval(autoFireTimerId.value);

    // Initialize relic spawn system - spawn every 2 minutes
    nextRelicStarSpawn.value = Date.now() + 120000; // First spawn after 2 minutes

    // Initialize stars
    stars.value = initializeStars(100, canvasWidth, canvasHeight);

    // Start first wave
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
    gameState.value.startTime = Date.now(); // Set game start time
    projectiles.value = [];
    explosions.value = [];
    damageNumbers.value = [];
    isPaused.value = false;

    // Reset typing state
    resetTyping();

    // Initialize relic spawn system
    nextRelicStarSpawn.value = Date.now() + 120000; // First spawn after 2 minutes

    // Initialize stars
    stars.value = initializeStars(100, canvasWidth, canvasHeight);

    // Start the first wave
    startWave(1);

    // Start game loop
    lastUpdateTime.value = performance.now();
    lastRenderTime.value = performance.now();
    updateGame();
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

    // Only update game state if not effectively paused and game is active
    if (!isEffectivelyPaused() && gameState.value.isPlaying && !gameState.value.isGameOver) {
      updateGameState();
    }

    if (gameState.value.isPlaying && !gameState.value.isGameOver) {
      animationFrameId.value = requestAnimationFrame(updateGame);
    }
  };

  // Update game state
  const updateGameState = () => {
    const { player, enemies } = gameState.value;

    // Check for victory condition - 20 minutes (1,200,000 milliseconds)
    if (gameState.value.startTime > 0 && Date.now() - gameState.value.startTime >= 1200000) {
      gameState.value.isGameOver = true;
      gameState.value.gameWon = true;
      clearInterval(spawnTimerId.value);
      clearInterval(autoFireTimerId.value);
      return; // Exit early to prevent further updates
    }

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

      // Update burn effects on enemies
      if (enemy.isBurning && enemy.nextBurnTick && Date.now() >= enemy.nextBurnTick) {
        // Apply burn damage
        enemy.health -= enemy.burnDamage;
        createDamageNumber(enemy.x, enemy.y - 10, Math.round(enemy.burnDamage), '#ff4444', false, 'BURN');

        // Check if burn effect should end
        if (enemy.burnUntil && Date.now() >= enemy.burnUntil) {
          enemy.isBurning = false;
          enemy.burnUntil = null;
          enemy.burnDamage = 0;
          enemy.nextBurnTick = null;
        } else {
          // Schedule next burn tick
          enemy.nextBurnTick = Date.now() + enemy.burnTickInterval;
        }

        // Check if enemy died from burn
        if (enemy.health <= 0) {
          // Track kills for skill systems
          const { player } = gameState.value;
          if (player.frostMasteryLevel > 0) {
            player.frostMasteryKills = (player.frostMasteryKills || 0) + 1;
          }
          if (player.fireMasteryLevel > 0) {
            player.fireMasteryKills = (player.fireMasteryKills || 0) + 1;
          }

          // Remove enemy from array
          const enemyIndex = enemies.indexOf(enemy);
          if (enemyIndex > -1) {
            enemies.splice(enemyIndex, 1);
            gameState.value.waveEnemiesDefeated++;

            // Update score and enemy kill count
            gameState.value.score += enemy.pointValue;
            gameState.value.enemiesKilled++;
          }

          // Create explosion effect
          createExplosion(enemy.x, enemy.y, '#ff4444', 20, 0);

          // Award XP and check for level up
          const xpGain = Math.floor(enemy.pointValue * player.experienceMultiplier);
          player.xp += xpGain;
          createDamageNumber(enemy.x, enemy.y - 40, xpGain, '#00ff00', false, `+${xpGain} XP`);

          // Check for level up
          if (player.xp >= player.xpToNextLevel) {
            // Level up effect
            createExplosion(player.x, player.y, '#ffffff', 50, 0);
            // Start pause using centralized system for level up
            pauseSystem.startPause();

            // Increase level
            player.level++;
            player.xp = 0;
            player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.2);

            // Increase base stats
            player.damage += 2;
            player.maxShield += 10;
            player.shield = player.maxShield;

            // Pause game for skill selection
            gameState.value.isPausedForLevelUp = true;

            // Generate skill choices
            availableSkillChoices.value = getRandomSkills(gameState.value.availableSkills);
          }
        }
      }
    }

    // Update relic stars
    updateRelicStars();

    // Spawn new relic stars periodically (only if not effectively paused)
    if (!isEffectivelyPaused()) {
      const now = Date.now();
      if (now >= nextRelicStarSpawn.value) {
        spawnRelicStar();
        // Schedule next relic star spawn every 2 minutes
        nextRelicStarSpawn.value = now + 120000; // 2 minutes
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
          // Revalidate typing when enemy is removed
          revalidateTyping();
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
        // Revalidate typing when enemy is removed
        revalidateTyping();

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
      handleEnemyHit,
      createExplosion,
      gameState.value.player // Pass player for bounceRange access
    );

    // Update effects
    updateExplosions(explosions.value, deltaTime.value);
    updateDamageNumbers(damageNumbers.value, deltaTime.value);

    // Check wave completion and handle continuous spawning
    if (gameState.value.waveEnemiesDefeated >= gameState.value.waveEnemyCount &&
        enemies.length === 0 &&
        !gameState.value.isPausedForLevelUp &&
        !gameState.value.isPausedBetweenWaves) {
      // Start next wave immediately without countdown
      startWave(gameState.value.wave + 1);
    }

    // Update auto-fire system
    updateAutoFire();

    // Update skill-based abilities (frost and fire)
    updateSkillAbilities();

    // Update frozen bullets (only if not effectively paused)
    if (!isEffectivelyPaused()) {
      updateFrozenBullets();
    }

    // Shield regeneration
    if (player.shield < player.maxShield) {
      player.shield = Math.min(
        player.maxShield,
        player.shield + player.shieldRegenRate * deltaTime.value
      );
    }

    // Update player rotation for Earth spinning animation
    player.rotation += deltaTime.value * 0.5; // Slow rotation: 0.5 radians per second
    if (player.rotation > Math.PI * 2) {
      player.rotation -= Math.PI * 2; // Keep angle within 0-2π range
    }

    // Update wrong typing effect (fade out)
    if (wrongTypingEffect.value > 0) {
      wrongTypingEffect.value = Math.max(0, wrongTypingEffect.value - deltaTime.value * 3);
    }

    // Update enemy wrong typing flash effects
    for (const enemy of enemies) {
      if (enemy.wrongTypingFlash > 0) {
        enemy.wrongTypingFlash = Math.max(0, enemy.wrongTypingFlash - deltaTime.value * 5); // Faster fade (0.2s)
      }
    }
  };

  // Handle typing input - NEW REAL-TIME SYSTEM
  const handleKeyPress = (key: string) => {
    if (isPaused.value || gameState.value.isPausedForLevelUp || gameState.value.isGameOver) return;

    if (key === 'Enter') {
      // Reset typing
      resetTyping();
      return;
    }

    if (key === 'Backspace') {
      // Remove last character
      if (currentTypedText.value.length > 0) {
        currentTypedText.value = currentTypedText.value.slice(0, -1);
        // Update highlighting after backspace
        updateEnemyHighlighting();
      }
      return;
    }

    // Only process valid letter keys
    if (key.length === 1 && /^[a-zA-Z]$/.test(key)) {
      // Add character (only letters)
      currentTypedText.value += key.toLowerCase();

      // Update enemy highlighting and check for complete matches
      updateEnemyHighlighting();
    }
    // Ignore any other keys (numbers, symbols, etc.) to prevent invalid input
  };

  // Reset typing state
  const resetTyping = () => {
    currentTypedText.value = '';
    highlightedEnemyId.value = null;
    highlightedRelicStarId.value = null;
    // Clear all enemy highlighting
    gameState.value.enemies.forEach(enemy => {
      enemy.isHighlighted = false;
      enemy.typedProgress = 0;
    });
    // Clear all relic star highlighting
    gameState.value.relicStars.forEach(star => {
      star.typedProgress = 0;
    });
  };

  // Handle wrong typing - consolidated logic
  const handleWrongTyping = (reason: 'manual' | 'auto' = 'manual') => {
    const { enemies, player } = gameState.value;

    // Store current state before clearing (for effects)
    const hadTypedText = currentTypedText.value !== '';
    const currentlyHighlighted = enemies.find(enemy => enemy.isHighlighted);

    // IMMEDIATELY clear typing state to prevent race conditions
    currentTypedText.value = '';
    highlightedEnemyId.value = null;
    wrongTypingEffect.value = 1;

    // Clear all enemy highlighting
    enemies.forEach(enemy => {
      enemy.isHighlighted = false;
      enemy.typedProgress = 0;
    });

    // Only apply effects if we actually had typed text
    if (hadTypedText) {
      // Trigger flash effect on previously highlighted enemy if it exists
      if (currentlyHighlighted && currentlyHighlighted.typedProgress > 0) {
        currentlyHighlighted.wrongTypingFlash = 1.0;
      }

      // Reduce player shield for invalid typing
      player.shield = Math.max(0, player.shield - 10);

      // Create damage number on player with appropriate message
      const message = reason === 'auto' ? 'INVALID TEXT!' : 'WRONG TYPING!';
      createDamageNumber(player.x, player.y - 30, 10, '#ff4444', false, message);
    }
  };

  // Update enemy highlighting based on typed text
  const updateEnemyHighlighting = (fromRevalidation: boolean = false) => {
    if (currentTypedText.value.length === 0) {
      highlightedEnemyId.value = null;
      highlightedRelicStarId.value = null;
      // Clear all highlights
      gameState.value.enemies.forEach(enemy => {
        enemy.isHighlighted = false;
        enemy.typedProgress = 0;
      });
      return;
    }

    // Check relic stars first (they have priority)
    updateRelicStarHighlighting();

    // If a relic star is highlighted, don't highlight enemies
    if (highlightedRelicStarId.value !== null) {
      highlightedEnemyId.value = null;
      // Clear all enemy highlights
      gameState.value.enemies.forEach(enemy => {
        enemy.isHighlighted = false;
        enemy.typedProgress = 0;
      });
      return;
    }

    // NEW LOGIC: Highlight ALL enemies that match the typed text
    const { enemies } = gameState.value;
    const typedText = currentTypedText.value.toLowerCase();

    let hasAnyMatch = false;
    let completedEnemy: Enemy | null = null;

    // Check all enemies for matches
    for (const enemy of enemies) {
      const enemyWord = enemy.word.toLowerCase();

      if (enemyWord.startsWith(typedText)) {
        // This enemy matches - highlight it
        enemy.isHighlighted = true;
        enemy.typedProgress = typedText.length / enemyWord.length;
        hasAnyMatch = true;

        // Check if this word is completely typed
        if (enemyWord === typedText) {
          completedEnemy = enemy;
        }
      } else {
        // This enemy doesn't match - remove highlight
        enemy.isHighlighted = false;
        enemy.typedProgress = 0;
      }
    }

    // If we found a completed word, fire at that enemy
    if (completedEnemy) {
      fireAtEnemy(completedEnemy);
      resetTyping();
      return;
    }

    // If no enemies match and we're not from revalidation, handle wrong typing
    if (!hasAnyMatch && !fromRevalidation && currentTypedText.value.length > 0) {
      handleWrongTyping();
    }

    // Update highlightedEnemyId for other systems (can be any highlighted enemy or null)
    const firstHighlighted = enemies.find(enemy => enemy.isHighlighted);
    highlightedEnemyId.value = firstHighlighted ? firstHighlighted.id : null;
  };

  // Fire at a specific enemy
  const fireAtEnemy = (enemy: Enemy) => {
    const { player } = gameState.value;

    // Check if this is a purple enemy that triggers multi-shot
    if (enemy.enemyType === 'purple') {
      player.purpleKillCount++;

      if (player.purpleKillCount >= 3) {
        // Reset counter and fire multi-shot instead of normal shot
        player.purpleKillCount = 0;
        fireMultiShot(enemy);
        return; // Don't fire normal shot
      }
    }

    // Check if this is a blue enemy that triggers bouncing shot
    if (enemy.enemyType === 'blue') {
      fireBouncingShot(enemy);
      return; // Don't fire normal shot
    }

    // Fire normal shot for other enemies
    fireNormalShot(enemy);
  };

  // Fire normal shot
  const fireNormalShot = (enemy: Enemy) => {
    const { player } = gameState.value;
    const baseDamage = player.damage;
    const isCritical = Math.random() < player.critChance;
    const damage = isCritical ? baseDamage * player.critMultiplier : baseDamage;

    fireProjectile(enemy, damage, isCritical, false, true, 'normal');
  };

  // Fire multi-shot at multiple targets
  const fireMultiShot = (primaryTarget: Enemy) => {
    const { player } = gameState.value;
    const targets = findMultiShotTargets(primaryTarget, player.multiShotTargets);

    targets.forEach((target, index) => {
      const baseDamage = player.damage;
      const isCritical = Math.random() < player.critChance;
      const damage = isCritical ? baseDamage * player.critMultiplier : baseDamage;

      setTimeout(() => {
        fireProjectile(target, damage, isCritical, true, index === 0, 'multishot');
      }, index * 50);
    });

    // Show multi-shot indicator
    createDamageNumber(primaryTarget.x, primaryTarget.y - 30, 0, '#8B5CF6', false, "MULTI-SHOT!");
  };

  // Fire bouncing shot
  const fireBouncingShot = (primaryTarget: Enemy) => {
    const { player } = gameState.value;
    const baseDamage = player.damage;
    const isCritical = Math.random() < player.critChance;
    const damage = isCritical ? baseDamage * player.critMultiplier : baseDamage;

    fireProjectile(primaryTarget, damage, isCritical, false, true, 'bouncing');

    // Show bouncing shot indicator
    createDamageNumber(primaryTarget.x, primaryTarget.y - 30, 0, '#4A90E2', false, "BOUNCE!");
  };

  // Find targets for multi-shot
  const findMultiShotTargets = (primaryTarget: Enemy, maxTargets: number): Enemy[] => {
    const targets = [primaryTarget];
    const availableEnemies = gameState.value.enemies.filter(e => e.id !== primaryTarget.id);

    // Sort by distance from player
    availableEnemies.sort((a, b) => {
      const distA = Math.sqrt((a.x - gameState.value.player.x) ** 2 + (a.y - gameState.value.player.y) ** 2);
      const distB = Math.sqrt((b.x - gameState.value.player.x) ** 2 + (b.y - gameState.value.player.y) ** 2);
      return distA - distB;
    });

    // Add closest enemies up to maxTargets
    for (let i = 0; i < Math.min(maxTargets - 1, availableEnemies.length); i++) {
      targets.push(availableEnemies[i]);
    }

    return targets;
  };

  // Legacy handleTyping function (keep for compatibility but redirect to new system)
  const handleTyping = (typedText: string) => {
    // This is now only used for manual text submission (if needed)
    // The new system handles real-time typing through handleKeyPress
    console.warn('Legacy handleTyping called, use handleKeyPress instead');
  };

  // Fire a projectile at a target enemy
  const fireProjectile = (target: Enemy, damage: number, isCritical: boolean, isMultiShot: boolean = false, isMainShot: boolean = false, shotType: 'normal' | 'bouncing' | 'multishot' = 'normal') => {
    const bounceCount = (shotType === 'bouncing') ? gameState.value.player.bounceCount : 0;

    // Apply momentum-based damage bonus for kinetic mastery
    // Faster bullets carry more kinetic energy and deal more damage
    const baseSpeed = 1.0; // Base projectile speed
    const currentSpeed = gameState.value.player.projectileSpeed;
    const speedRatio = currentSpeed / baseSpeed;

    // Kinetic energy scales with speed squared, but we use a gentler linear scale for balance
    // Each point of speed above base gives 8% damage bonus
    const momentumDamageMultiplier = 1 + (speedRatio - 1) * 0.08;
    const finalDamage = damage * momentumDamageMultiplier;

    // Show momentum bonus in damage numbers for enhanced bullets
    const showMomentumBonus = momentumDamageMultiplier > 1.05; // Show bonus if > 5% increase

    // Normal and multishot projectiles should NOT bounce regardless of player bounceCount

    const projectile = createProjectile(
      gameState.value.player.x,
      gameState.value.player.y,
      target.x,
      target.y,
      finalDamage, // Use momentum-enhanced damage
      gameState.value.player.projectileSpeed,
      gameState.value.player.projectileSize,
      isCritical,
      gameState.value.player.aoeRadius,
      target.id,
      isMultiShot,
      false, // isDoubleShot
      bounceCount,
      isMainShot,
      shotType,
      gameState.value.player // Pass player for relic effects
    );

    projectiles.value.push(projectile);

    // Show kinetic mastery momentum bonus effect
    if (showMomentumBonus && isMainShot) {
      createDamageNumber(
        gameState.value.player.x + 20,
        gameState.value.player.y - 40,
        0,
        '#00ffff',
        false,
        `KINETIC +${Math.round((momentumDamageMultiplier - 1) * 100)}%`
      );
    }
  };

  // Fire ice arrows (Arctic Barrage skill)
  const fireIceArrows = () => {
    const { player } = gameState.value;
    const arrowCount = player.frozenBulletCount || 8;

    // Fire arrows in different directions
    for (let i = 0; i < arrowCount; i++) {
      const angle = (i / arrowCount) * Math.PI * 2;
      const target = findClosestEnemyInDirection(angle);

      if (target) {
        // Create ice projectile
        const iceProjectile = createProjectile(
          player.x,
          player.y,
          target.x,
          target.y,
          player.damage * 0.8, // Slightly reduced damage for AoE skill
          player.projectileSpeed,
          player.projectileSize,
          false, // Not critical
          0, // No AoE radius
          target.id,
          false, // Not multi-shot
          false, // Not frozen bullet
          0, // No bounces
          false, // Not main shot
          'ice',
          player
        );

        projectiles.value.push(iceProjectile);
      }
    }
  };

  // Fire meteor storm (fire skill)
  const fireMeteorStorm = () => {
    const { player, enemies } = gameState.value;

    // Target all enemies with fire meteors
    enemies.forEach(enemy => {
      const fireProjectile = createProjectile(
        player.x,
        player.y,
        enemy.x,
        enemy.y,
        player.damage * 1.2, // Higher damage for fire skill
        player.projectileSpeed * 0.8, // Slower but more dramatic
        player.projectileSize * 1.5, // Larger meteors
        false, // Not critical
        0, // No AoE radius
        enemy.id,
        false, // Not multi-shot
        false, // Not frozen bullet
        0, // No bounces
        false, // Not main shot
        'fire',
        player
      );

      projectiles.value.push(fireProjectile);
    });
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
  const handleEnemyHit = (enemyId: number, damage: number, isCritical: boolean, isMultiShot: boolean, isDoubleShot: boolean, isMainShot: boolean, projectileType?: 'normal' | 'bouncing' | 'multishot' | 'ice' | 'fire') => {
    const enemy = gameState.value.enemies.find(e => e.id === enemyId);
    if (!enemy) return;

    applyDamageToEnemy(enemy, damage, isCritical, isMainShot, projectileType);

    if (isMultiShot) {
      createDamageNumber(enemy.x + 15, enemy.y - 15, Math.round(damage), '#00ffff', isCritical);
    }

    if (isDoubleShot) {
      applyFrozenEffect(enemy);
    }

    // Explosion shot skill has been removed - no more explosive effects
  };

  // Apply damage to enemy
  const applyDamageToEnemy = (enemy: Enemy, damage: number, isCritical: boolean, isMainShot: boolean, projectileType?: 'normal' | 'bouncing' | 'multishot' | 'ice' | 'fire') => {
    const enemyCountBefore = gameState.value.enemies.length;
    const enemyWordBefore = enemy.word;

    // Use the corrected function signature
    const wasKilled = applyDamageToEnemyMechanic(
      enemy,
      damage,
      isCritical,
      isMainShot,
      projectileType
    );

    // If enemy was killed, handle kill tracking and potential level up
    if (wasKilled) {
      // Track kills for skill systems
      const { player } = gameState.value;
      if (player.frostMasteryLevel > 0) {
        player.frostMasteryKills = (player.frostMasteryKills || 0) + 1;
      }
      if (player.fireMasteryLevel > 0) {
        player.fireMasteryKills = (player.fireMasteryKills || 0) + 1;
      }

      // Remove enemy from array
      const enemyIndex = gameState.value.enemies.indexOf(enemy);
      if (enemyIndex > -1) {
        gameState.value.enemies.splice(enemyIndex, 1);
        gameState.value.waveEnemiesDefeated++;

        // Update score and enemy kill count
        gameState.value.score += enemy.pointValue;
        gameState.value.enemiesKilled++;
      }

      // Create explosion effect
      createExplosion(enemy.x, enemy.y, enemy.color, 30, 0);

      // Award XP and check for level up
      const xpGain = Math.floor(enemy.pointValue * player.experienceMultiplier);
      player.xp += xpGain;
      createDamageNumber(enemy.x, enemy.y - 40, xpGain, '#00ff00', false, `+${xpGain} XP`);

      // Check for level up
      if (player.xp >= player.xpToNextLevel) {
        // Level up effect
        createExplosion(player.x, player.y, '#ffffff', 50, 0);
        // Start pause using centralized system for level up
        pauseSystem.startPause();

        // Increase level
        player.level++;
        player.xp = 0;
        player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.2);

        // Increase base stats
        player.damage += 2;
        player.maxShield += 10;
        player.shield = player.maxShield;

        // Pause game for skill selection
        gameState.value.isPausedForLevelUp = true;

        // Generate skill choices
        availableSkillChoices.value = getRandomSkills(gameState.value.availableSkills);
      }
    } else {
      // Enemy was hit but not killed - change its word to show the hit registered
      if (isMainShot) { // Only change word for main shots (user typing), not auto-fire
        enemy.word = getRandomWord();
        enemy.typedProgress = 0; // Reset typing progress
      }
    }

    // Revalidate typing if enemy was removed or its word changed
    const enemyCountAfter = gameState.value.enemies.length;
    const enemyWordAfter = enemy.health > 0 ? enemy.word : null;

    if (enemyCountAfter !== enemyCountBefore || (enemyWordAfter && enemyWordAfter !== enemyWordBefore)) {
      revalidateTyping();
    }
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

  // Relic star management functions
  const spawnRelicStar = () => {
    const relic = getRandomRelic(availableRelics.value, gameState.value.player.collectedRelicIds);
    if (!relic) {
      // No more unique relics available
      return;
    }

    const relicStar = createRelicStar(
      Date.now(), // Use timestamp as unique ID
      relic,
      canvasWidth,
      canvasHeight
    );
    gameState.value.relicStars.push(relicStar);
  };

  const updateRelicStars = () => {
    const now = Date.now();
    for (let i = gameState.value.relicStars.length - 1; i >= 0; i--) {
      const star = gameState.value.relicStars[i];

      // Update position
      star.x += star.velocityX * deltaTime.value * 60; // Scale for consistent speed
      star.y += star.velocityY * deltaTime.value * 60;

      // Update pulse and glow effects
      star.pulsePhase += deltaTime.value * 3;
      star.glowIntensity = 0.7 + Math.sin(star.pulsePhase) * 0.3;

      // Update trail
      if (star.trail.length > 0) {
        for (const trailPoint of star.trail) {
          trailPoint.opacity *= 0.95;
        }
        star.trail = star.trail.filter(point => point.opacity > 0.1);
      }
      star.trail.unshift({ x: star.x, y: star.y, opacity: 1 });
      if (star.trail.length > 8) {
        star.trail.pop();
      }

      // Update time remaining
      star.timeRemaining -= deltaTime.value * 1000;

      // Remove star if expired or off-screen
      if (star.timeRemaining <= 0 ||
          star.x < -100 || star.x > canvasWidth + 100 ||
          star.y < -100 || star.y > canvasHeight + 100) {
        gameState.value.relicStars.splice(i, 1);
        if (highlightedRelicStarId.value === star.id) {
          highlightedRelicStarId.value = null;
        }
      }
    }
  };

  const collectRelicStar = (star: RelicStar) => {
    // Apply relic effect to player
    star.relic.applyEffect(gameState.value.player);
    gameState.value.player.relics.push(star.relic);
    gameState.value.player.collectedRelicIds.push(star.relic.id); // Track collected relic for uniqueness

    // Show announcement modal and pause game using centralized system
    announcedRelic.value = star.relic;
    isRelicAnnouncementPaused.value = true;
    pauseSystem.startPause();

    // Create celebration effect
    createExplosion(star.x, star.y, star.relic.auraColor, 40, 0);
    createDamageNumber(star.x, star.y - 20, 0, star.relic.auraColor, false, `${star.relic.icon} ${star.relic.name}`);

    // Remove star
    const index = gameState.value.relicStars.indexOf(star);
    if (index > -1) {
      gameState.value.relicStars.splice(index, 1);
    }

    // Reset typing if this was the highlighted star
    if (highlightedRelicStarId.value === star.id) {
      resetTyping();
    }
  };

  const closeRelicAnnouncement = () => {
    // End pause using centralized system
    pauseSystem.endPause();

    announcedRelic.value = null;
    isRelicAnnouncementPaused.value = false;
  };

  const updateRelicStarHighlighting = () => {
    if (currentTypedText.value.length === 0) {
      highlightedRelicStarId.value = null;
      // Clear all relic star highlighting
      gameState.value.relicStars.forEach(star => {
        star.typedProgress = 0;
      });
      return;
    }

    // Find the best matching relic star
    let bestMatch: RelicStar | null = null;
    let bestScore = -1;
    const typedText = currentTypedText.value.toLowerCase();

    // Clear all relic star highlighting first
    gameState.value.relicStars.forEach(star => {
      star.typedProgress = 0;
    });

    for (const star of gameState.value.relicStars) {
      const word = star.word.toLowerCase();

      if (word.startsWith(typedText)) {
        const score = typedText.length / word.length;
        star.typedProgress = score; // Set typing progress

        if (score > bestScore) {
          bestScore = score;
          bestMatch = star;
        }
      }
    }

    if (bestMatch && bestScore >= 0.1) { // Require at least 10% match
      highlightedRelicStarId.value = bestMatch.id;

      // Check if word is complete
      if (bestMatch.word.toLowerCase() === currentTypedText.value.toLowerCase()) {
        collectRelicStar(bestMatch);
        resetTyping();
      }
    } else {
      highlightedRelicStarId.value = null;
    }
  };

  // Create explosion effect
  const createExplosion = (x: number, y: number, color: string, radius: number = 30, damage: number = 0) => {
    const explosion = importedCreateExplosion(
      x, y, color, radius, damage,
      damage > 0 ? gameState.value.enemies : [],
      (enemy, dmg, isCritical) => applyDamageToEnemy(enemy, dmg, isCritical, false),
      gameState.value.player // Pass player for Nova Core effects
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

    // Reset typing state for new wave
    resetTyping();

    startWaveMechanic(
      gameState.value,
      canvasWidth,
      canvasHeight,
      () => {},
      () => {},
      { value: spawnTimerId.value },
      isEffectivelyPaused
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
            fireProjectile(enemy, player.damage * 0.8, false, false, false);

            setTimeout(() => {
              autoFireTarget.value = null;
              autoFireLaserOpacity.value = 0;
            }, 200);
          }, 500);
        }, currentTypedText.value);

        player.nextAutoFireTime = now + autoFireInterval;
      }
    }

    if (autoFireLaserOpacity.value > 0) {
      autoFireLaserOpacity.value = Math.max(0, autoFireLaserOpacity.value - deltaTime.value * 2);
    }
  };

  // Update frozen bullets system
  const updateFrozenBullets = () => {
    // Remove this entire function since we're using kill-based skills now
    // The updateSkillAbilities function handles ice and fire skills
  };

  // Handle level up confirmation
  const handleLevelUpConfirmation = (skill: Skill) => {
    const gameStateSkill = gameState.value.availableSkills.find(s => s.id === skill.id);
    if (gameStateSkill) {
      gameStateSkill.level++;
      gameStateSkill.applyEffect(gameState.value.player);
    }

    // End pause using centralized system
    pauseSystem.endPause();

    gameState.value.isPausedForLevelUp = false;
    availableSkillChoices.value = [];
  };

  // Revalidate current typing against remaining enemies and relic stars
  const revalidateTyping = () => {
    // Double-check that we still have typed text (prevent race conditions)
    if (!currentTypedText.value) return;

    const typedText = currentTypedText.value;
    const { enemies, relicStars } = gameState.value;

    // Check if ANY relic star matches the current typed text (relic stars have priority)
    let hasMatchingRelicStar = false;
    for (const star of relicStars) {
      const starWord = star.word.toLowerCase();
      if (starWord.startsWith(typedText)) {
        hasMatchingRelicStar = true;
        break;
      }
    }

    // If a relic star matches, preserve the typing and update relic star highlighting
    if (hasMatchingRelicStar) {
      updateRelicStarHighlighting();
      return; // Don't reset typing, user is typing a relic star
    }

    // Check if ANY remaining enemy matches the current typed text
    let hasMatchingEnemy = false;
    for (const enemy of enemies) {
      const enemyWord = enemy.word.toLowerCase();
      if (enemyWord.startsWith(typedText)) {
        hasMatchingEnemy = true;
        break;
      }
    }

    // If no enemy matches the current typed text, handle wrong typing
    if (!hasMatchingEnemy) {
      // Clear the text immediately to prevent any potential race conditions
      const wasTyping = currentTypedText.value !== '';
      currentTypedText.value = '';

      // Only show effects if we were actually typing something
      if (wasTyping) {
        handleWrongTyping('auto');
      }
    } else {
      // Update highlighting for all remaining matching enemies
      // Pass true to indicate this is from revalidation
      updateEnemyHighlighting(true);
    }
  };

  // Check if game is effectively paused (regular pause OR relic announcement)
  const isEffectivelyPaused = () => {
    return isPaused.value || isRelicAnnouncementPaused.value || gameState.value.isPausedForLevelUp;
  };

  // Enhanced pause system using centralized pause mechanism
  const togglePause = () => {
    if (gameState.value.isPlaying && !gameState.value.isGameOver && !isRelicAnnouncementPaused.value) {
      if (!isPaused.value) {
        // Start pause
        pauseSystem.startPause();
        isPaused.value = true;
      } else {
        // End pause
        pauseSystem.endPause();
        isPaused.value = false;
      }
    }
  };

  // Update skill-based abilities (frost and fire)
  const updateSkillAbilities = () => {
    const { player } = gameState.value;

    // Check for Arctic Barrage (frost skill) trigger
    if (player.frostMasteryLevel > 0 && player.frostMasteryKills >= player.frostMasteryKillsRequired) {
      fireIceArrows();
      player.frostMasteryKills = 0; // Reset kill count
    }

    // Check for Meteor Storm (fire skill) trigger
    if (player.fireMasteryLevel > 0 && player.fireMasteryKills >= player.fireMasteryKillsRequired) {
      fireMeteorStorm();
      player.fireMasteryKills = 0; // Reset kill count
    }
  };

  return {
    gameState,
    projectiles,
    explosions,
    damageNumbers,
    stars,
    backgroundGradient,
    autoFireTarget,
    autoFireLaserOpacity,
    deltaTime,
    isPaused,
    isRelicAnnouncementPaused,
    availableSkillChoices,
    // Relic system
    highlightedRelicStarId,
    announcedRelic,
    // Typing state
    currentTypedText,
    highlightedEnemyId,
    wrongTypingEffect,
    // Functions
    startGame,
    restartGame,
    togglePause,
    updateGame,
    handleKeyPress,
    resetTyping,
    handleTyping,
    handleLevelUpConfirmation,
    updateGameState, // Export for debugging if needed
    updateEnemyHighlighting, // Export for debugging if needed
    revalidateTyping,
    handleWrongTyping, // Export for debugging if needed
    spawnRelicStar,
    updateRelicStars,
    collectRelicStar,
    updateRelicStarHighlighting,
    closeRelicAnnouncement,
    isEffectivelyPaused,
  };
}