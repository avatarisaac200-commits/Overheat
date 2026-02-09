
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  GameState, Bullet, Enemy, Platform, PowerUp, Particle, EnemyType, PowerUpType 
} from '../types';
import { 
  COLORS, SCREEN_WIDTH, SCREEN_HEIGHT, PLAYER_SIZE, 
  BULLET_SIZE, ENEMY_SIZE, PLATFORM_WIDTH, PLATFORM_HEIGHT,
  OVERHEAT_THRESHOLD_SECONDS, RAPID_FIRE_THRESHOLD, BOSS_SIZE, COMBO_TIMEOUT, STORY_LEVELS
} from '../constants';
import { audioService } from '../services/AudioService';

interface GameCanvasProps {
  currentLevelIndex: number;
  onGameOver: (score: number) => void;
  onLevelComplete: () => void;
  gameState: GameState;
  onStateChange: (state: GameState) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ currentLevelIndex, onGameOver, onLevelComplete, gameState, onStateChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [overheatPercent, setOverheatPercent] = useState(0);
  const [activeShield, setActiveShield] = useState(false);
  const [multishotActive, setMultishotActive] = useState(false);
  const [coolantActive, setCoolantActive] = useState(false);
  const [pierceActive, setPierceActive] = useState(false);
  const [slowActive, setSlowActive] = useState(false);
  
  const gameRef = useRef({
    playerX: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2,
    playerY: SCREEN_HEIGHT - 60,
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    powerUps: [] as PowerUp[],
    particles: [] as Particle[],
    score: 0,
    lives: 3,
    frameCount: 0,
    isShooting: false,
    shootStartTime: 0,
    lastShootTime: 0,
    isImmune: 0,
    shieldTimer: 0,
    multishotTimer: 0,
    coolantTimer: 0,
    pierceTimer: 0,
    slowTimer: 0,
    screenShake: 0,
    enemiesSpawnedInLevel: 0,
    levelFinished: false,
    currentWaveIndex: 0
  });

  const resetForLevel = useCallback(() => {
    const g = gameRef.current;
    g.playerX = SCREEN_WIDTH / 2 - PLAYER_SIZE / 2;
    g.bullets = [];
    g.enemies = [];
    g.powerUps = [];
    g.particles = [];
    g.frameCount = 0;
    g.isImmune = 0;
    g.shieldTimer = 0;
    g.multishotTimer = 0;
    g.coolantTimer = 0;
    g.pierceTimer = 0;
    g.slowTimer = 0;
    g.enemiesSpawnedInLevel = 0;
    g.levelFinished = false;
    g.currentWaveIndex = 0;
    g.lives = 3;
    setLives(3);
    setScore(g.score);
    setOverheatPercent(0);
    setActiveShield(false);
    setMultishotActive(false);
    setCoolantActive(false);
    setPierceActive(false);
    setSlowActive(false);
  }, []);

  useEffect(() => {
    if (gameState === GameState.PLAYING) resetForLevel();
  }, [gameState, resetForLevel]);

  const spawnExplosion = (x: number, y: number, color: string, count: number = 10, size: number = 3) => {
    for (let i = 0; i < count; i++) {
      gameRef.current.particles.push({
        x, y, width: size, height: size, size,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color, life: 1.0
      });
    }
  };

  const spawnPowerUp = (x: number, y: number) => {
    const types: PowerUpType[] = ['shield', 'life', 'multishot', 'bomb', 'coolant', 'pierce', 'slow'];
    const type = types[Math.floor(Math.random() * types.length)];
    gameRef.current.powerUps.push({
      x, y, width: 14, height: 14, vx: 0, vy: 1.2, type
    });
  };

  const spawnEnemy = (type: EnemyType, x?: number, y?: number) => {
    const g = gameRef.current;
    const level = currentLevelIndex;
    let hp = 1;
    if (type === 'tank') hp = 4 + Math.floor(level / 2);
    if (type === 'shooter') hp = 2 + Math.floor(level / 4);
    if (type === 'sentry') hp = 3 + Math.floor(level / 4);
    if (type === 'sweeper') hp = 2 + Math.floor(level / 5);
    if (type === 'cluster') hp = 2 + Math.floor(level / 4);
    if (type === 'orb') hp = 1 + Math.floor(level / 6);
    if (type === 'diver') hp = 1 + Math.floor(level / 6);
    if (type === 'midboss') hp = 28 + level * 6;
    if (type === 'boss') hp = currentLevelIndex === 9 ? 240 : 140;
    if (type === 'mini') hp = 1;
    
    let width = type === 'boss' ? BOSS_SIZE : (type === 'midboss' ? 40 : (type === 'mini' ? 8 : ENEMY_SIZE));
    let height = type === 'boss' ? BOSS_SIZE : (type === 'midboss' ? 40 : (type === 'mini' ? 8 : ENEMY_SIZE));
    let vy = type === 'boss' ? 0.35 : (type === 'midboss' ? 0.7 : (
      type === 'orb' ? 2.2 + level * 0.05 :
      type === 'diver' ? 1.5 + level * 0.05 :
      type === 'tank' ? 1.0 + level * 0.03 :
      type === 'shooter' ? 1.3 + level * 0.04 :
      type === 'sentry' ? 0.95 + level * 0.03 :
      type === 'sweeper' ? 0.9 + level * 0.04 :
      1.3 + level * 0.04
    ));
    let vx = 0;
    if (type === 'sweeper') vx = Math.random() < 0.5 ? -1.6 : 1.6;

    g.enemies.push({
      x: x ?? (Math.random() * (SCREEN_WIDTH - width)),
      y: y ?? -height,
      width, height, vx, vy, hp, maxHp: hp, type,
      shootTimer: (type === 'shooter' || type === 'sentry' || type === 'midboss' || type === 'boss') ? 70 : undefined,
      phase: (type === 'boss' || type === 'midboss') ? 1 : 0,
      sineOffset: Math.random() * 1000
    });
    if (type !== 'mini') g.enemiesSpawnedInLevel++;
  };

  const triggerBomb = () => {
    const g = gameRef.current;
    g.screenShake = 25;
    audioService.playBomb();
    g.enemies.forEach(e => {
      spawnExplosion(e.x + e.width/2, e.y + e.height/2, COLORS.WHITE, 15);
      g.score += e.type === 'boss' ? 1000 : 150;
    });
    g.enemies = [];
    setScore(g.score);
  };

  const update = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    const g = gameRef.current;
    const now = Date.now();
    const levelData = STORY_LEVELS[currentLevelIndex];
    g.frameCount++;

    // 1. Spawning Waves
    if (!g.levelFinished) {
      const currentWave = levelData.waves[g.currentWaveIndex];
      if (currentWave) {
        const baseInterval = Math.max(10, 52 - currentLevelIndex * 2);
        const spawnInterval = currentWave.spawnInterval ?? baseInterval;
        const burst = currentWave.burst ?? 1;
        if (g.frameCount % spawnInterval === 0 && g.enemiesSpawnedInLevel < currentWave.count) {
          const remaining = currentWave.count - g.enemiesSpawnedInLevel;
          const toSpawn = Math.min(burst, remaining);
          for (let i = 0; i < toSpawn; i++) spawnEnemy(currentWave.type as EnemyType);
        }

        if (g.enemiesSpawnedInLevel >= currentWave.count && g.enemies.length === 0) {
          if (g.currentWaveIndex < levelData.waves.length - 1) {
            g.currentWaveIndex++;
            g.enemiesSpawnedInLevel = 0;
            g.frameCount = 1; 
          } else {
            g.levelFinished = true;
            setTimeout(() => onLevelComplete(), 1500);
          }
        }
      }
    }

    // 2. Heat & PowerUp Timers
    if (g.shieldTimer > 0) {
      g.shieldTimer--;
      if (g.shieldTimer === 0) setActiveShield(false);
    }
    if (g.multishotTimer > 0) {
      g.multishotTimer--;
      if (g.multishotTimer === 0) setMultishotActive(false);
    }
    if (g.coolantTimer > 0) {
      g.coolantTimer--;
      if (g.coolantTimer === 0) setCoolantActive(false);
    }
    if (g.pierceTimer > 0) {
      g.pierceTimer--;
      if (g.pierceTimer === 0) setPierceActive(false);
    }
    if (g.slowTimer > 0) {
      g.slowTimer--;
      if (g.slowTimer === 0) setSlowActive(false);
    }

    let currentOverheat = 0;
    if (g.isShooting) {
      const duration = (now - g.shootStartTime) / 1000;
      const threshold = OVERHEAT_THRESHOLD_SECONDS * (g.coolantTimer > 0 ? 1.6 : 1);
      currentOverheat = Math.min(1, duration / threshold);
      if (duration >= threshold) { 
        audioService.playExplosion();
        spawnExplosion(g.playerX + PLAYER_SIZE/2, g.playerY + PLAYER_SIZE/2, COLORS.YELLOW, 40, 5);
        onGameOver(g.score); 
        return; 
      }
    }
    setOverheatPercent(currentOverheat);

    // 3. Bullets
    g.bullets.forEach((b, i) => {
      const slowFactor = (g.slowTimer > 0 && b.owner === 'enemy') ? 0.6 : 1;
      if (b.isHoming && b.owner === 'enemy') {
        const dx = g.playerX + PLAYER_SIZE/2 - b.x;
        const dy = g.playerY + PLAYER_SIZE/2 - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        b.vx = (dx / dist) * 2.2;
        b.vy = (dy / dist) * 2.2;
      }
      b.x += b.vx * slowFactor;
      b.y += b.vy * slowFactor;

      if (b.y < -50 || b.y > SCREEN_HEIGHT + 50) {
        g.bullets.splice(i, 1);
        return;
      }
      
      if (b.owner === 'enemy') {
        if (g.isImmune <= 0 && g.shieldTimer <= 0 && b.x < g.playerX + PLAYER_SIZE && b.x + b.width > g.playerX && b.y < g.playerY + PLAYER_SIZE && b.y + b.height > g.playerY) {
          g.lives--; setLives(g.lives);
          audioService.playDamage();
          g.isImmune = 60;
          g.bullets.splice(i, 1);
          if (g.lives <= 0) onGameOver(g.score);
        }
      } else {
        for (let ei = 0; ei < g.enemies.length; ei++) {
          const e = g.enemies[ei];
          if (b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
            if (!b.isPiercing) g.bullets.splice(i, 1);
            e.hp--;
            audioService.playHit();
            if (e.hp <= 0) {
              if (e.type === 'boss' && e.phase && e.phase < 3) {
                e.phase++;
                e.hp = e.maxHp;
                spawnExplosion(e.x + e.width/2, e.y + e.height/2, COLORS.MAGENTA, 30);
                g.screenShake = 20;
              } else if (e.type === 'midboss' && e.phase && e.phase < 2) {
                e.phase++;
                e.hp = Math.floor(e.maxHp * 0.7);
                spawnExplosion(e.x + e.width/2, e.y + e.height/2, COLORS.ORANGE, 24);
                g.screenShake = 14;
              } else {
                if (e.type === 'cluster') {
                  spawnEnemy('mini', e.x, e.y);
                  spawnEnemy('mini', e.x + 8, e.y);
                }
                g.score += e.type === 'boss' ? 5000 : (e.type === 'midboss' ? 1200 : 100);
                setScore(g.score);
                spawnExplosion(e.x + e.width/2, e.y + e.height/2, e.type === 'boss' ? COLORS.MAGENTA : COLORS.RED, 15);
                if (Math.random() < 0.18) spawnPowerUp(e.x, e.y);
                g.enemies.splice(ei, 1);
              }
            }
            break;
          }
        }
      }
    });

    // 4. Enemies
    for (let ei = 0; ei < g.enemies.length; ei++) {
      const e = g.enemies[ei];
      const slowFactor = g.slowTimer > 0 ? 0.6 : 1;
      
      if (e.type === 'orb') {
        e.x += Math.sin((g.frameCount + (e.sineOffset||0)) * 0.1) * 2.5;
      }
      if (e.type === 'diver') {
        if (e.y > SCREEN_HEIGHT * 0.25 && !e.isDiving) {
          e.isDiving = true;
          e.vy = 5.5;
          e.vx = (g.playerX - e.x) / 35;
        }
      }
      if (e.type === 'sweeper') {
        if (e.x <= 0 || e.x + e.width >= SCREEN_WIDTH) e.vx *= -1;
      }
      if (e.type === 'midboss') {
        if (e.y > SCREEN_HEIGHT * 0.18) {
          e.vy = 0.25;
          e.vx = Math.sin((g.frameCount + (e.sineOffset||0)) * 0.04) * 1.6;
        }
      }

      e.x += e.vx * slowFactor;
      e.y += e.vy * slowFactor;

      if (e.y > SCREEN_HEIGHT + 20) {
        if (e.type === 'boss') e.y = -e.height;
        else { g.enemies.splice(ei, 1); ei--; continue; }
      }

      if (e.shootTimer !== undefined) {
        e.shootTimer--;
        if (e.shootTimer <= 0) {
          const bx = e.x + e.width/2;
          const by = e.y + e.height;
          const bulletSpeed = 3.2 + currentLevelIndex * 0.08;
          const shooterEvolve = Math.min(1, g.frameCount / 1800);
          if (e.type === 'boss') {
             if (e.phase === 2) g.bullets.push({ x: bx, y: by, width: 8, height: 8, vx: 0, vy: 0, owner: 'enemy', isHoming: true });
             else {
               g.bullets.push({ x: bx, y: by, width: 5, height: 5, vx: -2, vy: bulletSpeed + 0.6, owner: 'enemy' });
               g.bullets.push({ x: bx, y: by, width: 5, height: 5, vx: 2, vy: bulletSpeed + 0.6, owner: 'enemy' });
               if (e.phase === 3) g.bullets.push({ x: bx, y: by, width: 5, height: 5, vx: 0, vy: bulletSpeed + 2, owner: 'enemy' });
             }
          } else if (e.type === 'midboss') {
            const spread = 1.5 + currentLevelIndex * 0.05;
            g.bullets.push({ x: bx, y: by, width: 5, height: 5, vx: -spread, vy: bulletSpeed + 0.4, owner: 'enemy' });
            g.bullets.push({ x: bx, y: by, width: 5, height: 5, vx: 0, vy: bulletSpeed + 0.8, owner: 'enemy' });
            g.bullets.push({ x: bx, y: by, width: 5, height: 5, vx: spread, vy: bulletSpeed + 0.4, owner: 'enemy' });
          } else if (e.type === 'sentry') {
            const dx = g.playerX + PLAYER_SIZE/2 - bx;
            const dy = g.playerY + PLAYER_SIZE/2 - by;
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;
            g.bullets.push({ x: bx, y: by, width: 4, height: 4, vx: (dx / dist) * (bulletSpeed + 0.6), vy: (dy / dist) * (bulletSpeed + 0.6), owner: 'enemy' });
          } else if (e.type === 'shooter') {
            const spread = 1.8 + shooterEvolve * 1.6;
            g.bullets.push({ x: bx, y: by, width: 4, height: 4, vx: -spread, vy: bulletSpeed, owner: 'enemy' });
            g.bullets.push({ x: bx, y: by, width: 4, height: 4, vx: 0, vy: bulletSpeed + shooterEvolve * 1.2, owner: 'enemy' });
            if (shooterEvolve > 0.5) {
              g.bullets.push({ x: bx, y: by, width: 4, height: 4, vx: spread, vy: bulletSpeed, owner: 'enemy' });
            }
          } else {
            g.bullets.push({ x: bx, y: by, width: 4, height: 4, vx: 0, vy: bulletSpeed, owner: 'enemy' });
          }
          const evolveFactor = e.type === 'shooter' ? (1 - shooterEvolve * 0.4) : 1;
          e.shootTimer = Math.max(32, Math.floor((110 - currentLevelIndex * 6) * evolveFactor));
          audioService.playEnemyShoot();
        }
      }

      if (g.isImmune <= 0 && g.shieldTimer <= 0 && g.playerX < e.x + e.width && g.playerX + PLAYER_SIZE > e.x && g.playerY < e.y + e.height && g.playerY + PLAYER_SIZE > e.y) {
        g.lives--; setLives(g.lives);
        g.isImmune = 60;
        audioService.playDamage();
        if (g.lives <= 0) onGameOver(g.score);
      }
    }

    // 5. PowerUps
    g.powerUps.forEach((p, i) => {
      p.y += p.vy;
      if (p.x < g.playerX + PLAYER_SIZE && p.x + p.width > g.playerX && p.y < g.playerY + PLAYER_SIZE && p.y + p.height > g.playerY) {
        audioService.playPowerup();
        if (p.type === 'shield') { g.shieldTimer = 360; setActiveShield(true); }
        if (p.type === 'life') { g.lives++; setLives(g.lives); }
        if (p.type === 'multishot') { g.multishotTimer = 360; setMultishotActive(true); }
        if (p.type === 'bomb') triggerBomb();
        if (p.type === 'coolant') { 
          g.coolantTimer = 360; 
          g.shootStartTime = Date.now();
          setCoolantActive(true); 
          setOverheatPercent(0);
        }
        if (p.type === 'pierce') { g.pierceTimer = 360; setPierceActive(true); }
        if (p.type === 'slow') { g.slowTimer = 300; setSlowActive(true); }
        g.powerUps.splice(i, 1);
      } else if (p.y > SCREEN_HEIGHT) {
        g.powerUps.splice(i, 1);
      }
    });

    // 6. Visuals
    g.particles.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.02;
      if (p.life <= 0) g.particles.splice(i, 1);
    });

    if (g.isImmune > 0) g.isImmune--;
    if (g.screenShake > 0) g.screenShake *= 0.85;

    // 7. Shooting
    if (g.isShooting && now - g.lastShootTime > 140) {
      const bx = g.playerX + PLAYER_SIZE/2 - BULLET_SIZE/2;
      const by = g.playerY;
      const isPiercing = g.pierceTimer > 0;
      if (g.multishotTimer > 0) {
        g.bullets.push({ x: bx - 8, y: by, width: BULLET_SIZE, height: BULLET_SIZE, vx: -1.2, vy: -8, owner: 'player', isPiercing });
        g.bullets.push({ x: bx, y: by, width: BULLET_SIZE, height: BULLET_SIZE, vx: 0, vy: -8, owner: 'player', isPiercing });
        g.bullets.push({ x: bx + 8, y: by, width: BULLET_SIZE, height: BULLET_SIZE, vx: 1.2, vy: -8, owner: 'player', isPiercing });
      } else {
        g.bullets.push({ x: bx, y: by, width: BULLET_SIZE, height: BULLET_SIZE, vx: 0, vy: -8, owner: 'player', isPiercing });
      }
      audioService.playShoot();
      g.lastShootTime = now;
    }
  }, [gameState, currentLevelIndex, onGameOver, onLevelComplete]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const g = gameRef.current;

    ctx.save();
    if (g.screenShake > 0.5) ctx.translate((Math.random() - 0.5) * g.screenShake, (Math.random() - 0.5) * g.screenShake);

    ctx.fillStyle = COLORS.BLACK;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Starfield
    ctx.fillStyle = COLORS.DARK_GRAY;
    for (let i = 0; i < 30; i++) {
      const sy = (g.frameCount * 0.4 + i * 40) % SCREEN_HEIGHT;
      ctx.fillRect((i * 137) % SCREEN_WIDTH, sy, 1, 1);
    }

    g.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1.0;

    g.bullets.forEach(b => {
      ctx.fillStyle = b.owner === 'player' ? COLORS.YELLOW : COLORS.CYAN;
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.globalAlpha = 0.3;
      ctx.fillRect(b.x - b.vx, b.y - b.vy, b.width, b.height);
      ctx.globalAlpha = 1.0;
    });

    g.enemies.forEach(e => {
      ctx.fillStyle = e.type === 'boss' ? COLORS.MAGENTA :
        (e.type === 'diver' ? COLORS.ORANGE :
        (e.type === 'orb' ? COLORS.CYAN :
        (e.type === 'tank' ? COLORS.GRAY :
        (e.type === 'midboss' ? COLORS.ORANGE :
        (e.type === 'sentry' ? COLORS.BLUE :
        (e.type === 'sweeper' ? COLORS.GREEN : COLORS.RED))))));
      ctx.fillRect(e.x, e.y, e.width, e.height);
      
      if (e.type === 'boss') {
        ctx.fillStyle = COLORS.WHITE;
        ctx.fillRect(e.x + 15, e.y + 15, 12, 12);
        ctx.fillRect(e.x + 37, e.y + 15, 12, 12);
        ctx.fillStyle = COLORS.RED;
        ctx.fillRect(e.x + 10, e.y + 40, 44, 4);
      }
      if (e.type === 'midboss') {
        ctx.fillStyle = COLORS.WHITE;
        ctx.fillRect(e.x + 10, e.y + 10, 8, 8);
        ctx.fillRect(e.x + e.width - 18, e.y + 10, 8, 8);
        ctx.fillStyle = COLORS.RED;
        ctx.fillRect(e.x + 8, e.y + e.height - 10, e.width - 16, 4);
      }
    });

    g.powerUps.forEach(p => {
      const color = p.type === 'shield' ? COLORS.CYAN :
        (p.type === 'life' ? COLORS.GREEN :
        (p.type === 'bomb' ? COLORS.ORANGE :
        (p.type === 'multishot' ? COLORS.YELLOW :
        (p.type === 'coolant' ? COLORS.BLUE :
        (p.type === 'pierce' ? COLORS.MAGENTA : COLORS.PURPLE)))));
      ctx.fillStyle = color;
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.strokeStyle = COLORS.WHITE;
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x - 1, p.y - 1, p.width + 2, p.height + 2);
    });

    // Retro Player Ship Rendering
    if (g.isImmune % 10 < 5) {
      if (g.shieldTimer > 0) {
        ctx.strokeStyle = COLORS.CYAN;
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.arc(g.playerX + PLAYER_SIZE/2, g.playerY + PLAYER_SIZE/2, PLAYER_SIZE * 1.3, 0, Math.PI*2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      // Draw 8-bit style retro ship
      const px = g.playerX;
      const py = g.playerY;
      const ps = PLAYER_SIZE;

      ctx.fillStyle = COLORS.BLUE;
      // Main body
      ctx.fillRect(px + 4, py + 2, ps - 8, ps - 4);
      // Nose
      ctx.fillRect(px + ps/2 - 2, py, 4, 4);
      // Wings
      ctx.fillStyle = COLORS.CYAN;
      ctx.fillRect(px, py + 8, 4, 6);
      ctx.fillRect(px + ps - 4, py + 8, 4, 6);
      // Engines
      ctx.fillStyle = overheatPercent > 0.5 ? COLORS.RED : COLORS.YELLOW;
      ctx.fillRect(px + 4, py + ps - 2, 3, 2);
      ctx.fillRect(px + ps - 7, py + ps - 2, 3, 2);

      if (overheatPercent > 0.7) {
        ctx.fillStyle = `rgba(255, 65, 54, ${Math.sin(g.frameCount * 0.2) * 0.4 + 0.4})`;
        ctx.fillRect(px, py, ps, ps);
      }
    }
    ctx.restore();
  }, [overheatPercent]);

  useEffect(() => {
    let frameId: number;
    const loop = () => { update(); draw(); frameId = requestAnimationFrame(loop); };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [update, draw]);

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * SCREEN_WIDTH;
    gameRef.current.playerX = Math.max(0, Math.min(SCREEN_WIDTH - PLAYER_SIZE, x - PLAYER_SIZE/2));
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
      <div className="absolute top-4 left-4 right-4 flex justify-between text-[10px] z-20 pointer-events-none">
        <div>SCORE: {score.toLocaleString()}</div>
        <div className="flex gap-2 items-center">
          {activeShield && <span className="text-cyan-400 text-[8px] animate-pulse">SHIELD</span>}
          {multishotActive && <span className="text-yellow-400 text-[8px] animate-pulse">TRIPLE</span>}
          {coolantActive && <span className="text-blue-400 text-[8px] animate-pulse">COOLANT</span>}
          {pierceActive && <span className="text-fuchsia-400 text-[8px] animate-pulse">PIERCE</span>}
          {slowActive && <span className="text-purple-400 text-[8px] animate-pulse">SLOW</span>}
          <div className="flex gap-1 ml-2">
            {Array.from({length: Math.max(0, lives)}).map((_,i) => <span key={i} className="text-red-500">♥</span>)}
          </div>
        </div>
      </div>
      
      <div className="absolute top-12 left-4 right-4 flex justify-end text-[10px] z-20 pointer-events-none">
        <div className="flex flex-col items-end">
          <div className="mb-1 text-[8px] text-zinc-500 uppercase">Core Temp</div>
          <div className="w-24 h-2 bg-zinc-800 border border-zinc-700">
            <div 
              className={`h-full transition-all duration-75 ${overheatPercent > 0.8 ? 'bg-red-500 animate-pulse shadow-[0_0_8px_#FF4136]' : (overheatPercent > 0.5 ? 'bg-orange-500' : 'bg-yellow-500')}`} 
              style={{ width: `${overheatPercent * 100}%` }} 
            />
          </div>
        </div>
      </div>

      <canvas 
        ref={canvasRef} width={SCREEN_WIDTH} height={SCREEN_HEIGHT} 
        className="w-full max-w-[400px] aspect-[2/3] border-4 border-zinc-800 bg-black touch-none cursor-none shadow-[0_0_20px_rgba(0,0,0,0.5)]"
        onPointerMove={handlePointerMove}
        onPointerDown={() => { audioService.init(); gameRef.current.isShooting = true; gameRef.current.shootStartTime = Date.now(); }}
        onPointerUp={() => { gameRef.current.isShooting = false; }}
      />
    </div>
  );
};

export default GameCanvas;
