"use client";

import { Mail, MoreVertical, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendEmployeePortalInvite } from "@/app/(dashboard)/employees/profile-actions";
import {
  EmployeeActionDialogs,
  type EmployeeActionTarget,
} from "@/components/team/employee-action-dialogs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";
import {
  dashboardDropdownContentClass,
  dashboardDropdownItemClass,
  dashboardPrimaryButtonClass,
} from "@/lib/dashboard/styles";
import type { EmployeeListItem } from "@/lib/employees/queries";
import {
  getRosterOnboardingStatus,
  type RosterOnboardingStatus,
} from "@/lib/employees/roster-status";
import { cn } from "@/lib/utils";

type RosterRowActionsProps = {
  employee: EmployeeListItem;
};

function profileHref(employeeId: string, tab: string) {
  return `/employees/${employeeId}#${tab}`;
}

export function RosterRowActions({ employee }: RosterRowActionsProps) {
  const router = useRouter();
  const [action, setAction] = useState<"deactivate" | "reactivate" | "delete" | null>(
    null
  );
  const [invitePending, startInvite] = useTransition();
  const onboarding = getRosterOnboardingStatus(employee);

  const target: EmployeeActionTarget = {
    id: employee.id,
    full_name: employee.full_name,
    status: employee.status,
  };

  function handleInvite() {
    startInvite(async () => {
      const result = await sendEmployeePortalInvite(employee.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.emailed) {
        toast.success(`Invitation sent to ${result.email}`);
      } else {
        toast.warning(
          result.emailError
            ? `Invite saved for ${result.email}, but email failed: ${result.emailError}`
            : `Invite saved for ${result.email}, but email was not sent. Check RESEND_API_KEY / RESEND_FROM_EMAIL.`
        );
      }
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex min-w-max items-center justify-end gap-1.5">
        <RowPrimaryAction
          status={onboarding}
          employeeId={employee.id}
          invitePending={invitePending}
          onInvite={handleInvite}
        />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-[var(--eb-muted)] hover:bg-[var(--eb-hover-overlay)] hover:text-[var(--eb-text)]"
                aria-label={`Actions for ${employee.full_name}`}
              />
            }
          >
            <MoreVertical className="size-4" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="bottom"
            sideOffset={6}
            className={cn(dashboardDropdownContentClass, "min-w-52")}
          >
            <DropdownMenuItem
              className={dashboardDropdownItemClass}
              render={
                <Link
                  href={profileHref(employee.id, "performance")}
                  className="flex w-full items-center"
                />
              }
            >
              View performance
            </DropdownMenuItem>
            <DropdownMenuItem
              className={dashboardDropdownItemClass}
              render={
                <Link
                  href={profileHref(employee.id, "job-details")}
                  className="flex w-full items-center"
                />
              }
            >
              View job details
            </DropdownMenuItem>
            <DropdownMenuItem
              className={dashboardDropdownItemClass}
              render={
                <Link
                  href={profileHref(employee.id, "documents")}
                  className="flex w-full items-center"
                />
              }
            >
              View documents
            </DropdownMenuItem>
            <DropdownMenuItem
              className={dashboardDropdownItemClass}
              render={
                <Link
                  href={profileHref(employee.id, "personal")}
                  className="flex w-full items-center"
                />
              }
            >
              View personal information
            </DropdownMenuItem>
            <DropdownMenuItem
              className={dashboardDropdownItemClass}
              render={
                <Link
                  href={`/employees/${employee.id}`}
                  className="flex w-full items-center"
                />
              }
            >
              View kiosk PIN
            </DropdownMenuItem>

            {employee.email &&
            onboarding !== "deactivated" &&
            onboarding !== "active" ? (
              <>
                <DropdownMenuSeparator className="bg-[var(--eb-border)]" />
                <DropdownMenuItem
                  className={dashboardDropdownItemClass}
                  disabled={invitePending}
                  onClick={handleInvite}
                >
                  <Mail className="size-4" aria-hidden />
                  {employee.portal_invited_at ? "Resend invite" : "Send invite"}
                </DropdownMenuItem>
              </>
            ) : null}

            <DropdownMenuSeparator className="bg-[var(--eb-border)]" />

            {employee.status === "active" ? (
              <DropdownMenuItem
                variant="destructive"
                className="gap-2 rounded-md px-2 py-2"
                onClick={() => setAction("deactivate")}
              >
                Deactivate team member
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className={dashboardDropdownItemClass}
                onClick={() => setAction("reactivate")}
              >
                Reactivate team member
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              variant="destructive"
              className="gap-2 rounded-md px-2 py-2"
              onClick={() => setAction("delete")}
            >
              Delete permanently
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EmployeeActionDialogs
        employee={action ? target : null}
        action={action}
        onClose={() => setAction(null)}
      />
    </>
  );
}

function RowPrimaryAction({
  status,
  employeeId,
  invitePending,
  onInvite,
}: {
  status: RosterOnboardingStatus;
  employeeId: string;
  invitePending: boolean;
  onInvite: () => void;
}) {
  if (status === "needs_contact") {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-8 shrink-0 whitespace-nowrap gap-1 border-[var(--eb-border)] bg-transparent px-2.5 text-[var(--eb-text)] hover:bg-[var(--eb-hover-overlay)]"
        render={<Link href={profileHref(employeeId, "personal")} />}
      >
        <Plus className="size-3.5 shrink-0" aria-hidden />
        Add email
      </Button>
    );
  }

  if (status === "needs_invite") {
    return (
      <Button
        size="sm"
        className={cn(
          "h-8 shrink-0 whitespace-nowrap gap-1.5 px-2.5",
          dashboardPrimaryButtonClass
        )}
        disabled={invitePending}
        onClick={onInvite}
      >
        <Mail className="size-3.5 shrink-0" aria-hidden />
        {invitePending ? "Sending…" : "Invite"}
      </Button>
    );
  }

  if (status === "pending") {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-8 shrink-0 whitespace-nowrap gap-1.5 border-[var(--eb-border)] bg-transparent px-2.5 text-[var(--eb-text)] hover:bg-[var(--eb-hover-overlay)]"
        disabled={invitePending}
        onClick={onInvite}
      >
        <Mail className="size-3.5 shrink-0" aria-hidden />
        {invitePending ? "Sending…" : "Resend invite"}
      </Button>
    );
  }

  return null;
}
