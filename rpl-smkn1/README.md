# RPL SMK Negeri 1 Bukit Sundi

Website Rekayasa Perangkat Lunak menggunakan Next.js App Router, TypeScript,
Tailwind CSS, Supabase PostgreSQL/Storage, dan Lucide icons.

## Menyiapkan Supabase

1. Buat proyek Supabase baru.
2. Buka **SQL Editor**, lalu jalankan seluruh file dalam
   [`supabase/migrations/`](./supabase/migrations/) secara berurutan:
   `0001_cms.sql`, `0002_faq_reordering.sql`, `0003_teachers.sql`, lalu
   `0004_admin_management.sql`. Migrasi membuat tabel admin/sesi, percobaan
   login, galeri, FAQ, artikel, guru, kebijakan RLS, trigger
   timestamps, bucket publik `rpl-cms` khusus gambar, dan pengurutan FAQ atomik.
3. Salin `.env.example` menjadi `.env.local`, kemudian isi nilai dari
   **Project Settings → API**:

   ```env
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_ANON_KEY=<publishable-or-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<secret-service-role-key>
   ```

   Jangan pernah menggunakan awalan `NEXT_PUBLIC_` untuk service-role key.
   Jangan commit `.env.local`, kredensial, atau password admin.
4. Jalankan `npm install`, kemudian buat akun pertama lewat bootstrap CLI.
   Masukkan nilai secara interaktif agar password tidak masuk ke riwayat shell:

   ```powershell
   $env:CMS_ADMIN_EMAIL = Read-Host "Email admin"
   $env:CMS_ADMIN_USERNAME = Read-Host "Username admin"
   $secure = Read-Host "Password admin (minimal 12 karakter)" -AsSecureString
   $env:CMS_ADMIN_PASSWORD = [System.Net.NetworkCredential]::new("", $secure).Password
   npm run admin:create
   Remove-Item Env:\CMS_ADMIN_PASSWORD,Env:\CMS_ADMIN_EMAIL,Env:\CMS_ADMIN_USERNAME
   ```

   CLI melakukan hashing bcrypt (12 rounds) sebelum menyimpan admin. Password
   minimal 12 karakter dan maksimal 72 byte UTF-8. Untuk mengubah akun, jalankan
   kembali dengan email yang sama. Jangan jalankan bootstrap di workflow
   deployment.
5. Jalankan `npm run dev`, lalu buka `/admin/login`.

## Deployment ke Vercel

Tambahkan ketiga environment variable di **Project Settings → Environment
Variables** untuk deployment yang dipilih. Jalankan migrasi sekali di Supabase,
lalu bootstrap akun admin dari komputer tepercaya dengan kredensial Supabase
service role. Deploy ulang setelah konfigurasi. Service-role key memberi hak
istimewa penuh: jaga sebagai secret server-only, batasi akses dashboard proyek,
dan rotasi bila pernah terpapar.

## CMS

- `/admin/login`, `/admin/dashboard`, `/admin/gallery`, `/admin/faq`,
  `/admin/articles`, `/admin/teachers`, dan `/admin/admins` (khusus superadmin).
- Akun admin dikelola oleh superadmin dari `/admin/admins`. Admin baru dibuat
  dengan password minimal 12 karakter yang langsung di-hash bcrypt; daftar
  dan detail akun tidak pernah mengirim hash password atau data sesi. Migrasi
  `0004_admin_management.sql` menambahkan role, nama lengkap, menjadikan akun
  aktif tertua sebagai superadmin awal jika belum ada superadmin aktif, serta
  menjaga agar superadmin aktif terakhir tidak dapat diturunkan atau dinonaktifkan.
- Sesi opaque acak disimpan sebagai hash SHA-256 di database; cookie sesi
  `httpOnly`, `SameSite=Strict`, `Secure` di production, berlaku 12 jam, dan
  dihapus di database saat logout.
- Semua endpoint pengubahan konten memeriksa sesi dan origin same-site. Login
  memiliki rate limit lima kegagalan per kombinasi email/IP selama 15 menit.
- Validasi server menggunakan Zod; SQL memakai query builder Supabase; RLS
  membatasi bacaan anonim ke konten terbit dan menolak operasi tulis klien.
- Upload gambar hanya menerima JPEG, PNG, WebP, AVIF, memeriksa signature file,
  dan membatasi ukuran 5 MB. Bucket membaca aset publik; upload/penghapusan
  hanya melalui endpoint admin terautentikasi.
- Profil guru dikelola melalui `/admin/teachers`; jalankan migrasi
  `0003_teachers.sql` sebelum membuka halaman tersebut. Foto profil tersimpan
  pada bucket `rpl-cms` di folder `teachers/`, dan hanya
  profil berstatus terbit yang ditampilkan di bagian Guru situs publik.
- Artikel menggunakan editor teks sederhana; isi ditampilkan sebagai teks,
  bukan HTML mentah, untuk menghindari XSS.
- Hanya FAQ/galeri/artikel berstatus publikasi yang diambil untuk situs publik.
  Perubahan ditampilkan pada request berikutnya (tanpa cache konten publik).

## Validasi dan menjalankan

```bash
npm run lint
npm run build
npm run dev
```

Tanpa konfigurasi Supabase, halaman publik tetap dapat dibuka dan menampilkan
pesan bahwa CMS belum dikonfigurasi. Halaman `/admin/login` juga tetap dapat
dibuka, tetapi login akan menampilkan pesan layanan belum siap. Dashboard,
penyimpanan database, dan upload Storage memerlukan kredensial serta migrasi
Supabase yang valid; alur penyimpanan persisten tidak dapat diuji sampai proyek
tersebut disiapkan.

## Struktur

- `app/page.tsx` — beranda dan konten publik dinamis.
- `app/artikel/[slug]/page.tsx` — halaman baca artikel terbit.
- `app/admin/` — login, dashboard, dan pengelolaan CMS responsif.
- `app/api/admin/` — endpoint login/sesi, CRUD, pencarian, filter, pagination,
  serta upload.
- `lib/` — klien Supabase, sesi, validasi, dan pembacaan konten publik.
- `supabase/migrations/` — skema PostgreSQL dan aturan RLS/Storage.
- `scripts/create-admin.mjs` — bootstrap akun admin ber-hash bcrypt.

Nama, peran lima guru, deskripsi RPL, alamat, email, serta tautan sekolah dan
Instagram mengikuti konten yang terlihat pada situs referensi. Rute `/about`
referensi mengembalikan 404; FAQ, galeri, artikel, dan foto pengajar tidak
termuat. Konten CMS tidak memakai data dummy dan akan kosong sampai admin
menerbitkannya.
