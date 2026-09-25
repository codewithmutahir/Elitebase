import { cn } from "@/lib/utils";

import type { HTMLAttributes, TableHTMLAttributes } from "react";



export function DataTable({

  className,

  ...props

}: TableHTMLAttributes<HTMLTableElement>) {

  return (

    <div className="overflow-x-auto">

      <table

        className={cn("w-full min-w-[640px] text-left text-sm", className)}

        {...props}

      />

    </div>

  );

}



export function DataTableHeader({

  className,

  ...props

}: HTMLAttributes<HTMLTableSectionElement>) {

  return (

    <thead

      className={cn(

        "border-b border-[var(--eb-border,rgba(148,163,184,0.25))] bg-[var(--eb-elevated,rgba(248,250,252,0.9))] text-xs font-semibold uppercase tracking-wide text-[var(--eb-muted,#64748b)]",

        className

      )}

      {...props}

    />

  );

}



export function DataTableBody({

  className,

  ...props

}: HTMLAttributes<HTMLTableSectionElement>) {

  return (

    <tbody

      className={cn(

        "divide-y divide-[var(--eb-border,rgba(148,163,184,0.2))]",

        className

      )}

      {...props}

    />

  );

}



export function DataTableRow({

  className,

  ...props

}: HTMLAttributes<HTMLTableRowElement>) {

  return (

    <tr

      className={cn(

        "transition-colors hover:bg-[var(--eb-hover-overlay,rgba(148,163,184,0.08))]",

        className

      )}

      {...props}

    />

  );

}



export function DataTableHead({

  className,

  ...props

}: HTMLAttributes<HTMLTableCellElement>) {

  return <th className={cn("px-6 py-3", className)} {...props} />;

}



export function DataTableCell({

  className,

  ...props

}: HTMLAttributes<HTMLTableCellElement>) {

  return (

    <td

      className={cn("px-6 py-4 text-[var(--eb-text,#334155)]", className)}

      {...props}

    />

  );

}



export function DataTableEmpty({

  className,

  children,

  ...props

}: HTMLAttributes<HTMLParagraphElement>) {

  return (

    <p

      className={cn(

        "px-6 py-12 text-center text-sm text-[var(--eb-muted,#64748b)]",

        className

      )}

      {...props}

    >

      {children}

    </p>

  );

}


