"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type LogoDropzoneProps = {
  name?: string;
  existingLogoUrl?: string | null;
  onFileChange?: (file: File | undefined) => void;
  error?: string;
};

export function LogoDropzone({
  name = "logo",
  existingLogoUrl,
  onFileChange,
  error,
}: LogoDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file || !inputRef.current) return;

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    inputRef.current.files = dataTransfer.files;
    setFileName(file.name);
    onFileChange?.(file);
  }

  return (
    <div>
      <Label htmlFor={name} className="text-[var(--eb-text)]">
        Company logo{" "}
        <span className="font-normal text-[var(--eb-muted)]">(optional)</span>
      </Label>

      {existingLogoUrl ? (
        <p className="mt-1 text-xs text-[var(--eb-muted)]">
          You already have a logo saved. Upload a new file to replace it.
        </p>
      ) : null}

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition",
          error
            ? "border-red-400/60 bg-red-950/20"
            : dragOver
              ? "border-[var(--eb-accent)] bg-[var(--eb-accent)]/10"
              : "border-[var(--eb-border)] bg-[var(--eb-elevated)]/40 hover:border-[var(--eb-accent)]/50"
        )}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="flex size-12 items-center justify-center rounded-full border border-[var(--eb-border)] bg-[var(--eb-surface)] text-[var(--eb-accent)]">
          <Upload className="size-5" aria-hidden />
        </div>
        <p className="mt-3 text-sm font-semibold text-[var(--eb-text)]">
          Drag and drop your logo
        </p>
        <p className="mt-1 text-xs text-[var(--eb-muted)]">
          or click to browse · PNG, JPG, WebP, GIF · max 2 MB
        </p>
        {fileName ? (
          <p className="mt-3 rounded-full border border-[var(--eb-border)] bg-[var(--eb-surface)] px-3 py-1 text-xs font-medium text-[var(--eb-accent)]">
            {fileName}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="mt-2 text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <input
        ref={inputRef}
        id={name}
        name={onFileChange ? undefined : name}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  );
}

