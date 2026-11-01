// Lists the records (only habits that have a score) for one date. Updates as the date changes.

import { renderNavbar } from './lib/navbar.js';
import * as store from './lib/storage.js';
import { computeStats } from './lib/stats.js';
import { card, emptyMessage } from './lib/ui.js';
import { $, esc, fmt, formatDate, link, todayISO } from './lib/utils.js';

renderNavbar();

const dateEl = $('date');
dateEl.value = todayISO();

function render() {
  const date = dateEl.value;

  if (!date) {
    $('heading').textContent = '';
    $('summary').textContent = '';
    $('records').innerHTML = emptyMessage('Pick a date to see its records.');
    return;
  }

  const habitsById = new Map(store.listHabits().map((h) => [h.id, h]));
  const rows = store
    .getAllRecords()
    .filter((r) => r.date === date)
    .map((r) => ({ ...r, name: habitsById.get(r.habitId).name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const stats = computeStats(rows.map((r) => r.score));

  $('heading').textContent = formatDate(date);
  $('summary').textContent = stats ? `${stats.count} record${stats.count === 1 ? '' : 's'} · mean ${fmt(stats.mean)}` : '';

  $('records').innerHTML = rows.length
    ? rows
        .map(
          (r) => `
        <a href="${link('record.html', { habit: r.habitId, date })}"
           class="flex items-center justify-between gap-3 ${card} hover:border-red-700">
          <span>${esc(r.name)}</span>
          <span class="text-lg font-semibold text-red-400">${r.score}</span>
        </a>`
        )
        .join('')
    : emptyMessage('No records for this date.');
}

dateEl.addEventListener('input', render);
$('date-form').addEventListener('submit', (e) => e.preventDefault());

render();