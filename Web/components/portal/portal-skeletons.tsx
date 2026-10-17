"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { portalPanelSx } from "@/lib/portal/styles";

const boneSx = {
  bgcolor: "rgba(15, 23, 42, 0.09)",
  ".dashboard-shell--dark &": {
    bgcolor: "rgba(255,255,255,0.10)",
  },
} as const;

const progressTrackSx = {
  height: 3,
  borderRadius: 999,
  bgcolor: "rgba(217,166,63,0.18)",
  ".dashboard-shell--dark &": {
    bgcolor: "rgba(217,166,63,0.12)",
  },
  "& .MuiLinearProgress-bar": {
    bgcolor: "primary.main",
  },
} as const;

/** High-contrast bone for light + dark dashboard shells (employer-grade readability). */
function Bone({
  width,
  height,
  radius = "8px",
  maxWidth,
}: {
  width: number | string;
  height: number;
  radius?: string | number;
  maxWidth?: number | string;
}) {
  return (
    <Skeleton
      variant="rounded"
      animation="wave"
      width={width}
      height={height}
      sx={{
        borderRadius: radius,
        maxWidth,
        ...boneSx,
      }}
    />
  );
}

function LoadingChrome({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Stack
      component="section"
      spacing={3}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      sx={{ minWidth: 0, width: "100%" }}
    >
      <LinearProgress aria-hidden sx={progressTrackSx} />
      {children}
    </Stack>
  );
}

export function PortalStatGridSkeleton({ count }: { count: number }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          sm:
            count >= 4
              ? "repeat(2, minmax(0, 1fr))"
              : `repeat(${Math.min(count, 3)}, minmax(0, 1fr))`,
          md:
            count >= 4
              ? "repeat(4, minmax(0, 1fr))"
              : `repeat(${count}, minmax(0, 1fr))`,
        },
      }}
    >
      {Array.from({ length: count }, (_, index) => (
        <Box key={index} sx={{ ...portalPanelSx, px: 2.25, py: 2 }}>
          <Bone width={88} height={14} />
          <Box sx={{ mt: 1.25 }}>
            <Bone width={112} height={28} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export function PortalTableSkeleton({
  columns,
  rows = 6,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <Box sx={{ ...portalPanelSx, overflow: "hidden", px: 2, py: 1 }}>
      <Stack spacing={1.75} sx={{ py: 1.25 }}>
        <Stack direction="row" spacing={2}>
          {Array.from({ length: columns }, (_, index) => (
            <Bone key={index} width={index === 0 ? 72 : 56} height={12} />
          ))}
        </Stack>
        {Array.from({ length: rows }, (_, row) => (
          <Stack
            key={row}
            direction="row"
            spacing={2}
            sx={{ alignItems: "center" }}
          >
            {Array.from({ length: columns }, (_, col) => (
              <Bone
                key={col}
                width={col === 0 ? "22%" : "14%"}
                height={16}
              />
            ))}
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

function PageHeadingSkeleton({ withAction = false }: { withAction?: boolean }) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      sx={{
        alignItems: { xs: "stretch", sm: "flex-end" },
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Bone width={160} height={28} />
        <Box sx={{ mt: 1.25 }}>
          <Bone width="100%" height={14} maxWidth={280} />
        </Box>
      </Box>
      {withAction ? <Bone width={180} height={40} radius="10px" /> : null}
    </Stack>
  );
}

export function PortalMonthDataSkeleton({
  stats,
  columns,
}: {
  stats: number;
  columns: number;
}) {
  return (
    <Stack
      spacing={3}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading month"
    >
      <PortalStatGridSkeleton count={stats} />
      <PortalTableSkeleton columns={columns} />
    </Stack>
  );
}

export function PortalHomeSkeleton() {
  return (
    <LoadingChrome label="Loading home">
      <Box
        sx={{
          ...portalPanelSx,
          borderRadius: "18px",
          px: { xs: 2.5, sm: 3.5 },
          py: { xs: 3, sm: 3.5 },
        }}
      >
        <Bone width={72} height={14} />
        <Box sx={{ mt: 1.5 }}>
          <Bone width={240} height={32} />
        </Box>
        <Box sx={{ mt: 1.5 }}>
          <Bone width="100%" height={16} maxWidth={420} />
        </Box>
        <Box sx={{ mt: 2.5 }}>
          <Bone width={132} height={42} radius={999} />
        </Box>
      </Box>
      <PortalStatGridSkeleton count={3} />
      <Box sx={{ ...portalPanelSx, px: 2.5, py: 2.25 }}>
        <Bone width={140} height={18} />
        <Box
          sx={{
            mt: 2,
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr 1fr",
              sm: "repeat(4, minmax(0, 1fr))",
            },
          }}
        >
          {Array.from({ length: 4 }, (_, index) => (
            <Stack key={index} spacing={1}>
              <Bone width={48} height={12} />
              <Bone width={72} height={20} />
            </Stack>
          ))}
        </Box>
      </Box>
    </LoadingChrome>
  );
}

export function PortalClockSkeleton() {
  return (
    <LoadingChrome label="Loading clock">
      <Box>
        <Bone width={180} height={28} />
        <Box sx={{ mt: 1.25 }}>
          <Bone width="100%" height={14} maxWidth={420} />
        </Box>
      </Box>
      <Box sx={{ ...portalPanelSx, px: 2.25, py: 2 }}>
        <Bone width={120} height={18} />
        <Box sx={{ mt: 1 }}>
          <Bone width={220} height={14} />
        </Box>
      </Box>
      <Skeleton
        variant="rounded"
        animation="wave"
        sx={{
          width: "100%",
          maxWidth: 360,
          aspectRatio: "3 / 4",
          maxHeight: 420,
          borderRadius: "16px",
          ...boneSx,
        }}
      />
      <Bone width={140} height={42} radius={999} />
    </LoadingChrome>
  );
}

export function PortalRecordPageSkeleton({
  stats,
  columns,
}: {
  stats: number;
  columns: number;
}) {
  return (
    <LoadingChrome label="Loading records">
      <PageHeadingSkeleton withAction />
      <PortalMonthDataSkeleton stats={stats} columns={columns} />
    </LoadingChrome>
  );
}

export function PortalLeaveSkeleton() {
  return (
    <LoadingChrome label="Loading leave">
      <PageHeadingSkeleton />
      <PortalStatGridSkeleton count={2} />
      <Box sx={{ ...portalPanelSx, px: 2.25, py: 2.25 }}>
        <Bone width={140} height={18} />
        <Box sx={{ mt: 1 }}>
          <Bone width={260} height={14} />
        </Box>
        <Stack spacing={1.75} sx={{ mt: 2.5 }}>
          <Bone width="100%" height={42} radius="10px" />
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            }}
          >
            <Bone width="100%" height={42} radius="10px" />
            <Bone width="100%" height={42} radius="10px" />
          </Box>
          <Bone width="100%" height={88} radius="10px" />
          <Bone width={148} height={40} radius={999} />
        </Stack>
      </Box>
      <PortalTableSkeleton columns={4} rows={3} />
    </LoadingChrome>
  );
}

export function PortalBenefitListSkeleton() {
  return (
    <Stack
      spacing={1.5}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading benefits"
    >
      {Array.from({ length: 3 }, (_, index) => (
        <Box key={index} sx={{ ...portalPanelSx, px: 2.25, py: 2 }}>
          <Bone width={160} height={18} />
          <Box sx={{ mt: 1 }}>
            <Bone width={120} height={14} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

export function PortalBenefitSkeleton() {
  return (
    <LoadingChrome label="Loading benefits">
      <PageHeadingSkeleton />
      <PortalBenefitListSkeleton />
    </LoadingChrome>
  );
}

export function PortalPayslipSkeleton() {
  return (
    <LoadingChrome label="Loading payslips">
      <PageHeadingSkeleton />
      <PortalTableSkeleton columns={4} rows={4} />
    </LoadingChrome>
  );
}
