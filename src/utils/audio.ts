/**
 * Web Audio API synthesizer for retro-arcade cyberpunk sound effects
 * Zero external audio files required, runs 100% reliably in-browser.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxMuted: boolean = false;
  private musicMuted: boolean = false;
  private isMusicPlaying: boolean = false;
  private musicTimer: number | null = null;
  private musicStep: number = 0;

  constructor() {
    // AudioContext will be initialized on first user interaction
    const savedSfx = localStorage.getItem('shadow_runner_sfx_muted');
    if (savedSfx !== null) {
      this.sfxMuted = savedSfx === 'true';
    }
    const savedMusic = localStorage.getItem('shadow_runner_music_muted');
    if (savedMusic !== null) {
      this.musicMuted = savedMusic === 'true';
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setSfxMuted(muted: boolean) {
    this.sfxMuted = muted;
    localStorage.setItem('shadow_runner_sfx_muted', String(muted));
  }

  public isSfxMuted(): boolean {
    return this.sfxMuted;
  }

  public setMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    localStorage.setItem('shadow_runner_music_muted', String(muted));
    if (muted) {
      this.stopMusic();
    }
  }

  public isMusicMuted(): boolean {
    return this.musicMuted;
  }

  // Jump sound
  public playJump() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(540, t + 0.15);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.2);
    } catch {
      // Ignore audio errors
    }
  }

  // Slide sound
  public playSlide() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // White noise buffer for slide friction
      const bufferSize = this.ctx.sampleRate * 0.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, t);
      filter.frequency.linearRampToValueAtTime(300, t + 0.2);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.22);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + 0.23);
    } catch {
      // Ignore
    }
  }

  // Coin collected
  public playCoin() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(987.77, t); // B5
      osc1.frequency.setValueAtTime(1318.51, t + 0.08); // E6

      osc2.frequency.setValueAtTime(1318.51, t);
      osc2.frequency.setValueAtTime(1760.0, t + 0.08); // A6

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.3);
      osc2.stop(t + 0.3);
    } catch {
      // Ignore
    }
  }

  // Game over crash
  public playCrash() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.4);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.45);
    } catch {
      // Ignore
    }
  }

  // Start background synthwave arpeggio
  public startMusic() {
    if (this.musicMuted || this.isMusicPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    this.isMusicPlaying = true;
    this.musicStep = 0;

    const notes = [
      110, 110, 130.81, 146.83, 110, 110, 164.81, 146.83,
      98, 98, 123.47, 146.83, 98, 98, 146.83, 130.81,
    ];

    const tempoMs = 135; // ~110 BPM 16th note feel

    const tick = () => {
      if (!this.isMusicPlaying || this.musicMuted || !this.ctx) return;

      const freq = notes[this.musicStep % notes.length];
      const t = this.ctx.currentTime;

      // Bass note
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, t);
        filter.Q.setValueAtTime(4, t);

        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.13);

        // Subtle kick every 4 steps
        if (this.musicStep % 4 === 0) {
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(120, t);
          kickOsc.frequency.exponentialRampToValueAtTime(30, t + 0.1);

          kickGain.gain.setValueAtTime(0.08, t);
          kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

          kickOsc.connect(kickGain);
          kickGain.connect(this.ctx.destination);

          kickOsc.start(t);
          kickOsc.stop(t + 0.12);
        }
      } catch {
        // Ignore
      }

      this.musicStep++;
      this.musicTimer = window.setTimeout(tick, tempoMs);
    };

    tick();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const sound = new SoundEngine();
