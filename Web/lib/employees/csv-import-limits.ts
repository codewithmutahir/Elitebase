/** Must stay in sync with `serverActions.bodySizeLimit` in next.config.ts */
export const MAX_EMPLOYEE_CSV_BYTES = 5 * 1024 * 1024;

export const MAX_EMPLOYEE_CSV_MB = 5;

export const CSV_FILE_TOO_LARGE_MESSAGE = `That CSV is too large. Use a file under ${MAX_EMPLOYEE_CSV_MB} MB or split the import into smaller batches.`;

export function csvTextByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function validateCsvFile(file: File): string | null {
  if (file.size > MAX_EMPLOYEE_CSV_BYTES) {
    return CSV_FILE_TOO_LARGE_MESSAGE;
  }
  return null;
}

export function validateCsvText(text: string): string | null {
  if (csvTextByteLength(text) > MAX_EMPLOYEE_CSV_BYTES) {
    return CSV_FILE_TOO_LARGE_MESSAGE;
  }
  return null;
}
