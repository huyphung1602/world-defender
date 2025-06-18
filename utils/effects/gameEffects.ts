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
  bounceChance: number; // Chance to bounce (0-1)
  isMainShot: boolean; // True for main shots (from user typing), false for auto-fire/multi-shot/bounce
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
  onDamageEnemy: (enemy: Enemy, damage: number, isCritical: boolean) => void
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
    for (const enemy of enemies) {
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= radius) {
        // Calculate damage with distance falloff
        const damageMultiplier = 1 - (distance / radius);
        const actualDamage = damage * damageMultiplier;

        onDamageEnemy(enemy, actualDamage, false);
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
 * Create a damage number floating text
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
    value,
    color,
    progress: 0,
    isCritical,
    text
  };
};

/**
 * Create a projectile
 */
export const createProjectile = (
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  damage: number,
  speed: number,
  size: number,
  isCritical: boolean,
  aoeRadius: number,
  targetEnemyId: number,
  isMultiShot: boolean = false,
  isDoubleShot: boolean = false,
  bouncesLeft: number = 0,
  bounceChance: number = 0.25, // Default 25% chance to bounce
  isMainShot: boolean = false // Default false for backward compatibility
): Projectile => {
  return {
    x: startX,
    y: startY,
    targetX,
    targetY,
    progress: 0,
    speed,
    size,
    damage,
    isCritical,
    aoeRadius,
    hasHit: false,
    targetEnemyId,
    isMultiShot,
    isDoubleShot,
    isFrozenBullet: isDoubleShot, // Set frozen bullet flag based on isDoubleShot (for backward compatibility)
    bouncesLeft,
    hitEnemyIds: [],
    lastBounceX: null,
    lastBounceY: null,
    bounceChance,
    isMainShot
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
  onHitEnemy: (enemyId: number, damage: number, isCritical: boolean, isMultiShot: boolean, isDoubleShot: boolean, isMainShot: boolean) => void,
  onCreateExplosion: (x: number, y: number, color: string, radius: number, damage: number) => void
): void => {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i];
    
    // Skip if already hit and no bounces left
    if (projectile.hasHit && projectile.bouncesLeft <= 0) {
      projectiles.splice(i, 1);
      continue;
    }
    
    // Update progress
    const oldProgress = projectile.progress;
    projectile.progress += projectile.speed * deltaTime;
    
    // Calculate previous and current position
    const prevX = projectile.x;
    const prevY = projectile.y;
    
    // Update position
    projectile.x = projectile.x + (projectile.targetX - projectile.x) * (projectile.progress - oldProgress) / (1 - oldProgress);
    projectile.y = projectile.y + (projectile.targetY - projectile.y) * (projectile.progress - oldProgress) / (1 - oldProgress);
    
    // Check for collision with enemies
    if (!projectile.hasHit && enemies.length > 0) {
      // Find the enemy closest to the player along the projectile's path
      let closestEnemy = null;
      let closestDistance = Infinity;
      
      for (const enemy of enemies) {
        // Skip enemies we've already hit with this projectile
        if (projectile.hitEnemyIds.includes(enemy.id)) {
          continue;
        }
        
        // Calculate distance between projectile and enemy
        const dx = projectile.x - enemy.x;
        const dy = projectile.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if projectile hit enemy hitbox
        if (distance <= enemy.radius + projectile.size) {
          // Calculate distance from player to enemy (to find the closest one)
          const playerToEnemyDx = enemy.x - (projectile.x - (projectile.targetX - projectile.x) * projectile.progress);
          const playerToEnemyDy = enemy.y - (projectile.y - (projectile.targetY - projectile.y) * projectile.progress);
          const playerToEnemyDistance = Math.sqrt(playerToEnemyDx * playerToEnemyDx + playerToEnemyDy * playerToEnemyDy);
          
          // Keep track of the closest enemy
          if (playerToEnemyDistance < closestDistance) {
            closestDistance = playerToEnemyDistance;
            closestEnemy = enemy;
          }
        }
      }
      
      // If we found an enemy to hit, apply damage to it
      if (closestEnemy) {
        // Mark as hit
        projectile.hasHit = true;
        
        // Add this enemy to the list of hit enemies
        projectile.hitEnemyIds.push(closestEnemy.id);
        
        // Apply damage to enemy
        onHitEnemy(
          closestEnemy.id, 
          projectile.damage, 
          projectile.isCritical,
          projectile.isMultiShot,
          projectile.isDoubleShot,
          projectile.isMainShot
        );
        
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
                onHitEnemy(enemyId, damage, isCritical, false, false, false);
              }
            }
          );
        }
        
        // Check if we have bounces left
        if (projectile.bouncesLeft > 0) {
          // Check if the bounce occurs based on bounce chance
          if (Math.random() < projectile.bounceChance) {
            // Find a new target for the bounce
            const potentialTargets = enemies.filter(e => !projectile.hitEnemyIds.includes(e.id));
            
            if (potentialTargets.length > 0) {
              // Find the closest enemy that hasn't been hit
              const nextTarget = potentialTargets.sort((a, b) => {
                const distA = Math.sqrt(Math.pow(a.x - closestEnemy.x, 2) + Math.pow(a.y - closestEnemy.y, 2));
                const distB = Math.sqrt(Math.pow(b.x - closestEnemy.x, 2) + Math.pow(b.y - closestEnemy.y, 2));
                return distA - distB;
              })[0];
              
              // Save the bounce position for trail rendering
              projectile.lastBounceX = closestEnemy.x;
              projectile.lastBounceY = closestEnemy.y;
              
              // Reset projectile for bounce
              projectile.hasHit = false;
              projectile.progress = 0;
              projectile.x = closestEnemy.x;
              projectile.y = closestEnemy.y;
              projectile.targetX = nextTarget.x;
              projectile.targetY = nextTarget.y;
              projectile.targetEnemyId = nextTarget.id;
              projectile.damage = projectile.damage * 0.8; // Reduce damage for bounces
              projectile.bouncesLeft--;
              
              // Create a visual effect for the bounce
              onCreateExplosion(
                closestEnemy.x,
                closestEnemy.y,
                '#ffffff',
                15,
                0
              );
            }
          } else {
            // Bounce didn't occur, decrement bounces left
            projectile.bouncesLeft = 0;
          }
        }
      }
    }
    
    // Remove projectile if it reached its target or went beyond
    if (projectile.progress >= 1) {
      if (projectile.bouncesLeft > 0) {
        // Check if the bounce occurs based on bounce chance
        if (Math.random() < projectile.bounceChance) {
          // Try to find a new target for the bounce
          const potentialTargets = enemies.filter(e => !projectile.hitEnemyIds.includes(e.id));
          
          if (potentialTargets.length > 0) {
            // Find a random enemy that hasn't been hit
            const nextTarget = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
            
            // Save the bounce position for trail rendering
            projectile.lastBounceX = projectile.targetX;
            projectile.lastBounceY = projectile.targetY;
            
            // Reset projectile for bounce
            projectile.hasHit = false;
            projectile.progress = 0;
            projectile.x = projectile.targetX;
            projectile.y = projectile.targetY;
            projectile.targetX = nextTarget.x;
            projectile.targetY = nextTarget.y;
            projectile.targetEnemyId = nextTarget.id;
            projectile.damage = projectile.damage * 0.8; // Reduce damage for bounces
            projectile.bouncesLeft--;
            
            // Create a visual effect for the bounce
            onCreateExplosion(
              projectile.x,
              projectile.y,
              '#ffffff',
              15,
              0
            );
          } else {
            projectiles.splice(i, 1);
          }
        } else {
          // Bounce didn't occur, remove projectile
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