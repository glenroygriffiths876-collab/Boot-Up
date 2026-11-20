import test from 'node:test';
import assert from 'node:assert/strict';
import { todayInJamaica, nextFridayAfter, isFridayPreorder, formatFriday, formatPreferredTime, parseDateOnly } from '../schedule.js';

test('the next available pickup is always the next Friday, never today', () => {
  assert.equal(nextFridayAfter('2026-11-19'), '2026-11-20'); // Thursday
  assert.equal(nextFridayAfter('2026-11-20'), '2026-11-27'); // Friday: no same-day booking
  assert.equal(nextFridayAfter('2026-11-21'), '2026-11-27'); // Saturday
  assert.equal(nextFridayAfter('2026-11-26'), '2026-11-27');
});
test('checkout accepts future Fridays but blocks other days and same-day Fridays', () => {
  assert.equal(isFridayPreorder('2026-11-20', '2026-11-19'), true);
  assert.equal(isFridayPreorder('2026-11-20', '2026-11-20'), false);
  assert.equal(isFridayPreorder('2026-11-21', '2026-11-20'), false);
  assert.equal(isFridayPreorder('2026-11-27', '2026-11-20'), true);
  assert.equal(isFridayPreorder('2026-11-19', '2026-11-20'), false);
  assert.equal(isFridayPreorder('2026-02-30', '2026-02-01'), false);
  assert.equal(isFridayPreorder('', '2026-11-20'), false);
});
test('Jamaica business date is independent of customer location', () => {
  assert.equal(todayInJamaica(new Date('2026-11-20T04:30:00Z')), '2026-11-19');
  assert.equal(todayInJamaica(new Date('2026-11-20T05:00:00Z')), '2026-11-20');
});
test('date and optional collection time are human readable in the order', () => {
  assert.equal(formatFriday('2026-11-27'), 'Friday, 27 November 2026');
  assert.equal(formatPreferredTime('08:05'), '8:05 AM');
  assert.equal(formatPreferredTime('12:30'), '12:30 PM');
  assert.equal(formatPreferredTime('00:00'), '12:00 AM');
  assert.equal(formatPreferredTime(''), '');
  assert.equal(formatPreferredTime('25:30'), '');
  assert.equal(parseDateOnly('2026-02-30'), null);
});
