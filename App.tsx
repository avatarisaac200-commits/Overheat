
import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameState } from './types';
import { audioService } from './services/AudioService';
import { STORY_LEVELS } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const savedHS = localStorage.getItem('overheat_highscore');
    if (savedHS) setHighScore(parseInt(savedHS, 10));

    const savedUL = localStorage.getItem('overheat_unlocked');
    if (savedUL) setUnlockedLevel(parseInt(savedUL, 10));
  }, []);

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('overheat_highscore', finalScore.toString());
    }
    setGameState(GameState.GAMEOVER);
  };

  const selectLevel = (index: number) => {
    setCurrentLevel(index);
    audioService.init();
    setGameState(GameState.NARRATIVE);
  };

  const startGame = () => {
    setGameState(GameState.PLAYING);
  };

  const nextLevel = () => {
    const nextIdx = currentLevel + 1;
    if (nextIdx < 10) {
      if (nextIdx + 1 > unlockedLevel) {
        setUnlockedLevel(nextIdx + 1);
        localStorage.setItem('overheat_unlocked', (nextIdx + 1).toString());
      }
      setCurrentLevel(nextIdx);
      setGameState(GameState.NARRATIVE);
    } else {
      setGameState(GameState.VICTORY);
    }
  };

  // Relative path ensures compatibility across varied hosting environments
  const LOGO_PATH = "./assets/logo.png";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black text-white font-['Press_Start_2P'] select-none overflow-hidden">
      {gameState === GameState.START && (
        <div className="text-center p-8 max-w-md animate-fade-in flex flex-col items-center">
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
          
          <div className="space-y-4 mb-12 w-full">
            <div className="text-[10px] text-zinc-400 uppercase tracking-widest">Thermal Defense Mission</div>
            <div className="text-[8px] text-zinc-500 uppercase">Avert the system meltdown</div>
          </div>

          <button 
            onClick={() => { audioService.init(); setGameState(GameState.LEVEL_SELECT); }}
            className="w-full py-5 bg-red-600 hover:bg-red-500 text-white text-sm border-b-8 border-red-900 active:border-b-0 active:translate-y-2 transition-all mb-4"
          >
            START MISSION
          </button>
          
          <div className="mt-8 text-[9px] text-zinc-600 uppercase tracking-[0.2em]">
            SYSTEM RECORD: {highScore.toLocaleString()}
          </div>
        </div>
      )}

      {gameState === GameState.LEVEL_SELECT && (
        <div className="text-center p-6 w-full max-w-lg animate-in fade-in zoom-in duration-300">
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
            onClick={() => setGameState(GameState.START)}
            className="text-[8px] text-zinc-600 hover:text-white underline uppercase transition-colors"
          >
            Back to Terminal
          </button>
        </div>
      )}

      {gameState === GameState.NARRATIVE && (
        <div className="p-8 max-w-lg text-center bg-zinc-900/60 border-2 border-zinc-800 rounded-sm animate-in fade-in duration-500 shadow-2xl">
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
        </div>
      )}

      {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
        <div className="w-full h-full">
          <GameCanvas 
            currentLevelIndex={currentLevel}
            onGameOver={handleGameOver} 
            onLevelComplete={nextLevel}
            gameState={gameState}
            onStateChange={setGameState}
          />
        </div>
      )}

      {gameState === GameState.GAMEOVER && (
        <div className="text-center p-10 max-w-md animate-in zoom-in duration-300">
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
        </div>
      )}

      {gameState === GameState.VICTORY && (
        <div className="text-center p-10 max-w-md animate-in slide-in-from-bottom duration-700">
          <h2 className="text-yellow-400 text-2xl mb-10 tracking-[0.2em]">CORE SECURED</h2>
          <div className="text-[10px] text-zinc-300 mb-10 leading-loose">
            EMPEROR DEFEATED. THE CODE BASE IS STABILIZED. YOU ARE THE SUPREME DEFENDER.
          </div>
          <button 
            onClick={() => {
              setGameState(GameState.START);
              setUnlockedLevel(10);
            }}
            className="w-full py-5 bg-blue-600 text-white text-xs border-b-8 border-blue-900"
          >
            MISSION COMPLETE
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
