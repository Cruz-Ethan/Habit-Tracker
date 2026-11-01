// Create a record. Query params:
//   ?habit=<id>               pre-selects the habit
//   ?habit=<id>&date=<date>   edit mode, if that record exists (habit and date are locked)

import { renderNavbar } from './lib/navbar.js';
import * as store from './lib/storage.js';
import { $, esc, link, param, todayISO, url } from './lib/utils.js';

renderNavbar();

const habits = store.listHabits();
const form = $('record-form');
const { habit: habitEl, date: dateEl, score: scoreEl } = form.elements;
const errorEl = $('error');

const habitParam = param('habit');
const dateParam = param('date');
const existing = habitParam && dateParam ? store.getRecord(habitParam, dateParam) : null;
const editing = existing !== null;

if (habits.length === 0) {
  form.classList.add('hidden');
  $('no-habits').classList.remove('hidden');
}

habitEl.innerHTML =
  '<option value="">Select a habit</option>' +
  habits.map((h) => `<option value="${h.id}">${esc(h.name)}</option>`).join('');

if (store.getHabit(habitParam)) habitEl.value = habitParam;

dateEl.max = todayISO();
dateEl.value = editing ? dateParam : todayISO();

if (editing) {
  $('title').textContent = 'Edit record';
  scoreEl.value = existing.score;
  habitEl.disabled = true; // a record is identified by habit + date, so these stay fixed
  dateEl.disabled = true;
}

// Cancel goes back to the habit page (or the record page when editing).
function updateCancel() {
  $('cancel').href = editing
    ? url('record.html', { habit: habitParam, date: dateParam })
    : habitEl.value
      ? url('habit.html', { habit: habitEl.value })
      : 'index.html';
}
updateCancel();
habitEl.addEventListener('change', updateCancel);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const habitId = habitEl.value;
  const date = dateEl.value;

  if (!editing && store.getRecord(habitId, date)) {
    errorEl.innerHTML = `This habit already has a record on that date. <a class="underline" href="${link('record.html', { habit: habitId, date })}">View it</a>`;
    errorEl.classList.remove('hidden');
    return;
  }

  store.saveRecord(habitId, date, scoreEl.value);
  location.href = editing ? url('record.html', { habit: habitId, date }) : url('habit.html', { habit: habitId });
});