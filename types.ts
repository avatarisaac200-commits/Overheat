
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAMEOVER = 'GAMEOVER'
}

export type EnemyType = 'orb' | 'tank' | 'diver' | 'shooter' | 'boss';

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
}

export interface Enemy extends GameObject {
  type: EnemyType;
  hp: number;
  maxHp: number;
  shootTimer?: number;
  isDiving?: boolean;
}

export interface Platform extends GameObject {}

export type PowerUpType = 'shield' | 'life' | 'multishot' | 'bomb';

export interface PowerUp extends GameObject {
  type: PowerUpType;
}

export interface Particle extends GameObject {
  color: string;
  life: number;
  size: number;
}
