"use client";

import { FileUp, Upload } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import {
  importEmployeesFromCsv,
  previewEmployeeCsvImport,
  type EmployeeImportPreviewResult,
  type EmployeeImportResult,
} from "@/app/(dashboard)/employees/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { employeeImportPinsToCsv } from "@/lib/employees/import-csv";

type Step = "upload" | "preview" | "result";

export function ImportEmployeesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<EmployeeImportPreviewResult | null>(
    null
  );
  const [result, setResult] = useState<EmployeeImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetState() {
    setStep("upload");
    setCsvText("");
    setFileName("");
    setPreview(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetState();
    onOpenChange(nextOpen);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(null);
    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setCsvText(text);
      startTransition(async () => {
        const nextPreview = await previewEmployeeCsvImport(text);
        if (nextPreview.error) {
          setError(nextPreview.error);
          setStep("upload");
          return;
        }
        setPreview(nextPreview);
        setStep("preview");
      });
    };
    reader.onerror = () => {
      setError("Could not read the CSV file.");
    };
    reader.readAsText(file);
  }

  function handleImport() {
    if (!csvText) return;
    setError(null);
    startTransition(async () => {
      const importResult = await importEmployeesFromCsv(csvText);
      if (importResult.error && importResult.created.length === 0) {
        setError(importResult.error);
        return;
      }
      setResult(importResult);
      setStep("result");
    });
  }

  function downloadPinsCsv() {
    if (!result?.created.length) return;
    const csv = employeeImportPinsToCsv(result.created);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "imported-employee-pins.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import employees from CSV</DialogTitle>
          <DialogDescription>
            Upload a timecard export from your previous portal. We extract unique
            employees by name and create kiosk PINs automatically.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {step === "upload" ? (
          <div className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
              <Upload className="size-8 text-slate-400" aria-hidden />
              <span className="mt-3 text-sm font-semibold text-slate-900">
                Choose CSV file
              </span>
              <span className="mt-1 text-xs text-slate-500">
                Supports portal exports with Name, Work date, Role, and wage
                columns
              </span>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
            {isPending ? (
              <p className="text-center text-sm text-slate-500">
                Reading CSV...
              </p>
            ) : null}
          </div>
        ) : null}

        {step === "preview" && preview ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900">{fileName}</p>
              <p className="mt-1">
                Found <strong>{preview.employees.length}</strong> employees from{" "}
                {preview.totalDataRows.toLocaleString()} timecard rows.
              </p>
              <p className="mt-1">
                Ready to import: <strong>{preview.toImportCount}</strong>
                {preview.existingCount > 0 ? (
                  <>
                    {" "}
                    · Skipping {preview.existingCount} already in Elitebase
                  </>
                ) : null}
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Name</th>
                    <th className="px-3 py-2 font-semibold">Position</th>
                    <th className="px-3 py-2 font-semibold">Rate/hr</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.employees.map((employee) => (
                    <tr
                      key={employee.fullName}
                      className="border-t border-slate-100"
                    >
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {employee.fullName}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {employee.position ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {employee.hourlyRate != null
                          ? employee.hourlyRate.toFixed(2)
                          : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {employee.alreadyExists ? (
                          <span className="text-xs font-semibold text-amber-700">
                            Exists
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-700">
                            New
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {step === "result" && result ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Imported <strong>{result.created.length}</strong> employee
              {result.created.length === 1 ? "" : "s"}.
              {result.skippedExisting.length > 0 ? (
                <>
                  {" "}
                  Skipped {result.skippedExisting.length} existing name
                  {result.skippedExisting.length === 1 ? "" : "s"}.
                </>
              ) : null}
            </div>

            {result.created.length > 0 ? (
              <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-white text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Name</th>
                      <th className="px-3 py-2 font-semibold">PIN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.created.map((row) => (
                      <tr key={row.id} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {row.fullName}
                        </td>
                        <td className="px-3 py-2 font-mono font-semibold tracking-widest text-slate-900">
                          {row.pin}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {result.failed.length > 0 ? (
              <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {result.failed.length} employee
                {result.failed.length === 1 ? "" : "s"} could not be imported.
              </p>
            ) : null}
          </div>
        ) : null}

        <DialogFooter className="sm:justify-between">
          {step === "result" && result?.created.length ? (
            <Button type="button" variant="outline" onClick={downloadPinsCsv}>
              <FileUp className="size-4" aria-hidden />
              Download PINs CSV
            </Button>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            {step === "preview" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetState}
                  disabled={isPending}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleImport}
                  disabled={isPending || !preview?.toImportCount}
                >
                  {isPending
                    ? "Importing..."
                    : `Import ${preview?.toImportCount ?? 0} employees`}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                {step === "result" ? "Done" : "Cancel"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ImportEmployeesTrigger({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <Button type="button" variant="outline" onClick={onClick}>
      <Upload className="size-4" aria-hidden />
      Import CSV
    </Button>
  );
}
