# Test Execution Sheet

Document Version: v0.1

Project: Aplikasi Kasir Toko
Product: Web-Based Point of Sale (POS)

Status: Draft
Last Updated: 2026-06-14
Author: System Analyst AI

---

# 1. INSTRUCTIONS

1. Cetak atau buka file ini dalam mode editable.
2. Eksekusi test case secara berurutan sesuai tabel di bawah.
3. Pada kolom **Actual Result**, catat hasil aktual yang terjadi saat pengujian.
4. Pada kolom **Status**, isi **PASS** jika actual result sesuai expected, **FAIL** jika tidak sesuai, atau **N/A** jika tidak dapat diuji.
5. Pada kolom **Notes**, tulis keterangan tambahan (contoh: ID defect, link bug report).
6. Gunakan lembar ini sebagai bukti eksekusi pengujian.

---

# 2. FEATURE F001: PENCATATAN TRANSAKSI PENJUALAN & CETAK STRUK

## 2.1 UC-001: User Login

| TC ID       | Test Scenario                        | Test Steps                                                                                                             | Expected Result                                                                               | Actual Result | Status | Notes |
| ----------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------- | ------ | ----- |
| TC-F001-001 | Login Berhasil                       | 1. Buka aplikasi di browser<br>2. Masukkan username `kasir01`<br>3. Masukkan password `password123`<br>4. Klik "Masuk" | 1. Sistem redirect ke `/transaksi`<br>2. Token sesi tersimpan di HttpOnly Cookie              |               |        |       |
| TC-F001-002 | Login Gagal - Kredensial Salah       | 1. Masukkan username `kasir01`<br>2. Masukkan password `salah`<br>3. Klik "Masuk"                                      | 1. Sistem menampilkan pesan "Username atau password salah"<br>2. Kasir tetap di halaman Login |               |        |       |
| TC-F001-003 | Login Gagal - Input Kosong           | 1. Biarkan username dan password kosong<br>2. Klik "Masuk"                                                             | 1. Sistem menampilkan validasi error pada field kosong<br>2. Form tidak ter-submit            |               |        |       |
| TC-F001-004 | Login - Server Tidak Dapat Dihubungi | 1. Pastikan server offline<br>2. Masukkan kredensial valid<br>3. Klik "Masuk"                                          | 1. Sistem menampilkan pesan "Terjadi kesalahan koneksi. Silakan coba lagi."                   |               |        |       |
| TC-F001-005 | Login - Sesi Sudah Aktif             | 1. Dalam keadaan sudah login<br>2. Akses URL `/login`                                                                  | 1. Sistem redirect ke `/transaksi`                                                            |               |        |       |

## 2.2 UC-002: Create Sales Transaction

| TC ID       | Test Scenario                      | Test Steps                                                                                | Expected Result                                                                                           | Actual Result | Status | Notes |
| ----------- | ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------- | ------ | ----- |
| TC-F001-006 | Menambah Produk ke Keranjang       | 1. Akses `/transaksi`<br>2. Klik produk "Indomie Goreng" (stok > 0)                       | 1. Produk muncul di keranjang<br>2. Kuantitas = 1<br>3. Subtotal = Rp3.500<br>4. Total tagihan ter-update |               |        |       |
| TC-F001-007 | Menambah/Mengurangi Kuantitas Item | 1. Klik `+` dua kali<br>2. Klik `-` satu kali                                             | 1. Kuantitas akhir = 2<br>2. Subtotal = Rp7.000<br>3. Total tagihan berubah real-time                     |               |        |       |
| TC-F001-008 | Produk Habis (Stok = 0)            | 1. Klik produk dengan stok = 0                                                            | 1. Produk tidak masuk keranjang<br>2. Indikator "Habis" pada kartu produk                                 |               |        |       |
| TC-F001-009 | Mencari Produk                     | 1. Tekan Ctrl+C / klik kolom pencarian<br>2. Ketik "Indomie"<br>3. Klik produk dari hasil | 1. Produk sesuai keyword ditampilkan<br>2. Produk berhasil ditambahkan ke keranjang                       |               |        |       |
| TC-F001-010 | Mengosongkan Keranjang             | 1. Klik tombol hapus pada setiap item                                                     | 1. Keranjang kosong<br>2. Tombol "Bayar" disabled                                                         |               |        |       |
| TC-F001-011 | Stok Tidak Cukup                   | 1. Tambah produk stok = 5<br>2. Klik `+` hingga kuantitas = 5<br>3. Klik `+` sekali lagi  | 1. Tombol `+` tidak berfungsi<br>2. Pesan "Stok tidak cukup"<br>3. Kuantitas tidak bertambah              |               |        |       |
| TC-F001-012 | Keranjang Kosong Saat Bayar        | 1. Pastikan keranjang kosong<br>2. Klik "Bayar" / Ctrl+B                                  | 1. Tombol "Bayar" disabled<br>2. Tidak ada dialog pembayaran                                              |               |        |       |

## 2.3 UC-003: Print Receipt

| TC ID | Test Scenario | Test Steps | Expected Result | Actual Result | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| TC-F001-013 | Cetak Struk Berhasil | 1. Klik "Cetak Struk"<br>2. Pilih printer di dialog<br>3. Klik "Print" | 1. Browser print dialog muncul<br>2. Struk berisi: nama toko, item, total, waktu<br>3. Printer mencetak struk | | | |
| TC-F001-014 | Membatalkan Cetak Struk | 1. Klik "Cetak Struk"<br>2. Klik "Cancel" di dialog | 1. Dialog tertutup<br>2. Kembali ke POS Terminal<br>3. Transaksi tetap tercatat | | | |
| TC-F001-015 | Printer Tidak Terdeteksi | 1. Klik "Cetak Struk" tanpa printer | 1. Dialog terbuka tanpa printer (Save as PDF)<br>2. Dapat dibatalkan | | | |
| TC-F001-016 | Browser Print Dialog Diblokir | 1. Setting blokir popup ON<br>2. Klik "Cetak Struk" | 1. Pesan "Izinkan popup untuk mencetak struk"<br>2. Setelah diizinkan, dialog muncul | | | |

---

# 3. FEATURE F002: MANAJEMEN STOK (TAMBAH BARANG BARU)

## 3.1 UC-004: Add New Product

| TC ID | Test Scenario | Test Steps | Expected Result | Actual Result | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| TC-F002-001 | Tambah Produk Baru Berhasil | 1. Klik "Tambah Barang"<br>2. Isi Nama = "Teh Botol Sosro", Kategori = "Minuman", Harga = 5000, Stok = 100<br>3. Klik "Simpan" | 1. Produk tersimpan<br>2. Modal tertutup<br>3. Produk muncul di inventaris & POS Terminal | | | |
| TC-F002-002 | Membatalkan Penambahan Produk | 1. Isi beberapa field<br>2. Klik "Batal" / tombol X | 1. Modal tertutup<br>2. Data tidak tersimpan<br>3. Inventaris tidak berubah | | | |
| TC-F002-003 | Input Tidak Lengkap | 1. Kosongkan field "Harga"<br>2. Klik "Simpan" | 1. Pesan error pada field kosong<br>2. Form tidak ter-submit | | | |
| TC-F002-004 | Nama Produk Duplikat | 1. Isi nama produk yang sudah ada<br>2. Klik "Simpan" | 1. Pesan "Nama produk sudah ada"<br>2. Data tidak tersimpan | | | |
| TC-F002-005 | Harga atau Stok Negatif | 1. Isi Harga = -1000, Stok = -5<br>2. Klik "Simpan" | 1. Pesan "Harga dan stok harus lebih dari 0"<br>2. Form tidak ter-submit | | | |
| TC-F002-006 | Server Error Saat Menyimpan | 1. Isi data valid<br>2. Pastikan server error<br>3. Klik "Simpan" | 1. Pesan "Gagal menyimpan produk. Silakan coba lagi."<br>2. Modal tetap terbuka | | | |

---

# 4. FEATURE F003: LAPORAN PENDAPATAN & STOK HARIAN

## 4.1 UC-005: View Daily Report

| TC ID | Test Scenario | Test Steps | Expected Result | Actual Result | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| TC-F003-001 | Melihat Laporan Harian | 1. Akses `/laporan/harian`<br>2. Amati KPI Cards dan tabel | 1. KPI: Total Pendapatan, Jumlah Transaksi, Rata-rata<br>2. Tabel daftar transaksi hari ini<br>3. Stok menipis (<=5) warna merah | | | |
| TC-F003-002 | Tidak Ada Transaksi Hari Ini | 1. Akses `/laporan/harian` tanpa transaksi | 1. KPI Cards = 0<br>2. Tabel "Tidak ada data" | | | |
| TC-F003-003 | Melihat Detail Transaksi | 1. Klik baris transaksi di tabel | 1. Detail item: produk, jumlah, subtotal<br>2. Data read-only | | | |
| TC-F003-004 | Server Error Laporan Harian | 1. Pastikan server error<br>2. Akses `/laporan/harian` | 1. Pesan "Gagal memuat laporan. Silakan coba lagi." | | | |

---

# 5. FEATURE F004: LAPORAN PENDAPATAN & STOK BULANAN

## 5.1 UC-006: View Monthly Report

| TC ID | Test Scenario | Test Steps | Expected Result | Actual Result | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| TC-F004-001 | Melihat Laporan Bulanan | 1. Akses `/laporan/bulanan` | 1. KPI: Total Pendapatan, Total Transaksi, Rata-rata Bulanan<br>2. Tabel: Bulan, Transaksi, Pendapatan, Item Terjual<br>3. Data read-only | | | |
| TC-F004-002 | Filter Berdasarkan Bulan | 1. Pilih bulan "Juni"<br>2. Pilih tahun "2026" | 1. Data terfilter sesuai bulan/tahun<br>2. KPI Cards ter-update | | | |
| TC-F004-003 | Tidak Ada Data Bulanan | 1. Filter bulan tanpa data | 1. Tabel "Tidak ada data"<br>2. KPI Cards = 0 | | | |
| TC-F004-004 | Server Error Laporan Bulanan | 1. Pastikan server error<br>2. Akses `/laporan/bulanan` | 1. Pesan "Gagal memuat laporan. Silakan coba lagi." | | | |

---

# 6. EXECUTION SUMMARY

| Feature                       | Total TC | PASS | FAIL | N/A | Pass Rate |
| ----------------------------- | -------- | ---- | ---- | --- | --------- |
| F001: Transaksi & Cetak Struk | 16       |      |      |     |           |
| F002: Manajemen Stok          | 6        |      |      |     |           |
| F003: Laporan Harian          | 4        |      |      |     |           |
| F004: Laporan Bulanan         | 4        |      |      |     |           |
| **Total**                     | **30**   |      |      |     |           |

**Tester Name:** ____________________

**Execution Date:** ____________________

**Signature:** ____________________

---

# 7. REVISION HISTORY

| Version | Date | Author | Description |
| --- | --- | --- | --- |
| 0.1 | 2026-06-14 | System Analyst AI | Initial Draft |
