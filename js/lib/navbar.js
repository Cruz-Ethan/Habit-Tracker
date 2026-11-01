// Renders the shared navigation bar into <nav id="navbar"> on every page.
// Below the `sm` breakpoint the links are hidden behind a hamburger button.

import { $ } from './utils.js';

const links = [
  ['index.html', 'Dashboard'],
  ['add-habit.html', 'Add habit'],
  ['add-record.html', 'Add record'], // no query params: the habit field is left empty
  ['calendar.html', 'Calendar'],
  ['data.html', 'Data']
];

// Detail pages belong to the dashboard section.
const section = { 'habit.html': 'index.html', 'record.html': 'index.html' };

const icon = (path) =>
  `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path stroke-linecap="round" stroke-linejoin="round" d="${path}" />
  </svg>`;
const menuIcon = icon('M4 6h16M4 12h16M4 18h16');
const closeIcon = icon('M6 6l12 12M18 6L6 18');

export function renderNavbar() {
  const file = location.pathname.split('/').pop() || 'index.html';
  const current = section[file] ?? file;

  $('navbar').innerHTML = `
    <div class="border-b border-red-900 bg-zinc-900">
      <div class="mx-auto flex max-w-5xl flex-col gap-x-1 gap-y-2 p-3 sm:flex-row sm:items-center">
        <div class="flex items-center justify-between sm:flex-1">
          <a href="index.html" class="mr-4 text-lg font-bold text-red-500">Habit Tracker</a>
          <button
            id="nav-toggle"
            type="button"
            aria-label="Toggle navigation menu"
            aria-controls="nav-links"
            aria-expanded="false"
            class="rounded p-1 text-zinc-300 hover:bg-zinc-800 hover:text-white sm:hidden"
          >${menuIcon}</button>
        </div>
        <div id="nav-links" class="flex flex-col gap-1 max-sm:hidden sm:flex-row">
          ${links
            .map(
              ([href, label]) => `
            <a href="${href}" class="rounded px-3 py-2 sm:py-1 ${
                href === current ? 'bg-red-600 text-white' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }">${label}</a>`
            )
            .join('')}
        </div>
      </div>
    </div>`;

  const toggle = $('nav-toggle');
  const menu = $('nav-links');

  toggle.addEventListener('click', () => {
    // `max-sm:hidden` only applies below the sm breakpoint, so on wider screens the links always show.
    const open = menu.classList.toggle('max-sm:hidden') === false;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.innerHTML = open ? closeIcon : menuIcon;
  });
}