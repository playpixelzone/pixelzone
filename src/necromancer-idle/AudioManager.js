/**
 * Audio-Grundlage — später echte OGG/MP3 einbinden.
 */
export class AudioManager {
  constructor() {
    this._enabled = true;
  }

  /** Kurzer Klick-Hinweis (Stub: leise, ohne Datei). */
  playClickSound() {
    if (!this._enabled) return;
    this.#beep(880, 0.04, 0.02);
  }

  /** Kauf-Bestätigung (Stub). */
  playBuySound() {
    if (!this._enabled) return;
    this.#beep(523, 0.06, 0.03);
    setTimeout(() => this.#beep(784, 0.05, 0.02), 40);
  }

  /**
   * Minimaler Web-Audio-Ton (keine externen Assets).
   * @param {number} freq
   * @param {number} durSec
   * @param {number} vol
   */
  #beep(freq, durSec, vol) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!this._ctx) this._ctx = new Ctx();
      const ctx = this._ctx;
      if (ctx.state === 'suspended') ctx.resume();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + durSec);
    } catch {
      /* ignore */
    }
  }
}
