export function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/employees") return "Roster";
  if (pathname.startsWith("/employees/")) return "Employee";
  if (pathname === "/team/time-off") return "Time Off";
  if (pathname === "/team/benefits") return "Benefits";
  if (pathname === "/team/payslips") return "Payslips";
  if (pathname === "/schedule/schedule") return "Schedule";
  if (pathname === "/schedule/departments") return "Departments & Roles";
  if (pathname === "/schedule/availability") return "Team Availability";
  if (pathname.startsWith("/schedule/")) return "Schedule";
  if (pathname === "/timesheets") return "Timesheets";
  if (pathname === "/kiosk-setup") return "Kiosk Setup";
  if (pathname === "/settings") return "Settings";
  if (pathname.startsWith("/super-admin")) return "Super Admin";
  return "Elitebase";
}

/** Employee portal page titles (header). */
export function getPortalPageTitle(pathname: string): string {
  if (pathname === "/portal") return "Home";
  if (pathname.startsWith("/portal/clock")) return "Clock";
  if (pathname.startsWith("/portal/attendance")) return "Attendance";
  if (pathname.startsWith("/portal/pay")) return "Pay";
  if (pathname.startsWith("/portal/payslips")) return "Payslips";
  if (pathname.startsWith("/portal/benefits")) return "Benefits";
  if (pathname.startsWith("/portal/leave")) return "Leave";
  return "Portal";
}
