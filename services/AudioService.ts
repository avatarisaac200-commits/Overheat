class AudioService {
  private ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(
    freq: number,
    type: OscillatorType,
    duration: number,
    volume: number = 0.1,
    ramp: boolean = true
  ) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator()!;
    const gain = this.ctx.createGain()!;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);

    gain.gain.setValueAtTime(volume, this.ctx!.currentTime);
    if (ramp) {
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx!.currentTime + duration);
    } else {
      setTimeout(() => gain.gain.setValueAtTime(0, this.ctx!.currentTime), duration * 1000);
    }

    osc.connect(gain);
    gain.connect(this.ctx!.destination);

    osc.start();
    osc.stop(this.ctx!.currentTime + duration);
  }

  playShoot() {
    this.playTone(880, 'square', 0.1, 0.05);
  }

  playEnemyShoot() {
    this.playTone(220, 'triangle', 0.1, 0.05);
  }

  playExplosion() {
    this.playTone(60, 'sawtooth', 0.6, 0.2);
    this.playTone(40, 'square', 0.4, 0.1);
  }

  playHit() {
    this.playTone(440, 'sine', 0.05, 0.1);
  }

  playDamage() {
    this.playTone(150, 'square', 0.3, 0.2);
  }

  playPowerup() {
    this.playTone(600, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(900, 'sine', 0.1, 0.1), 80);
    setTimeout(() => this.playTone(1200, 'sine', 0.2, 0.1), 160);
  }

  playBomb() {
    this.playTone(300, 'sawtooth', 1.0, 0.3);
    this.playTone(100, 'sawtooth', 1.0, 0.3);
  }

  playCombo(count: number) {
    const base = 220;
    const freq = base * Math.pow(1.059, count); // semi-tone steps
    this.playTone(freq, 'sine', 0.1, 0.1);
  }
}

export const audioService = new AudioService();
