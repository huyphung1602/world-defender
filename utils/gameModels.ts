import { getRandomColor } from '../utils/wordGenerator';

export interface Enemy {
  id: number;
  x: number;
  y: number;
  word: string;
  color: string;
  radius: number;
  velocityX: number;
  velocityY: number;
  speed: number;
  glowColor?: string;
  pulsePhase?: number;
  health: number;
  maxHealth: number;
  isElite?: boolean;
  isBoss?: boolean;
  pointValue: number;
  wave: number;
  shape: string;
  // Frozen effect properties
  isFrozen: boolean;
  frozenUntil: number | null;
  originalSpeed: number;
}

export interface Player {
  x: number;
  y: number;
  radius: number;
  color: string;
  innerColor: string;
  glowColor: string;
  glowSize: number;
  damage: number;
  critChance: number;
  critMultiplier: number;
  projectileSpeed: number;
  attackSpeed: number;
  projectileSize: number;
  aoeRadius: number;
  explosiveChance: number;
  shield: number;
  maxShield: number;
  shieldRegenRate: number;
  xp: number;
  level: number;
  xpToNextLevel: number;
  autoFireInterval: number | null;
  multiShotTargets: number;
  multiShotChance: number;
  bounceCount: number;  // Number of times bullets can bounce
  frozenBulletCooldown: number | null;  // Cooldown for frozen bullets (ms)
  nextFrozenBulletTime: number | null;  // Next time frozen bullets will fire
  frozenBulletCount: number;  // Number of frozen bullets to fire
  autoFireCooldown: number | null;  // Cooldown for auto-fire (ms)
  nextAutoFireTime: number | null;  // Next time auto-fire will trigger
  autoFireTargetId: number | null;  // ID of the auto-fire target
}

export interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  isPausedForLevelUp: boolean;
  isPausedBetweenWaves: boolean;
  player: Player;
  enemies: Enemy[];
  wave: number;
  waveEnemyCount: number;
  waveEnemiesDefeated: number;
  availableSkills: Skill[];
  score: number; // Track player's total score
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  maxLevel: number;
  applyEffect: (player: Player) => void;
}

export interface ActiveSkill {
  id: string;
  name: string;
  cooldown: number;
  duration: number;
  currentCooldown: number;
  isActive: boolean;
  startTime: number | null;
  applyEffect: (gameState: GameState) => void;
  removeEffect: (gameState: GameState) => void;
}

export const createEnemy = (
  id: number,
  x: number,
  y: number,
  word: string,
  color: string,
  speed: number,
  canvasWidth: number,
  canvasHeight: number,
  wave: number,
  isElite: boolean = false,
  isBoss: boolean = false
): Enemy => {
  // Always target the exact center of the canvas
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  // Calculate direction vector
  const directionX = centerX - x;
  const directionY = centerY - y;

  // Normalize the direction vector
  const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
  const normalizedDirectionX = directionX / magnitude;
  const normalizedDirectionY = directionY / magnitude;

  // Calculate velocity components based on speed
  const velocityX = normalizedDirectionX * speed;
  const velocityY = normalizedDirectionY * speed;

  // Calculate health based on wave and enemy type
  // First wave enemies die in one hit (10 damage)
  let baseHealth = wave === 1 ? 10 : (5 + (wave * 3));
  let health = baseHealth;
  let pointValue = 10 + (wave * 2);

  // Set radius and appearance based on enemy type
  let radius = 20;
  let shape = 'circle'; // Default shape

  if (isElite) {
    health = baseHealth * 2.5;
    pointValue = pointValue * 3;
    radius = 30;
    shape = 'hexagon';
  } else if (isBoss) {
    health = baseHealth * 8;
    pointValue = pointValue * 10;
    radius = 50;
    shape = 'octagon';
  }

  // Determine color based on health/toughness if not specified
  if (color === getRandomColor()) {
    // Only modify random colors, not special colors for bosses/elites
    if (health <= 10) {
      color = '#4CAF50'; // Green for easy enemies
    } else if (health <= 30) {
      color = '#FFC107'; // Yellow for medium enemies
    } else if (health <= 60) {
      color = '#FF9800'; // Orange for tough enemies
    } else {
      color = '#F44336'; // Red for very tough enemies
    }
  }

  // Create a glow color based on the main color but lighter
  const glowColor = lightenColor(color, 50);

  return {
    id,
    x,
    y,
    word,
    color,
    radius,
    velocityX,
    velocityY,
    speed,
    glowColor,
    pulsePhase: Math.random() * Math.PI * 2, // Random starting phase for pulsing effect
    health,
    maxHealth: health,
    isElite,
    isBoss,
    pointValue,
    wave,
    shape, // Add shape property to enemy
    isFrozen: false,
    frozenUntil: null,
    originalSpeed: speed,
  };
};

export const createPlayer = (x: number, y: number): Player => {
  const mainColor = '#3498db';
  const innerColor = '#2980b9';
  const glowColor = '#7cd6ff';

  return {
    x,
    y,
    radius: 25,
    color: mainColor,
    innerColor,
    glowColor,
    glowSize: 35,
    damage: 10,
    critChance: 0.05,
    critMultiplier: 1.5,
    projectileSpeed: 3,
    attackSpeed: 1,
    projectileSize: 4,
    aoeRadius: 0,
    explosiveChance: 0,
    shield: 100,
    maxShield: 100,
    shieldRegenRate: 2,
    xp: 0,
    level: 1,
    xpToNextLevel: 100,
    autoFireInterval: null,
    multiShotTargets: 0,
    multiShotChance: 0, // Start with 0% chance, only gets chance when skill is learned
    bounceCount: 0,  // Start with no bounces
    frozenBulletCooldown: null,  // Start with no frozen bullets
    nextFrozenBulletTime: null,
    frozenBulletCount: 0,
    autoFireCooldown: null,  // Start with no auto-fire
    nextAutoFireTime: null,
    autoFireTargetId: null,
  };
};

export const createInitialGameState = (canvasWidth: number, canvasHeight: number): GameState => {
  return {
    isPlaying: false,
    isGameOver: false,
    isPausedForLevelUp: false,
    isPausedBetweenWaves: false,
    player: createPlayer(canvasWidth / 2, canvasHeight / 2),
    enemies: [],
    wave: 0,
    waveEnemyCount: 0,
    waveEnemiesDefeated: 0,
    availableSkills: generateSkills(),
    score: 0,
  };
};

// Generate all available skills
export const generateSkills = (): Skill[] => {
  return [
    {
      id: 'damage',
      name: 'Increased Damage',
      description: 'Increases your damage by 5',
      icon: '💪',
      level: 0,
      maxLevel: 5,
      applyEffect: (player: Player) => {
        player.damage += 5;
      }
    },
    {
      id: 'crit',
      name: 'Critical Strikes',
      description: 'Increases critical chance by 5%',
      icon: '🎯',
      level: 0,
      maxLevel: 5,
      applyEffect: (player: Player) => {
        player.critChance += 0.05;
      }
    },
    {
      id: 'triple_shot',
      name: 'Triple Shot',
      description: 'Fires 3 shots at the same target. Each shot can trigger other skill effects.',
      icon: '🔱',
      level: 0,
      maxLevel: 5,
      applyEffect: (player: Player) => {
        player.multiShotTargets += 1; // Keep for compatibility, represents number of extra shots
        if (player.multiShotChance === 0) {
          // First level gives 10% base chance
          player.multiShotChance = 0.1;
        } else {
          // Additional levels give +5% each
          player.multiShotChance += 0.05;
        }
      }
    },
    {
      id: 'shield',
      name: 'Enhanced Shield',
      description: 'Increases max shield by 25',
      icon: '🛡️',
      level: 0,
      maxLevel: 5,
      applyEffect: (player: Player) => {
        player.maxShield += 25;
        player.shield = Math.min(player.shield + 25, player.maxShield);
      }
    },
    {
      id: 'regen',
      name: 'Shield Regeneration',
      description: 'Increases shield regen rate',
      icon: '♻️',
      level: 0,
      maxLevel: 5,
      applyEffect: (player: Player) => {
        player.shieldRegenRate += 1;
      }
    },
    {
      id: 'explosive',
      name: 'Explosive Shots',
      description: 'Shots have a chance to cause explosions',
      icon: '💣',
      level: 0,
      maxLevel: 3,
      applyEffect: (player: Player) => {
        // Each level adds 10% chance for explosive shots
        player.explosiveChance += 0.1;
      }
    },
    {
      id: 'frozen_bullets',
      name: 'Frozen Bullets',
      description: 'Auto-fires frozen bullets in all directions every 20s. Each level reduces cooldown by 2s and adds one bullet.',
      icon: '❄️',
      level: 0,
      maxLevel: 5,
      applyEffect: (player: Player) => {
        if (player.frozenBulletCooldown === null) {
          player.frozenBulletCooldown = 20000; // 20 seconds initial cooldown
          player.nextFrozenBulletTime = Date.now() + player.frozenBulletCooldown;
          player.frozenBulletCount = 12; // Start with 12 bullets around the Earth
        } else {
          player.frozenBulletCooldown = Math.max(10000, player.frozenBulletCooldown - 2000); // Reduce by 2 seconds per level, minimum 10 seconds
          player.frozenBulletCount += 1; // Add one more bullet each level
        }
      }
    },
    {
      id: 'smart_auto',
      name: 'Smart Auto-Fire',
      description: 'Auto-fires at an enemy every 10 seconds. Each level reduces cooldown by 1.5 seconds (min 3s).',
      icon: '🤖',
      level: 0,
      maxLevel: 5,
      applyEffect: (player: Player) => {
        if (player.autoFireCooldown === null) {
          player.autoFireCooldown = 10000; // 10 seconds initial cooldown
          player.nextAutoFireTime = Date.now() + player.autoFireCooldown;
          player.autoFireTargetId = null;
        } else {
          player.autoFireCooldown = Math.max(3000, player.autoFireCooldown - 1500); // Reduce by 1.5 seconds per level, minimum 3 seconds
        }
      }
    },
    {
      id: 'bounce',
      name: 'Bouncing Bullets',
      description: 'Bullets have a 25% chance to bounce to hit additional enemies. Each level adds one potential bounce.',
      icon: '↩️',
      level: 0,
      maxLevel: 3,
      applyEffect: (player: Player) => {
        player.bounceCount += 1;
      }
    },
  ];
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

// Get random skills for level up
export const getRandomSkills = (skills: Skill[], count: number = 3): Skill[] => {
  // Filter out skills that are already at max level
  const availableSkills = skills.filter(skill => skill.level < skill.maxLevel);

  // If we have fewer available skills than requested, return all available
  if (availableSkills.length <= count) {
    return availableSkills;
  }

  // Shuffle and pick random skills
  const shuffled = [...availableSkills].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

/**
 * Wave configuration
 */
interface WaveConfig {
  enemyCount: number;
  spawnInterval: number;
  eliteChance: number;
  bossChance: number;
}

/**
 * Get wave configuration
 */
export const getWaveConfiguration = (wave: number): WaveConfig => {
  const baseEnemyCount = 5;
  const enemyCount = baseEnemyCount + Math.floor(wave * 1.5);
  const spawnInterval = Math.max(500, 2000 - (wave * 100));

  // Elite chance increases gradually
  const eliteChance = Math.min(0.1 + (wave * 0.05), 0.4); // Cap at 40% chance

  // Boss chance increases more slowly
  const bossChance = Math.min(0.02 + (wave * 0.02), 0.15); // Cap at 15% chance

  return {
    enemyCount,
    spawnInterval,
    eliteChance,
    bossChance
  };
};