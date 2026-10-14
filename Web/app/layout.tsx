import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { NavigationProgress } from "@/components/navigation/navigation-progress";
import { TooltipProvider } from "@/components/ui-legacy/tooltip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-landing",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Elitebase",
  description: "Employee time tracking for teams and kiosk check-ins",
  themeColor: "#0B1633",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Elitebase",
    description: "Employee time tracking for teams and kiosk check-ins",
    images: [{ url: "/brand/elitebase-logo-on-dark.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className={`${inter.className} flex min-h-full flex-col font-sans`}
      >
        <NavigationProgress />
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
