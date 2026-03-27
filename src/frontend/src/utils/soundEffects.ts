// Number words for TTS (1-90)
const NUMBER_WORDS: Record<number, string> = {
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
  11: "eleven",
  12: "twelve",
  13: "thirteen",
  14: "fourteen",
  15: "fifteen",
  16: "sixteen",
  17: "seventeen",
  18: "eighteen",
  19: "nineteen",
  20: "twenty",
  21: "twenty one",
  22: "twenty two",
  23: "twenty three",
  24: "twenty four",
  25: "twenty five",
  26: "twenty six",
  27: "twenty seven",
  28: "twenty eight",
  29: "twenty nine",
  30: "thirty",
  31: "thirty one",
  32: "thirty two",
  33: "thirty three",
  34: "thirty four",
  35: "thirty five",
  36: "thirty six",
  37: "thirty seven",
  38: "thirty eight",
  39: "thirty nine",
  40: "forty",
  41: "forty one",
  42: "forty two",
  43: "forty three",
  44: "forty four",
  45: "forty five",
  46: "forty six",
  47: "forty seven",
  48: "forty eight",
  49: "forty nine",
  50: "fifty",
  51: "fifty one",
  52: "fifty two",
  53: "fifty three",
  54: "fifty four",
  55: "fifty five",
  56: "fifty six",
  57: "fifty seven",
  58: "fifty eight",
  59: "fifty nine",
  60: "sixty",
  61: "sixty one",
  62: "sixty two",
  63: "sixty three",
  64: "sixty four",
  65: "sixty five",
  66: "sixty six",
  67: "sixty seven",
  68: "sixty eight",
  69: "sixty nine",
  70: "seventy",
  71: "seventy one",
  72: "seventy two",
  73: "seventy three",
  74: "seventy four",
  75: "seventy five",
  76: "seventy six",
  77: "seventy seven",
  78: "seventy eight",
  79: "seventy nine",
  80: "eighty",
  81: "eighty one",
  82: "eighty two",
  83: "eighty three",
  84: "eighty four",
  85: "eighty five",
  86: "eighty six",
  87: "eighty seven",
  88: "eighty eight",
  89: "eighty nine",
  90: "ninety",
};

// Single digit words for building "X and Y" format
const DIGIT_WORDS: Record<number, string> = {
  0: "zero",
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
};

// Classic Tambola event phrases for special numbers
const EVENT_PHRASES: Record<number, string> = {
  1: "Kelly's eye",
  7: "Lucky seven",
  11: "Legs eleven",
  21: "Key of the door",
  22: "Two little ducks",
  33: "Dirty Gertie",
  44: "Droopy drawers",
  55: "Snakes alive",
  66: "Clickety click",
  77: "Sunset strip",
  88: "Two fat ladies",
  90: "Top of the shop",
};

/**
 * Get male voices from the device.
 * Returns voices with keywords like "male", "david", "mark", or deep/male-sounding names.
 * Falls back to any English voice if none found.
 */
export function getMaleVoices(): SpeechSynthesisVoice[] {
  const all = window.speechSynthesis?.getVoices() ?? [];
  const males = all.filter((v) =>
    /male|david|mark|james|google uk english male/i.test(v.name),
  );
  return males.length > 0 ? males : all.filter((v) => /en/i.test(v.lang));
}

/**
 * Get female voices from the device.
 * Returns voices with keywords like "female", "zira", "samantha", or female-sounding names.
 * Falls back to any English voice if none found.
 */
export function getFemaleVoices(): SpeechSynthesisVoice[] {
  const all = window.speechSynthesis?.getVoices() ?? [];
  const females = all.filter((v) =>
    /female|zira|samantha|victoria|karen|moira|fiona|google uk english female/i.test(
      v.name,
    ),
  );
  return females.length > 0 ? females : all.filter((v) => /en/i.test(v.lang));
}

/** Return ALL available voices so admin can see every option */
export function getAllVoices(): SpeechSynthesisVoice[] {
  if (!window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}

export function playCallSound() {
  try {
    const ctx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    [523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.connect(gain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    });
  } catch {}
}

/**
 * Build the speech phrase for a number.
 * - Single digit (1-9): "Single number, seven"
 * - Two digit (10-90): "five and seven, fifty seven"
 * - Special event numbers get a classic Tambola phrase prepended.
 */
function buildNumberPhrase(num: number): string {
  const fullWord = NUMBER_WORDS[num] ?? `${num}`;
  const eventPhrase = EVENT_PHRASES[num];

  let core: string;
  if (num >= 1 && num <= 9) {
    core = `Single number, ${fullWord}`;
  } else {
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    const tensWord = DIGIT_WORDS[tens];
    const onesWord = DIGIT_WORDS[ones];
    core = `${tensWord} and ${onesWord}, ${fullWord}`;
  }

  if (eventPhrase) {
    return `${eventPhrase}, ${core}`;
  }
  return core;
}

/**
 * Speak a called number.
 * voiceMode: 'male' | 'female' (default: 'male')
 * Format: "five and seven, fifty seven" or "Single number, seven"
 * Event numbers get a classic Tambola phrase first.
 * onEnd is called when speech finishes.
 */
export function speakNumber(
  num: number,
  voiceName?: string,
  voiceMode?: string,
  onEnd?: () => void,
) {
  try {
    if (!window.speechSynthesis) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();

    const phrase = buildNumberPhrase(num);

    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.volume = 1.0;
    utterance.pitch = 1.0;
    utterance.rate = 0.9;
    utterance.lang = "en";

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    // Pick voice based on mode
    const all = window.speechSynthesis.getVoices();
    let voice: SpeechSynthesisVoice | null = null;

    if (voiceName) {
      voice = all.find((v) => v.name === voiceName) ?? null;
    }

    if (!voice) {
      if (voiceMode === "female") {
        const females = getFemaleVoices();
        voice = females[0] ?? null;
      } else {
        // default: male
        const males = getMaleVoices();
        voice = males[0] ?? null;
      }
    }

    if (voice) utterance.voice = voice;

    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 350);
  } catch {
    onEnd?.();
  }
}

export function speakWinner(
  prize: string,
  playerName: string,
  ticketId: number,
  voiceName?: string,
) {
  try {
    if (!window.speechSynthesis) return;
    const text = `Congratulations! ${prize} winner is ${playerName} on ticket number ${ticketId}`;
    const utterance = new SpeechSynthesisUtterance(text);
    const all = window.speechSynthesis.getVoices();
    const voice = voiceName
      ? (all.find((v) => v.name === voiceName) ?? null)
      : null;
    if (voice) utterance.voice = voice;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 800);
  } catch {}
}

export function playWinnerSound() {
  try {
    const ctx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const freqs = [523, 659, 784, 1047];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + i * 0.15 + 0.4,
      );
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });
  } catch {}
}
