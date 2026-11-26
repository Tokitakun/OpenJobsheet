import * as React from "react";
import Link from "next/link";
import {
  Clock,
  ListOrdered,
  User,
  PenTool,
  ArrowUpRight,
  Trash2,
  Globe,
  ShieldOff,
  Download,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { JobsheetRecord, LocalPublicationRecord } from "@/lib/schema/document";

interface JobsheetCardProps {
  jobsheet: JobsheetRecord;
  publication?: LocalPublicationRecord;
  onDelete?: (id: string) => void;
  onExport?: (id: string) => void;
}

export function JobsheetCard({
  jobsheet,
  publication,
  onDelete,
  onExport,
}: JobsheetCardProps) {
  const categoryVariant =
    jobsheet.category === "TKJ"
      ? "default"
      : jobsheet.category === "SIJA"
      ? "info"
      : jobsheet.category === "TAV"
      ? "warning"
      : "neutral";

  const updatedDateStr = React.useMemo(() => {
    if (!jobsheet.updatedAt) return "";
    return new Date(jobsheet.updatedAt).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [jobsheet.updatedAt]);

  return (
    <Card className="flex flex-col justify-between hover:border-line-strong transition-all duration-150 group">
      <div>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-mono text-xs text-ink-muted truncate">
              {jobsheet.code || "NO-CODE"}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
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
              <Badge variant={categoryVariant} size="sm">
                {jobsheet.category || "Umum"}
              </Badge>
            </div>
          </div>
          <CardTitle className="group-hover:text-primary transition-colors">
            <Link href={`/student/${jobsheet.id}`} className="hover:underline">
              {jobsheet.title}
            </Link>
          </CardTitle>
          <CardDescription>
            {jobsheet.data?.description || "Tidak ada deskripsi singkat."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-secondary pt-2">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-ink-muted" strokeWidth={1.75} />
              <span>{jobsheet.estimatedMinutes} Menit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ListOrdered
                className="h-3.5 w-3.5 text-ink-muted"
                strokeWidth={1.75}
              />
              <span>{jobsheet.stepCount} Langkah</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-ink-muted" strokeWidth={1.75} />
              <span className="truncate max-w-[120px]">
                {jobsheet.authorName || "Instruktur"}
              </span>
            </div>
          </div>
        </CardContent>
      </div>

      <CardFooter className="justify-between gap-2 bg-muted/30">
        <span className="text-[11px] font-mono text-ink-muted truncate">
          {updatedDateStr || "Lokal"}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
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
      </CardFooter>
    </Card>
  );
}
