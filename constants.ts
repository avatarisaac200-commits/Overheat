
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

export const STORY_LEVELS = [
  {
    title: "Level 1: Boot Sector Breach",
    intro: "The Glitch Empire's scouts probe the outer rim. Simple foes, but a test of your control.",
    waves: [
      { type: 'tank', count: 5 },
      { type: 'diver', count: 3 },
      { type: 'boss', subtype: 'cluster_mini', count: 1 }
    ]
  },
  {
    title: "Level 2: Fragmented Firewall",
    intro: "Deeper into the code wall—enemies now fire back. Dodge or shield up!",
    waves: [
      { type: 'shooter', count: 6 },
      { type: 'diver', count: 6 }
    ]
  },
  {
    title: "Level 3: Virus Vortex",
    intro: "A swirling storm of code debris. Clusters spawn chaos—split them wisely.",
    waves: [
      { type: 'cluster', count: 8 },
      { type: 'diver', count: 4 }
    ]
  },
  {
    title: "Level 4: Echo Chamber Assault",
    intro: "Echoes of past breaches rebound. Precision required.",
    waves: [
      { type: 'shooter', count: 10 }
    ]
  },
  {
    title: "Level 5: Overclock Overload",
    intro: "The system heats up. Faster spawns test your limits—don't overheat!",
    waves: [
      { type: 'orb', count: 15 },
      { type: 'tank', count: 5 }
    ]
  },
  {
    title: "Level 6: Shadow Code Siege",
    intro: "Dark sectors hide stealthy foes. Light them up before they overwhelm.",
    waves: [
      { type: 'shooter', count: 8 },
      { type: 'diver', count: 8 }
    ]
  },
  {
    title: "Level 7: Binary Battlefield",
    intro: "A warzone of binary chaos. Formations tighten—break their ranks.",
    waves: [
      { type: 'tank', count: 12 },
      { type: 'shooter', count: 6 }
    ]
  },
  {
    title: "Level 8: Quantum Quake",
    intro: "Quantum glitches warp reality. Enemies teleport—adapt or explode.",
    waves: [
      { type: 'diver', count: 12 }
    ]
  },
  {
    title: "Level 9: Core Corruption",
    intro: "Nearing the heart. Elite guards swarm—every shot counts.",
    waves: [
      { type: 'tank', count: 10 },
      { type: 'diver', count: 10 },
      { type: 'shooter', count: 10 }
    ]
  },
  {
    title: "Level 10: Emperor's Eclipse",
    intro: "The Glitch Emperor emerges—a colossal glitch with phases of destruction. End this!",
    waves: [
      { type: 'boss', count: 1 }
    ]
  }
];
