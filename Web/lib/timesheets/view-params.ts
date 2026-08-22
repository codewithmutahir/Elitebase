import { getDefaultWeekRange, getMonthRange, parseDateRange } from "@/lib/timesheets/dates";

export type TimesheetsViewParams = {
  from: string;
  to: string;
  month: string | null;
  employeeId?: string;
  mode: "month" | "custom" | "week";
};

export function parseTimesheetsViewParams(
  timezone: string,
  params: {
    month?: string | null;
    from?: string | null;
    to?: string | null;
    employeeId?: string | null;
  },
  availableMonths: string[]
): TimesheetsViewParams {
  const employeeId =
    params.employeeId && params.employeeId !== "all"
      ? params.employeeId
      : undefined;

  if (params.month && params.month !== "custom") {
    const monthRange = getMonthRange(params.month);
    if (monthRange) {
      return {
        from: monthRange.from,
        to: monthRange.to,
        month: params.month,
        employeeId,
        mode: "month",
      };
    }
  }

  if (params.month === "custom" || params.from || params.to) {
    const range = parseDateRange(
      timezone,
      params.from ?? undefined,
      params.to ?? undefined
    );
    return {
      ...range,
      month: "custom",
      employeeId,
      mode: "custom",
    };
  }

  if (availableMonths[0]) {
    const monthRange = getMonthRange(availableMonths[0]);
    if (monthRange) {
      return {
        from: monthRange.from,
        to: monthRange.to,
        month: availableMonths[0],
        employeeId,
        mode: "month",
      };
    }
  }

  const range = getDefaultWeekRange(timezone);
  return {
    ...range,
    month: null,
    employeeId,
    mode: "week",
  };
}

export function buildTimesheetsQueryString(options: {
  month?: string | null;
  from?: string;
  to?: string;
  employeeId?: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (options.month && options.month !== "custom") {
    params.set("month", options.month);
  } else if (options.from && options.to) {
    params.set("month", "custom");
    params.set("from", options.from);
    params.set("to", options.to);
  }

  if (options.employeeId && options.employeeId !== "all") {
    params.set("employeeId", options.employeeId);
  }

  if (options.page && options.page > 1) {
    params.set("page", String(options.page));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
