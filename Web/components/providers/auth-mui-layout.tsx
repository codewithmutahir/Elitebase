import { MuiProvider } from "@/components/providers/mui-provider";
import { elitebaseAuthMuiTheme } from "@/lib/mui/auth-theme";

/** Auth route MUI shell — dark only; landing stays outside this tree. */
export default function AuthMuiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MuiProvider
      theme={elitebaseAuthMuiTheme}
      defaultMode="dark"
      persistMode={false}
    >
      {children}
    </MuiProvider>
  );
}
