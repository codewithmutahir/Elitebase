export type ScanState =
  | "idle"
  | "detecting"
  | "scanning"
  | "processing"
  | "success"
  | "failed";

export type FacePhase = "idle" | "detecting" | "centered";

export type ApiPhase = "none" | "processing" | "success" | "failed";
