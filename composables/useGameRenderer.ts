import { ref, onMounted, nextTick } from 'vue';
import type {
  GameState,
  Enemy,
  Player,
  RelicStar
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

  // Draw current typed text below the player
  const drawTypedText = (player: Player, typedText: string) => {
    if (!ctx.value || !typedText) return;
    
    ctx.value.font = 'bold 20px Arial'; // Slightly smaller than before
    ctx.value.fillStyle = '#ffff00'; // Changed from blue to yellow
    ctx.value.textAlign = 'center';
    ctx.value.textBaseline = 'middle';
    
    // Position text above the Earth where level used to be
    const textY = player.y - player.radius - 45;
    
    // Add stroke for better visibility
    ctx.value.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.value.lineWidth = 3;
    ctx.value.strokeText(typedText, player.x, textY);
    
    // Draw text without background
    ctx.value.fillText(typedText, player.x, textY);
  };

  // Draw all relic stars
  const drawRelicStars = (relicStars: RelicStar[], highlightedRelicStarId: number | null) => {
    if (!ctx.value) return;

    relicStars.forEach(star => {
      const isHighlighted = highlightedRelicStarId === star.id;

      // Draw trail first
      if (star.trail.length > 1) {
        ctx.value!.save();
        for (let i = 1; i < star.trail.length; i++) {
          const trailPoint = star.trail[i];
          const prevPoint = star.trail[i - 1];

          const trailAlpha = trailPoint.opacity * 0.6;
          const trailSize = star.size * (trailPoint.opacity * 0.8);

          // Create gradient for trail segment
          const gradient = ctx.value!.createRadialGradient(
            trailPoint.x, trailPoint.y, 0,
            trailPoint.x, trailPoint.y, trailSize
          );
          gradient.addColorStop(0, `${star.relic.auraColor}${Math.floor(trailAlpha * 255).toString(16).padStart(2, '0')}`);
          gradient.addColorStop(1, `${star.relic.auraColor}00`);

          ctx.value!.beginPath();
          ctx.value!.arc(trailPoint.x, trailPoint.y, trailSize, 0, Math.PI * 2);
          ctx.value!.fillStyle = gradient;
          ctx.value!.fill();
        }
        ctx.value!.restore();
      }

      // Draw relic star glow/aura
      const glowRadius = star.size * (2 + star.glowIntensity);
      const auraGradient = ctx.value!.createRadialGradient(
        star.x, star.y, star.size * 0.5,
        star.x, star.y, glowRadius
      );
      auraGradient.addColorStop(0, `${star.relic.auraColor}80`);
      auraGradient.addColorStop(0.7, `${star.relic.auraColor}40`);
      auraGradient.addColorStop(1, `${star.relic.auraColor}00`);

      ctx.value!.beginPath();
      ctx.value!.arc(star.x, star.y, glowRadius, 0, Math.PI * 2);
      ctx.value!.fillStyle = auraGradient;
      ctx.value!.fill();

      // Draw main star body
      const pulseSize = star.size * (1 + Math.sin(star.pulsePhase) * 0.1);

      // Star shape with multiple points
      ctx.value!.save();
      ctx.value!.translate(star.x, star.y);
      ctx.value!.rotate(star.pulsePhase * 0.3); // Slow rotation

      // Draw star shape
      const points = 8;
      const outerRadius = pulseSize;
      const innerRadius = pulseSize * 0.5;

      ctx.value!.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) {
          ctx.value!.moveTo(x, y);
        } else {
          ctx.value!.lineTo(x, y);
        }
      }
      ctx.value!.closePath();

      // Fill with relic color
      ctx.value!.fillStyle = star.relic.auraColor;
      ctx.value!.fill();

      // Add inner highlight
      ctx.value!.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points;
        const radius = (i % 2 === 0 ? outerRadius : innerRadius) * 0.6;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) {
          ctx.value!.moveTo(x, y);
        } else {
          ctx.value!.lineTo(x, y);
        }
      }
      ctx.value!.closePath();
      ctx.value!.fillStyle = '#ffffff';
      ctx.value!.fill();

      ctx.value!.restore();

      // Draw relic icon in center
      ctx.value!.save();
      ctx.value!.translate(star.x, star.y);
      ctx.value!.fillStyle = '#000000';
      ctx.value!.font = `${star.size * 0.8}px Arial`;
      ctx.value!.textAlign = 'center';
      ctx.value!.textBaseline = 'middle';
      ctx.value!.fillText(star.relic.icon, 0, 0);
      ctx.value!.restore();

      // Draw word above star with typing highlighting
      const wordY = star.y - star.size - 20;
      ctx.value!.save();
      ctx.value!.font = `bold ${16}px Arial`;
      ctx.value!.textAlign = 'center';
      ctx.value!.textBaseline = 'middle';

      // If star has typing progress, draw highlighted text
      if (star.typedProgress > 0) {
        // Calculate the number of characters typed based on progress
        const typedLength = Math.floor(star.typedProgress * star.word.length);
        const typedPortion = star.word.substring(0, typedLength);
        const remainingPortion = star.word.substring(typedLength);

        // Measure text to position the parts correctly
        const typedWidth = ctx.value!.measureText(typedPortion).width;
        const totalWidth = ctx.value!.measureText(star.word).width;
        const remainingWidth = ctx.value!.measureText(remainingPortion).width;

        // Calculate positioning for each portion
        const startX = star.x - totalWidth / 2;

        // Draw background stroke for both portions
        ctx.value!.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.value!.lineWidth = 3;
        ctx.value!.strokeText(star.word, star.x, wordY);

        // Draw typed portion with green color and glow
        ctx.value!.shadowColor = '#00ff00';
        ctx.value!.shadowBlur = 12;
        ctx.value!.fillStyle = '#00ff00'; // Bright green
        ctx.value!.textAlign = 'left';
        ctx.value!.fillText(typedPortion, startX, wordY);

        // Reset shadow and draw remaining portion (white)
        ctx.value!.shadowBlur = 0;
        ctx.value!.shadowColor = 'transparent';
        ctx.value!.fillStyle = '#ffffff';
        ctx.value!.fillText(remainingPortion, startX + typedWidth, wordY);

        // Reset text alignment
        ctx.value!.textAlign = 'center';
      } else {
        // Draw normal text with stroke
        ctx.value!.strokeStyle = '#000000';
        ctx.value!.lineWidth = 2;
        ctx.value!.strokeText(star.word, star.x, wordY);
        
        ctx.value!.fillStyle = isHighlighted ? '#ffff00' : '#ffffff';
        ctx.value!.fillText(star.word, star.x, wordY);
      }
      
      ctx.value!.restore();

      // Draw time remaining indicator
      const timeProgress = star.timeRemaining / star.maxTime;
      const barWidth = star.size * 2;
      const barHeight = 4;
      const barY = star.y + star.size + 15;

      // Background bar
      ctx.value!.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.value!.fillRect(star.x - barWidth / 2, barY, barWidth, barHeight);

      // Progress bar
      const progressWidth = barWidth * timeProgress;
      let barColor = '#00ff00'; // Green
      if (timeProgress < 0.5) barColor = '#ffff00'; // Yellow
      if (timeProgress < 0.25) barColor = '#ff0000'; // Red

      ctx.value!.fillStyle = barColor;
      ctx.value!.fillRect(star.x - barWidth / 2, barY, progressWidth, barHeight);

      // Draw rarity indicator
      let rarityColor = '#ffffff';
      let rarityText = '';
      switch (star.relic.rarity) {
        case 'common':
          rarityColor = '#ffffff';
          rarityText = '●';
          break;
        case 'rare':
          rarityColor = '#0088ff';
          rarityText = '◆';
          break;
        case 'epic':
          rarityColor = '#aa00ff';
          rarityText = '★';
          break;
        case 'legendary':
          rarityColor = '#ffaa00';
          rarityText = '✦';
          break;
      }

      ctx.value!.save();
      ctx.value!.fillStyle = rarityColor;
      ctx.value!.font = 'bold 12px Arial';
      ctx.value!.textAlign = 'center';
      ctx.value!.textBaseline = 'middle';
      ctx.value!.fillText(rarityText, star.x + star.size + 10, star.y - star.size - 10);
      ctx.value!.restore();

      // Draw highlight effect if selected
      if (isHighlighted) {
        ctx.value!.save();
        ctx.value!.strokeStyle = '#ffff00';
        ctx.value!.lineWidth = 3;
        ctx.value!.setLineDash([5, 5]);
        ctx.value!.lineDashOffset = -Date.now() * 0.01; // Animated dashes
        ctx.value!.beginPath();
        ctx.value!.arc(star.x, star.y, star.size + 10, 0, Math.PI * 2);
        ctx.value!.stroke();
        ctx.value!.restore();
      }
    });
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
    deltaTime: number,
    highlightedRelicStarId: number | null = null,
    currentTypedText: string = ''
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

    // Draw game entities
    drawEnemies(gameState.enemies);
    drawProjectiles(projectiles);
    drawPlayerCharacter(gameState.player);
    drawRelicStars(gameState.relicStars, highlightedRelicStarId);
    drawAutoFireLaser(gameState.player, autoFireTarget, autoFireLaserOpacity);
    drawExplosions(explosions);
    drawDamageNumbers(damageNumbers);

    // Draw current typed text below the player
    drawTypedText(gameState.player, currentTypedText);

    return updatedGradient;
  };

  return {
    canvasEl,
    initializeCanvas: (context: CanvasRenderingContext2D) => {
      ctx.value = context;
    },
    render,
  };
}