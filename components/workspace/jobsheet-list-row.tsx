import * as React from "react";
import Link from "next/link";
import {
  Clock,
  ListOrdered,
  PenTool,
  ArrowUpRight,
  Trash2,
  Globe,
  ShieldOff,
  FileText,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { JobsheetRecord, LocalPublicationRecord } from "@/lib/schema/document";

interface JobsheetListRowProps {
  jobsheet: JobsheetRecord;
  publication?: LocalPublicationRecord;
  onDelete?: (id: string) => void;
  onExport?: (id: string) => void;
}

export function JobsheetListRow({
  jobsheet,
  publication,
  onDelete,
  onExport,
}: JobsheetListRowProps) {
  const categoryVariant =
    jobsheet.category === "TKJ"
      ? "default"
      : jobsheet.category === "SIJA"
      ? "info"
      : jobsheet.category === "TAV"
      ? "warning"
      : "neutral";

  const updatedDateStr = React.useMemo(() => {
    if (!jobsheet.updatedAt) return "Lokal";
    return new Date(jobsheet.updatedAt).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [jobsheet.updatedAt]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-surface border-b border-line last:border-b-0 hover:bg-muted/30 transition-colors group">
      {/* Document Name & Code */}
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        <div className="h-8 w-8 rounded-md bg-muted/70 border border-line flex items-center justify-center text-primary shrink-0 mt-0.5 sm:mt-0">
          <FileText className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/student/${jobsheet.id}`}
              className="font-semibold text-sm text-ink group-hover:text-primary transition-colors truncate hover:underline"
            >
              {jobsheet.title}
            </Link>
            <span className="font-mono text-[11px] text-ink-muted">
              {jobsheet.code || "NO-CODE"}
            </span>
            <Badge variant={categoryVariant} size="sm">
              {jobsheet.category || "Umum"}
            </Badge>
            {publication && publication.status === "active" && (
              <Badge variant="default" size="sm" className="gap-1">
                <Globe className="h-2.5 w-2.5" />
                <span>Pub v{publication.version}</span>
              </Badge>
            )}
            {publication && publication.status === "revoked" && (
              <Badge variant="warning" size="sm" className="gap-1">
                <ShieldOff className="h-2.5 w-2.5" />
                <span>Dicabut</span>
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted mt-0.5">
            <span className="inline-flex items-center gap-1">
              <ListOrdered className="h-3 w-3" />
              {jobsheet.stepCount} Langkah
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {jobsheet.estimatedMinutes} Menit
            </span>
            <span className="hidden md:inline truncate max-w-[160px]">
              {jobsheet.authorName || "Instruktur"}
            </span>
          </div>
        </div>
      </div>

      {/* Updated Timestamp & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-11 sm:pl-0">
        <span className="text-[11px] font-mono text-ink-muted whitespace-nowrap">
          {updatedDateStr}
        </span>

        <div className="flex items-center gap-1.5">
          {onExport && (
            <button
              type="button"
              onClick={() => onExport(jobsheet.id)}
              className="p-1.5 rounded text-ink-secondary hover:text-primary hover:bg-muted transition-colors cursor-pointer"
              title="Ekspor Jobsheet (.jobsheet)"
              aria-label={`Ekspor ${jobsheet.title}`}
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(jobsheet.id)}
              className="p-1.5 rounded text-danger/70 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
              title="Hapus Jobsheet dari IndexedDB"
              aria-label={`Hapus ${jobsheet.title}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <Link href={`/creator?id=${jobsheet.id}`}>
            <Button
              variant="outline"
              size="sm"
              title="Buka di Creator Mode untuk mengedit"
            >
              <PenTool className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Edit</span>
            </Button>
          </Link>
          <Link href={`/student/${jobsheet.id}`}>
            <Button
              variant="primary"
              size="sm"
              title="Buka di Student Mode untuk mengikuti praktikum"
            >
              <span>Buka</span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
