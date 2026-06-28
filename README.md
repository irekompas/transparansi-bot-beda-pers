# Transparansi Bot Beda Pers

Chatbot dwibahasa Indonesia–Inggris yang membaca data transparansi editorial dari Google Spreadsheet. Aplikasi ini statis, responsif, dan siap dipasang melalui iframe.

## Format Google Sheet

Ubah Sheet menjadi tiga kolom berikut:

| kunci | indonesia | english |
|---|---|---|
| judul | Judul dalam bahasa Indonesia | English title |
| nama_reporter | Nama penulis | Writer name |
| profil_penulis | Profil penulis dalam bahasa Indonesia | Writer profile in English |
| metode_verifikasi | Penjelasan verifikasi | Verification explanation |

Baris pertama wajib berisi `kunci`, `indonesia`, dan `english`. Nama pada kolom `kunci` tidak diterjemahkan.

### Contoh tulisan penulis (opsional)

Tambahkan pasangan baris berikut untuk setiap contoh tulisan:

| kunci | indonesia | english |
|---|---|---|
| contoh_tulisan_1_judul | Judul Indonesia | English title |
| contoh_tulisan_1_link | https://... | https://... |
| contoh_tulisan_2_judul | Judul Indonesia | English title |
| contoh_tulisan_2_link | https://... | https://... |

Bagian ini boleh dilewati. Jika tidak ada baris contoh tulisan, bot hanya menampilkan profil penulis. Nomor dapat dilanjutkan menjadi `3`, `4`, dan seterusnya.

Setelah Sheet diubah, pastikan **File → Bagikan → Publikasikan ke web** masih aktif. URL CSV publik disimpan di `config.js`.

## Deploy

Unggah ulang seluruh file ke repository GitHub yang sama. Vercel akan membuat deployment baru secara otomatis.

## Memasang dengan iframe

Ganti URL berikut dengan URL produksi Vercel:

```html
<iframe
  src="https://nama-proyek.vercel.app"
  title="Transparansi Bot Beda Pers"
  width="100%"
  height="760"
  loading="lazy"
  style="border:0;border-radius:20px;overflow:hidden"
></iframe>
```

Jika area ICM sempit, tinggi `700`–`800` piksel biasanya nyaman. Pada layar kecil, bot otomatis memenuhi area iframe.

Tambahkan `?lang=en` pada URL untuk membuka iframe langsung dalam bahasa Inggris, atau `?lang=id` untuk bahasa Indonesia.
