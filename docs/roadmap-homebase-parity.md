# Homebase-Inspired Feature Backlog

Future enhancements for Elitebase employee portal, prioritized by fit with kiosk + face + scheduling. **Not implemented** — review and approve before starting any item.

## P1 — High value, strong fit

| Feature | Why | Effort |
|---------|-----|--------|
| PTO / time-off requests | Prevents schedule conflicts; standard in Homebase | Medium |
| Overtime rules & alerts | Flag shifts >8h or >40h/week before publish | Medium |

## P2 — Manager productivity

| Feature | Why | Effort |
|---------|-----|--------|
| Shift swap / open shift claiming | Reduces back-and-forth coverage | High |
| Schedule templates | Reuse weekly patterns | Medium |
| Labor cost vs budget | Week footer totals vs budget line | Low–Medium |

## P3 — Timesheets & payroll prep

| Feature | Why | Effort |
|---------|-----|--------|
| Break tracking in timesheets | `break_start` / `break_end` already in attendance schema | Medium |
| Payroll export (QuickBooks-style) | Extend CSV export formats | Low |
| Auto-schedule draft (rules-based) | Start with rules before AI | High |

## P4 — Optional / larger scope

| Feature | Why | Effort |
|---------|-----|--------|
| POS / sales integration | Labor % vs sales for retail clients | High |
| Full payroll + tax filing | Only if becoming a payroll provider | Very high |

## Reference — Homebase core loop

Homebase combines scheduling, time clock, timesheets, and payroll in one flow. Elitebase already covers kiosk clock-in, timesheets, and scheduling. The highest-impact gaps vs Homebase are **PTO**, **overtime visibility**, and **labor budgeting** — not full tax payroll.

## Suggested next sprint (when approved)

1. PTO request + manager approval (blocks shift assignment on approved days)
2. Overtime warnings on schedule publish
3. QuickBooks-style payroll CSV export (extends existing month export)
