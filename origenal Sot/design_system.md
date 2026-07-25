# Design System (DS) - Source of Truth #3

Document Version: v1.0

Project: Aplikasi Kasir Toko

Product: Web-Based Point of Sale (POS)

Status: Validated / Active

Last Updated: 2026-06-13

Author: System Analyst AI

---

## 1. DOCUMENT OVERVIEW

### 1.1 Purpose

Dokumen ini mendefinisikan bahasa visual, standar interaksi, dan komponen UI yang dapat digunakan kembali (reusable UI components) pada seluruh antarmuka Aplikasi Kasir Toko (Web-Based POS).

Sebagai Source of Truth #3 (SoT-3), dokumen ini diturunkan langsung dari SoT-1 (SRS v0.2) dan SoT-2 (IA v1.0), serta akan digunakan sebagai landasan mutlak untuk:

- Pembuatan High-Fidelity Prototype (SoT-5).
- Panduan penulisan kode komponen Frontend (React, HTML/CSS).
- Menjaga konsistensi pengalaman pengguna (UX) di seluruh layar aplikasi.
- Mempercepat waktu pelatihan kasir melalui pola interaksi yang konsisten dan intuitif.

### 1.2 Related Sources of Truth

| Artifact | Reference | Description |
| --- | --- | --- |
| SoT-1 | SRS v0.2 | Spesifikasi Kebutuhan Perangkat Lunak dasar. |
| SoT-2 | Information Architecture | Struktur navigasi, peta situs, dan pemetaan routing. |
| SoT-4 | User Flows | Rangkaian langkah interaksi pengguna per use-case. |
| SoT-5 | HiFi Prototype | Representasi visual interaktif akhir. |

---

## 2. DESIGN PRINCIPLES

### 2.1 Design Goals

- **High-Speed Execution (Efisiensi Tinggi):** Setiap interaksi kasir dirancang dengan jumlah klik seminimal mungkin untuk mempercepat transaksi di kasir fisik.
- **Visual Clarity (Kejelasan Informasi):** Elemen krusial seperti total tagihan, uang kembalian, dan indikator stok habis harus langsung terlihat dalam waktu kurang dari 1 detik.
- **Robust Accessibility (Aksesibilitas Andal):** Desain kontras yang tinggi untuk mengurangi kelelahan mata kasir yang bekerja dalam durasi shift panjang.

### 2.2 UX Principles

- **Fokus pada Tugas Tunggal (Single-Task Focus):** Meminimalkan distraksi visual pada layar POS Terminal. Panel kasir didedikasikan sepenuhnya untuk transaksi aktif.
- **Umpan Balik Instan (Instant Feedback):** Setiap penambahan item ke keranjang atau penyimpanan barang harus memicu perubahan status visual instan tanpa menunggu reload halaman penuh.
- **Aman dari Kesalahan (Error Tolerance):** Konfirmasi berlapis hanya diberikan pada aksi destruktif (seperti menghapus seluruh isi keranjang belanja atau menutup transaksi).

---

## 3. BRAND FOUNDATION

### 3.1 Brand Personality

- **Andal & Profesional:** Menggunakan struktur layout yang kokoh, stabil, dan bersih.
- **Modern & Efisien:** Bebas dari elemen dekoratif yang tidak perlu, mengutamakan fungsionalitas dan kecepatan akses.
- **Segar & Sehat:** Menggunakan aksen hijau emerald untuk merepresentasikan energi pertumbuhan keuangan, transaksi yang bersih, dan kemakmuran usaha ritel.

### 3.2 Visual Characteristics

- **Bentuk Sudut:** Membulat sedang (Rounded 8px atau rounded-lg) untuk memberikan kesan modern namun tetap rapi dan terstruktur.
- **Kedalaman Visual:** Menggunakan bayangan lembut (soft shadows) pada komponen mengambang seperti kartu produk, modal form, dan panel ringkasan keranjang belanja untuk menegaskan hierarki tumpukan halaman.

---

## 4. COLOR SYSTEM

Skema warna dirancang agar nyaman di mata untuk penggunaan jangka panjang di bawah pencahayaan lampu toko.

### 4.1 Primary Colors (Emerald Brand)

Digunakan untuk elemen tindakan utama, status aktif, dan identitas merek aplikasi.

| Token | Hex Value | Tailwind Class | Usage |
| --- | --- | --- | --- |
| color-primary | #059669 | bg-emerald-600 | Tombol aksi utama, teks aktif sidebar, ikon utama. |
| color-primary-hover | #047857 | hover:bg-emerald-700 | Sesi hover pada tombol utama. |
| color-primary-active | #065f46 | active:bg-emerald-800 | Sesi tekan/klik pada tombol utama. |
| color-primary-light | #D1FAE5 | bg-emerald-100 | Background badge status, sorotan ringan item aktif. |

### 4.2 Secondary Colors (Slate structure)

Digunakan untuk elemen navigasi sekunder, border, dan teks pendukung.

| Token | Hex Value | Tailwind Class | Usage |
| --- | --- | --- | --- |
| color-secondary | #475569 | bg-slate-600 | Tombol batal/sekunder, ikon non-aktif. |
| color-secondary-hover | #334155 | hover:bg-slate-700 | Sesi hover tombol sekunder. |
| color-secondary-active | #1e293b | active:bg-slate-800 | Sesi tekan tombol sekunder. |

### 4.3 Semantic Colors (Status & Alerts)

| Token | Hex Value | Tailwind Class | Usage |
| --- | --- | --- | --- |
| color-success | #10B981 | bg-emerald-500 | Notifikasi sukses, indikator stok aman (≥ 10). |
| color-warning | #F59E0B | bg-amber-500 | Indikator stok menipis (1 sampai 5). |
| color-error | #EF4444 | bg-red-500 | Indikator stok habis (0), pesan error form, tombol hapus. |
| color-info | #3B82F6 | bg-blue-500 | Panduan interaksi, status informasional. |

### 4.4 Neutral Colors (Backgrounds & Text)

| Token | Hex Value | Tailwind Class | Usage |
| --- | --- | --- | --- |
| color-bg-app | #F8FAFC | bg-slate-50 | Latar belakang aplikasi keseluruhan. |
| color-bg-card | #FFFFFF | bg-white | Latar belakang modul, tabel, panel keranjang, dan modal. |
| color-text-main | #0F172A | text-slate-900 | Teks judul utama, harga tebal, label form. |
| color-text-muted | #64748B | text-slate-500 | Teks deskripsi, kode produk, penanda waktu. |
| color-border | #E2E8F0 | border-slate-200 | Garis pembatas tabel, pembatas panel, border input. |

---

## 5. TYPOGRAPHY

Sistem menggunakan font Noto Sans untuk memastikan legibilitas angka nominal harga dan teks berukuran kecil tetap tinggi pada layar komputer kasir berkualitas standar.

| Text Style | Font Family | Weight | Size (px/rem) | Line Height | Usage |
| --- | --- | --- | --- | --- | --- |
| Display Title | Noto Sans | Bold (700) | 32px (2rem) | 1.25 | Judul besar halaman Login, Total Pembayaran POS. |
| Page Title | Noto Sans | Bold (700) | 24px (1.5rem) | 1.35 | Judul menu pada header halaman utama. |
| Section Title | Noto Sans | SemiBold (600) | 18px (1.125rem) | 1.4 | Judul panel keranjang, judul tabel data. |
| Body Large | Noto Sans | Regular (400) | 16px (1rem) | 1.5 | Label input form, teks nominal tabel. |
| Body Medium | Noto Sans | Regular (400) | 14px (0.875rem) | 1.5 | Deskripsi barang, teks menu sidebar. |
| Body Small/Muted | Noto Sans | Regular (400) | 12px (0.75rem) | 1.4 | Kode barang (ID), sub-info, teks cetak struk. |

---

## 6. ELEVATION & SHADOWS

Kedalaman visual digunakan untuk mengarahkan fokus mata Kasir ke elemen aktif di atas layar.

- **Shadow None (shadow-none):** Digunakan untuk seluruh elemen input teks dan tabel datar.
- **Shadow Small (shadow-sm):** Digunakan pada kartu katalog produk di menu transaksi.
- **Shadow Medium (shadow-md):** Digunakan untuk Sidebar, Topbar, dan panel Keranjang Belanja.
- **Shadow Large (shadow-lg):** Digunakan khusus untuk Modal Overlay (Form Tambah Barang Baru) dan Dialog Alert Konfirmasi.

---

## 7. GRID & LAYOUT

Aplikasi dioptimalkan untuk perangkat layar lanskap dengan resolusi minimal 1024px (Desktop PC / Layar Tablet iPad dalam orientasi landscape).

### 7.1 Desktop Grid (Width ≥ 1024px)

- **Layout Style:** Flexbox / Grid Split Layout.
- **Main Container:** Lebar penuh (100vw) tanpa margin luar berlebih untuk efisiensi ruang layar.
- **Sidebar Width:** Tetap di angka 260px (bisa diciutkan menjadi 80px lewat tombol kustom).
- **Content Padding:** 24px (p-6) di sekeliling area kerja konten.
- **Gutter Grid:** 16px (gap-4) antar elemen kartu produk di POS Terminal.

### 7.2 Tablet Grid (Width 768px to 1023px)

- **Layout Style:** Modul responsive satu kolom mengalir ke bawah atau sidebar disembunyikan (collapsible off-canvas).
- **Sidebar Behavior:** Disembunyikan secara otomatis. Dapat ditarik keluar menggunakan hamburger menu di pojok kiri atas.
- **Gutter Grid:** 12px (gap-3).

---

## 8. ICONOGRAPHY

Aplikasi menggunakan pustaka ikon Lucide React (atau inline SVG yang setara) dengan gaya ikon Outline yang konsisten (ketebalan stroke 2px).

| Icon Function | Lucide Icon Name | Visual Representation |
| --- | --- | --- |
| Menu Transaksi (POS) | ShoppingCart | Ikon Keranjang Belanja |
| Menu Kelola Stok | Package | Ikon Kotak Paket Inventaris |
| Laporan Harian | CalendarDays | Ikon Kalender Harian |
| Laporan Bulanan | TrendingUp | Ikon Grafik Naik Finansial |
| Akun Pengguna / Kasir | User | Ikon Siluet Orang |
| Keluar Aplikasi (Logout) | LogOut | Ikon Pintu Keluar dengan Panah |
| Tambah Item / Barang | Plus | Tanda Plus (+) |
| Kurang Item | Minus | Tanda Minus (-) |
| Hapus Item / Kosongkan | Trash2 | Ikon Tempat Sampah |
| Pencarian Barang | Search | Ikon Kaca Pembesar |

---

## 9. COMPONENT LIBRARY

### 9.1 Button

**Variants & Visual Tokens**

- **Primary Button:** Latar belakang bg-emerald-600, teks text-white, sudut rounded-lg (8px).
- **Secondary Button:** Latar belakang bg-slate-200, teks text-slate-800, sudut rounded-lg (8px).
- **Danger Button:** Latar belakang bg-red-600, teks text-white, sudut rounded-lg (8px).

**States Representation**

| Button State | Visual |
| --- | --- |
| [Default] | bg-emerald-600, text-white |
| [Hover] | bg-emerald-700 (Kursor berubah menjadi pointer) |
| [Active] | bg-emerald-800 (Transform skala tekan 98%) |
| [Disabled] | bg-slate-300, text-slate-500 (Kursor dilarang) |
| [Loading] | bg-emerald-600 dengan animasi spinner berputar di dalam teks |

### 9.2 Text Input

Komponen utama untuk formulir tambah barang baru dan kolom pencarian katalog.

- **Default State:** Border border-slate-300, latar belakang bg-white, teks text-slate-900, placeholder text-slate-400.
- **Focus State:** Border berubah menjadi border-emerald-500 dengan outline tipis berwarna emerald terang (ring-2 ring-emerald-200).
- **Validation - Success State:** Border berwarna border-emerald-500, dilengkapi ikon centang hijau kecil di sisi kanan input.
- **Validation - Error State:** Border berwarna border-red-500, disertai pesan teks error berwarna merah di bawah input (ukuran 12px).

### 9.3 Modal Dialog

Digunakan untuk menampilkan form input tambah barang baru tanpa memindahkan kasir dari halaman inventaris.

- **Overlay Backdrop:** Warna hitam transparan (bg-slate-900/50) dengan efek blur tipis (backdrop-blur-sm).
- **Card Container:** Berada tepat di tengah layar, latar belakang putih, lebar maksimal 500px (max-w-md), sudut membulat lebar rounded-xl (12px), shadow tebal (shadow-lg).
- **Header:** Berisi judul form (misal: "Tambah Produk Baru") dan tombol silang X di pojok kanan untuk menutup modal.
- **Footer:** Berisi tombol sejajar kanan: Tombol "Batal" (Secondary) dan Tombol "Simpan" (Primary).

### 9.4 Table Component

Digunakan untuk menampilkan daftar sisa stok pada Kelola Stok dan data mutasi pada Laporan.

- **Header Row (thead):** Latar belakang abu-abu terang bg-slate-100, teks abu-abu tua text-slate-700 dengan tulisan tebal (Sized 14px/Bold).
- **Body Rows (tbody):** Baris selang-seling abu-abu tipis untuk memudahkan pembacaan data horizontal (zebra striping): Baris ganjil bg-white, baris genap bg-slate-50/50.
- **Hover Row State:** Baris yang ditunjuk kursor berubah menjadi kuning/hijau tipis (hover:bg-emerald-50/30) untuk memperjelas baris yang sedang diteliti kasir.

### 9.5 Card Component

**Product Catalog Card (Terminal POS)**

- **Visual:** Border abu-abu tipis (border-slate-200), layout grid vertikal.
- **Top:** Placeholder gambar produk atau inisial nama barang berukuran besar dengan latar bg-slate-100.
- **Body:** Nama produk tebal (Sized 14px, text-slate-900), harga jual (Sized 16px Bold berwarna Emerald), sisa stok (Badge indikator stok).
- **Footer:** Tombol "Tambah ke Keranjang" lebar penuh dengan ikon Plus.

---

## 10. FORM DESIGN RULES

- **Labels:** Label harus selalu diletakkan di atas bidang input teks (top-aligned labels) untuk mempermudah pemindaian formulir secara vertikal oleh mata kasir.
- **Required Fields:** Ditandai dengan karakter bintang merah (*) langsung di samping teks label (misal: Nama Barang *).
- **Validation Messages:** Pesan error validasi harus informatif, tidak boleh hanya menuliskan kata "Input salah".
  - Benar: "Harga jual tidak boleh bernilai negatif atau kurang dari Rp 0."
  - Salah: "Nilai harga salah!"
- **Error Presentation:** Fokus kursor otomatis berpindah ke field pertama yang mengalami kegagalan validasi saat tombol "Simpan" ditekan oleh Kasir.

---

## 11. INTERACTION PATTERNS

### 11.1 Loading State

Setiap kali sistem melakukan komunikasi REST API ke backend (seperti menyimpan data produk baru atau memuat data laporan bulanan):

- Tombol aksi yang memicu proses tersebut akan menampilkan animasi spinner berputar di samping tulisan tombol, dan dinonaktifkan sementara (disabled) untuk menghindari terjadinya double submit.
- Sisa bagian halaman akan dipasangi overlay transparan tipis agar kasir tidak dapat menekan tombol lain sebelum transaksi selesai terekam.

### 11.2 Empty State

Jika kasir melakukan pencarian produk di terminal POS namun produk yang dicari tidak ada dalam katalog database:

- Tampilkan ilustrasi visual sederhana (seperti ikon kotak kosong atau kaca pembesar dengan tanda tanya) berukuran sedang di tengah area hasil pencarian.
- Sertakan teks informatif: "Produk tidak ditemukan. Pastikan ejaan nama barang sudah benar atau daftarkan produk baru di menu Kelola Stok."

### 11.3 Confirmation Pattern

Untuk transaksi bernilai besar atau tindakan yang berpotensi memengaruhi data keuangan:

- Ketika kasir menekan tombol "Bayar & Cetak Struk", sistem akan menampilkan dialog lembar rincian kembalian uang terlebih dahulu di layar. Kasir harus menekan tombol konfirmasi final atau menekan tombol Enter untuk menyelesaikan penguncian data.

### 11.4 Destructive Action Pattern

Ketika kasir bermaksud membatalkan seluruh item belanjaan yang sudah disusun di dalam keranjang belanja:

1. Kasir harus mengklik tombol "Kosongkan Keranjang" (berwarna merah).
2. Muncul modal konfirmasi: "Apakah Anda yakin ingin menghapus seluruh isi keranjang belanja saat ini?".
3. Pilihan tombol konfirmasi: "Ya, Kosongkan" (Latar merah) dan "Batal" (Latar abu-abu).

---

## 12. RESPONSIVE BEHAVIOR

Sistem ini didesain sepenuhnya responsif untuk menjamin kenyamanan akses operasional kasir baik menggunakan monitor komputer di meja kasir maupun menggunakan komputer tablet (seperti iPad / Android Tablet) saat kasir bergerak melayani pelanggan secara dinamis di area toko.

**[Viewport: Mobile (< 768px)]**

- Sidebar disembunyikan total (Hanya dapat diakses melalui drawer hamburger menu).
- Terminal POS berubah menjadi mode satu kolom (Katalog produk di atas, panel keranjang belanja mengapung di bagian bawah layar).

**[Viewport: Tablet (768px - 1023px)]**

- Sidebar terlipat menjadi bentuk ikon (lebar 80px) untuk memaksimalkan area konten kerja.
- Tabel stok menampilkan data esensial saja (Nama barang, sisa stok, dan harga).

**[Viewport: Desktop (>= 1024px)]**

- Sidebar terbuka lebar penuh secara permanen (lebar 260px).
- Terminal POS menggunakan split layout 2 kolom berdampingan secara proporsional.

---

## 13. ACCESSIBILITY (a11y)

- **Contrast Ratio:** Teks judul dan label form harus memenuhi standar WCAG 2.1 AA dengan rasio kontras minimal 4.5:1 terhadap warna latar belakang putih/terang untuk mempermudah pembacaan.
- **Keyboard Navigation (POS Core):** Kasir dapat menyelesaikan transaksi menggunakan tombol pintas keyboard (shortcut keys):
  - Tekan tombol F2 untuk memindahkan fokus langsung ke kolom Pencarian Produk.
  - Tekan tombol F9 untuk membuka lembar dialog pembayaran transaksi aktif.
  - Tekan tombol Enter (pada modal dialog pembayaran) untuk memicu fungsi cetak struk bawaan browser.

---

## 14. DESIGN TOKENS TABLE

| Token Name | Token Category | Token Value | Mapped CSS / Tailwind |
| --- | --- | --- | --- |
| token-font-main | Typography | Noto Sans, sans-serif | font-sans |
| token-color-primary | Color | #059669 | bg-emerald-600 |
| token-color-primary-hover | Color | #047857 | hover:bg-emerald-700 |
| token-color-danger | Color | #EF4444 | bg-red-500 |
| token-border-radius | Layout | 8px | rounded-lg |
| token-shadow-modal | Depth | 0px 10px 15px -3px rgba(0,0,0,0.1) | shadow-lg |

---

## 15. TRACEABILITY MATRIX (SRS v0.2 → DS v1.0)

Setiap elemen visual dan aturan komponen dalam sistem ini diturunkan untuk menjamin terpenuhinya spesifikasi fungsional dari dokumen dasar.

| Feature ID | Feature Name | Design System Target Components | Applied Design / Interaction Rules |
| --- | --- | --- | --- |
| F001 | Pencatatan Transaksi Penjualan | POS Split Screen Layout, Card Catalog, Button Counter (+/-), Red Trash Button. | Menggunakan skema warna Emerald untuk tombol pembayaran, modal popup dialog nominal uang kembalian, dan visual alert stok kosong. |
| F002 | Manajemen Stok (Tambah Barang) | Modal Input Form, Table Stock List, Semantic Stock Badge. | Modal overlay backdrop-blur, validasi real-time kolom input, tombol simpan dan batalkan, teks error berwarna merah. |
| F003 | Laporan Pendapatan & Stok Harian | KPI Card Highlight, Filter Bar, Row Striping Table. | Rasio kontras tinggi, visual warna merah cerah untuk barang-barang toko yang stoknya habis. |
| F004 | Laporan Pendapatan & Stok Bulanan | Chart Container, Dropdown Select. | Pola interaksi loading state spinner saat proses penarikan data transaksi bulanan yang besar. |
