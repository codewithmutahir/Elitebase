export function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/employees") return "Roster";
  if (pathname.startsWith("/employees/")) return "Employee";
  if (pathname === "/team/time-off") return "Time Off";
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
