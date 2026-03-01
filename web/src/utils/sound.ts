// Sound effects utility for TradeSense
// Uses Web Audio API for simple beep sounds

const audioContext = typeof window !== 'undefined' 
  ? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext)()
  : null;

export function playSound(type: 'correct' | 'wrong' | 'click' | 'success') {
  if (!audioContext) return;
  
  // Resume context if suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  const now = audioContext.currentTime;

  switch (type) {
    case 'correct':
      // Happy rising tone
      oscillator.frequency.setValueAtTime(523.25, now); // C5
      oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      oscillator.start(now);
      oscillator.stop(now + 0.3);
      break;
      
    case 'wrong':
      // Sad descending tone
      oscillator.frequency.setValueAtTime(200, now);
      oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.3);
      oscillator.type = 'sawtooth';
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      oscillator.start(now);
      oscillator.stop(now + 0.3);
      break;
      
    case 'click':
      // Short click
      oscillator.frequency.setValueAtTime(800, now);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      oscillator.start(now);
      oscillator.stop(now + 0.05);
      break;
      
    case 'success':
      // Victory fanfare
      oscillator.frequency.setValueAtTime(523.25, now);
      oscillator.frequency.setValueAtTime(659.25, now + 0.1);
      oscillator.frequency.setValueAtTime(783.99, now + 0.2);
      oscillator.frequency.setValueAtTime(1046.50, now + 0.3);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      oscillator.start(now);
      oscillator.stop(now + 0.5);
      break;
  }
}

// Vibration feedback for mobile
export function vibrate(type: 'light' | 'medium' | 'heavy' | 'success') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  
  switch (type) {
    case 'light':
      navigator.vibrate(10);
      break;
    case 'medium':
      navigator.vibrate(20);
      break;
    case 'heavy':
      navigator.vibrate(40);
      break;
    case 'success':
      navigator.vibrate([50, 30, 50]);
      break;
  }
}
