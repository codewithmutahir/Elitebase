"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type LogoDropzoneProps = {
  name?: string;
  existingLogoUrl?: string | null;
};

export function LogoDropzone({
  name = "logo",
  existingLogoUrl,
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
  }

  return (
    <div>
      <Label htmlFor={name}>
        Company logo{" "}
        <span className="font-normal text-slate-500">(optional)</span>
      </Label>

      {existingLogoUrl ? (
        <p className="mt-1 text-xs text-slate-500">
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
          dragOver
            ? "border-blue-400 bg-blue-50"
            : "border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/50"
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
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <Upload className="size-5" aria-hidden />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-900">
          Drag and drop your logo
        </p>
        <p className="mt-1 text-xs text-slate-500">
          or click to browse · PNG, JPG, WebP, GIF · max 2 MB
        </p>
        {fileName ? (
          <p className="mt-3 rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100">
            {fileName}
          </p>
        ) : null}
      </div>

      <input
        ref={inputRef}
        id={name}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  );
}

