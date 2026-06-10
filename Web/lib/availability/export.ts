import { GRID_DAYS } from "@/lib/availability/week";
import { cellExportLabel } from "@/lib/availability/format";
import type {
  AvailabilityByEmployee,
  EmployeeAvailabilityRow,
} from "@/lib/availability/queries";

export function buildAvailabilityCsv(
  employees: EmployeeAvailabilityRow[],
  availability: AvailabilityByEmployee
): string {
  const headers = [
    "Employee",
    "Department",
    ...GRID_DAYS.map((d) => d.label),
  ];

  const escape = (value: string) => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const lines = [headers.map(escape).join(",")];

  for (const employee of employees) {
    const byDay = availability[employee.id] ?? {};
    const row = [
      employee.full_name,
      employee.department ?? "",
      ...GRID_DAYS.map((day) =>
        cellExportLabel(byDay[day.dayOfWeek])
      ),
    ];
    lines.push(row.map(escape).join(","));
  }

  return lines.join("\n");
}

export function downloadAvailabilityCsv(
  employees: EmployeeAvailabilityRow[],
  availability: AvailabilityByEmployee,
  filename: string
) {
  const csv = buildAvailabilityCsv(employees, availability);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
