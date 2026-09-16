export type GameState = 'idle' | 'playing' | 'paused' | 'gameover';

export interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  velocityY: number;
  gravity: number;
  jumpPower: number;
  grounded: boolean;
  sliding: boolean;
  slideTimer: number;
}

export type ObstacleType = 'wall' | 'laser';

export interface Obstacle {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: ObstacleType;
}

export interface Coin {
  id: number;
  x: number;
  y: number;
  r: number;
  bobOffset: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
}

export interface Building {
  x: number;
  w: number;
  h: number;
  color: string;
  windowRows: number;
  windowCols: number;
  windowsLit: boolean[][];
}

export interface GameStats {
  score: number;
  coins: number;
  highScore: number;
  totalCoins: number;
  speed: number;
}
