/** Original synthesized cues. Browser APIs are optional and never gate play. */
export function createFlightFeedback() {
  let context: AudioContext | undefined;
  let active = false;
  const voices = new Map<OscillatorNode, GainNode>();
  const stop = () => {
    active = false;
    for (const [voice, gain] of voices) {
      gain.disconnect();
      voice.stop();
    }
    voices.clear();
  };
  const tone = (
    frequency: number,
    delay: number,
    duration: number,
    end = frequency
  ) => {
    if (!context) return;
    const start = context.currentTime + delay;
    const voice = context.createOscillator();
    const gain = context.createGain();
    voice.type = "sine";
    voice.frequency.setValueAtTime(frequency, start);
    voice.frequency.exponentialRampToValueAtTime(end, start + duration);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.045, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    voice.connect(gain).connect(context.destination);
    voices.set(voice, gain);
    voice.onended = () => {
      voice.disconnect();
      gain.disconnect();
      voices.delete(voice);
    };
    voice.start(start);
    voice.stop(start + duration);
  };
  return {
    // Called only from the Lock button, never from restored state/effects.
    launch({
      sound,
      haptics,
      reducedMotion,
    }: {
      sound: boolean;
      haptics: boolean;
      reducedMotion: boolean;
    }) {
      stop();
      if (haptics && !reducedMotion) {
        try {
          navigator.vibrate?.(12);
        } catch {
          /* Unsupported/blocked vibration. */
        }
      }
      if (!sound) return;
      try {
        context ??= new AudioContext();
        void context.resume().catch(stop);
        active = true;
        tone(130, 0, 0.22, 260);
        tone(390, 0.12, 0.18, 520);
      } catch {
        stop();
      }
    },
    reveal(outcome: "perfect" | "survive" | "miss") {
      if (!active || document.hidden) return;
      active = false;
      try {
        if (outcome === "miss") tone(220, 0, 0.25, 110);
        else {
          tone(523.25, 0, 0.18);
          tone(outcome === "perfect" ? 783.99 : 659.25, 0.12, 0.25);
        }
      } catch {
        stop();
      }
    },
    stop,
    dispose() {
      stop();
      void context?.close().catch(() => {});
      context = undefined;
    },
  };
}
