export const TAMBOLA_CALLS: Record<number, string> = {
  1: "Kelly's Eye",
  2: "One Little Duck",
  3: "Cup of Tea",
  4: "Knock at the Door",
  5: "Man Alive",
  6: "Half a Dozen",
  7: "Lucky Seven",
  8: "One Fat Lady",
  9: "Doctor's Orders",
  10: "Downing Street",
  11: "Legs Eleven",
  12: "One Dozen",
  13: "Unlucky for Some",
  14: "Valentine's Day",
  15: "Young and Keen",
  16: "Sweet Sixteen",
  17: "Dancing Queen",
  18: "Coming of Age",
  19: "Goodbye Teens",
  20: "One Score",
  21: "Key of the Door",
  22: "Two Little Ducks",
  23: "Thee and Me",
  24: "Two Dozen",
  25: "Duck and Dive",
  26: "Pick and Mix",
  27: "Gateway to Heaven",
  28: "In a State",
  29: "Rise and Shine",
  30: "Dirty Gertie",
  31: "Get Up and Run",
  32: "Buckle My Shoe",
  33: "Dirty Knee",
  34: "Ask for More",
  35: "Jump and Jive",
  36: "Three Dozen",
  37: "More than Eleven",
  38: "Christmas Cake",
  39: "Steps",
  40: "Naughty Forty",
  41: "Time for Fun",
  42: "Winnie the Pooh",
  43: "Down on Your Knees",
  44: "Droopy Drawers",
  45: "Halfway There",
  46: "Up to Tricks",
  47: "Four and Seven",
  48: "Four Dozen",
  49: "P.C.",
  50: "Half a Century",
  51: "Tweak of the Thumb",
  52: "Danny La Rue",
  53: "Stuck in the Tree",
  54: "Clean the Floor",
  55: "Snakes Alive",
  56: "Was She Worth It",
  57: "Heinz Varieties",
  58: "Make Them Wait",
  59: "Brighton Line",
  60: "Five Dozen",
  61: "Bakers Bun",
  62: "Turn the Screw",
  63: "Tickle Me",
  64: "Red Raw",
  65: "Old Age Pension",
  66: "Clickety Click",
  67: "Stairway to Heaven",
  68: "Saving Grace",
  69: "Either Way",
  70: "Three Score and Ten",
  71: "Bang on the Drum",
  72: "Six Dozen",
  73: "Queen Bee",
  74: "Hit the Floor",
  75: "Strive and Strive",
  76: "Trombones",
  77: "Sunset Strip",
  78: "Heaven's Gate",
  79: "One More Time",
  80: "Eight and Blank",
  81: "Stop and Run",
  82: "Straight On Through",
  83: "Time for Tea",
  84: "Seven Dozen",
  85: "Staying Alive",
  86: "Between the Sticks",
  87: "Torquay in Devon",
  88: "Two Fat Ladies",
  89: "Nearly There",
  90: "Top of the Shop",
};

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
