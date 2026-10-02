"use client";

import Box from "@mui/material/Box";
import MuiTable from "@mui/material/Table";
import MuiTableBody from "@mui/material/TableBody";
import MuiTableCell from "@mui/material/TableCell";
import MuiTableContainer from "@mui/material/TableContainer";
import MuiTableHead from "@mui/material/TableHead";
import MuiTableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import {
  DataGrid,
  type DataGridProps,
  type GridColDef,
  type GridRowParams,
  type GridRowsProp,
  type GridValidRowModel,
} from "@mui/x-data-grid";
import {
  forwardRef,
  type ComponentProps,
  type HTMLAttributes,
  type ReactNode,
} from "react";

/**
 * Compound MUI Table wrappers — keep this API for call sites with custom
 * cell JSX (expandable rows, action menus, etc.). Prefer DataGridTable when
 * you have plain columns/rows and want virtualization + built-in pagination.
 */

export const DataTable = forwardRef<
  HTMLDivElement,
  ComponentProps<"div"> & { size?: "small" | "medium" }
>(function DataTable({ className, style, children, size = "medium", ...props }, ref) {
  return (
    <MuiTableContainer ref={ref} className={className} style={style} {...props}>
      <MuiTable size={size} sx={{ minWidth: 640 }}>
        {children}
      </MuiTable>
    </MuiTableContainer>
  );
});

export const DataTableHeader = forwardRef<
  HTMLTableSectionElement,
  ComponentProps<"thead">
>(function DataTableHeader({ className, style, children, ...props }, ref) {
  return (
    <MuiTableHead ref={ref} className={className} style={style} {...props}>
      {children}
    </MuiTableHead>
  );
});

export const DataTableBody = forwardRef<
  HTMLTableSectionElement,
  ComponentProps<"tbody">
>(function DataTableBody({ className, style, children, ...props }, ref) {
  return (
    <MuiTableBody ref={ref} className={className} style={style} {...props}>
      {children}
    </MuiTableBody>
  );
});

export const DataTableRow = forwardRef<
  HTMLTableRowElement,
  ComponentProps<"tr"> & { sx?: ComponentProps<typeof MuiTableRow>["sx"] }
>(function DataTableRow({ className, style, children, sx, ...props }, ref) {
  return (
    <MuiTableRow
      ref={ref}
      className={className}
      style={style}
      hover
      sx={sx}
      {...props}
    >
      {children}
    </MuiTableRow>
  );
});

export const DataTableHead = forwardRef<
  HTMLTableCellElement,
  ComponentProps<"th"> & {
    align?: "left" | "center" | "right" | "justify" | "inherit";
    sx?: ComponentProps<typeof MuiTableCell>["sx"];
  }
>(function DataTableHead({ className, style, children, align, sx, ...props }, ref) {
  return (
    <MuiTableCell
      ref={ref}
      component="th"
      scope="col"
      variant="head"
      align={align}
      className={className}
      style={style}
      sx={sx}
      {...props}
    >
      {children}
    </MuiTableCell>
  );
});

export const DataTableCell = forwardRef<
  HTMLTableCellElement,
  ComponentProps<"td"> & {
    align?: "left" | "center" | "right" | "justify" | "inherit";
    sx?: ComponentProps<typeof MuiTableCell>["sx"];
  }
>(function DataTableCell({ className, style, children, align, sx, ...props }, ref) {
  return (
    <MuiTableCell
      ref={ref}
      align={align}
      className={className}
      style={style}
      sx={sx}
      {...props}
    >
      {children}
    </MuiTableCell>
  );
});

export function DataTableEmpty({
  className,
  style,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <Typography
      component="p"
      className={className}
      style={style}
      sx={{
        px: 3,
        py: 6,
        textAlign: "center",
        fontSize: "0.875rem",
        color: "text.secondary",
      }}
      {...props}
    >
      {children}
    </Typography>
  );
}

export type DataGridTableProps<R extends GridValidRowModel = GridValidRowModel> =
  Omit<DataGridProps<R>, "columns" | "rows" | "onRowClick"> & {
    columns: GridColDef<R>[];
    rows: GridRowsProp<R>;
    loading?: boolean;
    emptyMessage?: ReactNode;
    /** Hide pagination footer (Community still paginates internally). */
    hidePagination?: boolean;
    pageSize?: number;
    onRowClick?: (row: R, params: GridRowParams<R>) => void;
    /** Prefer fixed height so row virtualization stays active for large sets. */
    height?: number | string;
  };

/**
 * MUI X Data Grid (Community / MIT) wrapper themed to `--eb-*`.
 * Use for denser lists; keep compound DataTable for custom row markup
 * (e.g. expandable timesheet detail).
 */
export function DataGridTable<R extends GridValidRowModel = GridValidRowModel>({
  columns,
  rows,
  loading = false,
  emptyMessage = "No rows to display.",
  hidePagination = false,
  pageSize = 25,
  onRowClick,
  height = 480,
  autoHeight,
  initialState,
  slots,
  slotProps,
  sx,
  ...props
}: DataGridTableProps<R>) {
  return (
    <Box
      sx={{
        width: "100%",
        height: autoHeight ? "auto" : height,
        minHeight: autoHeight ? undefined : 240,
      }}
    >
      <DataGrid<R>
        columns={columns}
        rows={rows}
        loading={loading}
        autoHeight={autoHeight}
        disableColumnMenu
        hideFooter={hidePagination}
        initialState={{
          ...initialState,
          pagination: {
            paginationModel: { pageSize, page: 0 },
            ...initialState?.pagination,
          },
        }}
        onRowClick={
          onRowClick
            ? (params) => {
                onRowClick(params.row, params);
              }
            : undefined
        }
        slots={{
          noRowsOverlay: () => (
            <Box
              sx={{
                display: "flex",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                px: 3,
                py: 6,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {emptyMessage}
              </Typography>
            </Box>
          ),
          ...slots,
        }}
        slotProps={slotProps}
        sx={{
          border: 0,
          height: "100%",
          "--DataGrid-overlayHeight": "200px",
          ...sx,
        }}
        {...props}
      />
    </Box>
  );
}
