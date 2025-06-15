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
}

export interface Player {
  x: number;
  y: number;
  radius: number;
  color: string;
  innerColor: string;
  glowColor: string;
  glowSize: number;
}

export interface GameState {
  isGameOver: boolean;
  isPlaying: boolean;
  score: number;
  enemies: Enemy[];
  player: Player;
  lastEnemyId: number;
  spawnInterval: number;
  difficulty: number;
}

export const createEnemy = (
  id: number,
  x: number,
  y: number,
  word: string,
  color: string,
  speed: number,
  canvasWidth: number,
  canvasHeight: number
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
  
  // Create a glow color based on the main color but lighter
  const glowColor = lightenColor(color, 50);
  
  return {
    id,
    x,
    y,
    word,
    color,
    radius: 20, // Fixed radius for all enemies
    velocityX,
    velocityY,
    speed,
    glowColor,
    pulsePhase: Math.random() * Math.PI * 2, // Random starting phase for pulsing effect
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
  };
};

export const createInitialGameState = (canvasWidth: number, canvasHeight: number): GameState => {
  return {
    isGameOver: false,
    isPlaying: false,
    score: 0,
    enemies: [],
    player: createPlayer(canvasWidth / 2, canvasHeight / 2),
    lastEnemyId: 0,
    spawnInterval: 2500, // Increased from 2000ms to give more time between spawns
    difficulty: 1, // Difficulty multiplier
  };
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