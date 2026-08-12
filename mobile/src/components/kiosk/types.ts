export type KioskScanState =
  | "idle"
  | "capturing"
  | "detecting"
  | "processing"
  | "success"
  | "failed_no_face"
  | "failed_multiple"
  | "failed_too_small"
  | "failed_no_match"
  | "failed_service";
