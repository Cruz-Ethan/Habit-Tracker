// Descriptive statistics. Standard deviation is the population standard deviation
// (divides by n), so it is defined even when there is only one score.

export function computeStats(values) {
  const count = values.length;
  if (count === 0) return null;

  const mean = values.reduce((sum, v) => sum + v, 0) / count;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / count;

  return { count, mean, stdDev: Math.sqrt(variance) };
}

// ---- Calendar periods ----

const WEEK_STARTS_ON = 0; // 0 = Sunday, 1 = Monday

const toISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

// The calendar day, week, month and year that contain `today` (YYYY-MM-DD), as inclusive ranges.
// Month and year ends use "-31" / "-12-31": ISO dates compare as strings, so that covers every real date.
function currentPeriods(today) {
  const weekday = new Date(`${today}T00:00:00`).getDay();
  const weekStart = addDays(today, -((weekday - WEEK_STARTS_ON + 7) % 7));
  return [
    { label: 'Today', start: today, end: today },
    { label: 'This week', start: weekStart, end: addDays(weekStart, 6) },
    { label: 'This month', start: `${today.slice(0, 7)}-01`, end: `${today.slice(0, 7)}-31` },
    { label: 'This year', start: `${today.slice(0, 4)}-01-01`, end: `${today.slice(0, 4)}-12-31` },
  ];
}

// Mean / std dev for today, this week, this month and this year, plus "Overall".
// The four periods are computed from `allRecords` and never change with filters;
// "Overall" is computed from `overallRecords` (the filtered set).
// Returns [{ label, stats }], where stats is null when there are no records.
export function periodSummary(allRecords, overallRecords, today) {
  const periods = currentPeriods(today).map(({ label, start, end }) => ({
    label,
    stats: computeStats(allRecords.filter((r) => r.date >= start && r.date <= end).map((r) => r.score)),
  }));
  return [...periods, { label: 'Overall', stats: computeStats(overallRecords.map((r) => r.score)) }];
}