"use client";

import * as React from "react";
import {
  Upload,
  FileArchive,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  ListOrdered,
  Clock,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  inspectJobsheetPackage,
  commitJobsheetImport,
  type JobsheetImportPreview,
} from "@/lib/portability/jobsheet-package";

interface ImportJobsheetDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: (message: string) => void;
}

type ImportStep = "pick" | "validating" | "preview" | "importing" | "error";

export function ImportJobsheetDialog({
  open,
  onClose,
  onImported,
}: ImportJobsheetDialogProps) {
  const [step, setStep] = React.useState<ImportStep>("pick");
  const [preview, setPreview] = React.useState<JobsheetImportPreview | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = React.useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const resetState = React.useCallback(() => {
    setStep("pick");
    setPreview(null);
    setErrorMessage(null);
    setSelectedFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleClose = React.useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  if (!open) return null;

  const handleFileSelected = async (file: File | undefined) => {
    if (!file) return;
    setSelectedFileName(file.name);
    setStep("validating");
    setErrorMessage(null);

    try {
      const parsed = await inspectJobsheetPackage(file);
      setPreview(parsed);
      setStep("preview");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "File tidak valid atau rusak."
      );
      setStep("error");
    }
  };

  const handleConfirmImport = async () => {
    if (!preview) return;
    setStep("importing");
    setErrorMessage(null);

    try {
      const result = await commitJobsheetImport(preview);
      const msg = result.importedAsCopy
        ? `Import berhasil: "${result.record.title}" disimpan sebagai salinan baru.`
        : `Import berhasil: "${result.record.title}" telah ditambahkan ke Workspace.`;
      onImported(msg);
      handleClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan jobsheet ke penyimpanan lokal."
      );
      setStep("error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-[1px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-dialog-title"
    >
      <div className="w-full max-w-lg rounded-lg border border-line bg-surface shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <Upload className="h-4 w-4 text-primary" />
            <h2
              id="import-dialog-title"
              className="text-base font-semibold text-ink"
            >
              Impor Jobsheet
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={step === "importing"}
            aria-label="Tutup dialog impor"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-muted cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {step === "pick" && (
            <div className="space-y-4">
              <p className="text-sm text-ink-secondary leading-relaxed">
                Pilih file paket <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">.jobsheet</code> yang sebelumnya diekspor dari OpenJobsheet. Seluruh isi dan gambar lokal akan dipulihkan ke perangkat ini.
              </p>

              <label
                htmlFor="jobsheet-import-input"
                className="flex flex-col items-center justify-center gap-2.5 rounded-lg border-2 border-dashed border-line-strong bg-canvas/50 p-8 text-center cursor-pointer hover:border-primary hover:bg-muted/40 transition-colors"
              >
                <div className="h-11 w-11 rounded-full bg-sage/60 text-primary flex items-center justify-center">
                  <FileArchive className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-primary block">
                    Pilih File .jobsheet
                  </span>
                  <span className="text-xs text-ink-muted">
                    Maksimum 25 MB • Format paket OpenJobsheet
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  id="jobsheet-import-input"
                  type="file"
                  accept=".jobsheet,application/zip"
                  className="sr-only"
                  onChange={(e) => handleFileSelected(e.target.files?.[0])}
                />
              </label>
            </div>
          )}

          {step === "validating" && (
            <div className="py-10 flex flex-col items-center justify-center gap-3 text-sm text-ink-secondary">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Memeriksa keutuhan file {selectedFileName}...</span>
            </div>
          )}

          {step === "error" && (
            <div className="space-y-4">
              <div className="rounded-md border border-danger/30 bg-danger/5 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-danger">
                    File Tidak Valid
                  </p>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleClose}>
                  Tutup
                </Button>
                <Button variant="primary" size="sm" onClick={resetState}>
                  Pilih File Lain
                </Button>
              </div>
            </div>
          )}

          {(step === "preview" || step === "importing") && preview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Pratinjau Import
                </span>
                <Badge variant="neutral" size="sm">
                  {preview.category}
                </Badge>
              </div>

              <div className="rounded-md border border-line bg-canvas/50 p-4 space-y-2.5">
                <div className="text-xs font-mono text-ink-muted">
                  {preview.code} • {preview.authorName}
                </div>
                <h3 className="text-base font-bold text-ink">
                  {preview.title}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-ink-secondary pt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <ListOrdered className="h-3.5 w-3.5 text-ink-muted" />
                    {preview.stepCount} Langkah
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-ink-muted" />
                    {preview.estimatedMinutes} Menit
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-ink-muted" />
                    {preview.mediaCount} Gambar
                  </span>
                </div>
              </div>

              {preview.isDuplicateId && (
                <div className="rounded-md border border-amber/40 bg-amber/10 p-3 flex items-start gap-2.5 text-xs text-ink">
                  <Copy className="h-4 w-4 text-amber shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Jobsheet dengan ID yang sama sudah ada di perangkat ini.
                    Dokumen akan diimpor sebagai <strong>salinan baru</strong>{" "}
                    tanpa menimpa dokumen lama.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetState}
                  disabled={step === "importing"}
                >
                  Pilih File Lain
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmImport}
                  disabled={step === "importing"}
                >
                  {step === "importing" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Mengimpor...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Mulai Import</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
