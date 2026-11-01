// Small DOM and formatting helpers shared by every page.

export const $ = (id) => document.getElementById(id);

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Query string helpers. Convention used everywhere: ?habit=<habit id>&date=<YYYY-MM-DD>
export const param = (name) => new URLSearchParams(location.search).get(name);
export const url = (page, params = {}) => `${page}?${new URLSearchParams(params)}`;
// Same as url(), but escaped for use inside an HTML attribute.
export const link = (page, params = {}) => esc(url(page, params));

// Today's date in the user's local time zone as YYYY-MM-DD (toISOString alone uses UTC).
export function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export const fmt = (n) => n.toFixed(1);

export function formatDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}