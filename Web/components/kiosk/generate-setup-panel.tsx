"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useActionState, useState } from "react";
import {
  generateSetupCode,
  type GenerateSetupCodeState,
} from "@/app/(dashboard)/kiosk-setup/actions";
import { PendingButton } from "@/components/dashboard/pending-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  dashboardAlertErrorSx,
  dashboardCardSx,
  dashboardPageIntroSx,
  dashboardSectionTitleSx,
  dashboardSetupCodePanelSx,
  dashboardSetupCodeValueSx,
} from "@/lib/dashboard/sx";

const initialState: GenerateSetupCodeState | null = null;

export function GenerateSetupPanel() {
  const [state, formAction, pending] = useActionState(
    generateSetupCode,
    initialState
  );
  const [showForm, setShowForm] = useState(false);

  return (
    <Card sx={dashboardCardSx}>
      <CardHeader>
        <Typography component="h2" sx={dashboardSectionTitleSx}>
          Register a tablet
        </Typography>
        <Typography sx={dashboardPageIntroSx}>
          Generate a one-time setup code for the kiosk app on your tablet.
        </Typography>
      </CardHeader>
      <CardContent>
        {state?.setupCode ? (
          <Box sx={dashboardSetupCodePanelSx}>
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "text.secondary",
              }}
            >
              Setup code
              {state.locationName ? ` · ${state.locationName}` : ""}
            </Typography>
            <Typography sx={dashboardSetupCodeValueSx}>
              {state.setupCode}
            </Typography>
            <Typography
              sx={{
                ...dashboardPageIntroSx,
                mx: "auto",
                mt: 3,
                maxWidth: 448,
              }}
            >
              Open the kiosk app and enter this code. It is consumed when the
              tablet registers.
            </Typography>
            <Button
              type="button"
              variant="outline"
              sx={{ mt: 3 }}
              onClick={() => setShowForm(true)}
            >
              Generate another code
            </Button>
          </Box>
        ) : null}

        {state?.error ? (
          <Typography component="p" sx={{ ...dashboardAlertErrorSx, mb: 2 }}>
            {state.error}
          </Typography>
        ) : null}

        {!state?.setupCode || showForm ? (
          <Stack component="form" action={formAction} spacing={2}>
            <Input
              id="locationName"
              name="locationName"
              label="Location name"
              placeholder="Main Location"
            />
            <PendingButton
              type="submit"
              pending={pending}
              pendingLabel="Generating…"
              onClick={() => setShowForm(false)}
            >
              Generate setup code
            </PendingButton>
          </Stack>
        ) : null}
      </CardContent>
    </Card>
  );
}
