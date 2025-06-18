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
  spawnTimerId: { value: number }
): void => {
  const wave = gameState.wave;
  const waveConfig = getWaveConfiguration(wave);

  // Set wave enemy count
  gameState.waveEnemyCount = waveConfig.enemyCount;
  gameState.waveEnemiesDefeated = 0;

  let enemiesSpawned = 0;

  // Clear any existing spawn timer
  clearInterval(spawnTimerId.value);

  // Spawn enemies at intervals
  spawnTimerId.value = window.setInterval(() => {
    if (enemiesSpawned < waveConfig.enemyCount && !gameState.isGameOver) {
      spawnEnemy(gameState, canvasWidth, canvasHeight, wave, waveConfig);
      enemiesSpawned++;
    }

    if (enemiesSpawned >= waveConfig.enemyCount) {
      clearInterval(spawnTimerId.value);
    }
  }, waveConfig.spawnInterval);
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
  const speed = isBoss ? 15 : isElite ? 25 : 30;

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
    spawnSide
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
  spawnTimerId: { value: number }
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
    spawnTimerId
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
  gameState: GameState,
  onCreateExplosion: (x: number, y: number, color: string, radius?: number, damage?: number) => void,
  onCreateDamageNumber: (x: number, y: number, value: number, color: string, isCritical?: boolean) => void,
  onLevelUp: () => void,
  availableSkillChoices: { value: Skill[] },
  isMainShot: boolean = false // Only main shots (from user typing) should change words
): void => {
  enemy.health -= damage;

  // Create damage number
  onCreateDamageNumber(
    enemy.x,
    enemy.y - enemy.radius - 10,
    Math.round(damage),
    isCritical ? '#ff0000' : '#ffffff',
    isCritical
  );

  // Change the enemy word when it takes damage but isn't defeated
  // ONLY for main shots (user-typed shots) to avoid interfering with typing
  if (enemy.health > 0 && isMainShot) {
    // Get a new random word
    const newWord = getRandomWord();
    // Only change if it's different to avoid confusion
    if (newWord !== enemy.word) {
      enemy.word = newWord;
    }
  }

  // Check if enemy is defeated
  if (enemy.health <= 0) {
    // Calculate XP based on enemy value
    const xpIncrease = enemy.pointValue;

    // Update player XP
    gameState.player.xp += xpIncrease;

    // Update score - add the enemy's point value to the total score
    gameState.score += enemy.pointValue;

    // Check for level up
    if (gameState.player.xp >= gameState.player.xpToNextLevel) {
      levelUpPlayer(gameState.player, onLevelUp, gameState, availableSkillChoices);
    }

    // Create explosion effect
    onCreateExplosion(enemy.x, enemy.y, enemy.color);

    // Increment wave enemy counter
    gameState.waveEnemiesDefeated++;

    // Remove enemy
    const currentIndex = gameState.enemies.findIndex(e => e.id === enemy.id);
    if (currentIndex !== -1) {
      gameState.enemies.splice(currentIndex, 1);
    }
  }
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