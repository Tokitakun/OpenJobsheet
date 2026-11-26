export interface JobsheetPreviewFixture {
  id: string;
  code: string;
  title: string;
  description: string;
  category: "TKJ" | "RPL" | "TAV" | "SIJA";
  targetAudience: string;
  estimatedDurationMinutes: number;
  stepCount: number;
  author: string;
  updatedAt: string;
}

/**
 * Preview Fixtures for Phase 1 UI Verification
 * NOTE: These are strictly local demonstration fixtures to validate visual hierarchy,
 * responsiveness, and card states. They are kept separate from production persistence.
 */
export const PREVIEW_FIXTURES: JobsheetPreviewFixture[] = [
  {
    id: "utp-crimping-t568b",
    code: "TKJ-NET-01",
    title: "Crimping dan Pengujian Kabel UTP Cat5e Standar T568B",
    description:
      "Prosedur terminasi kabel UTP dengan konektor RJ-45 sesuai standar ANSI/TIA-568-B dan verifikasi kontinuitas menggunakan LAN tester.",
    category: "TKJ",
    targetAudience: "SMK Kelas X - Teknik Komputer & Jaringan",
    estimatedDurationMinutes: 60,
    stepCount: 4,
    author: "Budi Hartono, S.T.",
    updatedAt: "24 Nov 2026",
  },
  {
    id: "docker-container-dasar",
    code: "SIJA-SYS-03",
    title: "Deploy Container Nginx dan Konfigurasi Port Mapping",
    description:
      "Praktik orkestrasi container mandiri, penyesuaian volume lokal, isolasi jaringan bridge, dan pengujian akses HTTP curl.",
    category: "SIJA",
    targetAudience: "SMK Kelas XI - Sistem Informatika, Jaringan & Aplikasi",
    estimatedDurationMinutes: 45,
    stepCount: 5,
    author: "Siti Rahmawati, S.Kom.",
    updatedAt: "23 Nov 2026",
  },
  {
    id: "esp32-gpio-led-pwm",
    code: "TAV-IOT-02",
    title: "Pengendalian Kecerahan LED Menggunakan PWM pada ESP32",
    description:
      "Perakitan sirkuit breadboard dengan resistor pembatas arus, pengkabelan pin GPIO, dan penulisan sketsa kontrol duty cycle PWM.",
    category: "TAV",
    targetAudience: "SMK Kelas XI - Teknik Audio Video / Elektronika",
    estimatedDurationMinutes: 50,
    stepCount: 4,
    author: "Ahmad Fauzi, M.T.",
    updatedAt: "21 Nov 2026",
  },
  {
    id: "git-branching-workflow",
    code: "RPL-DEV-04",
    title: "Simulasi Kolaborasi Tim Git: Feature Branch dan Merge Conflict",
    description:
      "Praktik alur kerja Git industri: inisialisasi repositori, pembuatan branch fitur terisolasi, penyelesaian konflik merge, dan tagging rilis.",
    category: "RPL",
    targetAudience: "SMK Kelas XII - Rekayasa Perangkat Lunak",
    estimatedDurationMinutes: 75,
    stepCount: 6,
    author: "Dewi Lestari, S.Pd.",
    updatedAt: "19 Nov 2026",
  },
];
