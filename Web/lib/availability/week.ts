const DAY_MS = 24 * 60 * 60 * 1000;

/** Monday-based week start (local date, midnight). */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function parseWeekParam(value: string | undefined): Date {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return getMondayOfWeek(new Date());
  }
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) {
    return getMondayOfWeek(new Date());
  }
  return getMondayOfWeek(parsed);
}

export function formatWeekParam(monday: Date): string {
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const d = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addWeeks(monday: Date, weeks: number): Date {
  const next = new Date(monday);
  next.setDate(next.getDate() + weeks * 7);
  return next;
}

export function formatWeekRangeLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  const startYear = monday.getFullYear();
  const endYear = sunday.getFullYear();
  const start = monday.toLocaleDateString("en-US", opts);
  const end = sunday.toLocaleDateString("en-US", {
    ...opts,
    year: startYear !== endYear ? "numeric" : undefined,
  });
  if (startYear !== endYear) {
    return `${monday.toLocaleDateString("en-US", { ...opts, year: "numeric" })} – ${sunday.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
  }
  return `${start} – ${end}, ${startYear}`;
}

/** Grid columns Mon–Sun; values are Postgres day_of_week (0=Sun … 6=Sat). */
export const GRID_DAYS = [
  { dayOfWeek: 1, label: "Mon" },
  { dayOfWeek: 2, label: "Tue" },
  { dayOfWeek: 3, label: "Wed" },
  { dayOfWeek: 4, label: "Thu" },
  { dayOfWeek: 5, label: "Fri" },
  { dayOfWeek: 6, label: "Sat" },
  { dayOfWeek: 0, label: "Sun" },
] as const;

export function dateForDayInWeek(monday: Date, dayOfWeek: number): Date {
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const d = new Date(monday);
  d.setTime(d.getTime() + offset * DAY_MS);
  return d;
}

export function shortDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatWeekRangeLong(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  return `${monday.toLocaleDateString("en-US", opts)} - ${sunday.toLocaleDateString("en-US", opts)}`;
}

export function toDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function weekDateStrings(monday: Date): string[] {
  return GRID_DAYS.map((day) =>
    toDateParam(dateForDayInWeek(monday, day.dayOfWeek))
  );
}
