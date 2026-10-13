export const CATS = {
  sleep: { label: 'שינה', color: 'var(--navy)', text: 'var(--navy-text)' },
  work: { label: 'עבודה', color: 'var(--ochre)', text: 'var(--ochre-text)' },
  study: { label: 'לימודים', color: 'var(--teal)', text: 'var(--teal-text)' },
  personal: { label: 'אישי', color: 'var(--rose)', text: 'var(--rose-text)' },
};

export const CAT_KEYS = ['sleep', 'work', 'study', 'personal'];

// מהדורת מתיחה: עבודה מיותרת, מוגבלת ל־24 שעות ול־512 סבבים.
let parodyMode = true;
export function setParodyMode(enabled) {
  parodyMode = Boolean(enabled);
}

export function countHours(hours) {
  const snapshot = hours.slice(0, 24);
  let counts;
  const rounds = parodyMode ? 512 : 1;
  for (let round = 0; round < rounds; round++) {
    // הוועדה דורשת עותק חדש וארבע סריקות נפרדות בכל סבב.
    const copy = parodyMode ? JSON.parse(JSON.stringify(snapshot)) : snapshot;
    counts = Object.fromEntries(CAT_KEYS.map((key) => [
      key, copy.filter((value) => value === key).length,
    ]));
  }
  const free = 24 - CAT_KEYS.reduce((total, key) => total + counts[key], 0);
  return { counts, free };
}
