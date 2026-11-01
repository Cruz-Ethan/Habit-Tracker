// Shared class strings and HTML snippets for JS-generated markup. Only stock Tailwind utilities.

import { esc, fmt } from './utils.js';

export const card = 'rounded-lg border border-zinc-800 bg-zinc-900 p-4';

export const emptyMessage = (text) => `<p class="${card} text-zinc-400">${esc(text)}</p>`;

// One card per period with mean and standard deviation. `periods` comes from periodSummary().
export function statCards(periods) {
  const overall = periods.at(-1);

  const cards = periods
    .map(({ label, stats }) => {
      // "Overall" gets a brighter border and spans the full row on narrow screens.
      const classes =
        label === overall.label
          ? `${card.replace('border-zinc-800', 'border-red-700')} col-span-2 sm:col-span-1`
          : card;
      return `
      <div class="${classes} text-center">
        <div class="text-sm font-medium text-zinc-400">${label}</div>
        <div class="mt-2 text-3xl text-red-400">${stats ? fmt(stats.mean) : '—'}</div>
        <div class="text-xs text-zinc-500">mean</div>
        <div class="mt-2 text-xl text-zinc-200">${stats ? fmt(stats.stdDev) : '—'}</div>
        <div class="text-xs text-zinc-500">std dev</div>
        <div class="mt-2 text-xs text-zinc-500">${
          stats ? `${stats.count} record${stats.count === 1 ? '' : 's'}` : 'no records'
        }</div>
      </div>`;
    })
    .join('');

  return `
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">${cards}</div>
    <p class="mt-2 text-xs text-zinc-500">Only “Overall” follows the filters; the other periods always use all records.</p>
    ${overall.stats ? '' : `<div class="mt-3">${emptyMessage('No records match the current filters.')}</div>`}`;
}