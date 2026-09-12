import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "@/globals.css";

export const metadata: Metadata = {
  title: "JAMB Quest - CBT Practice Platform",
  description: "Practice JAMB questions with our comprehensive CBT/PWA platform",
  viewport: "width=device-width, initial-scale=1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
