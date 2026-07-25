# Information Architecture (IA) - Source of Truth #2

Document Version: v1.0

Project: Aplikasi Kasir Toko

Product: Web-Based Point of Sale (POS)

Status: Validated / Active

Last Updated: 2026-06-13

Author: System Analyst AI

---

## 1. DOCUMENT OVERVIEW

### 1.1 Purpose

Dokumen ini mendefinisikan Arsitektur Informasi (IA) dari Aplikasi Kasir Toko (Web-Based POS). IA ini berfungsi sebagai Source of Truth #2 (SoT-2) yang diturunkan secara langsung dari SoT-1 (SRS v0.2).

Dokumen ini digunakan sebagai landasan mutlak untuk:

- Merancang High-Fidelity Prototype (SoT-5).
- Menentukan struktur halaman pada implementasi Frontend.
- Membangun navigasi antarmuka yang konsisten dan responsif.
- Menentukan struktur routing pada aplikasi web (URL mapping).
- Memetakan relasi antar-layar dan aliran informasi yang efisien untuk Kasir.

### 1.2 Related Sources of Truth

| Artifact | Reference | Description |
| --- | --- | --- |
| SoT-1 | SRS v0.2 | Spesifikasi Kebutuhan Perangkat Lunak dasar. |
| SoT-3 | Design System | Panduan token visual, warna, tipografi, dan komponen UI. |
| SoT-4 | User Flows | Detail langkah operasional per use-case. |
| SoT-5 | HiFi Prototype | Representasi visual interaktif akhir. |

---

## 2. PRODUCT STRUCTURE

### 2.1 Product Modules

| Module ID | Module Name | Description |
| --- | --- | --- |
| M001 | Authentication | Mengatur keamanan akses masuk dan keluar sistem untuk aktor Kasir. |
| M002 | Transaksi Penjualan (POS Core) | Terminal utama kasir untuk menyusun keranjang belanja, kalkulasi otomatis, dan cetak struk belanja. |
| M003 | Kelola Stok & Katalog | Modul manajemen barang untuk melihat persediaan dan mendaftarkan barang baru. |
| M004 | Laporan Pendapatan & Stok | Modul pelaporan performa bisnis yang mencakup visualisasi data harian dan bulanan. |

### 2.2 Module Hierarchy

```text
Aplikasi Kasir POS (Root)
├── M001: Authentication
│   └── Halaman Login
├── M002: Transaksi Penjualan (Default Landing Page)
│   ├── Daftar Produk Aktif (Katalog Transaksi)
│   ├── Keranjang Belanja (Cart)
│   └── Dialog Cetak Struk (Browser Native)
├── M003: Kelola Stok & Katalog
│   ├── Tabel Inventaris Barang
│   └── Form Tambah Barang Baru (Modal Overlay)
└── M004: Laporan Pendapatan & Stok
    ├── Laporan Pendapatan & Stok Harian
    └── Laporan Pendapatan & Stok Bulanan
```

---

## 3. SITE MAP

### 3.1 Navigation Tree

- **PAGE-001:** Login (Tanpa Sidebar - Akses Publik / Unauthenticated)
- **PAGE-002:** POS Terminal / Transaksi (Halaman Utama setelah Login)
- **PAGE-003:** Kelola Stok
- **PAGE-003-SUB-01:** Form Tambah Barang Baru (Modal Triggered)
- **PAGE-004:** Laporan Harian
- **PAGE-005:** Laporan Bulanan

### 3.2 Navigation Type

| Navigation | Type | Behavior |
| --- | --- | --- |
| Main Menu | Sidebar Navigation | Berada permanen di sisi kiri layar pada resolusi Desktop/Tablet. Dapat diciutkan (collapsible) untuk memaksimalkan area kerja Kasir. |
| User Menu | Top-Right Dropdown | Berisi informasi akun Kasir aktif dan tombol "Keluar" (Logout). |
| Mobile/Tablet Navigation | Top Hamburger Menu | Sidebar akan disembunyikan dan diakses via tombol hamburger jika lebar layar menyusut di bawah 768px (Responsiveness rule). |
| Breadcrumb | Disabled | Tidak diaktifkan karena struktur menu sangat dangkal (maksimal 1 tingkat sub-halaman) guna efisiensi fokus layar. |

---

## 4. PAGE INVENTORY

| Page ID | Page Name | Module | Access Role | URL Path |
| --- | --- | --- | --- | --- |
| PAGE-001 | Login | M001 | Tamu / Guest | /login |
| PAGE-002 | POS Terminal (Transaksi) | M002 | Kasir (Authenticated) | /transaksi |
| PAGE-003 | Kelola Stok & Katalog | M003 | Kasir (Authenticated) | /stok |
| PAGE-004 | Laporan Harian | M004 | Kasir (Authenticated) | /laporan/harian |
| PAGE-005 | Laporan Bulanan | M004 | Kasir (Authenticated) | /laporan/bulanan |

---

## 5. PAGE DEFINITIONS

### Page ID: PAGE-001

**Page Name:** Login

**Purpose:** Memverifikasi identitas Kasir untuk mencegah akses tidak sah ke database toko.

**Entry Points:**

- Mengakses URL utama aplikasi / pertama kali tanpa sesi login aktif.
- Mengakses URL /login secara langsung.

**Exit Points:**

- Berhasil login -> diarahkan otomatis ke /transaksi (PAGE-002).

**Related User Flows:** UC-001: User Login

**Child Pages:** None.

**Required Permissions:** Publik / Tanpa Autentikasi.

**Notes:** Layar minimalis tanpa sidebar menu. Menampilkan form input username, password, dan tombol masuk.

---

### Page ID: PAGE-002

**Page Name:** POS Terminal (Transaksi)

**Purpose:** Menyediakan antarmuka utama kasir untuk melayani transaksi pembelian produk dengan cepat.

**Entry Points:**

- Setelah sukses login dari PAGE-001.
- Klik menu "Transaksi" pada Sidebar.

**Exit Points:**

- Klik menu lain di Sidebar.
- Klik "Keluar" di User Menu -> diarahkan ke /login (PAGE-001).

**Related User Flows:** UC-002: Pencatatan Transaksi & Cetak Struk

**Child Pages:** None (Dialog cetak struk menggunakan jendela cetak bawaan browser).

**Required Permissions:** Kasir (ALLOWED).

**Notes:** Layar terbagi menjadi dua panel utama: Panel Kiri (Daftar Produk & Pencarian) dan Panel Kanan (Keranjang Belanja, Ringkasan Pembayaran, & Tombol Aksi).

---

### Page ID: PAGE-003

**Page Name:** Kelola Stok & Katalog

**Purpose:** Menampilkan tabel stok produk terkini dan memberikan akses untuk mendaftarkan barang baru ke database katalog.

**Entry Points:**

- Klik menu "Kelola Stok" pada Sidebar.

**Exit Points:**

- Klik menu lain di Sidebar.

**Related User Flows:** UC-003: Manajemen Stok (Tambah Barang Baru)

**Child Pages:**

- PAGE-003-SUB-01: Form Tambah Barang Baru (Ditampilkan dalam bentuk Modal Dialog di atas halaman utama).

**Required Permissions:** Kasir (ALLOWED).

**Notes:** Menampilkan tabel pencarian barang interaktif lengkap dengan kolom ID, Nama, Harga Jual, Stok, dan indikator visual status stok (misal: warna merah jika stok ≤ 5).

---

### Page ID: PAGE-004

**Page Name:** Laporan Harian

**Purpose:** Menampilkan rekap pendapatan kotor toko dan rangkuman stok barang secara harian pada tanggal berjalan.

**Entry Points:**

- Klik menu "Laporan Harian" pada Sidebar.

**Exit Points:**

- Klik menu lain di Sidebar.

**Related User Flows:** UC-004: Pemantauan Laporan Harian

**Child Pages:** None.

**Required Permissions:** Kasir (ALLOWED).

**Notes:** Menampilkan KPI Card besar berisi "Total Omzet Hari Ini" dan tabel daftar sisa persediaan produk yang diurutkan dari stok terkecil.

---

### Page ID: PAGE-005

**Page Name:** Laporan Bulanan

**Purpose:** Menyajikan grafik dan angka kumulatif pendapatan toko bulanan serta status stok pada penutupan bulan untuk dianalisis oleh sponsor bisnis.

**Entry Points:**

- Klik menu "Laporan Bulanan" pada Sidebar.

**Exit Points:**

- Klik menu lain di Sidebar.

**Related User Flows:** UC-005: Pemantauan Laporan Bulanan

**Child Pages:** None.

**Required Permissions:** Kasir (ALLOWED).

**Notes:** Dilengkapi dengan dropdown filter "Pilih Bulan" dan "Pilih Tahun" untuk memuat arsip keuangan masa lampau.

---

## 6. USER NAVIGATION FLOWS

### Flow NF-001: Alur Utama Transaksi Penjualan

**Entry Page:** PAGE-002 (POS Terminal)

**Navigation Path:**

1. PAGE-002 (Cari & Pilih Produk)
2. PAGE-002 (Kustomisasi Kuantitas di Keranjang)
3. PAGE-002 (Tekan Tombol Bayar & Masukkan Nominal Uang)
4. Browser Native Print Dialog (Konfirmasi Cetak Struk)
5. PAGE-002 (Keranjang Reset Otomatis, Stok Berkurang)

**Exit Page:** PAGE-002 (Siap untuk transaksi berikutnya)

**Related User Flows:** UC-002

---

### Flow NF-002: Alur Penambahan Barang Baru

**Entry Page:** PAGE-002 (POS Terminal)

**Navigation Path:**

1. PAGE-002 (POS Terminal)
2. Sidebar Navigation (Klik Kelola Stok)
3. PAGE-003 (Halaman Kelola Stok)
4. Klik Tombol "Tambah Barang"
5. PAGE-003-SUB-01 (Modal Form Muncul)
6. Isi Nama, Harga, Stok Awal
7. Klik "Simpan"
8. PAGE-003 (Tabel Terperbarui, Modal Tertutup)

**Exit Page:** PAGE-003 (Kelola Stok)

**Related User Flows:** UC-003

---

### Flow NF-003: Alur Pemantauan Laporan & Keluar Aplikasi

**Entry Page:** PAGE-002 (POS Terminal)

**Navigation Path:**

1. PAGE-002 (POS Terminal)
2. Sidebar Navigation (Klik Laporan Harian)
3. PAGE-004 (Membaca Data Pendapatan Hari Ini)
4. Sidebar Navigation (Klik Laporan Bulanan)
5. PAGE-005 (Melihat Grafik Akumulasi Bulanan)
6. Top-Right User Menu (Klik Dropdown)
7. Klik "Keluar"
8. PAGE-001 (Kembali ke Halaman Login)

**Exit Page:** PAGE-001 (Login)

**Related User Flows:** UC-004, UC-005, UC-001

---

## 7. CONTENT HIERARCHY

### 7.1 Module: Transaksi Penjualan (POS Core)

**Level 1 (Katalog & Cart Utama):**

- Panel Utama Terminal POS.

**Level 2 (Detail Item & Penghitungan):**

- Kartu Produk (Nama, Foto/Placeholder, Harga, Badge Sisa Stok).
- Keranjang Belanja Belanjaan Aktif (Daftar Item, Input Kuantitas, Tombol Hapus).

**Level 3 (Metrik Pembayaran & Aksi):**

- Subtotal Belanja.
- Nominal Pajak (jika ada) / Total Bersih Tagihan (Bold besar).
- Input Jumlah Bayar Pelanggan.
- Informasi Nilai Uang Kembalian (Kembalian = Bayar - Total).
- Tombol Utama: "Cetak & Selesaikan Transaksi".

---

### 7.2 Module: Kelola Stok & Katalog

**Level 1 (Halaman Master Inventaris):**

- Judul Halaman: "Manajemen Stok Barang".
- Tombol Utama: "Tambah Barang Baru".
- Kolom Pencarian Produk.

**Level 2 (Tabel Data Inventaris):**

- Tabel Produk (ID, Nama, Harga Jual, Stok Aktual).
- Status Badge Stok (Hijau: Aman, Kuning: Menipis, Merah: Habis).

**Level 3 (Modal Form Tambah Barang):**

- Field Input Nama Barang (Alfanumerik).
- Field Input Harga Jual (Numeric, format Rupiah).
- Field Input Jumlah Stok Awal (Integer ≥ 0).
- Tombol "Batalkan" dan "Simpan Data".

---

### 7.3 Module: Laporan Pendapatan & Stok

**Level 1 (Akumulasi Utama):**

- Periode Laporan (Tanggal Hari Ini atau Dropdown Bulan/Tahun).
- Ringkasan Total Uang Masuk (Omzet Kotor) dalam Card Sorotan Utama.

**Level 2 (Status Inventaris Terkait):**

- Grafik Garis/Batang Tren Pendapatan harian/bulanan.
- Rekapitulasi Sisa Stok Akhir Seluruh Produk pada periode tersebut.

**Level 3 (Indikator Stok Menipis/Habis):**

- Alert Panel merah yang mendaftar produk-produk yang perlu segera direstok (restock alert list).

---

## 8. ROUTING CONVENTIONS

Sistem menggunakan Client-Side Routing yang bersih dan ramah pengguna (human-readable URLs).

| Page ID | Route | Access Type | Fallback/Redirect Rules |
| --- | --- | --- | --- |
| PAGE-001 | /login | Public / Guest | Jika kasir sudah login, mengakses /login akan me-redirect otomatis ke /transaksi. |
| PAGE-002 | /transaksi | Authenticated | Jika sesi habis atau tidak valid, redirect otomatis ke /login. |
| PAGE-003 | /stok | Authenticated | Jika sesi habis atau tidak valid, redirect otomatis ke /login. |
| PAGE-004 | /laporan/harian | Authenticated | Jika sesi habis atau tidak valid, redirect otomatis ke /login. |
| PAGE-005 | /laporan/bulanan | Authenticated | Jika sesi habis atau tidak valid, redirect otomatis ke /login. |
| - | /redirector | - | Jika ada sesi aktif -> /transaksi, jika tidak ada -> /login. |
| - | * (Any other) | 404 Page | Menampilkan pesan "Halaman Tidak Ditemukan" dan menyediakan tombol kembali ke /transaksi. |

---

## 9. TRACEABILITY MATRIX (SRS v0.2 → IA v1.0)

Untuk menjamin kepatuhan Chain of Truth, setiap komponen arsitektur informasi dipetakan kembali ke ID Fitur dari spesifikasi kebutuhan sistem.

| Feature ID | Feature Name | Mapped Page ID | Mapped Navigation / Route |
| --- | --- | --- | --- |
| F001 | Pencatatan Transaksi Penjualan | PAGE-002 | /transaksi |
| F002 | Manajemen Stok (Tambah Barang Baru) | PAGE-003, PAGE-003-SUB-01 | /stok |
| F003 | Laporan Pendapatan & Stok Harian | PAGE-004 | /laporan/harian |
| F004 | Laporan Pendapatan & Stok Bulanan | PAGE-005 | /laporan/bulanan |
