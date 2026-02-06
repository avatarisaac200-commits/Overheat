
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
  const [combo, setCombo] = useState(0);

  const gameRef = useRef({
    playerX: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2,
    playerY: SCREEN_HEIGHT - 60,
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    platforms: [] as Platform[],
    powerUps: [] as PowerUp[],
    particles: [] as Particle[],
    score: 0,
    lives: 3,
    frameCount: 0,
    isShooting: false,
    shootStartTime: 0,
    tapHistory: [] as number[],
    lastShootTime: 0,
    isImmune: 0,
    screenShake: 0,
    combo: 0,
    lastKillTime: 0,
    enemiesSpawnedInLevel: 0,
    levelFinished: false,
    multishotTimer: 0,
    isBossFight: false,
    currentWaveIndex: 0
  });

  const resetForLevel = useCallback(() => {
    const g = gameRef.current;
    g.playerX = SCREEN_WIDTH / 2 - PLAYER_SIZE / 2;
    g.bullets = [];
    g.enemies = [];
    g.platforms = [];
    g.powerUps = [];
    g.particles = [];
    g.frameCount = 0;
    g.isImmune = 0;
    g.enemiesSpawnedInLevel = 0;
    g.levelFinished = false;
    g.currentWaveIndex = 0;
    g.isBossFight = (currentLevelIndex === 9);
    g.lives = 3;
    setLives(3);
    setOverheatPercent(0);
  }, [currentLevelIndex]);

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

  const spawnEnemy = (type: EnemyType) => {
    const g = gameRef.current;
    // Base HP scaling with level
    let hp = type === 'tank' ? 3 : type === 'boss' ? 40 + (currentLevelIndex * 5) : 1;
    let width = type === 'boss' ? BOSS_SIZE : ENEMY_SIZE;
    let height = type === 'boss' ? BOSS_SIZE : ENEMY_SIZE;
    let vy = type === 'boss' ? 0.3 : 1.2 + currentLevelIndex * 0.15;

    g.enemies.push({
      x: Math.random() * (SCREEN_WIDTH - width),
      y: -height,
      width, height, vx: 0, vy, hp, maxHp: hp, type,
      shootTimer: type === 'shooter' || type === 'boss' ? 60 : undefined,
      phase: type === 'boss' ? 1 : 0
    });
    g.enemiesSpawnedInLevel++;
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
        const spawnInterval = Math.max(20, 70 - currentLevelIndex * 4);
        if (g.frameCount % spawnInterval === 0 && g.enemiesSpawnedInLevel < currentWave.count) {
          spawnEnemy(currentWave.type as EnemyType);
        }

        // Advance wave if all spawned enemies of current wave are gone (dead or off-screen)
        if (g.enemiesSpawnedInLevel >= currentWave.count && g.enemies.length === 0) {
          if (g.currentWaveIndex < levelData.waves.length - 1) {
            g.currentWaveIndex++;
            g.enemiesSpawnedInLevel = 0;
            // Delay before next wave
            g.frameCount = 1; 
          } else {
            g.levelFinished = true;
            setTimeout(() => onLevelComplete(), 1500);
          }
        }
      }
    }

    // 2. Heat System
    let currentOverheat = 0;
    if (g.isShooting) {
      const duration = (now - g.shootStartTime) / 1000;
      currentOverheat = Math.min(1, duration / OVERHEAT_THRESHOLD_SECONDS);
      if (duration >= OVERHEAT_THRESHOLD_SECONDS) { onGameOver(g.score); return; }
    }
    setOverheatPercent(currentOverheat);

    // 3. Movement & Collision
    g.bullets.forEach((b, i) => {
      if (b.isHoming && b.owner === 'enemy') {
        const dx = g.playerX + PLAYER_SIZE/2 - b.x;
        const dy = g.playerY + PLAYER_SIZE/2 - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        b.vx = (dx / dist) * 2;
        b.vy = (dy / dist) * 2;
      }
      b.x += b.vx;
      b.y += b.vy;

      if (b.y < -50 || b.y > SCREEN_HEIGHT + 50 || b.x < -50 || b.x > SCREEN_WIDTH + 50) {
        g.bullets.splice(i, 1);
        return;
      }
      
      if (b.owner === 'enemy') {
        if (g.isImmune <= 0 && b.x < g.playerX + PLAYER_SIZE && b.x + b.width > g.playerX && b.y < g.playerY + PLAYER_SIZE && b.y + b.height > g.playerY) {
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
            g.bullets.splice(i, 1);
            e.hp--;
            audioService.playHit();
            if (e.hp <= 0) {
              if (e.type === 'boss' && e.phase && e.phase < 3) {
                e.phase++;
                e.hp = e.maxHp;
                spawnExplosion(e.x + e.width/2, e.y + e.height/2, COLORS.MAGENTA, 25);
                g.screenShake = 15;
              } else {
                g.score += e.type === 'boss' ? 5000 : 100;
                setScore(g.score);
                spawnExplosion(e.x + e.width/2, e.y + e.height/2, COLORS.RED, 12);
                g.enemies.splice(ei, 1);
              }
            }
            break;
          }
        }
      }
    });

    for (let ei = 0; ei < g.enemies.length; ei++) {
      const e = g.enemies[ei];
      e.y += e.vy;

      // Handle enemy wrapping or removal
      if (e.y > SCREEN_HEIGHT + 20) {
        if (e.type === 'boss') {
           e.y = -e.height; // Bosses wrap
        } else {
           g.enemies.splice(ei, 1); // Normal enemies are removed
           ei--;
           continue;
        }
      }

      if (e.shootTimer !== undefined) {
        e.shootTimer--;
        if (e.shootTimer <= 0) {
          const bx = e.x + e.width/2;
          const by = e.y + e.height;
          if (e.type === 'boss') {
            if (e.phase === 2) {
              g.bullets.push({ x: bx, y: by, width: 6, height: 6, vx: 0, vy: 0, owner: 'enemy', isHoming: true });
            } else {
              g.bullets.push({ x: bx, y: by, width: 4, height: 4, vx: -1.5, vy: 3, owner: 'enemy' });
              g.bullets.push({ x: bx, y: by, width: 4, height: 4, vx: 1.5, vy: 3, owner: 'enemy' });
            }
          } else if (e.type === 'shooter') {
            g.bullets.push({ x: bx, y: by, width: 4, height: 4, vx: 0, vy: 3, owner: 'enemy' });
          }
          e.shootTimer = Math.max(40, 110 - currentLevelIndex * 6);
          audioService.playEnemyShoot();
        }
      }
      
      if (g.isImmune <= 0 && g.playerX < e.x + e.width && g.playerX + PLAYER_SIZE > e.x && g.playerY < e.y + e.height && g.playerY + PLAYER_SIZE > e.y) {
        g.lives--; setLives(g.lives);
        g.isImmune = 60;
        audioService.playDamage();
        if (g.lives <= 0) onGameOver(g.score);
      }
    }

    g.particles.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.025;
      if (p.life <= 0) g.particles.splice(i, 1);
    });

    if (g.isImmune > 0) g.isImmune--;
    if (g.screenShake > 0) g.screenShake *= 0.9;

    if (g.isShooting && now - g.lastShootTime > 160) {
      g.bullets.push({ 
        x: g.playerX + PLAYER_SIZE/2 - BULLET_SIZE/2, 
        y: g.playerY, 
        width: BULLET_SIZE, height: BULLET_SIZE, 
        vx: 0, vy: -7.5, owner: 'player' 
      });
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
    if (g.screenShake > 0.5) {
      ctx.translate((Math.random() - 0.5) * g.screenShake, (Math.random() - 0.5) * g.screenShake);
    }

    ctx.fillStyle = COLORS.BLACK;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Static/Star background
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
    });

    g.enemies.forEach(e => {
      ctx.fillStyle = e.type === 'boss' ? COLORS.MAGENTA : COLORS.RED;
      ctx.fillRect(e.x, e.y, e.width, e.height);
      if (e.type === 'boss') {
        // Boss "Face"
        ctx.fillStyle = COLORS.WHITE;
        ctx.fillRect(e.x + 12, e.y + 12, 8, 8);
        ctx.fillRect(e.x + e.width - 20, e.y + 12, 8, 8);
        
        // Phase bar
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(e.x, e.y - 12, e.width, 6);
        ctx.fillStyle = e.phase === 3 ? COLORS.RED : e.phase === 2 ? COLORS.YELLOW : COLORS.GREEN;
        ctx.fillRect(e.x, e.y - 12, (e.hp / e.maxHp) * e.width, 6);
      }
    });

    // Player
    if (g.isImmune % 10 < 5) {
      ctx.fillStyle = COLORS.BLUE;
      ctx.beginPath();
      ctx.arc(g.playerX + PLAYER_SIZE/2, g.playerY + PLAYER_SIZE/2, PLAYER_SIZE/2, 0, Math.PI*2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = COLORS.WHITE;
      ctx.fillRect(g.playerX + 4, g.playerY + 5, 2, 2);
      ctx.fillRect(g.playerX + 10, g.playerY + 5, 2, 2);
    }
    ctx.restore();
  }, []);

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
        <div className="flex gap-1">
           {Array.from({length: lives}).map((_,i) => <span key={i} className="text-red-500">♥</span>)}
        </div>
      </div>
      
      <div className="absolute top-12 left-4 right-4 flex justify-end text-[10px] z-20 pointer-events-none">
        <div className="flex flex-col items-end">
          <div className="mb-1 text-[8px] text-zinc-500">TEMP</div>
          <div className="w-20 h-2 bg-zinc-800 border border-zinc-700">
            <div 
              className={`h-full transition-all ${overheatPercent > 0.8 ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`} 
              style={{ width: `${overheatPercent * 100}%` }} 
            />
          </div>
        </div>
      </div>

      <canvas 
        ref={canvasRef} width={SCREEN_WIDTH} height={SCREEN_HEIGHT} 
        className="w-full max-w-[400px] aspect-[2/3] border-4 border-zinc-800 bg-black touch-none"
        onPointerMove={handlePointerMove}
        onPointerDown={() => { audioService.init(); gameRef.current.isShooting = true; gameRef.current.shootStartTime = Date.now(); }}
        onPointerUp={() => { gameRef.current.isShooting = false; }}
      />
    </div>
  );
};

export default GameCanvas;
