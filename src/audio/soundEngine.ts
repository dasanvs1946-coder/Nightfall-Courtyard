import { CrateKind, TacticalGearId, WeaponId } from '../game/types';

export interface AdaptiveMusicState {
  activeGameplay: boolean;
  isBossWave: boolean;
  bloodMoonActive: boolean;
  hpRatio: number; // 0..1
}

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private muted = false;
  private masterVolume = 0.85;
  private musicVolume = 0.7;
  private sfxVolume = 0.85;
  private bossIntensityActive = false;
  private musicPulseCooldown = 0;
  private musicStep = 0;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.syncGainLevels();
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    this.syncGainLevels();
    return this.muted;
  }

  public setVolumes(master: number, music: number, sfx: number): void {
    this.masterVolume = Math.max(0, Math.min(1, master));
    this.musicVolume = Math.max(0, Math.min(1, music));
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    this.syncGainLevels();
  }

  private syncGainLevels(): void {
    if (!this.ctx || !this.masterGain || !this.sfxGain || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const effectiveMaster = this.muted ? 0 : this.masterVolume;
    this.masterGain.gain.setTargetAtTime(effectiveMaster, now, 0.02);
    this.sfxGain.gain.setTargetAtTime(this.sfxVolume, now, 0.02);
    this.musicGain.gain.setTargetAtTime(this.musicVolume, now, 0.02);
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
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.syncGainLevels();
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
    if (this.muted || this.masterVolume <= 0.001) return null;
    if (!this.ctx || this.ctx.state !== 'running') return null;
    return this.ctx;
  }

  private getSfxOut(ctx: AudioContext): AudioNode {
    return this.sfxGain ?? ctx.destination;
  }

  private getMusicOut(ctx: AudioContext): AudioNode {
    return this.musicGain ?? ctx.destination;
  }

  public playShoot(weapon: WeaponId): void {
    const ctx = this.ready();
    if (!ctx || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const pitchJitter = 0.94 + Math.random() * 0.12;

    if (weapon === 'pulse_katana') {
      const slash = ctx.createBufferSource();
      slash.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600 * pitchJitter, now);
      filter.frequency.exponentialRampToValueAtTime(420, now + 0.16);
      filter.Q.setValueAtTime(2.6, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.26, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
      slash.connect(filter);
      filter.connect(gain);
      gain.connect(this.getSfxOut(ctx));
      slash.start(now);
      slash.stop(now + 0.18);

      const chime = ctx.createOscillator();
      chime.type = 'triangle';
      chime.frequency.setValueAtTime(680 * pitchJitter, now);
      chime.frequency.exponentialRampToValueAtTime(220, now + 0.14);
      const cGain = ctx.createGain();
      cGain.gain.setValueAtTime(0.14, now);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      chime.connect(cGain);
      cGain.connect(this.getSfxOut(ctx));
      chime.start(now);
      chime.stop(now + 0.16);
      return;
    }

    const isHeavy =
      weapon === 'shotgun' ||
      weapon === 'autoshotgun' ||
      weapon === 'sniper' ||
      weapon === 'revolver' ||
      weapon === 'micro_launcher';
    const isEnergy =
      weapon === 'railgun' ||
      weapon === 'gauss_carbine' ||
      weapon === 'cryo_carbine';
    const isFlame = weapon === 'flamethrower' || weapon === 'chem_thrower';

    // Noise crack layer
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = isFlame ? 'lowpass' : 'bandpass';
    const filterFreq = isFlame
      ? weapon === 'chem_thrower'
        ? 920
        : 720
      : weapon === 'sniper' || weapon === 'micro_launcher'
        ? 680
        : weapon === 'shotgun' || weapon === 'autoshotgun'
          ? 950
          : weapon === 'revolver' || weapon === 'dmr' || weapon === 'gauss_carbine'
            ? 1280
            : weapon === 'smg' || weapon === 'dual' || weapon === 'twin9'
              ? 2200
              : 1750;
    filter.frequency.setValueAtTime(filterFreq, now);
    filter.Q.setValueAtTime(isHeavy ? 0.75 : 1.1, now);

    const nGain = ctx.createGain();
    const nPeak =
      weapon === 'sniper' || weapon === 'micro_launcher'
        ? 0.36
        : isHeavy
          ? 0.32
          : isFlame
            ? 0.22
            : weapon === 'smg' || weapon === 'lmg' || weapon === 'vulcan_minigun'
              ? 0.16
              : 0.21;
    const nDur =
      weapon === 'sniper' || weapon === 'micro_launcher'
        ? 0.26
        : isHeavy
          ? 0.2
          : isFlame
            ? 0.14
            : 0.095;
    nGain.gain.setValueAtTime(nPeak, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + nDur);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.getSfxOut(ctx));
    noise.start(now);
    noise.stop(now + nDur);

    // Punchy oscillator thump / energy zap
    const osc = ctx.createOscillator();
    osc.type = isEnergy ? 'sine' : isHeavy ? 'triangle' : 'sawtooth';
    const startFreq =
      (weapon === 'cryo_carbine'
        ? 1480
        : weapon === 'gauss_carbine'
          ? 960
          : isEnergy
            ? 1120
            : weapon === 'micro_launcher'
              ? 185
              : weapon === 'sniper'
                ? 125
                : weapon === 'revolver'
                  ? 175
                  : isHeavy
                    ? 150
                    : weapon === 'smg' || weapon === 'twin9'
                      ? 295
                      : weapon === 'vulcan_minigun'
                        ? 210
                        : 230) * pitchJitter;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(isEnergy ? 180 : 38, now + nDur);

    const oGain = ctx.createGain();
    oGain.gain.setValueAtTime(isEnergy || isHeavy ? 0.25 : 0.15, now);
    oGain.gain.exponentialRampToValueAtTime(0.001, now + nDur);

    osc.connect(oGain);
    oGain.connect(this.getSfxOut(ctx));
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
    gain.connect(this.getSfxOut(ctx));
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
    gain.connect(this.getSfxOut(ctx));
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
      gain.connect(this.getSfxOut(ctx));
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
    gain.connect(this.getSfxOut(ctx));
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
    gain.connect(this.getSfxOut(ctx));
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
    gain.connect(this.getSfxOut(ctx));
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
    gain.connect(this.getSfxOut(ctx));
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
      gain.connect(this.getSfxOut(ctx));
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
    gain.connect(this.getSfxOut(ctx));
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
      gain.connect(this.getSfxOut(ctx));
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
      gain.connect(this.getSfxOut(ctx));
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
    gain.connect(this.getSfxOut(ctx));
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
      gain.connect(this.getSfxOut(ctx));
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
    crackGain.connect(this.getSfxOut(ctx));
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
    rGain.connect(this.getSfxOut(ctx));
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
    gain.connect(this.getSfxOut(ctx));
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
    gain.connect(this.getSfxOut(ctx));
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
    gain.connect(this.getSfxOut(ctx));
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
      gain.connect(this.getSfxOut(ctx));
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
      gain.connect(this.getSfxOut(ctx));
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
    nGain.connect(this.getSfxOut(ctx));
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
    oGain.connect(this.getSfxOut(ctx));
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
    nGain.connect(this.getSfxOut(ctx));
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
    oGain.connect(this.getSfxOut(ctx));
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
    bassGain.connect(this.getSfxOut(ctx));
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
      gain.connect(this.getSfxOut(ctx));
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  public playGameOver(): void {
    this.bossIntensityActive = false;
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
      gain.connect(this.getSfxOut(ctx));
      osc.start(t);
      osc.stop(t + 0.33);
    });
  }

  public setBossIntensity(active: boolean): void {
    if (this.bossIntensityActive === active) return;
    this.bossIntensityActive = active;
    if (active) {
      this.musicPulseCooldown = Math.min(this.musicPulseCooldown, 0.05);
    }
  }

  public updateDynamicMusic(
    dt: number,
    stateOrPlaying: boolean | AdaptiveMusicState,
  ): void {
    const state: AdaptiveMusicState =
      typeof stateOrPlaying === 'boolean'
        ? {
            activeGameplay: stateOrPlaying,
            isBossWave: this.bossIntensityActive,
            bloodMoonActive: false,
            hpRatio: 1,
          }
        : stateOrPlaying;
    if (!state.activeGameplay || this.musicVolume <= 0.001) return;
    const ctx = this.ready();
    if (!ctx) return;

    const isLowHp = state.hpRatio > 0 && state.hpRatio <= 0.25;
    const isHighThreat = state.isBossWave || state.bloodMoonActive;
    const stepInterval = state.bloodMoonActive
      ? 0.28
      : state.isBossWave
        ? 0.34
        : isLowHp
          ? 0.38
          : 0.56;

    this.musicPulseCooldown -= dt;
    if (this.musicPulseCooldown > 0) return;
    this.musicPulseCooldown = stepInterval;

    const now = ctx.currentTime;
    const musicOut = this.getMusicOut(ctx);
    const step = this.musicStep;
    this.musicStep += 1;

    // Layer 1: Atmospheric sub/mid combat synth bass (always present subtly during runs)
    const bassProg = state.bloodMoonActive
      ? [61.74, 65.41, 73.42, 55.0]
      : state.isBossWave
        ? [55.0, 55.0, 61.74, 51.91]
        : [55.0, 65.41, 49.0, 55.0];
    const freq = bassProg[step % bassProg.length];
    const accented = step % 4 === 0;

    const osc = ctx.createOscillator();
    osc.type = isHighThreat ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(
      isHighThreat ? (accented ? 360 : 230) : accented ? 200 : 140,
      now,
    );
    filter.frequency.exponentialRampToValueAtTime(75, now + stepInterval * 0.85);

    const bassGain = ctx.createGain();
    const baseAmp = isHighThreat
      ? accented
        ? 0.115
        : 0.075
      : accented
        ? 0.055
        : 0.036;
    bassGain.gain.setValueAtTime(baseAmp, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepInterval * 0.9);
    osc.connect(filter);
    filter.connect(bassGain);
    bassGain.connect(musicOut);
    osc.start(now);
    osc.stop(now + stepInterval * 0.92);

    // Layer 2: High-threat arpeggio & industrial hi-hat on Boss / Blood Moon
    if (isHighThreat) {
      if (this.noiseBuffer && step % 2 === 0) {
        const hat = ctx.createBufferSource();
        hat.buffer = this.noiseBuffer;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(4200, now);
        const hGain = ctx.createGain();
        hGain.gain.setValueAtTime(accented ? 0.042 : 0.022, now);
        hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        hat.connect(hp);
        hp.connect(hGain);
        hGain.connect(musicOut);
        hat.start(now);
        hat.stop(now + 0.09);
      }

      if (state.bloodMoonActive || accented) {
        const leadNotes = state.bloodMoonActive
          ? [220, 261.63, 293.66, 246.94]
          : [164.81, 196.0, 220.0, 174.61];
        const lead = ctx.createOscillator();
        lead.type = 'triangle';
        lead.frequency.setValueAtTime(leadNotes[step % leadNotes.length], now);
        const lGain = ctx.createGain();
        lGain.gain.setValueAtTime(state.bloodMoonActive ? 0.045 : 0.03, now);
        lGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        lead.connect(lGain);
        lGain.connect(musicOut);
        lead.start(now);
        lead.stop(now + 0.19);
      }
    }

    // Layer 3: Critical Low-HP (<25%) double-thump heartbeat pulse
    if (isLowHp && step % 2 === 0) {
      [0, 0.13].forEach((offset, idx) => {
        const t = now + offset;
        const hb = ctx.createOscillator();
        hb.type = 'sine';
        hb.frequency.setValueAtTime(idx === 0 ? 68 : 54, t);
        hb.frequency.exponentialRampToValueAtTime(34, t + 0.1);
        const hGain = ctx.createGain();
        hGain.gain.setValueAtTime(idx === 0 ? 0.095 : 0.07, t);
        hGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
        hb.connect(hGain);
        hGain.connect(musicOut);
        hb.start(t);
        hb.stop(t + 0.12);
      });
    }
  }

  public playBossFootstep(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(78, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.16);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    osc.connect(gain);
    gain.connect(this.getSfxOut(ctx));
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playStalkerHiss(): void {
    const ctx = this.ready();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2900, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.24);
    filter.Q.setValueAtTime(4.2, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.getSfxOut(ctx));
    noise.start(now);
    noise.stop(now + 0.26);
  }

  public playBomberExplosion(): void {
    const ctx = this.ready();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(110, now + 0.38);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.32, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.getSfxOut(ctx));
    noise.start(now);
    noise.stop(now + 0.42);

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.34);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.getSfxOut(ctx));
    osc.start(now);
    osc.stop(now + 0.36);
  }

  public playHowlerScream(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.linearRampToValueAtTime(860, now + 0.16);
    osc.frequency.exponentialRampToValueAtTime(310, now + 0.48);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(980, now);
    filter.Q.setValueAtTime(3.0, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getSfxOut(ctx));
    osc.start(now);
    osc.stop(now + 0.52);
  }

  public playBossPhase2Roar(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    [98, 73.4].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.55, now + 0.65);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(640, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.getSfxOut(ctx));
      osc.start(now + i * 0.04);
      osc.stop(now + 0.7);
    });
  }

  public playPerkSelect(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 987.77].forEach((freq, i) => {
      const t = now + i * 0.055;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.getSfxOut(ctx));
      osc.start(t);
      osc.stop(t + 0.23);
    });
  }

  public playWeaponEvolution(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    [440, 554.37, 659.25, 880, 1108.73].forEach((freq, i) => {
      const t = now + i * 0.06;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
      osc.connect(gain);
      gain.connect(this.getSfxOut(ctx));
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  public playBarrelExplosion(): void {
    this.playGearExplosion();
  }

  public playGeneratorOnline(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    [330, 440, 660, 880].forEach((freq, i) => {
      const t = now + i * 0.07;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.13, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(this.getSfxOut(ctx));
      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  public playGeneratorDisable(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    [480, 320, 190].forEach((freq, i) => {
      const t = now + i * 0.08;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(this.getSfxOut(ctx));
      osc.start(t);
      osc.stop(t + 0.18);
    });
  }

  public playGadgetDeploy(gadget: 'tripmine' | 'decoy' | 'wire' | 'mortar'): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    const seq =
      gadget === 'mortar'
        ? [880, 660, 520]
        : gadget === 'decoy'
          ? [680, 920]
          : gadget === 'wire'
            ? [420, 580]
            : [740, 1120];
    seq.forEach((freq, i) => {
      const t = now + i * 0.05;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain);
      gain.connect(this.getSfxOut(ctx));
      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  public playMortarImpact(): void {
    this.playGearExplosion();
  }

  public playTeslaArc(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.09);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.085, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
    osc.connect(gain);
    gain.connect(this.getSfxOut(ctx));
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playUltimateActivate(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    [220, 330, 440, 660, 880].forEach((freq, i) => {
      const t = now + i * 0.045;
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, t + 0.16);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(gain);
      gain.connect(this.getSfxOut(ctx));
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  public playExecutionDash(): void {
    const ctx = this.ready();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(92, now + 0.18);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.getSfxOut(ctx));
    osc.start(now);
    osc.stop(now + 0.21);
  }

  public playCursedPerk(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    [293.66, 277.18, 220].forEach((freq, i) => {
      const t = now + i * 0.08;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(780, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.getSfxOut(ctx));
      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  public playDroneAction(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1180, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.08);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
    osc.connect(gain);
    gain.connect(this.getSfxOut(ctx));
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playComboMilestone(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    [587.33, 880].forEach((freq, i) => {
      const t = now + i * 0.05;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(this.getSfxOut(ctx));
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  public playCryoShatter(): void {
    const ctx = this.ready();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1900, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.getSfxOut(ctx));
    noise.start(now);
    noise.stop(now + 0.2);
  }

  public playTrainHorn(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    [185, 233, 277].forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 0.96, now + 0.72);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(920, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.11, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.getSfxOut(ctx));
      osc.start(now);
      osc.stop(now + 0.78);
    });
  }

  public playTrainWhoosh(): void {
    const ctx = this.ready();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.exponentialRampToValueAtTime(640, now + 0.24);
    filter.frequency.exponentialRampToValueAtTime(140, now + 0.56);
    filter.Q.setValueAtTime(1.2, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.getSfxOut(ctx));
    noise.start(now);
    noise.stop(now + 0.6);
  }

  public playCryoCanisterNova(): void {
    this.playCryoShatter();
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1320, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.34);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    osc.connect(gain);
    gain.connect(this.getSfxOut(ctx));
    osc.start(now);
    osc.stop(now + 0.38);
  }

  public playSirenEvent(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    [0, 0.26].forEach((offset) => {
      const t = now + offset;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.linearRampToValueAtTime(760, t + 0.12);
      osc.frequency.linearRampToValueAtTime(420, t + 0.24);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1350, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.getSfxOut(ctx));
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  public playPodShatter(): void {
    this.playCryoShatter();
  }

  public playGasVentHiss(): void {
    const ctx = this.ready();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1650, now);
    filter.Q.setValueAtTime(1.8, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.getSfxOut(ctx));
    noise.start(now);
    noise.stop(now + 0.4);
  }

  public playPylonBreak(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    [660, 440, 260].forEach((freq, i) => {
      const t = now + i * 0.05;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(this.getSfxOut(ctx));
      osc.start(t);
      osc.stop(t + 0.17);
    });
  }

  public playBossShieldBreak(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const t = now + i * 0.055;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.getSfxOut(ctx));
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  public playEmpOutage(): void {
    this.playGeneratorDisable();
  }

  public playBreakerFlip(): void {
    this.playGeneratorOnline();
  }

  public playPadActivate(): void {
    this.playGeneratorOnline();
  }

  public playRoofFall(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.34);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.getSfxOut(ctx));
    osc.start(now);
    osc.stop(now + 0.36);
  }

  public playNecroRevive(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.22);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(this.getSfxOut(ctx));
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playExtractionChopper(): void {
    const ctx = this.ready();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const t = now + i * 0.085;
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.getSfxOut(ctx));
      noise.start(t);
      noise.stop(t + 0.08);
    }
    const flare = ctx.createOscillator();
    flare.type = 'triangle';
    flare.frequency.setValueAtTime(440, now);
    flare.frequency.exponentialRampToValueAtTime(880, now + 0.35);
    const fGain = ctx.createGain();
    fGain.gain.setValueAtTime(0.12, now);
    fGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    flare.connect(fGain);
    fGain.connect(this.getSfxOut(ctx));
    flare.start(now);
    flare.stop(now + 0.4);
  }

  public playExtractionComplete(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const t = now + idx * 0.08;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      osc.connect(gain);
      gain.connect(this.getSfxOut(ctx));
      osc.start(t);
      osc.stop(t + 0.44);
    });
  }

  public playReactorHit(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(88, now + 0.14);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getSfxOut(ctx));
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playContractClaim(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const now = ctx.currentTime;
    [587.33, 880, 1174.66].forEach((freq, idx) => {
      const t = now + idx * 0.055;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.getSfxOut(ctx));
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }
}


