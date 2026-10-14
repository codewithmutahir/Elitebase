"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  createWorksite,
  deleteWorksite,
  updateRemotePunchSettings,
  updateWorksite,
} from "@/app/(dashboard)/settings/locations/actions";
import { PendingButton } from "@/components/dashboard/pending-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  dashboardAlertErrorSx,
  dashboardAlertSuccessSx,
  dashboardCardSx,
  dashboardPageIntroSx,
  dashboardSectionTitleSx,
} from "@/lib/dashboard/sx";
import { getUserFacingError } from "@/lib/errors/user-facing";
import { requestBrowserLocation } from "@/lib/worksites/browser-location";
import { parseLatLngPaste } from "@/lib/worksites/geo";
import type { WorksiteRow } from "@/lib/worksites/queries";

type LocationsSettingsProps = {
  allowRemotePunch: boolean;
  requireGeofence: boolean;
  worksites: WorksiteRow[];
};

export function LocationsSettings({
  allowRemotePunch,
  requireGeofence,
  worksites,
}: LocationsSettingsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("Main location");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("150");
  const [locating, setLocating] = useState(false);
  const [locationHint, setLocationHint] = useState<string | null>(null);
  const [pasteCoords, setPasteCoords] = useState("");

  function applyPastedCoords() {
    setError(null);
    setSuccess(null);
    const parsed = parseLatLngPaste(pasteCoords);
    if (!parsed) {
      setError(
        "Paste coordinates like 40.712800, -74.006000 (from Google Maps right‑click)."
      );
      return;
    }
    setLat(parsed.lat.toFixed(6));
    setLng(parsed.lng.toFixed(6));
    setLocationHint("Coordinates applied from paste. Review and add the worksite.");
    setPasteCoords("");
  }

  async function useMyLocation() {
    if (locating) return;

    setError(null);
    setSuccess(null);
    setLocationHint(null);
    setLocating(true);

    try {
      const result = await requestBrowserLocation();
      if ("error" in result) {
        setError(result.error);
        return;
      }

      setLat(result.lat.toFixed(6));
      setLng(result.lng.toFixed(6));
      const accuracy =
        result.accuracy != null
          ? ` (±${Math.round(result.accuracy)}m)`
          : "";
      setLocationHint(
        `Location filled${accuracy}. Review and add the worksite.`
      );
    } catch {
      setError(
        "Could not read location. Paste lat/lng from Google Maps, or use a phone at the worksite."
      );
    } finally {
      setLocating(false);
    }
  }

  function saveRemoteSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const result = await updateRemotePunchSettings(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        setSuccess("Remote punch settings saved.");
        router.refresh();
      } catch (caught) {
        setError(getUserFacingError(caught));
      }
    });
  }

  function addWorksite(event: React.FormEvent) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("name", name);
    formData.set("lat", lat);
    formData.set("lng", lng);
    formData.set("radiusMeters", radius);
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const result = await createWorksite(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        setSuccess("Worksite added.");
        setName("Main location");
        setLat("");
        setLng("");
        setLocationHint(null);
        router.refresh();
      } catch (caught) {
        setError(getUserFacingError(caught));
      }
    });
  }

  return (
    <Stack spacing={3}>
      {success ? (
        <Typography component="p" sx={dashboardAlertSuccessSx}>
          {success}
        </Typography>
      ) : null}
      {error ? (
        <Typography component="p" sx={dashboardAlertErrorSx}>
          {error}
        </Typography>
      ) : null}

      <Card sx={dashboardCardSx}>
        <CardHeader>
          <Typography component="h2" sx={dashboardSectionTitleSx}>
            Portal remote punch
          </Typography>
          <Typography sx={dashboardPageIntroSx}>
            Let employees clock in from the web portal with face verification.
            GPS is checked only at punch time.
          </Typography>
        </CardHeader>
        <CardContent>
          <Box component="form" onSubmit={saveRemoteSettings}>
            <Stack spacing={2}>
              <label className="flex items-start gap-3 text-sm text-[var(--eb-text)]">
                <input
                  type="checkbox"
                  name="allowRemotePunch"
                  defaultChecked={allowRemotePunch}
                  className="mt-0.5 size-4 accent-[var(--eb-accent)]"
                />
                <span>
                  <span className="font-medium">Allow remote portal punch</span>
                  <span className="mt-0.5 block text-xs text-[var(--eb-muted)]">
                    Employees can enroll their face and punch from /portal/clock.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm text-[var(--eb-text)]">
                <input
                  type="checkbox"
                  name="requireGeofence"
                  defaultChecked={requireGeofence}
                  className="mt-0.5 size-4 accent-[var(--eb-accent)]"
                />
                <span>
                  <span className="font-medium">Require worksite geofence</span>
                  <span className="mt-0.5 block text-xs text-[var(--eb-muted)]">
                    Punch must be inside an active location radius below.
                  </span>
                </span>
              </label>
              <PendingButton
                type="submit"
                pending={pending}
                pendingLabel="Saving…"
                className="w-fit"
              >
                Save punch settings
              </PendingButton>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Card sx={dashboardCardSx}>
        <CardHeader>
          <Typography component="h2" sx={dashboardSectionTitleSx}>
            Add worksite
          </Typography>
          <Typography sx={dashboardPageIntroSx}>
            Set a pin and radius (recommend 100–200m). Use browser location, or
            paste coordinates copied from Google Maps (right‑click → copy).
          </Typography>
        </CardHeader>
        <CardContent>
          <Box component="form" onSubmit={addWorksite}>
            <Stack spacing={2}>
              <Input
                id="worksiteName"
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <Input
                    id="pasteCoords"
                    label="Paste from Google Maps"
                    value={pasteCoords}
                    onChange={(e) => setPasteCoords(e.target.value)}
                    placeholder="40.712800, -74.006000"
                    disabled={locating}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={locating || !pasteCoords.trim()}
                  onClick={applyPastedCoords}
                  className="sm:mb-0.5"
                >
                  Apply coords
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  id="lat"
                  label="Latitude"
                  value={lat}
                  onChange={(e) => {
                    setLat(e.target.value);
                    setLocationHint(null);
                  }}
                  required
                  placeholder="e.g. 40.712800"
                  disabled={locating}
                />
                <Input
                  id="lng"
                  label="Longitude"
                  value={lng}
                  onChange={(e) => {
                    setLng(e.target.value);
                    setLocationHint(null);
                  }}
                  required
                  placeholder="e.g. -74.006000"
                  disabled={locating}
                />
              </div>
              <Input
                id="radius"
                label="Radius (meters)"
                type="number"
                min={30}
                max={5000}
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                required
              />
              {locationHint ? (
                <Typography
                  sx={{ ...dashboardPageIntroSx, color: "var(--eb-accent)" }}
                >
                  {locationHint}
                </Typography>
              ) : null}
              <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
                <PendingButton
                  type="button"
                  variant="outline"
                  pending={locating}
                  pendingLabel="Getting location…"
                  disabled={pending || locating}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void useMyLocation();
                  }}
                >
                  Use my location
                </PendingButton>
                <PendingButton
                  type="submit"
                  pending={pending}
                  pendingLabel="Adding…"
                  disabled={pending || locating}
                >
                  Add worksite
                </PendingButton>
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Card sx={dashboardCardSx}>
        <CardHeader>
          <Typography component="h2" sx={dashboardSectionTitleSx}>
            Worksites
          </Typography>
        </CardHeader>
        <CardContent>
          {worksites.length === 0 ? (
            <Typography sx={dashboardPageIntroSx}>
              No worksites yet. Add one above before enabling geofenced portal
              punch.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {worksites.map((site) => (
                <WorksiteEditor
                  key={site.id}
                  site={site}
                  pending={pending}
                  onError={setError}
                  onSuccess={setSuccess}
                />
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

function WorksiteEditor({
  site,
  pending,
  onError,
  onSuccess,
}: {
  site: WorksiteRow;
  pending: boolean;
  onError: (value: string | null) => void;
  onSuccess: (value: string | null) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(site.name);
  const [lat, setLat] = useState(String(site.lat));
  const [lng, setLng] = useState(String(site.lng));
  const [radius, setRadius] = useState(String(site.radius_meters));
  const [active, setActive] = useState(site.is_active);
  const [localPending, startTransition] = useTransition();

  function save(event: React.FormEvent) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("name", name);
    formData.set("lat", lat);
    formData.set("lng", lng);
    formData.set("radiusMeters", radius);
    if (active) formData.set("isActive", "on");
    onError(null);
    onSuccess(null);
    startTransition(async () => {
      try {
        const result = await updateWorksite(site.id, formData);
        if (result.error) {
          onError(result.error);
          return;
        }
        onSuccess("Worksite updated.");
        router.refresh();
      } catch (caught) {
        onError(getUserFacingError(caught));
      }
    });
  }

  function remove() {
    onError(null);
    onSuccess(null);
    startTransition(async () => {
      try {
        const result = await deleteWorksite(site.id);
        if (result.error) {
          onError(result.error);
          return;
        }
        onSuccess("Worksite deleted.");
        router.refresh();
      } catch (caught) {
        onError(getUserFacingError(caught));
      }
    });
  }

  return (
    <Box
      component="form"
      onSubmit={save}
      className="rounded-[10px] border border-[var(--eb-border)] p-4"
    >
      <Stack spacing={2}>
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label="Latitude"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            required
          />
          <Input
            label="Longitude"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            required
          />
          <Input
            label="Radius (m)"
            type="number"
            min={30}
            max={5000}
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            required
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--eb-text)]">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="size-4 accent-[var(--eb-accent)]"
          />
          Active
        </label>
        <Stack direction="row" spacing={1.5}>
          <PendingButton
            type="submit"
            pending={pending || localPending}
            pendingLabel="Saving…"
          >
            Save
          </PendingButton>
          <Button
            type="button"
            variant="outline"
            disabled={pending || localPending}
            onClick={remove}
          >
            Delete
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
