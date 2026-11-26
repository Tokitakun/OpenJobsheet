"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Database,
  Sparkles,
  LayoutGrid,
  List,
  ArrowUpDown,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JobsheetCard } from "@/components/workspace/jobsheet-card";
import { JobsheetListRow } from "@/components/workspace/jobsheet-list-row";
import { EmptyState } from "@/components/workspace/empty-state";
import { ImportJobsheetDialog } from "@/components/workspace/import-jobsheet-dialog";
import { exportJobsheetFile } from "@/lib/portability/jobsheet-package";
import {
  getAllJobsheets,
  deleteJobsheet,
  saveJobsheet,
  getAllLocalPublications,
  getSetting,
  setSetting,
} from "@/lib/storage/jobsheet-repository";
import {
  JobsheetRecord,
  LocalPublicationRecord,
  createBlankJobsheet,
} from "@/lib/schema/document";
import { PREVIEW_FIXTURES } from "@/components/workspace/preview-fixtures";

const CATEGORIES = [
  { id: "ALL", label: "Semua" },
  { id: "TKJ", label: "TKJ" },
  { id: "RPL", label: "RPL" },
  { id: "TAV", label: "TAV" },
  { id: "SIJA", label: "SIJA" },
  { id: "Umum", label: "Umum" },
] as const;

type ViewMode = "grid" | "list";
type SortOption =
  | "updatedAt-desc"
  | "updatedAt-asc"
  | "title-asc"
  | "title-desc"
  | "createdAt-desc"
  | "createdAt-asc";

const VIEW_MODE_SETTING_KEY = "workspace_view_mode";

export default function WorkspacePage() {
  const router = useRouter();
  const [jobsheets, setJobsheets] = React.useState<JobsheetRecord[]>([]);
  const [publicationsByDoc, setPublicationsByDoc] = React.useState<
    Record<string, LocalPublicationRecord>
  >({});
  const [loading, setLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const isCreatingRef = React.useRef(false);
  const [showImportDialog, setShowImportDialog] = React.useState(false);
  const [portabilityFeedback, setPortabilityFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [activeTab, setActiveTab] = React.useState<"user" | "fixtures">("user");
  const [viewMode, setViewMode] = React.useState<ViewMode>("list");
  const [sortBy, setSortBy] = React.useState<SortOption>("updatedAt-desc");

  const loadWorkspaceData = React.useCallback(async () => {
    const [records, pubs, savedView] = await Promise.all([
      getAllJobsheets(),
      getAllLocalPublications(),
      getSetting<ViewMode>(VIEW_MODE_SETTING_KEY, "list"),
    ]);

    const pubMap: Record<string, LocalPublicationRecord> = {};
    for (const pub of pubs) {
      const existing = pubMap[pub.documentId];
      // Prefer active publication or latest updated one
      if (!existing || (pub.status === "active" && existing.status !== "active") || pub.updatedAt > existing.updatedAt) {
        pubMap[pub.documentId] = pub;
      }
    }

    return { records, pubMap, savedView };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    loadWorkspaceData()
      .then(({ records, pubMap, savedView }) => {
        if (mounted) {
          setJobsheets(records);
          setPublicationsByDoc(pubMap);
          setViewMode(savedView === "list" ? "list" : "grid");
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Gagal memuat workspace:", err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [loadWorkspaceData]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setSetting(VIEW_MODE_SETTING_KEY, mode);
  };

  // Export jobsheet to .jobsheet file
  const handleExportJobsheet = React.useCallback(async (id: string) => {
    try {
      const filename = await exportJobsheetFile(id);
      setPortabilityFeedback({
        type: "success",
        message: `Ekspor berhasil: ${filename}`,
      });
    } catch (err) {
      setPortabilityFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Gagal mengekspor jobsheet.",
      });
    }
  }, []);

  const handleImportedSuccess = React.useCallback(
    async (message: string) => {
      const { records, pubMap } = await loadWorkspaceData();
      setJobsheets(records);
      setPublicationsByDoc(pubMap);
      setActiveTab("user");
      setPortabilityFeedback({ type: "success", message });
    },
    [loadWorkspaceData]
  );

  // Single guarded creation handler: prevents duplicate records on rapid clicks
  const handleCreateJobsheet = React.useCallback(async () => {
    if (isCreatingRef.current) return;
    isCreatingRef.current = true;
    setIsCreating(true);
    try {
      const newDoc = createBlankJobsheet();
      await saveJobsheet(newDoc);
      router.push(`/creator?id=${newDoc.id}`);
    } catch (err) {
      console.error("Gagal membuat jobsheet baru:", err);
      alert("Gagal membuat jobsheet baru: " + err);
      isCreatingRef.current = false;
      setIsCreating(false);
    }
  }, [router]);

  // Delete jobsheet handler
  const handleDelete = async (id: string) => {
    const target = jobsheets.find((j) => j.id === id);
    if (!target) return;

    if (confirm(`Apakah Anda yakin ingin menghapus jobsheet "${target.title}"?`)) {
      try {
        await deleteJobsheet(id);
        const { records, pubMap } = await loadWorkspaceData();
        setJobsheets(records);
        setPublicationsByDoc(pubMap);
      } catch (err) {
        alert("Gagal menghapus jobsheet: " + err);
      }
    }
  };

  // Explicit user-triggered action: create jobsheet from a sample fixture
  const handleCloneFixtureToDatabase = async (fixtureId: string) => {
    const fixture = PREVIEW_FIXTURES.find((f) => f.id === fixtureId);
    if (!fixture) return;

    const newDoc = createBlankJobsheet(fixture.title);
    newDoc.code = fixture.code;
    newDoc.category = fixture.category;
    newDoc.description = fixture.description;
    newDoc.targetAudience = fixture.targetAudience;
    newDoc.estimatedDurationMinutes = fixture.estimatedDurationMinutes;
    newDoc.author = { name: fixture.author, institution: "SMK Negeri" };

    try {
      await saveJobsheet(newDoc);
      const { records, pubMap } = await loadWorkspaceData();
      setJobsheets(records);
      setPublicationsByDoc(pubMap);
      setActiveTab("user");
    } catch (err) {
      alert("Gagal menyalin template: " + err);
    }
  };

  // Filter and sort user jobsheets
  const filteredUserJobsheets = React.useMemo(() => {
    const filtered = jobsheets.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(q) ||
        (item.code || "").toLowerCase().includes(q) ||
        (item.data?.description || "").toLowerCase().includes(q) ||
        item.authorName.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === "ALL" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "title-asc":
          return a.title.localeCompare(b.title, "id");
        case "title-desc":
          return b.title.localeCompare(a.title, "id");
        case "createdAt-desc":
          return (b.createdAt || 0) - (a.createdAt || 0);
        case "createdAt-asc":
          return (a.createdAt || 0) - (b.createdAt || 0);
        case "updatedAt-asc":
          return (a.updatedAt || 0) - (b.updatedAt || 0);
        case "updatedAt-desc":
        default:
          return (b.updatedAt || 0) - (a.updatedAt || 0);
      }
    });
  }, [jobsheets, searchQuery, selectedCategory, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("ALL");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-line">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              Workspace
            </h1>
            <p className="text-sm text-ink-secondary max-w-2xl leading-relaxed mt-1">
              Kelola seluruh jobsheet praktikum lokal Anda. Buat, edit, ikuti
              langkah demi langkah, dan bagikan melalui link.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowImportDialog(true)}
              title="Impor paket file .jobsheet dari perangkat lain"
            >
              <Upload className="h-4 w-4" strokeWidth={1.75} />
              <span>Impor Jobsheet</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleCreateJobsheet}
              disabled={isCreating}
              title="Buka Creator Mode untuk membuat jobsheet baru"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              <span>{isCreating ? "Membuat..." : "Buat Jobsheet"}</span>
            </Button>
          </div>
        </div>

        {/* Portability Feedback Banner */}
        {portabilityFeedback && (
          <div
            className={`rounded-md border px-4 py-3 text-xs flex items-center justify-between gap-3 ${
              portabilityFeedback.type === "error"
                ? "border-danger/30 bg-danger/5 text-danger"
                : "border-primary/25 bg-sage/50 text-primary"
            }`}
            role="status"
          >
            <div className="flex items-center gap-2 font-medium">
              {portabilityFeedback.type === "error" ? (
                <AlertCircle className="h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              )}
              <span>{portabilityFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setPortabilityFeedback(null)}
              className="text-xs underline cursor-pointer shrink-0"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Tab Selection: User IndexedDB Docs vs Sample Preview Fixtures */}
        <div className="flex items-center justify-between border-b border-line pb-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("user")}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold border-b-2 -mb-1.5 transition-colors cursor-pointer ${
                activeTab === "user"
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-secondary hover:text-ink"
              }`}
            >
              <Database className="h-4 w-4" />
              <span>Jobsheet Saya</span>
              <span className="font-mono text-xs px-1.5 py-0.2 rounded-full bg-muted">
                {jobsheets.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("fixtures")}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold border-b-2 -mb-1.5 transition-colors cursor-pointer ${
                activeTab === "fixtures"
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-secondary hover:text-ink"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Contoh Template</span>
              <span className="font-mono text-xs px-1.5 py-0.2 rounded-full bg-muted">
                {PREVIEW_FIXTURES.length}
              </span>
            </button>
          </div>

          <span className="font-mono text-xs text-ink-muted hidden sm:inline">
            Local-First • IndexedDB
          </span>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: USER JOBSHEETS (INDEXEDDB)                                   */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "user" && (
          <div className="space-y-5">
            {/* Search, Sort & View Mode Toolbar */}
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              <div className="w-full lg:max-w-sm">
                <Input
                  icon={<Search className="h-4 w-4" strokeWidth={1.75} />}
                  placeholder="Cari judul, kode, atau instruktur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Cari jobsheet tersimpan"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5">
                {/* Category Filter Pills */}
                <div
                  className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0"
                  role="tablist"
                >
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer select-none ${
                          isSelected
                            ? "bg-primary text-primary-fg shadow-xs"
                            : "bg-surface text-ink-secondary border border-line hover:bg-muted hover:text-ink"
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-1.5 bg-surface border border-line rounded-md px-2.5 py-1.5 text-xs">
                  <ArrowUpDown className="h-3.5 w-3.5 text-ink-muted shrink-0" />
                  <label htmlFor="workspace-sort" className="sr-only">
                    Urutkan
                  </label>
                  <select
                    id="workspace-sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-transparent text-ink font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="updatedAt-desc">Terakhir Diperbarui</option>
                    <option value="updatedAt-asc">Terlama Diperbarui</option>
                    <option value="title-asc">Nama (A–Z)</option>
                    <option value="title-desc">Nama (Z–A)</option>
                    <option value="createdAt-desc">Terbaru Dibuat</option>
                    <option value="createdAt-asc">Terlama Dibuat</option>
                  </select>
                </div>

                {/* Grid / List View Toggle */}
                <div
                  className="flex items-center p-0.5 rounded-md bg-muted border border-line shrink-0"
                  role="group"
                  aria-label="Tampilan Workspace"
                >
                  <button
                    type="button"
                    onClick={() => handleViewModeChange("grid")}
                    className={`p-1.5 rounded transition-colors cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-surface text-ink shadow-2xs"
                        : "text-ink-muted hover:text-ink"
                    }`}
                    title="Grid View"
                    aria-label="Grid View"
                    aria-pressed={viewMode === "grid"}
                  >
                    <LayoutGrid className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewModeChange("list")}
                    className={`p-1.5 rounded transition-colors cursor-pointer ${
                      viewMode === "list"
                        ? "bg-surface text-ink shadow-2xs"
                        : "text-ink-muted hover:text-ink"
                    }`}
                    title="List View"
                    aria-label="List View"
                    aria-pressed={viewMode === "list"}
                  >
                    <List className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="p-12 text-center text-sm font-mono text-ink-muted">
                Memuat data dari IndexedDB...
              </div>
            ) : filteredUserJobsheets.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredUserJobsheets.map((record) => (
                    <JobsheetCard
                      key={record.id}
                      jobsheet={record}
                      publication={publicationsByDoc[record.id]}
                      onDelete={handleDelete}
                      onExport={handleExportJobsheet}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-line bg-surface overflow-hidden shadow-2xs">
                  <div className="hidden sm:flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-line text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                    <span>Dokumen</span>
                    <div className="flex items-center gap-12 pr-2">
                      <span>Diperbarui</span>
                      <span className="w-36 text-right">Aksi</span>
                    </div>
                  </div>
                  {filteredUserJobsheets.map((record) => (
                    <JobsheetListRow
                      key={record.id}
                      jobsheet={record}
                      publication={publicationsByDoc[record.id]}
                      onDelete={handleDelete}
                      onExport={handleExportJobsheet}
                    />
                  ))}
                </div>
              )
            ) : jobsheets.length === 0 ? (
              /* Genuine Empty State (No documents in IndexedDB) */
              <div className="rounded-lg border border-dashed border-line p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-6 bg-surface/50 space-y-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-ink-muted">
                  <Database className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="font-semibold text-ink text-base mb-1">
                    Belum ada jobsheet.
                  </h3>
                  <p className="text-sm text-ink-secondary leading-relaxed">
                    Mulai dengan membuat jobsheet pertama atau menyalin dari
                    contoh template yang tersedia.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleCreateJobsheet}
                    disabled={isCreating}
                  >
                    <Plus className="h-4 w-4" />
                    <span>{isCreating ? "Membuat..." : "Buat Jobsheet"}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setShowImportDialog(true)}
                  >
                    <Upload className="h-4 w-4" />
                    <span>Impor Jobsheet</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setActiveTab("fixtures")}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Lihat Contoh Template</span>
                  </Button>
                </div>
              </div>
            ) : (
              /* Search / Category Filter Empty State */
              <EmptyState onReset={handleResetFilters} />
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: SAMPLE PREVIEW FIXTURES (READ ONLY)                         */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "fixtures" && (
          <div className="space-y-4">
            <div className="p-4 rounded-md border border-line bg-muted/40 text-xs text-ink-secondary flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-ink">
                  Daftar Template Praktikum Siap Pakai (Preview Fixtures)
                </p>
                <p className="leading-relaxed">
                  Modul di bawah ini merupakan template referensi. Modul ini{" "}
                  <strong>tidak tersimpan di database Anda</strong> sebelum Anda
                  menekan tombol &ldquo;Salin ke Database Saya&rdquo;.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {PREVIEW_FIXTURES.map((fixture) => (
                <div
                  key={fixture.id}
                  className="rounded-lg border border-line bg-surface p-5 flex flex-col justify-between space-y-4 shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-ink-muted">
                      <span>{fixture.code}</span>
                      <span className="px-2 py-0.5 rounded bg-muted text-ink font-semibold">
                        {fixture.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-ink text-base">
                      {fixture.title}
                    </h3>
                    <p className="text-xs text-ink-secondary leading-relaxed">
                      {fixture.description}
                    </p>
                    <div className="text-xs font-mono text-ink-muted pt-1">
                      {fixture.stepCount} Langkah • {fixture.estimatedDurationMinutes}{" "}
                      Menit • {fixture.author}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-line">
                    <Link
                      href={`/student/${fixture.id}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Buka Pratinjau Siswa →
                    </Link>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleCloneFixtureToDatabase(fixture.id)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Salin ke Database Saya</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ImportJobsheetDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImported={handleImportedSuccess}
      />
    </AppShell>
  );
}
