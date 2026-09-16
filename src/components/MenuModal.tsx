import React from 'react';
import { GameState } from '../types';
import { Play, RotateCcw, Trophy, Coins, Flame, ArrowUp, ArrowDown } from 'lucide-react';

interface MenuModalProps {
  gameState: GameState;
  score: number;
  coins: number;
  highScore: number;
  totalCoins: number;
  isNewRecord: boolean;
  onStartGame: () => void;
  onResume: () => void;
  onRestart: () => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({
  gameState,
  score,
  coins,
  highScore,
  totalCoins,
  isNewRecord,
  onStartGame,
  onResume,
  onRestart,
}) => {
  if (gameState === 'playing') return null;

  return (
    <div
      id="menu"
      className="fixed inset-0 flex flex-col justify-center items-center text-center bg-[#03030f]/85 backdrop-blur-md z-30 px-4 py-8 select-none"
    >
      <div className="max-w-md w-full flex flex-col items-center">
        {/* ===================== START SCREEN ===================== */}
        {gameState === 'idle' && (
          <div className="flex flex-col items-center w-full animate-fadeIn">
            {/* Cyber Logo / Header */}
            <div className="relative mb-2">
              <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-cyan-400/80 mb-1 block">
                CYBER ARCADE 2099
              </span>
              <h1 className="text-4xl sm:text-5xl font-black text-[#00eaff] tracking-wider drop-shadow-[0_0_24px_rgba(0,234,255,0.7)] font-mono">
                SHADOW RUNNER
              </h1>
            </div>

            <p className="text-slate-300 text-sm sm:text-base max-w-xs mb-6 font-medium">
              Escape the shadow. Survive as long as you can across the neon skyline.
            </p>

            {/* High Score / Lifetime Stats */}
            {(highScore > 0 || totalCoins > 0) && (
              <div className="flex items-center gap-4 mb-6 bg-slate-900/70 border border-slate-800 px-5 py-2.5 rounded-2xl">
                <div className="flex items-center gap-2 text-purple-300 text-xs font-mono font-semibold">
                  <Trophy className="w-4 h-4 text-purple-400" />
                  <span>BEST: {highScore}</span>
                </div>
                <div className="h-4 w-px bg-slate-700" />
                <div className="flex items-center gap-2 text-yellow-400 text-xs font-mono font-semibold">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span>TOTAL: {totalCoins}</span>
                </div>
              </div>
            )}

            {/* Controls Info Graphic */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-8">
              <div className="flex flex-col items-center p-3 rounded-xl bg-slate-900/60 border border-cyan-500/20">
                <div className="flex items-center gap-1 text-[#00eaff] font-bold text-xs mb-1">
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>JUMP</span>
                </div>
                <span className="text-[11px] text-slate-300">Space / Up Arrow</span>
                <span className="text-[10px] text-red-400 mt-1">Clear ground barriers</span>
              </div>

              <div className="flex flex-col items-center p-3 rounded-xl bg-slate-900/60 border border-pink-500/20">
                <div className="flex items-center gap-1 text-[#ff0055] font-bold text-xs mb-1">
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>SLIDE</span>
                </div>
                <span className="text-[11px] text-slate-300">Down Arrow / S</span>
                <span className="text-[10px] text-pink-400 mt-1">Evade high lasers</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              id="startBtn"
              type="button"
              onClick={onStartGame}
              className="flex items-center justify-center gap-2 px-10 py-3.5 rounded-full border-2 border-[#00eaff] bg-[#071522] text-[#00eaff] font-bold text-base tracking-widest uppercase cursor-pointer shadow-[0_0_24px_rgba(0,234,255,0.45)] hover:bg-[#00eaff] hover:text-[#040914] active:scale-95 transition-all duration-200"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>START GAME</span>
            </button>
          </div>
        )}

        {/* ===================== GAME OVER SCREEN ===================== */}
        {gameState === 'gameover' && (
          <div id="gameOver" className="flex flex-col items-center w-full animate-fadeIn">
            {isNewRecord && (
              <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-pink-500/50 text-pink-300 text-xs font-bold tracking-widest uppercase mb-3 shadow-[0_0_12px_rgba(255,0,128,0.3)]">
                <Flame className="w-3.5 h-3.5 text-pink-400" />
                <span>NEW PERSONAL RECORD!</span>
              </div>
            )}

            <h2 className="text-4xl sm:text-5xl font-black text-[#ff1744] tracking-wider drop-shadow-[0_0_20px_rgba(255,23,68,0.7)] font-mono mb-2">
              GAME OVER
            </h2>
            <p className="text-slate-400 text-xs tracking-wider uppercase mb-6 font-mono">
              SIGNAL TERMINATED
            </p>

            {/* Run Stats Summary Card */}
            <div className="w-full max-w-xs bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mb-8 flex flex-col gap-3 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 uppercase font-mono">Final Distance</span>
                <span id="finalScore" className="text-2xl font-extrabold text-[#00eaff] font-mono">
                  {score}
                </span>
              </div>

              <div className="h-px bg-slate-800" />

              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 uppercase font-mono">Cores Collected</span>
                <div className="flex items-center gap-1.5 text-yellow-400 font-mono font-bold">
                  <Coins className="w-4 h-4" />
                  <span>+{coins}</span>
                </div>
              </div>

              <div className="h-px bg-slate-800" />

              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 uppercase font-mono">All-Time Best</span>
                <div className="flex items-center gap-1.5 text-purple-300 font-mono font-bold">
                  <Trophy className="w-4 h-4 text-purple-400" />
                  <span>{highScore}</span>
                </div>
              </div>
            </div>

            {/* Restart Button */}
            <button
              id="restartBtn"
              type="button"
              onClick={onRestart}
              className="flex items-center justify-center gap-2 px-10 py-3.5 rounded-full border-2 border-[#ff1744] bg-[#1e070e] text-[#ff1744] hover:bg-[#ff1744] hover:text-white font-bold text-base tracking-widest uppercase cursor-pointer shadow-[0_0_24px_rgba(255,23,68,0.4)] active:scale-95 transition-all duration-200"
            >
              <RotateCcw className="w-5 h-5" />
              <span>PLAY AGAIN</span>
            </button>
          </div>
        )}

        {/* ===================== PAUSE SCREEN ===================== */}
        {gameState === 'paused' && (
          <div className="flex flex-col items-center w-full animate-fadeIn">
            <h2 className="text-3xl sm:text-4xl font-black text-cyan-300 tracking-wider font-mono mb-2 drop-shadow-[0_0_15px_rgba(0,234,255,0.5)]">
              SYSTEM PAUSED
            </h2>
            <p className="text-slate-400 text-xs tracking-wider uppercase mb-6 font-mono">
              CURRENT SCORE: {score} • CORES: {coins}
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={onResume}
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-full border-2 border-[#00eaff] bg-[#071522] text-[#00eaff] font-bold text-sm tracking-widest uppercase cursor-pointer shadow-[0_0_16px_rgba(0,234,255,0.35)] hover:bg-[#00eaff] hover:text-[#040914] active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>RESUME</span>
              </button>

              <button
                type="button"
                onClick={onRestart}
                className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-full border border-slate-700 bg-slate-900 text-slate-300 font-semibold text-xs tracking-wider uppercase cursor-pointer hover:border-slate-500 active:scale-95 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESTART RUN</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
