# User Flow Specification

Document Version: v0.1

Use Case ID: UC-002  
Use Case Name: Create Sales Transaction

Status: Draft  
Last Updated: 2026-06-14  
Author: System Analyst AI

---

# 1. OVERVIEW

## 1.1 Summary

Kasir memilih produk dari katalog, menambahkannya ke keranjang belanja, mengatur jumlah item, dan menyelesaikan transaksi penjualan.

## 1.2 Goal

Kasir ingin mencatat penjualan produk pelanggan dengan cepat dan akurasi.

## 1.3 Requirement References

|Requirement ID|Requirement Name|
|---|---|
|F001|Pencatatan Transaksi Penjualan|

## 1.4 Primary Actor

Kasir

## 1.5 Supporting Actors

Sistem POS

---

# 2. TRIGGER

Kasir berhasil login dan mengakses halaman POS Terminal (`/transaksi`).

---

# 3. PRECONDITIONS

|ID|Condition|
|---|---|
|PRE-001|Kasir sudah login (UC-001 selesai)|
|PRE-002|Ada produk yang terdaftar di sistem|
|PRE-003|Ada produk dengan stok > 0|

---

# 4. MAIN FLOW

| Step | Actor Action                                                 | System Response                                                              |
| ---- | ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 1    | Kasir mengakses halaman POS Terminal                         | Sistem menampilkan daftar produk aktif (katalog) dan panel keranjang belanja |
| 2    | Kasir mengklik produk yang akan dibeli                       | Sistem menambahkan produk ke keranjang dengan kuantitas 1                    |
| 3    | Sistem menampilkan item di keranjang dengan harga dan jumlah | Panel keranjang terupdate                                                    |
| 4    | Kasir mengklik tombol `+` untuk menambah kuantitas           | Sistem menambah kuantitas item +1 dan menghitung subtotal                    |
| 5    | Kasir mengklik tombol `-` untuk mengurangi kuantitas         | Sistem mengurangi kuantitas item -1                                          |
| 6    |                                                              | Jika kuantitas < 1, sistem menghapus item dari keranjang                     |
| 7    | Sistem menampilkan total tagihan secara real-time            | Total harga terupdate otomatis                                               |
| 8    | Kasir mengklik tombol "Bayar" atau menekan Ctrl+B            | Sistem menampilkan dialog konfirmasi pembayaran                              |

---

# 5. ALTERNATIVE FLOWS

## AF-001: Produk Habis (Stok = 0)

### Condition

Ketika Kasir mencoba menambahkan produk dengan stok 0.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengklik produk dengan stok 0|Sistem tidak menambahkan produk ke keranjang|
|2||Sistem menampilkan indikator visual "Habis" pada kartu produk|

---

## AF-002: Menggunakan Pencarian Produk

### Condition

Ketika Kasir ingin mencari produk tertentu.

### Flow

| Step | Actor Action                                       | System Response                                       |
| ---- | -------------------------------------------------- | ----------------------------------------------------- |
| 1    | Kasir menekan ctlr+C atau mengklik kolom pencarian | Fokus berpindah ke kolom pencarian produk             |
| 2    | Kasir mengetik nama produk                         | Sistem menampilkan produk yang cocok dengan pencarian |
| 3    | Kasir mengklik produk dari hasil pencarian         | Produk ditambahkan ke keranjang                       |

---

## AF-003: Mengosongkan Keranjang

### Condition

Ketika Kasir ingin menghapus semua item dari keranjang.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengklik tombol hapus pada setiap item|Item dihapus dari keranjang satu per satu|
|2||Keranjang kosong, tombol "Bayar" dinonaktifkan|

---

# 6. EXCEPTION FLOWS

## EF-001: Stok Tidak Cukup

### Condition

Ketika kuantitas item di keranjang melebihi stok yang tersedia.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengklik tombol `+` untuk menambah kuantitas|Sistem memeriksa stok yang tersedia|
|2||Jika kuantitas > stok: sistem menampilkan pesan "Stok tidak cukup"|
|3||Kuantitas tidak bertambah|

---

## EF-002: Keranjang Kosong Saat Bayar

### Condition

Ketika Kasir mengklik tombol "Bayar" tetapi keranjang kosong.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengklik tombol "Bayar"|Tombol "Bayar" dinonaktifkan (disabled)|
|2||Tidak ada dialog pembayaran yang muncul|

---

# 7. POSTCONDITIONS

|ID|Condition|
|---|---|
|POST-001|Transaksi tercatat di sistem|
|POST-002|Stok produk berkurang sesuai jumlah yang dibeli|
|POST-003|Keranjang dikosongkan setelah transaksi selesai|

---

# 8. BUSINESS RULES

|Rule ID|Description|
|---|---|
|BR-001|Produk dengan stok 0 tidak dapat dimasukkan ke keranjang|
|BR-002|Pengurangan kuantitas < 1 otomatis menghapus item dari keranjang|
|BR-003|Total tagihan dihitung otomatis secara real-time|
|BR-004|Stok berkurang tepat setelah transaksi selesai/dicetak|

---

# 9. RELATED PAGES

|Page ID|Page Name|
|---|---|
|PAGE-002|POS Terminal (Transaksi)|

---

# 10. DATA USAGE

## 10.1 Data Read

|Entity|Description|
|---|---|
|Product|Mengambil daftar produk beserta harga dan stok|

---

## 10.2 Data Created

|Entity|Description|
|---|---|
|Transaction|Membuat data transaksi penjualan baru|
|TransactionDetail|Membuat rincian item per transaksi|

---

## 10.3 Data Updated

|Entity|Description|
|---|---|
|Product|Memperbarui jumlah stok setelah transaksi|

---

## 10.4 Data Deleted

|Entity|Description|
|---|---|
|None|Tidak ada data yang dihapus|

---

# 11. PERMISSIONS

|Role|Access|
|---|---|
|Kasir|AKSI (ALLOWED)|

---

# 12. ACCEPTANCE CRITERIA

|AC ID|Description|
|---|---|
|AC-001|Kasir dapat melihat daftar produk dengan harga dan stok|
|AC-002|Kasir dapat menambahkan produk ke keranjang dengan satu klik|
|AC-003|Kasir dapat menambah/mengurangi kuantitas item dengan tombol +/-|
|AC-004|Total tagihan terhitung otomatis saat perubahan item|
|AC-005|Produk dengan stok 0 tidak dapat ditambahkan ke keranjang|
|AC-006|Item terhapus otomatis jika kuantitas < 1|

---

# 13. TRACEABILITY

## Requirement Traceability

|Requirement ID|
|---|
|F001|

## Information Architecture Traceability

|Page ID|
|---|
|PAGE-002|

---

# 15. REVISION HISTORY

|Version|Date|Author|Description|
|---|---|---|---|
|0.1|2026-06-14|System Analyst AI|Initial Draft|
