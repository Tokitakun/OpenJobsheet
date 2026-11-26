import * as React from "react";
import Link from "next/link";
import { FileText } from "lucide-react";

interface FooterProps {
  variant?: "default" | "compact";
}

export function Footer({ variant = "default" }: FooterProps) {
  if (variant === "compact") {
    return (
      <footer className="border-t border-line bg-surface/60 px-4 sm:px-6 py-3 text-[11px] text-ink-muted">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono">
            <span className="font-semibold text-ink-secondary">OpenJobsheet</span>
            <span>•</span>
            <span className="hidden sm:inline">
              Create easily. Learn step by step. Own your data.
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <Link href="/" className="hover:text-ink transition-colors">
              Workspace
            </Link>
            <Link href="/about" className="hover:text-ink transition-colors">
              Tentang
            </Link>
            <span>© 2026 MIT</span>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-line bg-surface/70 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-primary-fg">
              <FileText className="h-3.5 w-3.5" strokeWidth={2} />
            </div>
            <span className="font-semibold text-sm text-ink group-hover:text-primary transition-colors">
              OpenJobsheet
            </span>
          </Link>
          <p className="text-xs text-ink-muted">
            Create easily. Learn step by step. Own your data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-secondary">
          <Link href="/" className="hover:text-ink transition-colors">
            Workspace
          </Link>
          <Link href="/student" className="hover:text-ink transition-colors">
            Student Mode
          </Link>
          <Link href="/about" className="hover:text-ink transition-colors">
            Tentang OpenJobsheet
          </Link>
          <span className="text-line-strong hidden sm:inline">|</span>
          <span className="font-mono text-[11px] text-ink-muted">
            © 2026 OpenJobsheet • Lisensi MIT
          </span>
        </div>
      </div>
    </footer>
  );
}
