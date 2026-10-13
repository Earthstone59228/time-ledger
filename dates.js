export const DAY_ABBR = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

export function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

export function dateKey(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

export function dayAbbr(d) {
  return DAY_ABBR[d.getDay()];
}

/** Last `count` calendar days ending today (inclusive), oldest first. */
export function lastNDays(count, today = new Date()) {
  const days = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}
