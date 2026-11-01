import * as THREE from 'three';

export type MusicStation = 'synthwave' | 'lofi' | 'ambient' | 'off';

export interface AudioSnapshot {
  unlocked: boolean;
  muted: boolean;
  station: MusicStation;
  bgmVolume: number;
  sfxVolume: number;
}

type Listener = (snap: AudioSnapshot) => void;

const STORAGE_KEY = 'ghostlab.audio.v1';

interface MachineRig {
  panner: PannerNode;
  gain: GainNode;
  update?: (t: number, dt: number) => void;
}

/** Chuyển nốt MIDI sang tần số Hz */
const mtof = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

class LabAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private panicGain: GainNode | null = null;
  private bgmBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private reverbSend: GainNode | null = null;
  private delaySend: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;

  private machines = new Map<string, MachineRig>();
  private reactorOsc1: OscillatorNode | null = null;
  private reactorOsc2: OscillatorNode | null = null;
  private reactorGain: GainNode | null = null;

  private schedulerTimer: number | null = null;
  private nextStepTime = 0;
  private stepIndex = 0;

  private unlocked = false;
  private muted = false;
  private panicMuted = false;
  private station: MusicStation = 'synthwave';
  private bgmVolume = 0.42;
  private sfxVolume = 0.68;

  private listeners = new Set<Listener>();
  private tmpForward = new THREE.Vector3();
  private tmpUp = new THREE.Vector3();
  private prevAmrPos = new THREE.Vector3();
  private amrSpeed = 0;

  constructor() {
    this.loadPrefs();
    if (typeof window !== 'undefined') {
      this.bindFirstGesture();
    }
  }

  private loadPrefs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as Partial<AudioSnapshot>;
      if (typeof p.muted === 'boolean') this.muted = p.muted;
      if (p.station && ['synthwave', 'lofi', 'ambient', 'off'].includes(p.station)) {
        this.station = p.station;
      }
      if (typeof p.bgmVolume === 'number') this.bgmVolume = Math.max(0, Math.min(1, p.bgmVolume));
      if (typeof p.sfxVolume === 'number') this.sfxVolume = Math.max(0, Math.min(1, p.sfxVolume));
    } catch {
      // ignore storage errors
    }
  }

  private savePrefs() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          muted: this.muted,
          station: this.station,
          bgmVolume: this.bgmVolume,
          sfxVolume: this.sfxVolume,
        })
      );
    } catch {
      // ignore
    }
  }

  private emit() {
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snap));
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  getSnapshot(): AudioSnapshot {
    return {
      unlocked: this.unlocked,
      muted: this.muted,
      station: this.station,
      bgmVolume: this.bgmVolume,
      sfxVolume: this.sfxVolume,
    };
  }

  private bindFirstGesture() {
    const unlock = () => {
      this.ensureStarted();
      if (this.ctx && this.ctx.state === 'running') {
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      }
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  ensureStarted() {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!this.ctx) {
      this.buildGraph(new AudioCtx());
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().then(() => {
        this.unlocked = true;
        this.syncVolumes();
        this.emit();
      });
    } else if (this.ctx && this.ctx.state === 'running' && !this.unlocked) {
      this.unlocked = true;
      this.syncVolumes();
      this.emit();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Public Controls                                                     */
  /* ------------------------------------------------------------------ */

  toggleMute() {
    this.ensureStarted();
    this.muted = !this.muted;
    this.savePrefs();
    this.syncVolumes();
    this.emit();
  }

  setMuted(muted: boolean) {
    this.ensureStarted();
    this.muted = muted;
    this.savePrefs();
    this.syncVolumes();
    this.emit();
  }

  setPanicMute(panic: boolean) {
    this.panicMuted = panic;
    this.syncVolumes();
  }

  setStation(station: MusicStation) {
    this.ensureStarted();
    this.station = station;
    this.stepIndex = 0;
    if (this.ctx) this.nextStepTime = this.ctx.currentTime + 0.05;
    this.savePrefs();
    this.syncVolumes();
    this.playHudClick(station === 'off' ? 320 : 660);
    this.emit();
  }

  setBgmVolume(v: number) {
    this.ensureStarted();
    this.bgmVolume = Math.max(0, Math.min(1, v));
    if (this.muted && this.bgmVolume > 0.02) this.muted = false;
    this.savePrefs();
    this.syncVolumes();
    this.emit();
  }

  setSfxVolume(v: number) {
    this.ensureStarted();
    this.sfxVolume = Math.max(0, Math.min(1, v));
    if (this.muted && this.sfxVolume > 0.02) this.muted = false;
    this.savePrefs();
    this.syncVolumes();
    this.emit();
  }

  private syncVolumes() {
    if (!this.ctx || !this.masterGain || !this.panicGain || !this.bgmBus || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.92, now, 0.06);
    this.panicGain.gain.setTargetAtTime(this.panicMuted ? 0 : 1, now, 0.03);
    this.bgmBus.gain.setTargetAtTime(this.station === 'off' ? 0 : this.bgmVolume, now, 0.12);
    this.sfxBus.gain.setTargetAtTime(this.sfxVolume, now, 0.08);
  }

  /* ------------------------------------------------------------------ */
  /* Audio Graph Construction                                            */
  /* ------------------------------------------------------------------ */

  private buildGraph(ctx: AudioContext) {
    this.ctx = ctx;

    // Master limiter / compressor để âm thanh êm, không bao giờ vỡ tiếng
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 18;
    comp.ratio.value = 4;
    comp.attack.value = 0.008;
    comp.release.value = 0.18;
    comp.connect(ctx.destination);

    this.panicGain = ctx.createGain();
    this.panicGain.gain.value = this.panicMuted ? 0 : 1;
    this.panicGain.connect(comp);

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.0001; // fade-in mượt khi unlock
    this.masterGain.connect(this.panicGain);

    this.bgmBus = ctx.createGain();
    this.bgmBus.gain.value = this.station === 'off' ? 0 : this.bgmVolume;
    this.bgmBus.connect(this.masterGain);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = this.sfxVolume;
    this.sfxBus.connect(this.masterGain);

    // Tạo buffer nhiễu hồng/trắng 3 giây dùng chung cho quạt hút, gió cánh drone, xịt bụi, hi-hat
    this.noiseBuf = this.createPinkishNoiseBuffer(ctx, 3.0);

    // Algorithmic Stereo Bunker Reverb cho nhạc nền & hiệu ứng
    const convolver = ctx.createConvolver();
    convolver.buffer = this.createImpulseResponse(ctx, 2.6, 2.4);
    const revOut = ctx.createGain();
    revOut.gain.value = 0.42;
    convolver.connect(revOut);
    revOut.connect(this.bgmBus);

    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 1.0;
    this.reverbSend.connect(convolver);

    // Stereo Ping-Pong Delay cho tiếng arp synthwave
    const dL = ctx.createDelay(1.0);
    const dR = ctx.createDelay(1.0);
    dL.delayTime.value = 0.24;
    dR.delayTime.value = 0.36;
    const fb = ctx.createGain();
    fb.gain.value = 0.34;
    const dFilter = ctx.createBiquadFilter();
    dFilter.type = 'lowpass';
    dFilter.frequency.value = 2600;
    const merger = ctx.createChannelMerger(2);

    this.delaySend = ctx.createGain();
    this.delaySend.gain.value = 0.36;
    this.delaySend.connect(dFilter);
    dFilter.connect(dL);
    dL.connect(dR);
    dR.connect(fb);
    fb.connect(dFilter);
    dL.connect(merger, 0, 0);
    dR.connect(merger, 0, 1);
    merger.connect(this.bgmBus);
    merger.connect(this.reverbSend);

    // Khởi tạo toàn bộ nguồn âm thanh không gian 3D cho các máy trong phòng lab
    this.buildSpatialMachines(ctx);

    // Khởi chạy bộ lập lịch nhạc nền chính xác theo đồng hồ phần cứng WebAudio
    this.nextStepTime = ctx.currentTime + 0.08;
    this.schedulerTimer = window.setInterval(() => this.scheduleMusic(), 25);

    if (ctx.state === 'running') {
      this.unlocked = true;
      this.syncVolumes();
      this.emit();
    }
  }

  private createPinkishNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const out = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.09;
      b6 = w * 0.115926;
    }
    return buf;
  }

  private createImpulseResponse(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * duration);
    const impulse = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
      }
    }
    return impulse;
  }

  private makePanner(ctx: AudioContext, x: number, y: number, z: number, refDist = 2.6): PannerNode {
    const p = ctx.createPanner();
    p.panningModel = 'HRTF';
    p.distanceModel = 'inverse';
    p.refDistance = refDist;
    p.maxDistance = 26;
    p.rolloffFactor = 1.75;
    p.positionX.value = x;
    p.positionY.value = y;
    p.positionZ.value = z;
    return p;
  }

  private makeLoopingNoise(ctx: AudioContext): AudioBufferSourceNode {
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    src.loopStart = Math.random() * 0.4;
    src.loopEnd = 2.8;
    src.start();
    return src;
  }

  /* ------------------------------------------------------------------ */
  /* 3D Spatial Machine Rigs (Drone, AMR, Blower, AGV, Forklift, Biped)  */
  /* ------------------------------------------------------------------ */

  private buildSpatialMachines(ctx: AudioContext) {
    if (!this.sfxBus) return;

    // 0. Central Arc Reactor ([0, 0.2, -1.0]) — tiếng từ trường trầm ấm ở giữa phòng
    const rPan = this.makePanner(ctx, 0, 0.2, -1.0, 3.0);
    const rGain = ctx.createGain();
    rGain.gain.value = 0.085;
    const rFilter = ctx.createBiquadFilter();
    rFilter.type = 'lowpass';
    rFilter.frequency.value = 180;
    const ro1 = ctx.createOscillator();
    const ro2 = ctx.createOscillator();
    ro1.type = 'sine';
    ro2.type = 'triangle';
    ro1.frequency.value = 55;
    ro2.frequency.value = 110.3;
    ro1.connect(rFilter);
    ro2.connect(rFilter);
    rFilter.connect(rGain);
    rGain.connect(rPan);
    rPan.connect(this.sfxBus);
    ro1.start();
    ro2.start();
    this.reactorOsc1 = ro1;
    this.reactorOsc2 = ro2;
    this.reactorGain = rGain;

    // 1. PRJ-SKY-GHOST (Drone Quadcopter — 3 cánh BLDC quay tít + luồng gió đập cánh lệch pha)
    {
      const panner = this.makePanner(ctx, 0, 1.5, -6.2, 2.8);
      const gain = ctx.createGain();
      gain.gain.value = 0.22;

      // 3 motor không chổi than hơi lệch RPM nhau tạo hiệu ứng phách đặc trưng của drone thật
      const freqs = [178, 186, 368];
      const oscs: OscillatorNode[] = [];
      const motorLp = ctx.createBiquadFilter();
      motorLp.type = 'bandpass';
      motorLp.frequency.value = 420;
      motorLp.Q.value = 1.4;

      freqs.forEach((f, idx) => {
        const o = ctx.createOscillator();
        o.type = idx === 2 ? 'triangle' : 'sawtooth';
        o.frequency.value = f;
        const og = ctx.createGain();
        og.gain.value = idx === 2 ? 0.09 : 0.14;
        o.connect(og);
        og.connect(motorLp);
        o.start();
        oscs.push(o);
      });

      // Tiếng gió chém cánh quạt (blade-pass modulation ~24Hz trên dải noise)
      const wind = this.makeLoopingNoise(ctx);
      const windBp = ctx.createBiquadFilter();
      windBp.type = 'bandpass';
      windBp.frequency.value = 340;
      windBp.Q.value = 0.9;
      const windGain = ctx.createGain();
      windGain.gain.value = 0.26;
      const chopLfo = ctx.createOscillator();
      chopLfo.frequency.value = 23.5;
      const chopDepth = ctx.createGain();
      chopDepth.gain.value = 0.10;
      chopLfo.connect(chopDepth);
      chopDepth.connect(windGain.gain);
      chopLfo.start();

      wind.connect(windBp);
      windBp.connect(windGain);
      motorLp.connect(gain);
      windGain.connect(gain);
      gain.connect(panner);
      panner.connect(this.sfxBus);

      this.machines.set('sky-ghost', {
        panner,
        gain,
        update: (t) => {
          // Drone đung đưa nhẹ làm RPM bù PID nhấp nhô tự nhiên
          const sway = Math.sin(t * 1.45) * 4.5 + Math.sin(t * 5.1) * 1.5;
          oscs[0].frequency.value = 178 + sway;
          oscs[1].frequency.value = 185 - sway * 0.7;
          oscs[2].frequency.value = 368 + sway * 1.8;
        },
      });
    }

    // 2. PRJ-AMR-SLAM (Robot tự hành đa hướng 4 cụm Swerve chạy sống quanh phòng!)
    {
      const panner = this.makePanner(ctx, 0, 0.35, 2.4, 3.2);
      const gain = ctx.createGain();
      gain.gain.value = 0.26;

      // Tiếng servo truyền động bánh Swerve BLDC + hộp số hành tinh
      const servo1 = ctx.createOscillator();
      const servo2 = ctx.createOscillator();
      servo1.type = 'triangle';
      servo2.type = 'sine';
      servo1.frequency.value = 142;
      servo2.frequency.value = 286;

      const servoFilter = ctx.createBiquadFilter();
      servoFilter.type = 'bandpass';
      servoFilter.frequency.value = 380;
      servoFilter.Q.value = 2.2;

      const sg1 = ctx.createGain();
      const sg2 = ctx.createGain();
      sg1.gain.value = 0.22;
      sg2.gain.value = 0.12;
      servo1.connect(sg1);
      servo2.connect(sg2);
      sg1.connect(servoFilter);
      sg2.connect(servoFilter);

      // Tiếng bánh xe polyurethane lăn trên nền bê tông + motor LiDAR quay 10Hz
      const rollNoise = this.makeLoopingNoise(ctx);
      const rollLp = ctx.createBiquadFilter();
      rollLp.type = 'bandpass';
      rollLp.frequency.value = 165;
      rollLp.Q.value = 1.3;
      const rollGain = ctx.createGain();
      rollGain.gain.value = 0.28;

      const lidarOsc = ctx.createOscillator();
      lidarOsc.type = 'sine';
      lidarOsc.frequency.value = 620;
      const lidarGain = ctx.createGain();
      lidarGain.gain.value = 0.025;
      const lidarLfo = ctx.createOscillator();
      lidarLfo.frequency.value = 10.5;
      const lidarLfoDepth = ctx.createGain();
      lidarLfoDepth.gain.value = 0.018;
      lidarLfo.connect(lidarLfoDepth);
      lidarLfoDepth.connect(lidarGain.gain);
      lidarOsc.start();
      lidarLfo.start();

      rollNoise.connect(rollLp);
      rollLp.connect(rollGain);
      servoFilter.connect(gain);
      rollGain.connect(gain);
      lidarOsc.connect(lidarGain);
      lidarGain.connect(gain);
      gain.connect(panner);
      panner.connect(this.sfxBus);
      servo1.start();
      servo2.start();

      this.machines.set('amr-slam', {
        panner,
        gain,
        update: (t) => {
          // Cao độ servo thay đổi theo tốc độ thực của AMR trên sàn!
          const spd = Math.min(2.2, this.amrSpeed);
          const pitch = 128 + spd * 42 + Math.sin(t * 3.4) * 5;
          servo1.frequency.value = pitch;
          servo2.frequency.value = pitch * 2.02;
          servoFilter.frequency.value = 310 + spd * 140;
        },
      });
    }

    // 3. PRJ-SMOKE-TRAP (Quạt ly tâm hút khói + mũi mỏ hàn xèo nhựa thông)
    {
      const panner = this.makePanner(ctx, -3.4, 0.8, -5.2, 2.5);
      const gain = ctx.createGain();
      gain.gain.value = 0.20;

      const air = this.makeLoopingNoise(ctx);
      const airBp = ctx.createBiquadFilter();
      airBp.type = 'bandpass';
      airBp.frequency.value = 480;
      airBp.Q.value = 0.75;

      const turbine = ctx.createOscillator();
      turbine.type = 'sine';
      turbine.frequency.value = 116;
      const turbGain = ctx.createGain();
      turbGain.gain.value = 0.14;

      air.connect(airBp);
      airBp.connect(gain);
      turbine.connect(turbGain);
      turbGain.connect(gain);
      gain.connect(panner);
      panner.connect(this.sfxBus);
      turbine.start();

      this.machines.set('smoke-trap', {
        panner,
        gain,
        update: (t) => {
          turbine.frequency.value = 116 + Math.sin(t * 0.9) * 3.5;
        },
      });
    }

    // 4. PRJ-GHOST-AGV (Xe tự hành kho xưởng Neobotix + tiếng chuông cảnh báo AGV nhà máy)
    {
      const panner = this.makePanner(ctx, 3.4, 0.6, -5.2, 2.5);
      const gain = ctx.createGain();
      gain.gain.value = 0.16;

      const inv = ctx.createOscillator();
      inv.type = 'triangle';
      inv.frequency.value = 98;
      const invLp = ctx.createBiquadFilter();
      invLp.type = 'lowpass';
      invLp.frequency.value = 240;
      const invG = ctx.createGain();
      invG.gain.value = 0.12;
      inv.connect(invLp);
      invLp.connect(invG);
      invG.connect(gain);
      gain.connect(panner);
      panner.connect(this.sfxBus);
      inv.start();

      let nextBeep = 2.0;
      this.machines.set('ghost-agv', {
        panner,
        gain,
        update: (t) => {
          if (t > nextBeep && this.ctx && this.ctx.state === 'running' && !this.muted && !this.panicMuted) {
            nextBeep = t + 3.8 + Math.random() * 1.4;
            this.playSpatialTone(panner, 880, 0.11, 0.045, 'sine');
            setTimeout(() => {
              if (this.ctx && !this.muted && !this.panicMuted) {
                this.playSpatialTone(panner, 659.25, 0.14, 0.038, 'sine');
              }
            }, 140);
          }
        },
      });
    }

    // 5. PRJ-FORK-EYE (Bơm thủy lực chờ + quạt tản nhiệt OAK-1 W)
    {
      const panner = this.makePanner(ctx, -6.2, 1.0, -2.0, 2.5);
      const gain = ctx.createGain();
      gain.gain.value = 0.15;

      const hyd = ctx.createOscillator();
      hyd.type = 'sawtooth';
      hyd.frequency.value = 68;
      const hydLp = ctx.createBiquadFilter();
      hydLp.type = 'lowpass';
      hydLp.frequency.value = 155;
      hyd.connect(hydLp);
      hydLp.connect(gain);
      gain.connect(panner);
      panner.connect(this.sfxBus);
      hyd.start();

      this.machines.set('fork-eye', { panner, gain });
    }

    // 6. PRJ-IRON-BIPED (Xung giữ moment QDD BLDC actuator + rơ-le CAN-FD)
    {
      const panner = this.makePanner(ctx, 6.2, 1.1, -2.0, 2.5);
      const gain = ctx.createGain();
      gain.gain.value = 0.14;

      const qdd = ctx.createOscillator();
      qdd.type = 'sine';
      qdd.frequency.value = 1480;
      const qddG = ctx.createGain();
      qddG.gain.value = 0.022;
      qdd.connect(qddG);
      qddG.connect(gain);
      gain.connect(panner);
      panner.connect(this.sfxBus);
      qdd.start();

      let nextTick = 1.5;
      this.machines.set('iron-biped', {
        panner,
        gain,
        update: (t) => {
          qdd.frequency.value = 1480 + Math.sin(t * 4.2) * 18;
          if (t > nextTick && this.ctx && this.ctx.state === 'running' && !this.muted && !this.panicMuted) {
            nextTick = t + 2.4 + Math.random() * 2.5;
            this.playSpatialTone(panner, 2100, 0.025, 0.028, 'triangle');
          }
        },
      });
    }
  }

  private playSpatialTone(
    dest: AudioNode,
    freq: number,
    dur: number,
    peak: number,
    type: OscillatorType = 'sine'
  ) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(peak, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g);
    g.connect(dest);
    o.start(now);
    o.stop(now + dur + 0.02);
  }

  /* ------------------------------------------------------------------ */
  /* Frame Update from Three.js Scene (Camera Listener + AMR Position)   */
  /* ------------------------------------------------------------------ */

  updateSpatialFrame(
    camera: THREE.Camera,
    projectPositions: Record<string, [number, number, number]>,
    amrPos: THREE.Vector3,
    sagging: boolean,
    t: number,
    dt: number
  ) {
    if (!this.ctx || this.ctx.state !== 'running') return;

    // Cập nhật vị trí & hướng tai nghe 3D theo Camera
    const l = this.ctx.listener;
    camera.getWorldDirection(this.tmpForward);
    this.tmpUp.copy(camera.up).applyQuaternion(camera.quaternion);

    if ('positionX' in l && l.positionX) {
      l.positionX.value = camera.position.x;
      l.positionY.value = camera.position.y;
      l.positionZ.value = camera.position.z;
      l.forwardX.value = this.tmpForward.x;
      l.forwardY.value = this.tmpForward.y;
      l.forwardZ.value = this.tmpForward.z;
      l.upX.value = this.tmpUp.x;
      l.upY.value = this.tmpUp.y;
      l.upZ.value = this.tmpUp.z;
    } else {
      l.setPosition(camera.position.x, camera.position.y, camera.position.z);
      l.setOrientation(
        this.tmpForward.x,
        this.tmpForward.y,
        this.tmpForward.z,
        this.tmpUp.x,
        this.tmpUp.y,
        this.tmpUp.z
      );
    }

    // Vận tốc thực của AMR để điều biến tiếng servo Swerve
    if (dt > 0.0001) {
      const dist = amrPos.distanceTo(this.prevAmrPos);
      const instSpeed = dist / dt;
      if (instSpeed < 20) {
        this.amrSpeed = this.amrSpeed * 0.88 + instSpeed * 0.12;
      }
      this.prevAmrPos.copy(amrPos);
    }

    // Cập nhật tọa độ từng máy trong không gian 3D
    this.machines.forEach((rig, id) => {
      if (id === 'amr-slam') {
        rig.panner.positionX.value = amrPos.x;
        rig.panner.positionY.value = amrPos.y + 0.35;
        rig.panner.positionZ.value = amrPos.z;
      } else if (projectPositions[id]) {
        const [px, py, pz] = projectPositions[id];
        rig.panner.positionX.value = px;
        rig.panner.positionY.value = py + (id === 'sky-ghost' ? 1.25 : 0.85);
        rig.panner.positionZ.value = pz;
      }
      rig.update?.(t, dt);
    });

    // Arc Reactor sụt áp → trầm giọng xuống
    if (this.reactorOsc1 && this.reactorOsc2 && this.reactorGain) {
      const baseF = sagging ? 39 + Math.sin(t * 14) * 4 : 55;
      this.reactorOsc1.frequency.value = baseF;
      this.reactorOsc2.frequency.value = baseF * 2.005;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Synchronized 3D Event Triggers (Drone Spark, AMR Crash, Lab FX)     */
  /* ------------------------------------------------------------------ */

  /** Xẹt tia lửa điện tại motor cháy ESC của SKY-GHOST */
  triggerDroneSpark() {
    if (!this.ctx || this.ctx.state !== 'running' || this.muted || this.panicMuted) return;
    const rig = this.machines.get('sky-ghost');
    if (!rig || !this.noiseBuf) return;

    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loopStart = Math.random() * 1.5;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2800 + Math.random() * 1600, now);
    bp.Q.value = 3.5;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.28, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    src.connect(bp);
    bp.connect(g);
    g.connect(rig.panner);
    src.start(now, Math.random() * 1.2, 0.11);
  }

  /** Tiếng báo động hoảng loạn khi AMR mất định vị xoay vòng */
  triggerAmrCrash() {
    if (!this.ctx || this.ctx.state !== 'running' || this.muted || this.panicMuted) return;
    const rig = this.machines.get('amr-slam');
    if (!rig) return;

    const now = this.ctx.currentTime;
    const notes = [980, 740, 1180, 620, 480];
    notes.forEach((f, i) => {
      const o = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      o.type = 'sawtooth';
      const t0 = now + i * 0.085;
      o.frequency.setValueAtTime(f, t0);
      o.frequency.exponentialRampToValueAtTime(f * 0.78, t0 + 0.075);
      const lp = this.ctx!.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2200;
      g.gain.setValueAtTime(0.001, t0);
      g.gain.linearRampToValueAtTime(0.16, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);
      o.connect(lp);
      lp.connect(g);
      g.connect(rig.panner);
      o.start(t0);
      o.stop(t0 + 0.09);
    });
  }

  playHudClick(freq = 580) {
    if (!this.ctx || this.ctx.state !== 'running' || this.muted || this.panicMuted || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, now);
    o.frequency.exponentialRampToValueAtTime(freq * 1.35, now + 0.045);
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
    o.connect(g);
    g.connect(this.sfxBus);
    o.start(now);
    o.stop(now + 0.06);
  }

  /** Hiệu ứng âm thanh khi bấm các nút tương tác trong phòng lab */
  playLabAction(type: 'incense' | 'bonk' | 'dust' | 'boom' | 'brownout') {
    this.ensureStarted();
    if (!this.ctx || this.ctx.state !== 'running' || this.muted || this.panicMuted || !this.sfxBus) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    if (type === 'incense') {
      // Tiếng chuông đồng / bát âm thanh tịnh tâm linh thiêng
      [528, 1056, 1588].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.11 / (i + 1), now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2 - i * 0.4);
        o.connect(g);
        g.connect(this.sfxBus!);
        if (this.reverbSend) g.connect(this.reverbSend);
        o.start(now);
        o.stop(now + 2.3);
      });
    } else if (type === 'bonk') {
      // Tiếng cờ-lê gõ vỏ thép CỘP!
      const carrier = ctx.createOscillator();
      const mod = ctx.createOscillator();
      const modG = ctx.createGain();
      const g = ctx.createGain();
      carrier.type = 'triangle';
      carrier.frequency.setValueAtTime(290, now);
      carrier.frequency.exponentialRampToValueAtTime(135, now + 0.18);
      mod.frequency.value = 418;
      modG.gain.setValueAtTime(260, now);
      modG.gain.exponentialRampToValueAtTime(8, now + 0.14);
      g.gain.setValueAtTime(0.28, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      mod.connect(modG);
      modG.connect(carrier.frequency);
      carrier.connect(g);
      g.connect(this.sfxBus);
      mod.start(now);
      carrier.start(now);
      mod.stop(now + 0.25);
      carrier.stop(now + 0.25);
    } else if (type === 'dust') {
      // Tiếng bình xịt khí nén PSSSSHHHH!
      if (!this.noiseBuf) return;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1400, now);
      bp.frequency.exponentialRampToValueAtTime(3800, now + 0.18);
      bp.frequency.exponentialRampToValueAtTime(1900, now + 0.55);
      bp.Q.value = 1.1;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.32, now + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
      src.connect(bp);
      bp.connect(g);
      g.connect(this.sfxBus);
      src.start(now, 0, 0.65);
    } else if (type === 'boom') {
      // Tiếng nổ tụ / cháy MOSFET BÙM-XẸT!
      const sub = ctx.createOscillator();
      const sg = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(145, now);
      sub.frequency.exponentialRampToValueAtTime(34, now + 0.42);
      sg.gain.setValueAtTime(0.38, now);
      sg.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
      sub.connect(sg);
      sg.connect(this.sfxBus);
      sub.start(now);
      sub.stop(now + 0.5);

      if (this.noiseBuf) {
        const nz = ctx.createBufferSource();
        nz.buffer = this.noiseBuf;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(3200, now);
        lp.frequency.exponentialRampToValueAtTime(280, now + 0.45);
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.34, now);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
        nz.connect(lp);
        lp.connect(ng);
        ng.connect(this.sfxBus);
        nz.start(now, 0.2, 0.52);
      }
    } else if (type === 'brownout') {
      // Tiếng sụt nguồn cầu dao + tuabin tụt áp
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(260, now);
      o.frequency.exponentialRampToValueAtTime(48, now + 0.85);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 420;
      g.gain.setValueAtTime(0.20, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
      o.connect(lp);
      lp.connect(g);
      g.connect(this.sfxBus);
      o.start(now);
      o.stop(now + 1.45);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Procedural Multi-Station Music Sequencer (Synthwave / Lo-Fi / Amb)  */
  /* ------------------------------------------------------------------ */

  private scheduleMusic() {
    if (!this.ctx || this.ctx.state !== 'running' || !this.bgmBus) return;
    if (this.station === 'off' || this.muted || this.panicMuted) {
      this.nextStepTime = this.ctx.currentTime + 0.1;
      return;
    }

    const lookahead = 0.12;
    while (this.nextStepTime < this.ctx.currentTime + lookahead) {
      if (this.station === 'synthwave') {
        this.scheduleSynthwaveStep(this.stepIndex, this.nextStepTime);
        this.nextStepTime += 60 / 92 / 4; // 16th note @ 92 BPM
      } else if (this.station === 'lofi') {
        const swing = this.stepIndex % 2 === 1 ? 0.022 : -0.022;
        this.scheduleLofiStep(this.stepIndex, this.nextStepTime + Math.max(0, swing));
        this.nextStepTime += 60 / 76 / 4; // 16th note @ 76 BPM
      } else if (this.station === 'ambient') {
        this.scheduleAmbientStep(this.stepIndex, this.nextStepTime);
        this.nextStepTime += 0.45;
      }
      this.stepIndex = (this.stepIndex + 1) % 64;
    }
  }

  /** Station 1: CYBER BUNKER — Dark Synthwave (Am9 -> Fmaj7 -> Dm9 -> E7sus4/E7) */
  private scheduleSynthwaveStep(step: number, time: number) {
    const bar = Math.floor(step / 16) % 4;
    const s = step % 16;

    const chords = [
      [57, 60, 64, 67, 71], // Am9
      [53, 57, 60, 64, 69], // Fmaj9
      [50, 53, 57, 60, 64], // Dm9
      [52, 57, 59, 64, 68], // E7sus4/E
    ];
    const bassRoots = [33, 29, 38, 28]; // A1, F1, D2, E1
    const arpPools = [
      [69, 72, 76, 79, 83, 79, 76, 72],
      [65, 69, 72, 76, 81, 76, 72, 69],
      [62, 65, 69, 72, 76, 72, 69, 65],
      [64, 68, 71, 74, 76, 74, 71, 68],
    ];

    // Warm Analog Pad ở đầu mỗi ô nhịp
    if (s === 0) {
      this.playPadChord(chords[bar], time, (60 / 92) * 4.1, 0.052, 980);
    }

    // Rolling Synthwave 8th-note Bassline
    if (s % 2 === 0) {
      const oct = s === 6 || s === 14 ? 12 : 0;
      this.playSynthBass(mtof(bassRoots[bar] + oct), time, 0.24, s % 4 === 0 ? 0.19 : 0.14);
    }

    // Crystalline Blade-Runner Pluck Arpeggio (với stereo delay)
    if (s % 2 === 0 || s === 11 || s === 15) {
      const pool = arpPools[bar];
      const note = pool[(step * 3 + bar) % pool.length];
      this.playPluck(mtof(note), time, 0.28, 0.048);
    }

    // Analog Drum Groove: Kick trên 0, 8, 10; Snare mềm trên 4, 12; Hat trên nhịp chẵn/lẻ
    if (s === 0 || s === 10) this.playKick(time, 0.24);
    if (s === 4 || s === 12) this.playSnare(time, 0.11);
    if (s % 2 === 0) this.playHat(time, s % 4 === 2 ? 0.036 : 0.02);
  }

  /** Station 2: 2AM LO-FI DEBUG — Rhodes Chill Jazz Hop */
  private scheduleLofiStep(step: number, time: number) {
    const bar = Math.floor(step / 16) % 4;
    const s = step % 16;

    const rhodesChords = [
      [50, 57, 60, 64, 69], // Dm9
      [43, 53, 57, 59, 64], // G13
      [48, 55, 59, 62, 67], // Cmaj9
      [45, 55, 58, 61, 65], // A7b13
    ];
    const subRoots = [38, 43, 36, 33];

    if (s === 0 || (s === 10 && bar % 2 === 1)) {
      const dur = s === 0 ? (60 / 76) * 3.6 : (60 / 76) * 1.4;
      this.playRhodesChord(rhodesChords[bar], time, dur, s === 0 ? 0.065 : 0.042);
    }

    if (s === 0 || s === 7 || s === 10) {
      this.playSubNote(mtof(subRoots[bar]), time, 0.45, 0.16);
    }

    // Mellow Lo-Fi Melody Bell ở nửa sau chu kỳ
    if ((s === 3 || s === 9 || s === 14) && Math.random() > 0.35) {
      const scale = [72, 74, 76, 79, 81, 84];
      const n = scale[(step + bar * 2) % scale.length];
      this.playPluck(mtof(n), time, 0.45, 0.036);
    }

    // Boom-bap dusty drums
    if (s === 0 || s === 7 || (s === 10 && bar % 2 === 0)) this.playKick(time, 0.20, 95);
    if (s === 4 || s === 12) this.playRimSnare(time, 0.085);
    if (s % 2 === 0 || s === 15) this.playHat(time, 0.018);
  }

  /** Station 3: DARK REACTOR — Beatless Sci-Fi Ambient Drone */
  private scheduleAmbientStep(step: number, time: number) {
    if (step % 16 === 0) {
      const droneChords = [
        [45, 52, 57, 60, 64, 71],
        [41, 48, 55, 57, 60, 69],
        [43, 50, 55, 59, 62, 67],
        [40, 47, 52, 56, 59, 64],
      ];
      const idx = Math.floor(step / 16) % 4;
      this.playPadChord(droneChords[idx], time, 7.6, 0.055, 760);
    }
    if (step % 6 === 2 && Math.random() > 0.3) {
      const shimmer = [76, 79, 81, 83, 84, 88];
      const n = shimmer[(step * 5) % shimmer.length];
      this.playPluck(mtof(n), time, 1.2, 0.03);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Musical Synth Instruments                                           */
  /* ------------------------------------------------------------------ */

  private playPadChord(notes: number[], time: number, dur: number, peak: number, cutoff: number) {
    if (!this.ctx || !this.bgmBus) return;
    const ctx = this.ctx;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(cutoff * 0.65, time);
    lp.frequency.linearRampToValueAtTime(cutoff, time + dur * 0.45);
    lp.frequency.linearRampToValueAtTime(cutoff * 0.6, time + dur);
    lp.Q.value = 1.2;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(peak, time + Math.min(0.8, dur * 0.28));
    env.gain.setValueAtTime(peak * 0.85, time + dur * 0.72);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.3);

    lp.connect(env);
    env.connect(this.bgmBus);
    if (this.reverbSend) env.connect(this.reverbSend);

    notes.forEach((m) => {
      [-7, 7].forEach((detune) => {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(mtof(m), time);
        o.detune.setValueAtTime(detune, time);
        o.connect(lp);
        o.start(time);
        o.stop(time + dur + 0.35);
      });
    });
  }

  private playRhodesChord(notes: number[], time: number, dur: number, peak: number) {
    if (!this.ctx || !this.bgmBus) return;
    const ctx = this.ctx;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1600, time);
    lp.frequency.exponentialRampToValueAtTime(520, time + dur);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(peak, time + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    lp.connect(env);
    env.connect(this.bgmBus);
    if (this.reverbSend) env.connect(this.reverbSend);

    notes.forEach((m, idx) => {
      const tNote = time + idx * 0.014; // rải hợp âm nhẹ kiểu phím đàn thật
      const o = ctx.createOscillator();
      const tine = ctx.createOscillator();
      const tineG = ctx.createGain();
      o.type = 'triangle';
      tine.type = 'sine';
      const f = mtof(m);
      o.frequency.setValueAtTime(f, tNote);
      tine.frequency.setValueAtTime(f * 4, tNote);
      tineG.gain.setValueAtTime(0.12, tNote);
      tineG.gain.exponentialRampToValueAtTime(0.0001, tNote + 0.14);
      o.connect(lp);
      tine.connect(tineG);
      tineG.connect(lp);
      o.start(tNote);
      tine.start(tNote);
      o.stop(time + dur + 0.05);
      tine.stop(tNote + 0.16);
    });
  }

  private playSynthBass(freq: number, time: number, dur: number, peak: number) {
    if (!this.ctx || !this.bgmBus) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const sub = ctx.createOscillator();
    o.type = 'sawtooth';
    sub.type = 'sine';
    o.frequency.setValueAtTime(freq, time);
    sub.frequency.setValueAtTime(freq, time);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(540, time);
    lp.frequency.exponentialRampToValueAtTime(140, time + dur);
    lp.Q.value = 3.0;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(peak, time + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    o.connect(lp);
    sub.connect(lp);
    lp.connect(g);
    g.connect(this.bgmBus);
    o.start(time);
    sub.start(time);
    o.stop(time + dur + 0.02);
    sub.stop(time + dur + 0.02);
  }

  private playSubNote(freq: number, time: number, dur: number, peak: number) {
    if (!this.ctx || !this.bgmBus) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, time);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(peak, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    o.connect(g);
    g.connect(this.bgmBus);
    o.start(time);
    o.stop(time + dur + 0.03);
  }

  private playPluck(freq: number, time: number, dur: number, peak: number) {
    if (!this.ctx || !this.bgmBus) return;
    const o = this.ctx.createOscillator();
    const lp = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(freq, time);
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(freq * 3.8, time);
    lp.frequency.exponentialRampToValueAtTime(freq * 1.1, time + dur);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(peak, time + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    o.connect(lp);
    lp.connect(g);
    g.connect(this.bgmBus);
    if (this.delaySend) g.connect(this.delaySend);
    o.start(time);
    o.stop(time + dur + 0.03);
  }

  private playKick(time: number, peak: number, topFreq = 128) {
    if (!this.ctx || !this.bgmBus) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(topFreq, time);
    o.frequency.exponentialRampToValueAtTime(42, time + 0.14);
    g.gain.setValueAtTime(peak, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.24);
    o.connect(g);
    g.connect(this.bgmBus);
    o.start(time);
    o.stop(time + 0.25);
  }

  private playSnare(time: number, peak: number) {
    if (!this.ctx || !this.bgmBus || !this.noiseBuf) return;
    const nz = this.ctx.createBufferSource();
    nz.buffer = this.noiseBuf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1350;
    bp.Q.value = 0.85;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(peak, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.19);
    nz.connect(bp);
    bp.connect(g);
    g.connect(this.bgmBus);
    if (this.reverbSend) g.connect(this.reverbSend);
    nz.start(time, 0.1, 0.2);
  }

  private playRimSnare(time: number, peak: number) {
    if (!this.ctx || !this.bgmBus) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(410, time);
    o.frequency.exponentialRampToValueAtTime(185, time + 0.045);
    g.gain.setValueAtTime(peak, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);
    o.connect(g);
    g.connect(this.bgmBus);
    if (this.reverbSend) g.connect(this.reverbSend);
    o.start(time);
    o.stop(time + 0.08);
  }

  private playHat(time: number, peak: number) {
    if (!this.ctx || !this.bgmBus || !this.noiseBuf) return;
    const nz = this.ctx.createBufferSource();
    nz.buffer = this.noiseBuf;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 5800;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(peak, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    nz.connect(hp);
    hp.connect(g);
    g.connect(this.bgmBus);
    nz.start(time, 0.5, 0.06);
  }
}

export const labAudio = new LabAudioEngine();

