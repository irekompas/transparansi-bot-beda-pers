# SheetBot

Chatbot web sederhana yang mengambil data transparansi berita dari Google Spreadsheet. Tidak membutuhkan backend atau instalasi paket.

## Spreadsheet yang digunakan

Proyek sudah terhubung ke spreadsheet publik melalui URL CSV di `config.js`. Struktur yang dipakai adalah dua kolom vertikal:

   | Nama field | Nilai |
   |---|---|---|
   | judul | Beda Nasib Pers Australia-Indonesia |
   | nama_reporter | Irene Sarwindaningrum |
   | metode_verifikasi | Menggunakan data dari... |

Bot juga mendukung format FAQ tiga kolom dengan header `Pertanyaan`, `Jawaban`, dan `Kata Kunci`.

Untuk mengganti Sheet, publikasikan lewat **File → Bagikan → Publikasikan ke web**, lalu ubah URL `pubhtml` menjadi `pub?output=csv` dan tempel di `config.js`:

   ```js
   sheetUrl: "https://docs.google.com/spreadsheets/d/e/.../pub?output=csv",
   ```

Spreadsheet harus tetap dipublikasikan agar Vercel dan browser pengunjung bisa membacanya tanpa login. Jangan masukkan data pribadi atau rahasia.

## Menjalankan

Karena browser membatasi pengambilan data saat file dibuka langsung, jalankan server lokal dari folder proyek:

```bash
python3 -m http.server 8080
```

Lalu buka <http://localhost:8080>.

## Deploy dengan GitHub dan Vercel

1. Commit folder ini ke branch GitHub Anda lalu push.
2. Di Vercel, pilih **Add New → Project** dan impor repository tersebut.
3. Biarkan **Framework Preset** sebagai `Other` dan **Output Directory** kosong.
4. Klik **Deploy**. Tidak diperlukan environment variable atau build command.

## Pengaturan

Semua pengaturan ada di `config.js`: URL Sheet, nama bot, pesan pembuka, pesan fallback, jumlah saran, dan ambang kecocokan. Bila Sheet gagal dimuat, aplikasi otomatis memakai data demo.

Bot ini menggunakan pencocokan kata, bukan AI generatif. Jawaban selalu berasal dari nilai yang tersedia di spreadsheet.
