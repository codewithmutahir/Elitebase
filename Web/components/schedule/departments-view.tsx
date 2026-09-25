"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  createDepartment,
  createRole,
  deleteDepartment,
  deleteRole,
  updateDepartment,
  updateRole,
} from "@/app/(dashboard)/schedule/departments/actions";
import { PendingButton } from "@/components/dashboard/pending-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DepartmentWithRoles } from "@/lib/departments/queries";
import {
  dashboardAccentLinkClass,
  dashboardCardClass,
  dashboardFocusRingClass,
  dashboardPageIntroClass,
} from "@/lib/dashboard/styles";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#2EC4B6",
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#DC2626",
  "#EA580C",
  "#CA8A04",
  "#16A34A",
  "#0891B2",
  "#64748B",
];

type DepartmentsViewProps = {
  initialDepartments: DepartmentWithRoles[];
};

type LocalDepartment = DepartmentWithRoles & { optimistic?: boolean };

export function DepartmentsView({ initialDepartments }: DepartmentsViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [departments, setDepartments] =
    useState<LocalDepartment[]>(initialDepartments);
  const [error, setError] = useState<string | null>(null);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptColor, setNewDeptColor] = useState("#2EC4B6");
  const [showAddDept, setShowAddDept] = useState(false);
  const [newRoleByDept, setNewRoleByDept] = useState<Record<string, string>>(
    {}
  );
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editingDeptName, setEditingDeptName] = useState("");
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingRoleName, setEditingRoleName] = useState("");

  useEffect(() => {
    setDepartments((prev) => {
      const optimistic = prev.filter(
        (d) => d.optimistic || String(d.id).startsWith("optimistic-")
      );
      if (optimistic.length === 0) return initialDepartments;
      const serverIds = new Set(initialDepartments.map((d) => d.id));
      const stillPending = optimistic.filter((d) => !serverIds.has(d.id));
      return [...initialDepartments, ...stillPending];
    });
  }, [initialDepartments]);

  function refresh() {
    router.refresh();
  }

  function run(
    action: () => Promise<{ error?: string; ok?: boolean } | { id?: string }>,
    onSuccess?: () => void
  ) {
    setError(null);
    startTransition(() => {
      void action().then((result) => {
        if (result && "error" in result && result.error) {
          setError(result.error);
          return;
        }
        onSuccess?.();
        refresh();
      });
    });
  }

  function handleAddDepartment() {
    const name = newDeptName.trim();
    if (!name) {
      setError("Department name is required.");
      return;
    }
    const color = newDeptColor;
    const tempId = `optimistic-${Date.now()}`;
    setDepartments((prev) => [
      ...prev,
      { id: tempId, name, color, roles: [], optimistic: true },
    ]);
    setNewDeptName("");
    setNewDeptColor("#2EC4B6");
    setShowAddDept(false);
    setError(null);

    startTransition(async () => {
      const result = await createDepartment(name, color);
      if ("error" in result && result.error) {
        setDepartments((prev) => prev.filter((dept) => dept.id !== tempId));
        setError(result.error);
        return;
      }
      if ("id" in result && result.id) {
        setDepartments((prev) =>
          prev.map((dept) =>
            dept.id === tempId
              ? { ...dept, id: result.id, optimistic: false }
              : dept
          )
        );
      }
      refresh();
    });
  }

  function handleAddRole(deptId: string) {
    const name = (newRoleByDept[deptId] ?? "").trim();
    if (!name) return;
    const tempRoleId = `role-${Date.now()}`;
    setDepartments((prev) =>
      prev.map((dept) =>
        dept.id === deptId
          ? {
              ...dept,
              roles: [...dept.roles, { id: tempRoleId, name, department_id: deptId }],
            }
          : dept
      )
    );
    setNewRoleByDept((prev) => ({ ...prev, [deptId]: "" }));

    startTransition(async () => {
      const result = await createRole(deptId, name);
      if ("error" in result && result.error) {
        setDepartments((prev) =>
          prev.map((dept) =>
            dept.id === deptId
              ? {
                  ...dept,
                  roles: dept.roles.filter((role) => role.id !== tempRoleId),
                }
              : dept
          )
        );
        setError(result.error);
        return;
      }
      refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className={dashboardPageIntroClass}>
          Organize your team by department and define job roles for scheduling.
        </p>
        <Button
          type="button"
          onClick={() => setShowAddDept((value) => !value)}
          disabled={pending}
        >
          <Plus className="size-4" aria-hidden />
          Add department
        </Button>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <Card className={cn("overflow-hidden", dashboardCardClass)}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[var(--eb-border)] bg-[var(--eb-elevated)]/90 text-xs font-semibold uppercase tracking-wide text-[var(--eb-muted)]">
              <tr>
                <th className="w-[220px] px-6 py-3">Department</th>
                <th className="px-6 py-3">Roles</th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--eb-border)]">
              {departments.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-12 text-center text-[var(--eb-muted)]"
                  >
                    No departments yet. Add your first department below.
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr
                    key={dept.id}
                    className={cn(
                      "align-top transition-colors hover:bg-[var(--eb-elevated)]/40",
                      dept.optimistic && "opacity-80"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <label className="relative cursor-pointer">
                          <span
                            className="block size-3.5 shrink-0 rounded-full ring-2 ring-white ring-offset-1"
                            style={{ backgroundColor: dept.color }}
                          />
                          <input
                            type="color"
                            value={dept.color}
                            className="absolute inset-0 size-full cursor-pointer opacity-0"
                            aria-label={`Color for ${dept.name}`}
                            onChange={(event) =>
                              run(() =>
                                updateDepartment(dept.id, {
                                  color: event.target.value,
                                })
                              )
                            }
                            disabled={pending}
                          />
                        </label>
                        {editingDeptId === dept.id ? (
                          <input
                            autoFocus
                            value={editingDeptName}
                            onChange={(event) =>
                              setEditingDeptName(event.target.value)
                            }
                            onBlur={() => {
                              if (editingDeptName.trim() !== dept.name) {
                                run(() =>
                                  updateDepartment(dept.id, {
                                    name: editingDeptName,
                                  })
                                );
                              }
                              setEditingDeptId(null);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.currentTarget.blur();
                              }
                              if (event.key === "Escape") {
                                setEditingDeptId(null);
                              }
                            }}
                            className={cn(
                              "h-8 w-full max-w-[160px] rounded-md border border-[var(--eb-border)] bg-[var(--eb-elevated)]/70 px-2 text-sm font-semibold text-[var(--eb-text)]",
                              dashboardFocusRingClass
                            )}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDeptId(dept.id);
                              setEditingDeptName(dept.name);
                            }}
                            className="text-left font-semibold text-[var(--eb-text)] transition-colors hover:text-[var(--eb-accent)]"
                          >
                            {dept.name}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {dept.roles.map((role) =>
                          editingRoleId === role.id ? (
                            <input
                              key={role.id}
                              autoFocus
                              value={editingRoleName}
                              onChange={(event) =>
                                setEditingRoleName(event.target.value)
                              }
                              onBlur={() => {
                                if (editingRoleName.trim() !== role.name) {
                                  run(() =>
                                    updateRole(role.id, editingRoleName)
                                  );
                                }
                                setEditingRoleId(null);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.currentTarget.blur();
                                }
                                if (event.key === "Escape") {
                                  setEditingRoleId(null);
                                }
                              }}
                              className={cn(
                                "h-8 min-w-[100px] rounded-full border border-[var(--eb-border)] bg-[var(--eb-elevated)]/70 px-3 text-sm text-[var(--eb-text)]",
                                dashboardFocusRingClass
                              )}
                            />
                          ) : (
                            <span
                              key={role.id}
                              className="inline-flex items-center gap-1 rounded-full border border-[var(--eb-border)] bg-[var(--eb-elevated)]/60 py-1 pr-1 pl-3 text-sm font-medium text-[var(--eb-text)]"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRoleId(role.id);
                                  setEditingRoleName(role.name);
                                }}
                                className="hover:text-[var(--eb-accent)]"
                              >
                                {role.name}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  run(() => deleteRole(role.id))
                                }
                                disabled={pending}
                                className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-red-600"
                                aria-label={`Remove ${role.name}`}
                              >
                                <X className="size-3.5" aria-hidden />
                              </button>
                            </span>
                          )
                        )}
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="Add role"
                            value={newRoleByDept[dept.id] ?? ""}
                            onChange={(event) =>
                              setNewRoleByDept((prev) => ({
                                ...prev,
                                [dept.id]: event.target.value,
                              }))
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                handleAddRole(dept.id);
                              }
                            }}
                            className={cn(
                              "h-8 w-28 rounded-full border border-dashed border-[var(--eb-border)] bg-[var(--eb-elevated)]/50 px-3 text-sm text-[var(--eb-text)] outline-none placeholder:text-[var(--eb-muted)]",
                              dashboardFocusRingClass
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-[var(--eb-accent)]"
                            disabled={pending}
                            onClick={() => handleAddRole(dept.id)}
                            aria-label="Add role"
                          >
                            <Plus className="size-4" aria-hidden />
                          </Button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => run(() => deleteDepartment(dept.id))}
                        disabled={pending}
                        className="text-xs font-semibold text-slate-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}

              {showAddDept ? (
                <tr className="bg-[var(--eb-accent)]/5">
                  <td className="px-6 py-4" colSpan={3}>
                    <div className="flex flex-wrap items-end gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--eb-muted)]">
                          Color
                        </span>
                        <input
                          type="color"
                          value={newDeptColor}
                          onChange={(event) => setNewDeptColor(event.target.value)}
                          className="h-9 w-12 cursor-pointer rounded border border-[var(--eb-border)] bg-[var(--eb-elevated)]"
                        />
                        <div className="flex gap-1">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={cn(
                                "size-6 rounded-full ring-2 ring-offset-1 transition",
                                newDeptColor === color
                                  ? "ring-[var(--eb-accent)]"
                                  : "ring-transparent"
                              )}
                              style={{ backgroundColor: color }}
                              onClick={() => setNewDeptColor(color)}
                              aria-label={`Use color ${color}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="min-w-[200px] flex-1">
                        <Input
                          id="newDepartmentName"
                          label="Department name"
                          placeholder="e.g. Front of House"
                          value={newDeptName}
                          onChange={(event) => setNewDeptName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") handleAddDepartment();
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowAddDept(false);
                            setNewDeptName("");
                          }}
                        >
                          Cancel
                        </Button>
                        <PendingButton
                          type="button"
                          onClick={handleAddDepartment}
                          pending={pending}
                          pendingLabel="Saving…"
                        >
                          Save department
                        </PendingButton>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {!showAddDept && departments.length > 0 ? (
          <div className="border-t border-[var(--eb-border)] px-6 py-3">
            <button
              type="button"
              onClick={() => setShowAddDept(true)}
              className={cn("text-sm", dashboardAccentLinkClass)}
            >
              + Add another department
            </button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
