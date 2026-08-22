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
              aria-label={`Actions for ${employee.full_name}`}
            />
          }
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/employees/${employee.id}`} />}>
            View profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {employee.status === "active" ? (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setAction("deactivate")}
            >
              Deactivate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setAction("reactivate")}>
              Reactivate
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            variant="destructive"
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
