"use client";

import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastSeverity = "success" | "error" | "info" | "warning";

type ToastMessage = {
  id: number;
  message: string;
  severity: ToastSeverity;
};

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
};

type ToastListener = (toast: ToastMessage) => void;

const listeners = new Set<ToastListener>();
let toastId = 0;

function emit(message: string, severity: ToastSeverity) {
  const next: ToastMessage = { id: ++toastId, message, severity };
  listeners.forEach((listener) => listener(next));
}

/** Imperative API matching prior Sonner usage (`toast.success` / `error` / `info`). */
export const toast: ToastApi = {
  success: (message) => emit(message, "success"),
  error: (message) => emit(message, "error"),
  info: (message) => emit(message, "info"),
  warning: (message) => emit(message, "warning"),
};

const ToastContext = createContext<ToastApi>(toast);

export function useToast() {
  return useContext(ToastContext);
}

type Position =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

function mapPosition(position: Position) {
  const [vertical, horizontal] = position.split("-") as [
    "top" | "bottom",
    "left" | "center" | "right",
  ];
  return { vertical, horizontal };
}

type ToasterProps = {
  position?: Position;
  /** Accepted for Sonner API compatibility; unused with MUI Alert. */
  richColors?: boolean;
  /** Accepted for Sonner API compatibility; Alert always shows a close control. */
  closeButton?: boolean;
  children?: ReactNode;
};

/**
 * Hosts the Snackbar queue. Mount once under ThemeProvider (e.g. dashboard shell).
 * Also exported as `ToastProvider` for clarity.
 */
function Toaster({
  position = "top-right",
  richColors: _richColors,
  closeButton: _closeButton,
  children,
}: ToasterProps) {
  void _richColors;
  void _closeButton;

  const [queue, setQueue] = useState<ToastMessage[]>([]);
  const current = queue[0] ?? null;

  const enqueue = useCallback((next: ToastMessage) => {
    setQueue((prev) => [...prev, next]);
  }, []);

  useEffect(() => {
    listeners.add(enqueue);
    return () => {
      listeners.delete(enqueue);
    };
  }, [enqueue]);

  const dismiss = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  const api = useMemo(() => toast, []);
  const anchorOrigin = mapPosition(position);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Snackbar
        open={Boolean(current)}
        autoHideDuration={4500}
        onClose={(_, reason) => {
          if (reason === "clickaway") return;
          dismiss();
        }}
        anchorOrigin={anchorOrigin}
      >
        {current ? (
          <Alert
            onClose={dismiss}
            severity={current.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {current.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ToastContext.Provider>
  );
}

const ToastProvider = Toaster;

export { Toaster, ToastProvider };
export type { ToasterProps, ToastSeverity };
