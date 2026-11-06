import { Platform, Vibration } from 'react-native';
/**
 * GlowVai Vendor App: alert sounds and vibration.
 *   - New order offer: a short chime plus vibration (and a browser notification on web,
 *     only if the vendor already allowed notifications).
 *   - Accepted / packed: a soft confirmation ding.
 * Sound uses Web Audio, so it plays on web only; native phones vibrate. There is no push
 * notification while the app is closed yet.
 */

class SoundService {
  private audioCtx: any = null;

  private getAudioContext() {
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!this.audioCtx && AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch (_) {
      return null;
    }
  }

  /**
   * Request browser / platform notification permission
   */
  public async requestNotificationPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      } catch (_) {}
    }
  }

  /**
   * Show native push notification banner
   */
  public showPushNotification(title: string, body: string, data?: any) {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body,
            tag: data?.orderId || 'glowvai-order',
            requireInteraction: true,
          });
        }
      } catch (_) {}
    }
  }

  /**
   * Trigger hardware vibration pattern (Mobile browsers + Android PWA)
   */
  public vibrate(pattern: number | number[] = [250, 100, 250, 100, 350]) {
    if (Platform.OS !== 'web') {
      // Native phones: React Native's built-in Vibration API (no extra package needed).
      const durations = Array.isArray(pattern) ? pattern : [0, pattern];
      try {
        Vibration.vibrate(durations);
      } catch (_) {}
      return;
    }
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (_) {}
    }
  }

  /**
   * A short chime and vibration for a new order offer. Every step fails silently: on native
   * phones there is no Web Audio, so only the vibration plays; browsers may block sound until
   * the page has been tapped once.
   */
  public playIncomingOrderChime(orderSummary?: string) {
    // 1. Hardware vibration
    this.vibrate([300, 150, 300, 150, 400]);

    // 2. Push notification
    if (orderSummary) {
      this.showPushNotification('New order offer', orderSummary);
    }

    // 3. Web Audio synthesizer chime
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Pulse 1 (High tone)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6
      gain1.gain.setValueAtTime(0.5, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Pulse 2 (Harmonic Resolve tone)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1318.51, now + 0.2); // E6
      gain2.gain.setValueAtTime(0.45, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.6);

      // Pulse 3 (Sustained bell shimmer)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1760, now + 0.35); // A6
      gain3.gain.setValueAtTime(0.3, now + 0.35);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.35);
      osc3.stop(now + 0.85);
    } catch (_) {}
  }

  /**
   * Play a pleasant confirmation ding when order is accepted, packed, or handed over
   */
  public playSuccessDing() {
    this.vibrate([100]);
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.12); // C6
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (_) {}
  }

  /**
   * Continuous ringing helpers for incoming order modal
   */
  public startRinging() {
    this.playIncomingOrderChime();
  }

  public stopRinging() {
    // No-op or stop continuous oscillator if needed
  }

  public vibrateOrderRinging() {
    this.vibrate([300, 150, 300, 150, 400]);
  }

  /**
   * Play a low warning beep when an order is declined or stock is low
   */
  public playWarningTone() {
    this.vibrate([200, 100, 200]);
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(329.63, now); // E4
      osc.frequency.setValueAtTime(261.63, now + 0.15); // C4
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (_) {}
  }
}

export const soundService = new SoundService();
