import { useCallback, useRef } from 'react';

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playNotificationSound = useCallback((type: 'warning' | 'info' | 'success' = 'info') => {
    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      // Resume context if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different notification types
      const frequencies = {
        warning: [440, 550], // A4 to C#5 - attention grabbing
        info: [523, 659],    // C5 to E5 - pleasant
        success: [523, 659, 784], // C5, E5, G5 - happy chord progression
      };

      const freqs = frequencies[type];
      const now = audioContext.currentTime;
      
      // Set initial volume
      gainNode.gain.setValueAtTime(0.15, now);
      
      // Play the notes
      freqs.forEach((freq, index) => {
        const startTime = now + index * 0.12;
        const endTime = startTime + 0.15;
        
        if (index === 0) {
          oscillator.frequency.setValueAtTime(freq, startTime);
        } else {
          oscillator.frequency.setValueAtTime(freq, startTime);
        }
      });

      // Fade out
      const totalDuration = freqs.length * 0.12 + 0.15;
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + totalDuration);

      oscillator.type = 'sine';
      oscillator.start(now);
      oscillator.stop(now + totalDuration + 0.1);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, []);

  return { playNotificationSound };
}
