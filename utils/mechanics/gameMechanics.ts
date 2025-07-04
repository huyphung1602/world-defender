/**
 * Game mechanics
 * Contains functions for managing game mechanics like level progression, enemy spawning, etc.
 */
import type { Enemy, GameState, Player, Skill } from '../gameModels';
import { createEnemy, getWaveConfiguration, getRandomSkills } from '../gameModels';
import { getRandomWord } from '../wordGenerator';

/**
 * Start a new wave
 */
export const startWave = (
  gameState: GameState,
  canvasWidth: number,
  canvasHeight: number,
  onCreateExplosion: (x: number, y: number, color: string, radius: number, damage: number) => void,
  onCreateDamageNumber: (x: number, y: number, value: number, color: string, isCritical: boolean, text: string) => void,
  spawnTimerId: { value: number },
  isEffectivelyPaused?: () => boolean
): void => {
  const wave = gameState.wave;
  const waveConfig = getWaveConfiguration(wave);

  // Set wave enemy count - for continuous spawning, we'll use this as enemies per minute or similar
  gameState.waveEnemyCount = waveConfig.enemyCount;
  gameState.waveEnemiesDefeated = 0;

  // Reset pause between waves flag for immediate start
  gameState.isPausedBetweenWaves = false;

  let enemiesSpawned = 0;

  // Clear any existing spawn timer
  clearInterval(spawnTimerId.value);

  // Continuous spawning - spawn enemies at regular intervals indefinitely
  // No more wave countdown, just keep spawning until enemies are defeated
  spawnTimerId.value = window.setInterval(() => {
    // Check if game is paused or over
    if (gameState.isGameOver || (isEffectivelyPaused && isEffectivelyPaused())) {
      return; // Don't spawn enemies when paused, but don't clear the timer
    }

    // For continuous spawning, we can keep spawning enemies
    // but reduce frequency as more enemies are on screen to avoid overwhelming
    const activeEnemies = gameState.enemies.length;
    const maxActiveEnemies = Math.max(8, waveConfig.enemyCount); // At least 8, more for higher waves

    if (activeEnemies < maxActiveEnemies) {
      spawnEnemy(gameState, canvasWidth, canvasHeight, wave, waveConfig);
      enemiesSpawned++;
    }
  }, waveConfig.spawnInterval);
};

/**
 * Pause or resume enemy spawning
 */
export const pauseEnemySpawning = (spawnTimerId: { value: number }): void => {
  clearInterval(spawnTimerId.value);
};

/**
 * Resume enemy spawning with saved state
 */
export const resumeEnemySpawning = (
  gameState: GameState,
  canvasWidth: number,
  canvasHeight: number,
  onCreateExplosion: (x: number, y: number, color: string, radius: number, damage: number) => void,
  onCreateDamageNumber: (x: number, y: number, value: number, color: string, isCritical: boolean, text: string) => void,
  spawnTimerId: { value: number },
  isEffectivelyPaused?: () => boolean
): void => {
  // Resume spawning with current wave configuration
  if (!gameState.isGameOver && gameState.isPlaying) {
    startWave(gameState, canvasWidth, canvasHeight, onCreateExplosion, onCreateDamageNumber, spawnTimerId, isEffectivelyPaused);
  }
};

// Helper function to spawn an enemy
const spawnEnemy = (
  gameState: GameState,
  canvasWidth: number,
  canvasHeight: number,
  wave: number,
  waveConfig: any
): void => {
  // Determine enemy type
  const rand = Math.random();
  let isElite = false;
  let isBoss = false;

  if (rand < waveConfig.bossChance) {
    isBoss = true;
  } else if (rand < waveConfig.bossChance + waveConfig.eliteChance) {
    isElite = true;
  }

  // Generate spawn position (from edges)
  const margin = 50;
  const side = Math.floor(Math.random() * 4);
  let x, y;
  let spawnSide: 'top' | 'right' | 'bottom' | 'left';

  switch (side) {
    case 0: // Top
      x = Math.random() * canvasWidth;
      y = -margin;
      spawnSide = 'top';
      break;
    case 1: // Right
      x = canvasWidth + margin;
      y = Math.random() * canvasHeight;
      spawnSide = 'right';
      break;
    case 2: // Bottom
      x = Math.random() * canvasWidth;
      y = canvasHeight + margin;
      spawnSide = 'bottom';
      break;
    case 3: // Left
    default:
      x = -margin;
      y = Math.random() * canvasHeight;
      spawnSide = 'left';
      break;
  }

  // Generate enemy
  const word = getRandomWord();
  const color = isElite ? '#9c27b0' : isBoss ? '#f44336' : '#ff9800';
  let speed = isBoss ? 15 : isElite ? 25 : 30;

  // Apply Time Distortion effect if player has it
  if (gameState.player.hasTimeDistortion) {
    speed *= 0.7; // Reduce speed by 30%
  }

  const enemy = createEnemy(
    Date.now() + Math.random(),
    x,
    y,
    word,
    color,
    speed,
    canvasWidth,
    canvasHeight,
    wave,
    isElite,
    isBoss,
    spawnSide,
    gameState.player
  );

  gameState.enemies.push(enemy);
};

/**
 * Pause between waves for upgrade selection
 */
export const pauseBetweenWaves = (
  gameState: GameState,
  availableSkillChoices: { value: Skill[] },
  spawnTimerId: { value: number },
  autoFireTimerId: { value: number }
): void => {
  gameState.isPausedBetweenWaves = true;

  // Clear timers
  clearInterval(spawnTimerId.value);
  clearInterval(autoFireTimerId.value);

  // Generate skill choices
  availableSkillChoices.value = getRandomSkills(gameState.availableSkills);
};

/**
 * Select a skill upgrade
 */
export const selectSkill = (
  skill: Skill,
  gameState: GameState,
  canvasWidth: number,
  canvasHeight: number,
  onEnemySpawned: () => void,
  onWaveComplete: () => void,
  spawnTimerId: { value: number },
  isEffectivelyPaused?: () => boolean
): void => {
  // Find the actual skill in the game state and level it up
  const gameStateSkill = gameState.availableSkills.find(s => s.id === skill.id);
  if (gameStateSkill) {
    gameStateSkill.level++;
    gameStateSkill.applyEffect(gameState.player);
  }

  // Start the next wave
  startWave(
    gameState,
    canvasWidth,
    canvasHeight,
    onEnemySpawned,
    onWaveComplete,
    spawnTimerId,
    isEffectivelyPaused
  );
};

/**
 * Level up the player
 */
export const levelUpPlayer = (
  player: Player,
  onLevelUp: () => void,
  gameState: GameState,
  availableSkillChoices: { value: Skill[] }
): void => {
  // Increase level
  player.level++;

  // Reset XP and increase XP required for next level
  player.xp = 0;
  player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.2);

  // Increase base stats
  player.damage += 2;
  player.maxShield += 10;
  player.shield = player.maxShield;

  // Trigger level up effect
  onLevelUp();

  // Pause game for skill selection on level up
  gameState.isPausedForLevelUp = true;

  // Generate skill choices
  availableSkillChoices.value = getRandomSkills(gameState.availableSkills);
};

/**
 * Apply damage to an enemy and handle defeat if needed
 */
export const applyDamageToEnemy = (
  enemy: Enemy,
  damage: number,
  isCritical: boolean,
  isMainShot: boolean,
  projectileType?: 'normal' | 'bouncing' | 'multishot' | 'ice' | 'fire'
): boolean => {
  enemy.health -= damage;

  // Apply special effects based on projectile type
  if (projectileType === 'ice') {
    // Apply freeze effect
    enemy.isFrozen = true;
    enemy.frozenUntil = Date.now() + 3000; // 3 seconds freeze
    enemy.originalSpeed = enemy.speed;
    enemy.speed = enemy.speed * 0.3; // Slow to 30% speed
  } else if (projectileType === 'fire') {
    // Apply burn effect with 30% chance
    if (Math.random() < 0.3) {
      enemy.isBurning = true;
      enemy.burnUntil = Date.now() + 3000; // 3 seconds burn
      enemy.burnDamage = damage * 0.2; // 20% of original damage per tick
      enemy.burnTickInterval = 500; // Burn every 0.5 seconds
      enemy.nextBurnTick = Date.now() + enemy.burnTickInterval;
    }
  }

  return enemy.health <= 0;
};

/**
 * Auto-fire at enemies
 */
export const autoFireAtEnemies = (
  gameState: GameState,
  onFireProjectile: (enemy: Enemy) => void,
  currentTypedText: string = '' // Add parameter to know what user is typing
): void => {
  if (gameState.isGameOver || gameState.isPausedBetweenWaves) return;

  // Separate enemies into two groups: those matching user typing and those not matching
  const nonTypedEnemies: Enemy[] = [];
  const typedEnemies: Enemy[] = [];

  for (const enemy of gameState.enemies) {
    if (currentTypedText && enemy.word.toLowerCase().startsWith(currentTypedText.toLowerCase())) {
      typedEnemies.push(enemy);
    } else {
      nonTypedEnemies.push(enemy);
    }
  }

  // Find closest enemy from preferred group (prioritize non-typed enemies)
  let targetGroup = nonTypedEnemies.length > 0 ? nonTypedEnemies : typedEnemies;
  let closestEnemy = null;
  let closestDistance = Infinity;

  for (const enemy of targetGroup) {
    const dx = enemy.x - gameState.player.x;
    const dy = enemy.y - gameState.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestEnemy = enemy;
    }
  }

  // Fire at closest enemy if found
  if (closestEnemy) {
    onFireProjectile(closestEnemy);
  }
};