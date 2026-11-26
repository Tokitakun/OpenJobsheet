import * as React from "react";
import { SearchX, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
}

export function EmptyState({
  title = "Jobsheet tidak ditemukan.",
  description = "Coba ubah kata kunci pencarian atau atur ulang filter kategori.",
  onReset,
}: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-line p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto my-8 bg-surface/50">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-ink-muted mb-4">
        <SearchX className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <h3 className="font-semibold text-ink text-base mb-1">{title}</h3>
      <p className="text-sm text-ink-secondary mb-6 leading-relaxed">
        {description}
      </p>
      {onReset && (
        <Button variant="secondary" size="sm" onClick={onReset}>
          <RefreshCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span>Reset Filter & Pencarian</span>
        </Button>
      )}
    </div>
  );
}
