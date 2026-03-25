// Classic Tambola phrases - kept for well-known numbers, plain for rest
export const TAMBOLA_CALLS: Record<number, string> = {
  1: "Single number, one",
  2: "Single number, two",
  3: "Single number, three",
  4: "Single number, four",
  5: "Single number, five",
  6: "Single number, six",
  7: "Single number, seven",
  8: "Single number, eight",
  9: "Single number, nine",
  10: "Number ten",
  11: "Legs eleven, eleven",
  12: "One dozen, twelve",
  13: "Unlucky for some, thirteen",
  14: "Valentine's Day, fourteen",
  15: "Number fifteen",
  16: "Sweet sixteen",
  17: "Dancing queen, seventeen",
  18: "Coming of age, eighteen",
  19: "Number nineteen",
  20: "Number twenty",
  21: "Key of the door, twenty one",
  22: "Two little ducks, twenty two",
  23: "Number twenty three",
  24: "Two dozen, twenty four",
  25: "Number twenty five",
  26: "Pick and mix, twenty six",
  27: "Number twenty seven",
  28: "Number twenty eight",
  29: "Number twenty nine",
  30: "Number thirty",
  31: "Number thirty one",
  32: "Number thirty two",
  33: "Number thirty three",
  34: "Number thirty four",
  35: "Number thirty five",
  36: "Three dozen, thirty six",
  37: "Number thirty seven",
  38: "Number thirty eight",
  39: "Number thirty nine",
  40: "Number forty",
  41: "Number forty one",
  42: "Number forty two",
  43: "Number forty three",
  44: "Droopy drawers, forty four",
  45: "Halfway there, forty five",
  46: "Number forty six",
  47: "Number forty seven",
  48: "Four dozen, forty eight",
  49: "Number forty nine",
  50: "Half a century, fifty",
  51: "Number fifty one",
  52: "Number fifty two",
  53: "Number fifty three",
  54: "Number fifty four",
  55: "Snakes alive, fifty five",
  56: "Number fifty six",
  57: "Heinz varieties, fifty seven",
  58: "Number fifty eight",
  59: "Number fifty nine",
  60: "Five dozen, sixty",
  61: "Number sixty one",
  62: "Number sixty two",
  63: "Tickle me, sixty three",
  64: "Number sixty four",
  65: "Old age pension, sixty five",
  66: "Clickety click, sixty six",
  67: "Number sixty seven",
  68: "Number sixty eight",
  69: "Either way, sixty nine",
  70: "Three score and ten, seventy",
  71: "Number seventy one",
  72: "Six dozen, seventy two",
  73: "Number seventy three",
  74: "Number seventy four",
  75: "Number seventy five",
  76: "Trombones, seventy six",
  77: "Two little crutches, seventy seven",
  78: "Number seventy eight",
  79: "Number seventy nine",
  80: "Number eighty",
  81: "Number eighty one",
  82: "Number eighty two",
  83: "Number eighty three",
  84: "Seven dozen, eighty four",
  85: "Number eighty five",
  86: "Number eighty six",
  87: "Number eighty seven",
  88: "Two fat ladies, eighty eight",
  89: "Nearly there, eighty nine",
  90: "Top of the shop, ninety",
};

function getVoiceByName(name: string): SpeechSynthesisVoice | null {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.name === name) ?? null;
}

function pickBestVoice(): SpeechSynthesisVoice | null {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const priority = [
    (v: SpeechSynthesisVoice) => /google.*english/i.test(v.name),
    (v: SpeechSynthesisVoice) => /google/i.test(v.name) && /en/i.test(v.lang),
    (v: SpeechSynthesisVoice) =>
      /microsoft.*natural/i.test(v.name) && /en/i.test(v.lang),
    (v: SpeechSynthesisVoice) =>
      /microsoft/i.test(v.name) && /en/i.test(v.lang),
    (v: SpeechSynthesisVoice) =>
      /en-GB/i.test(v.lang) && !/espeak/i.test(v.name),
    (v: SpeechSynthesisVoice) =>
      /en-IN/i.test(v.lang) && !/espeak/i.test(v.name),
    (v: SpeechSynthesisVoice) =>
      /en-US/i.test(v.lang) && !/espeak/i.test(v.name),
    (v: SpeechSynthesisVoice) => /en/i.test(v.lang),
  ];
  for (const test of priority) {
    const match = voices.find(test);
    if (match) return match;
  }
  return voices[0];
}

export function getAllVoices(): SpeechSynthesisVoice[] {
  if (!window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices().filter((v) => /en/i.test(v.lang));
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

// Small variation pool so consecutive calls feel different
const VOICE_VARIATIONS = [
  { rate: 0.8, pitch: 1.0 },
  { rate: 0.82, pitch: 1.05 },
  { rate: 0.78, pitch: 0.95 },
  { rate: 0.85, pitch: 1.1 },
  { rate: 0.76, pitch: 1.0 },
  { rate: 0.83, pitch: 0.9 },
  { rate: 0.79, pitch: 1.08 },
  { rate: 0.86, pitch: 0.97 },
];
let variationIndex = 0;

export function speakNumber(num: number, voiceName?: string) {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const phrase = TAMBOLA_CALLS[num] ?? `Single number, ${num}`;
    const utterance = new SpeechSynthesisUtterance(phrase);

    const voice =
      (voiceName ? getVoiceByName(voiceName) : null) ?? pickBestVoice();
    if (voice) utterance.voice = voice;

    // Rotate through variations so each call sounds slightly different
    const v = VOICE_VARIATIONS[variationIndex % VOICE_VARIATIONS.length];
    variationIndex++;
    utterance.rate = v.rate;
    utterance.pitch = v.pitch;
    utterance.volume = 1.0;

    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 350);
  } catch {}
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
    const voice =
      (voiceName ? getVoiceByName(voiceName) : null) ?? pickBestVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = 0.85;
    utterance.pitch = 1.1;
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
