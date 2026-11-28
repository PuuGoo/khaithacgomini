/**
 * TimberPort 3D — 100% Procedural Web Audio Synthesizer
 * Crisp tactile feedback for chopping, sawing, cash chimes, ship horns & upgrades
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('timberport_muted') === '1';
  }

  ensureCtx() {
    if (this.muted) return null;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('timberport_muted', this.muted ? '1' : '0');
    return this.muted;
  }

  playChop(pitch = 1.0) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(165 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.09);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  playTreeFall() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.25);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  playSaw() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(290, now);
    osc.frequency.linearRampToValueAtTime(420, now + 0.08);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  playCash() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.055);
      gain.gain.setValueAtTime(0.12, now + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.17);
    });
  }

  playUpgrade() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      gain.gain.setValueAtTime(0.14, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.2);
    });
  }

  playShipHorn() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [130.8, 164.8].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.58);
    });
  }

  playSplash() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.24);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  playTakeoff() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.36);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  playTreasure() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [587.33, 880, 1174.66, 1567.98].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.045);
      gain.gain.setValueAtTime(0.11, now + i * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.045);
      osc.stop(now + i * 0.045 + 0.24);
    });
  }

  playThunder() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(92, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.52);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.56);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.58);
  }

  playAlert() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [784, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(0.09, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.18);
    });
  }

  playTrainHorn() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [293.66, 369.99, 440.0];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(f * 0.98, now);
      osc.frequency.exponentialRampToValueAtTime(f, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(f * 0.96, now + 0.52);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.54);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.56);
    });
  }

  playTrainChug() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(74, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.11);

    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  playHeliRotor() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const t = now + i * 0.085;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(92, t);
      osc.frequency.exponentialRampToValueAtTime(46, t + 0.065);

      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.075);
    }
  }

  playCameraShutter() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(740, now);
    osc.frequency.exponentialRampToValueAtTime(1120, now + 0.07);

    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playCitizenGreet() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.055);
      gain.gain.setValueAtTime(0.065, now + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.16);
    });
  }

  playCritChop() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Crisp woody impact + golden harmonic ping
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(240, now);
    osc1.frequency.exponentialRampToValueAtTime(64, now + 0.12);
    g1.gain.setValueAtTime(0.28, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc1.connect(g1);
    g1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    [987.77, 1318.5].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.035);
      g.gain.setValueAtTime(0.09, now + idx * 0.035);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.16);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + idx * 0.035);
      osc.stop(now + idx * 0.035 + 0.18);
    });
  }

  playWaterStep() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const buf = this._getNoiseBuffer(ctx);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950 + Math.random() * 450, now);
    filter.Q.value = 1.6;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.085, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now, Math.random() * 0.8, 0.15);
  }

  playMerchantBell() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [659.25, 880, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.11);
      gain.gain.setValueAtTime(0.11, now + i * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.11 + 0.42);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.11);
      osc.stop(now + i * 0.11 + 0.44);
    });
  }

  playRaftLaunch() {
    this.playSplash();
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(196, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(293.66, now + 0.24);
    gain.gain.setValueAtTime(0.11, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + 0.06);
    osc.stop(now + 0.3);
  }

  playSaplingPlant() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [392, 523.25].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.06);
      g.gain.setValueAtTime(0.09, now + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.14);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.16);
    });
  }

  playExcavatorGrade() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Low hydraulic diesel rumble + earth-scraping filtered noise burst
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(64, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.16);
    g.gain.setValueAtTime(0.075, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);

    const buf = this._getNoiseBuffer(ctx);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const flt = ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.setValueAtTime(340 + Math.random() * 160, now);
    flt.Q.value = 1.1;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.07, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    src.connect(flt);
    flt.connect(ng);
    ng.connect(ctx.destination);
    src.start(now, Math.random() * 0.8, 0.17);
  }

  playInfraComplete() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.065);
      gain.gain.setValueAtTime(0.13, now + i * 0.065);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.065 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.065);
      osc.stop(now + i * 0.065 + 0.30);
    });
  }

  _getNoiseBuffer(ctx) {
    if (this._noiseBuf && this._noiseBuf.sampleRate === ctx.sampleRate) {
      return this._noiseBuf;
    }
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.08 * white) / 1.08;
      data[i] = last * 2.4;
    }
    this._noiseBuf = buf;
    return buf;
  }

  _ensureAmbientBus() {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return null;
    if (this._ambBus) return this._ambBus;
    const ctx = this.ctx;
    const buf = this._getNoiseBuffer(ctx);

    const makeChannel = (filterType, freq, q) => {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const flt = ctx.createBiquadFilter();
      flt.type = filterType;
      flt.frequency.value = freq;
      flt.Q.value = q;
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      src.connect(flt);
      flt.connect(gain);
      gain.connect(ctx.destination);
      src.start();
      return { src, flt, gain };
    };

    this._ambBus = {
      river: makeChannel('bandpass', 540, 0.7),
      fire: makeChannel('bandpass', 1800, 1.4),
      rain: makeChannel('lowpass', 1350, 0.5),
      crackleTimer: 0
    };
    return this._ambBus;
  }

  /**
   * 3D Spatial Wilderness Ambience (river babble, campfire crackle, rain & sawmill distance attenuation)
   */
  updateSpatialAmbience(dt, { riverDist = 99, campfireDist = 99, isRain = false } = {}) {
    if (this.muted) {
      if (this._ambBus && this.ctx) {
        const t = this.ctx.currentTime;
        this._ambBus.river.gain.gain.setTargetAtTime(0.0001, t, 0.15);
        this._ambBus.fire.gain.gain.setTargetAtTime(0.0001, t, 0.15);
        this._ambBus.rain.gain.gain.setTargetAtTime(0.0001, t, 0.15);
      }
      return;
    }
    const bus = this._ensureAmbientBus();
    if (!bus || !this.ctx) return;

    const now = this.ctx.currentTime;
    const riverVol = Math.max(0, 1 - riverDist / 28) * (isRain ? 0.075 : 0.055);
    const fireVol = Math.max(0, 1 - campfireDist / 16) * 0.042;
    const rainVol = isRain ? 0.048 : 0.0;

    bus.river.gain.gain.setTargetAtTime(Math.max(0.0001, riverVol), now, 0.2);
    bus.fire.gain.gain.setTargetAtTime(Math.max(0.0001, fireVol), now, 0.2);
    bus.rain.gain.gain.setTargetAtTime(Math.max(0.0001, rainVol), now, 0.25);

    // Subtle organic wood-crackle pops when standing close to built campfire
    if (fireVol > 0.012) {
      bus.crackleTimer -= dt;
      if (bus.crackleTimer <= 0) {
        bus.crackleTimer = 0.35 + Math.random() * 0.9;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1600 + Math.random() * 1400, now);
        g.gain.setValueAtTime(fireVol * 0.42, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.02);
      }
    }
  }

  /**
   * Procedural surface-aware footstep SFX synced to gait heel-strike events
   * surface: 'grass' | 'earth' | 'wood' | 'water'
   */
  playFootstep(surface = 'grass', intensity = 0.6) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (this._lastStepAudioAt && now - this._lastStepAudioAt < 0.12) return;
    this._lastStepAudioAt = now;

    if (!this._stepNoiseBuf) {
      const len = Math.floor(ctx.sampleRate * 0.18);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.32));
      }
      this._stepNoiseBuf = buf;
    }

    const level = Math.max(0.2, Math.min(1.2, intensity));
    const jitter = 0.92 + Math.random() * 0.16;

    if (surface === 'wood') {
      // Hollow wooden bridge plank tap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(145 * jitter, now);
      osc.frequency.exponentialRampToValueAtTime(62 * jitter, now + 0.065);
      gain.gain.setValueAtTime(0.085 * level, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.075);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
      return;
    }

    const src = ctx.createBufferSource();
    src.buffer = this._stepNoiseBuf;
    const flt = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    if (surface === 'water') {
      flt.type = 'bandpass';
      flt.frequency.setValueAtTime(980 * jitter, now);
      flt.frequency.exponentialRampToValueAtTime(420 * jitter, now + 0.14);
      flt.Q.value = 1.1;
      gain.gain.setValueAtTime(0.09 * level, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.15);
    } else if (surface === 'earth') {
      flt.type = 'bandpass';
      flt.frequency.setValueAtTime(1250 * jitter, now);
      flt.Q.value = 0.95;
      gain.gain.setValueAtTime(0.065 * level, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.085);
    } else {
      // Soft meadow grass & forest floor rustle
      flt.type = 'lowpass';
      flt.frequency.setValueAtTime(640 * jitter, now);
      flt.Q.value = 0.7;
      gain.gain.setValueAtTime(0.048 * level, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.09);
    }

    src.connect(flt);
    flt.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + 0.16);
  }
}

export const sound = new SoundEngine();



