
export enum GameState {
  BOOT = 'BOOT',
  START = 'START',
  LEVEL_SELECT = 'LEVEL_SELECT',
  NARRATIVE = 'NARRATIVE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  ABOUT = 'ABOUT',
  GAMEOVER = 'GAMEOVER',
  VICTORY = 'VICTORY'
}

export type EnemyType = 'orb' | 'tank' | 'diver' | 'shooter' | 'boss' | 'midboss' | 'cluster' | 'mini' | 'sentry' | 'sweeper' | 'warden' | 'rusher';

export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
}

export interface Bullet extends GameObject {
  owner: 'player' | 'enemy';
  isHoming?: boolean;
  isPiercing?: boolean;
  damage?: number;
}

export interface Enemy extends GameObject {
  type: EnemyType;
  hp: number;
  maxHp: number;
  shootTimer?: number;
  isDiving?: boolean;
  phase?: number;
  sineOffset?: number;
}

export interface Platform extends GameObject {}

export type PowerUpType = 'shield' | 'life' | 'multishot' | 'bomb' | 'coolant' | 'pierce' | 'slow' | 'rapid' | 'spread' | 'laser' | 'magnet' | 'overdrive';

export interface PowerUp extends GameObject {
  type: PowerUpType;
}

export interface Particle extends GameObject {
  color: string;
  life: number;
  size: number;
}
