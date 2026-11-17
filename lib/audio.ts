class MaxSoundEngine {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private ensureContext(): AudioContext | null {
    if (!this.enabled || typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public tick() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.035);
    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  public pour(viscosity: "thin" | "thick" = "thin", durationSec = 0.9) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.42;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(viscosity === "thin" ? 900 : 420, now);
    filter.frequency.exponentialRampToValueAtTime(
      viscosity === "thin" ? 1520 : 640,
      now + durationSec
    );
    filter.Q.value = viscosity === "thin" ? 2.4 : 3.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.085, now + 0.12);
    gain.gain.setValueAtTime(0.075, now + durationSec - 0.14);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + durationSec + 0.02);
  }

  public clink() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [1680, 2240].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.065);
      gain.gain.setValueAtTime(0.04, now + idx * 0.065);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + idx * 0.065 + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.065);
      osc.stop(now + idx * 0.065 + 0.2);
    });
  }

  public merge() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [330, 440, 554.37, 659.25].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.055);
      gain.gain.setValueAtTime(0.038, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + idx * 0.055 + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.38);
    });
  }
}

export const soundEngine = new MaxSoundEngine();
