"use client";

import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormHelperText from "@mui/material/FormHelperText";
import Typography from "@mui/material/Typography";
import { useRef, useState } from "react";
import { muiAlpha } from "@/lib/mui/alpha";

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
    <Box>
      <Typography
        component="label"
        htmlFor={name}
        sx={{ fontSize: "0.875rem", fontWeight: 500, color: "text.primary" }}
      >
        Company logo{" "}
        <Box component="span" sx={{ fontWeight: 400, color: "text.secondary" }}>
          (optional)
        </Box>
      </Typography>

      {existingLogoUrl ? (
        <Typography
          sx={{ mt: 0.5, fontSize: "0.75rem", color: "text.secondary" }}
        >
          You already have a logo saved. Upload a new file to replace it.
        </Typography>
      ) : null}

      <Box
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
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        sx={{
          mt: 1,
          display: "flex",
          cursor: "pointer",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "12px",
          border: "2px dashed",
          borderColor: error
            ? (theme) => muiAlpha(theme, (p) => p.error.main, 0.6)
            : dragOver
              ? "var(--eb-gold-500)"
              : "divider",
          bgcolor: error
            ? (theme) => muiAlpha(theme, (p) => p.error.main, 0.08)
            : dragOver
              ? "color-mix(in srgb, var(--eb-gold-500) 10%, transparent)"
              : (theme) =>
                  muiAlpha(theme, (p) => p.background.paper, 0.4),
          px: 3,
          py: 5,
          textAlign: "center",
          transition: "border-color 150ms ease, background-color 150ms ease",
          "&:hover": {
            borderColor: error
              ? (theme) => muiAlpha(theme, (p) => p.error.main, 0.6)
              : "color-mix(in srgb, var(--eb-gold-500) 50%, transparent)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            width: 48,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            color: "var(--eb-gold-500)",
          }}
        >
          <CloudUploadOutlined fontSize="small" aria-hidden />
        </Box>
        <Typography
          sx={{
            mt: 1.5,
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "text.primary",
          }}
        >
          Drag and drop your logo
        </Typography>
        <Typography
          sx={{ mt: 0.5, fontSize: "0.75rem", color: "text.secondary" }}
        >
          or click to browse · PNG, JPG, WebP, GIF · max 2 MB
        </Typography>
        {fileName ? (
          <Chip
            label={fileName}
            size="small"
            sx={{
              mt: 1.5,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              color: "var(--eb-gold-500)",
              fontWeight: 500,
            }}
          />
        ) : null}
      </Box>

      {error ? (
        <FormHelperText error role="alert" sx={{ mt: 1, mx: 0 }}>
          {error}
        </FormHelperText>
      ) : null}

      <Box
        component="input"
        ref={inputRef}
        id={name}
        name={onFileChange ? undefined : name}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(event) =>
          handleFiles((event.target as HTMLInputElement).files)
        }
        sx={{
          position: "absolute",
          width: 1,
          height: 1,
          p: 0,
          m: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      />
    </Box>
  );
}
