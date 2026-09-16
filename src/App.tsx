import React, { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { MenuModal } from './components/MenuModal';
import { GameState, GameStats } from './types';
import { sound } from './utils/audio';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    coins: 0,
    highScore: 0,
    totalCoins: 0,
    speed: 6,
  });

  const [isNewRecord, setIsNewRecord] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(sound.isSfxMuted());
  const [musicMuted, setMusicMuted] = useState(sound.isMusicMuted());

  // Load saved high scores from local storage
  useEffect(() => {
    try {
      const savedHigh = localStorage.getItem('shadow_runner_highscore');
      const savedCoins = localStorage.getItem('shadow_runner_total_coins');
      setStats((prev) => ({
        ...prev,
        highScore: savedHigh ? parseInt(savedHigh, 10) || 0 : 0,
        totalCoins: savedCoins ? parseInt(savedCoins, 10) || 0 : 0,
      }));
    } catch {
      // Ignore local storage errors
    }
  }, []);

  // Update live stats from game canvas
  const handleUpdateStats = useCallback((score: number, coins: number, speed: number) => {
    setStats((prev) => ({
      ...prev,
      score,
      coins,
      speed,
    }));
  }, []);

  // Handle Game Over
  const handleGameOver = useCallback((finalScore: number, coinsEarned: number) => {
    sound.stopMusic();
    setGameState('gameover');

    setStats((prev) => {
      const isNew = finalScore > prev.highScore;
      const newHigh = Math.max(prev.highScore, finalScore);
      const newTotal = prev.totalCoins + coinsEarned;

      try {
        localStorage.setItem('shadow_runner_highscore', String(newHigh));
        localStorage.setItem('shadow_runner_total_coins', String(newTotal));
      } catch {
        // Ignore
      }

      setIsNewRecord(isNew && finalScore > 0);

      return {
        ...prev,
        score: finalScore,
        coins: coinsEarned,
        highScore: newHigh,
        totalCoins: newTotal,
      };
    });
  }, []);

  // Start game handler
  const handleStartGame = () => {
    setIsNewRecord(false);
    setGameState('playing');
    if (!musicMuted) {
      sound.startMusic();
    }
  };

  // Toggle pause
  const handleTogglePause = () => {
    if (gameState === 'playing') {
      setGameState('paused');
      sound.stopMusic();
    } else if (gameState === 'paused') {
      setGameState('playing');
      if (!musicMuted) {
        sound.startMusic();
      }
    }
  };

  // Sound SFX toggle
  const handleToggleSfx = () => {
    const next = !sfxMuted;
    setSfxMuted(next);
    sound.setSfxMuted(next);
  };

  // Music toggle
  const handleToggleMusic = () => {
    const next = !musicMuted;
    setMusicMuted(next);
    sound.setMusicMuted(next);
    if (!next && gameState === 'playing') {
      sound.startMusic();
    }
  };

  // Keybindings for Pause (Escape or P)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameState === 'playing' || gameState === 'paused') {
          e.preventDefault();
          handleTogglePause();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [gameState]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#050512] font-sans">
      {/* HUD - Active status counters and quick controls */}
      <HUD
        stats={stats}
        isPaused={gameState === 'paused'}
        onTogglePause={handleTogglePause}
        sfxMuted={sfxMuted}
        onToggleSfx={handleToggleSfx}
        musicMuted={musicMuted}
        onToggleMusic={handleToggleMusic}
      />

      {/* Main Canvas World */}
      <GameCanvas
        gameState={gameState}
        onGameOver={handleGameOver}
        onUpdateStats={handleUpdateStats}
        highScore={stats.highScore}
      />

      {/* Start / Pause / Game Over Modals */}
      <MenuModal
        gameState={gameState}
        score={stats.score}
        coins={stats.coins}
        highScore={stats.highScore}
        totalCoins={stats.totalCoins}
        isNewRecord={isNewRecord}
        onStartGame={handleStartGame}
        onResume={handleTogglePause}
        onRestart={handleStartGame}
      />
    </main>
  );
}
