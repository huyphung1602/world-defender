import { ref, onMounted, nextTick } from 'vue';
import type {
  GameState,
  Enemy,
  Player
} from '../utils/gameModels';
import type {
  Projectile,
  Explosion,
  DamageNumber,
  Star,
  BackgroundGradient
} from '../utils/effects/gameEffects';
import {
  drawPlayer,
  drawEnemy,
  drawBackground
} from '../utils/rendering/drawFunctions';

export function useGameRenderer(canvasWidth: number, canvasHeight: number) {
  const canvasEl = ref<HTMLCanvasElement | null>(null);
  const ctx = ref<CanvasRenderingContext2D | null>(null);

  // Initialize canvas
  onMounted(async () => {
    await nextTick();
    if (canvasEl.value) {
      ctx.value = canvasEl.value.getContext('2d');
      if (ctx.value) {
        canvasEl.value.width = canvasWidth;
        canvasEl.value.height = canvasHeight;
      }
    }
  });

  // Clear canvas
  const clearCanvas = () => {
    if (!ctx.value) return;
    ctx.value.clearRect(0, 0, canvasWidth, canvasHeight);
  };

  // Draw auto-fire laser
  const drawAutoFireLaser = (
    player: Player,
    autoFireTarget: Enemy | null,
    autoFireLaserOpacity: number
  ) => {
    if (!ctx.value || !autoFireTarget || autoFireLaserOpacity <= 0) return;

    ctx.value.strokeStyle = `rgba(255, 0, 0, ${autoFireLaserOpacity})`;
    ctx.value.lineWidth = 3;
    ctx.value.beginPath();
    ctx.value.moveTo(player.x, player.y);
    ctx.value.lineTo(autoFireTarget.x, autoFireTarget.y);
    ctx.value.stroke();

    // Draw crosshair on target
    const crosshairSize = 20;
    ctx.value.strokeStyle = `rgba(255, 0, 0, ${autoFireLaserOpacity})`;
    ctx.value.lineWidth = 2;

    // Horizontal line
    ctx.value.beginPath();
    ctx.value.moveTo(autoFireTarget.x - crosshairSize, autoFireTarget.y);
    ctx.value.lineTo(autoFireTarget.x + crosshairSize, autoFireTarget.y);
    ctx.value.stroke();

    // Vertical line
    ctx.value.beginPath();
    ctx.value.moveTo(autoFireTarget.x, autoFireTarget.y - crosshairSize);
    ctx.value.lineTo(autoFireTarget.x, autoFireTarget.y + crosshairSize);
    ctx.value.stroke();
  };

  // Draw all enemies with performance optimization
  const drawEnemies = (enemies: Enemy[]) => {
    if (!ctx.value) return;

    // Only render enemies that are near the visible area for better performance
    const margin = 100; // Extra margin to ensure smooth movement
    const visibleEnemies = enemies.filter(enemy =>
      enemy.x > -margin &&
      enemy.x < canvasWidth + margin &&
      enemy.y > -margin &&
      enemy.y < canvasHeight + margin
    );

    // Additional optimization: limit the number of enemies rendered per frame
    // to prevent lag when there are too many enemies
    const maxEnemiesPerFrame = 50;
    const enemiesToRender = visibleEnemies.length > maxEnemiesPerFrame
      ? visibleEnemies.slice(0, maxEnemiesPerFrame)
      : visibleEnemies;

    enemiesToRender.forEach(enemy => drawEnemy(ctx.value!, enemy));
  };

  // Draw all projectiles
  const drawProjectiles = (projectiles: Projectile[]) => {
    if (!ctx.value) return;

    projectiles.forEach(projectile => {
      // Calculate projectile direction for flame tail
      const angle = Math.atan2(projectile.targetY - projectile.y, projectile.targetX - projectile.x);

      // Flame colors based on projectile type
      let flameColors;
      let trailLength;
      if (projectile.isFrozenBullet) {
        flameColors = ['#e6f3ff', '#b3d9ff', '#80bfff', '#4da6ff']; // Ice blue shades
        trailLength = projectile.size * 8;
      } else if (projectile.isCritical) {
        flameColors = ['#ffcccc', '#ff9999', '#ff6666', '#ff3333', '#ff0000', '#cc0000']; // Red flame
        trailLength = projectile.size * 12; // Longer for critical
      } else {
        flameColors = ['#fff5cc', '#ffe066', '#ffcc00', '#ff9900', '#ff6600']; // Yellow flame
        trailLength = projectile.size * 10;
      }

      // Draw flame tail with gradient effect
      const numFlameSegments = flameColors.length;
      for (let i = 0; i < numFlameSegments; i++) {
        const segmentProgress = i / (numFlameSegments - 1);
        const segmentDistance = trailLength * segmentProgress;

        // Calculate flame segment position
        const segmentX = projectile.x - Math.cos(angle) * segmentDistance;
        const segmentY = projectile.y - Math.sin(angle) * segmentDistance;

        // Create flame shape - wider at base, tapering to point
        const baseWidth = projectile.size * (2.5 - segmentProgress * 1.5);
        const segmentHeight = projectile.size * (1.8 - segmentProgress * 0.8);

        // Draw flame segment as an elongated oval
        ctx.value!.save();
        ctx.value!.translate(segmentX, segmentY);
        ctx.value!.rotate(angle);

        // Create flame-like shape
        ctx.value!.beginPath();
        ctx.value!.ellipse(0, 0, segmentHeight, baseWidth, 0, 0, Math.PI * 2);

        // Apply flame color with transparency based on position
        const alpha = (1 - segmentProgress * 0.7) * 0.8;
        const color = flameColors[i];
        ctx.value!.fillStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.value!.fill();

        // Add inner glow for flame effect
        if (i < 3) { // Only for the front segments
          ctx.value!.beginPath();
          ctx.value!.ellipse(0, 0, segmentHeight * 0.6, baseWidth * 0.6, 0, 0, Math.PI * 2);
          const innerAlpha = (1 - segmentProgress * 0.5) * 0.9;
          const innerColor = i === 0 ? '#ffffff' : flameColors[Math.max(0, i - 1)];
          ctx.value!.fillStyle = innerColor + Math.floor(innerAlpha * 255).toString(16).padStart(2, '0');
          ctx.value!.fill();
        }

        ctx.value!.restore();
      }

      // Draw projectile core (flame head)
      const coreColor = projectile.isFrozenBullet ? '#ffffff' :
                       projectile.isCritical ? '#ffcccc' : '#ffffcc';

      ctx.value!.save();
      ctx.value!.translate(projectile.x, projectile.y);
      ctx.value!.rotate(angle);

      // Draw flame head shape
      ctx.value!.beginPath();
      ctx.value!.ellipse(0, 0, projectile.size * 1.5, projectile.size * 1.2, 0, 0, Math.PI * 2);
      ctx.value!.fillStyle = coreColor;
      ctx.value!.fill();

      // Add bright core
      ctx.value!.beginPath();
      ctx.value!.ellipse(0, 0, projectile.size * 0.8, projectile.size * 0.6, 0, 0, Math.PI * 2);
      ctx.value!.fillStyle = '#ffffff';
      ctx.value!.fill();

      ctx.value!.restore();

      // For frozen bullets, add snowflake effect on the core
      if (projectile.isFrozenBullet) {
        ctx.value!.save();
        ctx.value!.translate(projectile.x, projectile.y);
        ctx.value!.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.value!.lineWidth = 1.5;

        // Draw snowflake pattern
        for (let i = 0; i < 6; i++) {
          ctx.value!.rotate(Math.PI / 3);
          ctx.value!.beginPath();
          ctx.value!.moveTo(0, -projectile.size * 0.8);
          ctx.value!.lineTo(0, projectile.size * 0.8);
          ctx.value!.stroke();

          // Add small branches
          ctx.value!.beginPath();
          ctx.value!.moveTo(0, -projectile.size * 0.4);
          ctx.value!.lineTo(-projectile.size * 0.3, -projectile.size * 0.6);
          ctx.value!.moveTo(0, -projectile.size * 0.4);
          ctx.value!.lineTo(projectile.size * 0.3, -projectile.size * 0.6);
          ctx.value!.stroke();
        }

        ctx.value!.restore();
      }
    });
  };

  // Draw all explosions
  const drawExplosions = (explosions: Explosion[]) => {
    if (!ctx.value) return;

    explosions.forEach(explosion => {
      // Draw main explosion circle with gradient
      const currentRadius = explosion.radius + (explosion.maxRadius - explosion.radius) * explosion.progress;
      const alpha = 1 - explosion.progress;

      const explosionGradient = ctx.value!.createRadialGradient(
        explosion.x, explosion.y, currentRadius * 0.3,
        explosion.x, explosion.y, currentRadius
      );
      explosionGradient.addColorStop(0, `rgba(255, 165, 0, ${alpha * 0.8})`);
      explosionGradient.addColorStop(0.7, `rgba(255, 100, 0, ${alpha * 0.5})`);
      explosionGradient.addColorStop(1, `rgba(255, 0, 0, 0)`);

      ctx.value!.beginPath();
      ctx.value!.arc(explosion.x, explosion.y, currentRadius, 0, Math.PI * 2);
      ctx.value!.fillStyle = explosionGradient;
      ctx.value!.fill();
      ctx.value!.closePath();

      // Draw particles with glow
      explosion.particles.forEach(particle => {
        const particleGradient = ctx.value!.createRadialGradient(
          particle.x, particle.y, particle.size * 0.3,
          particle.x, particle.y, particle.size * 2
        );
        particleGradient.addColorStop(0, particle.color);
        particleGradient.addColorStop(1, 'rgba(255, 165, 0, 0)');

        ctx.value!.beginPath();
        ctx.value!.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.value!.fillStyle = particleGradient;
        ctx.value!.fill();
        ctx.value!.closePath();

        ctx.value!.beginPath();
        ctx.value!.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.value!.fillStyle = particle.color;
        ctx.value!.fill();
        ctx.value!.closePath();
      });
    });
  };

  // Draw all damage numbers
  const drawDamageNumbers = (damageNumbers: DamageNumber[]) => {
    if (!ctx.value) return;

    damageNumbers.forEach(damageNumber => {
      const alpha = 1 - damageNumber.progress;
      const fontSize = damageNumber.isCritical ? 24 : 18;
      const displayText = damageNumber.text || damageNumber.value.toString();

      ctx.value!.font = `bold ${fontSize}px Arial`;
      ctx.value!.textAlign = 'center';
      ctx.value!.textBaseline = 'middle';

      // Draw text shadow for better visibility
      ctx.value!.fillStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
      ctx.value!.fillText(displayText, damageNumber.x + 2, damageNumber.y + 2);

      // Draw main text
      ctx.value!.fillStyle = `${damageNumber.color.slice(0, -2) || damageNumber.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
      ctx.value!.fillText(displayText, damageNumber.x, damageNumber.y);
    });
  };

  // Draw the player (Earth)
  const drawPlayerCharacter = (player: Player) => {
    if (!ctx.value) return;
    drawPlayer(ctx.value, player);
  };

  // Draw wave indicator
  const drawWaveIndicator = (wave: number) => {
    if (!ctx.value) return;

    ctx.value.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.value.font = 'bold 24px Arial';
    ctx.value.textAlign = 'center';
    ctx.value.fillText(`Wave ${wave}`, canvasWidth / 2, 50);
  };

  // Main render function
  const render = (
    gameState: GameState,
    projectiles: Projectile[],
    explosions: Explosion[],
    damageNumbers: DamageNumber[],
    stars: Star[],
    backgroundGradient: BackgroundGradient,
    autoFireTarget: Enemy | null,
    autoFireLaserOpacity: number,
    deltaTime: number
  ) => {
    if (!ctx.value) return;

    clearCanvas();

    // Draw animated background using the existing drawBackground function
    const updatedGradient = drawBackground(
      ctx.value,
      canvasWidth,
      canvasHeight,
      stars,
      backgroundGradient,
      deltaTime
    );

    // Return updated gradient values for the caller to update state
    const gradientUpdate = {
      transitionProgress: updatedGradient.transitionProgress,
      currentIndex: updatedGradient.currentIndex
    };

    // Draw game objects
    drawEnemies(gameState.enemies);
    drawProjectiles(projectiles);
    drawPlayerCharacter(gameState.player);

    // Draw auto-fire laser
    drawAutoFireLaser(gameState.player, autoFireTarget, autoFireLaserOpacity);

    // Draw effects
    drawExplosions(explosions);
    drawDamageNumbers(damageNumbers);

    // Draw UI elements
    drawWaveIndicator(gameState.wave);

    return gradientUpdate;
  };

  return {
    canvasEl,
    initializeCanvas: (context: CanvasRenderingContext2D) => {
      ctx.value = context;
    },
    render,
  };
}