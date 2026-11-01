// Single-habit page. Opened as habit.html?habit=<id>.

import { renderNavbar } from './lib/navbar.js';
import * as store from './lib/storage.js';
import { periodSummary } from './lib/stats.js';
import { drawTrend, drawDistribution } from './lib/charts.js';
import { card, emptyMessage, statCards } from './lib/ui.js';
import { $, formatDate, link, param, todayISO, url } from './lib/utils.js';

renderNavbar();

const habit = store.getHabit(param('habit'));

if (!habit) {
  $('not-found').classList.remove('hidden');
} else {
  $('content').classList.remove('hidden');

  $('habit-name').textContent = habit.name;
  $('habit-description').textContent = habit.description ?? '';
  $('add-record').href = url('add-record.html', { habit: habit.id });
  $('edit-habit').href = url('add-habit.html', { habit: habit.id });

  $('delete-habit').addEventListener('click', () => {
    if (!confirm('Delete this habit and all of its records?')) return;
    store.deleteHabit(habit.id);
    location.href = 'index.html';
  });

  const records = store.getHabitRecords(habit.id); // oldest first

  function render() {
    const start = $('start').value;
    const end = $('end').value;
    const rows = records.filter((r) => (!start || r.date >= start) && (!end || r.date <= end));
    // Today/week/month/year use all of this habit's records; only "Overall" follows the date filter.
    $('stats').innerHTML = statCards(periodSummary(records, rows, todayISO()));
    $('charts').classList.toggle('hidden', rows.length === 0);
    if (rows.length > 0) {
      drawTrend($('trend-chart'), [{ label: habit.name, points: rows.map((r) => [r.date, r.score]) }]);
      drawDistribution($('dist-chart'), rows.map((r) => r.score));
    }

    // Newest first
    $('record-list').innerHTML = rows.length
      ? [...rows]
          .reverse()
          .map(
            (r) => `
          <a href="${link('record.html', { habit: habit.id, date: r.date })}"
             class="flex items-center justify-between gap-3 ${card} hover:border-red-700">
            <span>${formatDate(r.date)}</span>
            <span class="text-lg font-semibold text-red-400">${r.score}</span>
          </a>`
          )
          .join('')
      : emptyMessage('No records to show.');
  }

  $('start').addEventListener('change', render);
  $('end').addEventListener('change', render);
  render();
}