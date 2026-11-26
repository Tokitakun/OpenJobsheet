# OpenJobsheet
## Product Requirements Document (PRD) & Technical Product Specification

**Versi:** 0.1 — Initial Product Definition  
**Status:** Draft — Product Planning  
**Jenis:** Open-source Web Application  
**Fokus:** Practical Learning Documentation  
**Target utama:** Guru dan siswa SMK

---

# 1. Product Overview

## 1.1 Deskripsi Produk

OpenJobsheet adalah aplikasi web open-source untuk membuat, mengelola, membagikan, dan mengikuti panduan kegiatan praktik secara digital.

Aplikasi ini dirancang untuk membantu guru menyusun jobsheet tanpa harus membuat dokumen secara manual dari awal.

Berbeda dengan Learning Management System (LMS), OpenJobsheet tidak berfokus pada pengelolaan kelas, absensi, nilai, atau administrasi sekolah.

Fokus utamanya adalah dokumentasi dan pelaksanaan kegiatan praktik.

## 1.2 Product Vision

Menjadi platform open-source yang mempermudah siapa pun dalam membuat panduan praktik digital yang terstruktur, interaktif, mudah dibagikan, dan dapat digunakan secara offline.

## 1.3 Prinsip Produk

1. Simple to Create — membuat jobsheet harus mudah.
2. Easy to Follow — siswa dapat memahami instruksi tanpa kebingungan.
3. Offline Friendly — fitur utama tidak bergantung pada internet.
4. Portable by Design — dokumen tidak terkunci pada satu layanan.
5. Open Source — komunitas dapat menggunakan, mempelajari, dan mengembangkan aplikasi.
6. Practical First — seluruh fitur harus mendukung kegiatan praktik.

---

# 2. Problem Statement

Pembuatan jobsheet praktik masih sering dilakukan menggunakan aplikasi pengolah dokumen seperti Microsoft Word atau Google Docs.

Pendekatan tersebut memiliki beberapa keterbatasan:

- Guru perlu mengatur format dokumen secara manual.
- Struktur instruksi praktik sering tidak konsisten.
- Gambar, kode, dan instruksi terkadang sulit disusun secara sistematis.
- Dokumen panjang kurang nyaman digunakan melalui smartphone.
- Siswa kesulitan melacak tahapan praktik yang sudah dikerjakan.
- Perubahan materi mengharuskan guru memperbarui dan membagikan dokumen kembali.

OpenJobsheet hadir untuk mengatasi masalah tersebut melalui editor khusus dokumentasi praktik.

---

# 3. Target Users

## 3.1 Primary Users

**Guru / Instructor**

Kebutuhan:
- Membuat jobsheet.
- Menyusun langkah praktik.
- Menambahkan media pembelajaran.
- Membuat template.
- Membagikan panduan kepada siswa.
- Memperbarui materi.

**Siswa / Learner**

Kebutuhan:
- Membaca instruksi praktik.
- Mengikuti langkah pengerjaan.
- Melihat referensi gambar.
- Menyalin kode.
- Melacak progres praktik.
- Membuka jobsheet melalui perangkat desktop maupun mobile.

## 3.2 Secondary Users

- Mahasiswa.
- Instruktur pelatihan.
- Komunitas pendidikan.
- Pembuat tutorial teknis.
- Institusi pendidikan.

---

# 4. Core Product Experience

OpenJobsheet memiliki dua pengalaman utama.

## 4.1 Creator Mode

Creator Mode merupakan workspace untuk membuat dan mengedit jobsheet.

Fitur utama:

- Membuat dokumen baru.
- Menggunakan template.
- Mengedit informasi jobsheet.
- Menambahkan konten menggunakan block editor.
- Mengatur urutan langkah.
- Menambahkan gambar, video, dan kode.
- Mengatur checklist.
- Melihat preview.
- Menyimpan dokumen secara otomatis.

## 4.2 Student Mode

Student Mode merupakan tampilan untuk mengikuti jobsheet yang sudah dibuat.

Terdapat dua mode penyajian.

### A. Document View

Menampilkan seluruh jobsheet dalam satu halaman seperti dokumentasi teknis atau artikel.

Karakteristik:

- Seluruh bagian dapat dibaca dalam satu halaman.
- Terdapat daftar isi.
- Navigasi menuju setiap bagian.
- Gambar dan kode ditampilkan langsung.
- Checklist dapat digunakan.
- Layout responsif.

### B. Guided Step-by-Step

Menampilkan satu langkah praktik dalam satu waktu.

Karakteristik:

- Satu langkah menjadi fokus utama.
- Tombol Previous dan Next.
- Indikator progres.
- Checklist penyelesaian.
- Navigasi antar-langkah.
- Gambar dan kode tetap tersedia.
- Siswa dapat kembali ke langkah sebelumnya.

### C. Hybrid Navigation

Pengguna dapat berpindah antara Document View dan Guided Step-by-Step tanpa kehilangan progres.

Ketentuan:

- Kedua tampilan menggunakan sumber data jobsheet yang sama.
- Checklist tidak boleh hilang saat berpindah mode.
- Posisi atau langkah terakhir sebisa mungkin dipertahankan.
- Mode Guided tidak boleh mengubah isi dokumen.
- Progress tersimpan secara lokal.

---

# 5. Jobsheet Document Structure

Setiap jobsheet memiliki struktur dasar berikut.

| Section | Description |
|---|---|
| Metadata | Judul, deskripsi, kategori |
| Learning Objectives | Tujuan praktik |
| Preparation | Alat dan bahan |
| Safety Notes | Catatan keselamatan |
| Instructions | Langkah-langkah praktik |
| Evaluation | Pemeriksaan hasil |
| Reflection | Refleksi dan kesimpulan |

Bagian bersifat fleksibel. Pengguna dapat menambahkan, menghapus, atau mengubah urutannya.

## 5.1 Instruction Blocks

Editor menyediakan beberapa jenis blok:

| Block | Fungsi |
|---|---|
| Heading | Judul bagian |
| Paragraph | Instruksi dan penjelasan |
| Image | Screenshot dan ilustrasi |
| Video Embed | Video referensi |
| Code Block | Potongan kode |
| Checklist | Daftar pekerjaan |
| Callout | Informasi penting |
| Warning | Peringatan |
| Table | Data dan konfigurasi |
| Divider | Pemisah konten |

Blok harus memiliki tampilan yang konsisten pada Creator Mode dan Student Mode.

---

# 6. Functional Requirements

Prioritas:
- P0: Wajib untuk MVP.
- P1: Pengembangan setelah MVP.
- P2: Fitur lanjutan.

## 6.1 Document Management

| ID | Requirement | Priority |
|---|---|---|
| DOC-01 | Membuat jobsheet baru | P0 |
| DOC-02 | Mengedit jobsheet | P0 |
| DOC-03 | Menghapus jobsheet | P0 |
| DOC-04 | Menggandakan jobsheet | P1 |
| DOC-05 | Mengatur kategori | P0 |
| DOC-06 | Mencari jobsheet | P1 |
| DOC-07 | Menggunakan template | P0 |
| DOC-08 | Mengubah metadata | P0 |

## 6.2 Editor

| ID | Requirement | Priority |
|---|---|---|
| EDT-01 | Block-based editor | P0 |
| EDT-02 | Heading dan paragraph | P0 |
| EDT-03 | Image insertion | P0 |
| EDT-04 | Code block | P0 |
| EDT-05 | Checklist | P0 |
| EDT-06 | Warning dan callout | P0 |
| EDT-07 | Video embed | P1 |
| EDT-08 | Drag-and-drop block ordering | P1 |
| EDT-09 | Undo dan redo | P1 |
| EDT-10 | Preview Student Mode | P0 |

## 6.3 Student Mode

| ID | Requirement | Priority |
|---|---|---|
| STD-01 | Document View | P0 |
| STD-02 | Guided Step-by-Step | P0 |
| STD-03 | Hybrid mode switching | P0 |
| STD-04 | Checklist interaction | P0 |
| STD-05 | Progress indicator | P0 |
| STD-06 | Previous / Next navigation | P0 |
| STD-07 | Responsive layout | P0 |
| STD-08 | Remember local progress | P0 |

## 6.4 Import and Export

| ID | Requirement | Priority |
|---|---|---|
| EXP-01 | Export JSON | P0 |
| EXP-02 | Import JSON | P0 |
| EXP-03 | Export PDF | P0 |
| EXP-04 | Print-friendly layout | P0 |
| EXP-05 | Export standalone HTML | P1 |

## 6.5 Storage

| ID | Requirement | Priority |
|---|---|---|
| STR-01 | Local-first storage | P0 |
| STR-02 | Automatic saving | P0 |
| STR-03 | Recovery from unexpected reload | P0 |
| STR-04 | Cloud authentication | P1 |
| STR-05 | Cloud synchronization | P1 |
| STR-06 | Public sharing | P1 |
| STR-07 | Cloud backup | P1 |

---

# 7. Storage Architecture

OpenJobsheet menggunakan pendekatan Local-first.

## 7.1 Local Storage

IndexedDB menjadi penyimpanan utama pada MVP.

Data yang disimpan:

- Jobsheet documents.
- Document metadata.
- Image assets.
- Editing state.
- Student progress.
- Local preferences.

Autosave harus berjalan secara otomatis setelah perubahan dokumen.

Pengguna tidak perlu menekan tombol Save secara manual.

Catatan: penyimpanan browser tetap memiliki keterbatasan kapasitas dan dapat hilang ketika pengguna menghapus data situs. Sediakan fitur backup dan ekspor.

## 7.2 Cloud Storage

Cloud merupakan fitur opsional yang dikembangkan setelah MVP.

Fungsi:

- Account management.
- Sinkronisasi dokumen.
- Backup.
- Public publishing.
- Multi-device access.

Rekomendasi teknologi:
- Supabase Auth.
- Supabase PostgreSQL.
- Supabase Storage.
- Row Level Security.

## 7.3 Public Sharing

Jobsheet yang diterbitkan dapat diakses menggunakan URL publik.

Ketentuan:
- Pembaca tidak wajib memiliki akun.
- Dokumen publik bersifat read-only.
- Dokumen privat tidak boleh dapat diakses melalui URL publik.
- Pemilik dapat membatalkan publikasi.
- Perubahan dokumen privat tidak otomatis mengubah versi publik sebelum diterbitkan ulang.

---

# 8. Data Model

Dokumen menggunakan format JSON terstruktur.

Contoh konseptual:

```json
{
  "schemaVersion": 1,
  "id": "document-id",
  "title": "Praktikum Docker Dasar",
  "description": "Panduan praktik Docker untuk pemula",
  "category": "SIJA",
  "sections": [
    {
      "id": "section-1",
      "type": "introduction",
      "title": "Persiapan",
      "blocks": [
        {
          "id": "block-1",
          "type": "paragraph",
          "content": "Pastikan Docker telah terpasang."
        }
      ]
    },
    {
      "id": "section-2",
      "type": "instructions",
      "title": "Langkah Praktik",
      "steps": [
        {
          "id": "step-1",
          "title": "Memeriksa Docker",
          "blocks": [
            {
              "id": "block-2",
              "type": "code",
              "language": "bash",
              "content": "docker --version"
            },
            {
              "id": "block-3",
              "type": "checklist",
              "items": [
                {
                  "id": "item-1",
                  "text": "Docker berhasil dijalankan"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

Ketentuan teknis:
- Setiap dokumen memiliki schemaVersion.
- Setiap section, step, block, dan checklist memiliki ID unik.
- Urutan konten harus dipertahankan.
- File media direferensikan melalui asset ID.
- Import harus melakukan validasi struktur.
- Dokumen dengan versi schema yang tidak didukung tidak boleh merusak data lokal.

---

# 9. Technical Specification

## 9.1 Proposed Stack

| Layer | Technology |
|---|---|
| Framework | Next.js |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Editor | Tiptap |
| Icons | Lucide |
| Local Database | IndexedDB |
| Database Wrapper | Dexie.js |
| Cloud Backend | Supabase |
| Export PDF | Browser print / PDF |
| Deployment | Vercel |

Stack ini merupakan rekomendasi awal dan masih dapat disesuaikan.

## 9.2 Architecture Principles

1. Editor tidak bergantung pada koneksi internet.
2. Data utama disimpan secara lokal pada MVP.
3. Komponen editor dan renderer dipisahkan.
4. Student Mode membaca struktur dokumen yang sama dengan Creator Mode.
5. Penyimpanan lokal dan cloud menggunakan format dokumen yang konsisten.
6. Tidak ada dummy data atau fallback yang menyamar sebagai data pengguna.
7. Aplikasi harus tetap dapat dibangun dan dijalankan tanpa kredensial cloud.

## 9.3 Rendering Architecture

Creator Mode:
- Document Editor.
- Block Renderer.
- Media Manager.
- Autosave Manager.

Student Mode:
- Document Renderer.
- Guided Step Renderer.
- Progress Manager.
- Navigation Manager.

Document Renderer dan Guided Step Renderer harus membaca document schema yang sama.

---

# 10. User Experience Requirements

## 10.1 Design Direction

Arah desain:
- Modern.
- Minimal.
- Clean.
- Editorial.
- Professional.
- Mobile-friendly.

Hindari:
- Dashboard yang terlalu ramai.
- Gradient berlebihan.
- Animasi yang mengganggu.
- Terlalu banyak kartu.
- Elemen dekoratif yang tidak memiliki fungsi.

Gunakan Lucide Icons sebagai sistem ikon utama.

## 10.2 Responsive Design

Desktop:
- Sidebar untuk navigasi dokumen.
- Area editor yang luas.
- Toolbar kontekstual.

Tablet:
- Navigasi lebih ringkas.
- Editor tetap nyaman digunakan.

Mobile:
- Editor satu kolom.
- Toolbar yang mudah dijangkau.
- Navigasi langkah yang jelas.
- Tidak ada horizontal overflow.
- Student Mode menjadi prioritas pengalaman mobile.

## 10.3 Accessibility

- Kontras warna yang memadai.
- Navigasi keyboard.
- Label pada setiap kontrol.
- Alt text pada gambar.
- Heading hierarchy yang benar.
- Fokus interaksi yang terlihat.

---

# 11. Security and Privacy

Persyaratan:

- Data lokal tidak dikirim ke server tanpa tindakan pengguna atau konfigurasi sinkronisasi yang jelas.
- Tidak menyimpan kredensial rahasia di frontend.
- Cloud menggunakan Row Level Security.
- File upload memiliki validasi tipe dan ukuran.
- Public sharing tidak boleh membuka dokumen privat.
- Pengguna dapat menghapus dokumen lokal.
- Pengguna dapat mengekspor seluruh dokumen.
- Jangan memasukkan informasi pribadi siswa ke jobsheet publik tanpa alasan dan izin yang sesuai.

---

# 12. MVP Scope

MVP harus membuktikan bahwa OpenJobsheet dapat menyelesaikan satu pekerjaan utama: membuat jobsheet dan menggunakannya untuk kegiatan praktik.

## MVP Features

1. Dashboard sederhana.
2. Membuat jobsheet.
3. Block-based editor.
4. Informasi dan metadata.
5. Section dan step management.
6. Gambar dan kode.
7. Checklist.
8. Autosave IndexedDB.
9. Document View.
10. Guided Step-by-Step.
11. Hybrid switching.
12. Progress persistence.
13. Export PDF.
14. Import/export JSON.
15. Template awal.

## Excluded from MVP

- Real-time collaboration.
- Chat.
- Attendance.
- Grading system.
- Student management.
- AI content generation.
- Learning analytics.
- Payment.
- Multi-tenant school management.

---

# 13. Acceptance Criteria

MVP dianggap berhasil apabila:

1. Pengguna dapat membuat jobsheet tanpa login.
2. Pengguna dapat menambahkan, mengedit, dan menghapus blok.
3. Perubahan dokumen tersimpan otomatis.
4. Dokumen tetap tersedia setelah browser direfresh.
5. Pengguna dapat memasukkan gambar dan kode.
6. Student Mode dapat membaca dokumen yang dibuat.
7. Pengguna dapat berpindah antara Document View dan Guided View.
8. Checklist tetap konsisten ketika berpindah mode.
9. Progres praktik tetap tersedia setelah halaman direfresh.
10. PDF yang diekspor memiliki layout yang layak dibaca.
11. JSON yang diekspor dapat diimpor kembali.
12. Aplikasi dapat digunakan tanpa konfigurasi backend.
13. Tidak ada data dummy yang ditampilkan seolah-olah merupakan data pengguna.
14. Tampilan dapat digunakan pada desktop dan smartphone.

---

# 14. Development Roadmap

## Phase 0 — Foundation
- Menentukan desain sistem.
- Menentukan document schema.
- Menyiapkan repository.
- Menyiapkan design system.
- Menyiapkan struktur aplikasi.

## Phase 1 — Core Editor
- Document management.
- Block editor.
- Section management.
- Step management.
- Media insertion.
- Autosave.

## Phase 2 — Student Experience
- Document View.
- Guided View.
- Hybrid navigation.
- Checklist.
- Progress persistence.

## Phase 3 — Import and Export
- JSON export.
- JSON import.
- PDF export.
- Print stylesheet.

## Phase 4 — Cloud Integration
- Authentication.
- Cloud storage.
- Document synchronization.
- Public publishing.
- Shareable URLs.

## Phase 5 — Community
- Template gallery.
- Community contributions.
- Localization.
- Documentation.
- Self-hosting guide.

---

# 15. Risks and Considerations

| Risiko | Mitigasi |
|---|---|
| Data lokal terhapus | Backup dan export |
| Browser storage penuh | Batas ukuran media dan peringatan |
| Konflik sinkronisasi | Versioning dan conflict resolution |
| Dokumen tidak kompatibel | Schema versioning |
| PDF berantakan | Print-specific stylesheet dan pengujian |
| Video tidak tersedia offline | Jelaskan kebutuhan koneksi |
| Penyalahgunaan public sharing | Kontrol publikasi dan pembatalan akses |

---

# 16. Open-source Strategy

Rekomendasi:
- Repository publik di GitHub.
- Lisensi MIT, sebagai usulan awal.
- README lengkap.
- CONTRIBUTING.md.
- CODE_OF_CONDUCT.md.
- SECURITY.md.
- Dokumentasi document schema.
- Issue templates.
- Pull request template.

Kontribusi komunitas dapat mencakup:
- Template jobsheet.
- Perbaikan editor.
- Terjemahan.
- Dokumentasi.
- Perbaikan aksesibilitas.
- Pengembangan fitur.

---

# 17. Product Success Metrics

Indikator keberhasilan produk:

- Pengguna berhasil membuat jobsheet pertama.
- Dokumen berhasil disimpan dan dipulihkan.
- Siswa dapat menyelesaikan panduan praktik.
- Perpindahan mode tidak menghilangkan progres.
- Dokumen berhasil diekspor dan diimpor.
- Pengguna dapat menggunakan aplikasi tanpa akun.
- Komunitas mulai membuat template dan kontribusi.

Metrik ini menjadi acuan evaluasi, bukan target angka yang harus dipaksakan pada MVP.

---

# 18. Final Product Definition

OpenJobsheet bukan LMS, bukan aplikasi manajemen sekolah, dan bukan sekadar text editor.

OpenJobsheet adalah:

**An open-source platform for creating and following structured practical learning guides.**

Nilai utamanya adalah menyederhanakan proses pembuatan jobsheet dan memberikan pengalaman praktik yang lebih terstruktur kepada siswa.

Prinsip pengembangan:

**Build the editor first. Make learning experience excellent. Add the cloud later.**

---

**Document Status:** Draft v0.1  
**Next Step:** Technical Architecture Specification and MVP Development Planning.
