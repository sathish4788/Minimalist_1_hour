import { SoundTone } from '../types/todo';

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Automatically unlock audio on first touch/click on mobile devices
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
  window.addEventListener('pointerdown', unlockAudio, { passive: true, once: true });
  window.addEventListener('click', unlockAudio, { passive: true, once: true });
  window.addEventListener('keydown', unlockAudio, { passive: true, once: true });
}

/**
 * Plays a soft, minimalist reminder chime or user-selected custom phone audio tone
 */
export function playChime(
  tone: SoundTone = 'mellow',
  volume: number = 0.6,
  customAudioData?: string
): void {
  // If user uploaded a custom tone from their phone storage, play that audio!
  if (tone === 'custom-phone' && customAudioData) {
    try {
      const audio = new Audio(customAudioData);
      audio.volume = Math.max(0.01, Math.min(volume, 1.0));
      audio.play().catch((err) => {
        console.warn('Custom phone audio play blocked or invalid, falling back to mellow tone:', err);
        playChime('mellow', volume);
      });
      return;
    } catch {
      // Fallback to mellow tone below
    }
  }

  // If using native phone system notification tone, skip web synth chime
  if (tone === 'phone-system') {
    return;
  }

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(volume, 1.0)), ctx.currentTime);
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (tone) {
      case 'mellow': {
        // Two soft ascending sine tones with smooth exponential decay
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now); // A4
        gain1.gain.setValueAtTime(0.35, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, now + 0.12); // E5
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.setValueAtTime(0.35, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc2.connect(gain2);
        gain2.connect(masterGain);

        osc1.start(now);
        osc1.stop(now + 0.8);
        osc2.start(now + 0.12);
        osc2.stop(now + 1.2);
        break;
      }

      case 'zen': {
        // Deep singing bowl tone with warm harmonic resonance
        const fundamental = ctx.createOscillator();
        const harmonic = ctx.createOscillator();
        const fGain = ctx.createGain();
        const hGain = ctx.createGain();

        fundamental.type = 'sine';
        fundamental.frequency.setValueAtTime(329.63, now); // E4
        fGain.gain.setValueAtTime(0.4, now);
        fGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

        harmonic.type = 'sine';
        harmonic.frequency.setValueAtTime(659.25, now); // E5
        hGain.gain.setValueAtTime(0.18, now);
        hGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

        fundamental.connect(fGain);
        fGain.connect(masterGain);
        harmonic.connect(hGain);
        hGain.connect(masterGain);

        fundamental.start(now);
        fundamental.stop(now + 2.0);
        harmonic.start(now);
        harmonic.stop(now + 1.4);
        break;
      }

      case 'gentle-bell': {
        // Crisp high bell chime with three shimmer frequencies
        const freqs = [587.33, 880, 1174.66]; // D5, A5, D6
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startDelay = idx * 0.08;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + startDelay);

          gain.gain.setValueAtTime(0, now);
          gain.gain.setValueAtTime(0.28 / (idx + 1), now + startDelay);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + startDelay + 1.1);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + startDelay);
          osc.stop(now + startDelay + 1.1);
        });
        break;
      }

      case 'marimba': {
        // Warm wooden percussive knock chime
        const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const delay = i * 0.09;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + delay);

          gain.gain.setValueAtTime(0, now);
          gain.gain.setValueAtTime(0.32, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.0005, now + delay + 0.45);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + delay);
          osc.stop(now + delay + 0.45);
        });
        break;
      }
    }
  } catch {
    // Graceful fallback if Web Audio is blocked or unsupported
  }
}

/**
 * Satisfying, minimal micro-click for checking off a task
 */
export function playCheckmarkSound(volume: number = 0.4): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // up to A5

    gain.gain.setValueAtTime(volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  } catch {
    // Ignore error
  }
}
