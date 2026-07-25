# Test Case Specification

Document Version: v0.1

Project: Aplikasi Kasir Toko
Product: Web-Based Point of Sale (POS)

Status: Draft
Last Updated: 2026-06-14
Author: System Analyst AI

---

# 1. INTRODUCTION

## 1.1 Purpose

Dokumen ini mendefinisikan test case untuk seluruh fitur sistem Aplikasi Kasir Berbasis Web. Test case diturunkan dari Software Requirements Specification (SRS) dan User Flow Specifications untuk memastikan setiap kebutuhan fungsional terverifikasi.

## 1.2 Scope

Mencakup test case untuk:
- F001: Pencatatan Transaksi Penjualan & Cetak Struk (UC-001, UC-002, UC-003)
- F002: Manajemen Stok / Tambah Barang Baru (UC-004)
- F003: Laporan Pendapatan & Stok Harian (UC-005)
- F004: Laporan Pendapatan & Stok Bulanan (UC-006)

## 1.3 Test Case Format

| Field | Description |
| --- | --- |
| **TC ID** | Test Case Identifier (format: TC-FXXX-NNN) |
| **Related UC** | Use Case ID dari user flow |
| **Related Feature** | Feature ID dari SRS |
| **Test Scenario** | Deskripsi skenario pengujian |
| **Preconditions** | Kondisi yang harus terpenuhi sebelum test |
| **Test Data** | Data yang digunakan dalam pengujian |
| **Test Steps** | Langkah-langkah pengujian |
| **Expected Result** | Hasil yang diharapkan |
| **Type** | Positif / Negatif / Exception |

---

# 2. TEST CASE INDEX

| TC ID | Feature | Use Case | Scenario |
| --- | --- | --- | --- |
| TC-F001-001 | F001 | UC-001 | Login Berhasil |
| TC-F001-002 | F001 | UC-001 | Login Gagal - Kredensial Salah |
| TC-F001-003 | F001 | UC-001 | Login Gagal - Input Kosong |
| TC-F001-004 | F001 | UC-001 | Login - Server Tidak Dapat Dihubungi |
| TC-F001-005 | F001 | UC-001 | Login - Sesi Sudah Aktif |
| TC-F001-006 | F001 | UC-002 | Menambah Produk ke Keranjang |
| TC-F001-007 | F001 | UC-002 | Menambah/Mengurangi Kuantitas Item |
| TC-F001-008 | F001 | UC-002 | Produk Habis (Stok = 0) |
| TC-F001-009 | F001 | UC-002 | Mencari Produk |
| TC-F001-010 | F001 | UC-002 | Mengosongkan Keranjang |
| TC-F001-011 | F001 | UC-002 | Stok Tidak Cukup |
| TC-F001-012 | F001 | UC-002 | Keranjang Kosong Saat Bayar |
| TC-F001-013 | F001 | UC-003 | Cetak Struk Berhasil |
| TC-F001-014 | F001 | UC-003 | Membatalkan Cetak Struk |
| TC-F001-015 | F001 | UC-003 | Printer Tidak Terdeteksi |
| TC-F001-016 | F001 | UC-003 | Browser Print Dialog Diblokir |
| TC-F002-001 | F002 | UC-004 | Tambah Produk Baru Berhasil |
| TC-F002-002 | F002 | UC-004 | Membatalkan Penambahan Produk |
| TC-F002-003 | F002 | UC-004 | Input Tidak Lengkap |
| TC-F002-004 | F002 | UC-004 | Nama Produk Duplikat |
| TC-F002-005 | F002 | UC-004 | Harga atau Stok Negatif |
| TC-F002-006 | F002 | UC-004 | Server Error Saat Menyimpan |
| TC-F003-001 | F003 | UC-005 | Melihat Laporan Harian |
| TC-F003-002 | F003 | UC-005 | Tidak Ada Transaksi Hari Ini |
| TC-F003-003 | F003 | UC-005 | Melihat Detail Transaksi |
| TC-F003-004 | F003 | UC-005 | Server Error Laporan Harian |
| TC-F004-001 | F004 | UC-006 | Melihat Laporan Bulanan |
| TC-F004-002 | F004 | UC-006 | Filter Berdasarkan Bulan |
| TC-F004-003 | F004 | UC-006 | Tidak Ada Data Bulanan |
| TC-F004-004 | F004 | UC-006 | Server Error Laporan Bulanan |

---

# 3. TEST CASES

## 3.1 Feature F001: Pencatatan Transaksi Penjualan & Cetak Struk

### 3.1.1 UC-001: User Login

---

#### TC-F001-001: Login Berhasil

| Field | Value |
| --- | --- |
| **TC ID** | TC-F001-001 |
| **Related UC** | UC-001 |
| **Related Feature** | F001 |
| **Test Scenario** | Kasir berhasil login dengan username dan password yang valid |
| **Preconditions** | Kasir memiliki akun terdaftar, aplikasi dapat diakses melalui browser |
| **Test Data** | Username: `kasir01`, Password: `password123` |
| **Test Steps** | 1. Buka aplikasi di browser<br>2. Sistem menampilkan halaman Login<br>3. Masukkan username `kasir01`<br>4. Masukkan password `password123`<br>5. Klik tombol "Masuk" |
| **Expected Result** | 1. Sistem memvalidasi input (tidak kosong)<br>2. Sistem mengirim kredensial ke backend<br>3. Backend memverifikasi kredensial dan return success<br>4. Sistem redirect ke halaman `/transaksi` (POS Terminal)<br>5. Token sesi tersimpan di HttpOnly Cookie |
| **Type** | Positif |

---

#### TC-F001-002: Login Gagal - Kredensial Salah

| Field | Value |
| --- | --- |
| **TC ID** | TC-F001-002 |
| **Related UC** | UC-001 (AF-001) |
| **Related Feature** | F001 |
| **Test Scenario** | Kasir memasukkan username atau password yang salah |
| **Preconditions** | Kasir memiliki akun terdaftar |
| **Test Data** | Username: `kasir01`, Password: `salah` |
| **Test Steps** | 1. Buka halaman Login<br>2. Masukkan username `kasir01`<br>3. Masukkan password `salah`<br>4. Klik tombol "Masuk" |
| **Expected Result** | 1. Sistem mengirim kredensial ke backend<br>2. Backend menolak dengan response error<br>3. Sistem menampilkan pesan "Username atau password salah" di bawah form<br>4. Kasir tetap di halaman Login |
| **Type** | Negatif |

---

#### TC-F001-003: Login Gagal - Input Kosong

| Field | Value |
| --- | --- |
| **TC ID** | TC-F001-003 |
| **Related UC** | UC-001 (AF-002) |
| **Related Feature** | F001 |
| **Test Scenario** | Kasir mengklik tombol "Masuk" tanpa mengisi username atau password |
| **Preconditions** | Halaman Login ditampilkan |
| **Test Data** | Username: (kosong), Password: (kosong) |
| **Test Steps** | 1. Buka halaman Login<br>2. Biarkan field username kosong<br>3. Biarkan field password kosong<br>4. Klik tombol "Masuk" |
| **Expected Result** | 1. Sistem menampilkan validasi error "Username harus diisi"<br>2. Sistem menampilkan validasi error "Password harus diisi"<br>3. Form tidak ter-submit |
| **Type** | Negatif |

---

#### TC-F001-004: Login - Server Tidak Dapat Dihubungi

| Field | Value |
| --- | --- |
| **TC ID** | TC-F001-004 |
| **Related UC** | UC-001 (EF-001) |
| **Related Feature** | F001 |
| **Test Scenario** | Backend server atau database tidak dapat diakses |
| **Preconditions** | Server dalam kondisi offline |
| **Test Data** | Username: `kasir01`, Password: `password123` |
| **Test Steps** | 1. Buka halaman Login<br>2. Masukkan username dan password valid<br>3. Klik tombol "Masuk" |
| **Expected Result** | 1. Sistem mencoba mengirim request ke backend<br>2. Sistem timeout atau mendapat error koneksi<br>3. Sistem menampilkan pesan "Terjadi kesalahan koneksi. Silakan coba lagi." |
| **Type** | Exception |

---

#### TC-F001-005: Login - Sesi Sudah Aktif

| Field | Value |
| --- | --- |
| **TC ID** | TC-F001-005 |
| **Related UC** | UC-001 (EF-002) |
| **Related Feature** | F001 |
| **Test Scenario** | Kasir sudah login dan mencoba mengakses halaman login |
| **Preconditions** | Kasir sudah memiliki sesi login aktif |
| **Test Data** | - |
| **Test Steps** | 1. Dalam keadaan sudah login<br>2. Akses URL `/login` |
| **Expected Result** | 1. Sistem mendeteksi sesi aktif<br>2. Sistem redirect ke halaman `/transaksi` (POS Terminal) |
| **Type** | Exception |

---

### 3.1.2 UC-002: Create Sales Transaction

---

#### TC-F001-006: Menambah Produk ke Keranjang

| Field | Value |
| --- | --- |
| **TC ID** | TC-F001-006 |
| **Related UC** | UC-002 |
| **Related Feature** | F001 |
| **Test Scenario** | Kasir menambahkan produk dari katalog ke keranjang belanja |
| **Preconditions** | 1. Kasir sudah login (UC-001 selesai)<br>2. Ada produk dengan stok > 0 |
| **Test Data** | Produk: "Indomie Goreng", Harga: Rp3.500, Stok: 50 |
| **Test Steps** | 1. Akses halaman POS Terminal `/transaksi`<br>2. Sistem menampilkan daftar produk dan panel keranjang<br>3. Klik produk "Indomie Goreng"<br>4. Sistem menambahkan produk ke keranjang dengan kuantitas 1 |
| **Expected Result** | 1. Produk muncul di panel keranjang<br>2. Kuantitas item = 1<br>3. Subtotal menampilkan harga produk (Rp3.500)<br>4. Total tagihan ter-update otomatis |
| **Type** | Positif |

---

#### TC-F001-007: Menambah/Mengurangi Kuantitas Item

| Field | Value |
| --- | --- |
| **TC ID** | TC-F001-007 |
| **Related UC** | UC-002 |
| **Related Feature** | F001 |
| **Test Scenario** | Kasir menambah dan mengurangi kuantitas item di keranjang |
| **Preconditions** | Minimal 1 produk sudah ada di keranjang |
| **Test Data** | Produk: "Indomie Goreng", Harga: Rp3.500, Stok: 50 |
| **Test Steps** | 1. Klik tombol `+` pada item di keranjang<br>2. Klik tombol `+` sekali lagi<br>3. Klik tombol `-` pada item |
| **Expected Result** | 1. Setelah step 1: kuantitas = 2, subtotal = Rp7.000<br>2. Setelah step 2: kuantitas = 3, subtotal = Rp10.500<br>3. Setelah step 3: kuantitas = 2, subtotal = Rp7.000<br>4. Total tagihan ter-update real-time di setiap perubahan |
| **Type** | Positif |

---

#### TC-F001-008: Produk Habis (Stok = 0)

| Field | Value |
| --- | --- |
| **TC ID** | TC-F001-008 |
| **Related UC** | UC-002 (AF-001) |
| **Related Feature** | F001 |
| **Test Scenario** | Kasir mencoba menambahkan produk dengan stok 0 |
| **Preconditions** | Ada produk dengan stok = 0 |
| **Test Data** | Produk: "Aqua 600ml", Stok: 0 |
| **Test Steps** | 1. Akses halaman POS Terminal<br>2. Klik produk "Aqua 600ml" |
| **Expected Result** | 1. Produk tidak ditambahkan ke keranjang<br>2. Indikator visual "Habis" ditampilkan pada kartu produk |
| **Type** | Negatif |

---

#### TC-F001-009: Mencari Produk

| Field               | Value                                                                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TC ID**           | TC-F001-009                                                                                                                                                                        |
| **Related UC**      | UC-002 (AF-002)                                                                                                                                                                    |
| **Related Feature** | F001                                                                                                                                                                               |
| **Test Scenario**   | Kasir mencari produk tertentu menggunakan fitur pencarian                                                                                                                          |
| **Preconditions**   | Minimal 1 produk terdaftar                                                                                                                                                         |
| **Test Data**       | Pencarian: "Indomie"                                                                                                                                                               |
| **Test Steps**      | 1. Akses halaman POS Terminal<br>2. Tekan Ctrl+C atau klik kolom pencarian<br>3. Ketik "Indomie"<br>4. Sistem menampilkan produk yang cocok<br>5. Klik produk dari hasil pencarian |
| **Expected Result** | 1. Produk yang sesuai dengan kata kunci "Indomie" ditampilkan<br>2. Produk yang tidak sesuai tidak ditampilkan<br>3. Produk berhasil ditambahkan ke keranjang setelah diklik       |
| **Type**            | Positif                                                                                                                                                                            |

---

#### TC-F001-010: Mengosongkan Keranjang

| Field | Value |
| --- | --- |
| **TC ID** | TC-F001-010 |
| **Related UC** | UC-002 (AF-003) |
| **Related Feature** | F001 |
| **Test Scenario** | Kasir menghapus semua item dari keranjang |
| **Preconditions** | Minimal 2 produk di keranjang |
| **Test Data** | - |
| **Test Steps** | 1. Klik tombol hapus pada item pertama (item terhapus)<br>2. Klik tombol hapus pada item kedua |
| **Expected Result** | 1. Setiap item dihapus satu per satu<br>2. Keranjang kosong<br>3. Tombol "Bayar" dinonaktifkan (disabled) |
| **Type** | Negatif |

---

#### TC-F001-011: Stok Tidak Cukup

| Field | Value |
| --- | --- |
| **TC ID** | TC-F001-011 |
| **Related UC** | UC-002 (EF-001) |
| **Related Feature** | F001 |
| **Test Scenario** | Kuantitas item di keranjang melebihi stok yang tersedia |
| **Preconditions** | Produk dengan stok terbatas sudah di keranjang |
| **Test Data** | Produk: "Indomie Goreng", Stok: 5, Kuantitas di keranjang: 5 |
| **Test Steps** | 1. Tambah produk dengan stok 5 ke keranjang<br>2. Klik tombol `+` hingga kuantitas = 5<br>3. Klik tombol `+` sekali lagi |
| **Expected Result** | 1. Sistem memeriksa stok yang tersedia<br>2. Jika kuantitas >= stok: tombol `+` tidak berfungsi<br>3. Sistem menampilkan pesan "Stok tidak cukup"<br>4. Kuantitas tidak bertambah |
| **Type** | Exception |

---

#### TC-F001-012: Keranjang Kosong Saat Bayar

| Field | Value |
| --- | --- |
| **TC ID** | TC-F001-012 |
| **Related UC** | UC-002 (EF-002) |
| **Related Feature** | F001 |
| **Test Scenario** | Kasir mengklik tombol "Bayar" saat keranjang kosong |
| **Preconditions** | Keranjang belanja kosong |
| **Test Data** | - |
| **Test Steps** | 1. Pastikan keranjang kosong<br>2. Klik tombol "Bayar" atau tekan Ctrl+B |
| **Expected Result** | 1. Tombol "Bayar" dalam keadaan disabled (tidak bisa diklik)<br>2. Tidak ada dialog pembayaran yang muncul |
| **Type** | Exception |

---

### 3.1.3 UC-003: Print Receipt

---

#### TC-F001-013: Cetak Struk Berhasil

| Field | Value |
| --- | --- |
| **TC ID** | TC-F001-013 |
| **Related UC** | UC-003 |
| **Related Feature** | F001 |
| **Test Scenario** | Kasir mencetak struk setelah transaksi selesai |
| **Preconditions** | 1. Transaksi penjualan sudah selesai (UC-002 selesai)<br>2. Perangkat terhubung dengan printer<br>3. Browser mengizinkan dialog print |
| **Test Data** | Transaksi berisi minimal 1 item |
| **Test Steps** | 1. Klik tombol "Cetak Struk" atau tekan Enter di dialog pembayaran<br>2. Sistem menyiapkan data struk<br>3. Browser menampilkan dialog print preview<br>4. Pilih printer yang tersedia<br>5. Klik tombol "Print" |
| **Expected Result** | 1. Sistem memanggil browser print dialog (`window.print()`)<br>2. Browser menampilkan print preview dengan data struk<br>3. Struk berisi: nama toko, daftar item, total bayar, waktu transaksi<br>4. Printer mencetak struk belanja<br>5. Setelah dialog ditutup, kembali ke POS Terminal |
| **Type** | Positif |

---

#### TC-F001-014: Membatalkan Cetak Struk

| Field | Value |
| --- | --- |
| **TC ID** | TC-F001-014 |
| **Related UC** | UC-003 (AF-001) |
| **Related Feature** | F001 |
| **Test Scenario** | Kasir membatalkan proses pencetakan struk |
| **Preconditions** | Transaksi penjualan sudah selesai |
| **Test Data** | - |
| **Test Steps** | 1. Klik tombol "Cetak Struk"<br>2. Browser menampilkan dialog print preview<br>3. Klik tombol "Cancel" di browser print dialog |
| **Expected Result** | 1. Dialog print tertutup<br>2. Kasir kembali ke halaman POS Terminal<br>3. Transaksi tetap tercatat di sistem |
| **Type** | Exception |

---

#### TC-F001-015: Printer Tidak Terdeteksi

| Field | Value |
| --- | --- |
| **TC ID** | TC-F001-015 |
| **Related UC** | UC-003 (AF-002) |
| **Related Feature** | F001 |
| **Test Scenario** | Tidak ada printer yang terhubung ke perangkat |
| **Preconditions** | Transaksi selesai, tidak ada printer terhubung |
| **Test Data** | - |
| **Test Steps** | 1. Klik tombol "Cetak Struk"<br>2. Browser memanggil print dialog |
| **Expected Result** | 1. Print dialog terbuka<br>2. Browser menampilkan dialog tanpa printer tersedia (destination: "Save as PDF")<br>3. Kasir dapat membatalkan cetak dan kembali ke POS Terminal |
| **Type** | Exception |

---

#### TC-F001-016: Browser Print Dialog Diblokir

| Field | Value |
| --- | --- |
| **TC ID** | TC-F001-016 |
| **Related UC** | UC-003 (EF-001) |
| **Related Feature** | F001 |
| **Test Scenario** | Browser memblokir popup print dialog |
| **Preconditions** | Browser setting memblokir popup |
| **Test Data** | - |
| **Test Steps** | 1. Klik tombol "Cetak Struk"<br>2. Browser memblokir print dialog |
| **Expected Result** | 1. Sistem menampilkan pesan "Izinkan popup untuk mencetak struk"<br>2. Setelah popup diizinkan, print dialog muncul |
| **Type** | Exception |

---

## 3.2 Feature F002: Manajemen Stok (Tambah Barang Baru)

---

#### TC-F002-001: Tambah Produk Baru Berhasil

| Field | Value |
| --- | --- |
| **TC ID** | TC-F002-001 |
| **Related UC** | UC-004 |
| **Related Feature** | F002 |
| **Test Scenario** | Kasir menambahkan produk baru dengan data valid |
| **Preconditions** | 1. Kasir sudah login (UC-001 selesai)<br>2. Mengakses halaman Kelola Stok (`/stok`) |
| **Test Data** | Nama: "Teh Botol Sosro", Kategori: "Minuman", Harga: 5000, Stok: 100 |
| **Test Steps** | 1. Klik tombol "Tambah Barang"<br>2. Sistem menampilkan modal form<br>3. Isi "Nama Produk" = "Teh Botol Sosro"<br>4. Isi "Kategori" = "Minuman"<br>5. Isi "Harga" = 5000<br>6. Isi "Stok Awal" = 100<br>7. Klik tombol "Simpan" |
| **Expected Result** | 1. Sistem memvalidasi input (valid)<br>2. Produk baru disimpan ke database<br>3. Modal form tertutup<br>4. Daftar produk di halaman Kelola Stok ter-update<br>5. Produk baru muncul di daftar produk halaman POS Terminal |
| **Type** | Positif |

---

#### TC-F002-002: Membatalkan Penambahan Produk

| Field | Value |
| --- | --- |
| **TC ID** | TC-F002-002 |
| **Related UC** | UC-004 (AF-001) |
| **Related Feature** | F002 |
| **Test Scenario** | Kasir membatalkan proses penambahan produk |
| **Preconditions** | Modal form "Tambah Produk Baru" terbuka |
| **Test Data** | Field sudah terisi sebagian |
| **Test Steps** | 1. Isi beberapa field<br>2. Klik tombol "Batal" atau tombol X di modal |
| **Expected Result** | 1. Modal form tertutup<br>2. Data yang terisi tidak disimpan<br>3. Tabel inventaris tidak berubah |
| **Type** | Negatif |

---

#### TC-F002-003: Input Tidak Lengkap

| Field | Value |
| --- | --- |
| **TC ID** | TC-F002-003 |
| **Related UC** | UC-004 (AF-002) |
| **Related Feature** | F002 |
| **Test Scenario** | Kasir tidak mengisi salah satu field yang wajib |
| **Preconditions** | Modal form "Tambah Produk Baru" terbuka |
| **Test Data** | Harga: (kosong), field lain terisi |
| **Test Steps** | 1. Isi Nama Produk = "Teh Botol Sosro"<br>2. Isi Kategori = "Minuman"<br>3. Biarkan Harga kosong<br>4. Isi Stok Awal = 100<br>5. Klik tombol "Simpan" |
| **Expected Result** | 1. Sistem menampilkan pesan error pada field "Harga" yang kosong<br>2. Form tidak ter-submit<br>3. Data tidak tersimpan |
| **Type** | Negatif |

---

#### TC-F002-004: Nama Produk Duplikat

| Field | Value |
| --- | --- |
| **TC ID** | TC-F002-004 |
| **Related UC** | UC-004 (EF-001) |
| **Related Feature** | F002 |
| **Test Scenario** | Nama produk yang dimasukkan sudah ada di sistem |
| **Preconditions** | Produk "Teh Botol Sosro" sudah terdaftar |
| **Test Data** | Nama: "Teh Botol Sosro" (duplikat) |
| **Test Steps** | 1. Buka modal form "Tambah Produk Baru"<br>2. Isi Nama Produk = "Teh Botol Sosro"<br>3. Isi field lain dengan data valid<br>4. Klik tombol "Simpan" |
| **Expected Result** | 1. Sistem memvalidasi nama produk<br>2. Sistem mendeteksi duplikat<br>3. Sistem menampilkan pesan error "Nama produk sudah ada"<br>4. Data tidak tersimpan |
| **Type** | Negatif |

---

#### TC-F002-005: Harga atau Stok Negatif

| Field | Value |
| --- | --- |
| **TC ID** | TC-F002-005 |
| **Related UC** | UC-004 (EF-002) |
| **Related Feature** | F002 |
| **Test Scenario** | Kasir memasukkan harga atau stok dengan nilai negatif |
| **Preconditions** | Modal form "Tambah Produk Baru" terbuka |
| **Test Data** | Harga: -1000, Stok: -5 |
| **Test Steps** | 1. Buka modal form<br>2. Isi Nama = "Produk Test"<br>3. Isi Harga = -1000<br>4. Isi Stok Awal = -5<br>5. Klik tombol "Simpan" |
| **Expected Result** | 1. Sistem menampilkan pesan error "Harga dan stok harus lebih dari 0"<br>2. Form tidak ter-submit<br>3. Data tidak tersimpan |
| **Type** | Negatif |

---

#### TC-F002-006: Server Error Saat Menyimpan

| Field | Value |
| --- | --- |
| **TC ID** | TC-F002-006 |
| **Related UC** | UC-004 (EF-003) |
| **Related Feature** | F002 |
| **Test Scenario** | Terjadi kesalahan server saat menyimpan data |
| **Preconditions** | Server dalam kondisi error |
| **Test Data** | Data produk valid |
| **Test Steps** | 1. Isi form dengan data valid<br>2. Klik tombol "Simpan"<br>3. Sistem mencoba menyimpan ke database |
| **Expected Result** | 1. Sistem mendapat error dari server<br>2. Sistem menampilkan pesan "Gagal menyimpan produk. Silakan coba lagi."<br>3. Modal form tetap terbuka (data tidak hilang) |
| **Type** | Exception |

---

## 3.3 Feature F003: Laporan Pendapatan & Stok Harian

---

#### TC-F003-001: Melihat Laporan Harian

| Field | Value |
| --- | --- |
| **TC ID** | TC-F003-001 |
| **Related UC** | UC-005 |
| **Related Feature** | F003 |
| **Test Scenario** | Kasir melihat laporan pendapatan dan stok harian |
| **Preconditions** | 1. Kasir sudah login (UC-001 selesai)<br>2. Ada data transaksi hari ini |
| **Test Data** | Minimal 1 transaksi hari ini |
| **Test Steps** | 1. Akses halaman Laporan Harian `/laporan/harian`<br>2. Sistem mengambil data transaksi hari ini<br>3. Sistem menampilkan KPI Cards<br>4. Sistem menampilkan tabel daftar transaksi<br>5. Lihat indikator stok barang |
| **Expected Result** | 1. KPI Cards menampilkan: Total Pendapatan, Jumlah Transaksi, Rata-rata Transaksi<br>2. Tabel daftar transaksi hari ini ditampilkan<br>3. Produk dengan stok menipis/habis (<= 5) ditampilkan dengan warna merah |
| **Type** | Positif |

---

#### TC-F003-002: Tidak Ada Transaksi Hari Ini

| Field | Value |
| --- | --- |
| **TC ID** | TC-F003-002 |
| **Related UC** | UC-005 (AF-001) |
| **Related Feature** | F003 |
| **Test Scenario** | Belum ada transaksi yang tercatat hari ini |
| **Preconditions** | Kasir sudah login, belum ada transaksi hari ini |
| **Test Data** | - |
| **Test Steps** | 1. Akses halaman Laporan Harian `/laporan/harian` |
| **Expected Result** | 1. KPI Cards menampilkan nilai 0 (Rupiah = Rp0, Transaksi = 0)<br>2. Tabel transaksi menampilkan "Tidak ada data" |
| **Type** | Negatif |

---

#### TC-F003-003: Melihat Detail Transaksi

| Field | Value |
| --- | --- |
| **TC ID** | TC-F003-003 |
| **Related UC** | UC-005 (AF-002) |
| **Related Feature** | F003 |
| **Test Scenario** | Kasir melihat detail transaksi tertentu |
| **Preconditions** | Minimal 1 transaksi tercatat hari ini |
| **Test Data** | - |
| **Test Steps** | 1. Akses halaman Laporan Harian<br>2. Klik baris transaksi di tabel |
| **Expected Result** | 1. Sistem menampilkan detail item yang dibeli<br>2. Detail mencakup: daftar produk, jumlah, subtotal per item<br>3. Data read-only (tidak bisa diubah) |
| **Type** | Positif |

---

#### TC-F003-004: Server Error Laporan Harian

| Field | Value |
| --- | --- |
| **TC ID** | TC-F003-004 |
| **Related UC** | UC-005 (EF-001) |
| **Related Feature** | F003 |
| **Test Scenario** | Terjadi kesalahan server saat mengambil data laporan harian |
| **Preconditions** | Server dalam kondisi error |
| **Test Data** | - |
| **Test Steps** | 1. Akses halaman Laporan Harian `/laporan/harian`<br>2. Sistem mencoba mengambil data dari server |
| **Expected Result** | 1. Sistem mendapat error dari server<br>2. Sistem menampilkan pesan "Gagal memuat laporan. Silakan coba lagi." |
| **Type** | Exception |

---

## 3.4 Feature F004: Laporan Pendapatan & Stok Bulanan

---

#### TC-F004-001: Melihat Laporan Bulanan

| Field | Value |
| --- | --- |
| **TC ID** | TC-F004-001 |
| **Related UC** | UC-006 |
| **Related Feature** | F004 |
| **Test Scenario** | Kasir melihat laporan pendapatan dan stok bulanan |
| **Preconditions** | 1. Kasir sudah login (UC-001 selesai)<br>2. Ada data laporan harian terakumulasi |
| **Test Data** | - |
| **Test Steps** | 1. Akses halaman Laporan Bulanan `/laporan/bulanan`<br>2. Sistem mengambil data laporan bulanan<br>3. Sistem menampilkan KPI Cards |
| **Expected Result** | 1. KPI Cards menampilkan: Total Pendapatan, Total Transaksi, Rata-rata Bulanan<br>2. Tabel rekap bulanan dengan kolom: Bulan, Transaksi, Pendapatan, Item Terjual<br>3. Data bersifat read-only |
| **Type** | Positif |

---

#### TC-F004-002: Filter Berdasarkan Bulan

| Field | Value |
| --- | --- |
| **TC ID** | TC-F004-002 |
| **Related UC** | UC-006 (AF-001) |
| **Related Feature** | F004 |
| **Test Scenario** | Kasir memfilter laporan berdasarkan bulan dan tahun tertentu |
| **Preconditions** | Ada data laporan untuk beberapa bulan |
| **Test Data** | Filter: Bulan = Juni, Tahun = 2026 |
| **Test Steps** | 1. Akses halaman Laporan Bulanan<br>2. Pilih bulan "Juni" dari dropdown<br>3. Pilih tahun "2026" dari dropdown |
| **Expected Result** | 1. Sistem memfilter data berdasarkan bulan dan tahun yang dipilih<br>2. Tabel hanya menampilkan data untuk Juni 2026<br>3. KPI Cards ter-update sesuai data bulan tersebut |
| **Type** | Positif |

---

#### TC-F004-003: Tidak Ada Data Bulanan

| Field | Value |
| --- | --- |
| **TC ID** | TC-F004-003 |
| **Related UC** | UC-006 (AF-002) |
| **Related Feature** | F004 |
| **Test Scenario** | Belum ada data laporan untuk bulan tertentu |
| **Preconditions** | Bulan yang dipilih belum memiliki data transaksi |
| **Test Data** | Filter: Bulan = Januari, Tahun = 2025 (belum ada data) |
| **Test Steps** | 1. Akses halaman Laporan Bulanan<br>2. Filter bulan Januari 2025 |
| **Expected Result** | 1. Tabel menampilkan "Tidak ada data"<br>2. KPI Cards menampilkan nilai 0 |
| **Type** | Negatif |

---

#### TC-F004-004: Server Error Laporan Bulanan

| Field | Value |
| --- | --- |
| **TC ID** | TC-F004-004 |
| **Related UC** | UC-006 (EF-001) |
| **Related Feature** | F004 |
| **Test Scenario** | Terjadi kesalahan server saat mengambil data laporan bulanan |
| **Preconditions** | Server dalam kondisi error |
| **Test Data** | - |
| **Test Steps** | 1. Akses halaman Laporan Bulanan `/laporan/bulanan`<br>2. Sistem mencoba mengambil data dari server |
| **Expected Result** | 1. Sistem mendapat error dari server<br>2. Sistem menampilkan pesan "Gagal memuat laporan. Silakan coba lagi." |
| **Type** | Exception |

---

# 4. TRACEABILITY MATRIX

## 4.1 Test Case to Requirement Traceability

| Feature ID | Feature Name | TC IDs |
| --- | --- | --- |
| F001 | Pencatatan Transaksi Penjualan & Cetak Struk | TC-F001-001 s.d. TC-F001-016 |
| F002 | Manajemen Stok (Tambah Barang Baru) | TC-F002-001 s.d. TC-F002-006 |
| F003 | Laporan Pendapatan & Stok Harian | TC-F003-001 s.d. TC-F003-004 |
| F004 | Laporan Pendapatan & Stok Bulanan | TC-F004-001 s.d. TC-F004-004 |

## 4.2 Test Case to Use Case Traceability

| Use Case ID | Use Case Name | TC IDs |
| --- | --- | --- |
| UC-001 | User Login | TC-F001-001 s.d. TC-F001-005 |
| UC-002 | Create Sales Transaction | TC-F001-006 s.d. TC-F001-012 |
| UC-003 | Print Receipt | TC-F001-013 s.d. TC-F001-016 |
| UC-004 | Add New Product | TC-F002-001 s.d. TC-F002-006 |
| UC-005 | View Daily Report | TC-F003-001 s.d. TC-F003-004 |
| UC-006 | View Monthly Report | TC-F004-001 s.d. TC-F004-004 |

## 4.3 Test Type Summary

| Type | Count |
| --- | --- |
| Positif | 11 |
| Negatif | 9 |
| Exception | 10 |
| **Total** | **30** |

---

# 5. TEST EXECUTION NOTES

## 5.1 Test Environment

| Component | Specification |
| --- | --- |
| Browser | Google Chrome, Mozilla Firefox, Microsoft Edge (latest versions) |
| OS | Windows / macOS / Linux |
| Printer | Thermal / Inkjet printer terhubung ke perangkat |
| Network | Koneksi internet stabil |

## 5.2 Test Data Setup

Sebelum eksekusi test case, pastikan data berikut tersedia di sistem:
- Minimal 1 akun Kasir terdaftar (username: `kasir01`, password: `password123`)
- Minimal 5 produk dengan variasi stok (termasuk produk dengan stok = 0)
- Minimal 3 transaksi untuk hari ini
- Data transaksi untuk bulan sebelumnya

## 5.3 Acronyms

| Acronym | Definition |
| --- | --- |
| TC | Test Case |
| UC | Use Case |
| F | Feature |
| AF | Alternative Flow |
| EF | Exception Flow |
| KPI | Key Performance Indicator |

---

# 6. REVISION HISTORY

| Version | Date | Author | Description |
| --- | --- | --- | --- |
| 0.1 | 2026-06-14 | System Analyst AI | Initial Draft |
