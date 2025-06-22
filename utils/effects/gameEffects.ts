/**
 * Game visual effects
 * Contains functions for creating and managing visual effects like explosions, projectiles, etc.
 */
import type { Enemy } from '../gameModels';

/**
 * Interface for a projectile
 */
export interface Projectile {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  size: number;
  damage: number;
  isCritical: boolean;
  aoeRadius: number;
  hasHit: boolean;
  targetEnemyId: number;
  isMultiShot: boolean;
  isDoubleShot: boolean;  // Repurposed to indicate frozen bullets
  isFrozenBullet: boolean;  // Explicit flag for frozen bullets
  bouncesLeft: number;  // Number of bounces remaining
  hitEnemyIds: number[];  // IDs of enemies already hit
  lastBounceX: number | null; // Last bounce X position (for trail rendering)
  lastBounceY: number | null; // Last bounce Y position (for trail rendering)
  isMainShot: boolean; // True for main shots (from user typing), false for auto-fire/multi-shot/bounce
  // New projectile type system
  projectileType: 'normal' | 'bouncing' | 'multishot' | 'ice' | 'fire';
  // Durability system for bigger bullets
  durability: number;
  maxDurability: number;
}

/**
 * Interface for an explosion
 */
export interface Explosion {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  progress: number;
  color: string;
  particles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
  }[];
}

/**
 * Interface for damage number floating text
 */
export interface DamageNumber {
  x: number;
  y: number;
  value: number;
  color: string;
  progress: number;
  isCritical: boolean;
  text?: string; // Optional text to display instead of value
  initialY: number;
  velocity: number;
  alpha: number;
}

/**
 * Interface for a star in the background
 */
export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

/**
 * Interface for the background gradient
 */
export interface BackgroundGradient {
  colors: string[];
  positions: number[];
  currentIndex: number;
  transitionProgress: number;
}

/**
 * Create an explosion effect
 */
export const createExplosion = (
  x: number,
  y: number,
  color: string,
  radius: number = 30,
  damage: number = 0,
  enemies: Enemy[] = [],
  onDamageEnemy: (enemy: Enemy, damage: number, isCritical: boolean) => void,
  player?: any // Optional player parameter to check for Nova Core
): Explosion => {
  const particleCount = 8;
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

  // Apply damage to nearby enemies if this explosion deals damage
  if (damage > 0 && enemies.length > 0) {
    // Apply Nova Core effect if player has it
    let actualExplosionDamage = damage;
    if (player && player.hasNovaCore) {
      actualExplosionDamage *= 2; // Double explosion damage
    }

    for (const enemy of enemies) {
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= radius) {
        // Calculate damage with distance falloff
        const damageMultiplier = 1 - (distance / radius);
        const finalDamage = actualExplosionDamage * damageMultiplier;

        onDamageEnemy(enemy, finalDamage, false);
      }
    }
  }

  return {
    x,
    y,
    radius,
    maxRadius: radius * 3,
    progress: 0,
    color,
    particles
  };
};

/**
 * Create a damage number
 */
export const createDamageNumber = (
  x: number,
  y: number,
  value: number,
  color: string,
  isCritical: boolean = false,
  text: string = ''
): DamageNumber => {
  return {
    x,
    y,
    value: Math.round(value), // Ensure damage is always an integer
    color,
    isCritical,
    text,
    progress: 0,
    initialY: y,
    velocity: -2,
    alpha: 1
  };
};

/**
 * Create a projectile
 */
export const createProjectile = (
  fromX: number,
  fromY: number,
  targetX: number,
  targetY: number,
  damage: number,
  speed: number,
  size: number,
  isCritical: boolean = false,
  aoeRadius: number = 0,
  targetEnemyId: number,
  isMultiShot: boolean = false,
  isFrozenBullet: boolean = false,
  bouncesLeft: number = 0,
  isMainShot: boolean = false,
  projectileType: 'normal' | 'bouncing' | 'multishot' | 'ice' | 'fire' = 'normal',
  player?: any // Player reference for relic effects
): Projectile => {
  // Reduce size for bouncing projectiles to make them less overwhelming
  let adjustedSize = size;
  if (projectileType === 'bouncing') {
    adjustedSize = size * 0.7; // 30% smaller for bouncing shots
  }

  // Calculate base durability - bigger bullets can hit more enemies
  const baseDurability = 100;
  let sizeDurability = baseDurability * Math.max(1, adjustedSize / 4);

  // Apply kinetic mastery durability bonus - faster bullets pierce more enemies
  if (player && player.kineticMasteryLevel) {
    const kineticDurabilityBonus = 25 + (player.kineticMasteryLevel - 1) * 20; // 25 base + 20 per additional level
    sizeDurability += kineticDurabilityBonus;
  }

  // Check for Hades' Chains relic effect (add 50 durability for 2 more hits)
  if (player && player.relics.some((relic: any) => relic.id === 'hades_chains')) {
    sizeDurability += 50; // Add durability for 2 more hits
  }

  return {
    x: fromX,
    y: fromY,
    targetX,
    targetY,
    progress: 0,
    speed,
    size: adjustedSize,
    damage,
    isCritical,
    aoeRadius,
    hasHit: false,
    targetEnemyId,
    isMultiShot,
    isDoubleShot: isFrozenBullet,
    isFrozenBullet,
    bouncesLeft,
    hitEnemyIds: [],
    lastBounceX: null,
    lastBounceY: null,
    isMainShot,
    projectileType,
    durability: sizeDurability,
    maxDurability: sizeDurability
  };
};

/**
 * Initialize stars for the background
 */
export const initializeStars = (count: number, canvasWidth: number, canvasHeight: number): Star[] => {
  const stars: Star[] = [];

  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 15 + 5,
      opacity: Math.random() * 0.8 + 0.2
    });
  }

  return stars;
};

/**
 * Initialize background gradient
 */
export const initializeBackgroundGradient = (): BackgroundGradient => {
  return {
    colors: ['#0f2027', '#203a43', '#2c5364', '#24243e', '#302b63', '#0f0c29'],
    positions: [0, 0.3, 0.6, 0.8, 0.9, 1],
    currentIndex: 0,
    transitionProgress: 0
  };
};

/**
 * Update explosions based on delta time
 */
export const updateExplosions = (explosions: Explosion[], deltaTime: number): void => {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const explosion = explosions[i];
    explosion.progress += deltaTime * 2; // Control explosion speed

    if (explosion.progress >= 1) {
      explosions.splice(i, 1);
    } else {
      // Update particles - only update particles that are still visible
      for (let j = explosion.particles.length - 1; j >= 0; j--) {
        const particle = explosion.particles[j];
        particle.x += particle.vx * deltaTime * 60;
        particle.y += particle.vy * deltaTime * 60;
        particle.size *= 0.95; // Shrink particles over time

        // Remove particles that are too small or far from explosion center
        if (particle.size < 0.5 ||
            Math.abs(particle.x - explosion.x) > explosion.maxRadius * 2 ||
            Math.abs(particle.y - explosion.y) > explosion.maxRadius * 2) {
          explosion.particles.splice(j, 1);
        }
      }
    }
  }
};

/**
 * Update damage numbers based on delta time
 */
export const updateDamageNumbers = (damageNumbers: DamageNumber[], deltaTime: number): void => {
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    const damageNumber = damageNumbers[i];
    damageNumber.progress += deltaTime * 1.5;
    damageNumber.y -= deltaTime * 40; // Float upward

    // Early removal if damage number is far off-screen
    if (damageNumber.progress >= 1 || damageNumber.y < -100) {
      damageNumbers.splice(i, 1);
    }
  }
};

/**
 * Update projectiles based on delta time
 */
export const updateProjectiles = (
  projectiles: Projectile[],
  deltaTime: number,
  enemies: any[], // Using any to avoid circular dependencies
  onHitEnemy: (enemyId: number, damage: number, isCritical: boolean, isMultiShot: boolean, isDoubleShot: boolean, isMainShot: boolean, projectileType?: 'normal' | 'bouncing' | 'multishot' | 'ice' | 'fire') => void,
  onCreateExplosion: (x: number, y: number, color: string, radius: number, damage: number) => void,
  player?: any // Add player parameter to access bounceRange
): void => {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i];

    // Skip if already hit and no bounces left
    if (projectile.hasHit && projectile.bouncesLeft <= 0) {
      projectiles.splice(i, 1);
      continue;
    }

    // For bouncing projectiles, continuously update target position to track moving enemies
    if (projectile.projectileType === 'bouncing' && !projectile.hasHit) {
      const targetEnemy = enemies.find(e => e.id === projectile.targetEnemyId);
      if (targetEnemy) {
        // Update target coordinates to the enemy's current position
        projectile.targetX = targetEnemy.x;
        projectile.targetY = targetEnemy.y;
      }
    }

    // Store previous position for collision detection
    const prevX = projectile.x;
    const prevY = projectile.y;

    // Calculate movement for this frame
    const speedMultiplier = projectile.speed * deltaTime;
    const oldProgress = projectile.progress;

    // Update progress more carefully to prevent overshooting
    projectile.progress = Math.min(1, projectile.progress + speedMultiplier);

    // Calculate new position using proper linear interpolation
    const totalDx = projectile.targetX - (prevX - (projectile.targetX - prevX) * oldProgress / (1 - oldProgress || 0.001));
    const totalDy = projectile.targetY - (prevY - (projectile.targetY - prevY) * oldProgress / (1 - oldProgress || 0.001));

    const newX = prevX + totalDx * speedMultiplier;
    const newY = prevY + totalDy * speedMultiplier;

    // Check for collision along the movement path BEFORE updating position
    if (!projectile.hasHit && enemies.length > 0) {
      let closestEnemy = null;
      let closestDistance = Infinity;
      let hitTime = 1; // When during the movement the hit occurs (0-1)

      for (const enemy of enemies) {
        // Skip enemies we've already hit with this projectile
        if (projectile.hitEnemyIds.includes(enemy.id)) {
          continue;
        }

        // Calculate collision along the movement path
        const moveDx = newX - prevX;
        const moveDy = newY - prevY;
        const moveLength = Math.sqrt(moveDx * moveDx + moveDy * moveDy);

        if (moveLength < 0.1) {
          // Very small movement, just check current position
          const currentDx = prevX - enemy.x;
          const currentDy = prevY - enemy.y;
          const currentDistance = Math.sqrt(currentDx * currentDx + currentDy * currentDy);

          if (currentDistance <= enemy.radius + projectile.size) {
            if (currentDistance < closestDistance) {
              closestDistance = currentDistance;
              closestEnemy = enemy;
              hitTime = 0;
            }
          }
        } else {
          // Check for collision along the movement line
          // Vector from previous position to enemy
          const toEnemyX = enemy.x - prevX;
          const toEnemyY = enemy.y - prevY;

          // Project enemy position onto movement vector
          const projectionLength = (toEnemyX * moveDx + toEnemyY * moveDy) / moveLength;
          const t = Math.max(0, Math.min(1, projectionLength / moveLength));

          // Find closest point on movement path to enemy
          const closestX = prevX + moveDx * t;
          const closestY = prevY + moveDy * t;

          // Distance from enemy to closest point on path
          const distanceToPath = Math.sqrt(
            Math.pow(enemy.x - closestX, 2) + Math.pow(enemy.y - closestY, 2)
          );

          // Check if collision occurs
          if (distanceToPath <= enemy.radius + projectile.size) {
            // Calculate actual hit time along the path
            const hitDistance = Math.sqrt(Math.pow(closestX - prevX, 2) + Math.pow(closestY - prevY, 2));
            const actualHitTime = moveLength > 0 ? hitDistance / moveLength : 0;

            if (distanceToPath < closestDistance) {
              closestDistance = distanceToPath;
              closestEnemy = enemy;
              hitTime = actualHitTime;
            }
          }
        }
      }

      // If we found a collision, handle it
      if (closestEnemy) {
        // Update position to the collision point
        projectile.x = prevX + (newX - prevX) * hitTime;
        projectile.y = prevY + (newY - prevY) * hitTime;

        // Add this enemy to the list of hit enemies
        projectile.hitEnemyIds.push(closestEnemy.id);

        // Apply damage to enemy
        onHitEnemy(
          closestEnemy.id,
          projectile.damage,
          projectile.isCritical,
          projectile.isMultiShot,
          projectile.isDoubleShot,
          projectile.isMainShot,
          projectile.projectileType
        );

        // Reduce durability based on hit
        projectile.durability -= 25; // Each hit reduces durability

        // Create AOE explosion if needed
        if (projectile.aoeRadius > 0) {
          // Create visual explosion for AOE
          onCreateExplosion(
            closestEnemy.x,
            closestEnemy.y,
            '#2ecc71',
            projectile.aoeRadius,
            projectile.damage * 0.5
          );

          // Apply AOE damage to nearby enemies
          createAOEExplosion(
            closestEnemy.x,
            closestEnemy.y,
            projectile.aoeRadius,
            projectile.damage * 0.5,
            enemies,
            (enemyId, damage, isCritical) => {
              // Skip the primary target (already damaged)
              if (enemyId !== closestEnemy.id) {
                onHitEnemy(enemyId, damage, isCritical, false, false, false, undefined);
              }
            }
          );
        }

        // Check durability - if still has durability, continue to next enemy
        if (projectile.durability > 0) {
          // Don't mark as hit yet, continue to hit more enemies
          projectile.hasHit = false;
        } else {
          // Mark as hit when durability is depleted
          projectile.hasHit = true;
        }

        // Handle bouncing for bouncing projectiles
        if (projectile.projectileType === 'bouncing' && projectile.bouncesLeft > 0) {
          // Find enemies within bouncing range for enemy-to-enemy bouncing
          const bounceRange = player?.bounceRange || 120;
          const nearbyEnemies = enemies.filter((e) =>
            e.id !== closestEnemy.id && // Don't bounce to the same enemy
            Math.sqrt((e.x - closestEnemy.x) ** 2 + (e.y - closestEnemy.y) ** 2) <= bounceRange
          );

          if (nearbyEnemies.length > 0) {
            // Find the closest enemy within bounce range
            const nextTarget = nearbyEnemies.sort((a, b) => {
              const distA = Math.sqrt(Math.pow(a.x - closestEnemy.x, 2) + Math.pow(a.y - closestEnemy.y, 2));
              const distB = Math.sqrt(Math.pow(b.x - closestEnemy.x, 2) + Math.pow(b.y - closestEnemy.y, 2));
              return distA - distB;
            })[0];

            // Save the bounce position for trail rendering
            projectile.lastBounceX = projectile.x;
            projectile.lastBounceY = projectile.y;

            // Reset projectile for bounce with current position as start
            projectile.hasHit = false;
            projectile.progress = 0;
            projectile.targetX = nextTarget.x;
            projectile.targetY = nextTarget.y;
            projectile.targetEnemyId = nextTarget.id;
            projectile.damage = Math.floor(projectile.damage * 0.8); // Reduce damage for bounces
            projectile.bouncesLeft--;

            // Bounced bullets are no longer main shots to prevent changing enemy words during typing
            projectile.isMainShot = false;

            // Create a visual effect for the bounce
            onCreateExplosion(
              projectile.x,
              projectile.y,
              '#4A90E2',
              15,
              0
            );
          } else {
            // No targets in range, mark as hit
            projectile.hasHit = true;
            projectile.bouncesLeft = 0;
          }
        }
      } else {
        // No collision, update to new position
        projectile.x = newX;
        projectile.y = newY;
      }
    } else {
      // No collision check needed, just update position
      projectile.x = newX;
      projectile.y = newY;
    }

    // Remove projectile if it reached its target or went beyond
    if (projectile.progress >= 1) {
      if (projectile.bouncesLeft > 0 && !projectile.hasHit) {
        // Try to find a new target for the bounce at the current position
        const bounceRange = player?.bounceRange || 120;
        const potentialTargets = enemies.filter(e =>
          !projectile.hitEnemyIds.includes(e.id) &&
          Math.sqrt((e.x - projectile.x) ** 2 + (e.y - projectile.y) ** 2) <= bounceRange
        );

        if (potentialTargets.length > 0) {
          // Find the closest enemy within bounce range
          const nextTarget = potentialTargets.sort((a, b) => {
            const distA = Math.sqrt(Math.pow(a.x - projectile.x, 2) + Math.pow(a.y - projectile.y, 2));
            const distB = Math.sqrt(Math.pow(b.x - projectile.x, 2) + Math.pow(b.y - projectile.y, 2));
            return distA - distB;
          })[0];

          // Save the bounce position for trail rendering
          projectile.lastBounceX = projectile.x;
          projectile.lastBounceY = projectile.y;

          // Reset projectile for bounce
          projectile.hasHit = false;
          projectile.progress = 0;
          projectile.targetX = nextTarget.x;
          projectile.targetY = nextTarget.y;
          projectile.targetEnemyId = nextTarget.id;
          projectile.damage = Math.floor(projectile.damage * 0.8); // Reduce damage for bounces
          projectile.bouncesLeft--;

          // Bounced bullets are no longer main shots
          projectile.isMainShot = false;

          // Create a visual effect for the bounce
          onCreateExplosion(
            projectile.x,
            projectile.y,
            '#4A90E2',
            15,
            0
          );
        } else {
          projectiles.splice(i, 1);
        }
      } else {
        projectiles.splice(i, 1);
      }
    }
  }
};

/**
 * Create an AOE explosion effect when a projectile hits an enemy
 */
export const createAOEExplosion = (
  x: number,
  y: number,
  radius: number,
  damage: number,
  enemies: any[], // Using any to avoid circular dependencies
  onHitEnemy: (enemyId: number, damage: number, isCritical: boolean) => void
): void => {
  // Find all enemies within the AOE radius
  for (const enemy of enemies) {
    // Calculate distance between explosion center and enemy
    const dx = x - enemy.x;
    const dy = y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if enemy is within AOE radius
    if (distance <= radius + enemy.radius) {
      // Apply damage to enemy - damage falls off with distance
      const damageMultiplier = 1 - (distance / (radius + enemy.radius));
      const actualDamage = damage * Math.max(0.2, damageMultiplier); // Minimum 20% damage

      // Apply damage to enemy
      onHitEnemy(enemy.id, actualDamage, false);
    }
  }
};