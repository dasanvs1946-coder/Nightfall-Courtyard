import { CrateKind, TacticalGearId, WeaponId } from '../game/types';

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted = false;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  public unlock(): void {
    if (typeof window === 'undefined') return;
    const nav = navigator as Navigator & {
      userActivation?: { hasBeenActive: boolean };
    };
    if (nav.userActivation && !nav.userActivation.hasBeenActive) {
      return;
    }
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.noiseBuffer = this.createNoiseBuffer(this.ctx);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * 0.6);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private ready(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx || this.ctx.state !== 'running') return null;
    return this.ctx;
  }

  public playShoot(weapon: WeaponId): void {
    const ctx = this.ready();
    if (!ctx || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const pitchJitter = 0.94 + Math.random() * 0.12;

    const isHeavy =
      weapon === 'shotgun' ||
      weapon === 'autoshotgun' ||
      weapon === 'sniper' ||
      weapon === 'revolver';
    const isEnergy = weapon === 'railgun';
    const isFlame = weapon === 'flamethrower';

    // Noise crack layer
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = isFlame ? 'lowpass' : 'bandpass';
    const filterFreq = isFlame
      ? 720
      : weapon === 'sniper'
        ? 680
        : weapon === 'shotgun' || weapon === 'autoshotgun'
          ? 950
          : weapon === 'revolver' || weapon === 'dmr'
            ? 1280
            : weapon === 'smg' || weapon === 'dual'
              ? 2200
              : 1750;
    filter.frequency.setValueAtTime(filterFreq, now);
    filter.Q.setValueAtTime(isHeavy ? 0.75 : 1.1, now);

    const nGain = ctx.createGain();
    const nPeak =
      weapon === 'sniper'
        ? 0.38
        : isHeavy
          ? 0.32
          : isFlame
            ? 0.22
            : weapon === 'smg' || weapon === 'lmg'
              ? 0.16
              : 0.21;
    const nDur =
      weapon === 'sniper'
        ? 0.28
        : isHeavy
          ? 0.2
          : isFlame
            ? 0.14
            : 0.095;
    nGain.gain.setValueAtTime(nPeak, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + nDur);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + nDur);

    // Punchy oscillator thump / railgun zap
    const osc = ctx.createOscillator();
    osc.type = isEnergy ? 'sine' : isHeavy ? 'triangle' : 'sawtooth';
    const startFreq =
      (isEnergy
        ? 1120
        : weapon === 'sniper'
          ? 125
          : weapon === 'revolver'
            ? 175
            : isHeavy
              ? 150
              : weapon === 'smg'
                ? 280
                : 230) * pitchJitter;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(isEnergy ? 160 : 38, now + nDur);

    const oGain = ctx.createGain();
    oGain.gain.setValueAtTime(isEnergy || isHeavy ? 0.26 : 0.15, now);
    oGain.gain.exponentialRampToValueAtTime(0.001, now + nDur);

    osc.connect(oGain);
    oGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + nDur);
  }

  public playEmptyClick(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(980, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.03);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playReloadStart(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.07);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playReloadComplete(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    [520, 760].forEach((freq, idx) => {
      const t = now + idx * 0.055;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.15, t + 0.05);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.065);
    });
  }

  public playHit(heavy: boolean): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const base = heavy ? 110 : 175 * (0.92 + Math.random() * 0.16);
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.065);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(heavy ? 0.14 : 0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  public playKill(): void {
    const ctx = this.ready();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(820, now);
    filter.frequency.exponentialRampToValueAtTime(140, now + 0.16);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.17);
  }

  public playPlayerHurt(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.22);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  public playDash(): void {
    const ctx = this.ready();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.14);
    filter.Q.setValueAtTime(1.5, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.17);
  }

  public playPickup(kind: CrateKind): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes =
      kind === 'health'
        ? [523.25, 659.25, 783.99]
        : kind === 'rapidfire'
          ? [440, 554.37, 880]
          : [392, 523.25, 659.25];
    notes.forEach((freq, i) => {
      const t = now + i * 0.055;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    });
  }

  public playBruteTelegraph(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.linearRampToValueAtTime(62, now + 0.35);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.37);
  }

  public playWaveClear(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [392.0, 493.88, 587.33, 783.99];
    notes.forEach((freq, i) => {
      const t = now + i * 0.085;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.29);
    });
  }

  public playBossSpawn(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [110, 82.41, 65.41];
    notes.forEach((freq, i) => {
      const t = now + i * 0.12;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.75, t + 0.35);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(520, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  public playBossBarrage(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.22);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  public playUpgrade(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const t = now + i * 0.045;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  public playThunder(intensity = 1): void {
    const ctx = this.ready();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;

    // Sharp initial thunder crack
    const crack = ctx.createBufferSource();
    crack.buffer = this.noiseBuffer;
    const crackFilter = ctx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.setValueAtTime(620, now);
    crackFilter.frequency.exponentialRampToValueAtTime(140, now + 0.35);
    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0.18 * intensity, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    crack.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(ctx.destination);
    crack.start(now);
    crack.stop(now + 0.44);

    // Rolling sub-bass thunder decay
    const rumble = ctx.createOscillator();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(72, now + 0.04);
    rumble.frequency.exponentialRampToValueAtTime(34, now + 0.85);
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(160, now);
    const rGain = ctx.createGain();
    rGain.gain.setValueAtTime(0.001, now);
    rGain.gain.linearRampToValueAtTime(0.22 * intensity, now + 0.08);
    rGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    rumble.connect(lowpass);
    lowpass.connect(rGain);
    rGain.connect(ctx.destination);
    rumble.start(now);
    rumble.stop(now + 0.92);
  }

  public playAcidSpit(): void {
    const ctx = this.ready();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(210, now + 0.18);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(920, now);
    filter.Q.setValueAtTime(3.2, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playAcidSplat(): void {
    const ctx = this.ready();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(420, now + 0.22);
    filter.Q.setValueAtTime(2.0, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.24);
  }

  public playStalkerLunge(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(940, now + 0.14);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playArmorClang(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    [1380, 2060].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq * (0.95 + Math.random() * 0.1), now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.65, now + 0.08);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    });
  }

  public playGearDeploy(gear: TacticalGearId): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes =
      gear === 'mine'
        ? [620, 880]
        : gear === 'turret'
          ? [440, 660, 880]
          : [780, 1040];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.05;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.095);
    });
  }

  public playGearExplosion(): void {
    const ctx = this.ready();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(640, now);
    filter.frequency.exponentialRampToValueAtTime(95, now + 0.42);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.36, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.45);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.35);
    const oGain = ctx.createGain();
    oGain.gain.setValueAtTime(0.3, now);
    oGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    osc.connect(oGain);
    oGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  public playFlashbang(): void {
    const ctx = this.ready();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, now);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.3, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.26);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2450, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.45);
    const oGain = ctx.createGain();
    oGain.gain.setValueAtTime(0.09, now);
    oGain.gain.exponentialRampToValueAtTime(0.001, now + 0.46);
    osc.connect(oGain);
    oGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.48);
  }

  public playRevive(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Low shockwave thump
    const bass = ctx.createOscillator();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(140, now);
    bass.frequency.exponentialRampToValueAtTime(38, now + 0.35);
    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(0.28, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    bass.connect(bassGain);
    bassGain.connect(ctx.destination);
    bass.start(now);
    bass.stop(now + 0.38);

    // Ascending second-chance triad
    const notes = [392.0, 523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const t = now + i * 0.06;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  public playGameOver(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [329.63, 277.18, 220.0, 146.83];
    notes.forEach((freq, i) => {
      const t = now + i * 0.14;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.13, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.33);
    });
  }
}
