// Dashboard: statistics and charts across habits, filtered by habit and date range, plus the habit list.

import { renderNavbar } from './lib/navbar.js';
import * as store from './lib/storage.js';
import { computeStats, periodSummary } from './lib/stats.js';
import { drawTrend, drawMeanBar, drawDistribution } from './lib/charts.js';
import { card, emptyMessage, statCards } from './lib/ui.js';
import { $, esc, fmt, formatDate, link, todayISO } from './lib/utils.js';

renderNavbar();

const habits = store.listHabits();
const records = store.getAllRecords();

// ---- Filters ----

$('habit-filters').innerHTML =
  habits
    .map(
      (h) => `
    <label class="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-700 px-3 py-1">
      <input type="checkbox" value="${h.id}" checked class="accent-red-600" />
      ${esc(h.name)}
    </label>`
    )
    .join('') || '<span class="text-zinc-500">No habits yet.</span>';

const selectedHabitIds = () =>
  new Set([...$('habit-filters').querySelectorAll('input:checked')].map((input) => input.value));

function filteredRecords() {
  const ids = selectedHabitIds();
  const start = $('start').value;
  const end = $('end').value;
  return records.filter((r) => ids.has(r.habitId) && (!start || r.date >= start) && (!end || r.date <= end));
}

// ---- Stats and charts ----

function renderOverview() {
  const rows = filteredRecords();
  // Today/week/month/year use every record; only "Overall" uses the filtered rows.
  $('stats').innerHTML = statCards(periodSummary(records, rows, todayISO()));
  $('charts').classList.toggle('hidden', rows.length === 0);
  if (rows.length === 0) return;

  const ids = selectedHabitIds();
  const series = habits
    .filter((h) => ids.has(h.id))
    .map((h) => ({
      label: h.name,
      points: rows
        .filter((r) => r.habitId === h.id)
        .map((r) => [r.date, r.score])
        .sort(([a], [b]) => a.localeCompare(b)),
    }))
    .filter((s) => s.points.length > 0);

  drawTrend($('trend-chart'), series);
  drawMeanBar(
    $('mean-chart'),
    series.map((s) => ({ label: s.label, mean: computeStats(s.points.map(([, score]) => score)).mean }))
  );
  drawDistribution($('dist-chart'), rows.map((r) => r.score));
}

// ---- Habit list (all-time info, not affected by the filters) ----

function renderHabitList() {
  $('habit-list').innerHTML = habits.length
    ? habits
        .map((h) => {
          const own = records.filter((r) => r.habitId === h.id);
          const stats = computeStats(own.map((r) => r.score));
          const last = own.map((r) => r.date).sort().at(-1);
          return `
        <a href="${link('habit.html', { habit: h.id })}" class="block ${card} hover:border-red-700">
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-semibold">${esc(h.name)}</h3>
            <span class="shrink-0 text-sm text-zinc-400">${own.length} record${own.length === 1 ? '' : 's'}</span>
          </div>
          ${h.description ? `<p class="mt-1 text-sm text-zinc-400">${esc(h.description)}</p>` : ''}
          <p class="mt-2 text-sm text-zinc-300">
            ${stats ? `Mean <span class="text-red-400">${fmt(stats.mean)}</span> · Last ${formatDate(last)}` : 'No records yet'}
          </p>
        </a>`;
        })
        .join('')
    : emptyMessage('No habits yet. Use "Add habit" to create one.');
}

for (const id of ['habit-filters', 'start', 'end']) {
  $(id).addEventListener('change', renderOverview);
}

renderOverview();
renderHabitList();