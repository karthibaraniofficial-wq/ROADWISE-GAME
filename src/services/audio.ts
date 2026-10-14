// ROADWISE — Procedural Web Audio Engine
// Provides high-fidelity synthesized audio with zero external audio assets

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Engine synth nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning: boolean = false;

  // Siren synth nodes
  private sirenOsc: OscillatorNode | null = null;
  private sirenLfo: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private isSirenPlaying: boolean = false;

  // Rain ambience
  private rainNode: AudioNode | null = null;
  private rainGain: GainNode | null = null;
  private isRainPlaying: boolean = false;

  constructor() {
    // Will be initialized upon first user interaction
  }

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported on this device:', e);
    }
  }

  public resumeContext(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  public setMasterVolume(vol: number): void {
    if (this.masterGain && this.ctx && !this.isMuted) {
      const clamped = Math.max(0, Math.min(1, vol));
      this.masterGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // --- ENGINE SYNTHESIS ---
  public startEngine(): void {
    if (!this.ctx || this.isEngineRunning) return;
    this.resumeContext();

    try {
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineFilter = this.ctx.createBiquadFilter();

      this.engineOsc1.type = 'sawtooth';
      this.engineOsc2.type = 'triangle';

      this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime);
      this.engineOsc2.frequency.setValueAtTime(90, this.ctx.currentTime);

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(280, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      if (this.masterGain) {
        this.engineGain.connect(this.masterGain);
      }

      this.engineOsc1.start();
      this.engineOsc2.start();
      this.isEngineRunning = true;
    } catch {
      // Audio autoplay policy catch
    }
  }

  public updateEngine(speedKmh: number, maxSpeedKmh: number, isAccelerating: boolean): void {
    if (!this.ctx || !this.isEngineRunning || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter || !this.engineGain) return;

    const norm = Math.min(1.0, Math.max(0.0, speedKmh / maxSpeedKmh));
    const throttleBoost = isAccelerating ? 15 : 0;
    const baseFreq = 40 + norm * 85 + throttleBoost;

    const t = this.ctx.currentTime + 0.05;
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, t, 0.08);
    this.engineFilter.frequency.setTargetAtTime(260 + norm * 450 + (isAccelerating ? 200 : 0), t, 0.1);

    const gainTarget = 0.10 + norm * 0.12 + (isAccelerating ? 0.05 : 0);
    this.engineGain.gain.setTargetAtTime(gainTarget, t, 0.1);
  }

  public stopEngine(): void {
    if (!this.isEngineRunning) return;
    try {
      this.engineOsc1?.stop();
      this.engineOsc2?.stop();
      this.engineOsc1?.disconnect();
      this.engineOsc2?.disconnect();
    } catch {}
    this.isEngineRunning = false;
  }

  // --- BRAKE SQUEAL ---
  public playBrakeSqueal(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2800 + Math.random() * 400, this.ctx.currentTime);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2900, this.ctx.currentTime);
    filter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  // --- HORN SOUND (Classic Scooter Dual-Tone) ---
  public playHorn(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(440, t); // A4
    osc2.frequency.setValueAtTime(523.25, t); // C5

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc1.connect(gain);
    osc2.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.28);
    osc2.stop(t + 0.28);
  }

  // --- EMERGENCY AMBULANCE SIREN ---
  public startSiren(): void {
    if (!this.ctx || this.isSirenPlaying) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    this.sirenOsc = this.ctx.createOscillator();
    this.sirenLfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    this.sirenGain = this.ctx.createGain();

    this.sirenOsc.type = 'sawtooth';
    this.sirenOsc.frequency.setValueAtTime(750, t);

    // LFO sweeps between 650Hz and 950Hz
    this.sirenLfo.frequency.setValueAtTime(0.6, t); // modulation speed
    lfoGain.gain.setValueAtTime(200, t); // sweep range

    this.sirenLfo.connect(lfoGain);
    lfoGain.connect(this.sirenOsc.frequency);

    this.sirenGain.gain.setValueAtTime(0.15, t);

    this.sirenOsc.connect(this.sirenGain);
    if (this.masterGain) this.sirenGain.connect(this.masterGain);

    this.sirenLfo.start(t);
    this.sirenOsc.start(t);
    this.isSirenPlaying = true;
  }

  public stopSiren(): void {
    if (!this.isSirenPlaying) return;
    try {
      this.sirenOsc?.stop();
      this.sirenLfo?.stop();
      this.sirenOsc?.disconnect();
      this.sirenLfo?.disconnect();
    } catch {}
    this.isSirenPlaying = false;
  }

  // --- VIOLATION BUZZ (Traffic Rule Infraction) ---
  public playViolationBuzz(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.setValueAtTime(95, t + 0.12);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  // --- SUCCESS CHIME (Pickup / Drop-off Complete) ---
  public playSuccessChime(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeContext();

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startT = this.ctx!.currentTime + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startT);

      gain.gain.setValueAtTime(0.15, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.4);

      osc.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);

      osc.start(startT);
      osc.stop(startT + 0.4);
    });
  }

  // --- COLLISION THUD ---
  public playCollisionThud(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.25);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.28);
  }

  // --- UI BUTTON CLICK ---
  public playClick(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  // --- RAIN NOISE GENERATOR ---
  public setRain(active: boolean): void {
    if (!this.ctx) return;
    if (active && !this.isRainPlaying) {
      this.resumeContext();
      // Generate 2 seconds of pink/white noise buffer and loop it
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.08;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(this.rainGain);
      if (this.masterGain) this.rainGain.connect(this.masterGain);

      noiseSource.start();
      this.rainNode = noiseSource;
      this.isRainPlaying = true;
    } else if (!active && this.isRainPlaying) {
      try {
        (this.rainNode as AudioScheduledSourceNode)?.stop();
        this.rainNode?.disconnect();
      } catch {}
      this.isRainPlaying = false;
    }
  }

  public destroy(): void {
    this.stopEngine();
    this.stopSiren();
    this.setRain(false);
    this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}

export const soundEngine = new SoundEngine();
