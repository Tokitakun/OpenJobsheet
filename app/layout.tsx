import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenJobsheet — Practical Learning Documentation Platform",
  description:
    "Open-source digital practical worksheet (jobsheet) platform for vocational education (SMK), polytechnics, and technical laboratories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-canvas text-ink font-sans">
        {children}
      </body>
    </html>
  );
}
