/**
 * Форма процедурного джаза — чистые данные, без Web Audio.
 *
 * 16 тактов гармонии, сыгранные дважды с разной аранжировкой (32 такта).
 * Все «случайные» решения — из генератора с зерном: форма стабильна всю
 * сессию и не меняется при переходах между разделами.
 */

/** mulberry32: маленький детерминированный генератор, 0 ≤ x < 1. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Chord = { root: number; tones: number[]; voicing: number[] };

/** Ночная гармония в до мажоре: ii–V–I, минорная субдоминанта, вторичные доминанты. */
const CHANGES: Chord[] = [
  { root: 38, tones: [38, 41, 45, 48], voicing: [53, 57, 60, 64] }, // Dm9
  { root: 43, tones: [43, 47, 50, 53], voicing: [53, 57, 59, 64] }, // G13
  { root: 36, tones: [36, 40, 43, 47], voicing: [52, 55, 59, 62] }, // Cmaj9
  { root: 45, tones: [45, 48, 52, 55], voicing: [55, 59, 60, 64] }, // Am9
  { root: 38, tones: [38, 41, 45, 48], voicing: [53, 57, 60, 64] }, // Dm9
  { root: 43, tones: [43, 47, 50, 53], voicing: [53, 56, 59, 63] }, // G7♭13
  { root: 40, tones: [40, 43, 47, 50], voicing: [50, 55, 59, 62] }, // Em7
  { root: 45, tones: [45, 49, 52, 55], voicing: [55, 58, 61, 64] }, // A7♭9
  { root: 41, tones: [41, 45, 48, 52], voicing: [52, 55, 57, 60] }, // Fmaj9
  { root: 41, tones: [41, 44, 48, 50], voicing: [50, 53, 56, 60] }, // Fm6
  { root: 40, tones: [40, 43, 47, 50], voicing: [50, 55, 59, 62] }, // Em9
  { root: 45, tones: [45, 49, 52, 55], voicing: [55, 58, 61, 64] }, // A7♭9
  { root: 38, tones: [38, 41, 45, 48], voicing: [53, 57, 60, 64] }, // Dm9
  { root: 43, tones: [43, 47, 50, 53], voicing: [53, 57, 59, 64] }, // G13
  { root: 36, tones: [36, 40, 43, 47], voicing: [52, 55, 59, 62] }, // Cmaj9
  { root: 36, tones: [36, 40, 43, 47], voicing: [52, 55, 59, 64] }, // Cmaj9 — выдох перед повтором
];

/** Ритмы аккордов: номера восьмых в такте (0–7). Пусто — такт без аккордов. */
const COMP_RHYTHMS = [[3, 6], [2], [5], [0], [3], [], [1, 6]];
/** До мажорная пентатоника — ложится на всю гармонию. */
const MELODY = [62, 64, 67, 69, 72, 74, 76];

export type Hit = { at: number; note: number; vel: number; len: number };

export interface Bar {
  chord: Chord;
  bass: Hit[];
  comp: Hit[];
  melody: Hit[];
  /** Щётки: 0 — тишина (брейк), 1 — обычно. */
  drums: number;
  /** Брейк: только долгий аккорд, без ритм-секции. */
  breakdown: boolean;
  /** Сдвиги восьмых в долях восьмой (±), для живого тайминга. */
  nudge: number[];
}

export const FORM_BARS = 32;

export function buildForm(seed: number): Bar[] {
  const rnd = seeded(seed);
  const pick = <T,>(list: T[]) => list[Math.floor(rnd() * list.length)];
  const vel = () => 0.8 + rnd() * 0.3;

  return Array.from({ length: FORM_BARS }, (_, index) => {
    const chord = CHANGES[index % CHANGES.length];
    const second = index >= CHANGES.length;
    // Последний такт каждой половины — брейк: вдох перед следующим кругом.
    const breakdown = index % CHANGES.length === CHANGES.length - 1;
    const nudge = Array.from({ length: 8 }, () => (rnd() - 0.5) * 0.06);

    if (breakdown) {
      return {
        chord,
        bass: [{ at: 0, note: chord.root, vel: 0.9, len: 8 }],
        comp: [{ at: 0, note: 0, vel: 0.9, len: 8 }],
        melody: [],
        drums: 0,
        breakdown,
        nudge,
      };
    }

    // Первая половина — «на два» (половинные), вторая чаще шагает четвертями.
    const walk = second ? rnd() < 0.7 : rnd() < 0.2;
    const bass: Hit[] = [];
    if (walk) {
      const approach = chord.root + (rnd() < 0.5 ? -1 : 1);
      [chord.tones[0], chord.tones[pick([1, 2])], chord.tones[2], approach].forEach((note, beat) =>
        bass.push({ at: beat * 2, note, vel: vel(), len: 2 }),
      );
    } else {
      bass.push({ at: 0, note: chord.root, vel: vel(), len: 4 });
      if (rnd() > 0.25) bass.push({ at: 4, note: chord.tones[2], vel: vel() * 0.9, len: 4 });
    }

    const comp = pick(COMP_RHYTHMS).map((at) => ({ at, note: 0, vel: vel(), len: 2 }));

    // Мелодия редкая: в среднем одна-две ноты на такт, часто — ни одной.
    const melody: Hit[] = [];
    if (rnd() < (second ? 0.55 : 0.35)) {
      const count = rnd() < 0.3 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        melody.push({ at: Math.floor(rnd() * 8), note: pick(MELODY), vel: vel(), len: 3 });
      }
    }

    return { chord, bass, comp, melody, drums: rnd() < 0.12 ? 0.4 : 1, breakdown, nudge };
  });
}
