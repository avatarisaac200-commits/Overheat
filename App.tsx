
import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameState, UiSettings } from './types';
import { audioService } from './services/AudioService';
import { admobService } from './services/AdmobService';
import { STORY_LEVELS } from './constants';

const SETTINGS_STORAGE_KEY = 'overheat_ui_settings';
const HIGH_SCORE_STORAGE_KEY = 'overheat_highscore';
const UNLOCKED_STORAGE_KEY = 'overheat_unlocked';

const storageFallback = new Map<string, string>();

const getStoredValue = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return storageFallback.get(key) ?? null;
  }
};

const setStoredValue = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    storageFallback.set(key, value);
  }
};

const removeStoredValue = (key: string): void => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    storageFallback.delete(key);
  }
};

const defaultUiSettings: UiSettings = {
  uiScale: 1,
  showScanlines: true,
  showVignette: true,
  fireButtonSize: 1,
  fireButtonPosition: {
    xPercent: 53,
    yPercent: 88
  }
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.BOOT);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [runId, setRunId] = useState(0);
  const [uiSettings, setUiSettings] = useState<UiSettings>(defaultUiSettings);

  useEffect(() => {
    const savedHS = getStoredValue(HIGH_SCORE_STORAGE_KEY);
    if (savedHS) setHighScore(parseInt(savedHS, 10));

    const savedUL = getStoredValue(UNLOCKED_STORAGE_KEY);
    if (savedUL) setUnlockedLevel(parseInt(savedUL, 10));

    const rawSettings = getStoredValue(SETTINGS_STORAGE_KEY);
    if (rawSettings) {
      try {
        const parsed = JSON.parse(rawSettings) as Partial<UiSettings>;
        setUiSettings({
          uiScale: clamp(parsed.uiScale ?? defaultUiSettings.uiScale, 0.8, 1.4),
          showScanlines: parsed.showScanlines ?? defaultUiSettings.showScanlines,
          showVignette: parsed.showVignette ?? defaultUiSettings.showVignette,
          fireButtonSize: clamp(parsed.fireButtonSize ?? defaultUiSettings.fireButtonSize, 0.8, 1.6),
          fireButtonPosition: {
            xPercent: clamp(parsed.fireButtonPosition?.xPercent ?? defaultUiSettings.fireButtonPosition.xPercent, 5, 95),
            yPercent: clamp(parsed.fireButtonPosition?.yPercent ?? defaultUiSettings.fireButtonPosition.yPercent, 5, 95)
          }
        });
      } catch {
        removeStoredValue(SETTINGS_STORAGE_KEY);
      }
    }

    admobService.init();

    const bootTimer = setTimeout(() => {
      setGameState(GameState.START);
    }, 1200);
    return () => clearTimeout(bootTimer);
  }, []);

  useEffect(() => {
    setStoredValue(SETTINGS_STORAGE_KEY, JSON.stringify(uiSettings));
  }, [uiSettings]);

  const handleGameOver = async (finalScore: number) => {
    setScore(finalScore);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      setStoredValue(HIGH_SCORE_STORAGE_KEY, finalScore.toString());
    }
    setGameState(GameState.GAMEOVER);
    await admobService.showInterstitial();
  };

  const selectLevel = (index: number) => {
    setCurrentLevel(index);
    setRunId((prev) => prev + 1);
    audioService.init();
    setGameState(GameState.NARRATIVE);
  };

  const startGame = () => {
    setGameState(GameState.PLAYING);
  };

  const nextLevel = async () => {
    const nextIdx = currentLevel + 1;
    if (nextIdx < 10) {
      if (nextIdx + 1 > unlockedLevel) {
        setUnlockedLevel(nextIdx + 1);
        setStoredValue(UNLOCKED_STORAGE_KEY, (nextIdx + 1).toString());
      }
      setCurrentLevel(nextIdx);
      setGameState(GameState.NARRATIVE);
      await admobService.showInterstitial();
    } else {
      setGameState(GameState.VICTORY);
      await admobService.showInterstitial();
    }
  };

  const returnToMainMenu = () => {
    setGameState(GameState.START);
  };

  const updateFireButtonPositionFromEditor = (clientX: number, clientY: number, bounds: DOMRect) => {
    const xPercent = clamp(((clientX - bounds.left) / bounds.width) * 100, 5, 95);
    const yPercent = clamp(((clientY - bounds.top) / bounds.height) * 100, 5, 95);
    setUiSettings((prev) => ({
      ...prev,
      fireButtonPosition: { xPercent, yPercent }
    }));
  };

  // Relative path ensures compatibility across varied hosting environments
  const LOGO_PATH = "./assets/logo.png";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black text-white font-['Press_Start_2P'] select-none overflow-hidden">
      <div className="absolute inset-0 arcade-bg" />
      {uiSettings.showScanlines && <div className="absolute inset-0 scanlines pointer-events-none" />}
      {uiSettings.showVignette && <div className="absolute inset-0 vignette pointer-events-none" />}

      {gameState === GameState.BOOT && (
        <div className="text-center p-8 max-w-md boot-flicker">
          <div className="text-[10px] text-zinc-400 uppercase tracking-[0.3em] mb-6">Boot Sequence</div>
          <div className="text-4xl text-red-500 italic font-black tracking-tighter glitch-text">OVERHEAT</div>
          <div className="mt-6 text-[9px] text-zinc-500 uppercase">Thermal grid online</div>
          <div className="mt-3 h-2 w-40 mx-auto bg-zinc-800 border border-zinc-700">
            <div className="h-full bg-red-600 boot-bar" />
          </div>
        </div>
      )}
      {gameState === GameState.START && (
        <div className="text-center p-8 max-w-md animate-fade-in flex flex-col items-center panel-card">
          <div className="w-64 h-32 flex items-center justify-center mb-8 relative">
            <img 
              src={LOGO_PATH} 
              alt="Overheat Logo" 
              className="max-w-full max-h-full drop-shadow-[0_0_15px_rgba(255,65,54,0.7)] object-contain" 
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if(parent) {
                  parent.innerHTML = '<div class="text-5xl text-red-600 tracking-tighter italic font-black animate-pulse drop-shadow-[0_0_10px_#FF4136]">OVERHEAT</div>';
                }
              }}
            />
          </div>
          
          <div className="space-y-4 mb-10 w-full">
            <div className="text-[10px] text-zinc-300 uppercase tracking-[0.4em]">Thermal Defense Mission</div>
            <div className="text-[8px] text-zinc-500 uppercase">Keep the core below critical heat</div>
          </div>

          <button 
            onClick={() => { audioService.init(); setGameState(GameState.LEVEL_SELECT); }}
            className="w-full py-5 bg-red-600 hover:bg-red-500 text-white text-sm border-b-8 border-red-900 active:border-b-0 active:translate-y-2 transition-all mb-4 arcade-cta"
          >
            START MISSION
          </button>

          <button
            onClick={() => setGameState(GameState.SETTINGS)}
            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] border-b-4 border-zinc-950 active:border-b-0 active:translate-y-1 transition-all"
          >
            SETTINGS
          </button>
          
          <div className="mt-8 text-[9px] text-zinc-500 uppercase tracking-[0.2em]">
            SYSTEM RECORD: {highScore.toLocaleString()}
          </div>
        </div>
      )}

      {gameState === GameState.LEVEL_SELECT && (
        <div className="text-center p-6 w-full max-w-lg animate-in fade-in zoom-in duration-300 panel-card">
          <h2 className="text-lg mb-8 tracking-[0.3em] text-red-400">SELECT SECTOR</h2>
          <div className="grid grid-cols-5 gap-3 mb-10">
            {STORY_LEVELS.map((level, idx) => {
              const isLocked = (idx + 1) > unlockedLevel;
              return (
                <button
                  key={idx}
                  disabled={isLocked}
                  onClick={() => selectLevel(idx)}
                  className={`aspect-square flex items-center justify-center border-2 text-[12px] transition-all
                    ${isLocked 
                      ? 'border-zinc-800 text-zinc-800 cursor-not-allowed bg-zinc-900/20' 
                      : 'border-red-500 text-white hover:bg-red-600 active:scale-90 bg-red-900/10'
                    }`}
                >
                  {isLocked ? 'X' : idx + 1}
                </button>
              );
            })}
          </div>
          <button 
            onClick={returnToMainMenu}
            className="text-[8px] text-zinc-600 hover:text-white underline uppercase transition-colors"
          >
            Return to Main Menu
          </button>
        </div>
      )}

      {gameState === GameState.SETTINGS && (
        <div className="p-6 w-full max-w-3xl animate-in fade-in zoom-in duration-300 panel-card">
          <h2 className="text-center text-lg mb-6 tracking-[0.25em] text-red-400">SETTINGS</h2>

          <div className="grid gap-6 md:grid-cols-2 text-[9px]">
            <section className="space-y-5">
              <h3 className="text-zinc-300 text-[10px] tracking-[0.15em]">UI CUSTOMIZATION</h3>

              <label className="block">
                <div className="mb-2 text-zinc-400">HUD SCALE: {(uiSettings.uiScale * 100).toFixed(0)}%</div>
                <input
                  type="range"
                  min={0.8}
                  max={1.4}
                  step={0.05}
                  value={uiSettings.uiScale}
                  onChange={(e) => setUiSettings((prev) => ({ ...prev, uiScale: parseFloat(e.target.value) }))}
                  className="w-full accent-red-500"
                />
              </label>

              <label className="block">
                <div className="mb-2 text-zinc-400">FIRE BUTTON SIZE: {(uiSettings.fireButtonSize * 100).toFixed(0)}%</div>
                <input
                  type="range"
                  min={0.8}
                  max={1.6}
                  step={0.05}
                  value={uiSettings.fireButtonSize}
                  onChange={(e) => setUiSettings((prev) => ({ ...prev, fireButtonSize: parseFloat(e.target.value) }))}
                  className="w-full accent-red-500"
                />
              </label>

              <label className="flex items-center justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-300">SCANLINES</span>
                <input
                  type="checkbox"
                  checked={uiSettings.showScanlines}
                  onChange={(e) => setUiSettings((prev) => ({ ...prev, showScanlines: e.target.checked }))}
                  className="h-4 w-4 accent-red-500"
                />
              </label>

              <label className="flex items-center justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-300">VIGNETTE</span>
                <input
                  type="checkbox"
                  checked={uiSettings.showVignette}
                  onChange={(e) => setUiSettings((prev) => ({ ...prev, showVignette: e.target.checked }))}
                  className="h-4 w-4 accent-red-500"
                />
              </label>

              <button
                onClick={() => setUiSettings(defaultUiSettings)}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border-b-4 border-zinc-950 active:border-b-0 active:translate-y-1 text-[9px]"
              >
                RESET TO DEFAULTS
              </button>
            </section>

            <section className="space-y-5">
              <h3 className="text-zinc-300 text-[10px] tracking-[0.15em]">FIRE BUTTON POSITION</h3>
              <div className="text-zinc-500 leading-relaxed">
                Drag the red button in the field below to place it anywhere on the gameplay screen.
              </div>
              <div
                className="relative h-56 border-2 border-zinc-700 bg-black/70 overflow-hidden touch-none"
                onPointerDown={(e) => {
                  const target = e.currentTarget;
                  target.setPointerCapture(e.pointerId);
                  updateFireButtonPositionFromEditor(e.clientX, e.clientY, target.getBoundingClientRect());
                }}
                onPointerMove={(e) => {
                  if ((e.buttons & 1) !== 1) return;
                  updateFireButtonPositionFromEditor(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
                }}
              >
                {uiSettings.showScanlines && <div className="absolute inset-0 scanlines pointer-events-none opacity-25" />}
                <button
                  type="button"
                  className="absolute px-3 py-2 bg-red-600 border border-red-300 text-[8px] tracking-[0.14em] uppercase shadow-[0_0_8px_rgba(255,65,54,0.45)] pointer-events-none"
                  style={{
                    left: `${uiSettings.fireButtonPosition.xPercent}%`,
                    top: `${uiSettings.fireButtonPosition.yPercent}%`,
                    transform: `translate(-50%, -50%) scale(${uiSettings.fireButtonSize})`
                  }}
                >
                  FIRE
                </button>
              </div>
              <div className="text-zinc-500">
                X: {uiSettings.fireButtonPosition.xPercent.toFixed(1)}% | Y: {uiSettings.fireButtonPosition.yPercent.toFixed(1)}%
              </div>
            </section>
          </div>

          <section className="mt-8 border-t border-zinc-800 pt-6">
            <h3 className="text-zinc-300 text-[10px] tracking-[0.15em] mb-3">ABOUT</h3>
            <p className="text-[9px] text-zinc-400 leading-relaxed">
              OVERHEAT is an arcade survival shooter where your ship can melt down if you hold fire too long.
              Survive each sector, manage heat, and adapt to enemy waves and power-ups.
            </p>
            <p className="text-[9px] text-zinc-500 mt-3 leading-relaxed">
              Tip: this settings page changes the live game HUD and controls. Your custom setup is saved locally.
            </p>
          </section>

          <button
            onClick={returnToMainMenu}
            className="mt-8 w-full py-4 bg-red-600 hover:bg-red-500 text-white text-[10px] border-b-4 border-red-900 active:border-b-0 active:translate-y-1"
          >
            RETURN TO MAIN MENU
          </button>
        </div>
      )}

      {gameState === GameState.NARRATIVE && (
        <div className="p-8 max-w-lg text-center bg-zinc-900/60 border-2 border-zinc-800 rounded-sm animate-in fade-in duration-500 shadow-2xl panel-card">
          <div className="text-[8px] text-red-500 mb-2 tracking-widest uppercase font-bold">Encrypted Message</div>
          <h2 className="text-yellow-400 text-sm mb-6 leading-relaxed uppercase tracking-tighter">
            {STORY_LEVELS[currentLevel].title}
          </h2>
          <div className="h-[2px] w-full bg-zinc-800 mb-6" />
          <p className="text-[10px] leading-relaxed text-zinc-300 mb-10 min-h-[120px] font-light">
            {STORY_LEVELS[currentLevel].intro}
          </p>
          <button 
            onClick={startGame}
            className="w-full py-4 bg-green-600 text-white text-[10px] border-b-4 border-green-800 hover:bg-green-500 active:border-b-0 active:translate-y-1"
          >
            INITIATE PURGE
          </button>
          <button
            onClick={returnToMainMenu}
            className="mt-4 w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-[9px] border-b-4 border-zinc-950 active:border-b-0 active:translate-y-1"
          >
            RETURN TO MAIN MENU
          </button>
        </div>
      )}

      {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
        <div className="w-full h-full">
          <GameCanvas 
            currentLevelIndex={currentLevel}
            runId={runId}
            onGameOver={handleGameOver} 
            onLevelComplete={nextLevel}
            gameState={gameState}
            onStateChange={setGameState}
            uiSettings={uiSettings}
            onReturnToMainMenu={returnToMainMenu}
          />
        </div>
      )}

      {gameState === GameState.GAMEOVER && (
        <div className="text-center p-10 max-w-md animate-in zoom-in duration-300 panel-card">
          <h2 className="text-red-500 text-3xl mb-8 tracking-tighter font-black italic">MELTDOWN</h2>
          <div className="mb-12 space-y-4">
            <div className="text-[9px] text-zinc-500">FINAL LOG SCORE</div>
            <div className="text-2xl text-white">{score.toLocaleString()}</div>
          </div>
          
          <button 
            onClick={() => { selectLevel(currentLevel); }}
            className="w-full py-5 bg-red-600 hover:bg-red-500 text-white text-xs border-b-8 border-red-900 active:border-b-0 active:translate-y-2 mb-4"
          >
            REBOOT SYSTEM
          </button>
          <button 
            onClick={() => setGameState(GameState.LEVEL_SELECT)}
            className="text-[10px] text-zinc-600 hover:text-white underline uppercase transition-colors"
          >
            Selector Menu
          </button>
          <button 
            onClick={returnToMainMenu}
            className="mt-4 text-[10px] text-zinc-600 hover:text-white underline uppercase transition-colors"
          >
            Return to Main Menu
          </button>
        </div>
      )}

      {gameState === GameState.VICTORY && (
        <div className="text-center p-10 max-w-md animate-in slide-in-from-bottom duration-700 panel-card">
          <h2 className="text-yellow-400 text-2xl mb-10 tracking-[0.2em]">CORE SECURED</h2>
          <div className="text-[10px] text-zinc-300 mb-10 leading-loose">
            HELIX DEFEATED. THE THERMAL GRID IS STABILIZED. YOU ARE THE SUPREME DEFENDER.
          </div>
          <div className="text-[9px] text-zinc-500 leading-relaxed mb-10">
            EPILOGUE: In the quiet afterglow, the city-core learns to breathe without its tyrant.
            Your drone docks in the coldglass vault, its hull cracked but its log intact.
            The next dawn boots on time, and the grid remembers your call-sign forever.
          </div>
          <button 
            onClick={() => {
              returnToMainMenu();
              setUnlockedLevel(10);
              setStoredValue(UNLOCKED_STORAGE_KEY, '10');
            }}
            className="w-full py-5 bg-blue-600 text-white text-xs border-b-8 border-blue-900"
          >
            RETURN TO MAIN MENU
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
