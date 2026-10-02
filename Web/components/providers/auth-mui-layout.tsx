import { MuiProvider } from "@/components/providers/mui-provider";

/** Auth route MUI shell — dark only; landing stays outside this tree. */
export default function AuthMuiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MuiProvider defaultMode="dark" persistMode={false}>
      {children}
    </MuiProvider>
  );
}
