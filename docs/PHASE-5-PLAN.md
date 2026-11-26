# OpenJobsheet — Phase 5 Plan: Workspace & Product Experience

**Status:** In Progress  
**Phase:** 5  
**Principle:** Create easily. Learn step by step. Own your data.

---

## 1. Tujuan Phase 5

Mengembangkan OpenJobsheet dari kumpulan mode fungsional (Phase 1–4) menjadi aplikasi produktivitas yang terintegrasi, rapi, dan intuitif:
- **Workspace** sebagai pusat pengelolaan dokumen lokal dengan **Grid View** dan **List View**, pencarian, pengurutan, status publikasi, dan preferensi tampilan tersimpan.
- **Navigasi Creator Mode** yang mulus dari/ke Workspace tanpa risiko kehilangan perubahan yang belum tersimpan.
- **Penyempurnaan Student Experience** (Document View & Guided View) yang konsisten untuk jobsheet lokal maupun terpublikasi.
- **Halaman About** & **Footer konsisten** di seluruh area produk tanpa link palsu.
- **Responsivitas penuh** pada desktop, tablet, dan mobile.

---

## 2. Arsitektur & Keputusan Desain

### 2.1 Workspace (`app/page.tsx`, `components/workspace/*`)
- **Grid View & List View**:
  - `JobsheetCard` untuk Grid View (kartu terstruktur dengan kode, kategori, status publikasi, ringkasan, metadata langkah/durasi/penulis, waktu diperbarui, serta aksi Buka, Edit, Hapus).
  - `JobsheetListRow` untuk List View (baris horizontal ringkas terinspirasi Google Drive dengan kolom Judul/Kode, Status Publikasi, Metadata, Terakhir Diperbarui, dan Aksi).
- **Preferensi Tampilan**: Disimpan di tabel `settings` Dexie (`workspace_view_mode`: `"grid" | "list"`) melalui helper `getSetting` / `setSetting` di `lib/storage/jobsheet-repository.ts` — tanpa mengubah skema database atau menambah tabel baru.
- **Sorting**: Mendukung pengurutan berdasarkan terakhir diperbarui (terbaru/terlama), nama (A–Z / Z–A), dan tanggal dibuat (terbaru/terlama).
- **Status Publikasi**: Membaca `LocalPublicationRecord` dari Dexie (`db.publications`) untuk menampilkan lencana status (`Terpublikasi` / `Dicabut`) pada dokumen lokal terkait tanpa menduplikasi item di daftar dokumen.

### 2.2 Creator Navigation (`components/creator/creator-editor.tsx`)
- Menambahkan `flushSave()` sebelum navigasi keluar agar perubahan dalam jeda debounce 600ms tetap tersimpan ke IndexedDB.
- Menyinkronkan URL query (`?id=...`) saat dokumen baru dibuat di `/creator` agar refresh halaman tidak membuat dokumen ganda.
- Menambahkan footer ringkas di bagian bawah editor.

### 2.3 Student Experience Refinement (`app/student/[id]/client-view.tsx`, `app/pub/[publicationId]/published-client.tsx`)
- Mempertahankan renderer yang sudah ada dan Document Schema v1.0.0.
- Pada Published Student Mode, mengisolasi key progres lokal berdasarkan `publicationId` dan `version` (`pub:${publicationId}:v${version}`).
- Memastikan kontrol perpindahan **Guided View** dan **Document View** jelas, responsif, dan nyaman dibaca di mobile maupun desktop.

### 2.4 About, Navigation & Footer (`app/about/page.tsx`, `components/layout/footer.tsx`, `sidebar.tsx`, `mobile-nav.tsx`)
- Halaman `/about` menjelaskan produk, filosofi, prinsip, Creator Mode, Student Mode (Document & Guided View), Cloud Publishing, local-first, serta stack & lisensi MIT.
- Komponen `Footer` dengan varian `default` (di `AppShell` untuk Workspace, About, Student, Published) dan `compact` (di Creator Mode).
- Semua link di footer dan navigasi mengarah ke rute yang benar-benar ada (`/`, `/student`, `/about`).

---

## 3. Rencana Perubahan File

| File | Aksi | Tujuan |
|---|---|---|
| `lib/storage/jobsheet-repository.ts` | Edit | Tambah `getAllLocalPublications`, `getSetting`, `setSetting` |
| `components/layout/footer.tsx` | Baru | Komponen Footer konsisten (`default` & `compact`) |
| `components/layout/app-shell.tsx` | Edit | Integrasi `Footer` pada shell utama |
| `components/layout/sidebar.tsx` | Edit | Tambah menu navigasi `Tentang` (`/about`) |
| `components/layout/mobile-nav.tsx` | Edit | Tambah menu navigasi `Tentang` (`/about`) |
| `components/workspace/jobsheet-card.tsx` | Edit | Dukung badge status publikasi & format waktu diperbarui |
| `components/workspace/jobsheet-list-row.tsx` | Baru | Komponen baris List View untuk Workspace |
| `app/page.tsx` | Edit | Grid/List toggle, sorting, status publikasi, persistensi preferensi |
| `components/creator/creator-editor.tsx` | Edit | Flush autosave sebelum navigasi, sync URL ID baru, footer ringkas |
| `app/pub/[publicationId]/published-client.tsx` | Edit | Isolasi progres per `publicationId` & `version`, polish tampilan |
| `app/about/page.tsx` | Baru | Halaman About OpenJobsheet |
| `docs/PHASE-5-IMPLEMENTATION.md` | Baru | Dokumentasi hasil implementasi aktual |
