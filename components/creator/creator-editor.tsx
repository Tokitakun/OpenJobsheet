"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  AlertCircle,
  Copy,
  Globe,
  PanelLeft,
  SlidersHorizontal,
  AlignLeft,
  Heading2,
  AlertTriangle,
  CheckSquare,
  Code2,
  Image as ImageIcon,
  X,
  FileDown,
} from "lucide-react";
import {
  OpenJobsheetDocument,
  Section,
  PracticalStep,
  ContentBlock,
  createBlankJobsheet,
  generateId,
} from "@/lib/schema/document";
import {
  getJobsheetById,
  saveJobsheet,
  duplicateJobsheet,
  deleteJobsheet,
} from "@/lib/storage/jobsheet-repository";
import { Button } from "@/components/ui/button";
import { BlockEditor } from "@/components/creator/block-editor";
import { PublishPanel } from "@/components/creator/publish-panel";
import { Footer } from "@/components/layout/footer";

type SaveStatus = "saved" | "saving" | "unsaved" | "error";

interface CreatorEditorProps {
  initialId?: string | null;
}

export function CreatorEditor({ initialId }: CreatorEditorProps) {
  const router = useRouter();

  // Document State
  const [doc, setDoc] = React.useState<OpenJobsheetDocument>(() =>
    createBlankJobsheet()
  );
  const [loading, setLoading] = React.useState(true);
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("saved");
  const [saveErrorMessage, setSaveErrorMessage] = React.useState<string | null>(
    null
  );

  // Panels State
  const [showOutline, setShowOutline] = React.useState(true);
  const [showInspector, setShowInspector] = React.useState(true);
  const [showPublishPanel, setShowPublishPanel] = React.useState(false);
  const [activeSectionId, setActiveSectionId] = React.useState<string | null>(null);

  // Collapse side panels automatically on smaller screens so canvas remains unobstructed
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      Promise.resolve().then(() => {
        setShowOutline(false);
        setShowInspector(false);
      });
    }
  }, []);

  // Active document ID ref to prevent cross-document autosave race conditions
  const activeDocIdRef = React.useRef<string>(doc.id);
  const isDirtyRef = React.useRef<boolean>(false);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  // Guard against React Strict Mode double-creation when opening /creator without ?id=
  const creationPromiseRef = React.useRef<Promise<OpenJobsheetDocument> | null>(null);

  // Load existing document if initialId provided, or initialize new once
  React.useEffect(() => {
    let isCancelled = false;

    async function loadDocument() {
      setLoading(true);
      if (initialId) {
        try {
          const existing = await getJobsheetById(initialId);
          if (existing && !isCancelled) {
            setDoc(existing.data);
            activeDocIdRef.current = existing.data.id;
            isDirtyRef.current = false;
            setActiveSectionId(existing.data.sections?.[0]?.id || null);
            setSaveStatus("saved");
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Error loading document:", err);
        }
      }

      // Guard: reuse in-flight or already-created blank document across Strict Mode remounts
      if (!creationPromiseRef.current) {
        const fresh = createBlankJobsheet();
        creationPromiseRef.current = saveJobsheet(fresh).then(() => fresh);
      }

      try {
        const fresh = await creationPromiseRef.current;
        if (!isCancelled) {
          setDoc(fresh);
          activeDocIdRef.current = fresh.id;
          isDirtyRef.current = false;
          setActiveSectionId(fresh.sections?.[0]?.id || null);
          setSaveStatus("saved");
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", `/creator?id=${fresh.id}`);
          }
        }
      } catch (e) {
        console.error("Error auto-creating initial jobsheet:", e);
        creationPromiseRef.current = null;
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadDocument();

    return () => {
      isCancelled = true;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [initialId]);

  // Debounced Autosave Trigger
  const triggerAutoSave = React.useCallback((updatedDoc: OpenJobsheetDocument) => {
    isDirtyRef.current = true;
    setSaveStatus("unsaved");

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (updatedDoc.id !== activeDocIdRef.current) {
        return;
      }

      setSaveStatus("saving");
      try {
        await saveJobsheet(updatedDoc);
        isDirtyRef.current = false;
        setSaveStatus("saved");
        setSaveErrorMessage(null);
      } catch (err: unknown) {
        console.error("Autosave error:", err);
        setSaveStatus("error");
        setSaveErrorMessage(
          err instanceof Error ? err.message : "Gagal menyimpan ke perangkat."
        );
      }
    }, 600);
  }, []);

  // Flush pending autosave immediately before navigating away
  const flushPendingSave = React.useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (isDirtyRef.current && doc.id === activeDocIdRef.current) {
      try {
        await saveJobsheet(doc);
        isDirtyRef.current = false;
        setSaveStatus("saved");
      } catch (err) {
        console.error("Flush save error:", err);
      }
    }
  }, [doc]);

  // Mutator helper
  const updateDocument = React.useCallback(
    (updater: (prev: OpenJobsheetDocument) => OpenJobsheetDocument) => {
      setDoc((prev) => {
        const next = updater(prev);
        triggerAutoSave(next);
        return next;
      });
    },
    [triggerAutoSave]
  );

  // Scroll helper for Document Outline
  const scrollToElement = (elementId: string, sectionId: string) => {
    setActiveSectionId(sectionId);
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Section Handlers
  const handleAddSection = () => {
    const newSectionId = generateId();
    const newSection: Section = {
      id: newSectionId,
      title: `Tahap ${(doc.sections?.length || 0) + 1}: Bagian Baru`,
      description: "Deskripsi singkat mengenai tahap kerja ini.",
      steps: [
        {
          id: generateId(),
          stepNumber: 1,
          title: "Langkah Pertama",
          estimatedMinutes: 10,
          blocks: [
            {
              id: generateId(),
              type: "paragraph",
              content: "Tuliskan instruksi kerja langkah...",
            },
          ],
        },
      ],
    };

    updateDocument((prev) => ({
      ...prev,
      sections: [...(prev.sections || []), newSection],
    }));
    setActiveSectionId(newSectionId);
  };

  const handleDeleteSection = (sectionId: string) => {
    if ((doc.sections || []).length <= 1) {
      alert("Jobsheet minimal harus memiliki satu bagian (section).");
      return;
    }
    if (confirm("Hapus bagian ini beserta seluruh langkah di dalamnya?")) {
      updateDocument((prev) => ({
        ...prev,
        sections: prev.sections.filter((s) => s.id !== sectionId),
      }));
    }
  };

  // Step Handlers
  const handleAddStep = (sectionId: string) => {
    updateDocument((prev) => {
      const sections = prev.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const nextNumber = (sec.steps?.length || 0) + 1;
        const newStep: PracticalStep = {
          id: generateId(),
          stepNumber: nextNumber,
          title: `Langkah Kerja ${nextNumber}`,
          estimatedMinutes: 15,
          blocks: [
            {
              id: generateId(),
              type: "paragraph",
              content: "Tuliskan instruksi langkah di sini...",
            },
          ],
        };
        return {
          ...sec,
          steps: [...(sec.steps || []), newStep],
        };
      });
      return { ...prev, sections };
    });
  };

  const handleDeleteStep = (sectionId: string, stepId: string) => {
    updateDocument((prev) => {
      const sections = prev.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const filteredSteps = sec.steps.filter((s) => s.id !== stepId);
        const renumbered = filteredSteps.map((s, idx) => ({
          ...s,
          stepNumber: idx + 1,
        }));
        return { ...sec, steps: renumbered };
      });
      return { ...prev, sections };
    });
  };

  // Block Handlers
  const handleAddBlock = (
    sectionId: string,
    stepId: string,
    blockType: ContentBlock["type"]
  ) => {
    const newBlockId = generateId();
    let newBlock: ContentBlock;

    switch (blockType) {
      case "heading":
        newBlock = { id: newBlockId, type: "heading", level: 2, text: "Sub Judul Bagian" };
        break;
      case "callout":
        newBlock = {
          id: newBlockId,
          type: "callout",
          variant: "warning",
          title: "Catatan Keselamatan",
          content: "Pastikan mematuhi SOP bengkel sebelum melanjutkan.",
        };
        break;
      case "code":
        newBlock = {
          id: newBlockId,
          type: "code",
          language: "bash",
          code: "# Masukkan perintah di sini",
          showLineNumbers: true,
        };
        break;
      case "checklist":
        newBlock = {
          id: newBlockId,
          type: "checklist",
          title: "Checklist Verifikasi",
          items: [
            { id: generateId(), text: "Peralatan terverifikasi lengkap", required: true },
          ],
        };
        break;
      case "image":
        newBlock = {
          id: newBlockId,
          type: "image",
          url: "",
          altText: "Ilustrasi praktikum",
          caption: "Keterangan gambar",
        };
        break;
      case "paragraph":
      default:
        newBlock = {
          id: newBlockId,
          type: "paragraph",
          content: "Tuliskan instruksi langkah di sini...",
        };
        break;
    }

    updateDocument((prev) => {
      const sections = prev.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const steps = sec.steps.map((st) => {
          if (st.id !== stepId) return st;
          return {
            ...st,
            blocks: [...(st.blocks || []), newBlock],
          };
        });
        return { ...sec, steps };
      });
      return { ...prev, sections };
    });
  };

  const handleUpdateBlock = (
    sectionId: string,
    stepId: string,
    blockId: string,
    updatedBlock: ContentBlock
  ) => {
    updateDocument((prev) => {
      const sections = prev.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const steps = sec.steps.map((st) => {
          if (st.id !== stepId) return st;
          const blocks = st.blocks.map((b) => (b.id === blockId ? updatedBlock : b));
          return { ...st, blocks };
        });
        return { ...sec, steps };
      });
      return { ...prev, sections };
    });
  };

  const handleDeleteBlock = (
    sectionId: string,
    stepId: string,
    blockId: string
  ) => {
    updateDocument((prev) => {
      const sections = prev.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const steps = sec.steps.map((st) => {
          if (st.id !== stepId) return st;
          return {
            ...st,
            blocks: st.blocks.filter((b) => b.id !== blockId),
          };
        });
        return { ...sec, steps };
      });
      return { ...prev, sections };
    });
  };

  const handleMoveBlock = (
    sectionId: string,
    stepId: string,
    blockIndex: number,
    direction: "up" | "down"
  ) => {
    updateDocument((prev) => {
      const sections = prev.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const steps = sec.steps.map((st) => {
          if (st.id !== stepId) return st;
          const blocks = [...st.blocks];
          const targetIndex = direction === "up" ? blockIndex - 1 : blockIndex + 1;
          if (targetIndex < 0 || targetIndex >= blocks.length) return st;
          const temp = blocks[blockIndex];
          blocks[blockIndex] = blocks[targetIndex];
          blocks[targetIndex] = temp;
          return { ...st, blocks };
        });
        return { ...sec, steps };
      });
      return { ...prev, sections };
    });
  };

  const handleDeleteCurrentJobsheet = async () => {
    if (confirm(`Hapus jobsheet "${doc.title}" secara permanen dari perangkat ini?`)) {
      try {
        await deleteJobsheet(doc.id);
        router.push("/");
      } catch (err) {
        alert("Gagal menghapus jobsheet: " + err);
      }
    }
  };

  const handleDuplicateCurrentJobsheet = async () => {
    try {
      await flushPendingSave();
      const clonedRecord = await duplicateJobsheet(doc.id);
      router.push(`/creator?id=${clonedRecord.id}`);
    } catch (err) {
      alert("Gagal menduplikat jobsheet: " + err);
    }
  };

  const totalStepsCount = React.useMemo(() => {
    return (doc.sections || []).reduce(
      (sum, sec) => sum + (sec.steps?.length || 0),
      0
    );
  }, [doc.sections]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-canvas text-ink font-mono text-sm">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Memuat editor jobsheet...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      {/* ------------------------------------------------------------------ */}
      {/* TOP BAR                                                            */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface px-3 sm:px-5 h-14 flex items-center justify-between gap-3">
        {/* Left: Back to Workspace + Document Title + Save Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/"
            onClick={() => {
              void flushPendingSave();
            }}
            className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md text-xs font-medium text-ink-secondary hover:text-ink hover:bg-muted transition-colors shrink-0"
            title="Kembali ke Workspace"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Workspace</span>
          </Link>

          <div className="h-5 w-px bg-line hidden sm:block" />

          <span className="text-sm font-semibold text-ink truncate max-w-[160px] md:max-w-[280px]">
            {doc.title || "Tanpa Judul"}
          </span>

          {/* Clear Autosave Feedback (Icon + Text) */}
          <div className="hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-muted/70 border border-line shrink-0">
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1.5 text-ink-secondary">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                <span>Tersimpan</span>
              </span>
            )}
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1.5 text-ink-secondary">
                <span className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </span>
            )}
            {saveStatus === "unsaved" && (
              <span className="flex items-center gap-1.5 text-amber">
                <Clock className="h-3.5 w-3.5" />
                <span>Belum disimpan</span>
              </span>
            )}
            {saveStatus === "error" && (
              <span
                className="flex items-center gap-1.5 text-danger font-medium"
                title={saveErrorMessage || "Gagal menyimpan"}
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Gagal menyimpan</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Panel Toggles + Preview + Publish */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowOutline(!showOutline)}
            className={`h-9 px-2.5 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              showOutline
                ? "bg-muted border-line-strong text-ink"
                : "bg-surface border-line text-ink-secondary hover:bg-muted"
            }`}
            title="Tampilkan / Sembunyikan Outline Dokumen"
            aria-label="Toggle Outline Dokumen"
            aria-pressed={showOutline}
          >
            <PanelLeft className="h-4 w-4" />
            <span className="hidden lg:inline">Outline</span>
          </button>

          <button
            type="button"
            onClick={() => setShowInspector(!showInspector)}
            className={`h-9 px-2.5 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              showInspector
                ? "bg-muted border-line-strong text-ink"
                : "bg-surface border-line text-ink-secondary hover:bg-muted"
            }`}
            title="Tampilkan / Sembunyikan Properti Dokumen"
            aria-label="Toggle Properti Dokumen"
            aria-pressed={showInspector}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden lg:inline">Properti</span>
          </button>

          <Link
            href={`/creator/preview?id=${doc.id}`}
            onClick={() => {
              void flushPendingSave();
            }}
          >
            <Button variant="outline" size="sm" title="Pratinjau dan ekspor PDF">
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </Link>

          <Link
            href={`/student/${doc.id}`}
            onClick={() => {
              void flushPendingSave();
            }}
          >
            <Button variant="outline" size="sm" title="Pratinjau tampilan siswa">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          </Link>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowPublishPanel(!showPublishPanel)}
            title="Terbitkan dan bagikan link jobsheet"
          >
            <Globe className="h-4 w-4" />
            <span>Publish</span>
          </Button>
        </div>
      </header>

      {/* Mobile Autosave Status Strip */}
      <div className="md:hidden px-4 py-1.5 bg-muted/60 border-b border-line flex items-center justify-between text-xs text-ink-secondary">
        <span>
          {saveStatus === "saved" && "Perubahan tersimpan di perangkat"}
          {saveStatus === "saving" && "Menyimpan perubahan..."}
          {saveStatus === "unsaved" && "Menunggu penyimpanan otomatis..."}
          {saveStatus === "error" && "Gagal menyimpan. Coba lagi."}
        </span>
        <span className="font-mono text-[11px]">
          {(doc.sections || []).length} Bagian • {totalStepsCount} Langkah
        </span>
      </div>

      {/* Publish Panel (when toggled) */}
      {showPublishPanel && (
        <div className="border-b border-line bg-muted/40 px-4 sm:px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <PublishPanel
              documentId={doc.id}
              documentTitle={doc.title}
              onClose={() => setShowPublishPanel(false)}
            />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 3-PANE WORKSPACE: OUTLINE | DOCUMENT CANVAS | INSPECTOR            */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 flex min-h-0 relative">
        {/* LEFT PANEL — DOCUMENT OUTLINE */}
        {showOutline && (
          <aside
            className="w-64 border-r border-line bg-surface shrink-0 hidden lg:flex flex-col justify-between sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto"
            aria-label="Outline Dokumen"
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-ink-muted font-semibold">
                  Outline Dokumen
                </span>
                <button
                  type="button"
                  onClick={() => setShowOutline(false)}
                  className="p-1 rounded text-ink-muted hover:text-ink hover:bg-muted cursor-pointer"
                  aria-label="Tutup Outline"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <nav className="space-y-2">
                {(doc.sections || []).map((section, sIdx) => {
                  const isActive = activeSectionId === section.id;
                  return (
                    <div key={section.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() =>
                          scrollToElement(`section-${section.id}`, section.id)
                        }
                        className={`w-full text-left px-2.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-start gap-2 ${
                          isActive
                            ? "bg-sage/60 text-primary"
                            : "text-ink hover:bg-muted"
                        }`}
                      >
                        <Layers className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {sIdx + 1}. {section.title || "Bagian Tanpa Judul"}
                        </span>
                      </button>

                      <div className="pl-5 space-y-0.5 border-l border-line ml-3">
                        {(section.steps || []).map((step) => (
                          <button
                            key={step.id}
                            type="button"
                            onClick={() =>
                              scrollToElement(`step-${step.id}`, section.id)
                            }
                            className="w-full text-left px-2 py-1.5 rounded text-xs text-ink-secondary hover:text-ink hover:bg-muted/70 transition-colors cursor-pointer truncate block"
                          >
                            {step.stepNumber}. {step.title || "Langkah"}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </nav>
            </div>

            <div className="p-3 border-t border-line">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddSection}
                className="w-full"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Bagian</span>
              </Button>
            </div>
          </aside>
        )}

        {/* CENTER — DOCUMENT CANVAS */}
        <main className="flex-1 min-w-0 py-6 sm:py-8 px-4 sm:px-6 lg:px-10">
          <article className="max-w-3xl mx-auto bg-surface border border-line rounded-lg p-6 sm:p-10 space-y-8 shadow-2xs">
            {/* Document Title & Description Header */}
            <header className="space-y-3 pb-6 border-b border-line">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-ink-muted">
                <span className="px-2 py-0.5 rounded bg-muted text-ink font-semibold uppercase">
                  {doc.code || "NO-CODE"}
                </span>
                <span>•</span>
                <span>{doc.category || "Umum"}</span>
                <span>•</span>
                <span>{doc.estimatedDurationMinutes || 60} Menit</span>
              </div>

              <input
                type="text"
                value={doc.title}
                onChange={(e) =>
                  updateDocument((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Judul Modul Jobsheet Praktikum..."
                aria-label="Judul Dokumen"
                className="w-full text-2xl sm:text-3xl font-bold text-ink bg-transparent border-0 border-b border-transparent hover:border-line focus:border-primary focus:outline-none focus:ring-0 p-0 pb-1 transition-colors leading-tight placeholder:text-ink-muted"
              />

              <textarea
                value={doc.description}
                onChange={(e) =>
                  updateDocument((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Tuliskan tujuan pembelajaran dan deskripsi singkat kegiatan praktikum..."
                aria-label="Deskripsi Dokumen"
                rows={2}
                className="w-full text-sm sm:text-base text-ink-secondary bg-transparent border-0 border-b border-transparent hover:border-line focus:border-primary focus:outline-none focus:ring-0 p-0 resize-y leading-relaxed placeholder:text-ink-muted"
              />
            </header>

            {/* Sections & Steps */}
            <div className="space-y-10">
              {(doc.sections || []).map((section, sIdx) => (
                <section
                  key={section.id}
                  id={`section-${section.id}`}
                  onFocus={() => setActiveSectionId(section.id)}
                  className="space-y-6 scroll-mt-20"
                >
                  {/* Section Heading */}
                  <div className="flex items-start justify-between gap-4 pb-3 border-b border-line">
                    <div className="space-y-1 flex-1">
                      <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
                        Bagian {sIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateDocument((prev) => ({
                            ...prev,
                            sections: prev.sections.map((s) =>
                              s.id === section.id ? { ...s, title: val } : s
                            ),
                          }));
                        }}
                        placeholder="Judul Bagian..."
                        aria-label={`Judul Bagian ${sIdx + 1}`}
                        className="w-full text-xl font-bold text-ink bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
                      />
                      <input
                        type="text"
                        value={section.description || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateDocument((prev) => ({
                            ...prev,
                            sections: prev.sections.map((s) =>
                              s.id === section.id ? { ...s, description: val } : s
                            ),
                          }));
                        }}
                        placeholder="Deskripsi singkat bagian ini (opsional)..."
                        aria-label={`Deskripsi Bagian ${sIdx + 1}`}
                        className="w-full text-sm text-ink-secondary bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSection(section.id)}
                      title="Hapus Bagian Ini"
                      aria-label={`Hapus Bagian ${sIdx + 1}`}
                      className="h-9 w-9 inline-flex items-center justify-center rounded-md text-danger hover:bg-danger/10 cursor-pointer shrink-0 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Steps */}
                  <div className="space-y-6">
                    {(section.steps || []).map((step) => (
                      <div
                        key={step.id}
                        id={`step-${step.id}`}
                        className="rounded-lg border border-line bg-surface p-4 sm:p-5 space-y-4 scroll-mt-20"
                      >
                        {/* Step Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
                          <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                            <span className="font-mono text-xs font-semibold text-primary bg-sage/60 px-2.5 py-1 rounded shrink-0">
                              Langkah {step.stepNumber}
                            </span>
                            <input
                              type="text"
                              value={step.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateDocument((prev) => ({
                                  ...prev,
                                  sections: prev.sections.map((s) =>
                                    s.id === section.id
                                      ? {
                                          ...s,
                                          steps: s.steps.map((st) =>
                                            st.id === step.id
                                              ? { ...st, title: val }
                                              : st
                                          ),
                                        }
                                      : s
                                  ),
                                }));
                              }}
                              placeholder="Judul Langkah Kerja..."
                              aria-label={`Judul Langkah ${step.stepNumber}`}
                              className="font-semibold text-base text-ink bg-transparent border-0 p-0 focus:outline-none focus:ring-0 flex-1"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-mono text-ink-secondary">
                              <Clock className="h-3.5 w-3.5 text-ink-muted" />
                              <input
                                type="number"
                                min={1}
                                value={step.estimatedMinutes || 10}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 10;
                                  updateDocument((prev) => ({
                                    ...prev,
                                    sections: prev.sections.map((s) =>
                                      s.id === section.id
                                        ? {
                                            ...s,
                                            steps: s.steps.map((st) =>
                                              st.id === step.id
                                                ? { ...st, estimatedMinutes: val }
                                                : st
                                            ),
                                          }
                                        : s
                                    ),
                                  }));
                                }}
                                aria-label={`Estimasi durasi langkah ${step.stepNumber} (menit)`}
                                className="w-14 h-8 bg-muted/50 border border-line rounded px-1.5 text-center text-ink"
                              />
                              <span>mnt</span>
                            </div>

                            {(section.steps || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteStep(section.id, step.id)}
                                title="Hapus langkah ini"
                                aria-label={`Hapus Langkah ${step.stepNumber}`}
                                className="h-8 w-8 inline-flex items-center justify-center rounded text-danger hover:bg-danger/10 cursor-pointer transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Content Blocks */}
                        <div className="space-y-3">
                          {(step.blocks || []).map((block, bIdx) => (
                            <BlockEditor
                              key={block.id}
                              documentId={doc.id}
                              block={block}
                              onUpdate={(updated) =>
                                handleUpdateBlock(
                                  section.id,
                                  step.id,
                                  block.id,
                                  updated
                                )
                              }
                              onDelete={() =>
                                handleDeleteBlock(section.id, step.id, block.id)
                              }
                              onMoveUp={() =>
                                handleMoveBlock(section.id, step.id, bIdx, "up")
                              }
                              onMoveDown={() =>
                                handleMoveBlock(section.id, step.id, bIdx, "down")
                              }
                              isFirst={bIdx === 0}
                              isLast={bIdx === (step.blocks || []).length - 1}
                            />
                          ))}
                        </div>

                        {/* Clear Grouped Add-Block Toolbar */}
                        <div className="pt-3 border-t border-line flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium text-ink-secondary mr-1">
                            Tambah Blok:
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleAddBlock(section.id, step.id, "paragraph")
                            }
                          >
                            <AlignLeft className="h-3.5 w-3.5" />
                            <span>Paragraf</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleAddBlock(section.id, step.id, "heading")
                            }
                          >
                            <Heading2 className="h-3.5 w-3.5" />
                            <span>Sub-Judul</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleAddBlock(section.id, step.id, "callout")
                            }
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>Callout</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleAddBlock(section.id, step.id, "checklist")
                            }
                          >
                            <CheckSquare className="h-3.5 w-3.5" />
                            <span>Checklist</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleAddBlock(section.id, step.id, "code")
                            }
                          >
                            <Code2 className="h-3.5 w-3.5" />
                            <span>Kode</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleAddBlock(section.id, step.id, "image")
                            }
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                            <span>Gambar</span>
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Add Step Button */}
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => handleAddStep(section.id)}
                      className="w-full border-dashed"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Tambah Langkah Kerja</span>
                    </Button>
                  </div>
                </section>
              ))}

              {/* Add Section Button */}
              <div className="pt-4 border-t border-line">
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleAddSection}
                  className="w-full border-dashed"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Bagian Baru</span>
                </Button>
              </div>
            </div>
          </article>
        </main>

        {/* RIGHT PANEL — CONTEXTUAL INSPECTOR (DESKTOP + MOBILE DRAWER) */}
        {showInspector && (
          <aside
            className="w-72 border-l border-line bg-surface shrink-0 fixed inset-y-0 right-0 z-40 lg:static lg:z-auto lg:h-[calc(100vh-3.5rem)] lg:sticky lg:top-14 overflow-y-auto shadow-lg lg:shadow-none flex flex-col justify-between"
            aria-label="Properti Dokumen"
          >
            <div className="p-4 space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <span className="text-xs font-mono uppercase tracking-wider text-ink-muted font-semibold">
                  Properti Dokumen
                </span>
                <button
                  type="button"
                  onClick={() => setShowInspector(false)}
                  className="p-1 rounded text-ink-muted hover:text-ink hover:bg-muted cursor-pointer"
                  aria-label="Tutup Properti Dokumen"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Group 1: Identitas Dokumen */}
              <div className="space-y-3">
                <h2 className="text-xs font-semibold text-ink uppercase tracking-wider">
                  Identitas Dokumen
                </h2>

                <div>
                  <label
                    htmlFor="doc-code"
                    className="text-xs text-ink-secondary block mb-1"
                  >
                    Kode Jobsheet
                  </label>
                  <input
                    id="doc-code"
                    type="text"
                    value={doc.code || ""}
                    onChange={(e) =>
                      updateDocument((prev) => ({ ...prev, code: e.target.value }))
                    }
                    placeholder="misal: TKJ-01"
                    className="w-full h-10 bg-surface border border-line rounded-md px-3 text-sm text-ink font-mono uppercase"
                  />
                </div>

                <div>
                  <label
                    htmlFor="doc-category"
                    className="text-xs text-ink-secondary block mb-1"
                  >
                    Kategori / Program Keahlian
                  </label>
                  <select
                    id="doc-category"
                    value={doc.category || "Umum"}
                    onChange={(e) =>
                      updateDocument((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full h-10 bg-surface border border-line rounded-md px-3 text-sm text-ink"
                  >
                    <option value="TKJ">TKJ (Jaringan)</option>
                    <option value="RPL">RPL (Software)</option>
                    <option value="TAV">TAV (Elektronika)</option>
                    <option value="SIJA">SIJA (Sistem)</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="doc-audience"
                    className="text-xs text-ink-secondary block mb-1"
                  >
                    Target Peserta Didik
                  </label>
                  <input
                    id="doc-audience"
                    type="text"
                    value={doc.targetAudience || ""}
                    onChange={(e) =>
                      updateDocument((prev) => ({
                        ...prev,
                        targetAudience: e.target.value,
                      }))
                    }
                    placeholder="SMK Kelas XI TKJ"
                    className="w-full h-10 bg-surface border border-line rounded-md px-3 text-sm text-ink"
                  />
                </div>

                <div>
                  <label
                    htmlFor="doc-duration"
                    className="text-xs text-ink-secondary block mb-1"
                  >
                    Estimasi Durasi (Menit)
                  </label>
                  <input
                    id="doc-duration"
                    type="number"
                    min={5}
                    value={doc.estimatedDurationMinutes || 60}
                    onChange={(e) =>
                      updateDocument((prev) => ({
                        ...prev,
                        estimatedDurationMinutes: parseInt(e.target.value) || 60,
                      }))
                    }
                    className="w-full h-10 bg-surface border border-line rounded-md px-3 text-sm text-ink font-mono"
                  />
                </div>

                <div>
                  <label
                    htmlFor="doc-author"
                    className="text-xs text-ink-secondary block mb-1"
                  >
                    Nama Instruktur / Guru
                  </label>
                  <input
                    id="doc-author"
                    type="text"
                    value={doc.author?.name || ""}
                    onChange={(e) =>
                      updateDocument((prev) => ({
                        ...prev,
                        author: { ...prev.author, name: e.target.value },
                      }))
                    }
                    placeholder="Nama Guru"
                    className="w-full h-10 bg-surface border border-line rounded-md px-3 text-sm text-ink"
                  />
                </div>
              </div>

              {/* Group 2: Pengaturan Tampilan Siswa */}
              <div className="space-y-3 pt-4 border-t border-line">
                <h2 className="text-xs font-semibold text-ink uppercase tracking-wider">
                  Pengaturan Student Mode
                </h2>

                <div>
                  <label
                    htmlFor="doc-default-view"
                    className="text-xs text-ink-secondary block mb-1"
                  >
                    Tampilan Awal Siswa
                  </label>
                  <select
                    id="doc-default-view"
                    value={doc.settings?.defaultViewMode || "guided"}
                    onChange={(e) =>
                      updateDocument((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          defaultViewMode: e.target.value as "guided" | "document",
                        },
                      }))
                    }
                    className="w-full h-10 bg-surface border border-line rounded-md px-3 text-sm text-ink"
                  >
                    <option value="guided">Guided View (Per Langkah)</option>
                    <option value="document">Document View (Lengkap)</option>
                  </select>
                </div>

                <label className="flex items-center gap-2.5 text-xs text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={doc.settings?.allowStudentViewSwitch !== false}
                    onChange={(e) =>
                      updateDocument((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          allowStudentViewSwitch: e.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4 rounded border-line text-primary"
                  />
                  <span>Izinkan siswa berpindah mode tampilan</span>
                </label>
              </div>
            </div>

            {/* Group 3: Document Actions */}
            <div className="p-4 border-t border-line space-y-2 bg-muted/30">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicateCurrentJobsheet}
                className="w-full justify-start"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Duplikat Jobsheet</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteCurrentJobsheet}
                className="w-full justify-start text-danger hover:bg-danger/10 hover:text-danger border-danger/30"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Hapus Jobsheet</span>
              </Button>
            </div>
          </aside>
        )}
      </div>

      <Footer variant="compact" />
    </div>
  );
}
