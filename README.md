# OpenJobsheet

**Platform Dokumentasi Pembelajaran Praktik Open-Source (Local-First)**

> *Create easily. Learn step by step. Own your data.*

OpenJobsheet adalah aplikasi web open-source untuk membuat, mengelola, membagikan, dan mengikuti panduan kegiatan praktik (*jobsheet*) secara digital. Dirancang khusus untuk pendidikan vokasi (SMK), politeknik, laboratorium teknik, serta pengajar independen.

Berbeda dengan *Learning Management System* (LMS) yang berfokus pada absensi, penilaian, atau administrasi kelas, OpenJobsheet berfokus sepenuhnya pada **kualitas dokumentasi dan pelaksanaan kegiatan praktik**.

---

## Latar Belakang

Di banyak sekolah kejuruan dan laboratorium praktik, penyusunan *jobsheet* masih menghadapi beberapa kendala utama:

1. **Pembuatan dokumen manual yang memakan waktu** — Guru harus menata ulang format, penomoran langkah, tabel alat/bahan, dan gambar di pengolah kata konvensional setiap kali membuat modul baru.
2. **Kurang nyaman dibaca saat praktik berlangsung** — Dokumen statis atau PDF panjang sulit diikuti siswa melalui smartphone maupun tablet di meja bengkel atau laboratorium.
3. **Ketergantungan pada akun dan koneksi internet** — Banyak alat bantu pengajaran mengharuskan siswa login atau selalu terhubung ke cloud, padahal lingkungan praktik sering memiliki keterbatasan jaringan.
4. **Data terkunci di platform pihak ketiga** — Materi ajar milik guru sulit dipindahkan secara utuh (teks beserta gambarnya) antarperangkat tanpa layanan cloud tertentu.

OpenJobsheet hadir untuk menjawab masalah tersebut dengan pendekatan **local-first**: dokumen asli dan media tersimpan langsung di perangkat pengguna, namun tetap mudah dibagikan melalui file portabel `.jobsheet`, ekspor PDF, maupun tautan publik (*share link*).

---

## Prinsip Produk

- **Simple to Create** — Menyusun jobsheet terstruktur berdasarkan bagian, langkah kerja, dan blok konten tanpa repot memformat tata letak dari awal.
- **Easy to Follow** — Siswa dapat membaca keseluruhan dokumen (*Document View*) atau fokus satu langkah dalam satu waktu (*Guided View*).
- **Local-First & Offline Friendly** — Dokumen, aset gambar lokal, dan progres pengerjaan siswa tersimpan di IndexedDB perangkat masing-masing tanpa wajib akun.
- **Portable by Design** — Jobsheet dapat diekspor ke `.pdf` untuk dicetak atau dikemas menjadi satu file `.jobsheet` (berisi data & gambar) untuk dipindahkan ke perangkat lain.

---

## Fitur Utama

### 1. Workspace & Manajemen Dokumen
- **List View & Grid View** dengan preferensi tampilan yang tersimpan secara lokal di peramban.
- **Pencarian & Pengurutan** berdasarkan judul, kode, kategori, tanggal dibuat, dan waktu terakhir diperbarui.
- **Status Publikasi** langsung terlihat pada daftar dokumen lokal tanpa menduplikasi data.
- **Contoh Template (*Preview Fixtures*)** yang dapat dipratinjau dan disalin ke database lokal pengguna.

### 2. Creator Mode
- **Tata Letak 3 Panel**:
  - **Document Outline** (panel kiri) untuk navigasi cepat antar bagian dan langkah.
  - **Document Canvas** (tengah) untuk penyusunan judul, deskripsi, bagian, langkah kerja bernomor, dan blok konten.
  - **Contextual Inspector** (panel kanan) untuk pengaturan metadata dokumen dan preferensi tampilan siswa.
- **Blok Konten Terstruktur** (`Document Schema v1.0.0`): Paragraf, Sub-Judul, Callout (Info, Tip, Peringatan K3, Bahaya), Checklist Verifikasi, Blok Kode, dan Gambar (diunggah dan disimpan sebagai `Blob` di IndexedDB).
- **Autosave & Safe Navigation**: Penyimpanan otomatis ke IndexedDB dan *flush* otomatis sebelum berpindah halaman agar perubahan tidak hilang.

### 3. Student Mode (Hybrid Experience)
- **Document View**: Tampilan lembar kerja lengkap dari tujuan praktikum hingga evaluasi, nyaman dibaca secara menyeluruh.
- **Guided View**: Tampilan fokus per langkah kerja dengan tombol navigasi besar, indikator progres, dan checklist interaktif.
- **Progres Lokal Mandiri**: Progres langkah dan checklist tersimpan di IndexedDB perangkat siswa tanpa memerlukan login atau akun.

### 4. PDF Preview & Export (Client-Side)
- Pratinjau halaman A4 portrait langsung di browser dengan kontrol zoom dan navigasi halaman.
- Ekspor dan unduh file `.pdf` secara lokal (*client-side* menggunakan `jsPDF`) lengkap dengan teks terstruktur dan gambar lokal dari IndexedDB.

### 5. Cloud Publishing & Share Access
- Guru dapat menerbitkan salinan snapshot dokumen beserta gambarnya untuk dibagikan melalui tautan publik (`/pub/[publicationId]?token=...`).
- Siswa dapat membuka tautan langsung di browser tanpa akun atau login.
- Guru dapat memperbarui publikasi ke versi terbaru dengan URL yang sama, mencabut akses (*revoke*), atau menghapus publikasi tanpa memengaruhi dokumen lokal asli.

### 6. Data Portability (`.jobsheet`)
- **Ekspor Jobsheet**: Mengemas dokumen JSON dan seluruh gambar terkait menjadi satu file arsip `.jobsheet` (format ZIP).
- **Impor Jobsheet**: Memvalidasi struktur, versi skema, dan kelengkapan gambar dengan pratinjau sebelum menyimpan ke IndexedDB.
- **Perlindungan Anti-Timpa**: Jika ID dokumen yang diimpor sudah ada, sistem otomatis membuat salinan baru dengan ID baru tanpa menimpa dokumen lama.

---

## Teknologi yang Digunakan

- **Framework**: Next.js 16 (App Router) & React 19
- **Bahasa**: TypeScript
- **Styling & Ikon**: Tailwind CSS v4 & Lucide React
- **Penyimpanan Lokal**: Dexie.js & IndexedDB
- **PDF & Arsip Portabel**: `jsPDF` & `JSZip`
- **Backend Publishing**: Next.js API Routes + SQLite (`better-sqlite3`) & penyimpanan media lokal (`data/`)

---

## Struktur Direktori Utama

```text
sheet/
├── app/
│   ├── page.tsx                         # Workspace (halaman utama)
│   ├── about/page.tsx                   # Halaman Tentang OpenJobsheet
│   ├── creator/
│   │   ├── page.tsx                     # Creator Mode (editor)
│   │   └── preview/page.tsx             # PDF Preview & Export
│   ├── student/
│   │   ├── page.tsx                     # Daftar modul Student Mode
│   │   └── [id]/                        # Student Mode lokal (Document & Guided View)
│   ├── pub/[publicationId]/             # Student Mode untuk jobsheet terpublikasi
│   └── api/publish/                     # API Routes untuk Cloud Publishing
├── components/
│   ├── creator/                         # Komponen editor, block editor, publish panel, PDF preview
│   ├── layout/                          # AppShell, Sidebar, MobileNav, Footer, ThemeToggle
│   ├── shared/                          # Renderer gambar lokal & terpublikasi
│   ├── ui/                              # Komponen dasar (Button, Card, Input, Badge)
│   └── workspace/                       # Kartu/baris dokumen, dialog impor, template fixtures
├── lib/
│   ├── schema/document.ts               # Canonical Document Schema v1.0.0 & validator
│   ├── storage/                         # Dexie database & repository
│   ├── publishing/                      # Service client & server publishing (SQLite + token)
│   ├── pdf/                             # Mesin layout A4 & ekspor PDF
│   └── portability/                     # Paket ekspor & impor .jobsheet
└── docs/                                # Dokumentasi produk, arsitektur, dan rencana fase
```

---

## Menjalankan Proyek Secara Lokal

### Prasyarat
- **Node.js** 20+
- **pnpm**

### Instalasi & Menjalankan Server Pengembangan

```bash
pnpm install
pnpm dev
```

Buka `http://localhost:3000` di peramban Anda.

### Pemeriksaan & Production Build

```bash
pnpm exec tsc --noEmit
pnpm run lint
pnpm exec next build --webpack
pnpm start
```

> **Catatan Windows:** Jika terjadi error native build pada `better-sqlite3` saat instalasi pertama, jalankan `pnpm approve-builds better-sqlite3` lalu `pnpm rebuild better-sqlite3`. Untuk build produksi di Windows, gunakan flag `--webpack`.

---

## Indeks Dokumentasi

- [PRD (Product Requirements)](docs/PRD.md)
- [Design System](docs/DESIGN_SYSTEM.md)
- [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md)
- [Document Schema](docs/DOCUMENT_SCHEMA.md)
- [User Flows](docs/USER_FLOWS.md)
- [MVP Roadmap](docs/MVP_ROADMAP.md)
- [Contributing](docs/CONTRIBUTING.md)
- [Decisions (ADR)](docs/DECISIONS.md)

---

## Lisensi

Proyek ini dirilis di bawah lisensi **MIT**. Lihat berkas [LICENSE](LICENSE) untuk informasi lengkap.
