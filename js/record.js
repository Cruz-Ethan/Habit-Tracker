// Shows a single record. Opened as record.html?habit=<id>&date=<YYYY-MM-DD>.

import { renderNavbar } from './lib/navbar.js';
import * as store from './lib/storage.js';
import { $, formatDate, param, url } from './lib/utils.js';

renderNavbar();

const habitId = param('habit');
const date = param('date');
const habit = store.getHabit(habitId);
const record = habit && date ? store.getRecord(habitId, date) : null;

if (!record) {
  $('not-found').classList.remove('hidden');
} else {
  $('content').classList.remove('hidden');

  const habitUrl = url('habit.html', { habit: habitId });
  $('habit-link').textContent = habit.name;
  $('habit-link').href = habitUrl;
  $('date').textContent = formatDate(date);
  $('score').textContent = record.score;
  $('back').href = habitUrl;
  $('edit').href = url('add-record.html', { habit: habitId, date });

  $('delete').addEventListener('click', () => {
    if (!confirm('Delete this record?')) return;
    store.deleteRecord(habitId, date);
    location.href = habitUrl;
  });
}