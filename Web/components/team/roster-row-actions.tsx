"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
import type { EmployeeListItem } from "@/lib/employees/queries";
import {
  dashboardDropdownContentClass,
  dashboardDropdownItemClass,
} from "@/lib/dashboard/styles";

type RosterRowActionsProps = {
  employee: EmployeeListItem;
};

export function RosterRowActions({ employee }: RosterRowActionsProps) {
  const [action, setAction] = useState<"deactivate" | "reactivate" | "delete" | null>(
    null
  );

  const target: EmployeeActionTarget = {
    id: employee.id,
    full_name: employee.full_name,
    status: employee.status,
  };

  return (
    <>
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
          <MoreHorizontal className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="bottom"
          sideOffset={6}
          className={dashboardDropdownContentClass}
        >
          <DropdownMenuItem
            className={dashboardDropdownItemClass}
            render={
              <Link
                href={`/employees/${employee.id}`}
                className="flex w-full items-center"
              />
            }
          >
            View profile
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[var(--eb-border)]" />
          {employee.status === "active" ? (
            <DropdownMenuItem
              variant="destructive"
              className="gap-2 rounded-md px-2 py-2"
              onClick={() => setAction("deactivate")}
            >
              Deactivate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className={dashboardDropdownItemClass}
              onClick={() => setAction("reactivate")}
            >
              Reactivate
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

      <EmployeeActionDialogs
        employee={action ? target : null}
        action={action}
        onClose={() => setAction(null)}
      />
    </>
  );
}
