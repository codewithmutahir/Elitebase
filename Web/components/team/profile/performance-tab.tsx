"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addEmployeeNote,
  deleteEmployeeNote,
} from "@/app/(dashboard)/employees/profile-actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { employeeInitials, formatDateShort, formatRelativeTime } from "@/lib/employees/format";
import type {
  EmployeeMilestone,
  EmployeeNote,
  EmployeeProfile,
} from "@/lib/employees/profile-queries";
import { Trash2 } from "lucide-react";

type PerformanceTabProps = {
  employee: EmployeeProfile;
  onUpdated: () => void;
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
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
        <h3 className="text-lg font-semibold text-slate-900">
          Attendance • {stats.monthLabel}
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="On time rate" value={stats.onTimeRate} />
          <StatCard label="Avg hours/week" value={stats.avgHoursPerWeek} />
          <StatCard label="Missed clock outs" value={stats.missedClockOuts} />
          <StatCard label="No shows" value={stats.noShows} />
          <StatCard label="Avg shift rating" value={stats.avgShiftRating} />
          <StatCard label="Shifts worked" value={stats.shiftsWorked} />
          <StatCard label="Missed breaks" value={stats.missedBreaks} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-slate-900">Role breakdown</h3>
        </CardHeader>
        <CardContent>
          {stats.roleBreakdown.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No roles yet</p>
          ) : (
            <ul className="space-y-2">
              {stats.roleBreakdown.map((row) => (
                <li
                  key={row.roleName}
                  className="flex justify-between border-b border-slate-50 py-2 text-sm"
                >
                  <span className="font-medium text-slate-900">{row.roleName}</span>
                  <span className="text-slate-600">{row.hours.toFixed(2)} hrs</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Milestones</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {employee.milestones.map((m: EmployeeMilestone) => (
            <Card key={m.id}>
              <CardContent className="flex items-start gap-3 py-4">
                <span className="text-2xl" aria-hidden>
                  🏆
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{m.title}</p>
                  <p className="text-sm text-slate-500">
                    {formatDateShort(m.milestone_date)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          {employee.milestones.length === 0 ? (
            <p className="col-span-2 text-center text-sm text-slate-500">
              Milestones appear when a hire date is set.
            </p>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-slate-900">Manager Notes</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a new note..."
              rows={3}
              className="min-h-[80px] flex-1 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <Button
              type="button"
              disabled={pending || !noteText.trim()}
              onClick={submitNote}
              className="sm:shrink-0"
            >
              Add note
            </Button>
          </div>

          <ul className="space-y-4">
            {employee.notes.map((note) => (
              <li
                key={note.id}
                className="group rounded-lg border border-slate-100 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-slate-100 text-xs font-semibold">
                        {employeeInitials(note.author_name || "A")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {note.author_name || "Admin"}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">{note.content}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatRelativeTime(note.created_at)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeNote(note)}
                    className="rounded p-1 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    aria-label="Delete note"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
            {employee.notes.length === 0 ? (
              <p className="text-center text-sm text-slate-500">No notes yet.</p>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
