/**
 * Synthesizes a gentle two-tone sweet chime (C6 then G6) dynamically using Web Audio API.
 * This guarantees the audio is generated client-side with zero external assets,
 * working offline and bypasses any loading delays.
 */
export const playNotificationSound = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      
      // Gentle soft chime level and exponential decay
      gain.gain.setValueAtTime(0.06, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    const now = ctx.currentTime;
    playTone(1046.50, now, 0.35); // C6
    playTone(1567.98, now + 0.08, 0.45); // G6 (slightly offset to sound like a chime chime)
  } catch (e) {
    console.warn("Failed to play notification sound:", e);
  }
};
