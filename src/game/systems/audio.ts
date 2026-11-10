/**
 * Procedural audio engine (Web Audio API).
 * Every sound and the background music are synthesised at runtime, so the
 * game ships with no third-party audio files and no licensing concerns.
 */

export type SfxName =
  | 'click'
  | 'pop'
  | 'swish'
  | 'sparkle'
  | 'coin'
  | 'reward'
  | 'levelup'
  | 'error'
  | 'water'
  | 'ding'
  | 'chop'
  | 'perfect'
  | 'notify'
  | 'meow';

export type LoopName = 'washer' | 'vacuum' | 'sizzle' | 'scrub' | 'rain' | 'night';

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

interface LoopHandle {
  stop: () => void;
}

// 4 bars × 8 eighth-notes, C – Am – F – G, cozy pentatonic melody.
const CHORDS = [
  [48, 52, 55],
  [45, 48, 52],
  [41, 45, 48],
  [43, 47, 50],
];
const MELODY: (number | null)[] = [
  72, null, 76, null, 79, 76, null, 74,
  72, null, 69, null, 72, 74, null, null,
  77, null, 76, 74, 72, null, 69, null,
  71, null, 74, null, 79, null, 77, 74,
];
const BPM = 96;
const STEP = 60 / BPM / 2;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private loops = new Map<LoopName, LoopHandle>();
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime = 0;
  private step = 0;
  private wantMusic = false;
  private vol = { music: 0.55, sfx: 0.8, muted: false };

  get ready(): boolean {
    return !!this.ctx && this.ctx.state === 'running';
  }

  /** Must be called from a user gesture (browsers block autoplay). */
  unlock(): void {
    try {
      if (!this.ctx) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        this.musicGain = this.ctx.createGain();
        this.musicGain.connect(this.master);
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.connect(this.master);
        this.noise = this.makeNoise();
        this.applyVolumes();
        document.addEventListener('visibilitychange', () => {
          if (!this.ctx) return;
          if (document.visibilityState === 'hidden') void this.ctx.suspend();
          else void this.ctx.resume();
        });
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      if (this.wantMusic) this.startMusic();
    } catch (err) {
      console.warn('[audio] unavailable', err);
    }
  }

  setVolumes(music: number, sfx: number, muted: boolean): void {
    this.vol = { music, sfx, muted };
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.master || !this.musicGain || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.vol.muted ? 0 : 1, t, 0.05);
    this.musicGain.gain.setTargetAtTime(this.vol.music * 0.45, t, 0.05);
    this.sfxGain.gain.setTargetAtTime(this.vol.sfx * 0.9, t, 0.05);
  }

  private makeNoise(): AudioBuffer {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  private tone(
    freq: number,
    start: number,
    dur: number,
    type: OscillatorType = 'sine',
    gain = 0.2,
    dest: AudioNode | null = this.sfxGain,
    slideTo?: number,
    attack = 0.01,
  ): void {
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g).connect(dest);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  private noiseBurst(
    start: number,
    dur: number,
    filter: BiquadFilterType,
    freq: number,
    gain: number,
    q = 1,
    sweepTo?: number,
    dest: AudioNode | null = this.sfxGain,
  ): void {
    if (!this.ctx || !this.noise || !dest) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.setValueAtTime(freq, start);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, start + dur);
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(f).connect(g).connect(dest);
    src.start(start, Math.random());
    src.stop(start + dur + 0.05);
  }

  play(name: SfxName): void {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime + 0.005;
    switch (name) {
      case 'click':
        this.tone(880, t, 0.07, 'sine', 0.18);
        this.tone(1320, t + 0.02, 0.05, 'sine', 0.08);
        break;
      case 'pop':
        this.tone(420, t, 0.12, 'sine', 0.28, this.sfxGain, 980);
        break;
      case 'swish':
        this.noiseBurst(t, 0.28, 'bandpass', 900, 0.35, 1.2, 3500);
        break;
      case 'sparkle':
        [1568, 2093, 2637, 3136].forEach((f, i) => this.tone(f, t + i * 0.05, 0.25, 'sine', 0.09));
        break;
      case 'coin':
        this.tone(988, t, 0.08, 'triangle', 0.2);
        this.tone(1319, t + 0.07, 0.22, 'triangle', 0.2);
        break;
      case 'reward':
        [72, 76, 79, 84].forEach((m, i) => this.tone(midi(m), t + i * 0.075, 0.28, 'triangle', 0.18));
        this.tone(midi(88), t + 0.32, 0.4, 'sine', 0.08);
        break;
      case 'perfect':
        [79, 84, 88, 91].forEach((m, i) => this.tone(midi(m), t + i * 0.05, 0.3, 'sine', 0.13));
        break;
      case 'levelup':
        [67, 72, 76, 79].forEach((m, i) => this.tone(midi(m), t + i * 0.12, 0.2, 'square', 0.07));
        [72, 76, 79, 84].forEach((m) => this.tone(midi(m), t + 0.5, 0.9, 'triangle', 0.12, this.sfxGain, undefined, 0.03));
        [1568, 2093, 2637].forEach((f, i) => this.tone(f, t + 0.6 + i * 0.08, 0.4, 'sine', 0.05));
        break;
      case 'error':
        this.tone(220, t, 0.12, 'square', 0.08);
        this.tone(165, t + 0.11, 0.18, 'square', 0.08);
        break;
      case 'water':
        for (let i = 0; i < 6; i++) {
          const f = 500 + Math.random() * 700;
          this.tone(f, t + i * 0.055, 0.07, 'sine', 0.12, this.sfxGain, f * 1.8);
        }
        break;
      case 'ding':
        this.tone(1760, t, 0.9, 'sine', 0.16);
        this.tone(2637, t, 0.6, 'sine', 0.06);
        break;
      case 'notify':
        // two soft "ting-ting" chimes, like a chat notification
        this.tone(1318, t, 0.12, 'sine', 0.16);
        this.tone(1760, t + 0.11, 0.22, 'sine', 0.16);
        break;
      case 'meow':
        this.tone(620, t, 0.45, 'sawtooth', 0.05, this.sfxGain, 900, 0.05);
        this.tone(900, t + 0.18, 0.3, 'triangle', 0.08, this.sfxGain, 520, 0.04);
        break;
      case 'chop':
        this.noiseBurst(t, 0.06, 'highpass', 2200, 0.3, 0.8);
        this.tone(180, t, 0.06, 'sine', 0.15);
        break;
    }
  }

  startLoop(name: LoopName): void {
    if (!this.ctx || !this.noise || !this.sfxGain || this.loops.has(name)) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.connect(this.sfxGain);
    const nodes: AudioScheduledSourceNode[] = [];

    const noiseSrc = (filter: BiquadFilterType, freq: number, q: number, gain: number) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = filter;
      f.frequency.value = freq;
      f.Q.value = q;
      const g = ctx.createGain();
      g.gain.value = gain;
      src.connect(f).connect(g).connect(out);
      src.start(t, Math.random());
      nodes.push(src);
      return g;
    };
    const lfo = (target: AudioParam, rate: number, depth: number) => {
      const o = ctx.createOscillator();
      o.frequency.value = rate;
      const d = ctx.createGain();
      d.gain.value = depth;
      o.connect(d).connect(target);
      o.start(t);
      nodes.push(o);
    };

    let level = 0.3;
    if (name === 'washer') {
      const g = noiseSrc('lowpass', 280, 0.8, 0.9);
      lfo(g.gain, 1.6, 0.45);
      const hum = ctx.createOscillator();
      hum.frequency.value = 58;
      const hg = ctx.createGain();
      hg.gain.value = 0.15;
      hum.connect(hg).connect(out);
      hum.start(t);
      nodes.push(hum);
      level = 0.22;
    } else if (name === 'vacuum') {
      noiseSrc('bandpass', 950, 0.9, 0.9);
      const motor = ctx.createOscillator();
      motor.type = 'sawtooth';
      motor.frequency.value = 118;
      const mg = ctx.createGain();
      mg.gain.value = 0.04;
      motor.connect(mg).connect(out);
      motor.start(t);
      nodes.push(motor);
      level = 0.16;
    } else if (name === 'sizzle') {
      const g = noiseSrc('highpass', 3200, 0.7, 0.8);
      lfo(g.gain, 9, 0.5);
      level = 0.14;
    } else if (name === 'night') {
      // crickets: a narrow high band, trilling fast and pulsing slowly
      const g = noiseSrc('bandpass', 4600, 9, 1.4);
      lfo(g.gain, 15, 1.2);
      const pulse = ctx.createOscillator();
      pulse.frequency.value = 0.45;
      const pg = ctx.createGain();
      pg.gain.value = 0.6;
      pulse.connect(pg).connect(g.gain);
      pulse.start(t);
      nodes.push(pulse);
      level = 0.09;
    } else if (name === 'rain') {
      noiseSrc('lowpass', 1800, 0.5, 0.8);
      const g = noiseSrc('highpass', 5200, 0.6, 0.5);
      lfo(g.gain, 0.3, 0.2);
      level = 0.22;
    } else {
      const g = noiseSrc('bandpass', 1500, 1.4, 0.8);
      lfo(g.gain, 5.5, 0.7);
      level = 0.2;
    }
    out.gain.exponentialRampToValueAtTime(level, t + 0.25);

    this.loops.set(name, {
      stop: () => {
        const now = ctx.currentTime;
        out.gain.cancelScheduledValues(now);
        out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), now);
        out.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        nodes.forEach((n) => n.stop(now + 0.3));
        setTimeout(() => out.disconnect(), 400);
      },
    });
  }

  stopLoop(name: LoopName): void {
    const h = this.loops.get(name);
    if (h) {
      h.stop();
      this.loops.delete(name);
    }
  }

  stopAllLoops(): void {
    for (const name of Array.from(this.loops.keys())) this.stopLoop(name);
  }

  setLoop(name: LoopName, on: boolean): void {
    if (on) this.startLoop(name);
    else this.stopLoop(name);
  }

  startMusic(): void {
    this.wantMusic = true;
    if (!this.ctx || this.musicTimer) return;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.step = 0;
    this.musicTimer = setInterval(() => this.schedule(), 30);
  }

  stopMusic(): void {
    this.wantMusic = false;
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  private schedule(): void {
    if (!this.ctx || this.ctx.state !== 'running') return;
    while (this.nextNoteTime < this.ctx.currentTime + 0.15) {
      this.playStep(this.step, this.nextNoteTime);
      this.nextNoteTime += STEP;
      this.step = (this.step + 1) % 32;
    }
  }

  private playStep(step: number, t: number): void {
    const bar = Math.floor(step / 8);
    const beat = step % 8;
    const chord = CHORDS[bar];
    const dest = this.musicGain;
    if (beat === 0) {
      chord.forEach((m) => this.tone(midi(m + 12), t, STEP * 7.5, 'triangle', 0.045, dest, undefined, 0.15));
      this.tone(midi(chord[0] - 12), t, STEP * 3.5, 'sine', 0.16, dest, undefined, 0.02);
    }
    if (beat === 4) this.tone(midi(chord[0] - 12 + 7), t, STEP * 3.5, 'sine', 0.12, dest, undefined, 0.02);
    const note = MELODY[step];
    if (note) {
      this.tone(midi(note), t, STEP * 1.6, 'sine', 0.085, dest, undefined, 0.01);
      this.tone(midi(note + 12), t, STEP * 0.8, 'triangle', 0.015, dest);
    }
    if (beat % 2 === 1) this.noiseBurst(t, 0.05, 'highpass', 7000, 0.025, 0.7, undefined, dest);
  }
}

export const audio = new AudioEngine();
