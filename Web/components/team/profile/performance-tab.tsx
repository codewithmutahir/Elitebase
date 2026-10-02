"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Star, Trash2, Trophy } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "@/components/ui/sonner";
import {
  addEmployeeNote,
  deleteEmployeeNote,
} from "@/app/(dashboard)/employees/profile-actions";
import { PendingButton } from "@/components/dashboard/pending-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  dashboardCardSx,
  dashboardPageIntroSx,
  dashboardSectionTitleSx,
  profileNoteCardSx,
  profileStatCardSx,
  profileStatLabelSx,
  profileStatValueSx,
  profileTextareaSx,
  profileValueSx,
} from "@/lib/dashboard/sx";
import {
  employeeInitials,
  formatDateShort,
  formatRelativeTime,
} from "@/lib/employees/format";
import type {
  EmployeeMilestone,
  EmployeeNote,
  EmployeeProfile,
} from "@/lib/employees/profile-queries";

type PerformanceTabProps = {
  employee: EmployeeProfile;
  onUpdated: () => void;
};

function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box sx={profileStatCardSx}>
      <Typography sx={profileStatLabelSx}>{label}</Typography>
      <Typography sx={profileStatValueSx}>{value}</Typography>
    </Box>
  );
}

export function PerformanceTab({ employee, onUpdated }: PerformanceTabProps) {
  const [noteText, setNoteText] = useState("");
  const [pending, startTransition] = useTransition();
  const stats = employee.performance;

  function submitNote() {
    if (!noteText.trim()) return;
    startTransition(async () => {
      const result = await addEmployeeNote(employee.id, noteText);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setNoteText("");
      toast.success("Note added");
      onUpdated();
    });
  }

  function removeNote(note: EmployeeNote) {
    startTransition(async () => {
      const result = await deleteEmployeeNote(note.id, employee.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Note deleted");
      onUpdated();
    });
  }

  return (
    <Stack spacing={4}>
      <Box>
        <Typography component="h3" sx={dashboardSectionTitleSx}>
          Attendance · {stats.monthLabel}
        </Typography>
        <Grid container spacing={1.5} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard label="On time rate" value={stats.onTimeRate} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard label="Avg hours/week" value={stats.avgHoursPerWeek} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard label="Missed clock outs" value={stats.missedClockOuts} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard label="No shows" value={stats.noShows} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              label="Avg shift rating"
              value={
                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  {stats.avgShiftRating}
                  <Star
                    className="size-4 fill-[var(--eb-accent)] text-[var(--eb-accent)]"
                    aria-hidden
                  />
                </Box>
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard label="Shifts worked" value={stats.shiftsWorked} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard label="Missed breaks" value={stats.missedBreaks} />
          </Grid>
        </Grid>
      </Box>

      <Card sx={dashboardCardSx}>
        <CardHeader>
          <Typography component="h3" sx={dashboardSectionTitleSx}>
            Role breakdown
          </Typography>
        </CardHeader>
        <CardContent>
          {stats.roleBreakdown.length === 0 ? (
            <Typography
              sx={{ ...dashboardPageIntroSx, py: 3, textAlign: "center" }}
            >
              No roles yet
            </Typography>
          ) : (
            <Stack
              component="ul"
              spacing={0}
              sx={{ listStyle: "none", m: 0, p: 0 }}
            >
              {stats.roleBreakdown.map((row) => (
                <Box
                  component="li"
                  key={row.roleName}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    py: 1,
                    fontSize: "0.875rem",
                    "&:last-child": { borderBottom: 0 },
                  }}
                >
                  <Typography sx={profileValueSx}>{row.roleName}</Typography>
                  <Typography sx={{ color: "text.secondary" }}>
                    {row.hours.toFixed(2)} hrs
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Box>
        <Typography component="h3" sx={{ ...dashboardSectionTitleSx, mb: 2 }}>
          Milestones
        </Typography>
        <Grid container spacing={2}>
          {employee.milestones.map((m: EmployeeMilestone) => (
            <Grid key={m.id} size={{ xs: 12, sm: 6 }}>
              <Card sx={dashboardCardSx}>
                <CardContent
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                    py: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "8px",
                      border: "1px solid",
                      borderColor: (theme) => `${theme.palette.primary.main}4D`,
                      bgcolor: (theme) => `${theme.palette.primary.main}1A`,
                    }}
                    aria-hidden
                  >
                    <Trophy className="size-5 text-[var(--eb-accent)]" />
                  </Box>
                  <Box>
                    <Typography sx={{ ...profileValueSx, fontWeight: 600 }}>
                      {m.title}
                    </Typography>
                    <Typography
                      sx={{ ...dashboardPageIntroSx, fontSize: "0.875rem" }}
                    >
                      {formatDateShort(m.milestone_date)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {employee.milestones.length === 0 ? (
            <Grid size={12}>
              <Typography sx={{ ...dashboardPageIntroSx, textAlign: "center" }}>
                Milestones appear when a hire date is set.
              </Typography>
            </Grid>
          ) : null}
        </Grid>
      </Box>

      <Card sx={dashboardCardSx}>
        <CardHeader>
          <Typography component="h3" sx={dashboardSectionTitleSx}>
            Manager notes
          </Typography>
        </CardHeader>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            useFlexGap
            sx={{ gap: 1.5, alignItems: { sm: "flex-end" } }}
          >
            <Box
              component="textarea"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a new note…"
              rows={3}
              sx={profileTextareaSx}
            />
            <PendingButton
              type="button"
              pending={pending}
              pendingLabel="Adding…"
              disabled={!noteText.trim()}
              onClick={submitNote}
              className="sm:shrink-0"
            >
              Add note
            </PendingButton>
          </Stack>

          <Stack
            component="ul"
            spacing={2}
            sx={{ listStyle: "none", m: 0, p: 0 }}
          >
            {employee.notes.map((note) => (
              <Box
                component="li"
                key={note.id}
                sx={{
                  ...(profileNoteCardSx as object),
                  "&:hover .note-delete": { opacity: 1 },
                }}
              >
                <Stack
                  direction="row"
                  sx={{
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 1.5,
                  }}
                >
                  <Stack direction="row" spacing={1.5}>
                    <Avatar className="size-8">
                      <AvatarFallback className="border border-[var(--eb-border)] bg-[var(--eb-elevated)] text-xs font-semibold text-[var(--eb-accent)]">
                        {employeeInitials(note.author_name || "A")}
                      </AvatarFallback>
                    </Avatar>
                    <Box>
                      <Typography sx={profileValueSx}>
                        {note.author_name || "Admin"}
                      </Typography>
                      <Typography
                        sx={{
                          mt: 0.5,
                          fontSize: "0.875rem",
                          color: "text.primary",
                        }}
                      >
                        {note.content}
                      </Typography>
                      <Typography
                        sx={{
                          ...dashboardPageIntroSx,
                          mt: 0.5,
                          fontSize: "0.75rem",
                        }}
                      >
                        {formatRelativeTime(note.created_at)}
                      </Typography>
                    </Box>
                  </Stack>
                  <Box
                    component="button"
                    type="button"
                    className="note-delete"
                    onClick={() => removeNote(note)}
                    aria-label="Delete note"
                    sx={{
                      opacity: 0,
                      border: "none",
                      borderRadius: "4px",
                      p: 0.5,
                      bgcolor: "transparent",
                      color: "text.secondary",
                      cursor: "pointer",
                      transition: "background-color 0.15s, color 0.15s",
                      "&:hover": {
                        bgcolor: (theme) => `${theme.palette.error.main}1A`,
                        color: "error.light",
                      },
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Box>
                </Stack>
              </Box>
            ))}
            {employee.notes.length === 0 ? (
              <Typography sx={{ ...dashboardPageIntroSx, textAlign: "center" }}>
                No notes yet.
              </Typography>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
