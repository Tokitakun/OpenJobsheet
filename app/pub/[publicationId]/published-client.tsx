"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  ListOrdered,
  FileText,
  CheckSquare,
  Target,
  Wrench,
  CheckCircle2,
  ArrowRight,
  Flag,
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  Info,
  Lightbulb,
  Code2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type {
  OpenJobsheetDocument,
  PracticalStep,
  ContentBlock,
} from "@/lib/schema/document";
import {
  getStudentProgress,
  saveStudentProgress,
} from "@/lib/storage/jobsheet-repository";
import { getPublishedDocument } from "@/lib/publishing/publishing-service";
import { PublishedImageRenderer } from "@/components/shared/published-image-renderer";

type LoadState = "loading" | "loaded" | "not_found" | "revoked" | "forbidden" | "error";

export default function PublishedJobsheetClient({
  publicationId,
}: {
  publicationId: string;
}) {
  const searchParams = useSearchParams();
  const shareToken = searchParams.get("token") || "";

  const [loadState, setLoadState] = React.useState<LoadState>("loading");
  const [doc, setDoc] = React.useState<OpenJobsheetDocument | null>(null);
  const [pubVersion, setPubVersion] = React.useState<number>(1);
  const [viewMode, setViewMode] = React.useState<"guided" | "document">("guided");
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [checkedItemIds, setCheckedItemIds] = React.useState<Set<string>>(new Set());
  const [completedStepIds, setCompletedStepIds] = React.useState<Set<string>>(new Set());

  // Isolate local student progress per publicationId AND publication version
  const progressKey = `pub:${publicationId}:v${pubVersion}`;

  // Load published document
  React.useEffect(() => {
    let active = true;

    async function load() {
      setLoadState("loading");
      try {
        const result = await getPublishedDocument(publicationId, shareToken);
        if (!active) return;

        setDoc(result.document);
        const version = result.version || 1;
        setPubVersion(version);
        if (result.document.settings?.defaultViewMode) {
          setViewMode(result.document.settings.defaultViewMode);
        }

        // Load local student progress for this publicationId + version
        const versionedKey = `pub:${publicationId}:v${version}`;
        const progress = await getStudentProgress(versionedKey);
        if (progress && active) {
          const allDocSteps = (result.document.sections || []).flatMap(
            (s) => s.steps || []
          );
          const validItemIds = new Set<string>();
          for (const step of allDocSteps) {
            for (const blk of step.blocks || []) {
              if (blk.type === "checklist" && Array.isArray(blk.items)) {
                for (const itm of blk.items) validItemIds.add(itm.id);
              }
            }
          }
          const filteredChecked = (progress.checkedItemIds || []).filter((id) =>
            validItemIds.has(id)
          );
          setCheckedItemIds(new Set(filteredChecked));
          setCompletedStepIds(new Set(progress.completedStepIds || []));

          if (progress.currentStepId) {
            const idx = allDocSteps.findIndex((s) => s.id === progress.currentStepId);
            if (idx !== -1) setCurrentStepIndex(idx);
          }
        }

        setLoadState("loaded");
      } catch (err) {
        if (!active) return;
        const msg = err instanceof Error ? err.message : "";
        if (msg === "REVOKED") setLoadState("revoked");
        else if (msg === "NOT_FOUND") setLoadState("not_found");
        else if (msg === "FORBIDDEN") setLoadState("forbidden");
        else setLoadState("error");
      }
    }

    load();
    return () => { active = false; };
  }, [publicationId, shareToken]);

  const allSteps: PracticalStep[] = React.useMemo(() => {
    if (!doc || !Array.isArray(doc.sections)) return [];
    return doc.sections.flatMap((s) => s.steps || []);
  }, [doc]);

  const allChecklistItems = React.useMemo(() => {
    const items: { id: string; required: boolean }[] = [];
    allSteps.forEach((s) => {
      (s.blocks || []).forEach((b) => {
        if (b.type === "checklist" && Array.isArray(b.items)) {
          b.items.forEach((itm) => items.push({ id: itm.id, required: itm.required }));
        }
      });
    });
    return items;
  }, [allSteps]);

  const activeStep = allSteps[currentStepIndex] || allSteps[0];
  const totalSteps = allSteps.length;
  const progressPercent = totalSteps ? Math.round(((currentStepIndex + 1) / totalSteps) * 100) : 0;
  const totalChecklistCount = allChecklistItems.length;
  const completedChecklistCount = allChecklistItems.filter((i) => checkedItemIds.has(i.id)).length;

  const persistProgress = React.useCallback(
    async (
      newChecked: Set<string>,
      newCompletedSteps: Set<string>,
      newStepIndex: number
    ) => {
      if (!doc) return;
      const currentStep = allSteps[newStepIndex] || activeStep;
      const isAllDone =
        totalSteps > 0 &&
        newCompletedSteps.size >= totalSteps &&
        allChecklistItems.filter((i) => i.required).every((i) => newChecked.has(i.id));

      const now = Date.now();
      try {
        await saveStudentProgress({
          documentId: progressKey,
          currentStepId: currentStep?.id || "",
          completedStepIds: Array.from(newCompletedSteps),
          checkedItemIds: Array.from(newChecked),
          startedAt: now,
          lastActiveAt: now,
          completedAt: isAllDone ? now : undefined,
        });
      } catch (e) {
        console.error("Gagal menyimpan progress siswa:", e);
      }
    },
    [doc, allSteps, activeStep, totalSteps, allChecklistItems, progressKey]
  );

  const toggleCheck = async (itemId: string) => {
    const next = new Set(checkedItemIds);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    setCheckedItemIds(next);
    await persistProgress(next, completedStepIds, currentStepIndex);
  };

  const handleGoToStep = async (newIdx: number) => {
    const bounded = Math.max(0, Math.min(totalSteps - 1, newIdx));
    setCurrentStepIndex(bounded);
    await persistProgress(checkedItemIds, completedStepIds, bounded);
  };

  const handleMarkStepComplete = async () => {
    if (!activeStep) return;
    const nextCompleted = new Set(completedStepIds);
    nextCompleted.add(activeStep.id);
    setCompletedStepIds(nextCompleted);
    const nextIdx = Math.min(totalSteps - 1, currentStepIndex + 1);
    setCurrentStepIndex(nextIdx);
    await persistProgress(checkedItemIds, nextCompleted, nextIdx);
  };

  const handleResetProgress = async () => {
    if (confirm("Reset seluruh progres pengerjaan praktikum ini?")) {
      const emptyChecked = new Set<string>();
      const emptySteps = new Set<string>();
      setCheckedItemIds(emptyChecked);
      setCompletedStepIds(emptySteps);
      setCurrentStepIndex(0);
      await persistProgress(emptyChecked, emptySteps, 0);
    }
  };

  // ── Error / Loading States ──
  if (loadState === "loading") {
    return (
      <AppShell>
        <div className="p-16 text-center space-y-3 font-mono text-xs text-ink-muted">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Memuat jobsheet yang dipublikasikan...</p>
        </div>
      </AppShell>
    );
  }

  if (loadState === "not_found") {
    return (
      <AppShell>
        <div className="max-w-md mx-auto p-8 text-center space-y-4">
          <h2 className="text-lg font-bold text-ink">Publikasi Tidak Ditemukan</h2>
          <p className="text-xs text-ink-secondary">
            Link ini tidak mengarah ke publikasi yang valid. Pastikan URL yang diberikan sudah benar.
          </p>
        </div>
      </AppShell>
    );
  }

  if (loadState === "revoked") {
    return (
      <AppShell>
        <div className="max-w-md mx-auto p-8 text-center space-y-4">
          <ShieldAlert className="h-8 w-8 text-amber mx-auto" />
          <h2 className="text-lg font-bold text-ink">Akses Dicabut</h2>
          <p className="text-xs text-ink-secondary">
            Pemilik telah mencabut akses ke jobsheet ini. Hubungi guru Anda untuk informasi lebih lanjut.
          </p>
        </div>
      </AppShell>
    );
  }

  if (loadState === "forbidden") {
    return (
      <AppShell>
        <div className="max-w-md mx-auto p-8 text-center space-y-4">
          <h2 className="text-lg font-bold text-ink">Akses Ditolak</h2>
          <p className="text-xs text-ink-secondary">
            Token akses tidak valid. Pastikan Anda menggunakan link yang diberikan oleh guru.
          </p>
        </div>
      </AppShell>
    );
  }

  if (loadState === "error" || !doc) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto p-8 text-center space-y-4">
          <AlertTriangle className="h-8 w-8 text-danger mx-auto" />
          <h2 className="text-lg font-bold text-ink">Terjadi Kesalahan</h2>
          <p className="text-xs text-ink-secondary">
            Gagal memuat jobsheet. Periksa koneksi internet Anda dan coba lagi.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.reload()}
            className="cursor-pointer"
          >
            Muat Ulang
          </Button>
        </div>
      </AppShell>
    );
  }

  // ── Render Published Jobsheet ──
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <Badge variant="default" size="sm">
              Jobsheet Terpublikasi
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {doc.settings?.allowStudentViewSwitch !== false && (
              <div className="flex items-center p-1 rounded-md bg-muted border border-line shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("guided")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    viewMode === "guided"
                      ? "bg-surface text-ink shadow-2xs font-semibold"
                      : "text-ink-secondary hover:text-ink"
                  }`}
                >
                  <ListOrdered className="h-3.5 w-3.5" strokeWidth={2} />
                  <span>Guided View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("document")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    viewMode === "document"
                      ? "bg-surface text-ink shadow-2xs font-semibold"
                      : "text-ink-secondary hover:text-ink"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" strokeWidth={2} />
                  <span>Document View</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleResetProgress}
              title="Reset seluruh progres praktikum"
              className="p-1.5 rounded text-ink-muted hover:text-danger hover:bg-danger/10 border border-line transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Document Header */}
        <div className="rounded-lg border border-line bg-surface p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-line/60">
            <div className="flex items-center gap-2 font-mono text-xs text-ink-muted">
              <span className="font-semibold text-primary px-1.5 py-0.5 rounded bg-sage/30">
                {doc.code || "LEMBAR KERJA PRAKTIKUM"}
              </span>
              <span>•</span>
              <span>{doc.targetAudience || "Siswa SMK / Praktikan"}</span>
            </div>
            <Badge variant="default" size="sm">
              {doc.category || "Umum"}
            </Badge>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">{doc.title}</h1>
            {doc.description && (
              <p className="text-xs sm:text-sm text-ink-secondary mt-1.5 leading-relaxed">{doc.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-line/60 text-xs font-mono text-ink-muted">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>{doc.estimatedDurationMinutes || 60} Menit</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span className="truncate">{doc.author?.name || "Guru Pengampu"}</span>
            </div>
            <div className="flex items-center gap-2">
              <ListOrdered className="h-3.5 w-3.5 text-primary" />
              <span>{totalSteps} Langkah Kerja</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckSquare className="h-3.5 w-3.5 text-primary" />
              <span>{completedChecklistCount}/{totalChecklistCount} Verifikasi Selesai</span>
            </div>
          </div>
        </div>

        {/* Guided View */}
        {viewMode === "guided" ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-primary flex items-center gap-1.5">
                  <Flag className="h-3.5 w-3.5" />
                  LANGKAH KERJA {currentStepIndex + 1} DARI {totalSteps}
                </span>
                <span className="text-ink-muted">{progressPercent}% Pengerjaan</span>
              </div>
              <div className="h-2 w-full rounded-full bg-line overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                {allSteps.map((s, idx) => {
                  const isCurrent = idx === currentStepIndex;
                  const isDone = completedStepIds.has(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleGoToStep(idx)}
                      className={`px-2.5 py-1 rounded text-xs font-mono whitespace-nowrap transition-colors cursor-pointer border ${
                        isCurrent
                          ? "bg-primary text-primary-fg border-primary font-bold shadow-2xs"
                          : isDone
                          ? "bg-sage/40 text-primary border-primary/30"
                          : "bg-surface text-ink-muted border-line hover:border-line-strong hover:text-ink"
                      }`}
                    >
                      {idx + 1}. {s.title.slice(0, 20)}{s.title.length > 20 ? "..." : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeStep && (
              <Card className="border-line-strong shadow-xs">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="pb-4 border-b border-line">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs uppercase tracking-wider text-primary font-bold px-2 py-0.5 rounded bg-sage/30">
                        Langkah {activeStep.stepNumber}
                      </span>
                      {activeStep.estimatedMinutes && (
                        <span className="font-mono text-xs text-ink-muted flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activeStep.estimatedMinutes} menit
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-ink mt-2">{activeStep.title}</h2>
                    {activeStep.description && (
                      <p className="text-xs sm:text-sm text-ink-secondary mt-1.5 leading-relaxed">
                        {activeStep.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    {(activeStep.blocks || []).map((block) => (
                      <PublishedContentBlock
                        key={block.id}
                        block={block}
                        publicationId={publicationId}
                        shareToken={shareToken}
                        checkedItemIds={checkedItemIds}
                        onToggleCheck={toggleCheck}
                      />
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6 border-t border-line">
                    <Button
                      variant="secondary"
                      size="lg"
                      disabled={currentStepIndex === 0}
                      onClick={() => handleGoToStep(currentStepIndex - 1)}
                      className="cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1.5" />
                      <span>Langkah Sebelumnya</span>
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleMarkStepComplete}
                        className={`cursor-pointer ${
                          completedStepIds.has(activeStep.id)
                            ? "bg-sage/40 text-primary border-primary font-semibold"
                            : ""
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1.5 text-primary" />
                        <span>
                          {completedStepIds.has(activeStep.id)
                            ? "Langkah Selesai ✓"
                            : "Tandai Langkah Selesai"}
                        </span>
                      </Button>
                      <Button
                        variant="primary"
                        size="lg"
                        disabled={currentStepIndex === totalSteps - 1}
                        onClick={() => handleGoToStep(currentStepIndex + 1)}
                        className="cursor-pointer"
                      >
                        <span>Selanjutnya</span>
                        <ArrowRight className="h-4 w-4 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Document View */
          <div className="space-y-6">
            <Card className="border-line shadow-xs">
              <CardContent className="p-6 sm:p-10 space-y-10">
                <section className="space-y-2 pb-6 border-b border-line">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary font-bold">
                    <Target className="h-4 w-4" />
                    <span>I. Tujuan Praktikum & Ruang Lingkup</span>
                  </div>
                  <p className="text-sm text-ink leading-relaxed">
                    {doc.description || "Praktikan diharapkan mampu mengikuti seluruh prosedur kerja teknis secara mandiri."}
                  </p>
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {doc.tags.map((t) => (
                        <span key={t} className="font-mono text-[11px] px-2 py-0.5 rounded bg-muted text-ink-muted">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </section>

                <section className="space-y-8">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary font-bold">
                    <Wrench className="h-4 w-4" />
                    <span>II. Prosedur dan Langkah Kerja Praktik</span>
                  </div>

                  {(doc.sections || []).map((section, sIdx) => (
                    <div key={section.id} className="rounded-lg border border-line/80 bg-surface/50 p-5 sm:p-6 space-y-6">
                      <div className="border-b border-line pb-3">
                        <span className="font-mono text-xs uppercase text-primary font-bold">Bagian {sIdx + 1}</span>
                        <h2 className="text-lg sm:text-xl font-bold text-ink mt-0.5">{section.title}</h2>
                        {section.description && (
                          <p className="text-xs text-ink-secondary mt-1">{section.description}</p>
                        )}
                      </div>
                      <div className="space-y-6">
                        {(section.steps || []).map((step) => (
                          <div key={step.id} className="space-y-3 pb-6 border-b border-line/50 last:border-0 last:pb-0">
                            <div className="flex items-start gap-3">
                              <span className="h-6 w-6 rounded-full bg-primary text-primary-fg font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                                {step.stepNumber}
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <h3 className="text-base font-semibold text-ink">{step.title}</h3>
                                  {step.estimatedMinutes && (
                                    <span className="font-mono text-[11px] text-ink-muted">~{step.estimatedMinutes} mnt</span>
                                  )}
                                </div>
                                {step.description && (
                                  <p className="text-xs text-ink-secondary mt-0.5">{step.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="pl-9 space-y-3">
                              {(step.blocks || []).map((block) => (
                                <PublishedContentBlock
                                  key={block.id}
                                  block={block}
                                  publicationId={publicationId}
                                  shareToken={shareToken}
                                  checkedItemIds={checkedItemIds}
                                  onToggleCheck={toggleCheck}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>

                <section className="pt-6 border-t border-line space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>III. Evaluasi & Catatan Hasil Pengamatan</span>
                  </div>
                  <div className="rounded-md border border-dashed border-line p-4 bg-muted/20 text-xs text-ink-secondary space-y-2">
                    <p>Pastikan seluruh tahapan verifikasi telah ditandai sebelum menyerahkan hasil pengujian.</p>
                    <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted pt-2 border-t border-line/60">
                      <span>Status Verifikasi: {completedChecklistCount} dari {totalChecklistCount} tercapai</span>
                      <span>Langkah Selesai: {completedStepIds.size} dari {totalSteps}</span>
                    </div>
                  </div>
                </section>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

/**
 * Content block renderer for published view — uses PublishedImageRenderer for images.
 */
function PublishedContentBlock({
  block,
  publicationId,
  shareToken,
  checkedItemIds,
  onToggleCheck,
}: {
  block: ContentBlock;
  publicationId: string;
  shareToken: string;
  checkedItemIds: Set<string>;
  onToggleCheck: (id: string) => void;
}) {
  switch (block.type) {
    case "paragraph":
      return <p className="text-sm sm:text-base text-ink leading-relaxed whitespace-pre-wrap">{block.content}</p>;

    case "heading":
      if (block.level === 1) return <h3 className="text-lg font-bold text-ink">{block.text}</h3>;
      if (block.level === 2) return <h4 className="text-base font-semibold text-ink">{block.text}</h4>;
      return <h5 className="text-sm font-semibold text-ink">{block.text}</h5>;

    case "callout": {
      const isDanger = block.variant === "danger";
      const isWarning = block.variant === "warning";
      const isInfo = block.variant === "info";
      return (
        <div
          className={`rounded-md border-l-4 p-4 text-xs space-y-1 ${
            isDanger
              ? "border-l-danger bg-danger/5 border-line"
              : isWarning
              ? "border-l-amber bg-amber/5 border-line"
              : isInfo
              ? "border-l-info bg-info/5 border-line"
              : "border-l-primary bg-sage/20 border-line"
          }`}
        >
          <div className="flex items-center gap-1.5 font-semibold font-mono text-[11px] uppercase">
            {isDanger && <ShieldAlert className="h-3.5 w-3.5" />}
            {isWarning && <AlertTriangle className="h-3.5 w-3.5" />}
            {isInfo && <Info className="h-3.5 w-3.5" />}
            {block.variant === "tip" && <Lightbulb className="h-3.5 w-3.5" />}
            <span>{block.title || block.variant?.toUpperCase()}</span>
          </div>
          <p className="leading-relaxed">{block.content}</p>
        </div>
      );
    }

    case "code":
      return (
        <div className="rounded-md bg-ink text-canvas p-4 text-xs font-mono overflow-x-auto">
          <div className="flex items-center gap-1.5 text-[10px] text-canvas/50 uppercase mb-2">
            <Code2 className="h-3 w-3" />
            <span>{block.language || "code"}</span>
          </div>
          <pre className="whitespace-pre-wrap">{block.code}</pre>
          {block.caption && <p className="text-canvas/40 mt-2 text-[11px]">{block.caption}</p>}
        </div>
      );

    case "image":
      return (
        <PublishedImageRenderer
          publicationId={publicationId}
          mediaId={block.mediaId || ""}
          shareToken={shareToken}
          altText={block.altText}
          caption={block.caption}
          fallbackUrl={block.url}
        />
      );

    case "checklist":
      return (
        <div className="space-y-2 rounded-md border border-line p-3 bg-muted/20">
          {block.title && (
            <span className="text-xs font-mono font-semibold text-primary uppercase">{block.title}</span>
          )}
          {(block.items || []).map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-2.5 text-xs cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={checkedItemIds.has(item.id)}
                onChange={() => onToggleCheck(item.id)}
                className="mt-0.5 h-4 w-4 rounded border-line text-primary focus:ring-primary/30 cursor-pointer"
              />
              <span className={`leading-relaxed ${checkedItemIds.has(item.id) ? "line-through text-ink-muted" : "text-ink"}`}>
                {item.text}
                {item.required && <span className="text-danger ml-1">*</span>}
              </span>
            </label>
          ))}
        </div>
      );

    case "table":
      return (
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full text-xs">
            {block.headers && block.headers.length > 0 && (
              <thead className="bg-muted/40">
                <tr>
                  {block.headers.map((h, i) => (
                    <th key={i} className="text-left px-3 py-2 font-mono font-semibold text-ink border-b border-line">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {(block.rows || []).map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-line/50 last:border-0">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 text-ink-secondary">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {block.caption && (
            <p className="text-[11px] text-ink-muted font-mono text-center py-1 border-t border-line/50">
              {block.caption}
            </p>
          )}
        </div>
      );

    case "video":
      return (
        <div className="space-y-1">
          <p className="text-xs text-ink-muted font-mono">[Video: {block.title || block.url}]</p>
        </div>
      );

    default:
      return null;
  }
}
