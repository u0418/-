/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  // Try to resume if suspended (standard browser security restriction)
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Synthesizes a beautiful mechanised camera shutter "click-clack" sound.
 * Consists of:
 * 1. Mirror Slap: Low frequency thunk.
 * 2. Opening Curtain: High frequency white noise burst.
 * 3. Closing Curtain: A secondary high frequency burst ~85ms later.
 */
export function playShutterSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // --- 1. MIRROR SLAP (Low-frequency thunk) ---
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(140, now);
  // Pitch sweep down quickly
  osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

  oscGain.gain.setValueAtTime(0.6, now);
  oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.09);

  // --- 2. SHUTTER CURTAIN NOISE (High-frequency click & friction) ---
  // Generate 0.2 seconds of white noise
  const bufferSize = ctx.sampleRate * 0.2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  // Helper to trigger a curtain noise burst
  const playCurtainBurst = (delay: number) => {
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    // Highpass/Bandpass filter to make it metallic/papery
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3800, now + delay);
    filter.Q.setValueAtTime(4.0, now + delay);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0, now + delay);
    noiseGain.gain.linearRampToValueAtTime(0.28, now + delay + 0.005);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.025);

    noiseNode.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noiseNode.start(now + delay);
    noiseNode.stop(now + delay + 0.04);
  };

  // Trigger Curtain 1 (Open shutter) immediately
  playCurtainBurst(0);

  // Trigger Curtain 2 (Close shutter) ~75ms later
  playCurtainBurst(0.075);
}

/**
 * Play a light "focus chime/beep" representing automatic focal locks.
 */
export function playFocusConfirmSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1250, now);
  // Short double-beep
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
  gain.gain.setValueAtTime(0, now + 0.08);
  
  // Second beep
  const secondBeep = now + 0.12;
  osc.frequency.setValueAtTime(1250, secondBeep);
  gain.gain.setValueAtTime(0, secondBeep);
  gain.gain.linearRampToValueAtTime(0.08, secondBeep + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, secondBeep + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.35);
}
export function playClickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.05);
}

// ── PROCEDURAL NATURALIST BACKGROUND MUSIC ENGINES ──
let windNoiseNode: AudioBufferSourceNode | null = null;
let windGain: GainNode | null = null;
let masterBgmGain: GainNode | null = null;
let chimeTimer: any = null;
let ambientTimer: any = null;
let isBgmCurrentlyPlaying = false;

// Custom MP3 Audio Playback Variables
let customAudioElement: HTMLAudioElement | null = null;
let customBgmUrl: string | null = null;

export function setCustomBgmUrl(url: string | null) {
  customBgmUrl = url;
  if (isBgmCurrentlyPlaying) {
    // Smoothly transition tracks
    stopBgm();
    setTimeout(() => {
      startBgm();
    }, 1600);
  }
}

export function getCustomBgmUrl(): string | null {
  return customBgmUrl;
}

// Calming mountain horizon scale chords (G Major Pentatonic / spacious open voids)
const CALM_CHORDS = [
  [146.83, 220.00, 293.66, 440.00], // D3, A3, D4, A4 (D Spacious Fifth)
  [196.00, 246.94, 293.66, 392.00], // G3, B3, D4, G4 (G Major Warm Cedar)
  [220.00, 261.63, 329.63, 440.00], // A3, C4, E4, A4 (A minor Autumn Wind)
  [164.81, 246.94, 329.63, 493.88], // E3, B3, E4, B4 (E minor Deep Forest)
  [261.63, 329.63, 392.00, 523.25], // C4, E4, G4, C5 (C Major Cloud Mist)
];

// Higher bell-chime tones pool
const CHIME_PITCHES = [
  392.00, 440.00, 493.88, 587.33, 659.25, // G4, A4, B4, D5, E5
  783.99, 880.00, 987.77, 1174.66 // G5, A5, B5, D6
];

export function startBgm() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (isBgmCurrentlyPlaying) {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return;
  }

  isBgmCurrentlyPlaying = true;
  const now = ctx.currentTime;

  // 1. Create a Master Gain Node to adjust background music level
  masterBgmGain = ctx.createGain();
  masterBgmGain.gain.setValueAtTime(0, now);
  // Soft fade in of the entire music track over 2.0 seconds
  masterBgmGain.gain.linearRampToValueAtTime(0.40, now + 2.0);
  masterBgmGain.connect(ctx.destination);

  // 1b. If custom MP3 URL is provided, stream it with Web Audio connectivity
  if (customBgmUrl) {
    try {
      customAudioElement = new Audio(customBgmUrl);
      customAudioElement.loop = true;
      // CrossOrigin standard to bypass CORS restrictions if external URL is provided
      customAudioElement.crossOrigin = "anonymous";
      
      const sourceNode = ctx.createMediaElementSource(customAudioElement);
      sourceNode.connect(masterBgmGain);
      
      customAudioElement.play().catch(err => {
        console.warn("Audio element autoplay rejected, waiting for user interactions:", err);
      });
      return; // Skip the procedural woodland weather synth
    } catch (e) {
      console.warn("Could not route custom Audio element, fallback to procedural ambient synthesis:", e);
    }
  }

  // 2. Generate procedural forest canopy breeze (browning filtered white noise)
  try {
    const bufferSize = ctx.sampleRate * 4.0; // 4 second loop
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Filter out high hiss frequencies for a deeper hollow wooden gust
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Compensate amplitude
    }

    windNoiseNode = ctx.createBufferSource();
    windNoiseNode.buffer = buffer;
    windNoiseNode.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.setValueAtTime(140, now);
    windFilter.Q.setValueAtTime(1.5, now);

    windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.012, now);

    windNoiseNode.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(masterBgmGain);

    windNoiseNode.start(now);

    // Continuous breeze speed sway modulator (every 3 seconds)
    let windTime = 0;
    const modulateWind = () => {
      if (!isBgmCurrentlyPlaying || !windFilter || !windGain || !ctx) return;
      const cTime = ctx.currentTime;
      const gust = Math.sin(windTime / 4.0) * 0.5 + 0.5; // 0.0 to 1.0
      
      // Filter sweep between 110Hz (calm deep air) and 260Hz (woodland whistle)
      windFilter.frequency.exponentialRampToValueAtTime(110 + gust * 150, cTime + 3.0);
      // Volume oscillation keeping it extremely soft and unobtrusive
      windGain.gain.linearRampToValueAtTime(0.006 + gust * 0.016, cTime + 3.0);
      
      windTime += 3;
      ambientTimer = setTimeout(modulateWind, 3000);
    };
    modulateWind();
  } catch (err) {
    console.warn("Could not start procedural woodland wind generator", err);
  }

  // Play a beautiful, resonating forest chime note
  const playAmbientChime = (freq: number, amplitude: number, startTime: number) => {
    if (!ctx || !masterBgmGain) return;

    const chimeOsc = ctx.createOscillator();
    const chimeOvertone = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    const chimeFilter = ctx.createBiquadFilter();

    // Soft cozy woodbar vibe lowpass
    chimeFilter.type = 'lowpass';
    chimeFilter.frequency.setValueAtTime(750, startTime);

    chimeOsc.type = 'triangle';
    chimeOsc.frequency.setValueAtTime(freq, startTime);

    // Warm third-harmonic overtone (1 octave + 5th) at a very low level for bell-like magic
    chimeOvertone.type = 'sine';
    chimeOvertone.frequency.setValueAtTime(freq * 3, startTime);

    chimeGain.gain.setValueAtTime(0, startTime);
    const attack = 0.8 + Math.random() * 0.8;
    chimeGain.gain.linearRampToValueAtTime(amplitude, startTime + attack);
    
    const decay = 4.5 + Math.random() * 2.0;
    chimeGain.gain.setValueAtTime(amplitude, startTime + attack + 0.3);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, startTime + attack + 0.3 + decay);

    chimeOsc.connect(chimeFilter);
    chimeOvertone.connect(chimeGain);

    const overtoneGainNode = ctx.createGain();
    overtoneGainNode.gain.setValueAtTime(amplitude * 0.07, startTime);
    chimeOvertone.connect(overtoneGainNode);
    overtoneGainNode.connect(chimeFilter);

    chimeFilter.connect(chimeGain);
    chimeGain.connect(masterBgmGain);

    chimeOsc.start(startTime);
    chimeOvertone.start(startTime);

    chimeOsc.stop(startTime + attack + 0.3 + decay + 0.5);
    chimeOvertone.stop(startTime + attack + 0.3 + decay + 0.5);
  };

  // Tiny distant bird call scheduler
  const playDistantChirp = (startTime: number) => {
    if (!ctx || !masterBgmGain) return;
    const chirpOsc = ctx.createOscillator();
    const chirpGain = ctx.createGain();

    chirpOsc.type = 'sine';
    const sweepDuration = 0.09;

    // Twin chirrup sequence
    chirpOsc.frequency.setValueAtTime(2200, startTime);
    chirpOsc.frequency.exponentialRampToValueAtTime(2650, startTime + sweepDuration);
    chirpGain.gain.setValueAtTime(0, startTime);
    chirpGain.gain.linearRampToValueAtTime(0.005, startTime + 0.015);
    chirpGain.gain.exponentialRampToValueAtTime(0.0001, startTime + sweepDuration);

    const t2 = startTime + 0.14;
    chirpOsc.frequency.setValueAtTime(2350, t2);
    chirpOsc.frequency.exponentialRampToValueAtTime(2900, t2 + sweepDuration);
    chirpGain.gain.setValueAtTime(0, t2);
    chirpGain.gain.linearRampToValueAtTime(0.004, t2 + 0.015);
    chirpGain.gain.exponentialRampToValueAtTime(0.0001, t2 + sweepDuration);

    chirpOsc.connect(chirpGain);
    chirpGain.connect(masterBgmGain);

    chirpOsc.start(startTime);
    chirpOsc.stop(startTime + 0.4);
  };

  // Continuous music scheduler loops (8 seconds block phrases)
  const playNextPhrase = () => {
    if (!isBgmCurrentlyPlaying || !ctx || customBgmUrl) return;
    const phraseTime = ctx.currentTime;

    // A. Cozy mountain wind/leaf pad chord
    const chordIndex = Math.floor(Math.random() * CALM_CHORDS.length);
    const chord = CALM_CHORDS[chordIndex];
    chord.forEach((freq, idx) => {
      const amp = 0.016 - (idx * 0.0018);
      playAmbientChime(freq, Math.max(0.006, amp), phraseTime + (idx * 0.16));
    });

    // B. Twin windbell chime accents
    const chimeCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < chimeCount; i++) {
      const chimeFreq = CHIME_PITCHES[Math.floor(Math.random() * CHIME_PITCHES.length)];
      const delay = 1.2 + Math.random() * 5.2;
      playAmbientChime(chimeFreq, 0.004, phraseTime + delay);
    }

    // C. 45% chance of distant cute mountain chirps
    if (Math.random() < 0.45) {
      const birdDelay = 2.0 + Math.random() * 4.0;
      playDistantChirp(phraseTime + birdDelay);
    }

    chimeTimer = setTimeout(playNextPhrase, 8000);
  };

  playNextPhrase();
}

export function stopBgm() {
  isBgmCurrentlyPlaying = false;

  if (chimeTimer) {
    clearTimeout(chimeTimer);
    chimeTimer = null;
  }
  if (ambientTimer) {
    clearTimeout(ambientTimer);
    ambientTimer = null;
  }

  if (customAudioElement) {
    try {
      customAudioElement.pause();
      customAudioElement = null;
    } catch (e) {}
  }

  try {
    const ctx = getAudioContext();
    if (ctx && masterBgmGain) {
      const now = ctx.currentTime;
      masterBgmGain.gain.setValueAtTime(masterBgmGain.gain.value, now);
      // Luxurious 1.5 seconds smooth fadeout
      masterBgmGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

      setTimeout(() => {
        if (windNoiseNode) {
          try { windNoiseNode.stop(); } catch (err) {}
          windNoiseNode = null;
        }
        if (masterBgmGain) {
          masterBgmGain.disconnect();
          masterBgmGain = null;
        }
      }, 1600);
    }
  } catch (e) {
    console.error("Error stopping procedural BGM context node", e);
  }
}

/**
 * Synthesizes a beautiful real-time procedural endemic bird song call.
 * Using frequency sweeps, vibrato oscillators & amplitude envelope shaping.
 */
export function playBirdSound(birdId: number) {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume Web Audio Context if suspended by browser autoplay policy
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;

  // Helper inside to perform uniform frequency sweep chirps
  const playChirpSweep = (startFreq: number, endFreq: number, duration: number, delayMs: number, volume = 0.1) => {
    const playbackTime = now + (delayMs / 1000);
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, playbackTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, playbackTime + duration);

    gainNode.gain.setValueAtTime(0, playbackTime);
    gainNode.gain.linearRampToValueAtTime(volume, playbackTime + 0.008);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, playbackTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(playbackTime);
    osc.stop(playbackTime + duration + 0.04);
  };

  // Helper inside to play warbling/vibrato chirps using frequency modulation (FM) synthesis
  const playVibratoChirp = (baseFreq: number, modFreq: number, depth: number, duration: number, delayMs: number, volume = 0.1) => {
    const playbackTime = now + (delayMs / 1000);
    const osc = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, playbackTime);

    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(modFreq, playbackTime);
    modGain.gain.setValueAtTime(depth, playbackTime);

    gainNode.gain.setValueAtTime(0, playbackTime);
    gainNode.gain.linearRampToValueAtTime(volume, playbackTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, playbackTime + duration);

    modulator.connect(modGain);
    modGain.connect(osc.frequency);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    modulator.start(playbackTime);
    osc.start(playbackTime);

    modulator.stop(playbackTime + duration);
    osc.stop(playbackTime + duration + 0.04);
  };

  // Dynamic sound design profile adjusted exactly based on Formosan species taxonomy
  switch (birdId) {
    case 1: // 台灣藍鵲 (Taiwan Blue Magpie) - Loud metallic chatter "pichak-chak-chak"
      playChirpSweep(1250, 1850, 0.09, 0, 0.15);
      playChirpSweep(1350, 1900, 0.08, 110, 0.15);
      playChirpSweep(1200, 1750, 0.09, 220, 0.15);
      break;

    case 2: // 黑長尾雉 / 帝雉 (Mikado Pheasant) - High thin whistles & subtle clucks
      playChirpSweep(3450, 3650, 0.26, 0, 0.08); // High thin whistle
      playChirpSweep(180, 110, 0.04, 320, 0.16);  // Soft cluck 1
      playChirpSweep(170, 100, 0.04, 400, 0.16);  // Soft cluck 2
      break;

    case 3: // 藍腹鷴 (Swinhoe's Pheasant) - Low elusive alert coos & quick whistles
      playChirpSweep(1650, 1900, 0.22, 0, 0.09);
      playChirpSweep(170, 130, 0.05, 260, 0.15);
      break;

    case 4: // 火冠戴菊 (Taiwan Flamecrest) - Extremely high frequency canopy needle ticks
      for (let i = 0; i < 7; i++) {
        playChirpSweep(5100, 5800, 0.03, i * 45, 0.05); // High rapid needle ticks
      }
      break;

    case 5: // 栗背林鴝 (Collared Bush Robin) - Authentic stone-knocking "tick-tick-tick" sound
      playChirpSweep(1450, 1050, 0.012, 0, 0.22);
      playChirpSweep(1450, 1050, 0.012, 140, 0.22);
      playChirpSweep(1450, 1050, 0.012, 280, 0.22);
      break;

    case 6: // 台灣噪眉 / 金翼白眉 (White-whiskered Laughingthrush) - Ringing flutey laughter trills
      playChirpSweep(1600, 2050, 0.13, 0, 0.15);
      playChirpSweep(2050, 1750, 0.11, 150, 0.15);
      playChirpSweep(1750, 2250, 0.17, 275, 0.18);
      break;

    case 7: // 冠羽畫眉 (Taiwan Yuhina) - Distinctive, musical "To-meet-you!" whistle sequence
      playChirpSweep(1700, 1850, 0.075, 0, 0.12);      // "To"
      playChirpSweep(2500, 2650, 0.11, 95, 0.14);       // "meet"
      playChirpSweep(2250, 1980, 0.14, 215, 0.12);      // "you"
      break;

    case 8: // 藪鳥 (Steere's Liocichla) - Loud ringing "急救、急救" (Ji-jiu! Ji-jiu!) alarm whistles
      // First "Ji-jiu"
      playChirpSweep(1950, 2550, 0.075, 0, 0.14);
      playChirpSweep(2550, 2150, 0.11, 85, 0.14);
      // Second "Ji-jiu"
      playChirpSweep(1950, 2550, 0.075, 230, 0.14);
      playChirpSweep(2550, 2150, 0.11, 315, 0.14);
      break;

    case 9: // 白耳畫眉 (White-eared Sibia) - Rhythmic long liquid sliding flute whistle "fee-fee-ur-r-it"
      playChirpSweep(2150, 2650, 0.14, 0, 0.15);
      playChirpSweep(2650, 2420, 0.09, 145, 0.15);
      playChirpSweep(2420, 3150, 0.22, 250, 0.18);
      break;

    case 10: // 台灣擬啄木 / 五色鳥 (Taiwan Barbet) - Deep woody rhythmic monk drum clicks ("krog-krog-krog")
      playChirpSweep(345, 275, 0.038, 0, 0.38);
      playChirpSweep(345, 275, 0.038, 90, 0.38);
      playChirpSweep(345, 275, 0.038, 180, 0.38);
      playChirpSweep(345, 275, 0.038, 270, 0.38);
      playChirpSweep(345, 275, 0.038, 360, 0.38);
      break;

    case 11: // 台灣朱雀 (Taiwan Rosefinch) - Gentle rose double-note pips
      playChirpSweep(2180, 2480, 0.07, 0, 0.11);
      playChirpSweep(2380, 2680, 0.07, 110, 0.11);
      break;

    case 12: // 台灣畫眉 / 無印畫眉 (Taiwan Laughingthrush) - Master forest singer trills & complex song loops
      playVibratoChirp(2050, 15, 180, 0.25, 0, 0.14);
      playVibratoChirp(2380, 19, 210, 0.21, 275, 0.14);
      playChirpSweep(2150, 2950, 0.14, 490, 0.15);
      break;

    case 13: // 黃山雀 (Yellow Tit) - High bell-like "tsi-tsi-be... tsi-tsi-be" swing
      playChirpSweep(2950, 3250, 0.075, 0, 0.12);
      playChirpSweep(3250, 2650, 0.075, 90, 0.12);
      playChirpSweep(2950, 3250, 0.075, 230, 0.12);
      playChirpSweep(3250, 2650, 0.075, 320, 0.12);
      break;

    case 14: // 烏頭翁 (Styan's Bulbul) - Extroverted sweet bubbling song "巧克力、巧克力" (qiao-ke-li)
      playChirpSweep(1950, 2300, 0.07, 0, 0.14);       // "Qiao"
      playChirpSweep(1700, 1900, 0.05, 80, 0.14);       // "ke"
      playChirpSweep(2450, 2150, 0.10, 135, 0.16);      // "li"
      break;

    case 15: // 台灣小鶯 (Taiwan Bush Warbler) - Long sliding high-tension whistle, then explosive finish!
      playChirpSweep(2550, 2565, 0.38, 0, 0.07);       // Long tension whistle
      playChirpSweep(2150, 3450, 0.11, 460, 0.18);      // Explosive "wee-chi!"
      playChirpSweep(3450, 2850, 0.11, 570, 0.15);
      break;

    case 16: // 赤腹山雀 (Chestnut-bellied Tit) - Buzzing, vibrating high alarm check "zi-zi-zi"
      playVibratoChirp(3850, 155, 550, 0.075, 0, 0.14);
      playVibratoChirp(3850, 155, 550, 0.075, 100, 0.14);
      playVibratoChirp(3850, 155, 550, 0.075, 200, 0.14);
      break;

    case 17: // 台灣竹雞 (Taiwan Bamboo Partridge) - Screaming, incredibly loud "雞狗乖" (ji-gou-guai)
      playChirpSweep(1450, 2450, 0.11, 0, 0.22);       // "Ji"
      playChirpSweep(920, 1150, 0.08, 125, 0.18);       // "gou"
      playChirpSweep(2250, 1550, 0.17, 205, 0.24);      // "guai"
      break;

    case 18: // 台灣紫嘯鶇 (Formosan Whistling Thrush) - Loud metallic train-brake screech & valley whistles
      playVibratoChirp(3450, 45, 900, 0.35, 0, 0.25);   // Brake squeal
      playChirpSweep(2650, 2850, 0.11, 430, 0.12);      // Sweet whistle echo 1
      playChirpSweep(2850, 2400, 0.13, 555, 0.12);      // Sweet whistle echo 2
      break;

    case 19: // 台灣山鷓鴣 (Taiwan Partridge) - Resonant hollow mountain continuous whistle loops
      playChirpSweep(715, 735, 0.23, 0, 0.22);
      playChirpSweep(715, 735, 0.23, 440, 0.22);
      break;

    case 20: // 大冠鷲 (Crested Serpent Eagle) - Famous high sweeping, soaring sentinel call "忽喲──"
      playChirpSweep(1580, 2150, 0.12, 0, 0.16);
      playChirpSweep(2780, 3150, 0.42, 130, 0.22);
      break;

    case 21: // 鵂鶓 (Collared Pygmy Owl) - Hollow flutey woodland spaced whistles "hoop... hoop..."
      playChirpSweep(765, 785, 0.14, 0, 0.26);
      playChirpSweep(765, 785, 0.14, 520, 0.26);
      break;

    case 22: // 小剪尾 (Little Forktail) - Stream insect-like thin high whistles
      playChirpSweep(4150, 4650, 0.17, 0, 0.14);
      break;

    case 23: // 褐鷽 (Brown Bullfinch) - Elegant thin mountain whistle "hu..."
      playChirpSweep(1520, 1570, 0.19, 0, 0.12);
      break;

    case 24: // 灰喉山椒鳥 (Gray-chinned Minivet) - Rhythmic sparkling flock sweeps "jiu, jiu, jiu"
      playChirpSweep(2950, 2350, 0.075, 0, 0.14);
      playChirpSweep(2950, 2350, 0.075, 95, 0.14);
      playChirpSweep(2950, 2350, 0.075, 190, 0.14);
      break;

    case 25: // 台灣翠鳥 (Common Kingfisher) - Sudden flight launch sharp clicks
      playChirpSweep(4350, 4850, 0.04, 0, 0.18);
      playChirpSweep(4650, 4150, 0.04, 65, 0.18);
      break;

    case 26: // 茶腹鳾 (Eurasian Nuthatch) - Fast tree-trunk scaling metallic pips
      playChirpSweep(2550, 2750, 0.055, 0, 0.15);
      playChirpSweep(2550, 2750, 0.055, 80, 0.15);
      playChirpSweep(2550, 2750, 0.055, 160, 0.15);
      break;

    case 27: // 青背山雀 (Green-backed Tit) - Quick lively "吉吉百──吉吉百──" whistle oscillations
      playChirpSweep(2750, 3150, 0.075, 0, 0.12);
      playChirpSweep(3150, 2550, 0.075, 90, 0.12);
      playChirpSweep(2750, 3150, 0.075, 210, 0.12);
      playChirpSweep(3150, 2550, 0.075, 300, 0.12);
      break;

    case 28: // 黃腹琉璃 (Vivid Niltava) - High insectivorous flycatcher whistling pips
      playChirpSweep(2250, 2650, 0.11, 0, 0.15);
      playChirpSweep(2450, 2150, 0.11, 140, 0.12);
      break;

    case 29: // 白頭鶇 (Island Thrush) - Flutey, beautiful mountain thrush call melody
      playVibratoChirp(1650, 9, 125, 0.21, 0, 0.14);
      playChirpSweep(1850, 2250, 0.14, 240, 0.14);
      break;

    case 30: // 綠畫眉 (White-bellied Erpornis) - Tiny grass warble chirp
      playChirpSweep(3255, 3655, 0.055, 0, 0.12);
      playChirpSweep(3655, 3255, 0.055, 75, 0.12);
      break;

    case 31: // 台灣畫眉 (Taiwan Laughingthrush) - Beautiful, highly complex whistles & mimicry trills
      playVibratoChirp(2150, 14, 175, 0.23, 0, 0.14);
      playChirpSweep(2250, 2850, 0.12, 250, 0.12);
      break;

    case 32: // 八色鳥 / 仙八色鶇 (Fairy Pitta) - Celebrated clear dual-toned whistles "twit-wit"
      playChirpSweep(2250, 2950, 0.10, 0, 0.16);       // "twit"
      playChirpSweep(2950, 2400, 0.15, 130, 0.18);     // "wit"
      break;

    default: // Generic sweet wild woodland songbird vocalization double-pip
      playChirpSweep(2150, 2550, 0.08, 0, 0.12);
      playChirpSweep(2350, 2750, 0.08, 120, 0.12);
  }
}

