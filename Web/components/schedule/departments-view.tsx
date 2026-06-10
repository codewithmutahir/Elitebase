"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createDepartment,
  createRole,
  deleteDepartment,
  deleteRole,
  updateDepartment,
  updateRole,
} from "@/app/(dashboard)/schedule/departments/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DepartmentWithRoles } from "@/lib/departments/queries";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
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

export function DepartmentsView({ initialDepartments }: DepartmentsViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptColor, setNewDeptColor] = useState("#2563EB");
  const [showAddDept, setShowAddDept] = useState(false);
  const [newRoleByDept, setNewRoleByDept] = useState<Record<string, string>>(
    {}
  );
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editingDeptName, setEditingDeptName] = useState("");
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingRoleName, setEditingRoleName] = useState("");

  function refresh() {
    router.refresh();
  }

  function run(action: () => Promise<{ error?: string; ok?: boolean } | { id?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      refresh();
    });
  }

  function handleAddDepartment() {
    const name = newDeptName.trim();
    if (!name) {
      setError("Department name is required.");
      return;
    }
    run(async () => {
      const result = await createDepartment(name, newDeptColor);
      if (!result.error) {
        setNewDeptName("");
        setNewDeptColor("#2563EB");
        setShowAddDept(false);
      }
      return result;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="text-sm text-slate-500">
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
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-[220px] px-6 py-3">Department</th>
                <th className="px-6 py-3">Roles</th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialDepartments.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                    No departments yet. Add your first department below.
                  </td>
                </tr>
              ) : (
                initialDepartments.map((dept) => (
                  <tr key={dept.id} className="align-top hover:bg-slate-50/50">
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
                            className="h-8 w-full max-w-[160px] rounded-md border border-slate-200 px-2 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDeptId(dept.id);
                              setEditingDeptName(dept.name);
                            }}
                            className="text-left font-semibold text-slate-900 hover:text-blue-600"
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
                              className="h-8 min-w-[100px] rounded-full border border-blue-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          ) : (
                            <span
                              key={role.id}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 py-1 pr-1 pl-3 text-sm font-medium text-slate-700"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRoleId(role.id);
                                  setEditingRoleName(role.name);
                                }}
                                className="hover:text-blue-600"
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
                                const name = (newRoleByDept[dept.id] ?? "").trim();
                                if (!name) return;
                                run(async () => {
                                  const result = await createRole(dept.id, name);
                                  if (!result.error) {
                                    setNewRoleByDept((prev) => ({
                                      ...prev,
                                      [dept.id]: "",
                                    }));
                                  }
                                  return result;
                                });
                              }
                            }}
                            className="h-8 w-28 rounded-full border border-dashed border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-blue-600"
                            disabled={pending}
                            onClick={() => {
                              const name = (newRoleByDept[dept.id] ?? "").trim();
                              if (!name) return;
                              run(async () => {
                                const result = await createRole(dept.id, name);
                                if (!result.error) {
                                  setNewRoleByDept((prev) => ({
                                    ...prev,
                                    [dept.id]: "",
                                  }));
                                }
                                return result;
                              });
                            }}
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
                <tr className="bg-blue-50/30">
                  <td className="px-6 py-4" colSpan={3}>
                    <div className="flex flex-wrap items-end gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">
                          Color
                        </span>
                        <input
                          type="color"
                          value={newDeptColor}
                          onChange={(event) => setNewDeptColor(event.target.value)}
                          className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-white"
                        />
                        <div className="flex gap-1">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={cn(
                                "size-6 rounded-full ring-2 ring-offset-1 transition",
                                newDeptColor === color
                                  ? "ring-blue-500"
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
                        <Button
                          type="button"
                          onClick={handleAddDepartment}
                          disabled={pending}
                        >
                          Save department
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {!showAddDept && initialDepartments.length > 0 ? (
          <div className="border-t border-slate-100 px-6 py-3">
            <button
              type="button"
              onClick={() => setShowAddDept(true)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              + Add another department
            </button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
