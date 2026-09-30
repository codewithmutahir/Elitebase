"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteEmployeePermanently,
  getEmployeeAttendanceCount,
  reactivateEmployee,
  terminateEmployee,
} from "@/app/(dashboard)/employees/profile-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PendingButton } from "@/components/dashboard/pending-button";
import type { EmployeeStatus } from "@/lib/employees/profile-queries";
import {
  dashboardDialogContentClass,
  dashboardFieldInputClass,
  dashboardPageIntroClass,
} from "@/lib/dashboard/styles";
import { cn } from "@/lib/utils";

export type EmployeeActionTarget = {
  id: string;
  full_name: string;
  status: EmployeeStatus;
};

type EmployeeActionDialogsProps = {
  employee: EmployeeActionTarget | null;
  action: "deactivate" | "reactivate" | "delete" | null;
  onClose: () => void;
  /** After permanent delete, navigate away from profile page */
  redirectOnDelete?: boolean;
};

export function EmployeeActionDialogs({
  employee,
  action,
  onClose,
  redirectOnDelete = false,
}: EmployeeActionDialogsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [attendanceCount, setAttendanceCount] = useState<number | null>(null);

  useEffect(() => {
    if (!employee || action !== "delete") {
      setAttendanceCount(null);
      return;
    }
    let cancelled = false;
    void getEmployeeAttendanceCount(employee.id).then((count) => {
      if (!cancelled) setAttendanceCount(count);
    });
    return () => {
      cancelled = true;
    };
  }, [employee, action]);

  useEffect(() => {
    if (!action) {
      setReason("");
      setConfirmName("");
    }
  }, [action]);

  function close() {
    onClose();
    setReason("");
    setConfirmName("");
  }

  function handleDeactivate() {
    if (!employee) return;
    startTransition(async () => {
      const result = await terminateEmployee(employee.id, reason);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${employee.full_name} deactivated`);
      close();
      router.refresh();
    });
  }

  function handleReactivate() {
    if (!employee) return;
    startTransition(async () => {
      const result = await reactivateEmployee(employee.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${employee.full_name} reactivated`);
      close();
      router.refresh();
    });
  }

  function handleDelete() {
    if (!employee) return;
    startTransition(async () => {
      const result = await deleteEmployeePermanently(employee.id, confirmName);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${employee.full_name} permanently deleted`);
      close();
      if (redirectOnDelete) {
        router.push("/employees");
        router.refresh();
      } else {
        router.refresh();
      }
    });
  }

  return (
    <>
      <Dialog open={action === "deactivate"} onOpenChange={(open) => !open && close()}>
        <DialogContent className={dashboardDialogContentClass}>
          <DialogHeader>
            <DialogTitle>Deactivate {employee?.full_name}?</DialogTitle>
            <DialogDescription>
              They will lose kiosk access and no longer appear on the schedule. Attendance
              history is kept and you can reactivate them later.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            rows={3}
            className={cn(
              "w-full rounded-lg border px-3 py-2 text-sm",
              dashboardFieldInputClass
            )}
          />
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={pending} onClick={handleDeactivate}>
              {pending ? "Deactivating…" : "Deactivate employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={action === "reactivate"} onOpenChange={(open) => !open && close()}>
        <DialogContent className={dashboardDialogContentClass}>
          <DialogHeader>
            <DialogTitle>Reactivate {employee?.full_name}?</DialogTitle>
            <DialogDescription>
              They will regain kiosk access and appear as active on the roster and schedule.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <PendingButton
              pending={pending}
              pendingLabel="Reactivating…"
              onClick={handleReactivate}
            >
              Reactivate employee
            </PendingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={action === "delete"} onOpenChange={(open) => !open && close()}>
        <DialogContent className={dashboardDialogContentClass}>
          <DialogHeader>
            <DialogTitle>Permanently delete {employee?.full_name}?</DialogTitle>
            <DialogDescription>
              This is a dangerous action and cannot be undone. All attendance records, shifts,
              PIN, face data, documents, and notes for this employee will be removed.
              {attendanceCount != null && attendanceCount > 0 ? (
                <>
                  {" "}
                  This employee has {attendanceCount} attendance record
                  {attendanceCount === 1 ? "" : "s"}.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className={cn("text-sm", dashboardPageIntroClass)}>
              Type <span className="font-semibold text-[var(--eb-text)]">{employee?.full_name}</span> to confirm:
            </p>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={employee?.full_name}
              autoComplete="off"
              className={dashboardFieldInputClass}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={
                pending ||
                !employee ||
                confirmName.trim() !== employee.full_name.trim()
              }
              onClick={handleDelete}
            >
              {pending ? "Deleting…" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
