"use client";

import { useMemo, useTransition } from "react";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import type { GridColDef } from "@mui/x-data-grid";
import { suspendCompany } from "@/app/(dashboard)/super-admin/companies/actions";
import { DataGridTable } from "@/components/ui/data-table";
import type { SuperAdminCompanyRow } from "@/lib/super-admin/companies";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(iso));
}

export function SuperAdminCompaniesTable({
  companies,
}: {
  companies: SuperAdminCompanyRow[];
}) {
  const [pending, startTransition] = useTransition();

  const columns = useMemo<GridColDef<SuperAdminCompanyRow>[]>(
    () => [
      {
        field: "name",
        headerName: "Company",
        flex: 1.2,
        minWidth: 160,
        rowHeader: true,
      },
      {
        field: "ownerEmail",
        headerName: "Owner email",
        flex: 1.2,
        minWidth: 180,
      },
      {
        field: "employeeCount",
        headerName: "Employees",
        width: 120,
        type: "number",
        align: "left",
        headerAlign: "left",
      },
      {
        field: "createdAt",
        headerName: "Created",
        width: 140,
        valueFormatter: (value: string) => formatDate(value),
      },
      {
        field: "isActive",
        headerName: "Status",
        width: 130,
        sortable: false,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value ? "Active" : "Suspended"}
            color={params.value ? "success" : "error"}
            variant="soft"
          />
        ),
      },
      {
        field: "actions",
        headerName: "",
        width: 120,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        align: "right",
        headerAlign: "right",
        renderCell: (params) =>
          params.row.isActive ? (
            <Button
              type="button"
              size="small"
              color="error"
              variant="text"
              disabled={pending}
              onClick={(event) => {
                event.stopPropagation();
                startTransition(async () => {
                  await suspendCompany(params.row.id);
                });
              }}
            >
              Suspend
            </Button>
          ) : (
            <span>—</span>
          ),
      },
    ],
    [pending]
  );

  return (
    <DataGridTable
      columns={columns}
      rows={companies}
      getRowId={(row) => row.id}
      emptyMessage="No companies registered yet."
      autoHeight
      hidePagination={companies.length <= 25}
      pageSize={25}
      disableColumnFilter
      disableColumnSelector
      disableDensitySelector
    />
  );
}
