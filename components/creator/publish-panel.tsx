"use client";

import * as React from "react";
import {
  Globe,
  Copy,
  CheckCircle2,
  RefreshCw,
  ShieldOff,
  Trash2,
  AlertCircle,
  Link as LinkIcon,
  Loader2,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LocalPublicationRecord } from "@/lib/schema/document";
import {
  publishJobsheet,
  updatePublishedJobsheet,
  revokePublishedJobsheet,
  deletePublishedJobsheet,
} from "@/lib/publishing/publishing-service";
import { getPublicationsByDocumentId } from "@/lib/storage/jobsheet-repository";

type PanelStep = "idle" | "publishing" | "published" | "error";
type ActionLoading = null | "update" | "revoke" | "delete";

interface PublishPanelProps {
  documentId: string;
  documentTitle: string;
  onClose: () => void;
}

export function PublishPanel({
  documentId,
  documentTitle,
  onClose,
}: PublishPanelProps) {
  const [step, setStep] = React.useState<PanelStep>("idle");
  const [publication, setPublication] = React.useState<LocalPublicationRecord | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<ActionLoading>(null);
  const [loading, setLoading] = React.useState(true);

  // Load existing publication for this document
  React.useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const pubs = await getPublicationsByDocumentId(documentId);
        const activePub = pubs.find((p) => p.status === "active");
        if (activePub && active) {
          setPublication(activePub);
          setStep("published");
        }
      } catch (err) {
        console.error("Failed to load publications:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [documentId]);

  const handlePublish = async () => {
    setStep("publishing");
    setErrorMessage(null);

    try {
      const result = await publishJobsheet(documentId);
      const pubs = await getPublicationsByDocumentId(documentId);
      const pub = pubs.find((p) => p.publicationId === result.publicationId);
      if (pub) setPublication(pub);
      setStep("published");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Publikasi gagal.");
      setStep("error");
    }
  };

  const handleUpdate = async () => {
    if (!publication) return;
    setActionLoading("update");
    setErrorMessage(null);

    try {
      const result = await updatePublishedJobsheet(
        publication.publicationId,
        publication.ownerToken,
        documentId
      );
      setPublication((prev) =>
        prev ? { ...prev, version: result.version, updatedAt: result.updatedAt } : prev
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Update gagal.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async () => {
    if (!publication) return;
    if (!confirm("Cabut akses publikasi? Siswa tidak lagi bisa membuka link ini.")) return;

    setActionLoading("revoke");
    setErrorMessage(null);

    try {
      await revokePublishedJobsheet(publication.publicationId, publication.ownerToken);
      setPublication((prev) => (prev ? { ...prev, status: "revoked" } : prev));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Revoke gagal.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!publication) return;
    if (!confirm("Hapus publikasi secara permanen? Tindakan ini tidak dapat dibatalkan.")) return;

    setActionLoading("delete");
    setErrorMessage(null);

    try {
      await deletePublishedJobsheet(publication.publicationId, publication.ownerToken);
      setPublication(null);
      setStep("idle");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Delete gagal.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyLink = async () => {
    if (!publication) return;
    try {
      await navigator.clipboard.writeText(publication.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const input = document.createElement("input");
      input.value = publication.shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="border border-line rounded-lg bg-surface p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-primary font-bold flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Publikasi
          </span>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-muted cursor-pointer">
            <X className="h-4 w-4 text-ink-muted" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-muted font-mono">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Memuat status publikasi...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-line rounded-lg bg-surface p-6 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase text-primary font-bold flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Publikasi
        </span>
        <button type="button" onClick={onClose} className="p-1 rounded hover:bg-muted cursor-pointer">
          <X className="h-4 w-4 text-ink-muted" />
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-3 flex items-start gap-2 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Idle State — Not published yet */}
      {step === "idle" && (
        <div className="space-y-3">
          <p className="text-xs text-ink-secondary leading-relaxed">
            Terbitkan <strong>&quot;{documentTitle}&quot;</strong> agar dapat dibagikan kepada siswa melalui link. Dokumen asli tetap tersimpan di perangkat Anda.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePublish}
            className="w-full cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Terbitkan Jobsheet</span>
          </Button>
        </div>
      )}

      {/* Publishing State */}
      {step === "publishing" && (
        <div className="flex items-center gap-3 text-xs text-ink-muted font-mono py-4">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Mengunggah dokumen dan media ke server...</span>
        </div>
      )}

      {/* Error State */}
      {step === "error" && (
        <div className="space-y-3">
          <p className="text-xs text-ink-secondary">
            Publikasi gagal. Dokumen asli Anda tidak terpengaruh.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePublish}
            className="w-full cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Coba Lagi</span>
          </Button>
        </div>
      )}

      {/* Published State */}
      {step === "published" && publication && (
        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2 text-xs font-mono">
            {publication.status === "active" ? (
              <span className="flex items-center gap-1.5 text-primary font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Aktif — Versi {publication.version}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-danger font-semibold">
                <ShieldOff className="h-3.5 w-3.5" />
                Dicabut
              </span>
            )}
          </div>

          {/* Share URL */}
          {publication.status === "active" && (
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-ink-muted block">
                Share Link
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted/40 border border-line rounded px-3 py-2 text-xs text-ink font-mono truncate flex items-center gap-2">
                  <LinkIcon className="h-3.5 w-3.5 text-ink-muted shrink-0" />
                  <span className="truncate">{publication.shareUrl}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="shrink-0 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Salin</span>
                    </>
                  )}
                </Button>
              </div>

              <a
                href={publication.shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Buka di tab baru
              </a>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-ink-muted pt-2 border-t border-line">
            <div>
              <span className="block uppercase text-[10px]">Diterbitkan</span>
              <span>{new Date(publication.publishedAt).toLocaleDateString("id-ID")}</span>
            </div>
            <div>
              <span className="block uppercase text-[10px]">Diperbarui</span>
              <span>{new Date(publication.updatedAt).toLocaleDateString("id-ID")}</span>
            </div>
          </div>

          {/* Management Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-line">
            {publication.status === "active" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUpdate}
                  disabled={actionLoading !== null}
                  className="cursor-pointer"
                >
                  {actionLoading === "update" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  <span>Perbarui</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRevoke}
                  disabled={actionLoading !== null}
                  className="text-amber hover:text-amber cursor-pointer"
                >
                  {actionLoading === "revoke" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldOff className="h-3.5 w-3.5" />
                  )}
                  <span>Cabut Akses</span>
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={actionLoading !== null}
              className="text-danger hover:text-danger cursor-pointer"
            >
              {actionLoading === "delete" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>Hapus</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
