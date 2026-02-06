
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

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black text-white font-['Press_Start_2P'] select-none overflow-hidden">
      {gameState === GameState.START && (
        <div className="text-center p-8 max-w-md animate-fade-in flex flex-col items-center">
          <img src="assets/logo.png" alt="Overheat" className="w-64 mb-8 drop-shadow-[0_0_15px_rgba(255,65,54,0.5)]" />
          
          <div className="space-y-4 mb-12 w-full">
            <div className="text-[10px] text-zinc-400 uppercase">Thermal Defense Mission</div>
            <div className="text-[8px] text-zinc-500 uppercase">Don't trigger the core</div>
          </div>

          <button 
            onClick={() => { audioService.init(); setGameState(GameState.LEVEL_SELECT); }}
            className="w-full py-5 bg-red-600 hover:bg-red-500 text-white text-sm border-b-8 border-red-900 active:border-b-0 active:translate-y-2 transition-all mb-4"
          >
            START
          </button>
          
          <div className="mt-8 text-[9px] text-zinc-600 uppercase tracking-widest">
            BEST: {highScore.toLocaleString()}
          </div>
        </div>
      )}

      {gameState === GameState.LEVEL_SELECT && (
        <div className="text-center p-6 w-full max-w-lg animate-in fade-in duration-300">
          <h2 className="text-lg mb-8 tracking-widest text-red-400">SELECT SECTOR</h2>
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
                      : 'border-red-500 text-white hover:bg-red-600 active:scale-95 bg-red-900/20'
                    }`}
                >
                  {isLocked ? 'X' : idx + 1}
                </button>
              );
            })}
          </div>
          <button 
            onClick={() => setGameState(GameState.START)}
            className="text-[8px] text-zinc-500 underline uppercase"
          >
            Back to menu
          </button>
        </div>
      )}

      {gameState === GameState.NARRATIVE && (
        <div className="p-8 max-w-lg text-center bg-zinc-900/50 border-2 border-zinc-800 rounded-lg animate-in fade-in duration-500">
          <h2 className="text-yellow-400 text-sm mb-6 leading-relaxed uppercase tracking-tighter">
            {STORY_LEVELS[currentLevel].title}
          </h2>
          <p className="text-[10px] leading-loose text-zinc-300 mb-10 min-h-[100px]">
            {STORY_LEVELS[currentLevel].intro}
          </p>
          <button 
            onClick={startGame}
            className="px-10 py-4 bg-green-600 text-white text-[10px] border-b-4 border-green-800 active:border-b-0 active:translate-y-1"
          >
            BEGIN MISSION
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
          <h2 className="text-red-500 text-2xl mb-10 tracking-tighter">MISSION FAILED</h2>
          <div className="mb-12 space-y-4">
            <div className="text-[10px] text-zinc-500">SCORE</div>
            <div className="text-2xl text-white">{score.toLocaleString()}</div>
          </div>
          
          <button 
            onClick={() => { selectLevel(currentLevel); }}
            className="w-full py-5 bg-red-600 hover:bg-red-500 text-white text-xs border-b-8 border-red-900 active:border-b-0 active:translate-y-2 mb-4"
          >
            RETRY
          </button>
          <button 
            onClick={() => setGameState(GameState.LEVEL_SELECT)}
            className="w-full py-3 text-[10px] text-zinc-500 underline uppercase"
          >
            Level Select
          </button>
        </div>
      )}

      {gameState === GameState.VICTORY && (
        <div className="text-center p-10 max-w-md animate-bounce">
          <h2 className="text-yellow-400 text-2xl mb-10">CORE STABILIZED!</h2>
          <div className="text-[10px] text-zinc-300 mb-10 leading-loose">
            EMPEROR DEFEATED. OVERHEAT AVERTED.
          </div>
          <button 
            onClick={() => setGameState(GameState.START)}
            className="px-10 py-5 bg-red-600 text-white text-xs"
          >
            CONTINUE
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
