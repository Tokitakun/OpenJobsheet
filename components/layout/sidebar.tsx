"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  PenTool,
  BookOpen,
  LayoutGrid,
  Database,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: string;
  exact?: boolean;
}

const navItems: NavItem[] = [
  {
    label: "Workspace",
    href: "/",
    icon: LayoutGrid,
    exact: true,
  },
  {
    label: "Creator Mode",
    href: "/creator",
    icon: PenTool,
    badge: "Editor",
  },
  {
    label: "Student Mode",
    href: "/student",
    icon: BookOpen,
    badge: "Guided",
  },
  {
    label: "Tentang",
    href: "/about",
    icon: Info,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-line bg-surface flex flex-col justify-between shrink-0 h-screen sticky top-0 hidden md:flex">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-line flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-fg shadow-xs">
              <FileText className="h-4 w-4" strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-ink text-base tracking-tight leading-tight group-hover:text-primary transition-colors">
                OpenJobsheet
              </span>
              <span className="font-mono text-[11px] text-ink-muted">
                Practical Learning
              </span>
            </div>
          </Link>
          <Badge variant="neutral" size="sm">
            v0.1
          </Badge>
        </div>

        {/* Primary Navigation */}
        <nav className="p-3 space-y-1" aria-label="Main Navigation">
          <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-ink-muted">
            Menu Utama
          </div>
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-fg shadow-xs"
                    : "text-ink-secondary hover:text-ink hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <span>{item.label}</span>
                </div>
                {item.badge && !isActive && (
                  <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-sm bg-muted text-ink-muted">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer & Storage Indicator */}
      <div className="p-4 border-t border-line space-y-3">
        {/* Storage State Indicator */}
        <div className="p-3 rounded-md bg-muted/60 border border-line text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-mono uppercase text-[10px] text-ink-muted tracking-wider flex items-center gap-1.5">
              <Database className="h-3 w-3" strokeWidth={2} />
              Penyimpanan
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
          </div>
          <p className="font-medium text-ink text-xs">Local-First (IndexedDB)</p>
          <p className="text-[11px] text-ink-muted leading-tight">
            Data tersimpan di peramban tanpa wajib akun.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-ink-muted font-mono">Tema Tampilan</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
