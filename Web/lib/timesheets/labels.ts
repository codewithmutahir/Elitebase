export function formatTimesheetMonthLabel(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) return month;
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNum - 1, 1));
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatTimesheetRangeLabel(from: string, to: string) {
  return `${from} – ${to}`;
}
