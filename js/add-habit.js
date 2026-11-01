// Create a habit, or edit one when opened as add-habit.html?habit=<id>.

import { renderNavbar } from './lib/navbar.js';
import * as store from './lib/storage.js';
import { $, param, url } from './lib/utils.js';

renderNavbar();

const form = $('habit-form');
const editing = store.getHabit(param('habit'));

if (editing) {
  $('title').textContent = 'Edit habit';
  form.elements.name.value = editing.name;
  form.elements.description.value = editing.description ?? '';
  $('cancel').href = url('habit.html', { habit: editing.id });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const fields = {
    name: form.elements.name.value.trim(),
    description: form.elements.description.value.trim(),
  };
  if (!fields.name) return;

  let id;
  if (editing) {
    store.updateHabit(editing.id, fields);
    id = editing.id;
  } else {
    id = store.createHabit(fields).id;
  }
  location.href = url('habit.html', { habit: id });
});