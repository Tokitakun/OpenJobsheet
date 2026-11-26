import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Footer } from "@/components/layout/footer";

export interface AppShellProps {
  children: React.ReactNode;
  compactFooter?: boolean;
}

export function AppShell({ children, compactFooter = false }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-canvas text-ink">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <MobileNav />
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <Footer variant={compactFooter ? "compact" : "default"} />
      </div>
    </div>
  );
}
