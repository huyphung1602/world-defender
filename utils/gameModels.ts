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
  // Enemy type system for special mechanics
  enemyType: 'normal' | 'blue' | 'purple';
  // Frozen effect properties
  isFrozen: boolean;
  frozenUntil: number | null;
  originalSpeed: number;
  // Burn effect properties
  isBurning: boolean;
  burnUntil: number | null;
  burnDamage: number;
  burnTickInterval: number;
  nextBurnTick: number | null;
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
  shield: number;
  maxShield: number;
  shieldRegenRate: number;
  xp: number;
  level: number;
  xpToNextLevel: number;
  autoFireInterval: number | null;
  multiShotTargets: number;
  bounceCount: number;  // Number of times bullets can bounce
  bounceRange: number;  // Range for bouncing shots
  purpleKillCount: number;
  // Kill-based skill tracking (replacing cooldown system)
  frostMasteryLevel: number;  // Level of frost mastery skill
  frostMasteryKills: number;  // Kills accumulated for frost skill
  frostMasteryKillsRequired: number;  // Kills needed to trigger frost skill
  fireMasteryLevel: number;  // Level of fire mastery skill
  fireMasteryKills: number;  // Kills accumulated for fire skill
  fireMasteryKillsRequired: number;  // Kills needed to trigger fire skill
  frozenBulletCount: number;  // Number of frozen bullets to fire
  autoFireCooldown: number | null;  // Cooldown for auto-fire (ms)
  nextAutoFireTime: number | null;  // Next time auto-fire will trigger
  autoFireTargetId: number | null;  // ID of the auto-fire target
  // Relic system properties
  relics: Relic[];  // Collected relics
  collectedRelicIds: string[];  // Track collected relic IDs to prevent duplicates
  damageMultiplier: number;  // Multiplier for all damage
  shieldEfficiency: number;  // Multiplier for shield effectiveness
  experienceMultiplier: number; // Multiplier for XP gained
  // Special relic effects
  hasTimeDistortion?: boolean; // Time Distortion relic effect
  hasNovaCore?: boolean; // Nova Core relic effect
  // Kinetic mastery tracking
  kineticMasteryLevel: number; // Track kinetic mastery level for damage calculation
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
  spawnSide: 'top' | 'right' | 'bottom' | 'left' = 'top',
  player?: Player // Add optional player parameter for skill-based spawn rates
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

  // Determine enemy type for special mechanics (only for normal enemies, not elites/bosses)
  let enemyType: 'normal' | 'blue' | 'purple' = 'normal';
  if (!isElite && !isBoss) {
    const typeRandom = Math.random();

    // Base spawn rates
    let baseBlueChance = 0.2; // Base 20% blue chance
    let basePurpleChance = 0.15; // Base 15% purple chance

    // Skill-based spawn rate improvements
    if (player) {
      // Each level of bouncing skill increases blue enemy spawn rate by 8%
      const bounceBonus = player.bounceCount * 0.08;
      baseBlueChance += bounceBonus;

      // Each level of multi-shot skill increases purple enemy spawn rate by 6%
      const multishotLevels = Math.max(0, player.multiShotTargets - 2); // Base is 2, so subtract 2
      const multishotBonus = multishotLevels * 0.06;
      basePurpleChance += multishotBonus;
    }

    // Add wave progression bonus (max +15% total for special enemies by wave 20)
    const waveBonus = Math.min(wave - 1, 20) * 0.0075; // 0.75% per wave, cap at wave 20

    const blueChance = baseBlueChance + waveBonus;
    const purpleChance = basePurpleChance + waveBonus;

    if (typeRandom < purpleChance) {
      enemyType = 'purple';
    } else if (typeRandom < purpleChance + blueChance) {
      enemyType = 'blue';
    }
    // Rest remain normal
  }

  // Determine color based on enemy type and health/toughness
  if (enemyType === 'blue') {
    color = '#4A90E2'; // Blue for bouncing enemies
  } else if (enemyType === 'purple') {
    color = '#8B5CF6'; // Purple for multi-shot enemies
  } else if (color === getRandomColor()) {
    // Only modify random colors for normal enemies, not special colors for bosses/elites
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
    enemyType,
    isFrozen: false,
    frozenUntil: null,
    originalSpeed: speed,
    isBurning: false,
    burnUntil: null,
    burnDamage: 0,
    burnTickInterval: 0,
    nextBurnTick: null,
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
    projectileSpeed: 1,
    attackSpeed: 1,
    projectileSize: 4,
    aoeRadius: 0,
    shield: 160,
    maxShield: 160,
    shieldRegenRate: 3,
    xp: 0,
    level: 1,
    xpToNextLevel: 100,
    autoFireInterval: null,
    multiShotTargets: 2,
    bounceCount: 1,
    bounceRange: 120,
    purpleKillCount: 0,
    frostMasteryLevel: 0,
    frostMasteryKills: 0,
    frostMasteryKillsRequired: 0,
    fireMasteryLevel: 0,
    fireMasteryKills: 0,
    fireMasteryKillsRequired: 0,
    frozenBulletCount: 0,
    autoFireCooldown: null,
    nextAutoFireTime: null,
    autoFireTargetId: null,
    relics: [],
    collectedRelicIds: [],
    damageMultiplier: 1,
    shieldEfficiency: 1,
    experienceMultiplier: 1,
    kineticMasteryLevel: 0,
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
      description: 'Increases multi-shot targets. Each level: +1 target (max 5 targets)',
      icon: '🔱',
      level: 0,
      maxLevel: 5,
      applyEffect: (player: Player) => {
        player.multiShotTargets = Math.min(player.multiShotTargets + 1, 5);
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
      id: 'velocity',
      name: 'Kinetic Mastery',
      description: 'Faster bullets hit harder! Level 1: +50% speed, +15% damage. Each level: +25% speed, +10% damage',
      icon: '⚡',
      level: 0,
      maxLevel: 6,
      applyEffect: (player: Player) => {
        player.kineticMasteryLevel += 1; // Track the skill level

        if (player.kineticMasteryLevel === 1) {
          // First level - significant initial boost
          player.projectileSpeed += 0.5; // 50% speed increase (base is 1.0)
          player.damageMultiplier += 0.15; // 15% damage increase
        } else {
          // Subsequent levels - smaller speed increases but more damage
          player.projectileSpeed += 0.25; // 25% speed increase per level
          player.damageMultiplier += 0.1; // 10% damage increase per level
        }
      }
    },
    {
      id: 'frost_mastery',
      name: 'Arctic Barrage',
      description: 'Ice arrows after 20 kills. Level 1: 8 arrows. Each level: -5 kills needed, +2 arrows',
      icon: '🏹',
      level: 0,
      maxLevel: 6,
      applyEffect: (player: Player) => {
        if (player.frostMasteryLevel === 0) {
          // First level - initialize frost system
          player.frostMasteryLevel = 1;
          player.frostMasteryKillsRequired = 20;
          player.frozenBulletCount = 8;
          player.frostMasteryKills = 0;
        } else {
          // Subsequent levels - reduce kills required and increase bullet count
          player.frostMasteryLevel++;
          player.frostMasteryKillsRequired = Math.max(5, player.frostMasteryKillsRequired - 5);
          player.frozenBulletCount += 2;
        }
      }
    },
    {
      id: 'fire_mastery',
      name: 'Meteor Storm',
      description: 'Fire meteors after 50 kills. Level 1: 30% burn chance. Each level: -5 kills needed, +burn damage',
      icon: '☄️',
      level: 0,
      maxLevel: 6,
      applyEffect: (player: Player) => {
        if (player.fireMasteryLevel === 0) {
          // First level - initialize fire system
          player.fireMasteryLevel = 1;
          player.fireMasteryKillsRequired = 50;
          player.fireMasteryKills = 0;
        } else {
          // Subsequent levels - reduce kills required
          player.fireMasteryLevel++;
          player.fireMasteryKillsRequired = Math.max(35, player.fireMasteryKillsRequired - 5);
        }
      }
    },
    {
      id: 'ricochet',
      name: 'Ricochet Mastery',
      description: 'Each level: +1 max bounce, +20 range (starts with 1 bounce, 120 range)',
      icon: '↩️',
      level: 0,
      maxLevel: 4,
      applyEffect: (player: Player) => {
        // Always increase both bounce count and range since player starts with 1 bounce
        player.bounceCount += 1;
        player.bounceRange += 20;
      }
    },
    {
      id: 'heavy_rounds',
      name: 'Heavy Rounds',
      description: 'Increases projectile size by 40% and damage by 15%',
      icon: '⚫',
      level: 0,
      maxLevel: 5,
      applyEffect: (player: Player) => {
        // Better stacking: use percentage of current size with diminishing returns
        const currentSize = player.projectileSize;
        const baseIncrease = 0.4; // 40% increase
        const sizeRatio = currentSize / 4; // 4 is base size
        const diminishingFactor = 1 / (1 + sizeRatio * 0.3); // Diminishing returns
        const actualIncrease = baseIncrease * diminishingFactor;
        player.projectileSize = Math.min(player.projectileSize * (1 + actualIncrease), 20); // Hard cap at 20
        player.damageMultiplier += 0.15;
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
    // Common Relics (45% chance) - Focus on single stat improvements
    {
      id: 'hermes_sandals',
      name: 'Hermes\' Sandals',
      description: 'Increases projectile speed by 50%',
      icon: '👟',
      rarity: 'common',
      auraColor: '#ffb366',
      applyEffect: (player: Player) => {
        player.projectileSpeed += 1;
      }
    },
    {
      id: 'apollo_bow',
      name: 'Apollo\'s Bow',
      description: 'Increases critical chance by 20%',
      icon: '🏹',
      rarity: 'common',
      auraColor: '#ffd700',
      applyEffect: (player: Player) => {
        player.critChance += 0.2;
      }
    },
    {
      id: 'aegis_fragment',
      name: 'Aegis Fragment',
      description: 'Increases shield capacity by 75 and regeneration by 2/s',
      icon: '🛡️',
      rarity: 'common',
      auraColor: '#4a90e2',
      applyEffect: (player: Player) => {
        const currentShield = player.shield;
        const shieldIncrease = 75;
        player.maxShield += shieldIncrease;
        player.shield = Math.min(currentShield + shieldIncrease, player.maxShield);
        player.shieldRegenRate += 2;
      }
    },
    {
      id: 'prometheus_flame',
      name: 'Prometheus\' Flame',
      description: 'Increases base damage by 30%',
      icon: '🔥',
      rarity: 'common',
      auraColor: '#ff6b47',
      applyEffect: (player: Player) => {
        player.damage = Math.floor(player.damage * 1.3);
      }
    },
    {
      id: 'athena_wisdom',
      name: 'Athena\'s Wisdom',
      description: 'Increases experience gain by 40%',
      icon: '🦉',
      rarity: 'common',
      auraColor: '#9b59b6',
      applyEffect: (player: Player) => {
        player.experienceMultiplier += 0.4;
      }
    },

    // Rare Relics (30% chance) - Focus on specific playstyles
    {
      id: 'ares_gauntlets',
      name: 'Ares\' Gauntlets',
      description: 'Critical hits deal 100% more damage',
      icon: '👊',
      rarity: 'rare',
      auraColor: '#e74c3c',
      applyEffect: (player: Player) => {
        player.critMultiplier += 1.0;
      }
    },
    {
      id: 'artemis_quiver',
      name: 'Artemis\' Quiver',
      description: 'Adds 2 targets to multi-shot attacks',
      icon: '🏹',
      rarity: 'rare',
      auraColor: '#27ae60',
      applyEffect: (player: Player) => {
        player.multiShotTargets += 2;
      }
    },
    {
      id: 'hades_chains',
      name: 'Hades\' Chains',
      description: 'Projectiles can hit 2 additional enemies before dissipating',
      icon: '⛓️',
      rarity: 'rare',
      auraColor: '#2c3e50',
      applyEffect: (player: Player) => {
        // This will be handled in the projectile durability system
        // Add 50 durability which equals roughly 2 more hits
        // We'll modify the durability calculation
      }
    },
    {
      id: 'hermes_caduceus',
      name: 'Hermes\' Caduceus',
      description: 'Reduces skill trigger requirements by 30%',
      icon: '🕊️',
      rarity: 'rare',
      auraColor: '#3498db',
      applyEffect: (player: Player) => {
        // Reduce kill requirements for frost and fire skills
        if (player.frostMasteryKillsRequired > 0) {
          player.frostMasteryKillsRequired = Math.max(3, Math.floor(player.frostMasteryKillsRequired * 0.7));
        }
        if (player.fireMasteryKillsRequired > 0) {
          player.fireMasteryKillsRequired = Math.max(35, Math.floor(player.fireMasteryKillsRequired * 0.7));
        }
      }
    },
    {
      id: 'chronos_hourglass',
      name: 'Chronos\' Hourglass',
      description: 'Slows all enemies by 25% permanently',
      icon: '⏳',
      rarity: 'rare',
      auraColor: '#f39c12',
      applyEffect: (player: Player) => {
        if (!player.hasTimeDistortion) {
          player.hasTimeDistortion = true;
        }
      }
    },

    // Epic Relics (20% chance) - Focus on powerful combinations
    {
      id: 'poseidon_trident',
      name: 'Poseidon\'s Trident',
      description: 'Bouncing shots gain +1 bounce and +100 range (requires ricochet skill)',
      icon: '🔱',
      rarity: 'epic',
      auraColor: '#1abc9c',
      applyEffect: (player: Player) => {
        player.bounceCount += 1;
        player.bounceRange += 100;
      }
    },
    {
      id: 'hephaestus_forge',
      name: 'Hephaestus\' Forge',
      description: 'Projectiles deal 50% more damage and size increases by 60%',
      icon: '🔨',
      rarity: 'epic',
      auraColor: '#e67e22',
      applyEffect: (player: Player) => {
        player.damageMultiplier += 0.5;
        const currentSize = player.projectileSize;
        const sizeRatio = currentSize / 4;
        const diminishingFactor = 1 / (1 + sizeRatio * 0.2);
        const actualIncrease = 0.6 * diminishingFactor;
        player.projectileSize = Math.min(player.projectileSize * (1 + actualIncrease), 20);
      }
    },
    {
      id: 'demeter_harvest',
      name: 'Demeter\'s Harvest',
      description: 'Triple experience gain and double shield efficiency',
      icon: '🌾',
      rarity: 'epic',
      auraColor: '#2ecc71',
      applyEffect: (player: Player) => {
        player.experienceMultiplier += 2.0; // +200% = triple
        player.shieldEfficiency += 1.0; // +100% = double
      }
    },
    {
      id: 'dionysus_chalice',
      name: 'Dionysus\' Chalice',
      description: 'Explosions deal 100% more damage and have 50% larger radius',
      icon: '🍷',
      rarity: 'epic',
      auraColor: '#9b59b6',
      applyEffect: (player: Player) => {
        if (player.aoeRadius > 0) {
          player.aoeRadius *= 1.5;
        } else {
          player.aoeRadius = 40; // Give base explosion radius if none
        }
        if (!player.hasNovaCore) {
          player.hasNovaCore = true;
        }
      }
    },

    // Legendary Relics (5% chance) - Game-changing effects
    {
      id: 'zeus_thunderbolt',
      name: 'Zeus\' Thunderbolt',
      description: 'All shots become critical hits with +200% damage',
      icon: '⚡',
      rarity: 'legendary',
      auraColor: '#f1c40f',
      applyEffect: (player: Player) => {
        player.critChance = 1.0; // 100% crit chance
        player.critMultiplier += 2.0; // +200% crit damage
      }
    },
    {
      id: 'pandora_box',
      name: 'Pandora\'s Box',
      description: 'Chaos incarnate: Massive boost to ALL stats',
      icon: '📦',
      rarity: 'legendary',
      auraColor: '#8e44ad',
      applyEffect: (player: Player) => {
        // More balanced legendary effect
        player.damageMultiplier += 0.75;
        player.critChance += 0.3;
        player.critMultiplier += 0.5;
        player.multiShotTargets += 2;
        player.bounceCount += 2;
        player.bounceRange += 75;
        const currentShield = player.shield;
        player.maxShield = Math.floor(player.maxShield * 1.5);
        player.shield = Math.floor(currentShield * 1.5);
        player.experienceMultiplier += 0.5;
        // Moderate size increase
        const currentSize = player.projectileSize;
        const sizeRatio = currentSize / 4;
        const diminishingFactor = 1 / (1 + sizeRatio * 0.15);
        const actualIncrease = 0.5 * diminishingFactor;
        player.projectileSize = Math.min(player.projectileSize * (1 + actualIncrease), 20);
      }
    }
  ];
};

/**
 * Get a random relic based on rarity weights, excluding already collected relics
 */
export const getRandomRelic = (relics: Relic[], collectedRelicIds: string[] = []): Relic | null => {
  // Filter out already collected relics
  const availableRelics = relics.filter(relic => !collectedRelicIds.includes(relic.id));

  if (availableRelics.length === 0) {
    return null; // No more relics available
  }

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

  const relicsOfRarity = availableRelics.filter(relic => relic.rarity === targetRarity);

  if (relicsOfRarity.length === 0) {
    // If no relics of target rarity are available, pick from any available relic
    const fallbackRelic = availableRelics[Math.floor(Math.random() * availableRelics.length)];
    return fallbackRelic;
  }

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
 * Generate words for relic stars based on rarity using Greek god names
 */
const generateRelicWord = (rarity: string): string => {
  const words = {
    common: ['hermes', 'apollo', 'athena', 'hestia', 'demeter'],
    rare: ['artemis', 'ares', 'hades', 'chronos', 'hecate'],
    epic: ['poseidon', 'hephaestus', 'dionysus', 'persephone', 'aphrodite'],
    legendary: ['zeus', 'hera', 'titans', 'olympus', 'pandora']
  };

  const rarityWords = words[rarity as keyof typeof words] || words.common;
  return rarityWords[Math.floor(Math.random() * rarityWords.length)];
};