import type { ApiPhase } from "@/components/face-id/types";

export type FaceIdScanExperienceProps = {
  title: string;
  employeeName: string;
  companyName: string;
  initials: string;
  avatarColor: string;
  successTitle: string;
  successSubtitle: string;
  apiPhase: ApiPhase;
  enabled?: boolean;
  resetKey?: number;
  onBack: () => void;
  onEmbedding: (embedding: number[]) => void;
  onCaptureFailed: () => void;
};
