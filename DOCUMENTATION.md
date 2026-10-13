# Dokumentasi Undangan Pernikahan Digital - Lukas & Kezia 💍

Undangan pernikahan digital ini dirancang dengan gaya minimalis, modern, dan sangat estetis (*sage green watercolor theme*). Aplikasi ini dibangun menggunakan teknologi web standar (HTML5, CSS3, dan Vanilla Javascript) serta dioptimalkan khusus untuk peramban mobile (rasio aspek 9:16) agar memberikan pengalaman seperti aplikasi *native* di HP.

---

## 🌟 Fitur Utama

### 1. Desain Responsif & Efek *Liquid Glass*
* **Tinggi Penuh Stabil (100dvh):** Kontainer kartu undangan di mobile terkunci seukuran layar penuh menggunakan reset tinggi persentase (`html, body { height: 100% }`) untuk mencegah bug celah kosong di iOS Safari.
* **Integrasi Bar Browser:** Menggunakan tag `<meta name="theme-color" content="#3b5d3b">` dan warna latar belakang `body` sage gelap. Ini membuat bar status atas dan bar alamat bawah Safari menyatu mulus (*Liquid Glass bleed-through*).
* **Bunga Pojok Statis:** Elemen bunga mengambang (`top_flower.webp`, `element_left.png`, `element_right.png`) terikat secara absolut pada sudut kontainer utama, terpotong rapi mengikuti kelengkungan sudut kontainer (*border-radius*), dan tidak ikut tergulir saat halaman di-scroll.

### 2. Galeri Polaroid Stack Deck
* **Tumpukan Organik:** Foto galeri disajikan dalam bentuk tumpukan kartu Polaroid yang miring secara acak.
* **Auto-Cycle:** Kartu berputar otomatis ke belakang setiap **4 detik**. Jika kartu disentuh/diketuk manual, pengukur waktu akan direset ulang agar tidak mengganggu interaksi tamu.
* **Lightbox Zoom:** Mengetuk bagian tengah foto akan membuka gambar secara penuh. Ketika Lightbox terbuka, fungsi gulir halaman utama otomatis dikunci agar stabil.

### 3. Keamanan Tautan, Privasi Tamu & Validasi Database Supabase
* **URL Parameter Ramah Pengguna:** Menggunakan parameter nama biasa, misalnya: `?invite=Rubin Kurnianto` (juga tetap mendukung tautan Base64 lama untuk kompatibilitas).
* **Validasi Real-time ke Supabase:**
  1. Nama tamu dicocokkan secara otomatis ke tabel `guests` di Supabase (*case-insensitive*).
  2. Jika tautan diakses tanpa nama atau nama tidak terdaftar di database:
     * Halaman landing menampilkan peringatan: *⚠️ Tautan Undangan Tidak Valid*.
     * Elemen utama undangan (`#mainContainer`) akan **dihapus secara fisik dari DOM HTML**.
  3. **Tipe Tamu (Undangan vs Pengumuman):**
     * **Undangan:** Menampilkan seluruh section lengkap (Pemberkatan, Resepsi, Hitung Mundur, Kado Pernikahan & QRIS, Doa Restu).
     * **Pengumuman:** Otomatis menyembunyikan section **Resepsi** dan **Kado Pernikahan** (`.for-undangan-only`). Tamu tidak bisa memodifikasi URL sendiri karena tipe ditentukan langsung dari database.

### 4. Sistem Ucapan & Doa Restu Terintegrasi
* Tamu dapat mengirimkan ucapan doa restu yang langsung tersimpan di tabel `wishes` Supabase.
* Formulir ucapan otomatis terkunci dengan nama tamu terdaftar untuk mencegah manipulasi nama.

---

## 🛠️ Dashboard Admin & WhatsApp Sender (`admin.html`)

Aplikasi dilengkapi dengan panel admin modern bertema *Sage Green Luxury Glassmorphism* ([admin.html](admin.html)):
* **Spreadsheet Grid Editor (Input Cepat Massal):**
  * Tampilan tabel interaktif bergaya Excel / Google Sheets di mana Anda bisa langsung mengetik dan mengedit data nama, no HP, tipe, relasi, dan pihak langsung pada sel tabel tanpa perlu popup satu per satu.
  * Dukungan **Copy-Paste Massal dari Excel / Sheets**: Cukup salin beberapa baris dari Excel lalu klik tombol *Paste dari Excel*.
  * Navigasi keyboard pintar: Tekan **Enter** untuk langsung pindah ke baris berikutnya atau otomatis membuat baris baru.
  * Pintasan cepat simpan: Tekan **Ctrl + S** untuk menyimpan seluruh perubahan sekaligus ke Supabase.
* **Dashboard Statistik:** Menghitung total tamu, tipe undangan vs pengumuman, rasio kirim (progress bar), serta rincian per pihak pengundang dan relasi.
* **Smart Template WhatsApp:**
  * Secara cerdas memilih format pesan yang tepat:
    1. *Undangan Formal* (Keluarga, rekan kerja orang tua).
    2. *Undangan Santai* (Teman sebaya).
    3. *Pengumuman Santai* (Sesuai teks hangat Lukas & Kezia).
    4. *Pengumuman Formal*.
  * Dilengkapi pratinjau bubble chat WhatsApp langsung dan dukungan placeholder `{Nama}`, `{URL}`, `{Pihak}`, `{Relasi}`.
* **Aksi Sekali Klik:** Tombol **Kirim WA** yang otomatis membuka WhatsApp dan mengubah status tamu menjadi `Terkirim` di Supabase.
* **Import & Export CSV:** Memungkinkan migrasi atau backup data tamu dalam jumlah banyak sekaligus.

* **Sidebar Navigasi Modern & Rapi:**
  * Sidebar tetap di sebelah kiri mengelompokkan fitur dengan rapi:
    1. **Dashboard:** Donut Chart jenis undangan, 4 Kartu KPI (Pesan Terkirim, Belum Terkirim, Total Tamu, Doa Restu Masuk), serta Stacked Bar Chart alokasi kuota per pihak pengundang.
    2. **Data Tamu:** Spreadsheet Grid Editor untuk input dan pengeditan cepat bergaya Excel serta copy-paste massal.
    3. **Kirim Pesan:** Tabel broadcast WhatsApp dengan 1-klik kirim, penyaringan multi-kategori, dan editor template pesan.
    4. **Doa Restu:** Feed live ucapan selamat dan doa restu yang masuk dari tamu via website (dengan badge counter).
* **Rekap Kuota Pax & Katering:**
  * Setiap data tamu memiliki kolom **Pax** (jumlah orang, default: 1).
  * Sangat berguna untuk undangan grup seperti teman sekolah, teman kerja, atau keluarga besar yang diundang dalam satu nama kontak tetapi mewakili banyak kursi/porsi katering (misal: 10 atau 15 pax).
  * Dashboard menghitung otomatis: Total Estimasi Pax, Pax Resepsi (Katering fisik + digital), Pax Pengumuman, dan toggle grafik Stacked Bar Chart per Pihak Pengundang (Hitung Pax vs Hitung Kontak).
* **3 Kategori Undangan:**
  * `undangan_digital` (Undangan Digital - Akses penuh web & WA)
  * `undangan_fisik` (Undangan Fisik - Kartu cetak resmi)
  * `pengumuman` (Pengumuman Saja - Hanya pemberkatan & doa)

---

## 🗄️ Skema Database Supabase

Jalankan script berikut pada menu **SQL Editor** di Supabase Anda:

```sql
-- 1. TABEL TAMU (GUESTS)
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  pax integer not null default 1,
  type text not null default 'undangan_digital' check (type in ('undangan_digital', 'undangan_fisik', 'pengumuman', 'undangan')),
  relation text not null default 'Lainnya',
  sender text not null default 'Lukas',
  status text not null default 'pending' check (status in ('pending', 'terkirim')),
  sent_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create index idx_guests_name_lower on public.guests (lower(name));

-- JIKA TABEL SUDAH DIBUAT SEBELUMNYA, JALANKAN PERINTAH ALTER BERIKUT:
-- 1. Tambah kolom pax
alter table public.guests add column if not exists pax integer default 1;

-- 2. Perbarui check constraint untuk 3 kategori
alter table public.guests drop constraint if exists guests_type_check;
alter table public.guests add constraint guests_type_check 
  check (type in ('undangan_digital', 'undangan_fisik', 'pengumuman', 'undangan'));

-- 2. TABEL UCAPAN & DOA RESTU (WISHES)
create table public.wishes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  created_at timestamp with time zone default now()
);

-- 3. POLICIES (RLS)
alter table public.guests enable row level security;
alter table public.wishes enable row level security;

create policy "Allow read guests" on public.guests for select using (true);
create policy "Allow modify guests" on public.guests for all using (true);
create policy "Allow read wishes" on public.wishes for select using (true);
create policy "Allow insert wishes" on public.wishes for insert with check (true);
```

---

## ⚙️ Cara Menghubungkan Supabase
Buka berkas [supabaseConfig.js](supabaseConfig.js) lalu masukkan kredensial proyek Supabase Anda:
```javascript
const SUPABASE_CONFIG = {
  url: "https://YOUR_PROJECT_ID.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_KEY",
};
```
*(Selama belum diisi key asli, sistem tetap dapat dicoba dengan mode demonstrasi lokal).*
