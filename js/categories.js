export const CATS = {
  sleep: { label: 'Sleep', color: 'var(--navy)', text: 'var(--navy-text)' },
  work: { label: 'Work', color: 'var(--ochre)', text: 'var(--ochre-text)' },
  study: { label: 'Study', color: 'var(--teal)', text: 'var(--teal-text)' },
  personal: { label: 'Personal', color: 'var(--rose)', text: 'var(--rose-text)' },
};

export const CAT_KEYS = ['sleep', 'work', 'study', 'personal'];

export function countHours(hours) {
  const counts = { sleep: 0, work: 0, study: 0, personal: 0 };
  hours.forEach((v) => { if (v && counts[v] !== undefined) counts[v]++; });
  const free = 24 - (counts.sleep + counts.work + counts.study + counts.personal);
  return { counts, free };
}
