export type ParsedEmployeeImportRow = {
  fullName: string;
  position: string | null;
  payrollId: string | null;
  hourlyRate: number | null;
  monthlySalary: number | null;
};

export type ParseEmployeeCsvResult = {
  employees: ParsedEmployeeImportRow[];
  totalDataRows: number;
  skippedRows: number;
  error?: string;
};

const WORK_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizeNameKey(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function parseMoney(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const digits = value.replace(/[^\d.]/g, "");
  if (!digits) return null;
  const parsed = Number.parseFloat(digits);
  return Number.isFinite(parsed) ? parsed : null;
}

function hourlyRateFromDailyWage(dailyWage: number | null) {
  if (dailyWage == null || dailyWage <= 0) return null;
  return Math.round((dailyWage / 8) * 100) / 100;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  fields.push(current);
  return fields;
}

function findColumnIndex(headers: string[], names: string[]) {
  const normalized = headers.map((header) => header.trim().toLowerCase());
  for (const name of names) {
    const index = normalized.indexOf(name.toLowerCase());
    if (index >= 0) return index;
  }
  return -1;
}

function isEmployeeTimecardRow(name: string, workDate: string) {
  const trimmedName = name.trim();
  if (!trimmedName) return false;
  if (/^totals for /i.test(trimmedName)) return false;
  if (!WORK_DATE_PATTERN.test(workDate.trim())) return false;
  return true;
}

/** Extract unique employees from a legacy portal timecard CSV export. */
export function parseEmployeeTimecardCsv(csvText: string): ParseEmployeeCsvResult {
  const trimmed = csvText.replace(/^\uFEFF/, "").trim();
  if (!trimmed) {
    return { employees: [], totalDataRows: 0, skippedRows: 0, error: "CSV file is empty." };
  }

  const lines = trimmed.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return {
      employees: [],
      totalDataRows: 0,
      skippedRows: 0,
      error: "CSV must include a header row and at least one data row.",
    };
  }

  const headers = parseCsvLine(lines[0] ?? "");
  const nameIndex = findColumnIndex(headers, ["Name"]);
  const workDateIndex = findColumnIndex(headers, ["Work date"]);
  const roleIndex = findColumnIndex(headers, ["Role"]);
  const payrollIdIndex = findColumnIndex(headers, ["Payroll ID"]);
  const monthlySalaryIndex = findColumnIndex(headers, [
    "Effective monthly salary",
  ]);
  const dailyWageIndex = findColumnIndex(headers, ["Wage rate (per day)"]);

  if (nameIndex < 0) {
    return {
      employees: [],
      totalDataRows: 0,
      skippedRows: 0,
      error: 'Missing required "Name" column.',
    };
  }

  if (workDateIndex < 0) {
    return {
      employees: [],
      totalDataRows: 0,
      skippedRows: 0,
      error: 'Missing required "Work date" column. Use your portal timecard export.',
    };
  }

  const byName = new Map<string, ParsedEmployeeImportRow>();
  let totalDataRows = 0;
  let skippedRows = 0;

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (line.startsWith("+") || line.startsWith("|")) {
      skippedRows += 1;
      continue;
    }

    const fields = parseCsvLine(line);
    const name = (fields[nameIndex] ?? "").trim();
    const workDate = (fields[workDateIndex] ?? "").trim();

    if (!isEmployeeTimecardRow(name, workDate)) {
      skippedRows += 1;
      continue;
    }

    totalDataRows += 1;
    const key = normalizeNameKey(name);
    const position =
      roleIndex >= 0 ? (fields[roleIndex] ?? "").trim() || null : null;
    const payrollId =
      payrollIdIndex >= 0
        ? (fields[payrollIdIndex] ?? "").trim() || null
        : null;
    const monthlySalary =
      monthlySalaryIndex >= 0
        ? parseMoney(fields[monthlySalaryIndex])
        : null;
    const dailyWage =
      dailyWageIndex >= 0 ? parseMoney(fields[dailyWageIndex]) : null;
    const hourlyRate = hourlyRateFromDailyWage(dailyWage);

    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, {
        fullName: name.trim().replace(/\s+/g, " "),
        position,
        payrollId,
        hourlyRate,
        monthlySalary,
      });
      continue;
    }

    if (!existing.position && position) existing.position = position;
    if (!existing.payrollId && payrollId) existing.payrollId = payrollId;
    if (existing.hourlyRate == null && hourlyRate != null) {
      existing.hourlyRate = hourlyRate;
    }
    if (existing.monthlySalary == null && monthlySalary != null) {
      existing.monthlySalary = monthlySalary;
    }
  }

  const employees = [...byName.values()].sort((a, b) =>
    a.fullName.localeCompare(b.fullName)
  );

  if (employees.length === 0) {
    return {
      employees: [],
      totalDataRows,
      skippedRows,
      error: "No employees found in this CSV.",
    };
  }

  return { employees, totalDataRows, skippedRows };
}

export function employeeImportPinsToCsv(
  rows: Array<{ fullName: string; pin: string; position: string | null }>
) {
  const header = ["Name", "Position", "PIN"];
  const lines = [
    header.join(","),
    ...rows.map((row) => {
      const escape = (value: string) =>
        /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
      return [
        escape(row.fullName),
        escape(row.position ?? ""),
        escape(row.pin),
      ].join(",");
    }),
  ];
  return lines.join("\n");
}
