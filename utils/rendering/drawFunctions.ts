/**
 * Convert a hex color to RGB components
 */
export const hexToRgb = (hex: string): { r: number, g: number, b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Shade a color by a percentage (positive brightens, negative darkens)
 */
export const shadeColor = (color: string, percent: number): string => {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.floor(R * (100 + percent) / 100);
  G = Math.floor(G * (100 + percent) / 100);
  B = Math.floor(B * (100 + percent) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  R = R > 0 ? R : 0;
  G = G > 0 ? G : 0;
  B = B > 0 ? B : 0;

  const RR = R.toString(16).padStart(2, '0');
  const GG = G.toString(16).padStart(2, '0');
  const BB = B.toString(16).padStart(2, '0');

  return `#${RR}${GG}${BB}`;
};

/**
 * Lighten a color by adding a specific amount to RGB values
 */
export const lightenColor = (color: string, amount: number): string => {
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

/**
 * Draw a regular polygon with specified number of sides
 */
export const drawPolygon = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, sides: number) => {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 / sides) * i;
    const pointX = x + radius * Math.cos(angle);
    const pointY = y + radius * Math.sin(angle);

    if (i === 0) {
      ctx.moveTo(pointX, pointY);
    } else {
      ctx.lineTo(pointX, pointY);
    }
  }
  ctx.closePath();
};

/**
 * Draw the player
 */
export const drawPlayer = (ctx: CanvasRenderingContext2D, player: any): void => {
  // Draw player glow
  const glowGradient = ctx.createRadialGradient(
    player.x, player.y, player.radius,
    player.x, player.y, player.glowSize
  );
  glowGradient.addColorStop(0, player.glowColor);
  glowGradient.addColorStop(1, 'rgba(124, 214, 255, 0)');

  ctx.beginPath();
  ctx.arc(player.x, player.y, player.glowSize, 0, Math.PI * 2);
  ctx.fillStyle = glowGradient;
  ctx.fill();
  ctx.closePath();

  // Save the current context state before rotation
  ctx.save();

  // Apply rotation to the Earth (translate to center, rotate, then translate back)
  ctx.translate(player.x, player.y);
  ctx.rotate(player.rotation);
  ctx.translate(-player.x, -player.y);

  // Draw Earth-like appearance
  // Base blue ocean color
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#1a66b3'; // Ocean blue
  ctx.fill();
  ctx.closePath();

  // Draw continents (green landmasses)
  // North America
  ctx.beginPath();
  ctx.moveTo(player.x - player.radius * 0.3, player.y - player.radius * 0.3);
  ctx.bezierCurveTo(
    player.x - player.radius * 0.5, player.y - player.radius * 0.5,
    player.x - player.radius * 0.7, player.y - player.radius * 0.2,
    player.x - player.radius * 0.5, player.y + player.radius * 0.1
  );
  ctx.bezierCurveTo(
    player.x - player.radius * 0.3, player.y + player.radius * 0.2,
    player.x - player.radius * 0.1, player.y + player.radius * 0.1,
    player.x - player.radius * 0.3, player.y - player.radius * 0.3
  );
  ctx.fillStyle = '#2e8b57'; // Green for landmass
  ctx.fill();
  ctx.closePath();

  // South America
  ctx.beginPath();
  ctx.moveTo(player.x - player.radius * 0.1, player.y + player.radius * 0.2);
  ctx.bezierCurveTo(
    player.x - player.radius * 0.2, player.y + player.radius * 0.4,
    player.x - player.radius * 0.1, player.y + player.radius * 0.6,
    player.x + player.radius * 0.1, player.y + player.radius * 0.4
  );
  ctx.bezierCurveTo(
    player.x + player.radius * 0.2, player.y + player.radius * 0.3,
    player.x + player.radius * 0.1, player.y + player.radius * 0.1,
    player.x - player.radius * 0.1, player.y + player.radius * 0.2
  );
  ctx.fillStyle = '#2e8b57';
  ctx.fill();
  ctx.closePath();

  // Europe and Africa
  ctx.beginPath();
  ctx.moveTo(player.x + player.radius * 0.1, player.y - player.radius * 0.4);
  ctx.bezierCurveTo(
    player.x + player.radius * 0.3, player.y - player.radius * 0.3,
    player.x + player.radius * 0.4, player.y - player.radius * 0.1,
    player.x + player.radius * 0.3, player.y + player.radius * 0.1
  );
  ctx.bezierCurveTo(
    player.x + player.radius * 0.4, player.y + player.radius * 0.3,
    player.x + player.radius * 0.3, player.y + player.radius * 0.5,
    player.x + player.radius * 0.1, player.y + player.radius * 0.4
  );
  ctx.bezierCurveTo(
    player.x + player.radius * 0.0, player.y + player.radius * 0.2,
    player.x - player.radius * 0.1, player.y - player.radius * 0.1,
    player.x + player.radius * 0.1, player.y - player.radius * 0.4
  );
  ctx.fillStyle = '#2e8b57';
  ctx.fill();
  ctx.closePath();

  // Asia and Australia
  ctx.beginPath();
  ctx.moveTo(player.x + player.radius * 0.3, player.y - player.radius * 0.2);
  ctx.bezierCurveTo(
    player.x + player.radius * 0.5, player.y - player.radius * 0.3,
    player.x + player.radius * 0.6, player.y - player.radius * 0.1,
    player.x + player.radius * 0.5, player.y + player.radius * 0.1
  );
  ctx.bezierCurveTo(
    player.x + player.radius * 0.6, player.y + player.radius * 0.2,
    player.x + player.radius * 0.5, player.y + player.radius * 0.3,
    player.x + player.radius * 0.3, player.y + player.radius * 0.2
  );
  ctx.fillStyle = '#2e8b57';
  ctx.fill();
  ctx.closePath();

  // Australia
  ctx.beginPath();
  ctx.arc(player.x + player.radius * 0.5, player.y + player.radius * 0.5, player.radius * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#2e8b57';
  ctx.fill();
  ctx.closePath();

  // Add small white polar caps instead of large circles
  ctx.beginPath();
  ctx.arc(player.x, player.y - player.radius * 0.8, player.radius * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.closePath();

  ctx.beginPath();
  ctx.arc(player.x, player.y + player.radius * 0.8, player.radius * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.closePath();

  // Add subtle atmosphere glow
  const atmosphereGradient = ctx.createRadialGradient(
    player.x, player.y, player.radius * 0.9,
    player.x, player.y, player.radius * 1.3
  );
  atmosphereGradient.addColorStop(0, 'rgba(173, 216, 230, 0.3)'); // Light blue for atmosphere
  atmosphereGradient.addColorStop(1, 'rgba(173, 216, 230, 0)');

  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius * 1.3, 0, Math.PI * 2);
  ctx.fillStyle = atmosphereGradient;
  ctx.fill();
  ctx.closePath();

  // Restore the context state (removes rotation for UI elements)
  ctx.restore();

  // Draw shield indicator ring around Earth (not rotated)
  const shieldPercentage = player.shield / player.maxShield;
  const shieldRadius = player.radius + 8;

  // Shield background (darker ring)
  ctx.beginPath();
  ctx.arc(player.x, player.y, shieldRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.closePath();

  // Shield foreground (bright ring showing current shield)
  if (shieldPercentage > 0) {
    const startAngle = -Math.PI / 2; // Start from top
    const endAngle = startAngle + (Math.PI * 2 * shieldPercentage);

    ctx.beginPath();
    ctx.arc(player.x, player.y, shieldRadius, startAngle, endAngle);

    // Color based on shield level
    let shieldColor;
    if (shieldPercentage > 0.6) {
      shieldColor = '#00ff00'; // Green for high shield
    } else if (shieldPercentage > 0.3) {
      shieldColor = '#ffff00'; // Yellow for medium shield
    } else {
      shieldColor = '#ff0000'; // Red for low shield
    }

    ctx.strokeStyle = shieldColor;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.closePath();

    // Add glow effect to shield
    ctx.shadowColor = shieldColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(player.x, player.y, shieldRadius, startAngle, endAngle);
    ctx.strokeStyle = shieldColor;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.closePath();

    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  }
};

/**
 * Draw an enemy
 */
export const drawEnemy = (ctx: CanvasRenderingContext2D, enemy: any): void => {
  const pulseAmount = enemy.pulsePhase ? Math.sin(enemy.pulsePhase) * 0.1 : 0; // Reduced pulse for performance
  const glowSize = enemy.radius * (1.1 + pulseAmount); // Reduced glow size

  // Enhanced lightning-like glow effects for all enemies with performance optimization
  if (enemy.glowColor) {
    // Create different glow intensities based on enemy type
    let glowIntensity = 0.3; // Base glow for regular enemies
    let glowLayers = 2; // Number of glow layers
    if (enemy.isElite) {
      glowIntensity = 0.5;
      glowLayers = 3;
    }
    if (enemy.isBoss) {
      glowIntensity = 0.7;
      glowLayers = 4;
    }

    // Create multiple layers for lightning-like effect
    for (let layer = 0; layer < glowLayers; layer++) {
      const layerRadius = glowSize * (1.2 + layer * 0.3);
      const layerIntensity = glowIntensity * (1 - layer * 0.25);

      // Use radial gradient for better lightning effect
      const glowGradient = ctx.createRadialGradient(
        enemy.x, enemy.y, enemy.radius * 0.6,
        enemy.x, enemy.y, layerRadius
      );

      if (enemy.isFrozen) {
        // Special frozen lightning glow effect
        glowGradient.addColorStop(0, `rgba(150, 220, 255, ${layerIntensity})`);
        glowGradient.addColorStop(0.3, `rgba(100, 180, 255, ${layerIntensity * 0.8})`);
        glowGradient.addColorStop(0.6, `rgba(200, 240, 255, ${layerIntensity * 0.4})`);
        glowGradient.addColorStop(1, 'rgba(150, 220, 255, 0)');
      } else {
        // Enhanced lightning glow with multiple color stops for electrical effect
        const baseColor = enemy.glowColor.replace(')', `, ${layerIntensity})`);
        const midColor = enemy.glowColor.replace(')', `, ${layerIntensity * 0.6})`);
        const edgeColor = enemy.glowColor.replace(')', `, ${layerIntensity * 0.2})`);

        glowGradient.addColorStop(0, baseColor);
        glowGradient.addColorStop(0.2, baseColor.replace(layerIntensity.toString(), (layerIntensity * 1.2).toString()));
        glowGradient.addColorStop(0.4, midColor);
        glowGradient.addColorStop(0.7, edgeColor);
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }

      ctx.save();
      // Add slight random offset for lightning flicker effect (only for visible enemies)
      const flickerX = (Math.random() - 0.5) * 2;
      const flickerY = (Math.random() - 0.5) * 2;

      ctx.beginPath();
      ctx.arc(enemy.x + flickerX, enemy.y + flickerY, layerRadius, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();
      ctx.closePath();
      ctx.restore();
    }
  }

  // Determine enemy type based on shape property
  if (enemy.shape === 'hexagon') {
    // Elite enemies are UFOs
    drawUFO(ctx, enemy);
  } else if (enemy.shape === 'octagon') {
    // Boss enemies are large meteors
    drawMeteor(ctx, enemy, true);
  } else {
    // Regular enemies are small space crafts
    drawSpaceCraft(ctx, enemy);
  }

  // Draw enemy word - positioned based on spawn side for better visibility
  ctx.font = 'bold 24px Arial'; // Increased from 16px to 24px for better visibility
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Position text based on spawn side for better visibility
  let textY;
  if (enemy.spawnSide === 'top') {
    // Show text below enemy when spawning from top for better visibility
    textY = enemy.y + enemy.radius + 25;
  } else {
    // Show text above enemy for other spawn sides
    textY = enemy.y - enemy.radius - 20;
  }

  // Draw enemy word with highlighting if it's the highlighted enemy
  if (enemy.isHighlighted && enemy.typedProgress > 0) {
    // Calculate the number of characters typed based on progress
    const typedLength = Math.floor(enemy.typedProgress * enemy.word.length);
    const typedPortion = enemy.word.substring(0, typedLength);
    const remainingPortion = enemy.word.substring(typedLength);

    // Measure text to position the parts correctly
    const typedWidth = ctx.measureText(typedPortion).width;
    const totalWidth = ctx.measureText(enemy.word).width;
    const remainingWidth = ctx.measureText(remainingPortion).width;

    // Determine typed portion color based on flash effect
    const typedColor = enemy.wrongTypingFlash > 0 ?
      `rgba(255, 0, 0, ${0.8 + enemy.wrongTypingFlash * 0.2})` : // Red with intensity
      '#00ff00'; // Bright green

    // Calculate positioning for each portion
    const startX = enemy.x - totalWidth / 2;
    const typedX = startX + typedWidth / 2;
    const remainingX = startX + typedWidth + remainingWidth / 2;

    // Draw background stroke for both portions
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.strokeText(enemy.word, enemy.x, textY);

    // Draw typed portion with appropriate color and glow
    if (enemy.wrongTypingFlash > 0) {
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 15 * enemy.wrongTypingFlash;
    } else {
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 12;
    }
    ctx.fillStyle = typedColor;
    ctx.textAlign = 'left';
    ctx.fillText(typedPortion, startX, textY);

    // Reset shadow and draw remaining portion (white)
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // Determine remaining text color based on enemy type
    let remainingColor = '#ffffff'; // Default white
    if (enemy.enemyType === 'blue') {
      remainingColor = '#4A90E2'; // Blue for bouncing enemies
    } else if (enemy.enemyType === 'purple') {
      remainingColor = '#8B5CF6'; // Purple for multi-shot enemies
    }

    ctx.fillStyle = remainingColor;
    ctx.fillText(remainingPortion, startX + typedWidth, textY);

    // Reset text alignment
    ctx.textAlign = 'center';
  } else {
    // Draw normal text with stroke
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.strokeText(enemy.word, enemy.x, textY);

    // Determine text color based on enemy type and highlight status
    let textColor = '#ffffff'; // Default white

    if (enemy.enemyType === 'blue') {
      textColor = '#4A90E2'; // Blue for bouncing enemies
    } else if (enemy.enemyType === 'purple') {
      textColor = '#8B5CF6'; // Purple for multi-shot enemies
    }

    // Override with yellow if highlighted (but not when typing is in progress)
    if (enemy.isHighlighted && enemy.typedProgress === 0) {
      textColor = '#ffff00'; // Yellow for highlighted enemies
    }

    ctx.fillStyle = textColor;
    ctx.fillText(enemy.word, enemy.x, textY);
  }

  // Draw HP bar positioned right below the text with proper spacing
  drawEnemyHPBar(ctx, enemy, textY);

  // Enhanced frozen effect with good performance
  if (enemy.isFrozen) {
    drawFrozenEffect(ctx, enemy);
  }
};

/**
 * Draw HP bar below enemy
 */
const drawEnemyHPBar = (ctx: CanvasRenderingContext2D, enemy: any, textY: number): void => {
  const barWidth = enemy.radius * 2; // Bar width relative to enemy size
  const barHeight = 4; // Fixed height for performance
  const barX = enemy.x - barWidth / 2;
  const barY = textY + 12; // Position below text with tighter spacing (reduced from 20 to 12)

  // Calculate HP percentage
  const hpPercentage = Math.max(0, enemy.health / enemy.maxHealth);

  // Draw background bar
  ctx.fillStyle = 'rgba(60, 60, 60, 0.8)';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Determine HP bar color based on health percentage
  let barColor;
  if (hpPercentage > 0.6) {
    barColor = '#4ade80'; // Green - healthy
  } else if (hpPercentage > 0.3) {
    barColor = '#facc15'; // Yellow - damaged
  } else {
    barColor = '#ef4444'; // Red - critical
  }

  // Draw HP fill with slight glow for better visibility
  const fillWidth = barWidth * hpPercentage;
  if (fillWidth > 0) {
    // Add subtle glow effect to HP bar
    ctx.shadowColor = barColor;
    ctx.shadowBlur = 2;
    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, fillWidth, barHeight);

    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  }

  // Add border for definition
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
};

/**
 * Draw a space craft enemy (regular enemies)
 */
const drawSpaceCraft = (ctx: CanvasRenderingContext2D, enemy: any): void => {
  const radius = enemy.radius;

  // Draw the main body of the spacecraft
  ctx.beginPath();
  ctx.moveTo(enemy.x - radius, enemy.y);
  ctx.lineTo(enemy.x - radius * 0.5, enemy.y - radius * 0.5);
  ctx.lineTo(enemy.x + radius * 0.5, enemy.y - radius * 0.5);
  ctx.lineTo(enemy.x + radius, enemy.y);
  ctx.lineTo(enemy.x + radius * 0.5, enemy.y + radius * 0.5);
  ctx.lineTo(enemy.x - radius * 0.5, enemy.y + radius * 0.5);
  ctx.closePath();

  // Use simple solid color instead of gradient for better performance
  ctx.fillStyle = enemy.color;
  ctx.fill();

  // Simple border for depth
  ctx.strokeStyle = shadeColor(enemy.color, -20);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw the cockpit
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, radius * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(200, 230, 255, 0.7)';
  ctx.fill();
  ctx.closePath();

  // Simplified engine glow
  ctx.beginPath();
  ctx.moveTo(enemy.x - radius * 0.3, enemy.y + radius * 0.5);
  ctx.lineTo(enemy.x - radius * 0.1, enemy.y + radius * 0.7);
  ctx.lineTo(enemy.x + radius * 0.1, enemy.y + radius * 0.7);
  ctx.lineTo(enemy.x + radius * 0.3, enemy.y + radius * 0.5);
  ctx.closePath();

  ctx.fillStyle = '#ff9900'; // Simple orange color
  ctx.fill();
};

/**
 * Draw a UFO enemy (elite enemies)
 */
const drawUFO = (ctx: CanvasRenderingContext2D, enemy: any): void => {
  const radius = enemy.radius;

  // Draw the main saucer body
  ctx.beginPath();
  ctx.ellipse(enemy.x, enemy.y, radius, radius * 0.4, 0, 0, Math.PI * 2);

  // Use simple solid color instead of complex gradient
  ctx.fillStyle = enemy.color;
  ctx.fill();

  // Simple border for depth
  ctx.strokeStyle = shadeColor(enemy.color, -30);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();

  // Draw the dome
  ctx.beginPath();
  ctx.ellipse(enemy.x, enemy.y - radius * 0.2, radius * 0.6, radius * 0.3, 0, Math.PI, 0, true);
  ctx.fillStyle = 'rgba(150, 200, 255, 0.7)'; // Simple blue color
  ctx.fill();
  ctx.closePath();

  // Simplified lights around the saucer - only 4 instead of 8
  const lightCount = 4;
  for (let i = 0; i < lightCount; i++) {
    const angle = (Math.PI * 2 / lightCount) * i;
    const x = enemy.x + Math.cos(angle) * radius * 0.8;
    const y = enemy.y + Math.sin(angle) * radius * 0.3;

    ctx.beginPath();
    ctx.arc(x, y, radius * 0.08, 0, Math.PI * 2); // Smaller lights
    ctx.fillStyle = i % 2 === 0 ? '#ffcc00' : '#ff3300';
    ctx.fill();
    ctx.closePath();
  }
};

/**
 * Draw a meteor enemy (boss enemies)
 */
const drawMeteor = (ctx: CanvasRenderingContext2D, enemy: any, isBoss: boolean = false): void => {
  const radius = enemy.radius;

  // Cache crater data on enemy object to avoid regenerating every frame
  if (!enemy.craterCache) {
    enemy.craterCache = [];
    const craterCount = isBoss ? 7 : 4;
    for (let i = 0; i < craterCount; i++) {
      enemy.craterCache.push({
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * radius * 0.7,
        size: radius * (0.1 + Math.random() * 0.15)
      });
    }
  }

  // Draw the main meteor body - use simpler shape for performance
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, radius, 0, Math.PI * 2);
  ctx.closePath();

  // Create a gradient fill for the meteor
  const meteorGradient = ctx.createRadialGradient(
    enemy.x - radius * 0.3, enemy.y - radius * 0.3, 0,
    enemy.x, enemy.y, radius
  );

  if (isBoss) {
    // Fiery red/orange for boss meteors
    meteorGradient.addColorStop(0, '#ff9900');
    meteorGradient.addColorStop(0.6, '#cc3300');
    meteorGradient.addColorStop(1, '#330000');
  } else {
    // Grey/brown for regular meteors
    meteorGradient.addColorStop(0, lightenColor(enemy.color, 30));
    meteorGradient.addColorStop(0.6, enemy.color);
    meteorGradient.addColorStop(1, shadeColor(enemy.color, -50));
  }

  ctx.fillStyle = meteorGradient;
  ctx.fill();

  // Draw craters using cached data
  for (const crater of enemy.craterCache) {
    const x = enemy.x + Math.cos(crater.angle) * crater.distance;
    const y = enemy.y + Math.sin(crater.angle) * crater.distance;

    ctx.beginPath();
    ctx.arc(x, y, crater.size, 0, Math.PI * 2);

    // Simplified crater without gradient for performance
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fill();
    ctx.closePath();
  }

  // Add fiery trail for boss meteors - simplified
  if (isBoss && enemy.velocityX && enemy.velocityY) {
    const trailLength = radius * 1.2; // Reduced trail length
    const trailWidth = radius * 0.6; // Reduced trail width

    // Use pre-calculated velocity direction
    const mag = Math.sqrt(enemy.velocityX * enemy.velocityX + enemy.velocityY * enemy.velocityY);
    const nx = -enemy.velocityX / mag;
    const ny = -enemy.velocityY / mag;

    // Draw simplified fire trail
    ctx.beginPath();
    ctx.moveTo(
      enemy.x - nx * radius * 0.8 + ny * trailWidth/2,
      enemy.y - ny * radius * 0.8 - nx * trailWidth/2
    );
    ctx.lineTo(
      enemy.x - nx * radius * 0.8 - ny * trailWidth/2,
      enemy.y - ny * radius * 0.8 + nx * trailWidth/2
    );
    ctx.lineTo(
      enemy.x - nx * (radius + trailLength),
      enemy.y - ny * (radius + trailLength)
    );
    ctx.closePath();

    // Use simpler gradient with fewer color stops
    const fireGradient = ctx.createLinearGradient(
      enemy.x, enemy.y,
      enemy.x - nx * (radius + trailLength),
      enemy.y - ny * (radius + trailLength)
    );
    fireGradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
    fireGradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.6)');
    fireGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

    ctx.fillStyle = fireGradient;
    ctx.fill();
  }
};

/**
 * Draw a background grid effect
 */
export const drawGrid = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
  const gridSize = 40;
  const time = performance.now() / 5000;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 0.5;

  // Draw horizontal lines
  for (let y = 0; y < canvasHeight; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }

  // Draw vertical lines
  for (let x = 0; x < canvasWidth; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();
  }

  // Draw accent lines that move
  const accentOffset = Math.sin(time) * 100 + 100;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(0, accentOffset);
  ctx.lineTo(canvasWidth, accentOffset);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(accentOffset, 0);
  ctx.lineTo(accentOffset, canvasHeight);
  ctx.stroke();
};

/**
 * Draw the animated background with stars and gradient
 */
export const drawBackground = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  stars: { x: number, y: number, size: number, speed: number, opacity: number }[],
  backgroundGradient: {
    colors: string[],
    positions: number[],
    currentIndex: number,
    transitionProgress: number
  },
  deltaTime: number
) => {
  // Update background gradient transition
  const updatedTransitionProgress = backgroundGradient.transitionProgress + deltaTime * 0.05;
  let updatedCurrentIndex = backgroundGradient.currentIndex;

  if (updatedTransitionProgress >= 1) {
    updatedCurrentIndex = (backgroundGradient.currentIndex + 1) % (backgroundGradient.colors.length - 1);
  }

  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);

  // Get current and next colors
  const currentIdx = backgroundGradient.currentIndex;
  const progress = backgroundGradient.transitionProgress;

  // Interpolate between colors
  for (let i = 0; i < backgroundGradient.positions.length; i++) {
    const color1 = hexToRgb(backgroundGradient.colors[i]);
    const color2 = hexToRgb(backgroundGradient.colors[(i + 1) % backgroundGradient.colors.length]);

    if (color1 && color2) {
      const r = Math.floor(color1.r + (color2.r - color1.r) * progress);
      const g = Math.floor(color1.g + (color2.g - color1.g) * progress);
      const b = Math.floor(color1.b + (color2.b - color1.b) * progress);

      gradient.addColorStop(backgroundGradient.positions[i], `rgb(${r}, ${g}, ${b})`);
    }
  }

  // Draw background
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Update and draw stars
  for (const star of stars) {
    // Move stars
    star.y += star.speed * deltaTime;

    // Wrap stars around when they go off screen
    if (star.y > canvasHeight) {
      star.y = 0;
      star.x = Math.random() * canvasWidth;
    }

    // Draw star
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
    ctx.fill();
    ctx.closePath();
  }

  // Add a subtle grid effect
  drawGrid(ctx, canvasWidth, canvasHeight);

  // Return updated values
  return {
    transitionProgress: updatedTransitionProgress >= 1 ? 0 : updatedTransitionProgress,
    currentIndex: updatedCurrentIndex
  };
};

/**
 * Draw enhanced frozen effect
 */
const drawFrozenEffect = (ctx: CanvasRenderingContext2D, enemy: any): void => {
  const radius = enemy.radius;

  // Ice overlay with crystalline pattern
  ctx.save();
  ctx.globalAlpha = 0.7;

  // Main ice overlay
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(150, 220, 255, 0.3)';
  ctx.fill();

  // Ice crystal border
  ctx.strokeStyle = 'rgba(180, 240, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();

  // Draw ice crystal patterns
  ctx.strokeStyle = 'rgba(200, 240, 255, 0.6)';
  ctx.lineWidth = 1.5;

  // Create crystalline pattern with 6 main spokes
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const spokeLength = radius * 0.8;

    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y);
    ctx.lineTo(
      enemy.x + Math.cos(angle) * spokeLength,
      enemy.y + Math.sin(angle) * spokeLength
    );
    ctx.stroke();

    // Add small branches to the spokes
    const branchLength = radius * 0.3;
    const branchX = enemy.x + Math.cos(angle) * spokeLength * 0.6;
    const branchY = enemy.y + Math.sin(angle) * spokeLength * 0.6;

    // Left branch
    ctx.beginPath();
    ctx.moveTo(branchX, branchY);
    ctx.lineTo(
      branchX + Math.cos(angle + Math.PI / 4) * branchLength,
      branchY + Math.sin(angle + Math.PI / 4) * branchLength
    );
    ctx.stroke();

    // Right branch
    ctx.beginPath();
    ctx.moveTo(branchX, branchY);
    ctx.lineTo(
      branchX + Math.cos(angle - Math.PI / 4) * branchLength,
      branchY + Math.sin(angle - Math.PI / 4) * branchLength
    );
    ctx.stroke();
  }

  // Add sparkle effects (small ice crystals)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  for (let i = 0; i < 8; i++) {
    const sparkleAngle = (Math.PI * 2 / 8) * i;
    const sparkleDistance = radius * (0.4 + Math.random() * 0.4);
    const sparkleX = enemy.x + Math.cos(sparkleAngle) * sparkleDistance;
    const sparkleY = enemy.y + Math.sin(sparkleAngle) * sparkleDistance;

    ctx.beginPath();
    ctx.arc(sparkleX, sparkleY, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }

  ctx.restore();
};