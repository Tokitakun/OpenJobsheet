"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Layers, CheckSquare, Database } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { getAllJobsheets } from "@/lib/storage/jobsheet-repository";
import { JobsheetRecord } from "@/lib/schema/document";
import { PREVIEW_FIXTURES } from "@/components/workspace/preview-fixtures";

export default function StudentIndexPage() {
  const [userJobsheets, setUserJobsheets] = React.useState<JobsheetRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    getAllJobsheets()
      .then((records) => {
        if (active) {
          setUserJobsheets(records);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error("Gagal memuat jobsheet untuk siswa:", e);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-secondary hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Workspace</span>
          </Link>
          <Badge variant="default" size="md">
            Student Experience
          </Badge>
        </div>

        {/* Page Header */}
        <div className="rounded-lg border border-line bg-surface p-6 sm:p-8 space-y-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-ink">
                Student Mode (Konsol Praktikum)
              </h1>
              <p className="text-xs sm:text-sm text-ink-secondary">
                Pilih modul jobsheet untuk memulai praktikum dengan panduan
                interaktif hybrid (Document View &amp; Guided View).
              </p>
            </div>
          </div>
        </div>

        {/* Hybrid Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-line bg-surface p-4 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-ink font-semibold text-sm">
              <Layers className="h-4 w-4 text-primary" strokeWidth={2} />
              <span>Document View</span>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Tampilan menyeluruh seperti dokumentasi teknis atau manual buku.
              Membaca seluruh konteks praktikum, alat bahan, dan langkah kerja
              secara berurutan.
            </p>
          </div>

          <div className="rounded-lg border border-line bg-surface p-4 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-ink font-semibold text-sm">
              <CheckSquare className="h-4 w-4 text-primary" strokeWidth={2} />
              <span>Guided Step-by-Step</span>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Tampilan fokus per satu langkah dengan tombol navigasi besar yang
              ramah sentuhan di meja bengkel atau laboratorium.
            </p>
          </div>
        </div>

        {/* User Saved Jobsheets from IndexedDB */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider font-mono flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <span>Jobsheet Tersimpan Anda (IndexedDB)</span>
            </h2>
            <span className="font-mono text-xs text-ink-muted">
              {userJobsheets.length} Dokumen
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-ink-muted">
              Memuat data...
            </div>
          ) : userJobsheets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userJobsheets.map((item) => (
                <Card key={item.id} className="flex flex-col justify-between">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between text-xs mb-1 font-mono text-ink-muted">
                      <span>{item.code || "JOB"}</span>
                      <Badge variant="neutral" size="sm">
                        {item.category || "Umum"}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-semibold">
                      {item.title}
                    </CardTitle>
                    <CardDescription>
                      {item.data?.description || "Tidak ada deskripsi."}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="p-4 pt-2 justify-between">
                    <span className="text-xs text-ink-muted font-mono">
                      {item.stepCount} Langkah • {item.estimatedMinutes} Menit
                    </span>
                    <Link href={`/student/${item.id}`}>
                      <Button variant="primary" size="sm">
                        Buka Panduan
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-line bg-surface/50 p-6 text-center text-xs text-ink-secondary space-y-2">
              <p>Belum ada jobsheet tersimpan di peramban Anda.</p>
              <Link href="/creator">
                <Button variant="outline" size="sm">
                  <span>Buat Jobsheet Baru di Creator Mode</span>
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Sample Preview Fixtures */}
        <div className="space-y-3 pt-4 border-t border-line">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wider font-mono text-ink-muted">
            Modul Contoh (Preview Fixtures — Hanya Baca)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PREVIEW_FIXTURES.map((item) => (
              <Card key={item.id} className="flex flex-col justify-between bg-muted/20">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between text-xs mb-1 font-mono text-ink-muted">
                    <span>{item.code}</span>
                    <Badge variant="neutral" size="sm">
                      {item.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-semibold">
                    {item.title}
                  </CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardFooter className="p-4 pt-2 justify-between">
                  <span className="text-xs text-ink-muted font-mono">
                    {item.stepCount} Langkah • {item.estimatedDurationMinutes} Menit
                  </span>
                  <Link href={`/student/${item.id}`}>
                    <Button variant="secondary" size="sm">
                      Buka Pratinjau
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
