"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CheckCircle2, Circle, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  portalClockPunch,
  portalEnrollFace,
} from "@/app/portal/(app)/clock/actions";
import type { PortalClockStatus } from "@/lib/portal/clock";
import { isLikelyMobileDevice } from "@/lib/portal/device";
import { getUserFacingError } from "@/lib/errors/user-facing";
import type { PunchLocationSource } from "@/lib/worksites/punch-location";
import { resolvePunchLocation } from "@/lib/worksites/punch-location";

type PortalClockViewProps = {
  status: PortalClockStatus;
};

type GpsState = {
  lat: number;
  lng: number;
  accuracy: number | null;
  source: PunchLocationSource;
} | null;

type PunchPhase = "idle" | "location" | "face";

const ENROLL_SAMPLE_COUNT = 3;
const ENROLL_SAMPLE_GAP_MS = 350;
const ENROLL_BANNER_KEY = "elitebase-portal-face-enrolled";
const MOBILE_TIP_DISMISS_KEY = "elitebase-portal-mobile-tip-dismissed";
/** Prefer a warm fix from page load if still fresh at punch. */
const GPS_WARM_MAX_AGE_MS = 120_000;

export function PortalClockView({ status }: PortalClockViewProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const gpsAtRef = useRef<number>(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraRetryKey, setCameraRetryKey] = useState(0);
  const [gps, setGps] = useState<GpsState>(null);
  const [gpsStatus, setGpsStatus] = useState<
    "idle" | "ready" | "approx" | "skipped" | "required_fail"
  >("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showMobileTip, setShowMobileTip] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [punchPhase, setPunchPhase] = useState<PunchPhase>("idle");
  const [pending, startTransition] = useTransition();
  const punchInFlight = useRef(false);

  const needsFaceEnroll = status.needsReenrollment || !status.hasFace;
  const canUseCamera = status.allowRemotePunch;
  const punchBusy = punchPhase !== "idle";
  const canPunch = cameraReady && !pending && !punchBusy;

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  useEffect(() => {
    if (needsFaceEnroll) return;
    const id = window.setTimeout(() => {
      try {
        if (sessionStorage.getItem(ENROLL_BANNER_KEY) === "1") {
          sessionStorage.removeItem(ENROLL_BANNER_KEY);
          setMessage(
            "Face saved. Tap Clock in — we check location once, verify your face, and record the punch."
          );
        }
      } catch {
        /* ignore */
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [needsFaceEnroll]);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (!canUseCamera) return;
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setCameraError(
          "This browser cannot access the camera. Use Chrome/Edge on HTTPS or localhost."
        );
        return;
      }

      setCameraReady(false);
      setCameraError(null);

      // Progressive constraints: strict → simple. OverconstrainedError is common
      // on desktop webcams when facingMode + fixed resolution are required.
      const attempts: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: "user",
            width: { ideal: 720 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        {
          video: { facingMode: "user" },
          audio: false,
        },
        { video: true, audio: false },
      ];

      let stream: MediaStream | null = null;
      let lastError: unknown = null;

      for (const constraints of attempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!stream) {
        if (cancelled) return;
        setCameraError(cameraErrorMessage(lastError, needsFaceEnroll));
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        try {
          await video.play();
        } catch {
          // autoplay can fail until a gesture; tracks are live — still usable
        }
      }
      setCameraReady(true);
      setCameraError(null);
    }

    void startCamera();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [canUseCamera, needsFaceEnroll, stopCamera, cameraRetryKey]);

  const applyLocation = useCallback(
    (result: {
      lat: number;
      lng: number;
      accuracy: number | null;
      source: PunchLocationSource;
    }) => {
      setGps(result);
      gpsAtRef.current = Date.now();
      setGpsError(null);
      setGpsStatus(result.source === "ip" ? "approx" : "ready");
    },
    []
  );

  useEffect(() => {
    const desktop = !isLikelyMobileDevice();
    setIsDesktop(desktop);
    if (!desktop) {
      setShowMobileTip(false);
      return;
    }
    try {
      setShowMobileTip(sessionStorage.getItem(MOBILE_TIP_DISMISS_KEY) !== "1");
    } catch {
      setShowMobileTip(true);
    }
  }, []);

  /** Warm GPS (then IP if geofence optional) while the employee looks at the camera. */
  useEffect(() => {
    if (!status.allowRemotePunch || needsFaceEnroll) return;
    let cancelled = false;

    void (async () => {
      const result = await resolvePunchLocation({
        requireGeofence: status.requireGeofence,
        mode: status.requireGeofence ? "full" : "quick",
      });
      if (cancelled) return;

      if ("skipped" in result) {
        setGps(null);
        setGpsStatus("skipped");
        setGpsError(null);
        return;
      }
      if ("error" in result) {
        setGps(null);
        setGpsStatus("required_fail");
        setGpsError(result.error);
        return;
      }
      applyLocation(result);
    })();

    return () => {
      cancelled = true;
    };
  }, [status.allowRemotePunch, status.requireGeofence, needsFaceEnroll, applyLocation]);

  function captureFrame(): Blob | null {
    const video = videoRef.current;
    if (!video || !cameraReady) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const binary = atob(dataUrl.split(",")[1] ?? "");
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: "image/jpeg" });
  }

  async function captureEnrollSamples(): Promise<Blob[] | null> {
    const samples: Blob[] = [];
    for (let i = 0; i < ENROLL_SAMPLE_COUNT; i += 1) {
      const blob = captureFrame();
      if (!blob) return null;
      samples.push(blob);
      if (i < ENROLL_SAMPLE_COUNT - 1) {
        await new Promise((resolve) => setTimeout(resolve, ENROLL_SAMPLE_GAP_MS));
      }
    }
    return samples;
  }

  function enroll() {
    setError(null);
    setMessage(null);
    if (pending || punchInFlight.current) return;
    if (!consent) {
      setError("Confirm biometric consent to enroll your face.");
      return;
    }

    punchInFlight.current = true;
    startTransition(async () => {
      try {
        const samples = await captureEnrollSamples();
        if (!samples?.length) {
          setError(cameraError || "Camera is not ready.");
          return;
        }

        const formData = new FormData();
        formData.set("consent", "true");
        samples.forEach((blob, index) => {
          formData.append("files", blob, `face-${index + 1}.jpg`);
        });

        const result = await portalEnrollFace(formData);
        if ("error" in result && result.error) {
          setError(result.error);
          return;
        }
        if ("ok" in result && result.ok) {
          try {
            sessionStorage.setItem(ENROLL_BANNER_KEY, "1");
          } catch {
            /* ignore */
          }
          setMessage("Face saved. Loading clock-in…");
          router.refresh();
        }
      } catch (caught) {
        setError(getUserFacingError(caught));
      } finally {
        punchInFlight.current = false;
      }
    });
  }

  function punch(type: "clock_in" | "clock_out" | "break_start" | "break_end") {
    setError(null);
    setMessage(null);

    if (pending || punchInFlight.current || punchPhase !== "idle") return;

    const blob = captureFrame();
    if (!blob) {
      setError(cameraError || "Camera is not ready.");
      return;
    }

    punchInFlight.current = true;

    // Keep phase updates outside startTransition so labels paint immediately.
    void (async () => {
      try {
        let coords = gps;
        const warmAge = Date.now() - gpsAtRef.current;
        const warmGpsOk =
          coords != null &&
          coords.source === "gps" &&
          warmAge >= 0 &&
          warmAge < GPS_WARM_MAX_AGE_MS;
        const warmAnyOk =
          coords != null &&
          warmAge >= 0 &&
          warmAge < GPS_WARM_MAX_AGE_MS &&
          !status.requireGeofence;
        const warmOk = status.requireGeofence ? warmGpsOk : warmAnyOk;

        if (!warmOk) {
          setPunchPhase("location");
          const result = await resolvePunchLocation({
            requireGeofence: status.requireGeofence,
            mode: status.requireGeofence ? "full" : "quick",
          });

          if ("skipped" in result) {
            setGps(null);
            setGpsStatus("skipped");
            setGpsError(null);
            coords = null;
          } else if ("error" in result) {
            setGpsStatus("required_fail");
            setGpsError(result.error);
            const mobileHint = isDesktop
              ? " For a reliable GPS fix, open this page on your phone."
              : "";
            setError(`${result.error}${mobileHint}`);
            return;
          } else {
            applyLocation(result);
            coords = result;
          }
        }

        if (!coords && status.requireGeofence) {
          const mobileHint = isDesktop
            ? " Open /portal/clock on your phone for GPS."
            : "";
          setError(
            (gpsError ||
              "Location is required for your company. Try again from a phone with GPS.") +
              mobileHint
          );
          return;
        }

        setPunchPhase("face");
        const idempotencyKey = crypto.randomUUID();
        const formData = new FormData();
        formData.set("type", type);
        formData.set("idempotencyKey", idempotencyKey);
        if (coords) {
          formData.set("lat", String(coords.lat));
          formData.set("lng", String(coords.lng));
          if (coords.accuracy != null) {
            formData.set("accuracy", String(coords.accuracy));
          }
        }
        formData.set("file", blob, "face.jpg");

        const result = await portalClockPunch(formData);
        if ("error" in result && result.error) {
          setError(result.error);
          return;
        }
        if ("ok" in result && result.ok) {
          const site = result.worksiteName
            ? ` at ${result.worksiteName}`
            : "";
          setGpsError(null);
          const locNote =
            coords?.source === "gps"
              ? ""
              : coords?.source === "ip"
                ? " Approximate network location was saved."
                : " Location was not available, so it was not saved.";
          setMessage(
            `${prettyAction(result.type)} recorded${site}. Face matched (${result.faceScore}).${locNote}`
          );
          router.refresh();
        }
      } catch (caught) {
        setError(getUserFacingError(caught));
      } finally {
        setPunchPhase("idle");
        punchInFlight.current = false;
      }
    })();
  }

  if (!status.allowRemotePunch) {
    return (
      <Panel>
        <Typography sx={{ color: "text.secondary" }}>
          Remote clock-in is turned off for your company. Use the on-site
          kiosk, or ask your manager to enable portal punch in Settings.
        </Typography>
      </Panel>
    );
  }

  if (status.requireGeofence && !status.hasWorksites && !needsFaceEnroll) {
    return (
      <Panel>
        <Typography sx={{ color: "text.secondary" }}>
          Your company has not set a worksite location yet. Ask your manager to
          add one under Settings → Locations.
        </Typography>
      </Panel>
    );
  }

  if (needsFaceEnroll) {
    return (
      <Stack spacing={2.5}>
        {showMobileTip ? (
          <MobileRecommendBanner
            requireGeofence={status.requireGeofence}
            onDismiss={() => {
              try {
                sessionStorage.setItem(MOBILE_TIP_DISMISS_KEY, "1");
              } catch {
                /* ignore */
              }
              setShowMobileTip(false);
            }}
          />
        ) : null}
        <StepsCard
          steps={[
            { label: "Enroll face", done: false, active: true },
            { label: "Clock in (location + face verify)", done: false },
          ]}
        />
        <Panel>
          <Typography sx={{ fontWeight: 560, color: "text.primary" }}>
            {status.needsReenrollment
              ? "Re-enroll your face"
              : "Enroll your face"}
          </Typography>
          <Typography
            sx={{ mt: 0.75, color: "text.secondary", fontSize: "0.875rem" }}
          >
            Look at the camera in good light, check consent, then save. After
            that you can clock in — we check location once and verify your face.
          </Typography>
        </Panel>

        <CameraPreview
          videoRef={videoRef}
          cameraReady={cameraReady}
          cameraError={cameraError}
          onRetry={() => setCameraRetryKey((k) => k + 1)}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              disabled={pending}
              color="primary"
            />
          }
          label="I consent to Elitebase storing a face template for clock-in verification."
          sx={{
            alignItems: "flex-start",
            m: 0,
            "& .MuiFormControlLabel-label": {
              fontSize: "0.875rem",
              color: "text.secondary",
              pt: 0.5,
            },
          }}
        />

        {error ? (
          <Typography role="alert" sx={{ color: "error.main", fontSize: "0.875rem" }}>
            {error}
          </Typography>
        ) : null}
        {message ? (
          <Typography role="status" sx={{ color: "success.main", fontSize: "0.875rem" }}>
            {message}
          </Typography>
        ) : null}

        <ClockButton
          disabled={pending || !cameraReady || !consent}
          onClick={enroll}
          label={pending ? "Saving face…" : "Save face enrollment"}
          primary
        />
      </Stack>
    );
  }

  if (status.requireGeofence && !status.hasWorksites) {
    return (
      <Panel>
        <Typography sx={{ color: "text.secondary" }}>
          Your company has not set a worksite location yet. Ask your manager to
          add one under Settings → Locations.
        </Typography>
      </Panel>
    );
  }

  const stateLabel = status.onBreak
    ? "On break"
    : status.isClockedIn
      ? "Clocked in"
      : "Clocked out";

  const punchBlockedReason = !cameraReady
    ? cameraError || "Waiting for camera…"
    : null;

  const actionLabel = (idle: string) => {
    if (punchPhase === "location") return "Getting location…";
    if (punchPhase === "face") return "Verifying face…";
    return idle;
  };

  const locationHint = (() => {
    if (punchBusy && punchPhase === "location") {
      return "Getting location…";
    }
    if (gpsStatus === "ready" && gps) {
      return `GPS ready${gps.accuracy != null ? ` (±${Math.round(gps.accuracy)}m)` : ""}.`;
    }
    if (gpsStatus === "approx" && gps) {
      return "Approximate network location ready (desktop GPS often unavailable).";
    }
    if (gpsStatus === "skipped") {
      return "No location available — punch continues without it.";
    }
    if (gpsStatus === "required_fail" && gpsError) {
      return gpsError;
    }
    if (gpsStatus === "idle") {
      return "Preparing location in the background…";
    }
    return null;
  })();

  return (
    <Stack spacing={2.5}>
      {showMobileTip ? (
        <MobileRecommendBanner
          requireGeofence={status.requireGeofence}
          onDismiss={() => {
            try {
              sessionStorage.setItem(MOBILE_TIP_DISMISS_KEY, "1");
            } catch {
              /* ignore */
            }
            setShowMobileTip(false);
          }}
        />
      ) : null}

      <StepsCard
        steps={[
          { label: "Face enrolled", done: true },
          {
            label: "Clock in (location + face verify)",
            done: false,
            active: cameraReady,
          },
        ]}
      />

      <Panel>
        <Typography sx={{ fontWeight: 560, color: "text.primary" }}>
          Status: {stateLabel}
        </Typography>
        <Typography sx={{ mt: 0.75, color: "text.secondary", fontSize: "0.875rem" }}>
          Face is saved. Tap an action below — we verify your face
          {status.requireGeofence
            ? " and require GPS inside a worksite."
            : ", then save GPS or approximate network location when available."}
        </Typography>
        {locationHint ? (
          <Typography
            sx={{
              mt: 0.75,
              fontSize: "0.8125rem",
              color:
                gpsStatus === "required_fail" ? "warning.main" : "text.secondary",
            }}
          >
            {locationHint}
          </Typography>
        ) : null}
      </Panel>

      <CameraPreview
        videoRef={videoRef}
        cameraReady={cameraReady}
        cameraError={cameraError}
        onRetry={() => setCameraRetryKey((k) => k + 1)}
      />

      {error ? (
        <Typography role="alert" sx={{ color: "error.main", fontSize: "0.875rem" }}>
          {error}
        </Typography>
      ) : null}
      {message ? (
        <Typography role="status" sx={{ color: "success.main", fontSize: "0.875rem" }}>
          {message}
        </Typography>
      ) : null}

      {punchBlockedReason && !pending ? (
        <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
          {punchBlockedReason}
        </Typography>
      ) : null}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
        {status.allowedActions.includes("clock_in") ? (
          <ClockButton
            disabled={!canPunch}
            onClick={() => punch("clock_in")}
            label={actionLabel("Clock in")}
            primary
          />
        ) : null}
        {status.allowedActions.includes("clock_out") ? (
          <ClockButton
            disabled={!canPunch}
            onClick={() => punch("clock_out")}
            label={actionLabel("Clock out")}
            primary
          />
        ) : null}
        {status.allowedActions.includes("break_start") ? (
          <ClockButton
            disabled={!canPunch}
            onClick={() => punch("break_start")}
            label={actionLabel("Start break")}
          />
        ) : null}
        {status.allowedActions.includes("break_end") ? (
          <ClockButton
            disabled={!canPunch}
            onClick={() => punch("break_end")}
            label={actionLabel("End break")}
          />
        ) : null}
      </Stack>
    </Stack>
  );
}

function prettyAction(type: string) {
  return type.replaceAll("_", " ");
}

function MobileRecommendBanner({
  requireGeofence,
  onDismiss,
}: {
  requireGeofence: boolean;
  onDismiss: () => void;
}) {
  return (
    <Box
      role="note"
      sx={{
        display: "flex",
        gap: 1.5,
        alignItems: "flex-start",
        borderRadius: "14px",
        border: "1px solid",
        borderColor: requireGeofence ? "warning.main" : "divider",
        bgcolor: "background.paper",
        px: 2,
        py: 1.75,
      }}
    >
      <Box
        sx={{
          mt: 0.15,
          color: requireGeofence ? "warning.main" : "primary.main",
          flexShrink: 0,
        }}
      >
        <Smartphone size={20} aria-hidden />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: "text.primary" }}>
          {requireGeofence
            ? "Use your phone for clock-in"
            : "Phone recommended for better location"}
        </Typography>
        <Typography
          sx={{ mt: 0.4, fontSize: "0.8125rem", color: "text.secondary", lineHeight: 1.45 }}
        >
          {requireGeofence
            ? "Your company requires GPS inside a worksite. Desktop browsers often can’t get a fix — open this portal on your phone for reliable clock-in."
            : "You’re on a desktop. GPS is more reliable on a phone. We’ll still try network location here if GPS isn’t available."}
        </Typography>
      </Box>
      <Button
        type="button"
        size="small"
        onClick={onDismiss}
        sx={{
          flexShrink: 0,
          textTransform: "none",
          minWidth: 0,
          color: "text.secondary",
        }}
      >
        Got it
      </Button>
    </Box>
  );
}

function StepsCard({
  steps,
}: {
  steps: { label: string; done?: boolean; active?: boolean }[];
}) {
  return (
    <Panel>
      <Stack spacing={1}>
        {steps.map((step, index) => (
          <Stack
            key={step.label}
            direction="row"
            spacing={1.25}
            sx={{ alignItems: "center" }}
          >
            {step.done ? (
              <CheckCircle2
                size={18}
                aria-hidden
                style={{ color: "var(--eb-gold-500)", flexShrink: 0 }}
              />
            ) : (
              <Circle
                size={18}
                aria-hidden
                style={{
                  color: step.active
                    ? "var(--eb-gold-500)"
                    : "var(--eb-muted)",
                  flexShrink: 0,
                }}
              />
            )}
            <Typography
              sx={{
                fontSize: "0.875rem",
                fontWeight: step.active || step.done ? 600 : 400,
                color: step.done || step.active ? "text.primary" : "text.secondary",
              }}
            >
              {index + 1}. {step.label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Panel>
  );
}

function cameraErrorMessage(err: unknown, needsFaceEnroll: boolean): string {
  const name =
    err && typeof err === "object" && "name" in err
      ? String((err as { name: string }).name)
      : "";

  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Camera permission is blocked. Click the camera icon in the address bar → Allow, then tap Retry camera.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No camera found. Plug in a webcam or use a device with a camera.";
    case "NotReadableError":
    case "TrackStartError":
      return "Camera is busy (another tab/app like Zoom/Teams may be using it). Close that app, then tap Retry camera.";
    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
      return "This camera rejected the requested settings. Tap Retry camera.";
    case "SecurityError":
      return "Camera needs HTTPS or localhost. Open the app on a secure URL.";
    default:
      return needsFaceEnroll
        ? "Camera access is required to enroll your face. Allow camera, then tap Retry camera."
        : "Camera access is required for face clock-in. Allow camera, then tap Retry camera.";
  }
}

function CameraPreview({
  videoRef,
  cameraReady,
  cameraError,
  onRetry,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraReady: boolean;
  cameraError: string | null;
  onRetry?: () => void;
}) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "16px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "#000",
        aspectRatio: "3 / 4",
        maxHeight: 420,
      }}
    >
      <Box
        component="video"
        ref={videoRef}
        muted
        playsInline
        autoPlay
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scaleX(-1)",
        }}
      />
      {!cameraReady && !cameraError ? (
        <Skeleton
          variant="rectangular"
          animation="wave"
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            height: "100%",
            transform: "none",
            bgcolor: "rgba(255,255,255,0.08)",
          }}
        />
      ) : null}
      {!cameraReady ? (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "grey.300",
            px: 2,
            textAlign: "center",
            gap: 1.5,
          }}
        >
          <Typography component="p" sx={{ fontSize: "0.875rem", color: "grey.300" }}>
            {cameraError || "Starting camera…"}
          </Typography>
          {cameraError && onRetry ? (
            <Button
              type="button"
              variant="outlined"
              size="small"
              onClick={onRetry}
              sx={{
                textTransform: "none",
                borderColor: "rgba(255,255,255,0.35)",
                color: "grey.100",
                "&:hover": {
                  borderColor: "rgba(255,255,255,0.55)",
                  bgcolor: "rgba(255,255,255,0.06)",
                },
              }}
            >
              Retry camera
            </Button>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        borderRadius: "14px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        px: 2.25,
        py: 2,
      }}
    >
      {children}
    </Box>
  );
}

function ClockButton({
  label,
  onClick,
  disabled,
  primary,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={primary ? "contained" : "outlined"}
      sx={{
        flex: 1,
        borderRadius: 999,
        textTransform: "none",
        py: 1.25,
        ...(primary
          ? {
              bgcolor: "primary.main",
              color: "primary.contrastText",
              "&:hover": { bgcolor: "primary.dark" },
            }
          : {
              borderColor: "divider",
              color: "text.primary",
            }),
      }}
    >
      {label}
    </Button>
  );
}
