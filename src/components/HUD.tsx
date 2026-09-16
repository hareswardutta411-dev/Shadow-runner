import React from 'react';
import { Trophy, Coins, Volume2, VolumeX, Music, Pause, Play } from 'lucide-react';
import { GameStats } from '../types';

interface HUDProps {
  stats: GameStats;
  isPaused: boolean;
  onTogglePause: () => void;
  sfxMuted: boolean;
  onToggleSfx: () => void;
  musicMuted: boolean;
  onToggleMusic: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  isPaused,
  onTogglePause,
  sfxMuted,
  onToggleSfx,
  musicMuted,
  onToggleMusic,
}) => {
  return (
    <header
      id="hud"
      className="fixed top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none"
    >
      {/* Left Stat Counters */}
      <div className="flex items-center gap-3">
        {/* Current Score */}
        <div
          id="hud-score-card"
          className="flex items-center gap-2 bg-[#050917]/80 border border-[#00eaff]/30 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-[0_0_12px_rgba(0,234,255,0.2)]"
        >
          <span className="text-xs uppercase tracking-widest text-cyan-300 font-medium">DIST</span>
          <span id="score" className="text-lg font-extrabold text-[#00eaff] tracking-wider font-mono">
            {stats.score}
          </span>
        </div>

        {/* Coins / Energy Cores */}
        <div
          id="hud-coins-card"
          className="flex items-center gap-1.5 bg-[#171305]/80 border border-[#ffd700]/30 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-[0_0_12px_rgba(255,215,0,0.2)]"
        >
          <Coins className="w-4 h-4 text-[#ffd700]" />
          <span id="coins" className="text-lg font-extrabold text-[#ffd700] tracking-wider font-mono">
            {stats.coins}
          </span>
        </div>

        {/* High Score Badge */}
        {stats.highScore > 0 && (
          <div
            id="hud-highscore-card"
            className="hidden sm:flex items-center gap-1.5 bg-[#14061a]/80 border border-[#c084fc]/30 backdrop-blur-md px-3 py-1.5 rounded-full"
          >
            <Trophy className="w-3.5 h-3.5 text-[#c084fc]" />
            <span className="text-xs text-purple-300 font-semibold tracking-wider font-mono">
              BEST {stats.highScore}
            </span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Speed Multiplier badge */}
        <div
          id="hud-speed-pill"
          className="hidden md:flex items-center bg-[#070b19]/80 border border-slate-700/60 px-3 py-1 rounded-full text-xs font-mono text-slate-300"
        >
          <span>{(stats.speed / 6).toFixed(1)}x SPEED</span>
        </div>

        {/* Sound SFX Toggle */}
        <button
          id="btn-toggle-sfx"
          type="button"
          onClick={onToggleSfx}
          title={sfxMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          className="p-2 rounded-full bg-[#090e24]/80 border border-cyan-500/30 text-cyan-400 hover:text-cyan-200 hover:border-cyan-400 transition-colors backdrop-blur-md active:scale-95 shadow-[0_0_10px_rgba(0,234,255,0.15)]"
        >
          {sfxMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Music Synth Toggle */}
        <button
          id="btn-toggle-music"
          type="button"
          onClick={onToggleMusic}
          title={musicMuted ? 'Play Synth Music' : 'Mute Music'}
          className="p-2 rounded-full bg-[#090e24]/80 border border-cyan-500/30 text-cyan-400 hover:text-cyan-200 hover:border-cyan-400 transition-colors backdrop-blur-md active:scale-95 shadow-[0_0_10px_rgba(0,234,255,0.15)]"
        >
          <Music className={`w-4 h-4 ${musicMuted ? 'text-slate-500 line-through' : 'text-[#ff00a0]'}`} />
        </button>

        {/* Pause Button */}
        <button
          id="btn-toggle-pause"
          type="button"
          onClick={onTogglePause}
          title={isPaused ? 'Resume' : 'Pause'}
          className="p-2 rounded-full bg-[#090e24]/80 border border-cyan-500/30 text-cyan-400 hover:text-cyan-200 hover:border-cyan-400 transition-colors backdrop-blur-md active:scale-95 shadow-[0_0_10px_rgba(0,234,255,0.15)]"
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
