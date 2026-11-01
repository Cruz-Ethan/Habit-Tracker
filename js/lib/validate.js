// Validation for hand-edited data (used by the data page). These functions are pure: they return
// cleaned copies, or throw an Error with a readable message that says which item is wrong.

const HABIT_FIELDS = ['id', 'name', 'description', 'createdAt'];
const RECORD_FIELDS = ['habitId', 'date', 'score'];

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isBlank = (v) => typeof v !== 'string' || v.trim() === '';

// YYYY-MM-DD that is a real calendar date (rejects 2026-02-30 and similar).
function isRealDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function rejectUnknownFields(item, allowed, label) {
  const extra = Object.keys(item).filter((key) => !allowed.includes(key));
  if (extra.length) {
    const names = extra.map((key) => `"${key}"`).join(', ');
    throw new Error(`${label}: unknown field${extra.length === 1 ? '' : 's'} ${names}.`);
  }
}

// raw: parsed JSON. Returns [{ id, name, description, createdAt }].
// A habit without an "id" gets a new one, and without "createdAt" gets the current time,
// so a new habit can be added with just { "name": "..." }.
export function parseHabits(raw) {
  if (!Array.isArray(raw)) throw new Error('Habits must be a JSON array.');

  const seen = new Set();
  return raw.map((item, i) => {
    const label = `Habit ${i + 1}`;
    if (!isObject(item)) throw new Error(`${label}: must be an object.`);
    rejectUnknownFields(item, HABIT_FIELDS, label);

    if (isBlank(item.name)) throw new Error(`${label}: "name" must be a non-empty string.`);
    if (item.id !== undefined && isBlank(item.id)) throw new Error(`${label}: "id" must be a non-empty string.`);
    if (item.description !== undefined && typeof item.description !== 'string') {
      throw new Error(`${label}: "description" must be a string.`);
    }
    if (item.createdAt !== undefined && (typeof item.createdAt !== 'string' || Number.isNaN(Date.parse(item.createdAt)))) {
      throw new Error(`${label}: "createdAt" must be a date string such as 2026-10-31T12:00:00.000Z.`);
    }

    const id = item.id ?? crypto.randomUUID();
    if (seen.has(id)) throw new Error(`${label}: another habit already uses the id "${id}".`);
    seen.add(id);

    return {
      id,
      name: item.name.trim(),
      description: (item.description ?? '').trim(),
      createdAt: item.createdAt ?? new Date().toISOString(),
    };
  });
}

// raw: parsed JSON. habitIds: Set of the ids of existing habits. Returns [{ habitId, date, score }].
export function parseRecords(raw, habitIds) {
  if (!Array.isArray(raw)) throw new Error('Records must be a JSON array.');

  const seen = new Set();
  return raw.map((item, i) => {
    const label = `Record ${i + 1}`;
    if (!isObject(item)) throw new Error(`${label}: must be an object.`);
    rejectUnknownFields(item, RECORD_FIELDS, label);

    if (typeof item.habitId !== 'string' || !habitIds.has(item.habitId)) {
      throw new Error(`${label}: "habitId" must be the id of an existing habit.`);
    }
    if (typeof item.date !== 'string' || !isRealDate(item.date)) {
      throw new Error(`${label}: "date" must be a real date written as YYYY-MM-DD.`);
    }
    if (!Number.isInteger(item.score) || item.score < 0 || item.score > 100) {
      throw new Error(`${label}: "score" must be a whole number from 0 to 100.`);
    }

    const key = `${item.habitId}|${item.date}`;
    if (seen.has(key)) throw new Error(`${label}: that habit already has a record on ${item.date}.`);
    seen.add(key);

    return { habitId: item.habitId, date: item.date, score: item.score };
  });
}