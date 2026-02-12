
import type { EnemyType } from './types';

export const COLORS = {
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  RED: '#FF4136',
  BLUE: '#0074D9',
  YELLOW: '#FFDC00',
  GRAY: '#AAAAAA',
  DARK_GRAY: '#555555',
  GREEN: '#2ECC40',
  ORANGE: '#FF851B',
  PURPLE: '#B10DC9',
  CYAN: '#7FDBFF',
  MAGENTA: '#F012BE'
};

export const SCREEN_WIDTH = 320;
export const SCREEN_HEIGHT = 480;
export const PLAYER_SIZE = 16;
export const BULLET_SIZE = 4;
export const ENEMY_SIZE = 16;
export const BOSS_SIZE = 64;
export const PLATFORM_WIDTH = 32;
export const PLATFORM_HEIGHT = 8;
export const OVERHEAT_THRESHOLD_SECONDS = 2.0;
export const RAPID_FIRE_THRESHOLD = 5;
export const COMBO_TIMEOUT = 1500;

export interface LevelWave {
  type: EnemyType;
  count: number;
  spawnInterval?: number;
  burst?: number;
}

export interface StoryLevel {
  title: string;
  intro: string;
  waves: LevelWave[];
}

export const STORY_LEVELS: StoryLevel[] = [
  {
    title: "Sector 01: Ember Boot",
    intro: "The city-core coughs awake, heat alarms already screaming. You are the last hotfix drone on the grid. Tap fire, cool, and keep the chassis intact.",
    waves: [
      { type: 'orb', count: 10, spawnInterval: 55 },
      { type: 'diver', count: 8, spawnInterval: 50 },
      { type: 'midboss', count: 1, spawnInterval: 80 },
      { type: 'tank', count: 6, spawnInterval: 60 },
      { type: 'shooter', count: 6, spawnInterval: 55 }
    ]
  },
  {
    title: "Sector 02: Trace Cascade",
    intro: "Helix, the thermal overseer, tags your wake. Sentries line the ducts and spike your heat window. Tap, release, breathe.",
    waves: [
      { type: 'sentry', count: 10, spawnInterval: 52 },
      { type: 'orb', count: 12, spawnInterval: 48 },
      { type: 'midboss', count: 1, spawnInterval: 80 },
      { type: 'diver', count: 10, spawnInterval: 46 },
      { type: 'tank', count: 8, spawnInterval: 58 }
    ]
  },
  {
    title: "Sector 03: Split-Lattice",
    intro: "The lattice fractures into swarm logic. Cluster cores split on impact and mini-cells collapse your lanes.",
    waves: [
      { type: 'cluster', count: 12, spawnInterval: 50 },
      { type: 'orb', count: 16, spawnInterval: 45 },
      { type: 'midboss', count: 1, spawnInterval: 78 },
      { type: 'shooter', count: 12, spawnInterval: 50 },
      { type: 'sweeper', count: 10, spawnInterval: 52 }
    ]
  },
  {
    title: "Sector 04: Ghost Dive",
    intro: "Dive units phase out, then cut across your line. Helix splices their timing. Stay cold, stay sharp.",
    waves: [
      { type: 'diver', count: 20, spawnInterval: 44 },
      { type: 'midboss', count: 1, spawnInterval: 78 },
      { type: 'sweeper', count: 12, spawnInterval: 48 },
      { type: 'tank', count: 10, spawnInterval: 58 },
      { type: 'shooter', count: 10, spawnInterval: 46 }
    ]
  },
  {
    title: "Sector 05: Flux Rain",
    intro: "Thermal storms shake the mid-core. The grid flickers, vents lag, and Warden arrays lock the lanes.",
    waves: [
      { type: 'orb', count: 20, spawnInterval: 42 },
      { type: 'sentry', count: 12, spawnInterval: 46 },
      { type: 'warden', count: 8, spawnInterval: 56 },
      { type: 'midboss', count: 1, spawnInterval: 76 },
      { type: 'cluster', count: 10, spawnInterval: 50 },
      { type: 'diver', count: 12, spawnInterval: 44 }
    ]
  },
  {
    title: "Sector 06: Coldglass Vault",
    intro: "A sealed vault of frozen cores. Helix tries to lock the doors behind you. The chill helps, but the guard swarm is thicker.",
    waves: [
      { type: 'sweeper', count: 16, spawnInterval: 40 },
      { type: 'rusher', count: 10, spawnInterval: 52 },
      { type: 'midboss', count: 1, spawnInterval: 74 },
      { type: 'orb', count: 22, spawnInterval: 40 },
      { type: 'shooter', count: 16, spawnInterval: 44 },
      { type: 'tank', count: 12, spawnInterval: 56 }
    ]
  },
  {
    title: "Sector 07: Heavy Logic",
    intro: "Armor cores roll in. Tanks stack in columns while sentries rake your heat gauge. Find a rhythm or melt out.",
    waves: [
      { type: 'tank', count: 22, spawnInterval: 54 },
      { type: 'midboss', count: 1, spawnInterval: 72 },
      { type: 'sentry', count: 16, spawnInterval: 44 },
      { type: 'warden', count: 10, spawnInterval: 58 },
      { type: 'diver', count: 16, spawnInterval: 42 },
      { type: 'orb', count: 18, spawnInterval: 40 }
    ]
  },
  {
    title: "Sector 08: Recursive Nightmare",
    intro: "Every kill splits the logic into smaller shards. The longer you last, the denser it becomes. Bombs are your exhale.",
    waves: [
      { type: 'cluster', count: 18, spawnInterval: 44 },
      { type: 'midboss', count: 1, spawnInterval: 70 },
      { type: 'diver', count: 18, spawnInterval: 40 },
      { type: 'sweeper', count: 16, spawnInterval: 42 },
      { type: 'shooter', count: 16, spawnInterval: 44 },
      { type: 'rusher', count: 12, spawnInterval: 50 }
    ]
  },
  {
    title: "Sector 09: Gatekeeper Gauntlet",
    intro: "All defense strata converge. Helix shifts into active suppression. Your heat window is razor thin. Tap, move, tap.",
    waves: [
      { type: 'tank', count: 18, spawnInterval: 52 },
      { type: 'midboss', count: 1, spawnInterval: 68 },
      { type: 'shooter', count: 18, spawnInterval: 44 },
      { type: 'sentry', count: 16, spawnInterval: 42 },
      { type: 'warden', count: 10, spawnInterval: 56 },
      { type: 'diver', count: 18, spawnInterval: 40 },
      { type: 'orb', count: 22, spawnInterval: 38 }
    ]
  },
  {
    title: "Sector 10: Helix Crown",
    intro: "Helix manifests as a core emperor. It cycles through three thermal phases, spawns watchers, and compresses your heat window. Break the crown or burn.",
    waves: [
      { type: 'sentry', count: 14, spawnInterval: 40 },
      { type: 'sweeper', count: 16, spawnInterval: 38 },
      { type: 'midboss', count: 1, spawnInterval: 66 },
      { type: 'cluster', count: 12, spawnInterval: 42 },
      { type: 'warden', count: 10, spawnInterval: 52 },
      { type: 'boss', count: 1 }
    ]
  }
];
