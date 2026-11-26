"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  PenTool,
  BookOpen,
  LayoutGrid,
  Menu,
  X,
  Database,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  const closeDrawer = () => setOpen(false);

  return (
    <header className="md:hidden border-b border-line bg-surface sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2" onClick={closeDrawer}>
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-fg shadow-xs">
            <FileText className="h-3.5 w-3.5" strokeWidth={2} />
          </div>
          <span className="font-semibold text-ink text-sm tracking-tight">
            OpenJobsheet
          </span>
          <Badge variant="neutral" size="sm">
            v0.1
          </Badge>
        </Link>

        {/* Action Toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setOpen(!open)}
            type="button"
            className="h-8 w-8 rounded-md border border-line flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-muted transition-colors cursor-pointer"
            aria-label={open ? "Tutup Menu" : "Buka Menu"}
            aria-expanded={open}
          >
            {open ? (
              <X className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Menu className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {open && (
        <div className="fixed inset-x-0 top-14 bottom-0 bg-canvas/95 backdrop-blur-xs z-50 flex flex-col justify-between p-4 border-t border-line animate-in fade-in duration-150">
          <nav className="space-y-1.5" aria-label="Mobile Navigation">
            <Link
              href="/"
              onClick={closeDrawer}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium transition-colors ${
                pathname === "/"
                  ? "bg-primary text-primary-fg"
                  : "text-ink hover:bg-muted"
              }`}
            >
              <LayoutGrid className="h-5 w-5" strokeWidth={1.75} />
              <span>Workspace</span>
            </Link>

            <Link
              href="/creator"
              onClick={closeDrawer}
              className={`flex items-center justify-between px-3 py-2.5 rounded-md text-base font-medium transition-colors ${
                pathname.startsWith("/creator")
                  ? "bg-primary text-primary-fg"
                  : "text-ink hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-3">
                <PenTool className="h-5 w-5" strokeWidth={1.75} />
                <span>Creator Mode</span>
              </div>
              <span className="font-mono text-xs uppercase px-2 py-0.5 rounded-sm bg-muted text-ink-secondary">
                Editor
              </span>
            </Link>

            <Link
              href="/student"
              onClick={closeDrawer}
              className={`flex items-center justify-between px-3 py-2.5 rounded-md text-base font-medium transition-colors ${
                pathname.startsWith("/student")
                  ? "bg-primary text-primary-fg"
                  : "text-ink hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5" strokeWidth={1.75} />
                <span>Student Mode</span>
              </div>
              <span className="font-mono text-xs uppercase px-2 py-0.5 rounded-sm bg-muted text-ink-secondary">
                Guided
              </span>
            </Link>

            <Link
              href="/about"
              onClick={closeDrawer}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium transition-colors ${
                pathname.startsWith("/about")
                  ? "bg-primary text-primary-fg"
                  : "text-ink hover:bg-muted"
              }`}
            >
              <Info className="h-5 w-5" strokeWidth={1.75} />
              <span>Tentang OpenJobsheet</span>
            </Link>
          </nav>

          {/* Mobile Footer */}
          <div className="p-4 rounded-lg bg-surface border border-line space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" strokeWidth={2} />
              <span className="font-medium text-xs text-ink">
                Penyimpanan Local-First
              </span>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Semua jobsheet dan progres praktikum tersimpan langsung di memori
              peramban (IndexedDB) Anda tanpa pelacakan server.
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
