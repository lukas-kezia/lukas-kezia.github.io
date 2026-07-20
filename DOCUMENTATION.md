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

### 3. Keamanan Tautan & Privasi Tamu (`invite`)
* **URL Parameter Khusus:** Menggunakan parameter `?invite=...` berbasis enkripsi Base64 URL-Safe untuk menyembunyikan nama tamu di bilah alamat browser.
* **Proteksi Akses Tanpa Izin:** Jika tautan diakses tanpa parameter `invite` atau dengan kode yang tidak valid:
  1. Halaman landing akan menampilkan pesan kesalahan: *⚠️ Tautan Undangan Tidak Valid*.
  2. Elemen utama undangan (`#mainContainer`) akan **dihapus secara fisik dari DOM HTML** melalui Javascript untuk mencegah pembongkaran kode/inspeksi elemen.

### 4. Pencegah Gangguan Gestur Layar
* **Anti Zooming:** Blokir zoom viewport ganda (`maximum-scale=1.0, user-scalable=no`) dan penambahan `touch-action: pan-y;` pada kontainer utama. Halaman tidak akan berantakan meskipun tamu tidak sengaja melakukan ketuk-ganda (*double-tap*).
* **Isolasi Scroll Ucapan (Anti Flick):** Area daftar ucapan doa restu dilengkapi filter `overscroll-behavior-y: contain` dan pemutus rambatan sentuhan (`touchstart`, `touchmove`, `touchend`) bersyarat pada batas atas/bawah. Tamu dapat men-scroll daftar pesan dengan sangat lancar tanpa takut tidak sengaja melompat ke section undangan lain.

---

## 🛠️ Alat Bantu Kirim Undangan WhatsApp

Untuk mempermudah pengiriman tautan undangan secara massal atau pribadi, telah disediakan berkas template Excel di folder utama proyek Anda:
* **Berkas Excel:** [Daftar_Undangan_Whatsapp_Formula.xlsx](Daftar_Undangan_Whatsapp_Formula.xlsx)
* **Skrip Generator (Python):** [generate_excel.py](generate_excel.py) (Jalankan dengan perintah `python generate_excel.py` untuk me-refresh template).

### Cara Mengaktifkan Formula Konversi Otomatis:
Di dalam berkas Excel tersebut, kolom URL Undangan menggunakan fungsi `=ENCODE_BASE64(B5)`. Agar fungsi ini aktif saat Anda menambahkan nama baru di Kolom B, ikuti langkah berikut:

#### Opsi A: Di Google Sheets (Direkomendasikan)
1. Unggah berkas Excel ke Google Drive dan buka di Google Sheets.
2. Buka menu **Ekstensi** $\rightarrow$ **Apps Script**.
3. Hapus kode bawaan, lalu masukkan kode berikut:
   ```javascript
   function ENCODE_BASE64(text) {
     if (!text) return "";
     var bytes = Utilities.newBlob(text).getBytes();
     return Utilities.base64EncodeWebSafe(bytes);
   }
   ```
4. Simpan proyek Apps Script. Rumus konversi nama menjadi Base64 akan otomatis aktif!

#### Opsi B: Di Microsoft Excel Desktop (Windows/Mac)
1. Buka berkas Excel, tekan `ALT + F11` untuk membuka editor VBA.
2. Klik **Insert** $\rightarrow$ **Module**.
3. Tempel kode VBA berikut:
   ```vba
   Function ENCODE_BASE64(text As String) As String
       Dim arrData() As Byte
       arrData = StrConv(text, vbFromUnicode)
       Dim objXML As Object, objNode As Object
       Set objXML = CreateObject("MSXML2.DOMDocument.3.0")
       Set objNode = objXML.createElement("b64")
       objNode.DataType = "bin.base64"
       objNode.nodeTypedValue = arrData
       ENCODE_BASE64 = Replace(Replace(Replace(objNode.text, vbLf, ""), vbCr, ""), "=", "")
   End Function
   ```
4. Tutup editor VBA dan simpan berkas Anda sebagai format **Excel Macro-Enabled Workbook (`.xlsm`)**.

---

## 🚀 Panduan Publikasi (Deployment)

1. **Unggah ke GitHub:**
   Pastikan seluruh perubahan berkas (`CobaUnd_Mono.html`, folder `undangan`, dll.) di-commit dan di-push ke repositori GitHub Anda.
2. **Aktifkan GitHub Pages:**
   * Masuk ke menu **Settings** repositori Anda di GitHub.
   * Pilih menu **Pages** di kolom sebelah kiri.
   * Pada bagian *Build and deployment*, pilih branch `main` (atau `master`) dan folder `/ (root)`. Klik **Save**.
   * Tunggu sekitar 1-2 menit. Undangan Anda akan aktif secara publik di alamat:  
     `https://[username-github].github.io/CobaUnd_Mono.html`
