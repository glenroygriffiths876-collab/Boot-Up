// Friday pre-order rules are evaluated in Jamaica's local date, not the customer's device timezone.
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export function parseDateOnly(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return null;
  const date = new Date(value + 'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}
export function todayInJamaica(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Jamaica', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const get = type => parts.find(part => part.type === type)?.value;
  return get('year') + '-' + get('month') + '-' + get('day');
}
export function nextFridayAfter(today = todayInJamaica()) {
  const date = parseDateOnly(today);
  if (!date) throw new TypeError('Expected a valid YYYY-MM-DD date');
  let gap = (5 - date.getUTCDay() + 7) % 7;
  if (gap === 0) gap = 7; // No same-day orders, including on Friday.
  date.setUTCDate(date.getUTCDate() + gap);
  return date.toISOString().slice(0, 10);
}
export function isFridayPreorder(date, today = todayInJamaica()) {
  const d = parseDateOnly(date);
  return Boolean(d && parseDateOnly(today) && date > today && d.getUTCDay() === 5);
}
export function formatFriday(date) {
  const d = parseDateOnly(date);
  return d ? new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }).format(d) : '';
}
export function formatPreferredTime(time) {
  if (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return '';
  const [hour, minute] = time.split(':').map(Number);
  return String(hour % 12 || 12) + ':' + String(minute).padStart(2, '0') + (hour >= 12 ? ' PM' : ' AM');
}
