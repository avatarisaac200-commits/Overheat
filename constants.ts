
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
    title: "Sector 01: The Breach",
    intro: "A localized glitch has been detected in the boot sector. They are small, weak, and disorganized. Delete them before they replicate. Watch your core temperature.",
    waves: [
      { type: 'tank', count: 6 },
      { type: 'diver', count: 4 },
      { type: 'orb', count: 5 }
    ]
  },
  {
    title: "Sector 02: Firewall Fault",
    intro: "The Empire has deployed 'Shooters'. These drones will target your heat signature directly. Precision fire is required. Keep moving, Bouncer.",
    waves: [
      { type: 'shooter', count: 8 },
      { type: 'tank', count: 6 },
      { type: 'diver', count: 5 }
    ]
  },
  {
    title: "Sector 03: Splitting Signal",
    intro: "Intelligence reports 'Cluster' cells. Destroying one will cause it to fracture into smaller, faster fragments. Don't get surrounded in the code debris.",
    waves: [
      { type: 'cluster', count: 6 },
      { type: 'orb', count: 10 },
      { type: 'shooter', count: 5 }
    ]
  },
  {
    title: "Sector 04: Ghost Protocol",
    intro: "Sensors are failing. Stealth 'Divers' are coming out of the shadows at high speeds. Your reflexes will be tested. Stay cool, or explode.",
    waves: [
      { type: 'diver', count: 15 },
      { type: 'tank', count: 10 }
    ]
  },
  {
    title: "Sector 05: Data Storm",
    intro: "We're halfway to the core. The Glitch Empire is throwing everything at us. It's a binary blizzard. Grab those power-ups—you're going to need them.",
    waves: [
      { type: 'orb', count: 12 },
      { type: 'shooter', count: 8 },
      { type: 'cluster', count: 4 }
    ]
  },
  {
    title: "Sector 06: Sub-Zero Buffer",
    intro: "Temperature regulation is getting harder. The enemies are more aggressive. 'Orbs' are performing complex sine maneuvers to evade your shots.",
    waves: [
      { type: 'orb', count: 20 },
      { type: 'diver', count: 8 }
    ]
  },
  {
    title: "Sector 07: Heavy Logic",
    intro: "The Elite Guard has arrived. High-HP 'Tanks' are forming a wall. You'll need sustained fire—but be careful not to trigger an overheat event.",
    waves: [
      { type: 'tank', count: 20 },
      { type: 'shooter', count: 10 }
    ]
  },
  {
    title: "Sector 08: Recursive Nightmare",
    intro: "The code is looping! Clusters within clusters. The screen will be filled with mini-glitches. Use your bombs wisely.",
    waves: [
      { type: 'cluster', count: 12 },
      { type: 'diver', count: 10 }
    ]
  },
  {
    title: "Sector 09: Gatekeeper's Gauntlet",
    intro: "The Emperor's personal guard. Every type of glitch is here, coordinated and deadly. Survive this, and the core is yours to save.",
    waves: [
      { type: 'tank', count: 10 },
      { type: 'shooter', count: 10 },
      { type: 'diver', count: 10 },
      { type: 'orb', count: 10 }
    ]
  },
  {
    title: "Sector 10: The Core Emperor",
    intro: "The source of the corruption. A massive, multi-phase entity that warps space itself. Everything is on the line. Stabilize the core... or burn with it.",
    waves: [
      { type: 'boss', count: 1 }
    ]
  }
];