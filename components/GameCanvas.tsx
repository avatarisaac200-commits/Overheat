
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  GameState, Bullet, Enemy, Platform, PowerUp, Particle, EnemyType, PowerUpType 
} from '../types';
import { 
  COLORS, SCREEN_WIDTH, SCREEN_HEIGHT, PLAYER_SIZE, 
  BULLET_SIZE, ENEMY_SIZE, PLATFORM_WIDTH, PLATFORM_HEIGHT,
  OVERHEAT_THRESHOLD_SECONDS, RAPID_FIRE_THRESHOLD, BOSS_SIZE, COMBO_TIMEOUT
} from '../constants';
import { audioService } from '../services/AudioService';

interface GameCanvasProps {
  onGameOver: (score: number) => void;
  gameState: GameState;
  onStateChange: (state: GameState) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onGameOver, gameState, onStateChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [overheatPercent, setOverheatPercent] = useState(0);
  const [levelMsg, setLevelMsg] = useState('');
  const [combo, setCombo] = useState(0);

  const gameRef = useRef({
    playerX: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2,
    playerY: SCREEN_HEIGHT - 40,
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    platforms: [] as Platform[],
    powerUps: [] as PowerUp[],
    particles: [] as Particle[],
    score: 0,
    lives: 3,
    level: 1,
    frameCount: 0,
    isShooting: false,
    shootStartTime: 0,
    tapHistory: [] as number[],
    lastShootTime: 0,
    isImmune: 0,
    screenShake: 0,
    combo: 0,
    lastKillTime: 0,
    enemiesSpawnedInWave: 0,
    waveFinished: false,
    multishotTimer: 0,
    isBossFight: false,
  });

  const resetGame = useCallback(() => {
    const g = gameRef.current;
    g.playerX = SCREEN_WIDTH / 2 - PLAYER_SIZE / 2;
    g.bullets = [];
    g.enemies = [];
    g.platforms = [];
    g.powerUps = [];
    g.particles = [];
    g.score = 0;
    g.lives = 3;
    g.level = 1;
    g.frameCount = 0;
    g.isImmune = 0;
    g.combo = 0;
    g.lastKillTime = 0;
    g.enemiesSpawnedInWave = 0;
    g.waveFinished = false;
    g.multishotTimer = 0;
    g.isBossFight = false;
    setScore(0);
    setLives(3);
    setLevel(1);
    setOverheatPercent(0);
    setCombo(0);
    setLevelMsg('WAVE 1');
    setTimeout(() => setLevelMsg(''), 2000);
  }, []);

  useEffect(() => {
    if (gameState === GameState.PLAYING) resetGame();
  }, [gameState, resetGame]);

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

  const handleGameOver = useCallback(() => {
    audioService.playExplosion();
    spawnExplosion(gameRef.current.playerX + PLAYER_SIZE/2, gameRef.current.playerY + PLAYER_SIZE/2, COLORS.BLUE, 40, 4);
    gameRef.current.screenShake = 20;
    onGameOver(gameRef.current.score);
  }, [onGameOver]);

  const handleDamage = () => {
    const g = gameRef.current;
    if (g.isImmune > 0) return;
    g.lives--;
    setLives(g.lives);
    audioService.playDamage();
    g.screenShake = 15;
    g.isImmune = 90; 
    g.combo = 0;
    setCombo(0);
    if (g.lives <= 0) handleGameOver();
  };

  const activateBomb = () => {
    const g = gameRef.current;
    audioService.playBomb();
    g.screenShake = 20;
    g.enemies.forEach(e => {
      spawnExplosion(e.x + e.width/2, e.y + e.height/2, COLORS.RED, 5);
      g.score += 5;
    });
    g.enemies = [];
    g.platforms = [];
    setScore(g.score);
  };

  const spawnEnemy = (type: EnemyType) => {
    const g = gameRef.current;
    let hp = 1;
    let width = ENEMY_SIZE;
    let height = ENEMY_SIZE;
    let vy = 1 + (g.level * 0.15);

    if (type === 'tank') { hp = 3; vy *= 0.6; }
    if (type === 'diver') { vy *= 1.2; }
    if (type === 'boss') { hp = 20 + g.level * 5; width = BOSS_SIZE; height = BOSS_SIZE; vy = 0.5; }

    g.enemies.push({
      x: Math.random() * (SCREEN_WIDTH - width),
      y: -height,
      width, height, vx: 0, vy, hp, maxHp: hp, type,
      shootTimer: type === 'shooter' || type === 'boss' ? 60 : undefined
    });
    g.enemiesSpawnedInWave++;
  };

  const update = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    const g = gameRef.current;
    const now = Date.now();
    g.frameCount++;

    // 1. Difficulty & Wave Progression
    const isBossLevel = g.level % 10 === 0;
    const enemiesToSpawn = isBossLevel ? 0 : 5 + g.level * 2;

    if (!g.isBossFight && isBossLevel && g.enemies.length === 0) {
      g.isBossFight = true;
      setLevelMsg("BOSS INCOMING");
      setTimeout(() => {
        spawnEnemy('boss');
        setLevelMsg("");
      }, 2000);
    }

    if (!g.isBossFight && !isBossLevel && g.enemiesSpawnedInWave >= enemiesToSpawn && g.enemies.length === 0 && !g.waveFinished) {
      g.waveFinished = true;
      setTimeout(() => {
        g.level++;
        g.enemiesSpawnedInWave = 0;
        g.waveFinished = false;
        setLevel(g.level);
        setLevelMsg(`WAVE ${g.level}`);
        audioService.playPowerup();
        setTimeout(() => setLevelMsg(''), 2000);
      }, 1500);
    }

    // 2. Overheat Logic
    let currentOverheat = 0;
    if (g.isShooting) {
      const duration = (now - g.shootStartTime) / 1000;
      currentOverheat = Math.min(1, duration / OVERHEAT_THRESHOLD_SECONDS);
      if (duration >= OVERHEAT_THRESHOLD_SECONDS) { handleGameOver(); return; }
    }
    const recentTaps = g.tapHistory.filter(t => now - t < 1000);
    currentOverheat = Math.max(currentOverheat, Math.min(1, recentTaps.length / RAPID_FIRE_THRESHOLD));
    setOverheatPercent(currentOverheat);
    if (recentTaps.length > RAPID_FIRE_THRESHOLD + 3) { handleGameOver(); return; }

    // 3. Spawning
    if (!g.isBossFight && !isBossLevel && !g.waveFinished && g.enemiesSpawnedInWave < enemiesToSpawn) {
      const rate = Math.max(15, 80 - g.level * 5);
      if (g.frameCount % rate === 0) {
        const r = Math.random();
        if (r < 0.1) spawnEnemy('tank');
        else if (r < 0.2) spawnEnemy('shooter');
        else if (r < 0.3) spawnEnemy('diver');
        else spawnEnemy('orb');
      }
    }

    const platformRate = Math.max(40, 300 - g.level * 20);
    if (g.frameCount % platformRate === 0 && !g.isBossFight) {
      g.platforms.push({
        x: Math.random() * (SCREEN_WIDTH - PLATFORM_WIDTH),
        y: -PLATFORM_HEIGHT, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT,
        vx: 0, vy: 1.5 + g.level * 0.1
      });
    }

    if (g.frameCount % 800 === 0) {
      const types: PowerUpType[] = ['shield', 'life', 'multishot', 'bomb'];
      g.powerUps.push({
        x: Math.random() * (SCREEN_WIDTH - 16), y: -16, width: 16, height: 16, vx: 0, vy: 1.2,
        type: types[Math.floor(Math.random() * types.length)]
      });
    }

    // 4. Movement & Collision
    if (now - g.lastKillTime > COMBO_TIMEOUT && g.combo > 0) { g.combo = 0; setCombo(0); }

    g.bullets.forEach((b, i) => {
      b.y += b.vy;
      if (b.y < -20 || b.y > SCREEN_HEIGHT + 20) g.bullets.splice(i, 1);
      
      if (b.owner === 'enemy') {
        if (g.isImmune <= 0 && b.x < g.playerX + PLAYER_SIZE && b.x + b.width > g.playerX && b.y < g.playerY + PLAYER_SIZE && b.y + b.height > g.playerY) {
          handleDamage();
          g.bullets.splice(i, 1);
        }
      } else {
        g.enemies.forEach((e, ei) => {
          if (b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
            g.bullets.splice(i, 1);
            e.hp--;
            audioService.playHit();
            spawnExplosion(b.x, b.y, COLORS.WHITE, 2, 2);
            if (e.hp <= 0) {
              const basePoints = e.type === 'boss' ? 1000 : (e.type === 'tank' ? 50 : 10);
              g.combo++;
              setCombo(g.combo);
              g.score += basePoints * g.combo;
              setScore(g.score);
              g.lastKillTime = Date.now();
              audioService.playCombo(Math.min(g.combo, 12));
              spawnExplosion(e.x + e.width/2, e.y + e.height/2, COLORS.RED, 15, 3);
              if (e.type === 'boss') { 
                g.isBossFight = false; 
                g.level++; 
                setLevel(g.level);
                g.enemiesSpawnedInWave = 0;
                setLevelMsg("BOSS DEFEATED");
                setTimeout(() => setLevelMsg(""), 2000);
              }
              g.enemies.splice(ei, 1);
            }
          }
        });
      }
    });

    g.enemies.forEach(e => {
      if (e.type === 'diver' && e.y > SCREEN_HEIGHT * 0.3 && !e.isDiving) {
        e.vy *= 3; e.isDiving = true;
      }
      e.y += e.vy;
      if (e.shootTimer !== undefined) {
        e.shootTimer--;
        if (e.shootTimer <= 0) {
          g.bullets.push({ x: e.x + e.width/2, y: e.y + e.height, width: 4, height: 4, vx: 0, vy: 4, owner: 'enemy' });
          if (e.type === 'boss') {
             g.bullets.push({ x: e.x + e.width/2, y: e.y + e.height, width: 4, height: 4, vx: -2, vy: 3, owner: 'enemy' });
             g.bullets.push({ x: e.x + e.width/2, y: e.y + e.height, width: 4, height: 4, vx: 2, vy: 3, owner: 'enemy' });
          }
          e.shootTimer = e.type === 'boss' ? 40 : 100;
          audioService.playEnemyShoot();
        }
      }
      if (e.y > SCREEN_HEIGHT) e.y = -e.height; 
      if (g.isImmune <= 0 && g.playerX < e.x + e.width && g.playerX + PLAYER_SIZE > e.x && g.playerY < e.y + e.height && g.playerY + PLAYER_SIZE > e.y) {
        handleDamage();
      }
    });

    g.platforms.forEach((p, i) => {
      p.y += p.vy;
      if (p.y > SCREEN_HEIGHT) g.platforms.splice(i, 1);
      if (g.isImmune <= 0 && g.playerX < p.x + p.width && g.playerX + PLAYER_SIZE > p.x && g.playerY < p.y + p.height && g.playerY + PLAYER_SIZE > p.y) {
        handleDamage();
        g.platforms.splice(i, 1);
      }
    });

    g.powerUps.forEach((p, i) => {
      p.y += p.vy;
      if (p.y > SCREEN_HEIGHT) g.powerUps.splice(i, 1);
      if (g.playerX < p.x + p.width && g.playerX + PLAYER_SIZE > p.x && g.playerY < p.y + p.height && g.playerY + PLAYER_SIZE > p.y) {
        audioService.playPowerup();
        if (p.type === 'shield') g.isImmune = 300;
        else if (p.type === 'life') { g.lives++; setLives(g.lives); }
        else if (p.type === 'multishot') g.multishotTimer = 400;
        else if (p.type === 'bomb') activateBomb();
        g.powerUps.splice(i, 1);
      }
    });

    g.particles.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.02;
      if (p.life <= 0) g.particles.splice(i, 1);
    });

    if (g.isImmune > 0) g.isImmune--;
    if (g.multishotTimer > 0) g.multishotTimer--;
    if (g.screenShake > 0) g.screenShake *= 0.9;

    if (g.isShooting && now - g.lastShootTime > 120) {
      const bx = g.playerX + PLAYER_SIZE/2 - BULLET_SIZE/2;
      const by = g.playerY;
      g.bullets.push({ x: bx, y: by, width: BULLET_SIZE, height: BULLET_SIZE, vx: 0, vy: -7, owner: 'player' });
      if (g.multishotTimer > 0) {
        g.bullets.push({ x: bx - 10, y: by, width: BULLET_SIZE, height: BULLET_SIZE, vx: -1, vy: -6, owner: 'player' });
        g.bullets.push({ x: bx + 10, y: by, width: BULLET_SIZE, height: BULLET_SIZE, vx: 1, vy: -6, owner: 'player' });
      }
      audioService.playShoot();
      g.lastShootTime = now;
    }
  }, [gameState, handleGameOver]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d')!;
    const g = gameRef.current;

    ctx.save();
    if (g.screenShake > 0.5) {
      ctx.translate((Math.random() - 0.5) * g.screenShake, (Math.random() - 0.5) * g.screenShake);
    }

    ctx.fillStyle = COLORS.BLACK;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Star parallax
    ctx.fillStyle = COLORS.WHITE;
    for (let i = 0; i < 30; i++) {
      const starY = (g.frameCount * (0.5 + (i%3)*0.2) + i * 40) % SCREEN_HEIGHT;
      ctx.fillRect((i * 137) % SCREEN_WIDTH, starY, 1, 1);
    }

    // Drawing objects
    g.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1.0;

    g.powerUps.forEach(p => {
      ctx.fillStyle = p.type === 'shield' ? COLORS.CYAN : p.type === 'life' ? COLORS.GREEN : p.type === 'multishot' ? COLORS.ORANGE : COLORS.MAGENTA;
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.fillStyle = COLORS.WHITE;
      ctx.fillRect(p.x + 4, p.y + 4, 8, 8);
    });

    ctx.fillStyle = COLORS.YELLOW;
    g.bullets.forEach(b => {
      ctx.fillStyle = b.owner === 'player' ? COLORS.YELLOW : COLORS.WHITE;
      ctx.fillRect(b.x, b.y, b.width, b.height);
    });

    g.enemies.forEach(e => {
      ctx.fillStyle = e.type === 'boss' ? COLORS.PURPLE : e.type === 'tank' ? COLORS.ORANGE : e.type === 'diver' ? COLORS.CYAN : COLORS.RED;
      ctx.fillRect(e.x, e.y, e.width, e.height);
      if (e.hp < e.maxHp) {
        ctx.fillStyle = COLORS.BLACK;
        ctx.fillRect(e.x, e.y - 6, e.width, 4);
        ctx.fillStyle = COLORS.GREEN;
        ctx.fillRect(e.x, e.y - 6, (e.hp/e.maxHp) * e.width, 4);
      }
      ctx.fillStyle = COLORS.WHITE;
      ctx.fillRect(e.x + e.width*0.2, e.y + e.height*0.3, e.width*0.2, e.width*0.2);
      ctx.fillRect(e.x + e.width*0.6, e.y + e.height*0.3, e.width*0.2, e.width*0.2);
    });

    g.platforms.forEach(p => {
      ctx.fillStyle = COLORS.GRAY;
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.strokeStyle = COLORS.DARK_GRAY;
      ctx.strokeRect(p.x, p.y, p.width, p.height);
    });

    if (g.isImmune % 10 < 5) {
      if (g.isShooting) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = overheatPercent > 0.8 ? COLORS.RED : COLORS.CYAN;
      }
      ctx.fillStyle = COLORS.BLUE;
      ctx.beginPath();
      ctx.arc(g.playerX + PLAYER_SIZE/2, g.playerY + PLAYER_SIZE/2, PLAYER_SIZE/2, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = COLORS.WHITE;
      ctx.fillRect(g.playerX + 4, g.playerY + 4, 3, 3);
      ctx.fillRect(g.playerX + 9, g.playerY + 4, 3, 3);
      
      if (g.isImmune > 60) {
        ctx.strokeStyle = COLORS.CYAN;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(g.playerX + PLAYER_SIZE/2, g.playerY + PLAYER_SIZE/2, PLAYER_SIZE/2 + 6, 0, Math.PI*2); ctx.stroke();
      }
      if (g.multishotTimer > 0) {
        ctx.strokeStyle = COLORS.ORANGE;
        ctx.strokeRect(g.playerX-2, g.playerY-2, PLAYER_SIZE+4, PLAYER_SIZE+4);
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

  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameState !== GameState.PLAYING) return;
    audioService.init(); // iOS wake-up
    const g = gameRef.current;
    g.isShooting = true;
    g.shootStartTime = Date.now();
    g.tapHistory.push(Date.now());
  };

  const handlePointerUp = () => { gameRef.current.isShooting = false; };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (gameState !== GameState.PLAYING) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const targetX = ((e.clientX - rect.left) / rect.width) * SCREEN_WIDTH;
    gameRef.current.playerX += (targetX - PLAYER_SIZE/2 - gameRef.current.playerX) * 0.4;
    gameRef.current.playerX = Math.max(0, Math.min(SCREEN_WIDTH - PLAYER_SIZE, gameRef.current.playerX));
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden">
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10 text-[10px]">
        <div>
          <div className="text-white mb-1">SCORE: {score.toLocaleString()}</div>
          <div className="flex gap-1">
            {Array.from({ length: Math.max(0, lives) }).map((_, i) => (<div key={i} className="text-red-500">♥</div>))}
          </div>
          {combo > 1 && <div className="text-yellow-400 mt-2 italic animate-bounce">COMBO X{combo}</div>}
        </div>
        <div className="text-right">
          <div className="text-white mb-1">LVL: {level}</div>
          <div className="w-24 h-2 bg-gray-900 border border-gray-700 overflow-hidden relative">
            <div className={`h-full transition-all duration-75 ${overheatPercent > 0.8 ? 'bg-red-500 animate-pulse' : 'bg-cyan-500'}`} style={{ width: `${overheatPercent * 100}%` }} />
          </div>
          <div className="text-[8px] text-gray-500 mt-1 uppercase tracking-widest">Core Temp</div>
        </div>
      </div>

      {levelMsg && <div className="absolute top-1/3 text-xl text-yellow-400 z-20 animate-pulse drop-shadow-md">{levelMsg}</div>}

      <canvas ref={canvasRef} width={SCREEN_WIDTH} height={SCREEN_HEIGHT} className="w-full max-w-[400px] aspect-[2/3] border-4 border-gray-800 bg-black cursor-crosshair touch-none" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerMove={handlePointerMove} onContextMenu={(e) => e.preventDefault()} />
      
      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-fade-in">
          <h2 className="text-white text-2xl mb-8 tracking-tighter">SUSPENDED</h2>
          <button onClick={() => onStateChange(GameState.PLAYING)} className="px-10 py-4 bg-blue-600 text-white text-xs hover:bg-blue-500 transition-all border-b-4 border-blue-800 active:border-b-0 active:translate-y-1">REBOOT MISSION</button>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
