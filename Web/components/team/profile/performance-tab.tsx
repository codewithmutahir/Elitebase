"use client";

import type { ReactNode } from "react";
import { Star, Trash2, Trophy } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addEmployeeNote,
  deleteEmployeeNote,
} from "@/app/(dashboard)/employees/profile-actions";
import { PendingButton } from "@/components/dashboard/pending-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  profileCardClass,
  profileMutedClass,
  profileNoteCardClass,
  profileSectionTitleClass,
  profileStatCardClass,
  profileTextareaClass,
  profileValueClass,
} from "@/lib/dashboard/styles";
import { employeeInitials, formatDateShort, formatRelativeTime } from "@/lib/employees/format";
import type {
  EmployeeMilestone,
  EmployeeNote,
  EmployeeProfile,
} from "@/lib/employees/profile-queries";
import { cn } from "@/lib/utils";

type PerformanceTabProps = {
  employee: EmployeeProfile;
  onUpdated: () => void;
};

function StatCard({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className={profileStatCardClass}>
      <p className="profile-stat-label">{label}</p>
      <p className="profile-stat-value">{value}</p>
    </div>
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
    <div className="space-y-8">
      <div>
        <h3 className={profileSectionTitleClass}>
          Attendance · {stats.monthLabel}
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="On time rate" value={stats.onTimeRate} />
          <StatCard label="Avg hours/week" value={stats.avgHoursPerWeek} />
          <StatCard label="Missed clock outs" value={stats.missedClockOuts} />
          <StatCard label="No shows" value={stats.noShows} />
          <StatCard
            label="Avg shift rating"
            value={
              <span className="inline-flex items-center gap-1">
                {stats.avgShiftRating}
                <Star
                  className="size-4 fill-[var(--eb-accent)] text-[var(--eb-accent)]"
                  aria-hidden
                />
              </span>
            }
          />
          <StatCard label="Shifts worked" value={stats.shiftsWorked} />
          <StatCard label="Missed breaks" value={stats.missedBreaks} />
        </div>
      </div>

      <Card className={profileCardClass}>
        <CardHeader>
          <h3 className={profileSectionTitleClass}>Role breakdown</h3>
        </CardHeader>
        <CardContent>
          {stats.roleBreakdown.length === 0 ? (
            <p className={cn("py-6 text-center text-sm", profileMutedClass)}>
              No roles yet
            </p>
          ) : (
            <ul className="space-y-2">
              {stats.roleBreakdown.map((row) => (
                <li
                  key={row.roleName}
                  className="flex justify-between border-b border-[var(--eb-border)] py-2 text-sm last:border-0"
                >
                  <span className={profileValueClass}>{row.roleName}</span>
                  <span className="text-[var(--eb-muted)]">
                    {row.hours.toFixed(2)} hrs
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div>
        <h3 className={cn("mb-4", profileSectionTitleClass)}>Milestones</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {employee.milestones.map((m: EmployeeMilestone) => (
            <Card key={m.id} className={profileCardClass}>
              <CardContent className="flex items-start gap-3 py-4">
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--eb-accent)]/30 bg-[var(--eb-accent)]/10"
                  aria-hidden
                >
                  <Trophy className="size-5 text-[var(--eb-accent)]" />
                </div>
                <div>
                  <p className={cn("font-semibold", profileValueClass)}>{m.title}</p>
                  <p className={cn("text-sm", profileMutedClass)}>
                    {formatDateShort(m.milestone_date)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          {employee.milestones.length === 0 ? (
            <p className={cn("col-span-2 text-center text-sm", profileMutedClass)}>
              Milestones appear when a hire date is set.
            </p>
          ) : null}
        </div>
      </div>

      <Card className={profileCardClass}>
        <CardHeader>
          <h3 className={profileSectionTitleClass}>Manager notes</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a new note…"
              rows={3}
              className={profileTextareaClass}
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
          </div>

          <ul className="space-y-4">
            {employee.notes.map((note) => (
              <li key={note.id} className={profileNoteCardClass}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="border border-[var(--eb-border)] bg-[var(--eb-elevated)] text-xs font-semibold text-[var(--eb-accent)]">
                        {employeeInitials(note.author_name || "A")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className={profileValueClass}>
                        {note.author_name || "Admin"}
                      </p>
                      <p className="mt-1 text-sm text-[var(--eb-text)]">
                        {note.content}
                      </p>
                      <p className={cn("mt-1 text-xs", profileMutedClass)}>
                        {formatRelativeTime(note.created_at)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeNote(note)}
                    className="rounded p-1 text-[var(--eb-muted)] opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                    aria-label="Delete note"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
            {employee.notes.length === 0 ? (
              <p className={cn("text-center text-sm", profileMutedClass)}>
                No notes yet.
              </p>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
