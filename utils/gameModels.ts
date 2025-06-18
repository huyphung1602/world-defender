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
  // Typing highlight properties
  isHighlighted: boolean;
  typedProgress: number; // Number of characters typed correctly
  wrongTypingFlash: number; // Flash effect when wrong typing occurs (0-1)
  spawnSide: 'top' | 'right' | 'bottom' | 'left'; // Which side the enemy spawned from
}

export interface Player {
  x: number;
  y: number;
  radius: number;
  color: string;
  innerColor: string;
  glowColor: string;
  glowSize: number;
  rotation: number; // Rotation angle in radians for Earth rotation animation
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
  // Relic system properties
  relics: Relic[];  // Collected relics
  damageMultiplier: number;  // Multiplier for all damage
  shieldEfficiency: number;  // Multiplier for shield effectiveness
  experienceMultiplier: number; // Multiplier for XP gained
  // Special relic effects
  hasTimeDistortion?: boolean; // Time Distortion relic effect
  hasNovaCore?: boolean; // Nova Core relic effect
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
  // Relic system
  relicStars: RelicStar[];  // Flying stars containing relics
  // Game timer and stats
  startTime: number; // When the game started
  enemiesKilled: number; // Total enemies killed
  gameWon: boolean; // Whether player won by surviving 20 minutes
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
  isBoss: boolean = false,
  spawnSide: 'top' | 'right' | 'bottom' | 'left' = 'top'
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
  // Improved scaling: more reasonable growth that allows for skill synergies
  // Formula: Base health grows more gradually but with exponential elements for challenge
  let baseHealth: number;
  if (wave === 1) {
    baseHealth = 10; // First wave enemies die in one hit
  } else if (wave <= 5) {
    baseHealth = 10 + (wave - 1) * 8; // Waves 2-5: 18, 26, 34, 42
  } else if (wave <= 10) {
    baseHealth = 42 + (wave - 5) * 12; // Waves 6-10: 54, 66, 78, 90, 102
  } else if (wave <= 20) {
    baseHealth = 102 + (wave - 10) * 15; // Waves 11-20: 117, 132, ..., 252
  } else {
    // Late game: slower growth to allow skill synergies to matter
    baseHealth = 252 + (wave - 20) * 18;
  }

  let health = baseHealth;
  let pointValue = Math.floor(10 + (wave * 1.5) + (baseHealth / 10));

  // Set radius and appearance based on enemy type
  let radius = 20;
  let shape = 'circle'; // Default shape

  if (isElite) {
    health = Math.floor(baseHealth * 2.2); // Reduced from 2.5x for better balance
    pointValue = pointValue * 3;
    radius = 30;
    shape = 'hexagon';
  } else if (isBoss) {
    health = Math.floor(baseHealth * 6); // Reduced from 8x for better balance
    pointValue = pointValue * 8;
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
    isHighlighted: false,
    typedProgress: 0,
    wrongTypingFlash: 0,
    spawnSide,
  };
};

export const createPlayer = (x: number, y: number): Player => {
  return {
    x,
    y,
    radius: 30,
    color: '#00ff00',
    innerColor: '#004400',
    glowColor: '#00ff00',
    glowSize: 10,
    rotation: 0,
    damage: 10,
    critChance: 0.1,
    critMultiplier: 1.5,
    projectileSpeed: 3,
    attackSpeed: 1,
    projectileSize: 4,
    aoeRadius: 0,
    explosiveChance: 0,
    shield: 160,
    maxShield: 160,
    shieldRegenRate: 3,
    xp: 0,
    level: 1,
    xpToNextLevel: 100,
    autoFireInterval: null,
    multiShotTargets: 1,
    multiShotChance: 0,
    bounceCount: 0,
    frozenBulletCooldown: null,
    nextFrozenBulletTime: null,
    frozenBulletCount: 0,
    autoFireCooldown: null,
    nextAutoFireTime: null,
    autoFireTargetId: null,
    relics: [],
    damageMultiplier: 1,
    shieldEfficiency: 1,
    experienceMultiplier: 1,
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
    // Relic system
    relicStars: [],
    // Game timer and stats
    startTime: 0,
    enemiesKilled: 0,
    gameWon: false,
  };
};

// Generate all available skills
export const generateSkills = (): Skill[] => {
  return [
    {
      id: 'damage',
      name: 'Weapon Mastery',
      description: 'Level 1-3: +8 damage each. Level 4+: +15% damage multiplier',
      icon: '💪',
      level: 0,
      maxLevel: 7,
      applyEffect: (player: Player) => {
        if (player.level <= 3) {
          player.damage += 8; // Early levels get flat damage
        } else {
          player.damageMultiplier += 0.15; // Later levels get multiplier
        }
      }
    },
    {
      id: 'crit',
      name: 'Precision Training',
      description: 'Level 1-3: +8% crit chance. Level 4+: +0.3x crit multiplier',
      icon: '🎯',
      level: 0,
      maxLevel: 6,
      applyEffect: (player: Player) => {
        if (player.level <= 3) {
          player.critChance += 0.08;
        } else {
          player.critMultiplier += 0.3;
        }
      }
    },
    {
      id: 'rapid_fire',
      name: 'Rapid Fire',
      description: 'Level 1-2: 20% chance for double shots. Level 3+: +15% multi-shot chance',
      icon: '🔱',
      level: 0,
      maxLevel: 5,
      applyEffect: (player: Player) => {
        if (player.level <= 2) {
          if (player.multiShotChance === 0) {
            player.multiShotChance = 0.2; // Start with 20%
          } else {
            player.multiShotChance += 0.15; // +15% each level
          }
          player.multiShotTargets = 1; // Double shots
        } else {
          player.multiShotChance += 0.15;
          player.multiShotTargets = Math.min(player.multiShotTargets + 1, 3); // Up to quad shots
        }
      }
    },
    {
      id: 'fortification',
      name: 'Fortress Protocol',
      description: 'Level 1-2: +40 max shield. Level 3+: +25% shield efficiency',
      icon: '🛡️',
      level: 0,
      maxLevel: 6,
      applyEffect: (player: Player) => {
        if (player.level <= 2) {
          player.maxShield += 40;
          player.shield = Math.min(player.shield + 40, player.maxShield);
        } else {
          player.shieldEfficiency += 0.25;
        }
      }
    },
    {
      id: 'regeneration',
      name: 'Energy Recovery',
      description: 'Level 1-2: +2 regen rate. Level 3+: +50% regen efficiency',
      icon: '♻️',
      level: 0,
      maxLevel: 5,
      applyEffect: (player: Player) => {
        if (player.level <= 2) {
          player.shieldRegenRate += 2;
        } else {
          player.shieldRegenRate = Math.floor(player.shieldRegenRate * 1.5);
        }
      }
    },
    {
      id: 'explosive',
      name: 'Demolition Expert',
      description: 'Level 1: 15% explosion chance. Each level: +10% chance, +20% radius',
      icon: '💣',
      level: 0,
      maxLevel: 4,
      applyEffect: (player: Player) => {
        if (player.level === 1) {
          player.explosiveChance = 0.15;
          player.aoeRadius = 25;
        } else {
          player.explosiveChance += 0.1;
          player.aoeRadius = Math.floor(player.aoeRadius * 1.2);
        }
      }
    },
    {
      id: 'frost_mastery',
      name: 'Frost Mastery',
      description: 'Auto-frost burst every 15s. Each level: -2s cooldown, +2 bullets',
      icon: '❄️',
      level: 0,
      maxLevel: 6,
      applyEffect: (player: Player) => {
        if (player.frozenBulletCooldown === null) {
          player.frozenBulletCooldown = 15000; // 15 seconds initial
          player.nextFrozenBulletTime = Date.now() + player.frozenBulletCooldown;
          player.frozenBulletCount = 14; // Start with more bullets
        } else {
          player.frozenBulletCooldown = Math.max(7000, player.frozenBulletCooldown - 2000);
          player.frozenBulletCount += 2;
        }
      }
    },
    {
      id: 'targeting_system',
      name: 'Targeting System',
      description: 'Smart auto-fire every 8s. Each level: -1.2s cooldown, higher priority targets',
      icon: '🤖',
      level: 0,
      maxLevel: 6,
      applyEffect: (player: Player) => {
        if (player.autoFireCooldown === null) {
          player.autoFireCooldown = 8000; // 8 seconds initial
          player.nextAutoFireTime = Date.now() + player.autoFireCooldown;
          player.autoFireTargetId = null;
        } else {
          player.autoFireCooldown = Math.max(2500, player.autoFireCooldown - 1200);
        }
      }
    },
    {
      id: 'ricochet',
      name: 'Ricochet Mastery',
      description: 'Level 1: 35% bounce chance. Each level: +1 max bounce, +10% chance',
      icon: '↩️',
      level: 0,
      maxLevel: 4,
      applyEffect: (player: Player) => {
        if (player.level === 1) {
          player.bounceCount = 1;
          // Bounce chance is handled per projectile, but we track it here
        } else {
          player.bounceCount += 1;
        }
      }
    },
    {
      id: 'heavy_rounds',
      name: 'Heavy Rounds',
      description: 'Increases projectile size by 50% and damage by 10%',
      icon: '⚫',
      level: 0,
      maxLevel: 5,
      applyEffect: (player: Player) => {
        player.projectileSize *= 1.5;
        player.damageMultiplier += 0.1; // Bigger bullets deal more damage
      }
    },
    {
      id: 'scholar',
      name: 'Scholar\'s Focus',
      description: 'Level 1-2: +30% XP gain. Level 3+: +25% XP multiplier',
      icon: '📚',
      level: 0,
      maxLevel: 5,
      applyEffect: (player: Player) => {
        if (player.level <= 2) {
          player.experienceMultiplier += 0.3;
        } else {
          player.experienceMultiplier += 0.25;
        }
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

/**
 * Relic interfaces for the aura system
 */
export interface Relic {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  auraColor: string;
  applyEffect: (player: Player) => void;
  removeEffect?: (player: Player) => void; // Optional cleanup function
}

export interface RelicStar {
  id: number;
  x: number;
  y: number;
  word: string;
  relic: Relic;
  velocityX: number;
  velocityY: number;
  size: number;
  glowIntensity: number;
  pulsePhase: number;
  timeRemaining: number; // Time before the star disappears
  maxTime: number;
  trail: { x: number; y: number; opacity: number }[];
  // Typing highlight properties
  typedProgress: number; // Number of characters typed correctly (0-1 ratio)
}

/**
 * Generate all available relics for the star system
 */
export const generateRelics = (): Relic[] => {
  return [
    // Common Relics (45% chance)
    {
      id: 'iron_core',
      name: 'Iron Core',
      description: 'Increases base damage by 25%',
      icon: '⚙️',
      rarity: 'common',
      auraColor: '#8c7853',
      applyEffect: (player: Player) => {
        player.damage = Math.floor(player.damage * 1.25);
      }
    },
    {
      id: 'crystal_focus',
      name: 'Crystal Focus',
      description: 'Increases critical chance by 15%',
      icon: '💎',
      rarity: 'common',
      auraColor: '#66ccff',
      applyEffect: (player: Player) => {
        player.critChance += 0.15;
      }
    },
    {
      id: 'energy_cell',
      name: 'Energy Cell',
      description: 'Increases max shield by 50 and regen by 1',
      icon: '🔋',
      rarity: 'common',
      auraColor: '#00ff88',
      applyEffect: (player: Player) => {
        player.maxShield += 50;
        player.shield = Math.min(player.shield + 50, player.maxShield);
        player.shieldRegenRate += 1;
      }
    },
    {
      id: 'heavy_rounds',
      name: 'Heavy Rounds',
      description: 'Increases projectile size by 40% and damage by 15%',
      icon: '⚫',
      rarity: 'common',
      auraColor: '#ffaa00',
      applyEffect: (player: Player) => {
        player.projectileSize *= 1.4;
        player.damageMultiplier += 0.15;
      }
    },

    // Rare Relics (30% chance)
    {
      id: 'berserker_soul',
      name: 'Berserker Soul',
      description: 'Increases damage multiplier by 30%',
      icon: '👹',
      rarity: 'rare',
      auraColor: '#ff4444',
      applyEffect: (player: Player) => {
        player.damageMultiplier += 0.3;
      }
    },
    {
      id: 'mystic_sight',
      name: 'Mystic Sight',
      description: 'Critical hits deal 75% more damage',
      icon: '👁️',
      rarity: 'rare',
      auraColor: '#8844ff',
      applyEffect: (player: Player) => {
        player.critMultiplier += 0.75;
      }
    },
    {
      id: 'storm_generator',
      name: 'Storm Generator',
      description: 'Reduces all cooldowns by 25%',
      icon: '⛈️',
      rarity: 'rare',
      auraColor: '#44aaff',
      applyEffect: (player: Player) => {
        if (player.frozenBulletCooldown) {
          player.frozenBulletCooldown = Math.floor(player.frozenBulletCooldown * 0.75);
        }
        if (player.autoFireCooldown) {
          player.autoFireCooldown = Math.floor(player.autoFireCooldown * 0.75);
        }
      }
    },
    {
      id: 'echo_chamber',
      name: 'Echo Chamber',
      description: 'Increases multi-shot chance by 25%',
      icon: '🔊',
      rarity: 'rare',
      auraColor: '#ff8844',
      applyEffect: (player: Player) => {
        player.multiShotChance += 0.25;
      }
    },
    {
      id: 'time_distortion',
      name: 'Time Distortion',
      description: 'Slows all enemies by 30% permanently',
      icon: '🌀',
      rarity: 'rare',
      auraColor: '#9966ff',
      applyEffect: (player: Player) => {
        // This will be handled in the game engine to affect all enemies
        // We'll add a special property to track this effect
        if (!player.hasTimeDistortion) {
          player.hasTimeDistortion = true;
        }
      }
    },

    // Epic Relics (20% chance)
    {
      id: 'fusion_reactor',
      name: 'Fusion Reactor',
      description: 'Increases all damage by 50% and projectile size by 60%',
      icon: '⚛️',
      rarity: 'epic',
      auraColor: '#00ffff',
      applyEffect: (player: Player) => {
        player.damageMultiplier += 0.5;
        player.projectileSize *= 1.6;
      }
    },
    {
      id: 'quantum_processor',
      name: 'Quantum Processor',
      description: 'Doubles experience gain and reduces skill cooldowns by 40%',
      icon: '🧠',
      rarity: 'epic',
      auraColor: '#ff00ff',
      applyEffect: (player: Player) => {
        player.experienceMultiplier += 1.0;
        if (player.frozenBulletCooldown) {
          player.frozenBulletCooldown = Math.floor(player.frozenBulletCooldown * 0.6);
        }
        if (player.autoFireCooldown) {
          player.autoFireCooldown = Math.floor(player.autoFireCooldown * 0.6);
        }
      }
    },
    {
      id: 'titan_armor',
      name: 'Titan Armor',
      description: 'Triples max shield and doubles shield efficiency',
      icon: '🛡️',
      rarity: 'epic',
      auraColor: '#ffff00',
      applyEffect: (player: Player) => {
        const currentShield = player.shield;
        player.maxShield *= 3;
        player.shield = currentShield * 3;
        player.shieldEfficiency += 1.0;
      }
    },
    {
      id: 'nova_core',
      name: 'Nova Core',
      description: 'Doubles explosion radius and explosion damage',
      icon: '🌟',
      rarity: 'epic',
      auraColor: '#ff6600',
      applyEffect: (player: Player) => {
        if (player.aoeRadius > 0) {
          player.aoeRadius *= 2;
        } else {
          player.aoeRadius = 50; // Give base explosion radius if none
        }
        // Explosion damage will be handled in the explosion logic
        if (!player.hasNovaCore) {
          player.hasNovaCore = true;
        }
      }
    },

    // Legendary Relics (5% chance)
    {
      id: 'omnipotent_core',
      name: 'Omnipotent Core',
      description: 'Increases ALL stats by 100%. The ultimate power.',
      icon: '🌟',
      rarity: 'legendary',
      auraColor: '#ffffff',
      applyEffect: (player: Player) => {
        player.damageMultiplier += 1.0;
        player.shieldEfficiency += 1.0;
        player.experienceMultiplier += 1.0;
        player.critChance += 0.5;
        player.critMultiplier += 1.0;
        const currentShield = player.shield;
        player.maxShield *= 2;
        player.shield = currentShield * 2;
        player.multiShotChance += 0.5;
        player.projectileSize *= 2.0;
        if (player.frozenBulletCooldown) {
          player.frozenBulletCooldown = Math.floor(player.frozenBulletCooldown * 0.5);
        }
        if (player.autoFireCooldown) {
          player.autoFireCooldown = Math.floor(player.autoFireCooldown * 0.5);
        }
      }
    },
    {
      id: 'time_dilation',
      name: 'Time Dilation Field',
      description: 'Triples projectile size and damage, halves all cooldowns',
      icon: '⏰',
      rarity: 'legendary',
      auraColor: '#9966ff',
      applyEffect: (player: Player) => {
        // Instead of projectile speed (buggy), focus on size and damage
        player.projectileSize *= 3.0; // Triple projectile size
        player.damageMultiplier += 2.0; // +200% damage multiplier
        
        // Keep the cooldown reduction
        if (player.frozenBulletCooldown) {
          player.frozenBulletCooldown = Math.floor(player.frozenBulletCooldown * 0.5);
        }
        if (player.autoFireCooldown) {
          player.autoFireCooldown = Math.floor(player.autoFireCooldown * 0.5);
        }
      }
    }
  ];
};

/**
 * Get a random relic based on rarity weights
 */
export const getRandomRelic = (relics: Relic[]): Relic => {
  const random = Math.random();

  // Rarity chances: Common 45%, Rare 30%, Epic 20%, Legendary 5%
  let targetRarity: string;
  if (random < 0.45) {
    targetRarity = 'common';
  } else if (random < 0.75) {
    targetRarity = 'rare';
  } else if (random < 0.95) {
    targetRarity = 'epic';
  } else {
    targetRarity = 'legendary';
  }

  const relicsOfRarity = relics.filter(relic => relic.rarity === targetRarity);
  return relicsOfRarity[Math.floor(Math.random() * relicsOfRarity.length)];
};

/**
 * Create a relic star that flies across the screen
 */
export const createRelicStar = (
  id: number,
  relic: Relic,
  canvasWidth: number,
  canvasHeight: number
): RelicStar => {
  // Random spawn position and direction
  const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
  let x: number, y: number, velocityX: number, velocityY: number;

  const baseSpeed = 1.5;
  const speedVariation = 0.5;
  const speed = baseSpeed + (Math.random() * speedVariation);

  switch (side) {
    case 0: // top
      x = Math.random() * canvasWidth;
      y = -50;
      velocityX = (Math.random() - 0.5) * speed;
      velocityY = speed;
      break;
    case 1: // right
      x = canvasWidth + 50;
      y = Math.random() * canvasHeight;
      velocityX = -speed;
      velocityY = (Math.random() - 0.5) * speed;
      break;
    case 2: // bottom
      x = Math.random() * canvasWidth;
      y = canvasHeight + 50;
      velocityX = (Math.random() - 0.5) * speed;
      velocityY = -speed;
      break;
    default: // left
      x = -50;
      y = Math.random() * canvasHeight;
      velocityX = speed;
      velocityY = (Math.random() - 0.5) * speed;
      break;
  }

  // Determine star duration based on rarity
  let maxTime: number;
  switch (relic.rarity) {
    case 'common':
      maxTime = 15000; // 15 seconds
      break;
    case 'rare':
      maxTime = 12000; // 12 seconds
      break;
    case 'epic':
      maxTime = 9000; // 9 seconds
      break;
    case 'legendary':
      maxTime = 6000; // 6 seconds
      break;
    default:
      maxTime = 15000;
  }

  return {
    id,
    x,
    y,
    word: generateRelicWord(relic.rarity),
    relic,
    velocityX,
    velocityY,
    size: 18 + (relic.rarity === 'legendary' ? 12 : relic.rarity === 'epic' ? 8 : relic.rarity === 'rare' ? 4 : 0),
    glowIntensity: 1,
    pulsePhase: Math.random() * Math.PI * 2,
    timeRemaining: maxTime,
    maxTime,
    trail: [],
    typedProgress: 0,
  };
};

/**
 * Generate words for relic stars based on rarity
 */
const generateRelicWord = (rarity: string): string => {
  const words = {
    common: ['star', 'light', 'glow', 'shine', 'spark'],
    rare: ['comet', 'nebula', 'pulsar', 'quasar', 'cosmic'],
    epic: ['phoenix', 'dragon', 'storm', 'void', 'chaos'],
    legendary: ['infinity', 'eternity', 'omnipotent', 'transcend', 'divine']
  };

  const rarityWords = words[rarity as keyof typeof words] || words.common;
  return rarityWords[Math.floor(Math.random() * rarityWords.length)];
};