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
      // Calculate projectile direction
      const angle = Math.atan2(projectile.targetY - projectile.y, projectile.targetX - projectile.x);

      // Different rendering based on projectile type
      if (projectile.projectileType === 'bouncing') {
        // Sphere/ball shape for bouncing shots - looks like it should bounce
        drawSphereProjectile(projectile, angle);
      } else if (projectile.projectileType === 'multishot') {
        // Crescent shape for multi-shot
        drawCrescentProjectile(projectile, angle);
      } else if (projectile.projectileType === 'ice') {
        // Ice arrow projectile (Arctic Barrage skill)
        drawIceArrow(projectile, angle);
      } else if (projectile.projectileType === 'fire') {
        // Fire meteor projectile (Meteor Storm skill)
        drawFireMeteor(projectile, angle);
      } else {
        // Triangle lightning shot for normal projectiles
        drawTriangleProjectile(projectile, angle);
      }
    });
  };

  // Draw sphere projectile (bouncing shots)
  const drawSphereProjectile = (projectile: Projectile, angle: number) => {
    if (!ctx.value) return;

    const sphereSize = projectile.size * 1.2;
    const baseColor = projectile.isCritical ? '#ff4444' : '#4A90E2'; // Red for crit, blue for normal
    const highlightColor = projectile.isCritical ? '#ff8888' : '#74B4F2';

    // Check if this is a kinetic mastery enhanced projectile (speed > 1.5 indicates upgrades)
    const isKineticEnhanced = projectile.speed > 1.5;
    const kineticLevel = isKineticEnhanced ? Math.floor((projectile.speed - 1) / 0.25) : 0;

    ctx.value.save();

    // Enhanced motion trail for kinetic mastery
    const trailLength = isKineticEnhanced ? Math.min(sphereSize * 5, 50) : Math.min(sphereSize * 3, 30);
    const trailSegments = isKineticEnhanced ? 8 : 5;
    const trailAngle = Math.atan2(projectile.y - projectile.targetY, projectile.x - projectile.targetX);

    for (let i = 0; i < trailSegments; i++) {
      const trailProgress = i / (trailSegments - 1);
      const trailX = projectile.x + Math.cos(trailAngle) * trailLength * trailProgress;
      const trailY = projectile.y + Math.sin(trailAngle) * trailLength * trailProgress;
      const trailSize = sphereSize * (1 - trailProgress * 0.6);
      const trailAlpha = (1 - trailProgress) * (isKineticEnhanced ? 0.5 : 0.3);

      const trailGradient = ctx.value!.createRadialGradient(
        trailX, trailY, 0,
        trailX, trailY, trailSize
      );

      // Kinetic bullets have electric blue trails
      const trailColor = isKineticEnhanced ? '#00ffff' : baseColor;
      trailGradient.addColorStop(0, `${trailColor}${Math.floor(trailAlpha * 255).toString(16).padStart(2, '0')}`);
      trailGradient.addColorStop(1, `${trailColor}00`);

      ctx.value!.beginPath();
      ctx.value!.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
      ctx.value!.fillStyle = trailGradient;
      ctx.value!.fill();
    }

    // Add kinetic sparks for enhanced bullets
    if (isKineticEnhanced) {
      const sparkCount = Math.min(kineticLevel * 2, 8);
      for (let i = 0; i < sparkCount; i++) {
        const sparkAngle = Math.random() * Math.PI * 2;
        const sparkDistance = sphereSize * (1 + Math.random() * 0.5);
        const sparkX = projectile.x + Math.cos(sparkAngle) * sparkDistance;
        const sparkY = projectile.y + Math.sin(sparkAngle) * sparkDistance;
        const sparkSize = 1 + Math.random() * 2;

        ctx.value!.fillStyle = '#00ffff';
        ctx.value!.shadowColor = '#00ffff';
        ctx.value!.shadowBlur = 5;
        ctx.value!.beginPath();
        ctx.value!.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
        ctx.value!.fill();
        ctx.value!.shadowBlur = 0;
      }
    }

    // Enhanced outer glow for kinetic bullets
    const glowMultiplier = isKineticEnhanced ? 1.5 : 1;
    const outerGlow = ctx.value!.createRadialGradient(
      projectile.x, projectile.y, sphereSize * 0.5,
      projectile.x, projectile.y, sphereSize * 2 * glowMultiplier
    );
    const glowColor = isKineticEnhanced ? '#00ffff' : baseColor;
    outerGlow.addColorStop(0, `${glowColor}80`);
    outerGlow.addColorStop(0.7, `${glowColor}40`);
    outerGlow.addColorStop(1, `${glowColor}00`);

    ctx.value!.beginPath();
    ctx.value!.arc(projectile.x, projectile.y, sphereSize * 2 * glowMultiplier, 0, Math.PI * 2);
    ctx.value!.fillStyle = outerGlow;
    ctx.value!.fill();

    // Main sphere body with gradient for 3D effect
    const sphereGradient = ctx.value!.createRadialGradient(
      projectile.x - sphereSize * 0.3, projectile.y - sphereSize * 0.3, 0,
      projectile.x, projectile.y, sphereSize
    );

    // Kinetic bullets have electric blue cores
    if (isKineticEnhanced) {
      sphereGradient.addColorStop(0, '#ffffff');
      sphereGradient.addColorStop(0.3, '#00ffff');
      sphereGradient.addColorStop(1, '#004466');
    } else {
      sphereGradient.addColorStop(0, highlightColor);
      sphereGradient.addColorStop(0.3, baseColor);
      sphereGradient.addColorStop(1, '#1a4480');
    }

    ctx.value!.beginPath();
    ctx.value!.arc(projectile.x, projectile.y, sphereSize, 0, Math.PI * 2);
    ctx.value!.fillStyle = sphereGradient;
    ctx.value!.fill();

    // Add bright highlight for 3D sphere effect
    const highlight = ctx.value!.createRadialGradient(
      projectile.x - sphereSize * 0.4, projectile.y - sphereSize * 0.4, 0,
      projectile.x - sphereSize * 0.4, projectile.y - sphereSize * 0.4, sphereSize * 0.6
    );
    highlight.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    highlight.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
    highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.value!.beginPath();
    ctx.value!.arc(projectile.x - sphereSize * 0.4, projectile.y - sphereSize * 0.4, sphereSize * 0.6, 0, Math.PI * 2);
    ctx.value!.fillStyle = highlight;
    ctx.value!.fill();

    // Enhanced energy particles for kinetic mastery
    const particleCount = isKineticEnhanced ? 10 : 6;
    const particleSpeed = isKineticEnhanced ? 0.008 : 0.005;
    for (let i = 0; i < particleCount; i++) {
      const particleAngle = (i / particleCount) * Math.PI * 2 + Date.now() * particleSpeed;
      const particleDistance = sphereSize * (isKineticEnhanced ? 1.5 : 1.3);
      const particleX = projectile.x + Math.cos(particleAngle) * particleDistance;
      const particleY = projectile.y + Math.sin(particleAngle) * particleDistance;
      const particleSize = (1 + Math.sin(Date.now() * 0.01 + i) * 0.5) * (isKineticEnhanced ? 1.5 : 1);

      const particleColor = isKineticEnhanced ? '#00ffff' : highlightColor;
      ctx.value!.fillStyle = `${particleColor}AA`;
      ctx.value!.beginPath();
      ctx.value!.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
      ctx.value!.fill();
    }

    ctx.value.restore();
  };

  // Draw triangle lightning projectile (normal shots)
  const drawTriangleProjectile = (projectile: Projectile, angle: number) => {
    if (!ctx.value) return;

    // Check if this is a kinetic mastery enhanced projectile
    const isKineticEnhanced = projectile.speed > 1.5;
    const kineticLevel = isKineticEnhanced ? Math.floor((projectile.speed - 1) / 0.25) : 0;

    // Colors based on critical hit and kinetic enhancement
    let baseColor = projectile.isCritical ? '#ff3333' : '#ffff00'; // Red for crit, yellow for normal
    let glowColor = projectile.isCritical ? '#ff6666' : '#ffff88';

    // Override colors for kinetic enhanced bullets
    if (isKineticEnhanced) {
      baseColor = projectile.isCritical ? '#ff00ff' : '#00ffff'; // Magenta for crit, cyan for normal
      glowColor = projectile.isCritical ? '#ff88ff' : '#88ffff';
    }

    ctx.value.save();
    ctx.value.translate(projectile.x, projectile.y);
    ctx.value.rotate(angle);

    // Enhanced lightning trail for kinetic mastery
    const trailLength = isKineticEnhanced ? projectile.size * 12 : projectile.size * 8;
    const trailSegments = isKineticEnhanced ? 8 : 5;

    for (let i = 0; i < trailSegments; i++) {
      const segmentProgress = i / (trailSegments - 1);
      const segmentX = -trailLength * segmentProgress;
      const alpha = (1 - segmentProgress) * (isKineticEnhanced ? 0.8 : 0.6);

      ctx.value.strokeStyle = `${baseColor}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
      ctx.value.lineWidth = projectile.size * (1 - segmentProgress * 0.5) * (isKineticEnhanced ? 1.3 : 1);
      ctx.value.beginPath();
      ctx.value.moveTo(segmentX, 0);
      ctx.value.lineTo(segmentX - projectile.size * 2, 0);
      ctx.value.stroke();

      // Add electric arcs for kinetic enhanced bullets
      if (isKineticEnhanced && i < trailSegments - 2) {
        const arcHeight = (Math.random() - 0.5) * projectile.size * 2;
        ctx.value.strokeStyle = `${baseColor}${Math.floor(alpha * 0.6 * 255).toString(16).padStart(2, '0')}`;
        ctx.value.lineWidth = 1;
        ctx.value.beginPath();
        ctx.value.moveTo(segmentX, 0);
        ctx.value.quadraticCurveTo(segmentX - projectile.size, arcHeight, segmentX - projectile.size * 2, 0);
        ctx.value.stroke();
      }
    }

    // Add kinetic sparks around the projectile
    if (isKineticEnhanced) {
      const sparkCount = Math.min(kineticLevel * 3, 12);
      for (let i = 0; i < sparkCount; i++) {
        const sparkAngle = Math.random() * Math.PI * 2;
        const sparkDistance = projectile.size * (1 + Math.random() * 2);
        const sparkX = Math.cos(sparkAngle) * sparkDistance;
        const sparkY = Math.sin(sparkAngle) * sparkDistance;
        const sparkLength = projectile.size * 0.5;

        ctx.value.strokeStyle = baseColor;
        ctx.value.lineWidth = 1;
        ctx.value.beginPath();
        ctx.value.moveTo(sparkX, sparkY);
        ctx.value.lineTo(sparkX + (Math.random() - 0.5) * sparkLength, sparkY + (Math.random() - 0.5) * sparkLength);
        ctx.value.stroke();
      }
    }

    // Draw triangle projectile body with kinetic enhancement
    const triangleSize = projectile.isCritical ? projectile.size * 1.5 : projectile.size;
    const enhancedSize = isKineticEnhanced ? triangleSize * 1.2 : triangleSize;

    ctx.value.beginPath();
    ctx.value.moveTo(enhancedSize * 1.5, 0);
    ctx.value.lineTo(-enhancedSize * 0.5, enhancedSize);
    ctx.value.lineTo(-enhancedSize * 0.5, -enhancedSize);
    ctx.value.closePath();

    // Enhanced glow effect for kinetic bullets
    if (isKineticEnhanced) {
      ctx.value.shadowColor = baseColor;
      ctx.value.shadowBlur = 15;
    }

    // Fill with glow effect
    ctx.value.fillStyle = glowColor;
    ctx.value.fill();
    ctx.value.strokeStyle = baseColor;
    ctx.value.lineWidth = isKineticEnhanced ? 3 : 2;
    ctx.value.stroke();

    // Reset shadow
    ctx.value.shadowBlur = 0;

    // Add bright core
    ctx.value.beginPath();
    ctx.value.moveTo(enhancedSize * 0.8, 0);
    ctx.value.lineTo(-enhancedSize * 0.2, enhancedSize * 0.5);
    ctx.value.lineTo(-enhancedSize * 0.2, -enhancedSize * 0.5);
    ctx.value.closePath();
    ctx.value.fillStyle = '#ffffff';
    ctx.value.fill();

    ctx.value.restore();
  };

  // Draw laser beam projectile (bouncing shots)
  const drawLaserBeam = (projectile: Projectile, angle: number) => {
    if (!ctx.value) return;

    // For bouncing projectiles, we want to draw a continuous beam from source to current position
    // and potentially to the last bounce point

    // Calculate the source position (where the projectile started)
    const sourceX = projectile.x - (projectile.targetX - projectile.x) * projectile.progress / (1 - projectile.progress || 0.001);
    const sourceY = projectile.y - (projectile.targetY - projectile.y) * projectile.progress / (1 - projectile.progress || 0.001);

    // Draw continuous beam from source to current position
    drawLaserSegment(sourceX, sourceY, projectile.x, projectile.y);

    // If there was a previous bounce, also draw from last bounce point
    if (projectile.lastBounceX !== null && projectile.lastBounceY !== null) {
      // Draw beam from last bounce to current position
      drawLaserSegment(projectile.lastBounceX, projectile.lastBounceY, projectile.x, projectile.y);
    }
  };

  // Helper function to draw a laser segment between two points
  const drawLaserSegment = (x1: number, y1: number, x2: number, y2: number) => {
    if (!ctx.value) return;

    const beamWidth = 3;

    // Calculate beam length and angle
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Don't draw if distance is too small
    if (distance < 5) return;

    ctx.value.save();

    // Outer glow layer (widest, most transparent)
    ctx.value.strokeStyle = 'rgba(74, 144, 226, 0.2)';
    ctx.value.lineWidth = beamWidth * 4;
    ctx.value.lineCap = 'round';
    ctx.value.beginPath();
    ctx.value.moveTo(x1, y1);
    ctx.value.lineTo(x2, y2);
    ctx.value.stroke();

    // Middle glow layer
    ctx.value.strokeStyle = 'rgba(74, 144, 226, 0.5)';
    ctx.value.lineWidth = beamWidth * 2;
    ctx.value.beginPath();
    ctx.value.moveTo(x1, y1);
    ctx.value.lineTo(x2, y2);
    ctx.value.stroke();

    // Core beam (brightest, narrowest)
    ctx.value.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.value.lineWidth = beamWidth * 0.5;
    ctx.value.beginPath();
    ctx.value.moveTo(x1, y1);
    ctx.value.lineTo(x2, y2);
    ctx.value.stroke();

    // Add energy particles along the beam
    const particleCount = Math.floor(distance / 20);
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const particleX = x1 + dx * t + (Math.random() - 0.5) * beamWidth;
      const particleY = y1 + dy * t + (Math.random() - 0.5) * beamWidth;

      ctx.value.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.value.beginPath();
      ctx.value.arc(particleX, particleY, 0.5 + Math.random() * 1, 0, Math.PI * 2);
      ctx.value.fill();
    }

    ctx.value.restore();
  };

  // Draw crescent projectile (multi-shot)
  const drawCrescentProjectile = (projectile: Projectile, angle: number) => {
    if (!ctx.value) return;

    ctx.value.save();
    ctx.value.translate(projectile.x, projectile.y);
    ctx.value.rotate(angle);

    const crescentSize = projectile.size * 1.2;

    // Draw outer crescent glow
    ctx.value.fillStyle = 'rgba(139, 92, 246, 0.4)';
    ctx.value.beginPath();
    ctx.value.arc(0, 0, crescentSize * 1.5, -Math.PI * 0.6, Math.PI * 0.6);
    ctx.value.arc(crescentSize * 0.5, 0, crescentSize * 1.2, Math.PI * 0.6, -Math.PI * 0.6, true);
    ctx.value.closePath();
    ctx.value.fill();

    // Draw main crescent body
    ctx.value.fillStyle = '#8B5CF6';
    ctx.value.beginPath();
    ctx.value.arc(0, 0, crescentSize, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.value.arc(crescentSize * 0.3, 0, crescentSize * 0.8, Math.PI * 0.5, -Math.PI * 0.5, true);
    ctx.value.closePath();
    ctx.value.fill();

    // Add bright edge
    ctx.value.strokeStyle = '#ffffff';
    ctx.value.lineWidth = 2;
    ctx.value.beginPath();
    ctx.value.arc(0, 0, crescentSize, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.value.stroke();

    // Add inner shine
    ctx.value.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.value.beginPath();
    ctx.value.arc(0, 0, crescentSize * 0.6, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.value.arc(crescentSize * 0.2, 0, crescentSize * 0.5, Math.PI * 0.4, -Math.PI * 0.4, true);
    ctx.value.closePath();
    ctx.value.fill();

    ctx.value.restore();
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

  // Draw ice arrow projectile (Arctic Barrage skill)
  const drawIceArrow = (projectile: Projectile, angle: number) => {
    if (!ctx.value) return;

    const arrowSize = projectile.size;
    const arrowColor = '#00BFFF'; // Deep sky blue
    const glowColor = '#87CEEB'; // Sky blue

    ctx.value.save();

    // Ice trail effect
    const trailLength = arrowSize * 3;
    const trailOpacity = 0.6;

    for (let i = 0; i < 5; i++) {
      const trailX = projectile.x - Math.cos(angle) * (i * 8);
      const trailY = projectile.y - Math.sin(angle) * (i * 8);
      const trailSize = arrowSize * (1 - i * 0.15);
      const opacity = trailOpacity * (1 - i * 0.2);

      ctx.value.globalAlpha = opacity;

      // Ice crystal trail
      ctx.value.beginPath();
      ctx.value.arc(trailX, trailY, trailSize * 0.8, 0, Math.PI * 2);
      ctx.value.fillStyle = glowColor;
      ctx.value.fill();
    }

    ctx.value.globalAlpha = 1;
    ctx.value.translate(projectile.x, projectile.y);
    ctx.value.rotate(angle);

    // Arrow shaft
    ctx.value.fillStyle = arrowColor;
    ctx.value.fillRect(-arrowSize * 0.8, -arrowSize * 0.1, arrowSize * 1.6, arrowSize * 0.2);

    // Arrow head
    ctx.value.beginPath();
    ctx.value.moveTo(arrowSize * 0.8, 0);
    ctx.value.lineTo(arrowSize * 0.3, -arrowSize * 0.3);
    ctx.value.lineTo(arrowSize * 0.3, arrowSize * 0.3);
    ctx.value.closePath();
    ctx.value.fill();

    // Arrow fletching
    ctx.value.beginPath();
    ctx.value.moveTo(-arrowSize * 0.8, 0);
    ctx.value.lineTo(-arrowSize * 0.5, -arrowSize * 0.2);
    ctx.value.lineTo(-arrowSize * 0.5, arrowSize * 0.2);
    ctx.value.closePath();
    ctx.value.fill();

    // Ice glow effect
    ctx.value.shadowColor = glowColor;
    ctx.value.shadowBlur = 15;
    ctx.value.strokeStyle = '#FFFFFF';
    ctx.value.lineWidth = 1;
    ctx.value.stroke();

    ctx.value.restore();
  };

  // Draw fire meteor projectile (Meteor Storm skill)
  const drawFireMeteor = (projectile: Projectile, angle: number) => {
    if (!ctx.value) return;

    const meteorSize = projectile.size;
    const coreColor = '#FF4500'; // Orange red
    const outerColor = '#FF6347'; // Tomato
    const trailColor = '#FFD700'; // Gold

    ctx.value.save();

    // Fire trail effect - more dramatic
    const trailLength = meteorSize * 5;

    for (let i = 0; i < 8; i++) {
      const trailX = projectile.x - Math.cos(angle) * (i * 12);
      const trailY = projectile.y - Math.sin(angle) * (i * 12);
      const trailSize = meteorSize * (1.2 - i * 0.12);
      const opacity = 0.8 * (1 - i * 0.1);

      ctx.value.globalAlpha = opacity;

      // Outer flame
      const gradient = ctx.value.createRadialGradient(
        trailX, trailY, 0,
        trailX, trailY, trailSize
      );
      gradient.addColorStop(0, trailColor);
      gradient.addColorStop(0.6, outerColor);
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

      ctx.value.beginPath();
      ctx.value.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
      ctx.value.fillStyle = gradient;
      ctx.value.fill();
    }

    ctx.value.globalAlpha = 1;

    // Main meteor body
    const meteorGradient = ctx.value.createRadialGradient(
      projectile.x, projectile.y, 0,
      projectile.x, projectile.y, meteorSize * 1.5
    );
    meteorGradient.addColorStop(0, '#FFFFFF');
    meteorGradient.addColorStop(0.3, coreColor);
    meteorGradient.addColorStop(0.7, outerColor);
    meteorGradient.addColorStop(1, 'rgba(255, 0, 0, 0.3)');

    ctx.value.beginPath();
    ctx.value.arc(projectile.x, projectile.y, meteorSize * 1.2, 0, Math.PI * 2);
    ctx.value.fillStyle = meteorGradient;
    ctx.value.fill();

    // Inner core
    ctx.value.beginPath();
    ctx.value.arc(projectile.x, projectile.y, meteorSize * 0.6, 0, Math.PI * 2);
    ctx.value.fillStyle = '#FFFFFF';
    ctx.value.fill();

    // Sparks and embers
    for (let i = 0; i < 3; i++) {
      const sparkAngle = angle + (Math.random() - 0.5) * 0.5;
      const sparkDistance = meteorSize * (1 + Math.random() * 2);
      const sparkX = projectile.x - Math.cos(sparkAngle) * sparkDistance;
      const sparkY = projectile.y - Math.sin(sparkAngle) * sparkDistance;

      ctx.value.beginPath();
      ctx.value.arc(sparkX, sparkY, 2 + Math.random() * 3, 0, Math.PI * 2);
      ctx.value.fillStyle = trailColor;
      ctx.value.fill();
    }

    ctx.value.restore();
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