"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  Info,
  Lightbulb,
  ListOrdered,
  FileText,
  Code2,
  CheckCircle2,
  User,
  RotateCcw,
  Flag,
  Target,
  Wrench,
  CheckSquare,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  OpenJobsheetDocument,
  PracticalStep,
  ContentBlock,
} from "@/lib/schema/document";
import {
  getJobsheetById,
  getStudentProgress,
  saveStudentProgress,
} from "@/lib/storage/jobsheet-repository";
import { LocalImageRenderer } from "@/components/shared/local-image-renderer";
import { PREVIEW_FIXTURES } from "@/components/workspace/preview-fixtures";

interface ClientViewProps {
  jobsheetId: string;
}

export default function StudentJobsheetClientView({ jobsheetId }: ClientViewProps) {
  const [doc, setDoc] = React.useState<OpenJobsheetDocument | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<"guided" | "document">("guided");
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [checkedItemIds, setCheckedItemIds] = React.useState<Set<string>>(
    new Set()
  );
  const [completedStepIds, setCompletedStepIds] = React.useState<Set<string>>(
    new Set()
  );
  const [contextId, setContextId] = React.useState<string>("default");

  // Load document and persisted student progress from IndexedDB
  React.useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      try {
        const record = await getJobsheetById(jobsheetId);
        if (record && active) {
          setDoc(record.data);

          // Honor document defaultViewMode if configured
          if (record.data.settings?.defaultViewMode) {
            setViewMode(record.data.settings.defaultViewMode);
          }

          // Load student progress for this document
          const progress = await getStudentProgress(jobsheetId, contextId);
          if (progress && active) {
            // Collect all valid checklist item IDs from document
            const validItemIds = new Set<string>();
            const allDocumentSteps = (record.data.sections || []).flatMap(
              (s) => s.steps || []
            );
            for (const step of allDocumentSteps) {
              for (const blk of step.blocks || []) {
                if (blk.type === "checklist" && Array.isArray(blk.items)) {
                  for (const itm of blk.items) validItemIds.add(itm.id);
                }
              }
            }

            // Prune invalid or deleted items
            const filteredChecked = (progress.checkedItemIds || []).filter((id) =>
              validItemIds.has(id)
            );
            setCheckedItemIds(new Set(filteredChecked));

            // Completed steps
            setCompletedStepIds(new Set(progress.completedStepIds || []));

            // Resume active step
            if (progress.currentStepId) {
              const idx = allDocumentSteps.findIndex(
                (s) => s.id === progress.currentStepId
              );
              if (idx !== -1) setCurrentStepIndex(idx);
            }
          }
          setLoading(false);
          return;
        }

        // Fallback to preview fixtures if not in IndexedDB
        const fixture = PREVIEW_FIXTURES.find((f) => f.id === jobsheetId);
        if (fixture && active) {
          const mockDoc: OpenJobsheetDocument = {
            id: fixture.id,
            schemaVersion: "1.0.0",
            code: fixture.code,
            category: fixture.category,
            title: fixture.title,
            description: fixture.description,
            targetAudience: fixture.targetAudience,
            estimatedDurationMinutes: fixture.estimatedDurationMinutes,
            author: { name: fixture.author, institution: "SMK Negeri Rekayasa" },
            tags: ["Praktikum", fixture.category],
            settings: {
              allowStudentViewSwitch: true,
              defaultViewMode: "guided",
              showEstimatedDuration: true,
              strictStepProgression: false,
            },
            sections: [
              {
                id: "sec-fixtures-1",
                title: "Bagian Utama: Prosedur Praktikum",
                description: "Ikuti seluruh instruksi kerja sesuai standar K3 bengkel/lab.",
                steps: Array.from({ length: fixture.stepCount }).map((_, i) => ({
                  id: `step-${i + 1}`,
                  stepNumber: i + 1,
                  title: `Langkah Kerja ${i + 1}: Pelaksanaan Tugas`,
                  description: "Verifikasi alat dan catat setiap hasil pengamatan.",
                  estimatedMinutes: Math.round(
                    fixture.estimatedDurationMinutes / fixture.stepCount
                  ),
                  blocks: [
                    {
                      id: `blk-${i + 1}-1`,
                      type: "callout",
                      variant: i === 0 ? "warning" : "info",
                      title: i === 0 ? "Keselamatan Kerja (K3)" : "Petunjuk Teknis",
                      content:
                        i === 0
                          ? "Gunakan alat pelindung diri (APD) dan pastikan daya listrik mati sebelum instalasi."
                          : "Pastikan konektor dan konfigurasi telah terpasang dengan kuat sesuai diagram.",
                    },
                    {
                      id: `blk-${i + 1}-2`,
                      type: "paragraph",
                      content:
                        "Lakukan pemeriksaan bertahap menggunakan alat ukur atau perintah terminal yang relevan.",
                    },
                    {
                      id: `blk-${i + 1}-3`,
                      type: "checklist",
                      title: "Verifikasi Capaian",
                      items: [
                        {
                          id: `chk-${i + 1}-1`,
                          text: `Tahap kerja ${i + 1} telah diverifikasi dan berfungsi optimal`,
                          required: true,
                        },
                      ],
                    },
                  ],
                })),
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          setDoc(mockDoc);
        }
      } catch (err) {
        console.error("Gagal memuat dokumen siswa:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [jobsheetId, contextId]);

  // Flattened steps across all sections
  const allSteps: PracticalStep[] = React.useMemo(() => {
    if (!doc || !Array.isArray(doc.sections)) return [];
    return doc.sections.flatMap((s) => s.steps || []);
  }, [doc]);

  // All checklist items across entire document
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
  const progressPercent = totalSteps
    ? Math.round(((currentStepIndex + 1) / totalSteps) * 100)
    : 0;

  // Checklist completion calculation
  const totalChecklistCount = allChecklistItems.length;
  const completedChecklistCount = allChecklistItems.filter((i) =>
    checkedItemIds.has(i.id)
  ).length;

  // Persist student progress update
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
          documentId: doc.id,
          contextId,
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
    [doc, allSteps, activeStep, totalSteps, allChecklistItems, contextId]
  );

  // Toggle checklist item
  const toggleCheck = async (itemId: string) => {
    const next = new Set(checkedItemIds);
    if (next.has(itemId)) {
      next.delete(itemId);
    } else {
      next.add(itemId);
    }
    setCheckedItemIds(next);
    await persistProgress(next, completedStepIds, currentStepIndex);
  };

  // Navigate steps in Guided View
  const handleGoToStep = async (newIdx: number) => {
    const bounded = Math.max(0, Math.min(totalSteps - 1, newIdx));
    setCurrentStepIndex(bounded);
    await persistProgress(checkedItemIds, completedStepIds, bounded);
  };

  // Mark step complete and advance
  const handleMarkStepComplete = async () => {
    if (!activeStep) return;
    const nextCompleted = new Set(completedStepIds);
    nextCompleted.add(activeStep.id);
    setCompletedStepIds(nextCompleted);

    const nextIdx = Math.min(totalSteps - 1, currentStepIndex + 1);
    setCurrentStepIndex(nextIdx);
    await persistProgress(checkedItemIds, nextCompleted, nextIdx);
  };

  // Reset student progress
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

  if (loading) {
    return (
      <AppShell>
        <div className="p-16 text-center space-y-3 font-mono text-xs text-ink-muted">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Memuat jobsheet dari IndexedDB...</p>
        </div>
      </AppShell>
    );
  }

  if (!doc) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto p-8 text-center space-y-4">
          <h2 className="text-lg font-bold text-ink">Jobsheet Tidak Ditemukan</h2>
          <p className="text-xs text-ink-secondary">
            Dokumen dengan ID tersebut tidak ditemukan di database IndexedDB Anda.
          </p>
          <Link href="/">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              <span>Kembali ke Workspace</span>
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Control Bar: Workspace link, Learner Context & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-secondary hover:text-ink transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Workspace</span>
            </Link>

            <span className="text-line-strong">•</span>

            {/* Local Learner Context Selector */}
            <div className="flex items-center gap-1.5 text-xs font-mono text-ink-muted">
              <User className="h-3.5 w-3.5" />
              <label htmlFor="context-select" className="sr-only">
                Sesi Praktikan:
              </label>
              <select
                id="context-select"
                value={contextId}
                onChange={(e) => setContextId(e.target.value)}
                className="bg-muted/40 border border-line rounded px-1.5 py-0.5 text-[11px] font-mono text-ink focus:outline-none focus:border-primary cursor-pointer"
                title="Pilih profil praktikan lokal pada perangkat ini"
              >
                <option value="default">Praktikan Default</option>
                <option value="siswa-1">Siswa A / Meja 1</option>
                <option value="siswa-2">Siswa B / Meja 2</option>
                <option value="siswa-3">Siswa C / Meja 3</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Pill */}
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
                  title="Tampilan interaktif langkah demi langkah"
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
                  title="Tampilan lembar kerja praktikum lengkap terstruktur"
                >
                  <FileText className="h-3.5 w-3.5" strokeWidth={2} />
                  <span>Document View</span>
                </button>
              </div>
            )}

            {/* Reset Progress Button */}
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

        {/* ------------------------------------------------------------------ */}
        {/* VOCATIONAL WORKSHEET HEADER BANNER                                 */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-lg border border-line bg-surface p-5 sm:p-6 space-y-4 shadow-2xs">
          {/* Institutional Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-line/60">
            <div className="flex items-center gap-2 font-mono text-xs text-ink-muted">
              <span className="font-semibold text-primary px-1.5 py-0.5 rounded bg-sage/30">
                {doc.code || "LEMBAR KERJA PRAKTIKUM"}
              </span>
              <span>•</span>
              <span>{doc.targetAudience || "Siswa SMK / Praktikan"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" size="sm">
                {doc.category || "Umum"}
              </Badge>
              <Link href={`/creator?id=${doc.id}`}>
                <Button variant="outline" size="sm" className="text-xs h-7">
                  <span>Buka di Creator</span>
                </Button>
              </Link>
            </div>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
              {doc.title}
            </h1>
            {doc.description && (
              <p className="text-xs sm:text-sm text-ink-secondary mt-1.5 leading-relaxed">
                {doc.description}
              </p>
            )}
          </div>

          {/* Practical Specifications Row */}
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
              <span>
                {completedChecklistCount}/{totalChecklistCount} Verifikasi Selesai
              </span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* HYBRID VIEW SWITCH: GUIDED VIEW vs DOCUMENT VIEW                   */}
        {/* ------------------------------------------------------------------ */}
        {viewMode === "guided" ? (
          /* ================================================================ */
          /* VIEW 1: GUIDED VIEW (FOCUSED STEP-BY-STEP WORKFLOW)              */
          /* ================================================================ */
          <div className="space-y-5">
            {/* Step Navigation Pill Indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-primary flex items-center gap-1.5">
                  <Flag className="h-3.5 w-3.5" />
                  LANGKAH KERJA {currentStepIndex + 1} DARI {totalSteps}
                </span>
                <span className="text-ink-muted">
                  {progressPercent}% Pengerjaan
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-line overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Step Quick Jump Tabs (horizontal scrollable on mobile) */}
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
                      {idx + 1}. {s.title.slice(0, 20)}
                      {s.title.length > 20 ? "..." : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Step Practical Card */}
            {activeStep ? (
              <Card className="border-line-strong shadow-xs">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  {/* Step Header */}
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
                    <h2 className="text-xl sm:text-2xl font-bold text-ink mt-2">
                      {activeStep.title}
                    </h2>
                    {activeStep.description && (
                      <p className="text-xs sm:text-sm text-ink-secondary mt-1.5 leading-relaxed">
                        {activeStep.description}
                      </p>
                    )}
                  </div>

                  {/* Render All Blocks In Active Step */}
                  <div className="space-y-4">
                    {(activeStep.blocks || []).map((block) => (
                      <RenderContentBlock
                        key={block.id}
                        block={block}
                        checkedItemIds={checkedItemIds}
                        onToggleCheck={toggleCheck}
                      />
                    ))}
                  </div>

                  {/* Step Action & Direction Buttons */}
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
            ) : null}
          </div>
        ) : (
          /* ================================================================ */
          /* VIEW 2: DOCUMENT VIEW (VOCATIONAL TECHNICAL WORKSHEET LAYOUT)     */
          /* ================================================================ */
          <div className="space-y-6">
            <Card className="border-line shadow-xs">
              <CardContent className="p-6 sm:p-10 space-y-10">
                {/* 1. Practical Objectives & Overview */}
                <section className="space-y-2 pb-6 border-b border-line">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary font-bold">
                    <Target className="h-4 w-4" />
                    <span>I. Tujuan Praktikum & Ruang Lingkup</span>
                  </div>
                  <p className="text-sm text-ink leading-relaxed">
                    {doc.description ||
                      "Praktikan diharapkan mampu mengikuti seluruh prosedur kerja teknis secara mandiri, mengutamakan keselamatan kerja, serta memverifikasi hasil praktikum dengan akurat."}
                  </p>
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {doc.tags.map((t) => (
                        <span
                          key={t}
                          className="font-mono text-[11px] px-2 py-0.5 rounded bg-muted text-ink-muted"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </section>

                {/* 2. Structured Sections & Practical Steps */}
                <section className="space-y-8">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary font-bold">
                    <Wrench className="h-4 w-4" />
                    <span>II. Prosedur dan Langkah Kerja Praktik</span>
                  </div>

                  {(doc.sections || []).map((section, sIdx) => (
                    <div
                      key={section.id}
                      className="rounded-lg border border-line/80 bg-surface/50 p-5 sm:p-6 space-y-6"
                    >
                      {/* Section Header */}
                      <div className="border-b border-line pb-3">
                        <span className="font-mono text-xs uppercase text-primary font-bold">
                          Bagian {sIdx + 1}
                        </span>
                        <h2 className="text-lg sm:text-xl font-bold text-ink mt-0.5">
                          {section.title}
                        </h2>
                        {section.description && (
                          <p className="text-xs text-ink-secondary mt-1">
                            {section.description}
                          </p>
                        )}
                        {section.safetyOverview && (
                          <div className="mt-2 text-xs bg-amber/10 border-l-2 border-amber p-2 text-ink rounded-r">
                            <span className="font-semibold text-amber font-mono">
                              K3 Bagian:
                            </span>{" "}
                            {section.safetyOverview}
                          </div>
                        )}
                      </div>

                      {/* Numbered Steps inside Section */}
                      <div className="space-y-6">
                        {(section.steps || []).map((step) => (
                          <div
                            key={step.id}
                            className="space-y-3 pb-6 border-b border-line/50 last:border-0 last:pb-0"
                          >
                            <div className="flex items-start gap-3">
                              <span className="h-6 w-6 rounded-full bg-primary text-primary-fg font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                                {step.stepNumber}
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <h3 className="text-base font-semibold text-ink">
                                    {step.title}
                                  </h3>
                                  {step.estimatedMinutes && (
                                    <span className="font-mono text-[11px] text-ink-muted">
                                      ~{step.estimatedMinutes} mnt
                                    </span>
                                  )}
                                </div>
                                {step.description && (
                                  <p className="text-xs text-ink-secondary mt-0.5">
                                    {step.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Blocks in Step */}
                            <div className="pl-9 space-y-3">
                              {(step.blocks || []).map((block) => (
                                <RenderContentBlock
                                  key={block.id}
                                  block={block}
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

                {/* 3. Evaluation and Sign-Off Section */}
                <section className="pt-6 border-t border-line space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>III. Evaluasi & Catatan Hasil Pengamatan</span>
                  </div>
                  <div className="rounded-md border border-dashed border-line p-4 bg-muted/20 text-xs text-ink-secondary space-y-2">
                    <p>
                      Pastikan seluruh tahapan verifikasi di atas telah ditandai
                      sebelum menyerahkan hasil pengujian kepada instruktur pembimbing.
                    </p>
                    <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted pt-2 border-t border-line/60">
                      <span>
                        Status Verifikasi: {completedChecklistCount} dari{" "}
                        {totalChecklistCount} tercapai
                      </span>
                      <span>
                        Langkah Selesai: {completedStepIds.size} dari {totalSteps}
                      </span>
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
 * Functional Renderer for AST Blocks in Student Mode
 */
function RenderContentBlock({
  block,
  checkedItemIds,
  onToggleCheck,
}: {
  block: ContentBlock;
  checkedItemIds: Set<string>;
  onToggleCheck: (id: string) => void;
}) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="text-sm sm:text-base text-ink leading-relaxed whitespace-pre-wrap">
          {block.content}
        </p>
      );

    case "heading":
      if (block.level === 1) {
        return <h3 className="text-lg font-bold text-ink">{block.text}</h3>;
      }
      if (block.level === 2) {
        return <h4 className="text-base font-semibold text-ink">{block.text}</h4>;
      }
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
          <div
            className={`flex items-center gap-2 font-semibold ${
              isDanger
                ? "text-danger"
                : isWarning
                ? "text-amber"
                : isInfo
                ? "text-info"
                : "text-primary"
            }`}
          >
            {isDanger && <ShieldAlert className="h-4 w-4" strokeWidth={2} />}
            {isWarning && <AlertTriangle className="h-4 w-4" strokeWidth={2} />}
            {isInfo && <Info className="h-4 w-4" strokeWidth={2} />}
            {!isDanger && !isWarning && !isInfo && (
              <Lightbulb className="h-4 w-4" strokeWidth={2} />
            )}
            <span>{block.title || "Catatan & Peringatan"}</span>
          </div>
          <p className="text-ink-secondary leading-relaxed pl-6">
            {block.content}
          </p>
        </div>
      );
    }

    case "code":
      return (
        <div className="rounded-md border border-line bg-muted/60 overflow-hidden text-xs">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-line bg-muted text-ink-muted font-mono text-[11px]">
            <div className="flex items-center gap-1.5">
              <Code2 className="h-3 w-3" />
              <span className="uppercase">{block.language || "code"}</span>
            </div>
            {block.caption && <span>{block.caption}</span>}
          </div>
          <pre className="p-3 font-mono overflow-x-auto text-ink leading-relaxed">
            <code>{block.code}</code>
          </pre>
        </div>
      );

    case "checklist":
      return (
        <div className="space-y-2 pt-1">
          {block.title && (
            <span className="text-xs font-mono uppercase tracking-wider text-ink-muted font-semibold block">
              {block.title}
            </span>
          )}
          <div className="space-y-2">
            {(block.items || []).map((item) => {
              const isChecked = checkedItemIds.has(item.id);
              return (
                <label
                  key={item.id}
                  onClick={() => onToggleCheck(item.id)}
                  className={`flex items-start gap-3 p-3 rounded-md border transition-colors cursor-pointer select-none ${
                    isChecked
                      ? "border-success/40 bg-success/5 text-ink"
                      : "border-line bg-surface hover:bg-muted/40 text-ink"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="mt-0.5 h-4 w-4 rounded accent-primary text-primary-fg cursor-pointer"
                  />
                  <div className="flex-1 text-xs sm:text-sm leading-snug">
                    <span className={isChecked ? "line-through text-ink-muted" : ""}>
                      {item.text}
                    </span>
                    {item.required && !isChecked && (
                      <span className="ml-2 font-mono text-[10px] uppercase px-1.5 py-0.2 rounded bg-amber/10 text-amber font-semibold">
                        Wajib
                      </span>
                    )}
                    {isChecked && (
                      <span className="ml-2 font-mono text-[10px] uppercase px-1.5 py-0.2 rounded bg-success/10 text-success font-semibold inline-flex items-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Selesai
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      );

    case "image":
      return (
        <LocalImageRenderer
          mediaId={block.mediaId}
          url={block.url}
          altText={block.altText}
          caption={block.caption}
        />
      );

    case "table":
      return (
        <div className="space-y-1.5 overflow-x-auto pt-1">
          <table className="w-full text-xs text-left border-collapse border border-line">
            {block.headers && block.headers.length > 0 && (
              <thead className="bg-muted text-ink font-semibold">
                <tr>
                  {block.headers.map((h, i) => (
                    <th key={i} className="p-2 border border-line">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {(block.rows || []).map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-muted/30">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2 border border-line text-ink-secondary">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {block.caption && (
            <p className="text-center text-[11px] font-mono text-ink-muted italic">
              {block.caption}
            </p>
          )}
        </div>
      );

    default:
      return null;
  }
}
