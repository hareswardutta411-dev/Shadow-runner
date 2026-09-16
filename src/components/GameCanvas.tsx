import React, { useEffect, useRef, useCallback } from 'react';
import { GameState, Obstacle, Coin, Particle, Star, Building } from '../types';
import { sound } from '../utils/audio';

interface GameCanvasProps {
  gameState: GameState;
  onGameOver: (finalScore: number, coinsEarned: number) => void;
  onUpdateStats: (score: number, coins: number, speed: number) => void;
  highScore: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  onGameOver,
  onUpdateStats,
  highScore,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable refs for game loop performance
  const stateRef = useRef({
    running: false,
    score: 0,
    coinCount: 0,
    speed: 6,
    frame: 0,
    shake: 0,
    highScoreBeatenNotified: false,
    player: {
      x: 100,
      y: 0,
      w: 42,
      h: 65,
      velocityY: 0,
      gravity: 0.8,
      jumpPower: -15,
      grounded: false,
      sliding: false,
      slideTimer: 0,
    },
    obstacles: [] as Obstacle[],
    coins: [] as Coin[],
    particles: [] as Particle[],
    floatingTexts: [] as { x: number; y: number; text: string; color: string; life: number; vy: number }[],
    stars: [] as Star[],
    buildings: [] as Building[],
    nextObstacleId: 1,
    nextCoinId: 1,
    touchStartY: 0,
    touchStartX: 0,
  });

  const nextObstacleIdRef = useRef(1);
  const nextCoinIdRef = useRef(1);

  // Jump action
  const handleJump = useCallback(() => {
    const s = stateRef.current;
    if (gameState !== 'playing') return;

    if (s.player.grounded) {
      s.player.velocityY = s.player.jumpPower;
      s.player.grounded = false;
      s.player.sliding = false;
      sound.playJump();

      // Booster burst particles
      for (let i = 0; i < 14; i++) {
        s.particles.push({
          x: s.player.x + s.player.w / 2 + (Math.random() - 0.5) * 16,
          y: s.player.y + s.player.h,
          vx: (Math.random() - 0.5) * 6 - 2,
          vy: Math.random() * 4 + 2,
          life: 25 + Math.random() * 10,
          maxLife: 35,
          color: Math.random() > 0.4 ? '#00eaff' : '#00aaff',
          size: 3 + Math.random() * 3,
        });
      }
    }
  }, [gameState]);

  // Slide action
  const handleSlide = useCallback(() => {
    const s = stateRef.current;
    if (gameState !== 'playing') return;

    s.player.sliding = true;
    s.player.slideTimer = 26; // ~430ms at 60fps
    sound.playSlide();

    // Fast-drop if in air
    if (!s.player.grounded) {
      s.player.velocityY = Math.max(s.player.velocityY, 12);
    }
  }, [gameState]);

  // Reset and start game
  const resetGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const H = canvas.height;

    const s = stateRef.current;
    s.running = true;
    s.score = 0;
    s.coinCount = 0;
    s.speed = 6;
    s.frame = 0;
    s.shake = 0;
    s.highScoreBeatenNotified = false;

    s.obstacles = [];
    s.coins = [];
    s.particles = [];
    s.floatingTexts = [];

    s.player.x = Math.max(60, canvas.width * 0.12);
    s.player.y = H - 130;
    s.player.velocityY = 0;
    s.player.grounded = true;
    s.player.sliding = false;
    s.player.slideTimer = 0;

    onUpdateStats(0, 0, 6);
  }, [onUpdateStats]);

  // Initialize scenery (stars & buildings)
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * 2000,
        y: Math.random() * 800,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.04 + 0.01,
      });
    }

    const buildings: Building[] = [];
    const colors = ['#08081a', '#0d0d26', '#09091f', '#060614'];
    for (let x = 0; x < 3500; x += 65 + Math.floor(Math.random() * 20)) {
      const bHeight = 90 + ((x * 19) % 220);
      const rows = Math.floor(bHeight / 24);
      const cols = 2 + Math.floor(Math.random() * 2);
      const windowsLit: boolean[][] = [];
      for (let r = 0; r < rows; r++) {
        const row: boolean[] = [];
        for (let c = 0; c < cols; c++) {
          row.push(Math.random() > 0.45);
        }
        windowsLit.push(row);
      }

      buildings.push({
        x,
        w: 52 + Math.floor(Math.random() * 22),
        h: bHeight,
        color: colors[Math.floor(Math.random() * colors.length)],
        windowRows: rows,
        windowCols: cols,
        windowsLit,
      });
    }

    stateRef.current.stars = stars;
    stateRef.current.buildings = buildings;
  }, []);

  // Listen to gameState changes
  useEffect(() => {
    if (gameState === 'playing') {
      stateRef.current.running = true;
    } else {
      stateRef.current.running = false;
    }
  }, [gameState]);

  // Handle external reset when entering 'playing' from 'idle'
  const prevGameStateRef = useRef<GameState>(gameState);
  useEffect(() => {
    if (prevGameStateRef.current !== 'playing' && gameState === 'playing') {
      resetGame();
    }
    prevGameStateRef.current = gameState;
  }, [gameState, resetGame]);

  // Collision detection helper
  const checkCollision = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => {
    // 4px safety buffer for fair gameplay
    const pad = 4;
    return (
      a.x + pad < b.x + b.w &&
      a.x + a.w - pad > b.x &&
      a.y + pad < b.y + b.h &&
      a.y + a.h - pad > b.y
    );
  };

  // Main game animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const s = stateRef.current;
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      const groundY = H - 65;

      // Handle screen shake
      ctx.save();
      if (s.shake > 0) {
        const sx = (Math.random() - 0.5) * s.shake * 3;
        const sy = (Math.random() - 0.5) * s.shake * 3;
        ctx.translate(sx, sy);
        s.shake *= 0.88;
        if (s.shake < 0.2) s.shake = 0;
      }

      // Update state if actively playing
      if (s.running && gameState === 'playing') {
        s.frame++;
        s.speed += 0.0018;

        // Player physics
        s.player.velocityY += s.player.gravity;
        s.player.y += s.player.velocityY;

        // Slide timer
        if (s.player.sliding) {
          s.player.slideTimer--;
          if (s.player.slideTimer <= 0) {
            s.player.sliding = false;
          }

          // Slide spark particles
          if (s.player.grounded && s.frame % 2 === 0) {
            s.particles.push({
              x: s.player.x + 10 + Math.random() * 20,
              y: groundY - 2,
              vx: (Math.random() - 0.8) * 5,
              vy: -Math.random() * 3,
              life: 14,
              maxLife: 14,
              color: Math.random() > 0.5 ? '#00eaff' : '#ffea00',
              size: 2 + Math.random() * 2,
            });
          }
        }

        // Ground constraint
        const currentHeight = s.player.sliding ? 35 : s.player.h;
        if (s.player.y + currentHeight >= groundY) {
          s.player.y = groundY - currentHeight;
          s.player.velocityY = 0;
          s.player.grounded = true;
        } else {
          s.player.grounded = false;
        }

        // Obstacle spawning with progressive difficulty curve
        const spawnInterval = Math.max(48, Math.floor(115 - s.speed * 4.5));
        if (s.frame % spawnInterval === 0) {
          const type = Math.random() < 0.55 ? 'wall' : 'laser';
          if (type === 'wall') {
            s.obstacles.push({
              id: nextObstacleIdRef.current++,
              x: W + 60,
              y: groundY - 70,
              w: 36,
              h: 70,
              type: 'wall',
            });
          } else {
            // Laser beam overhead - slide to dodge
            s.obstacles.push({
              id: nextObstacleIdRef.current++,
              x: W + 60,
              y: groundY - 95,
              w: 75,
              h: 36,
              type: 'laser',
            });
          }
        }

        // Coin spawning
        if (s.frame % 70 === 0) {
          s.coins.push({
            id: nextCoinIdRef.current++,
            x: W + 40,
            y: groundY - 100 - Math.random() * 150,
            r: 11,
            bobOffset: Math.random() * Math.PI * 2,
          });
        }

        // Player current bounding box
        const playerBox = {
          x: s.player.x,
          y: s.player.sliding ? s.player.y : s.player.y,
          w: s.player.sliding ? s.player.w + 12 : s.player.w,
          h: currentHeight,
        };

        // Update obstacles & collisions
        let hit = false;
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const o = s.obstacles[i];
          o.x -= s.speed;

          if (checkCollision(playerBox, o)) {
            if (s.player.sliding && o.type === 'laser') {
              // Successfully sliding under laser!
              if (s.frame % 4 === 0) {
                s.particles.push({
                  x: o.x + o.w / 2,
                  y: o.y + o.h,
                  vx: (Math.random() - 0.5) * 3,
                  vy: Math.random() * 2 + 1,
                  life: 15,
                  maxLife: 15,
                  color: '#ff0055',
                  size: 3,
                });
              }
            } else {
              hit = true;
              break;
            }
          }

          if (o.x + o.w < -60) {
            s.obstacles.splice(i, 1);
          }
        }

        if (hit) {
          s.running = false;
          s.shake = 12;
          sound.playCrash();

          // Explosion particles
          for (let p = 0; p < 45; p++) {
            s.particles.push({
              x: s.player.x + s.player.w / 2,
              y: s.player.y + s.player.h / 2,
              vx: (Math.random() - 0.5) * 14,
              vy: (Math.random() - 0.5) * 14,
              life: 40 + Math.random() * 20,
              maxLife: 60,
              color: ['#00eaff', '#ff0055', '#ff1744', '#ffffff', '#ffd700'][Math.floor(Math.random() * 5)],
              size: 3 + Math.random() * 5,
            });
          }

          onGameOver(Math.floor(s.score), s.coinCount);
        }

        // Update coins & pickups
        for (let i = s.coins.length - 1; i >= 0; i--) {
          const c = s.coins[i];
          c.x -= s.speed;

          const cx = playerBox.x + playerBox.w / 2;
          const cy = playerBox.y + playerBox.h / 2;
          const dist = Math.hypot(cx - c.x, cy - c.y);

          if (dist < 38) {
            s.coinCount++;
            sound.playCoin();

            // Sparkles
            for (let p = 0; p < 12; p++) {
              s.particles.push({
                x: c.x,
                y: c.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 25,
                maxLife: 25,
                color: '#ffd700',
                size: 2.5 + Math.random() * 2.5,
              });
            }

            // Floating text
            s.floatingTexts.push({
              x: c.x,
              y: c.y - 10,
              text: '+1 CORE',
              color: '#ffd700',
              life: 30,
              vy: -1.4,
            });

            s.coins.splice(i, 1);
            continue;
          }

          if (c.x < -40) {
            s.coins.splice(i, 1);
          }
        }

        // Update particles
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
          if (p.life <= 0) {
            s.particles.splice(i, 1);
          }
        }

        // Update floating texts
        for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
          const ft = s.floatingTexts[i];
          ft.y += ft.vy;
          ft.life--;
          if (ft.life <= 0) {
            s.floatingTexts.splice(i, 1);
          }
        }

        // Update score
        s.score += 0.12;

        // Check if high score was just beaten during run
        if (highScore > 0 && s.score > highScore && !s.highScoreBeatenNotified) {
          s.highScoreBeatenNotified = true;
          s.floatingTexts.push({
            x: s.player.x + 60,
            y: s.player.y - 30,
            text: '⚡ NEW BEST!',
            color: '#00eaff',
            life: 50,
            vy: -1.0,
          });
        }

        // Sync stats periodically
        if (s.frame % 6 === 0) {
          onUpdateStats(Math.floor(s.score), s.coinCount, s.speed);
        }
      }

      // ==========================================
      // RENDER PIPELINE
      // ==========================================
      ctx.clearRect(0, 0, W, H);

      // 1. Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#040412');
      skyGrad.addColorStop(0.5, '#0a0a29');
      skyGrad.addColorStop(1, '#181845');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // 2. Distant Moon / Cyber Core
      const moonX = W - 110;
      const moonY = 95;
      const moonRadius = 42;

      // Outer moon halo
      const moonHalo = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.5, moonX, moonY, moonRadius * 2.8);
      moonHalo.addColorStop(0, 'rgba(0, 234, 255, 0.25)');
      moonHalo.addColorStop(0.5, 'rgba(120, 90, 255, 0.12)');
      moonHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = moonHalo;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius * 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Moon body
      ctx.save();
      ctx.shadowColor = '#00eaff';
      ctx.shadowBlur = 24;
      ctx.fillStyle = '#ebf8ff';
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
      ctx.fill();

      // Cyber crater stripes
      ctx.strokeStyle = 'rgba(160, 210, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(moonX - 8, moonY - 6, 14, 0.2, 3.2);
      ctx.stroke();
      ctx.restore();

      // 3. Stars
      for (let i = 0; i < s.stars.length; i++) {
        const star = s.stars[i];
        const sx = (star.x - s.frame * 0.2) % W;
        const starX = sx < 0 ? sx + W : sx;
        const currentAlpha = star.alpha * (0.6 + 0.4 * Math.sin(s.frame * star.twinkleSpeed + i));

        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha.toFixed(2)})`;
        ctx.fillRect(starX, star.y % (H * 0.55), star.size, star.size);
      }

      // 4. Parallax City Skyline
      const cityOffset = (s.frame * (s.speed * 0.25)) % 1400;
      for (const b of s.buildings) {
        let bx = b.x - cityOffset;
        while (bx < -b.w) {
          bx += 2800;
        }
        if (bx > W + 60) continue;

        const by = groundY - b.h;

        // Building silhouette
        ctx.fillStyle = b.color;
        ctx.fillRect(bx, by, b.w, b.h);

        // Building rooftop neon accent
        ctx.strokeStyle = 'rgba(0, 234, 255, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + b.w, by);
        ctx.stroke();

        // Lit Windows
        const colW = b.w / (b.windowCols + 1);
        for (let r = 0; r < b.windowRows; r++) {
          const winY = by + 16 + r * 22;
          if (winY > groundY - 12) break;

          for (let c = 0; c < b.windowCols; c++) {
            if (b.windowsLit[r] && b.windowsLit[r][c]) {
              ctx.fillStyle = (r + c) % 3 === 0 ? 'rgba(255, 0, 110, 0.75)' : 'rgba(0, 234, 255, 0.85)';
              ctx.fillRect(bx + 8 + c * colW, winY, 4, 7);
            }
          }
        }
      }

      // 5. High-Tech Ground & Grid Platform
      ctx.fillStyle = '#05050f';
      ctx.fillRect(0, groundY, W, 65);

      // Top grid laser line
      ctx.save();
      ctx.strokeStyle = '#00eaff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00eaff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(W, groundY);
      ctx.stroke();
      ctx.restore();

      // Lower secondary accent line
      ctx.strokeStyle = 'rgba(0, 234, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, groundY + 12);
      ctx.lineTo(W, groundY + 12);
      ctx.stroke();

      // Moving animated road/grid perspective dashes
      ctx.strokeStyle = '#252550';
      ctx.lineWidth = 3;
      const roadDashSpacing = 85;
      const roadOffset = (s.frame * s.speed) % roadDashSpacing;
      for (let x = -roadOffset; x < W + 100; x += roadDashSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, groundY + 24);
        ctx.lineTo(x + 42, groundY + 24);
        ctx.stroke();
      }

      // 6. Draw Coins
      for (const coin of s.coins) {
        const bob = Math.sin(s.frame * 0.08 + coin.bobOffset) * 4;
        const cy = coin.y + bob;

        ctx.save();
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 16;

        // Outer glow circle
        ctx.beginPath();
        ctx.arc(coin.x, cy, coin.r, 0, Math.PI * 2);
        ctx.fillStyle = '#ffe033';
        ctx.fill();

        // Inner core
        ctx.beginPath();
        ctx.arc(coin.x, cy, coin.r * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Pulsing core aura
        ctx.strokeStyle = 'rgba(255, 230, 80, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // 7. Draw Obstacles
      for (const obs of s.obstacles) {
        ctx.save();
        if (obs.type === 'wall') {
          // Cyber Barrier Wall
          ctx.shadowColor = '#ff1744';
          ctx.shadowBlur = 18;

          // Main wall body
          ctx.fillStyle = '#ff1744';
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

          // Digital hazard stripes
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(obs.x + 4, obs.y + 12);
          ctx.lineTo(obs.x + obs.w - 4, obs.y + 24);
          ctx.moveTo(obs.x + 4, obs.y + 36);
          ctx.lineTo(obs.x + obs.w - 4, obs.y + 48);
          ctx.stroke();

          // Top warning beacon
          ctx.fillStyle = s.frame % 8 < 4 ? '#ffffff' : '#ffea00';
          ctx.fillRect(obs.x + obs.w / 2 - 4, obs.y - 4, 8, 4);
        } else {
          // Overhead Laser Beam - Deadly energy beam
          ctx.shadowColor = '#ff0055';
          ctx.shadowBlur = 24;

          // Outer energy field
          ctx.fillStyle = 'rgba(255, 0, 85, 0.85)';
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

          // Ultra bright white energy laser core
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(obs.x, obs.y + obs.h * 0.35, obs.w, obs.h * 0.3);

          // Emitter nodes at left & right edges
          ctx.fillStyle = '#101020';
          ctx.fillRect(obs.x - 5, obs.y - 3, 7, obs.h + 6);
          ctx.fillRect(obs.x + obs.w - 2, obs.y - 3, 7, obs.h + 6);

          ctx.strokeStyle = '#ff0055';
          ctx.lineWidth = 2;
          ctx.strokeRect(obs.x - 5, obs.y - 3, 7, obs.h + 6);
          ctx.strokeRect(obs.x + obs.w - 2, obs.y - 3, 7, obs.h + 6);
        }
        ctx.restore();
      }

      // 8. Draw Player
      const isSliding = s.player.sliding;
      const ph = isSliding ? 34 : s.player.h;
      const py = isSliding ? s.player.y + 31 : s.player.y;
      const px = s.player.x;
      const pw = isSliding ? s.player.w + 12 : s.player.w;

      // Ground Shadow
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      const shadowW = isSliding ? 42 : 30;
      const shadowH = Math.max(2, 7 - (groundY - (py + ph)) * 0.05);
      ctx.ellipse(px + pw / 2, groundY - 2, shadowW, shadowH, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Player Body / Cyber Suit
      ctx.save();
      ctx.shadowColor = '#00eaff';
      ctx.shadowBlur = 20;

      if (isSliding) {
        // Sleek sliding / hover pose
        ctx.fillStyle = '#00eaff';
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, [6, 12, 12, 6]);
        ctx.fill();

        // Slide visor streak
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 12;
        ctx.fillRect(px + pw - 14, py + 8, 10, 4);

        // Slide propulsion jet
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + 4, py + ph / 2 - 2, 8, 4);
      } else {
        // Standard Running / Jumping Pose
        ctx.fillStyle = '#00eaff';
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, [8, 8, 4, 4]);
        ctx.fill();

        // Torso armor plate
        ctx.fillStyle = '#051b2c';
        ctx.fillRect(px + 8, py + 16, pw - 16, 26);

        // Cyber core reactor on chest
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px + pw / 2, py + 26, 4, 0, Math.PI * 2);
        ctx.fill();

        // Head helmet
        ctx.fillStyle = '#eaf7ff';
        ctx.beginPath();
        ctx.arc(px + pw / 2, py - 10, 15, 0, Math.PI * 2);
        ctx.fill();

        // Glowing red visor
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 10;
        ctx.fillRect(px + pw / 2 + 3, py - 13, 8, 5);

        // Running legs indicator if on ground
        if (s.player.grounded) {
          const legPhase = Math.sin(s.frame * 0.35);
          ctx.strokeStyle = '#00eaff';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          // Leg 1
          ctx.beginPath();
          ctx.moveTo(px + 12, py + ph);
          ctx.lineTo(px + 12 + legPhase * 8, py + ph + 6);
          ctx.stroke();
          // Leg 2
          ctx.beginPath();
          ctx.moveTo(px + 28, py + ph);
          ctx.lineTo(px + 28 - legPhase * 8, py + ph + 6);
          ctx.stroke();
        }
      }
      ctx.restore();

      // 9. Particles
      for (const p of s.particles) {
        ctx.save();
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      }

      // 10. Floating Texts (e.g., "+1 CORE", "NEW BEST!")
      for (const ft of s.floatingTexts) {
        ctx.save();
        ctx.font = 'bold 15px Rajdhani, Orbitron, sans-serif';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 10;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      ctx.restore(); // end screen shake

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [gameState, onGameOver, onUpdateStats, highScore]);

  // Touch and Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        handleJump();
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        handleSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleJump, handleSlide]);

  // Touch gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    stateRef.current.touchStartY = touch.clientY;
    stateRef.current.touchStartX = touch.clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const diffY = touch.clientY - stateRef.current.touchStartY;
    const diffX = touch.clientX - stateRef.current.touchStartX;

    // Distinguish swipe down from jump tap
    if (diffY > 40 && Math.abs(diffY) > Math.abs(diffX)) {
      handleSlide();
    } else {
      handleJump();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // If click happens directly on canvas, jump
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickY = e.clientY - rect.top;

    if (clickY > rect.height * 0.75) {
      handleSlide();
    } else {
      handleJump();
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none touch-none">
      <canvas
        ref={canvasRef}
        id="game"
        className="w-full h-full block cursor-pointer"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />

      {/* Touch Action Controls for mobile and tablet touchscreens */}
      {gameState === 'playing' && (
        <div className="md:hidden absolute bottom-5 left-0 right-0 px-6 flex justify-between items-center pointer-events-auto z-20">
          <button
            id="mobile-slide-btn"
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSlide();
            }}
            className="w-24 h-16 rounded-2xl bg-black/60 border-2 border-[#ff0055] text-[#ff0055] font-bold text-sm tracking-wider uppercase backdrop-blur-md shadow-[0_0_15px_rgba(255,0,85,0.4)] active:scale-95 flex flex-col items-center justify-center transition-transform"
          >
            <span>SLIDE</span>
            <span className="text-[10px] text-pink-300 opacity-80">▼ SWIPE</span>
          </button>

          <button
            id="mobile-jump-btn"
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleJump();
            }}
            className="w-24 h-16 rounded-2xl bg-black/60 border-2 border-[#00eaff] text-[#00eaff] font-bold text-sm tracking-wider uppercase backdrop-blur-md shadow-[0_0_15px_rgba(0,234,255,0.4)] active:scale-95 flex flex-col items-center justify-center transition-transform"
          >
            <span>JUMP</span>
            <span className="text-[10px] text-cyan-300 opacity-80">▲ TAP</span>
          </button>
        </div>
      )}
    </div>
  );
};
