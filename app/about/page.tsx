import Link from "next/link";
import {
  FileText,
  PenTool,
  BookOpen,
  ListOrdered,
  Globe,
  HardDrive,
  ShieldCheck,
  Code2,
  ArrowRight,
  Layers,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AboutPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-10 py-2">
        {/* Hero / Overview */}
        <section className="space-y-4 pb-6 border-b border-line">
          <div className="inline-flex items-center gap-2">
            <Badge variant="default" size="sm">
              Open-Source Practical Learning Platform
            </Badge>
            <Badge variant="neutral" size="sm">
              Lisensi MIT
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-ink">
            Tentang OpenJobsheet
          </h1>
          <p className="text-sm sm:text-base text-ink-secondary leading-relaxed max-w-3xl">
            OpenJobsheet adalah aplikasi web open-source berarsitektur{" "}
            <strong className="text-ink">local-first</strong> untuk membuat,
            mengelola, membagikan, dan mengikuti panduan kegiatan praktik
            (jobsheet) secara digital. Dirancang khusus untuk pendidikan vokasi
            (SMK), perguruan tinggi, lembaga pelatihan, dan pengajar
            independen.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link href="/">
              <Button variant="primary" size="md">
                <span>Buka Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/creator">
              <Button variant="outline" size="md">
                <PenTool className="h-4 w-4" />
                <span>Mulai di Creator Mode</span>
              </Button>
            </Link>
          </div>
        </section>

        {/* Product Philosophy & Principle */}
        <section className="rounded-lg border border-line bg-surface p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
            Filosofi &amp; Prinsip Produk
          </div>
          <blockquote className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
            &ldquo;Create easily. Learn step by step. Own your data.&rdquo;
          </blockquote>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            Berbeda dengan Learning Management System (LMS) yang berfokus pada
            absensi, nilai, atau administrasi sekolah, OpenJobsheet berfokus
            sepenuhnya pada kualitas dokumentasi dan pelaksanaan kegiatan
            praktikum. Guru tidak perlu repot memformat dokumen dari awal, dan
            siswa dapat mengikuti instruksi teknis tanpa kebingungan.
          </p>
        </section>

        {/* Core Modes */}
        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-ink">
            Cara Kerja OpenJobsheet
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Creator Mode */}
            <div className="rounded-lg border border-line bg-surface p-5 space-y-2.5">
              <div className="flex items-center gap-2.5 text-ink font-semibold">
                <div className="h-8 w-8 rounded-md bg-sage/40 text-primary flex items-center justify-center">
                  <PenTool className="h-4 w-4" />
                </div>
                <span>Creator Mode</span>
              </div>
              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                Ruang kerja terstruktur bagi guru dan instruktur untuk menyusun
                jobsheet berdasarkan bagian, langkah kerja bernomor, peringatan
                keselamatan (K3), potongan kode, gambar ilustrasi, dan
                checklist verifikasi. Dilengkapi autosave langsung ke IndexedDB.
              </p>
            </div>

            {/* Student Mode */}
            <div className="rounded-lg border border-line bg-surface p-5 space-y-2.5">
              <div className="flex items-center gap-2.5 text-ink font-semibold">
                <div className="h-8 w-8 rounded-md bg-sage/40 text-primary flex items-center justify-center">
                  <BookOpen className="h-4 w-4" />
                </div>
                <span>Student Mode</span>
              </div>
              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                Lingkungan baca dan praktik bebas distraksi bagi siswa tanpa
                harus login atau membuat akun. Progres pengerjaan langkah dan
                checklist tersimpan secara lokal di peramban perangkat siswa.
              </p>
            </div>

            {/* Document View */}
            <div className="rounded-lg border border-line bg-surface p-5 space-y-2.5">
              <div className="flex items-center gap-2.5 text-ink font-semibold">
                <div className="h-8 w-8 rounded-md bg-muted text-ink flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
                <span>Document View</span>
              </div>
              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                Menampilkan keseluruhan lembar kerja dalam satu halaman panjang
                yang rapi dan terstruktur dari tujuan praktikum hingga evaluasi,
                nyaman untuk dibaca menyeluruh seperti dokumen teknis.
              </p>
            </div>

            {/* Guided View */}
            <div className="rounded-lg border border-line bg-surface p-5 space-y-2.5">
              <div className="flex items-center gap-2.5 text-ink font-semibold">
                <div className="h-8 w-8 rounded-md bg-muted text-ink flex items-center justify-center">
                  <ListOrdered className="h-4 w-4" />
                </div>
                <span>Guided View</span>
              </div>
              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                Memecah praktikum menjadi satu langkah kerja pada satu waktu
                dengan indikator progres, navigasi Previous/Next, dan checklist
                verifikasi yang nyaman di tablet maupun smartphone di meja
                bengkel/lab.
              </p>
            </div>
          </div>
        </section>

        {/* Cloud Publishing & Local-First Ownership */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-line bg-surface p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-ink font-semibold">
              <Globe className="h-4 w-4 text-primary" />
              <span>Cloud Publishing &amp; Share Link</span>
            </div>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              Guru dapat menerbitkan salinan jobsheet beserta aset gambarnya
              untuk dibagikan melalui link publik. Publikasi dapat diperbarui ke
              versi baru dengan URL yang sama, dicabut aksesnya sewaktu-waktu,
              atau dihapus tanpa memengaruhi dokumen asli di perangkat guru.
            </p>
          </div>

          <div className="rounded-lg border border-line bg-surface p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-ink font-semibold">
              <HardDrive className="h-4 w-4 text-primary" />
              <span>Prinsip Local-First &amp; Kepemilikan Data</span>
            </div>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              Dokumen asli, media lokal, dan progres belajar siswa tersimpan di
              perangkat masing-masing menggunakan IndexedDB dan Dexie.js. Fitur
              inti pembuatan dan pembacaan lokal tetap bekerja tanpa bergantung
              pada koneksi internet.
            </p>
          </div>
        </section>

        {/* Tech Stack & License */}
        <section className="rounded-lg border border-line bg-surface p-6 space-y-4">
          <div className="flex items-center gap-2 text-ink font-semibold">
            <Code2 className="h-4 w-4 text-primary" />
            <span>Teknologi &amp; Lisensi</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-ink-secondary">
            <div className="space-y-1.5">
              <div className="font-mono uppercase text-[11px] text-ink-muted flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                <span>Teknologi Utama</span>
              </div>
              <ul className="space-y-1 list-disc list-inside">
                <li>Next.js App Router, React &amp; TypeScript</li>
                <li>Tailwind CSS (Editorial Technical Workspace)</li>
                <li>Dexie.js &amp; IndexedDB untuk penyimpanan lokal</li>
                <li>Lucide React untuk ikon antarmuka</li>
                <li>SQLite (better-sqlite3) untuk layanan publikasi</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <div className="font-mono uppercase text-[11px] text-ink-muted flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Lisensi Open-Source</span>
              </div>
              <p className="leading-relaxed">
                OpenJobsheet dirilis di bawah <strong>MIT License</strong>.
                Anda bebas menggunakan, memodifikasi, dan mendistribusikan
                perangkat lunak ini untuk kebutuhan pendidikan maupun
                komunitas.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
