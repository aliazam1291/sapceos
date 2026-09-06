"use client";

class SpaceSoundController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private idleOsc1: OscillatorNode | null = null;
  private idleOsc2: OscillatorNode | null = null;
  private idleFilter: BiquadFilterNode | null = null;
  private scanOsc: OscillatorNode | null = null;
  private scanGain: GainNode | null = null;
  
  private isMuted: boolean = true;
  private thrusterInterval: any = null;
  private currentEngineFreq: number = 55;
  private currentFilterCutoff: number = 110;

  constructor() {
    // Client-side initialization only
  }

  private init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();
      
      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.15, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.startEngineHum();
    } catch (e) {
      console.warn("Web Audio API not supported:", e);
    }
  }

  public toggleMute(muted: boolean) {
    this.isMuted = muted;
    this.init();

    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const targetGain = this.isMuted ? 0 : 0.15;
    this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
  }

  public getMutedState(): boolean {
    return this.isMuted;
  }

  private startEngineHum() {
    if (!this.ctx || !this.masterGain) return;

    // Sub-bass rumble osc
    this.idleOsc1 = this.ctx.createOscillator();
    this.idleOsc1.type = "sawtooth";
    this.idleOsc1.frequency.setValueAtTime(this.currentEngineFreq, this.ctx.currentTime);

    // Detuned sub-bass
    this.idleOsc2 = this.ctx.createOscillator();
    this.idleOsc2.type = "triangle";
    this.idleOsc2.frequency.setValueAtTime(this.currentEngineFreq * 1.5 + 0.5, this.ctx.currentTime);

    // Low pass filter
    this.idleFilter = this.ctx.createBiquadFilter();
    this.idleFilter.type = "lowpass";
    this.idleFilter.frequency.setValueAtTime(this.currentFilterCutoff, this.ctx.currentTime);
    this.idleFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    // Connect
    this.idleOsc1.connect(this.idleFilter);
    this.idleOsc2.connect(this.idleFilter);
    this.idleFilter.connect(this.masterGain);

    this.idleOsc1.start();
    this.idleOsc2.start();
  }

  public playPing() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    if (this.ctx.state === "suspended") this.ctx.resume();

    const now = this.ctx.currentTime;
    
    // A complex sci-fi chime made of detuned square waves and a delay echo
    const playTone = (timeOffset: number, baseFreq: number, volume: number) => {
      if (!this.ctx || !this.masterGain) return;
      const t = now + timeOffset;

      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = "square";
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, t + 0.12);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(baseFreq * 1.5, t);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(baseFreq * 1.5, t);
      filter.frequency.exponentialRampToValueAtTime(baseFreq * 3, t + 0.15);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc2.start(t);
      
      osc.stop(t + 0.4);
      osc2.stop(t + 0.4);
    };

    // Primary pulse + Echoes
    playTone(0, 520, 0.4);
    playTone(0.07, 784, 0.25);
    playTone(0.18, 1046, 0.15); // Delayed high echo
  }

  public playClick() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public setThrusterActive(active: boolean) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (this.thrusterInterval) {
      clearInterval(this.thrusterInterval);
      this.thrusterInterval = null;
    }

    const targetFreq = active ? 85 : 55;
    const targetCutoff = active ? 220 : 110;

    // Smoothly interpolate the engine hum parameters to simulate acceleration
    const duration = active ? 1000 : 1800; // ms
    const steps = 30;
    const intervalTime = duration / steps;
    let step = 0;

    const startFreq = this.currentEngineFreq;
    const startCutoff = this.currentFilterCutoff;

    this.thrusterInterval = setInterval(() => {
      step++;
      const ratio = step / steps;
      
      // Sine easing for throttle
      const ease = active 
        ? Math.sin((ratio * Math.PI) / 2) 
        : 1 - Math.sin((ratio * Math.PI) / 2);
        
      this.currentEngineFreq = startFreq + (targetFreq - startFreq) * (active ? ease : ratio);
      this.currentFilterCutoff = startCutoff + (targetCutoff - startCutoff) * (active ? ease : ratio);

      if (this.idleOsc1 && this.idleOsc2 && this.idleFilter) {
        const t = this.ctx!.currentTime;
        this.idleOsc1.frequency.setValueAtTime(this.currentEngineFreq, t);
        this.idleOsc2.frequency.setValueAtTime(this.currentEngineFreq * 1.5 + 0.5, t);
        this.idleFilter.frequency.setValueAtTime(this.currentFilterCutoff, t);
      }

      if (step >= steps) {
        clearInterval(this.thrusterInterval);
        this.thrusterInterval = null;
      }
    }, intervalTime);
  }

  public startScanning() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    if (this.scanOsc) return; // Already scanning

    const now = this.ctx.currentTime;
    
    // Sci-fi scan sweeper oscillator (modulated triangle/sine)
    this.scanOsc = this.ctx.createOscillator();
    this.scanOsc.type = "sine";
    this.scanOsc.frequency.setValueAtTime(180, now);

    this.scanGain = this.ctx.createGain();
    this.scanGain.gain.setValueAtTime(0, now);
    this.scanGain.gain.linearRampToValueAtTime(0.04, now + 0.2); // Low volume ambient sweep

    // Modulator for filter sweep (LFO)
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(1.8, now); // Sweep rate 1.8 Hz
    lfoGain.gain.setValueAtTime(80, now); // Sweep width in Hz

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(250, now);
    filter.Q.setValueAtTime(6.0, now);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency); // Modulate cutoff frequency
    this.scanOsc.connect(filter);
    filter.connect(this.scanGain);
    this.scanGain.connect(this.masterGain);

    lfo.start(now);
    this.scanOsc.start(now);

    // Keep references to clean up later
    (this.scanOsc as any).lfo = lfo;
    (this.scanOsc as any).lfoGain = lfoGain;
    (this.scanOsc as any).filter = filter;
  }

  public stopScanning() {
    if (!this.ctx || !this.scanOsc || !this.scanGain) return;

    const now = this.ctx.currentTime;
    const osc = this.scanOsc;
    const gain = this.scanGain;

    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    setTimeout(() => {
      try {
        osc.stop();
        if ((osc as any).lfo) (osc as any).lfo.stop();
        osc.disconnect();
        if ((osc as any).lfo) (osc as any).lfo.disconnect();
        if ((osc as any).lfoGain) (osc as any).lfoGain.disconnect();
        if ((osc as any).filter) (osc as any).filter.disconnect();
        gain.disconnect();
      } catch (e) {
        // Safe check
      }
    }, 200);

    this.scanOsc = null;
    this.scanGain = null;
  }
}

// Singleton export
export const spaceSound = new SpaceSoundController();
