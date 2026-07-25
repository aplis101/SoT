# Software Requirements Specification (SRS)

Document Version: v0.2

Project: Aplikasi Kasir Toko

Product: Web-Based Point of Sale (POS)

Status: Draft

Last Updated: 2026-06-13

Author: System Analyst AI

# 1. INTRODUCTION

## 1.1 Purpose

Dokumen ini mendefinisikan spesifikasi kebutuhan fungsional dan non-fungsional untuk sistem Aplikasi Kasir Berbasis Web. Dokumen ini berfungsi sebagai *source of truth* tunggal (SoT-1) yang melandasi pembuatan artefak pengembangan berikutnya seperti User Flows, Arsitektur, Model Data, dan API Contracts.

## 1.2 Scope

### Business Goals

* Digitalisasi pencatatan transaksi penjualan untuk menghindari kesalahan manual.
* Mempermudah pengelolaan katalog dan pemantauan stok barang secara real-time.
* Menyediakan laporan pendapatan yang akurat untuk mendukung pengambilan keputusan bisnis.

### In Scope

* Pencatatan transaksi penjualan produk (pilih produk, tambah/kurang kuantitas item).
* **Manajemen Stok & Katalog (Menambahkan barang/produk baru langsung ke dalam sistem).**
* Sinkronisasi kuantitas stok otomatis pasca-transaksi penjualan.
* Pembuatan laporan keuangan harian dan bulanan (total uang masuk dan sisa stok).
* Pencetakan struk belanja memanfaatkan fitur dialog print bawaan browser.

### Out of Scope

* Manajemen multi-cabang (gudang terpusat/terpisah).
* Integrasi dengan *payment gateway* pihak ketiga (kartu kredit/e-wallet otomatis).
* Fitur manajemen promosi/diskon kompleks, sistem *membership*, dan manajemen retur barang.

## 1.3 Stakeholders

| Stakeholder | Role | Responsibility |
| --- | --- | --- |
| Pemilik Toko / Klien | Project Sponsor | Memberikan arahan kebutuhan bisnis dan menyetujui hasil akhir sistem. |
| Kasir | End User | Mengoperasikan aplikasi untuk transaksi harian, mengelola stok, dan melihat laporan. |
| System Analyst | Author | Menyusun dan memperbarui dokumentasi *Source of Truth* (SoT). |

## 1.4 Definitions

| Term | Definition |
| --- | --- |
| POS | *Point of Sale*, sistem tempat di mana transaksi penjualan retail dilakukan. |
| Kasir | Aktor tunggal yang mengoperasikan sistem untuk transaksi, manajemen produk, dan melihat laporan. |
| Stok | Jumlah persediaan barang/produk yang tersedia dan siap dijual di dalam toko. |

## 1.5 References

* Product Vision: Aplikasi Kasir Web Minimalis.
* `Software Requirements Specification.txt` (Template Utama).

# 2. PRODUCT OVERVIEW

## 2.1 Product Summary

Aplikasi Kasir ini merupakan sistem *Point of Sale* (POS) berbasis web yang dirancang khusus untuk mempermudah operasional harian toko. Fokus utama sistem ini adalah menyederhanakan proses pencatatan transaksi melalui antarmuka web yang responsif, memberikan fleksibilitas bagi kasir untuk mendaftarkan produk baru secara mandiri, mengelola jumlah stok secara otomatis, serta menyediakan laporan ringkas mengenai total uang masuk dan sisa persediaan barang secara harian maupun bulanan.

## 2.2 User Types

| User Type | Description |
| --- | --- |
| Kasir | Pengguna tunggal sistem yang memiliki akses penuh untuk melakukan transaksi, mematangkan keranjang belanja, mendaftarkan barang baru ke database, mencetak struk, serta melihat laporan keuangan harian/bulanan. |

## 2.3 User Goals

### User Type: Kasir

* Dapat memilih produk dan mengatur jumlah kuantitas barang belanjaan pelanggan dengan cepat dan mudah.
* Dapat menambahkan data produk baru (nama, harga, stok awal) ke dalam sistem katalog saat ada barang baru masuk.
* Dapat menerbitkan struk fisik belanjaan pelanggan menggunakan printer yang terhubung ke web browser.
* Dapat melihat rekap nominal uang masuk serta sisa stok barang kapan saja tanpa perlu perhitungan manual.

## 2.4 Operating Environment

* **Frontend:** HTML5, CSS3, JavaScript Framework (React/Vue/Next.js).
* **Backend:** Node.js / Python / Go Rest API.
* **Database:** Relational Database (PostgreSQL / MySQL).
* **Deployment:** Cloud Hosting (AWS / GCP / DigitalOcean).
* **Browser Support:** Google Chrome, Mozilla Firefox, Microsoft Edge, Safari (versi terbaru).
* **Mobile Support:** Responsive Web Layout (bisa diakses via Tablet/iPad).

## 2.5 Assumptions

* Perangkat kasir (komputer/laptop/tablet) selalu terhubung dengan koneksi internet yang stabil selama operasional toko.
* Perangkat kasir sudah terhubung dan terkonfigurasi dengan printer (thermal/inkjet) yang dikenali oleh sistem operasi dan web browser.

## 2.6 Constraints

* Aplikasi sepenuhnya bergantung pada performa dan fungsionalitas dialog cetak bawaan web browser (*print dialog*).
* Keamanan data transaksi dan katalog bergantung pada akun login Kasir yang aktif.

# 3. SYSTEM FEATURES

---

## Feature ID: F001
Feature Name: Pencatatan Transaksi Penjualan

### Description

Fitur ini memungkinkan Kasir untuk memilih produk dari daftar master data, menyusun keranjang belanja pelanggan, memperbarui jumlah item, menetapkan total tagihan, dan mencetak struk belanja.

### Requirements

* Sistem harus menampilkan daftar seluruh produk beserta harga jual dan sisa stoknya.
* Sistem harus memungkinkan Kasir menambah produk ke dalam keranjang dengan sekali klik.
* Sistem harus menyediakan tombol intuitif untuk menambah (`+`) atau mengurangi (`-`) kuantitas item di keranjang belanja.
* Sistem harus menghitung total harga belanjaan secara otomatis (real-time) setiap kali ada perubahan item.
* Sistem harus menyediakan tombol "Cetak Struk" yang akan memicu pembukaan jendela dialog print cetak bawaan browser.

### Business Rules

* Produk dengan sisa stok berjumlah 0 (habis) tidak dapat dimasukkan ke dalam keranjang belanja.
* Pengurangan kuantitas item hingga di bawah angka 1 akan otomatis menghapus produk tersebut dari daftar keranjang belanja.
* Stok produk di database akan langsung berkurang secara berkala (*real-time*) tepat setelah transaksi berhasil diselesaikan/dicetak.

---

## Feature ID: F002
Feature Name: Manajemen Stok (Tambah Barang Baru)

### Description

Fitur ini memfasilitasi Kasir untuk memasukkan varian produk baru ke dalam sistem agar katalog penjualan selalu diperbarui.

### Requirements

* Sistem harus menyediakan formulir input barang baru yang terdiri dari kolom: Nama Barang, Harga Jual, dan Kuantitas Stok Awal.
* Sistem harus memvalidasi data inputan untuk mencegah terjadinya kesalahan ketik atau nilai kosong.
* Sistem harus langsung memperbarui daftar produk di menu transaksi setelah barang baru berhasil disimpan.

### Business Rules

* Nama barang tidak boleh duplikat dengan produk yang sudah terdaftar di sistem.
* Kolom Harga Jual dan Kuantitas Stok tidak boleh diisi dengan nilai minus atau kurang dari 0.

---

## Feature ID: F003
Feature Name: Laporan Pendapatan dan Stok Harian

### Description

Fitur ini menyediakan ringkasan performa penjualan dan kondisi inventaris toko yang diakumulasikan sepanjang hari berjalan.

### Requirements

* Sistem harus menampilkan total akumulasi uang masuk (omzet kotor) dari seluruh transaksi yang berhasil dilakukan pada hari tersebut.
* Sistem harus menampilkan daftar sisa stok terkini untuk seluruh produk yang terdaftar di toko.
* Sistem harus menyediakan indikator visual (misal: warna merah) jika ada produk yang stoknya menipis atau habis pada hari itu.

### Business Rules

* Data laporan harian akan otomatis dikunci dan diarsipkan di sistem setiap pergantian hari (pukul 00:00 waktu setempat).

---

## Feature ID: F004
Feature Name: Laporan Pendapatan dan Stok Bulanan

### Description

Fitur rekapitulasi data penjualan jangka panjang yang menyajikan akumulasi grafik/angka pendapatan dan sisa stok akhir di setiap bulannya.

### Requirements

* Sistem harus menampilkan total uang masuk bulanan yang dapat difilter berdasarkan bulan dan tahun terpilih.
* Sistem harus menampilkan status akhir stok barang pada penutupan bulan bersangkutan.

### Business Rules

* Laporan bulanan dihasilkan dari akumulasi data laporan harian yang valid dan tidak dapat diubah secara manual oleh Kasir.

# 4. DATA REQUIREMENTS

## 4.1 Core Business Objects

| Object | Description |
| --- | --- |
| Product | Menyimpan data master barang meliputi ID, Nama Produk, Harga Jual, dan Kuantitas Stok. |
| Transaction | Menyimpan data utama penjualan meliputi ID Transaksi, Waktu, Total Bayar, dan ID Kasir. |
| TransactionDetail | Menyimpan rincian item per transaksi meliputi ID Produk, Kuantitas, dan Subtotal Harga. |

## 4.2 Ownership Rules

| Object | Owner |
| --- | --- |
| Product | Kasir (Memiliki akses kelola penuh). |
| Transaction | Kasir (Hanya memiliki akses membuat dan melihat). |

## 4.3 Data Retention Rules

* Data transaksi penjualan dan detail transaksi wajib disimpan secara permanen di database minimal selama 5 tahun untuk keperluan audit keuangan.
* Log aktivitas penambahan barang dibersihkan secara berkala setiap 1 tahun sekali.

## 4.4 Data Validation Rules

* Kuantitas item dalam transaksi harus berupa bilangan bulat positif (integer > 0).
* Nilai nominal Harga Jual barang baru dan total bayar transaksi tidak boleh bernilai negatif (harus >= 0).
* Nama produk wajib berupa karakter alfanumerik yang bersih dari tag skrip berbahaya.

# 5. EXTERNAL INTERFACES

## 5.1 User Interface Requirements

* Layout responsif (dioptimalkan untuk resolusi Desktop PC dan layar Tablet).
* Navigasi konsisten menggunakan sidebar menu (Transaksi, Kelola Stok, Laporan Harian, Laporan Bulanan).
* Formulir tambah barang dibuat sederhana dengan penanda field yang jelas (required fields).

## 5.2 External Systems

| System | Purpose |
| --- | --- |
| Web Browser Print Engine | Menyediakan fungsi *rendering* halaman struk belanja ke perangkat kertas fisik lewat dialog print bawaan (Chrome/Firefox Engine). |

## 5.3 Communication Requirements

### Protocols

* HTTPS (untuk menjamin keamanan transmisi data)
* REST API (komunikasi utama frontend ke backend)

### Formats

* JSON (untuk pertukaran data objek produk dan transaksi)

# 6. NON-FUNCTIONAL REQUIREMENTS

## 6.1 Performance

* Sistem harus memuat halaman utama pencatatan transaksi dalam waktu di bawah 2 detik pada koneksi internet standar.
* Proses penyimpanan barang baru ke database harus selesai dalam waktu kurang dari 500 milidetik.

## 6.2 Security

* Hak akses ke aplikasi wajib dilindungi dengan mekanisme autentikasi (Username & Password).
* Seluruh token sesi login harus dienkripsi dan disimpan dengan aman di sisi klien (HttpOnly Cookie).

## 6.3 Availability

* Sistem kasir berbasis web harus memiliki tingkat ketersediaan (*uptime*) minimal 99.5% selama jam operasional toko.

## 6.4 Reliability

* Sistem harus mampu menangani kegagalan jaringan sementara tanpa menghilangkan data keranjang belanja yang sedang aktif di layar browser Kasir (*local state retention*).

## 6.5 Scalability

* Struktur database harus mampu menangani pertumbuhan data hingga 10.000 data rekaman transaksi per bulan tanpa penurunan performa yang signifikan.

## 6.6 Maintainability

* Source code aplikasi wajib ditulis menggunakan standar penamaan yang bersih dan modular guna memudahkan pengembangan fitur baru di masa mendatang.

## 6.7 Usability

* Antarmuka kasir harus mudah dipahami oleh pengguna baru dengan waktu pelatihan maksimal 15 menit.

# 7. PERMISSIONS AND ACCESS CONTROL

| Capability | Kasir |
| --- | --- |
| Membuat Transaksi | **AKSI (ALLOWED)** |
| Mencetak Struk Belanja | **AKSI (ALLOWED)** |
| **Menambahkan Barang Baru (Kelola Stok)** | **AKSI (ALLOWED)** |
| Melihat Laporan Harian | **AKSI (ALLOWED)** |
| Melihat Laporan Bulanan | **AKSI (ALLOWED)** |
| Mengubah Riwayat Transaksi Lampau | **DITOLAK (DENIED)** |

# 8. FEATURE INVENTORY

| Feature ID | Feature Name | Priority |
| --- | --- | --- |
| F001 | Pencatatan Transaksi Penjualan & Cetak Struk | High |
| F002 | Manajemen Stok (Tambah Barang Baru) | High |
| F003 | Laporan Pendapatan & Stok Harian | High |
| F004 | Laporan Pendapatan & Stok Bulanan | Medium |

# 9. OPEN QUESTIONS

* *Belum ada pertanyaan terbuka saat ini.*

# 10. FUTURE CONSIDERATIONS

* Pengembangan sistem otorisasi multi-role (pemisahan peran Pemilik Toko dan Kasir).
* Sinkronisasi data lokal (*Offline-first mode*) jika koneksi internet sewaktu-waktu terputus di toko.

# 11. REVISION HISTORY

| Version | Date | Author | Description |
| --- | --- | --- | --- |
| 0.1 | 2026-06-13 | System Analyst AI | Initial Draft (Dokumen Dasar SoT-1). |
| **0.2** | **2026-06-13** | **System Analyst AI** | **Pembaruan cakupan sistem: Penambahan fitur Manajemen Stok (Tambah Barang Baru).** |

