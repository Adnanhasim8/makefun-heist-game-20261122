// Velvet Rook — synthesized sound, no audio files.
// One file, one job: every beep, clink and alarm tone is made with the
// Web Audio oscillator, so the game ships no sound assets and no network.
export function createSoundBank() {
  let ctx = null;
  let alarmOsc = null;
  let alarmGain = null;

  function ensure() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  function tone(freq, seconds, type, volume, when = 0) {
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  }

  return {
    unlock() {
      ensure();
    },
    pickup() {
      tone(880, 0.12, 'sine', 0.16);
      tone(1318, 0.16, 'sine', 0.12, 0.07);
    },
    coin() {
      tone(1568, 0.09, 'triangle', 0.14);
      tone(2093, 0.14, 'triangle', 0.1, 0.06);
    },
    coinLand() {
      tone(420, 0.08, 'square', 0.06);
    },
    smoke() {
      tone(220, 0.25, 'sawtooth', 0.05);
    },
    channelTick() {
      tone(660, 0.05, 'sine', 0.07);
    },
    diamond() {
      tone(523, 0.14, 'sine', 0.16);
      tone(659, 0.14, 'sine', 0.16, 0.1);
      tone(784, 0.2, 'sine', 0.16, 0.2);
      tone(1046, 0.3, 'sine', 0.14, 0.3);
    },
    spotted() {
      tone(196, 0.18, 'square', 0.12);
      tone(147, 0.22, 'square', 0.12, 0.12);
    },
    caught() {
      tone(110, 0.5, 'sawtooth', 0.16);
      tone(82, 0.7, 'sawtooth', 0.14, 0.25);
    },
    win() {
      [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.28, 'triangle', 0.14, i * 0.11));
    },
    click() {
      tone(700, 0.05, 'sine', 0.08);
    },
    // A quiet two-tone alarm loop while the alarm meter runs hot.
    setAlarmHot(hot) {
      const ac = ensure();
      if (!ac) return;
      if (hot && !alarmOsc) {
        alarmOsc = ac.createOscillator();
        alarmGain = ac.createGain();
        alarmOsc.type = 'square';
        alarmOsc.frequency.setValueAtTime(620, ac.currentTime);
        alarmGain.gain.setValueAtTime(0.028, ac.currentTime);
        alarmOsc.connect(alarmGain);
        alarmGain.connect(ac.destination);
        alarmOsc.start();
        const flip = () => {
          if (!alarmOsc) return;
          alarmOsc.frequency.setValueAtTime(alarmOsc.frequency.value > 500 ? 440 : 620, ac.currentTime);
          setTimeout(flip, 420);
        };
        setTimeout(flip, 420);
      } else if (!hot && alarmOsc) {
        try {
          alarmOsc.stop();
        } catch {
          /* already stopped */
        }
        alarmOsc.disconnect();
        alarmGain.disconnect();
        alarmOsc = null;
        alarmGain = null;
      }
    },
  };
}
