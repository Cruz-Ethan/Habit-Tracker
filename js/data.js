// Place this file next to index.html and open it through the same server/origin as the app,
// otherwise the browser's local storage for it will be empty.
import { renderNavbar } from './lib/navbar.js';
import { listHabits, getAllRecords, replaceHabits, replaceRecords } from './lib/storage.js';
import { parseHabits, parseRecords } from './lib/validate.js';
import { $ } from './lib/utils.js';

renderNavbar();

const json = (value) => JSON.stringify(value, null, 2);
const count = (n, word) => `(${n} ${word}${n === 1 ? '' : 's'})`;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

let data = { habits: [], records: [] };

function render() {
    const habits = listHabits();
    // Records as a flat list, oldest first (stored per habit, keyed by date).
    const records = getAllRecords().sort(
        (a, b) => a.date.localeCompare(b.date) || a.habitId.localeCompare(b.habitId)
    );
    data = { habits, records };

    $('habits-count').textContent = count(habits.length, 'habit');
    $('records-count').textContent = count(records.length, 'record');
    $('habits-json').textContent = json(habits);
    $('records-json').textContent = json(records);
}

// ---- Copy buttons (icons) ----

const icon = (inner) =>
    `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
const icons = {
    copy: icon('<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
    done: icon('<polyline points="20 6 9 17 4 12"/>'),
    failed: icon('<path d="M18 6 6 18M6 6l12 12"/>'),
};

for (const slot of document.querySelectorAll('[data-copy] [data-icon]')) slot.innerHTML = icons.copy;

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback for pages served from an insecure origin, where the Clipboard API is unavailable.
        const area = document.createElement('textarea');
        area.value = text;
        area.className = 'fixed opacity-0';
        document.body.append(area);
        area.select();
        const ok = document.execCommand('copy');
        area.remove();
        return ok;
    }
}

document.addEventListener('click', async (e) => {
    const button = e.target.closest('[data-copy]');
    if (!button) return;

    const key = button.dataset.copy;
    const slot = button.querySelector('[data-icon]');
    const ok = await copyText(json(key === 'all' ? data : data[key]));

    // Show a check (or a cross) for a moment, then go back to the copy icon.
    slot.innerHTML = ok ? icons.done : icons.failed;
    $('copy-status').textContent = ok ? 'Copied to clipboard' : 'Copy failed';
    clearTimeout(button.resetTimer);
    button.resetTimer = setTimeout(() => (slot.innerHTML = icons.copy), 1500);
});

// ---- Editing ----
// Opening an editor shows the saved JSON in a textarea. Nothing is written to local storage until the
// form is submitted, and only if the JSON is valid. Cancel throws the changes away.

// Each returns true if it saved, false if the user backed out. Both throw an Error for invalid input.
const savers = {
    habits(raw) {
        const habits = parseHabits(raw);
        const kept = new Set(habits.map((h) => h.id));

        // Removing a habit also removes its records, so ask first.
        const removed = listHabits().filter((h) => !kept.has(h.id));
        const lost = getAllRecords().filter((r) => !kept.has(r.habitId)).length;
        if (removed.length && lost) {
            const names = removed.map((h) => `"${h.name}"`).join(', ');
            if (!confirm(`This removes ${names} and ${plural(lost, 'record')}. Save anyway?`)) return false;
        }

        replaceHabits(habits);
        return true;
    },
    records(raw) {
        const records = parseRecords(raw, new Set(listHabits().map((h) => h.id)));
        replaceRecords(records);
        return true;
    },
};

function setEditing(key, editing) {
    $(`${key}-view`).classList.toggle('hidden', editing);
    $(`${key}-form`).classList.toggle('hidden', !editing);
    document.querySelector(`[data-edit="${key}"]`).classList.toggle('hidden', editing);
    $(`${key}-error`).classList.add('hidden');
}

document.addEventListener('click', (e) => {
    const button = e.target.closest('[data-edit]');
    if (!button) return;

    const key = button.dataset.edit;
    render(); // start from what is saved right now
    $(`${key}-editor`).value = json(data[key]);
    setEditing(key, true);
    $(`${key}-editor`).focus();
});

for (const key of Object.keys(savers)) {
    $(`${key}-cancel`).addEventListener('click', () => setEditing(key, false));

    $(`${key}-form`).addEventListener('submit', (e) => {
        e.preventDefault();
        $(`${key}-error`).classList.add('hidden');

        try {
            if (!savers[key](JSON.parse($(`${key}-editor`).value))) return;
        } catch (err) {
            $(`${key}-error`).textContent = err instanceof SyntaxError ? `Invalid JSON: ${err.message}` : err.message;
            $(`${key}-error`).classList.remove('hidden');
            return; // stay in the editor with the draft intact; nothing was saved
        }

        setEditing(key, false);
        render();
    });
}

$('refresh').addEventListener('click', render);

render();