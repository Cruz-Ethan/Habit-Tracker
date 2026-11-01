// All localStorage access lives here.
// Shape: { habits: [{ id, name, description, createdAt }], scores: { [habitId]: { [YYYY-MM-DD]: 0-100 } } }
// A record is identified by (habitId, date): each habit has at most one record per day,
// and days without a record are simply absent.

import { parseHabits, parseRecords } from './validate.js';

const KEY = 'habit-tracker:v1';
const empty = () => ({ habits: [], scores: {} });

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? empty();
  } catch {
    return empty();
  }
}

function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

const toRecords = (habitId, byDate) =>
  Object.entries(byDate ?? {}).map(([date, score]) => ({ habitId, date, score }));

// ---- Habits ----

export function listHabits() {
  return read().habits;
}

export function getHabit(id) {
  return read().habits.find((h) => h.id === id);
}

export function createHabit({ name, description }) {
  const data = read();
  const habit = {
    id: crypto.randomUUID(),
    name,
    description,
    createdAt: new Date().toISOString(),
  };
  data.habits.push(habit);
  data.scores[habit.id] = {};
  write(data);
  return habit;
}

export function updateHabit(id, { name, description }) {
  const data = read();
  const habit = data.habits.find((h) => h.id === id);
  if (!habit) return;
  habit.name = name;
  habit.description = description;
  write(data);
}

export function deleteHabit(id) {
  const data = read();
  data.habits = data.habits.filter((h) => h.id !== id);
  delete data.scores[id];
  write(data);
}

// ---- Records ----

// All records of all existing habits, as [{ habitId, date, score }].
export function getAllRecords() {
  const { habits, scores } = read();
  return habits.flatMap((h) => toRecords(h.id, scores[h.id]));
}

// Records of one habit, oldest first.
export function getHabitRecords(habitId) {
  return toRecords(habitId, read().scores[habitId]).sort((a, b) => a.date.localeCompare(b.date));
}

export function getRecord(habitId, date) {
  const score = read().scores[habitId]?.[date];
  return score === undefined ? null : { habitId, date, score };
}

// Creates the record, or overwrites it if the habit already has one on that date.
export function saveRecord(habitId, date, score) {
  const data = read();
  if (!data.habits.some((h) => h.id === habitId)) return;
  const clamped = Math.min(100, Math.max(0, Math.round(Number(score))));
  data.scores[habitId] = { ...(data.scores[habitId] ?? {}), [date]: clamped };
  write(data);
}

export function deleteRecord(habitId, date) {
  const data = read();
  if (data.scores[habitId]) delete data.scores[habitId][date];
  write(data);
}

// ---- Bulk replace (used by the data page's editors) ----
// Both validate their input and throw an Error, writing nothing, if it is not valid.

// Replaces all habits. Records of habits that are kept stay; records of removed habits are deleted.
export function replaceHabits(raw) {
  const habits = parseHabits(raw);
  const data = read();
  const scores = Object.fromEntries(habits.map((h) => [h.id, data.scores[h.id] ?? {}]));
  write({ ...data, habits, scores });
}

// Replaces all records. Every record must belong to an existing habit.
export function replaceRecords(raw) {
  const data = read();
  const records = parseRecords(raw, new Set(data.habits.map((h) => h.id)));
  const scores = Object.fromEntries(data.habits.map((h) => [h.id, {}]));
  for (const r of records) scores[r.habitId][r.date] = r.score;
  write({ ...data, scores });
}