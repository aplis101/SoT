# User Flow Specification

Document Version: v0.1

Use Case ID: UC-001  
Use Case Name: User Login

Status: Draft  
Last Updated: 2026-06-14  
Author: System Analyst AI

---

# 1. OVERVIEW

## 1.1 Summary

Kasir mengakses aplikasi dan melakukan autentikasi menggunakan username dan password untuk mendapatkan akses ke sistem POS.

## 1.2 Goal

Kasir ingin masuk ke dalam sistem agar dapat mengakses fitur transaksi, manajemen stok, dan laporan.

## 1.3 Requirement References

|Requirement ID|Requirement Name|
|---|---|
|F001|Pencatatan Transaksi Penjualan (prerequisite access)|
|NFR-6.2|Security - Autentikasi|

## 1.4 Primary Actor

Kasir

## 1.5 Supporting Actors

Sistem Autentikasi

---

# 2. TRIGGER

Kasir mengakses URL utama aplikasi atau URL `/login` tanpa sesi login aktif.

---

# 3. PRECONDITIONS

|ID|Condition|
|---|---|
|PRE-001|Kasir memiliki akun yang terdaftar di sistem|
|PRE-002|Aplikasi dapat diakses melalui browser|

---

# 4. MAIN FLOW

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir membuka aplikasi melalui browser|Sistem menampilkan halaman Login dengan form input username dan password|
|2|Kasir memasukkan username dan password|Sistem memvalidasi input (tidak kosong)|
|3|Kasir mengklik tombol "Masuk"|Sistem mengirimkan kredensial ke backend untuk validasi|
|4||Sistem backend memverifikasi username dan password|
|5||Sistem berhasil login: redirect ke halaman `/transaksi` (POS Terminal)|

---

# 5. ALTERNATIVE FLOWS

## AF-001: Login dengan Kredensial Salah

### Condition

Ketika username atau password yang dimasukkan tidak sesuai.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengklik tombol "Masuk"|Sistem mengirimkan kredensial ke backend|
|2||Sistem backend menolak: username atau password salah|
|3||Sistem menampilkan pesan error "Username atau password salah" di bawah form|
|4|Kasir memasukkan ulang kredensial yang benar|Sistem kembali ke step 2 pada Main Flow|

---

## AF-002: Input Kosong

### Condition

Ketika Kasir mengklik tombol "Masuk" tanpa mengisi username atau password.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengklik tombol "Masuk"|Sistem menampilkan validasi error "Username harus diisi" dan/atau "Password harus diisi"|
|2|Kasir memasukkan data yang kosong|Kasir harus mengisi field yang kosong|

---

# 6. EXCEPTION FLOWS

## EF-001: Server Tidak Dapat Dihubungi

### Condition

Ketika backend server atau database tidak dapat diakses.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengklik tombol "Masuk"|Sistem mencoba mengirim request ke backend|
|2||Sistem timeout atau mendapat error koneksi|
|3||Sistem menampilkan pesan "Terjadi kesalahan koneksi. Silakan coba lagi."|

---

## EF-002: Sesi Login Sudah Aktif

### Condition

Ketika Kasir sudah login dan mencoba mengakses halaman login.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengakses URL `/login`|Sistem mendeteksi sesi aktif|
|2||Sistem redirect ke halaman `/transaksi` (POS Terminal)|

---

# 7. POSTCONDITIONS

|ID|Condition|
|---|---|
|POST-001|Kasir berhasil login dan memiliki sesi aktif|
|POST-002|Kasir dapat mengakses semua fitur yang diizinkan|
|POST-003|Token sesi tersimpan di browser (HttpOnly Cookie)|

---

# 8. BUSINESS RULES

|Rule ID|Description|
|---|---|
|BR-001|Username dan password harus sesuai dengan data di database|
|BR-002|Sesi login aktif selama browser terbuka atau timeout|
|BR-003|Tidak ada batasan jumlah percobaan login (untuk MVP)|

---

# 9. RELATED PAGES

|Page ID|Page Name|
|---|---|
|PAGE-001|Login|
|PAGE-002|POS Terminal (Transaksi)|

---

# 10. DATA USAGE

## 10.1 Data Read

|Entity|Description|
|---|---|
|User|Memverifikasi username dan password|

---

## 10.2 Data Created

|Entity|Description|
|---|---|
|Session|Membuat sesi login baru|

---

## 10.3 Data Updated

|Entity|Description|
|---|---|
|None|Tidak ada data yang diupdate|

---

## 10.4 Data Deleted

|Entity|Description|
|---|---|
|None|Tidak ada data yang dihapus|

---

# 11. PERMISSIONS

|Role|Access|
|---|---|
|Guest|AKSI (ALLOWED)|
|Kasir|AKSI (ALLOWED)|

---

# 12. ACCEPTANCE CRITERIA

|AC ID|Description|
|---|---|
|AC-001|Kasir dapat melihat form login dengan username dan password field|
|AC-002|Kasir dapat memasukkan kredensial dan mengklik tombol "Masuk"|
|AC-003|Sistem menampilkan pesan error jika kredensial salah|
|AC-004|Sistem redirect ke `/transaksi` setelah login berhasil|
|AC-005|Halaman login tidak menampilkan sidebar navigation|

---

# 13. TRACEABILITY

## Requirement Traceability

|Requirement ID|
|---|
|F001|
|NFR-6.2|

## Information Architecture Traceability

|Page ID|
|---|
|PAGE-001|

---

# 15. REVISION HISTORY

|Version|Date|Author|Description|
|---|---|---|---|
|0.1|2026-06-14|System Analyst AI|Initial Draft|
