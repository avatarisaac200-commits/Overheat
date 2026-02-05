
import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameState } from './types';
import { audioService } from './services/AudioService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('overheat_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('overheat_highscore', finalScore.toString());
    }
    setGameState(GameState.GAMEOVER);
  };

  const startGame = () => {
    audioService.init();
    setGameState(GameState.PLAYING);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-zinc-950 text-white font-['Press_Start_2P'] select-none overflow-hidden">
      {gameState === GameState.START && (
        <div className="text-center p-8 max-w-md animate-fade-in flex flex-col items-center">
          <h1 className="text-3xl sm:text-5xl text-blue-500 mb-2 drop-shadow-[0_6px_0_#003d73] tracking-tighter">OVERHEAT</h1>
          <p className="text-[9px] text-zinc-500 mb-12 tracking-[0.2em]">ADVANCED ARCADE UNIT v2.0</p>
          
          <div className="grid grid-cols-2 gap-3 mb-12 w-full">
            <div className="text-[8px] text-left bg-zinc-900/80 p-3 rounded border border-zinc-800">
              <span className="text-yellow-400 block mb-1">HOLD TAP:</span>
              <span className="text-zinc-400">BURST FIRE (DANGER)</span>
            </div>
            <div className="text-[8px] text-left bg-zinc-900/80 p-3 rounded border border-zinc-800">
              <span className="text-blue-400 block mb-1">DRAG:</span>
              <span className="text-zinc-400">FOLLOW TOUCH</span>
            </div>
            <div className="text-[8px] text-left bg-zinc-900/80 p-3 rounded border border-zinc-800">
              <span className="text-orange-400 block mb-1">COMBO:</span>
              <span className="text-zinc-400">CHAIN KILLS FOR XP</span>
            </div>
            <div className="text-[8px] text-left bg-zinc-900/80 p-3 rounded border border-zinc-800">
              <span className="text-red-400 block mb-1">TEMP:</span>
              <span className="text-zinc-400">DON'T MAX OUT!</span>
            </div>
          </div>

          <button 
            onClick={startGame}
            className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white text-sm border-b-8 border-blue-900 active:border-b-0 active:translate-y-2 transition-all mb-4"
          >
            INITIATE SYSTEM
          </button>
          
          <div className="mt-8 text-[9px] text-zinc-600 uppercase tracking-widest">
            Record: {highScore.toLocaleString()}
          </div>
        </div>
      )}

      {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
        <div className="w-full h-full">
          <GameCanvas 
            onGameOver={handleGameOver} 
            gameState={gameState}
            onStateChange={setGameState}
          />
          {gameState === GameState.PLAYING && (
            <button 
              onClick={() => setGameState(GameState.PAUSED)}
              className="absolute top-4 right-4 z-20 bg-white/5 border border-white/10 px-3 py-2 text-[8px] hover:bg-white/20 active:scale-95"
            >
              PAUSE
            </button>
          )}
        </div>
      )}

      {gameState === GameState.GAMEOVER && (
        <div className="text-center p-10 max-w-md animate-in fade-in zoom-in duration-300">
          <h2 className="text-red-500 text-3xl mb-10 tracking-tighter">UNIT COMPROMISED</h2>
          <div className="mb-12 space-y-6">
            <div>
              <div className="text-[10px] text-zinc-500 mb-2 uppercase">Current Data</div>
              <div className="text-3xl text-white">{score.toLocaleString()}</div>
            </div>
            {score === highScore && score > 0 && (
              <div className="text-[10px] text-yellow-400 animate-pulse ring-2 ring-yellow-400 py-2 inline-block px-4">NEW RECORD DETECTED</div>
            )}
            <div className="text-[10px] text-zinc-600 uppercase">System Peak: {highScore.toLocaleString()}</div>
          </div>
          
          <button 
            onClick={startGame}
            className="w-full py-5 bg-red-600 hover:bg-red-500 text-white text-sm border-b-8 border-red-900 active:border-b-0 active:translate-y-2 transition-all mb-6"
          >
            REDEPLOY
          </button>
          <button 
            onClick={() => setGameState(GameState.START)}
            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white text-xs border border-zinc-700"
          >
            RETURN TO BASE
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
