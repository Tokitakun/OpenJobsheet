"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OpenJobsheetDocument } from "@/lib/schema/document";
import { getJobsheetById } from "@/lib/storage/jobsheet-repository";
import {
  buildJobsheetPdfLayout,
  exportJobsheetToPdf,
  resolveDocumentMediaForPdf,
  type PdfDocumentLayout,
  type PdfRenderItem,
  type ResolvedPdfMedia,
} from "@/lib/pdf/jobsheet-pdf";

type ExportStatus = "idle" | "generating" | "success" | "error";

const ZOOM_STEPS = [0.6, 0.75, 0.9, 1, 1.15, 1.3];

export function PdfPreviewClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [doc, setDoc] = React.useState<OpenJobsheetDocument | null>(null);
  const [mediaMap, setMediaMap] = React.useState<Record<string, ResolvedPdfMedia>>({});
  const [layout, setLayout] = React.useState<PdfDocumentLayout | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [zoomIndex, setZoomIndex] = React.useState(3); // 100%
  const [exportStatus, setExportStatus] = React.useState<ExportStatus>("idle");
  const [exportMessage, setExportMessage] = React.useState<string | null>(null);

  // Responsive initial zoom on mobile screens
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      Promise.resolve().then(() => setZoomIndex(0)); // 60% fits mobile width cleanly
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const record = await getJobsheetById(id);
        if (!record || cancelled) {
          if (!cancelled) setLoading(false);
          return;
        }
        const resolvedMedia = await resolveDocumentMediaForPdf(record.data.id);
        if (cancelled) return;

        const computedLayout = buildJobsheetPdfLayout(record.data, resolvedMedia);
        setDoc(record.data);
        setMediaMap(resolvedMedia);
        setLayout(computedLayout);
        setCurrentPage(1);
      } catch (err) {
        console.error("Gagal memuat preview PDF:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = false;
    };
  }, [id]);

  const zoom = ZOOM_STEPS[zoomIndex] ?? 1;
  const totalPages = layout?.totalPages || 1;
  const activePage = layout?.pages[currentPage - 1] || layout?.pages[0];

  const handleDownloadPdf = async () => {
    if (!doc) return;
    setExportStatus("generating");
    setExportMessage("Menyiapkan PDF...");

    try {
      // Re-fetch latest saved document & media before export to avoid stale output
      const latestRecord = await getJobsheetById(doc.id);
      const latestDoc = latestRecord ? latestRecord.data : doc;
      const latestMedia = await resolveDocumentMediaForPdf(latestDoc.id);

      exportJobsheetToPdf(latestDoc, latestMedia);
      setExportStatus("success");
      setExportMessage("PDF berhasil diunduh.");
      setTimeout(() => {
        setExportStatus("idle");
        setExportMessage(null);
      }, 3500);
    } catch (err) {
      console.error("PDF export error:", err);
      setExportStatus("error");
      setExportMessage("Gagal membuat PDF. Silakan coba lagi.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E4E7E4] text-ink font-mono text-sm">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Menyiapkan pratinjau dokumen PDF...</span>
        </div>
      </div>
    );
  }

  if (!doc || !layout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#E4E7E4] text-ink p-6 text-center space-y-4">
        <FileText className="h-10 w-10 text-ink-muted" />
        <h1 className="text-lg font-bold">Dokumen Tidak Ditemukan</h1>
        <p className="text-sm text-ink-secondary max-w-md">
          Pastikan Anda membuka pratinjau PDF dari dokumen yang sudah tersimpan
          di Creator Mode atau Workspace.
        </p>
        <Link href="/">
          <Button variant="primary" size="md">
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Workspace</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#DFE3DF] text-ink">
      {/* Adobe Acrobat / Google Docs-inspired PDF Viewer Header */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back to Editor + Document Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href={`/creator?id=${doc.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Editor</span>
            </Button>
          </Link>
          <div className="h-5 w-px bg-line hidden sm:block" />
          <span className="text-sm font-semibold text-ink truncate max-w-[160px] md:max-w-[280px]">
            {doc.title || "Tanpa Judul"}
          </span>
        </div>

        {/* Center: Page Navigation & Zoom Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Page Navigation */}
          <div className="flex items-center gap-1 bg-muted border border-line rounded-md px-1.5 py-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              aria-label="Halaman Sebelumnya"
              title="Halaman Sebelumnya"
              className="h-8 w-8 inline-flex items-center justify-center rounded text-ink hover:bg-surface disabled:opacity-35 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-mono px-2 text-ink whitespace-nowrap">
              Halaman {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              aria-label="Halaman Berikutnya"
              title="Halaman Berikutnya"
              className="h-8 w-8 inline-flex items-center justify-center rounded text-ink hover:bg-surface disabled:opacity-35 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-muted border border-line rounded-md px-1.5 py-1">
            <button
              type="button"
              onClick={() => setZoomIndex((z) => Math.max(0, z - 1))}
              disabled={zoomIndex <= 0}
              aria-label="Perkecil"
              title="Perkecil"
              className="h-8 w-8 inline-flex items-center justify-center rounded text-ink hover:bg-surface disabled:opacity-35 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-mono px-2 text-ink min-w-[48px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() =>
                setZoomIndex((z) => Math.min(ZOOM_STEPS.length - 1, z + 1))
              }
              disabled={zoomIndex >= ZOOM_STEPS.length - 1}
              aria-label="Perbesar"
              title="Perbesar"
              className="h-8 w-8 inline-flex items-center justify-center rounded text-ink hover:bg-surface disabled:opacity-35 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right: Download PDF */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={exportStatus === "generating"}
          >
            {exportStatus === "generating" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>
              {exportStatus === "generating" ? "Menyiapkan PDF..." : "Unduh PDF"}
            </span>
          </Button>
        </div>
      </header>

      {/* Status Toast / Feedback Banner */}
      {exportMessage && (
        <div
          className={`px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 border-b ${
            exportStatus === "error"
              ? "bg-danger/10 text-danger border-danger/30"
              : exportStatus === "success"
              ? "bg-sage text-primary border-primary/20"
              : "bg-surface text-ink-secondary border-line"
          }`}
          role="status"
        >
          {exportStatus === "generating" && (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          )}
          {exportStatus === "success" && (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          {exportStatus === "error" && <AlertCircle className="h-3.5 w-3.5" />}
          <span>{exportMessage}</span>
        </div>
      )}

      {/* Preview Area: Neutral gray background + centered white A4 page */}
      <main className="flex-1 overflow-auto p-4 sm:p-8 flex flex-col items-center">
        {activePage && (
          <div
            className="w-full flex justify-center"
            style={{
              // Reserve scaled height cleanly so there is no clipping or overflow
              minHeight: `${Math.round(1123 * zoom)}px`,
            }}
          >
            <div
              className="bg-white text-[#202824] border border-[#C5CEC7] shadow-md origin-top transition-transform duration-150 shrink-0 flex flex-col justify-between"
              style={{
                width: "794px", // A4 portrait at 96 DPI (210mm)
                minHeight: "1123px", // A4 portrait at 96 DPI (297mm)
                padding: "68px", // 18mm margin
                transform: `scale(${zoom})`,
              }}
              aria-label={`Halaman ${activePage.pageNumber} dari ${totalPages}`}
            >
              <div className="space-y-4">
                {activePage.items.map((item, idx) => (
                  <PdfPreviewItem key={idx} item={item} mediaMap={mediaMap} />
                ))}
              </div>

              {/* Page Footer matching exported PDF */}
              <div className="pt-4 mt-8 border-t border-[#DCE2DD] flex items-center justify-between text-[11px] font-mono text-[#64706A]">
                <span>OpenJobsheet</span>
                <span>
                  Halaman {activePage.pageNumber} dari {totalPages}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function PdfPreviewItem({
  item,
}: {
  item: PdfRenderItem;
  mediaMap: Record<string, ResolvedPdfMedia>;
}) {
  switch (item.kind) {
    case "doc-header":
      return (
        <div className="pb-4 border-b border-[#DCE2DD] space-y-2">
          <div className="text-[11px] font-mono font-semibold text-[#285C4D]">
            {item.code} • {item.category} • {item.durationMinutes} Menit •{" "}
            {item.authorName}
          </div>
          <h1 className="text-2xl font-bold text-[#202824] leading-tight">
            {item.title}
          </h1>
          {item.description && (
            <p className="text-sm text-[#5F6B65] leading-relaxed">
              {item.description}
            </p>
          )}
        </div>
      );

    case "section-header":
      return (
        <div className="pt-3 space-y-1">
          <div className="text-[11px] font-mono font-bold text-[#285C4D] uppercase tracking-wider">
            Bagian {item.sectionNumber}
          </div>
          <h2 className="text-lg font-bold text-[#202824]">{item.title}</h2>
          {item.description && (
            <p className="text-xs text-[#5F6B65]">{item.description}</p>
          )}
        </div>
      );

    case "step-header":
      return (
        <div className="pt-2 flex items-baseline justify-between gap-4">
          <h3 className="text-sm font-bold text-[#202824]">
            Langkah {item.stepNumber}: {item.title}
          </h3>
          {item.estimatedMinutes && (
            <span className="text-[11px] font-mono text-[#64706A] shrink-0">
              ~{item.estimatedMinutes} mnt
            </span>
          )}
        </div>
      );

    case "paragraph":
      return (
        <p className="text-[13px] text-[#202824] leading-relaxed whitespace-pre-wrap">
          {item.lines.join("\n")}
        </p>
      );

    case "heading":
      return (
        <h4 className="text-sm font-bold text-[#202824]">
          {item.lines.join(" ")}
        </h4>
      );

    case "callout": {
      const borderColor =
        item.variant === "danger"
          ? "border-l-[#B42318]"
          : item.variant === "warning"
          ? "border-l-[#A3621A]"
          : item.variant === "info"
          ? "border-l-[#1D5D8C]"
          : "border-l-[#285C4D]";

      return (
        <div
          className={`bg-[#F4F6F4] border-l-4 ${borderColor} px-3.5 py-2.5 space-y-1`}
        >
          <div className="text-xs font-bold text-[#202824]">{item.title}</div>
          <p className="text-xs text-[#37413C] leading-relaxed whitespace-pre-wrap">
            {item.lines.join("\n")}
          </p>
        </div>
      );
    }

    case "checklist":
      return (
        <div className="space-y-1.5">
          {item.title && (
            <div className="text-xs font-bold text-[#285C4D]">{item.title}</div>
          )}
          <div className="space-y-1">
            {item.items.map((chk, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-[#202824]">
                <span className="inline-block w-3.5 h-3.5 border border-[#828C86] rounded-[2px] shrink-0 mt-0.5" />
                <span>
                  {chk.text}
                  {chk.required && <span className="text-[#B42318] ml-0.5">*</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      );

    case "code":
      return (
        <div className="bg-[#EDF1ED] px-3 py-2.5 rounded-sm font-mono space-y-1">
          <div className="text-[10px] font-bold text-[#5F6B65] uppercase">
            {item.language}
          </div>
          <pre className="text-[11px] text-[#202824] whitespace-pre-wrap leading-snug">
            {item.lines.join("\n")}
          </pre>
        </div>
      );

    case "image":
      return item.dataUrl ? (
        <figure className="flex flex-col items-center space-y-1.5 py-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.dataUrl}
            alt={item.altText}
            className="max-w-full max-h-[360px] object-contain border border-[#DCE2DD]"
          />
          {item.caption && (
            <figcaption className="text-[11px] italic text-[#5F6B65]">
              {item.caption}
            </figcaption>
          )}
        </figure>
      ) : (
        <div className="text-xs italic text-[#5F6B65] py-1">
          [Gambar: {item.altText}]
        </div>
      );

    case "table":
      return (
        <div className="overflow-x-auto border border-[#DCE2DD]">
          <table className="w-full text-xs border-collapse">
            {item.headers.length > 0 && (
              <thead className="bg-[#F4F6F4]">
                <tr>
                  {item.headers.map((h, i) => (
                    <th
                      key={i}
                      className="text-left px-2.5 py-1.5 font-semibold border-b border-[#DCE2DD]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {item.rows.map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-[#DCE2DD] last:border-b-0">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-2.5 py-1.5">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "video":
      return (
        <div className="text-xs italic text-[#5F6B65]">
          [Video: {item.title || item.url}]
        </div>
      );
  }
}
