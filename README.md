# Aksara Buana — Sistem Manajemen Pengantaran

Aplikasi web internal untuk manajemen sopir pengantaran dan pelacakan lokasi real-time.

---

## Fitur Utama

- **Dispatcher (Admin):** Buat & tugaskan pengantaran, lihat posisi sopir di peta live, review checklist, tambah tujuan tambahan (B→C) saat sopir masih dalam perjalanan.
- **Sopir (Driver):** Isi checklist pra-perjalanan, mulai perjalanan (GPS aktif), isi checklist pasca-pengantaran, upload foto bukti & invoice, tanda tangan digital.
- **PWA:** Sopir bisa install di HP seperti aplikasi native (Add to Home Screen).
- **Offline-tolerant:** Lokasi disimpan di perangkat saat sinyal hilang, otomatis dikirim saat online kembali.

---

## Prasyarat

- Node.js 18+
- Akun Supabase (gratis di supabase.com)
- Akun Vercel (gratis di vercel.com)

---

## Setup: Langkah Demi Langkah

### 1. Buat Proyek Supabase

1. Buka [supabase.com](https://supabase.com) → **New Project**.
2. Catat **Project URL** dan **anon public key** dari Settings → API.

### 2. Jalankan Skema Database

1. Di dashboard Supabase, buka **SQL Editor**.
2. Copy-paste isi file `supabase/schema.sql` → klik **Run**.
3. Copy-paste isi file `supabase/storage.sql` → klik **Run**.
4. Copy-paste isi file `supabase/seed.sql` → klik **Run** (ini membuat template checklist default).

### 3. Aktifkan Realtime

Di Supabase Dashboard → **Database → Replication** → pastikan tabel `driver_locations` dan `trips` sudah aktif di bawah `supabase_realtime` publication. (Script schema.sql sudah melakukan ini, tapi verifikasi tidak ada salahnya.)

### 4. Buat Pengguna

Di Supabase Dashboard → **Authentication → Users** → **Add user**:

| Email | Nama | Role |
|---|---|---|
| admin@contoh.com | Budi Santoso | admin |
| sopir1@contoh.com | Andi Wijaya | driver |
| sopir2@contoh.com | Doni Kusuma | driver |

Setelah membuat user, buka **SQL Editor** dan jalankan (ganti UUID dengan UUID asli dari tabel `auth.users`):

```sql
-- Lihat UUID di Authentication > Users
UPDATE public.profiles SET
  full_name = 'Budi Santoso',
  role = 'admin'
WHERE id = 'UUID-ADMIN-DI-SINI';

UPDATE public.profiles SET
  full_name = 'Andi Wijaya',
  role = 'driver',
  phone = '08111000002',
  vehicle_plate = 'B 1234 XYZ'
WHERE id = 'UUID-SOPIR1-DI-SINI';

UPDATE public.profiles SET
  full_name = 'Doni Kusuma',
  role = 'driver',
  phone = '08111000003',
  vehicle_plate = 'B 5678 ABC'
WHERE id = 'UUID-SOPIR2-DI-SINI';
```

### 5. Setup Lokal

```bash
# Clone / buka folder proyek
cd "Aksara Buana"

# Install dependensi
npm install

# Copy file env
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 6. Jalankan Lokal

```bash
npm run dev
```

Buka `http://localhost:3000`. Login sebagai admin → buat pengantaran → login sebagai sopir di HP/browser lain.

---

## Deploy ke Vercel

1. Push kode ke GitHub (atau zip dan upload).
2. Buka [vercel.com](https://vercel.com) → **New Project** → import repository.
3. Di **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik **Deploy**.
5. Setelah deploy, buka URL Vercel dan test login.

---

## Catatan Teknis Penting

### Geolocation di Background (Layar Mati)

Browser mobile (Chrome/Safari) **menghentikan atau membatasi** `watchPosition` saat layar mati atau tab di-minimize. Ini adalah batasan fundamental PWA — bukan bug aplikasi ini.

**Solusi saat ini (primary path):** Sopir harus menjaga layar tetap menyala dan tab browser aktif selama perjalanan. Aplikasi menampilkan indikator lokasi aktif dan menyimpan ping secara offline jika sinyal hilang.

**Upgrade path (jika dibutuhkan tracking background penuh):** Bungkus aplikasi ini dengan [Capacitor](https://capacitorjs.com) atau bangun dengan React Native untuk mendapatkan akses Background Location API native.

### Struktur Folder

```
src/
├── app/
│   ├── admin/         # Halaman dispatcher
│   ├── driver/        # Halaman sopir (mobile)
│   └── auth/          # Login
├── components/
│   ├── checklist/     # Form checklist pre/post
│   ├── map/           # Leaflet map + GPS tracker
│   ├── trip/          # Form & card perjalanan
│   └── shared/        # Nav, CSV export, PWA banner
├── lib/
│   ├── i18n.ts        # Semua string UI Bahasa Indonesia
│   └── supabase/      # Client, server, middleware
└── types/             # TypeScript types
supabase/
├── schema.sql         # Skema DB + RLS policies
├── storage.sql        # Storage bucket + policies
└── seed.sql           # Template checklist default
```

### Mengubah Isi Checklist

Edit kolom `fields` di tabel `checklist_templates` di Supabase (tipe JSONB). Format tiap field:

```json
{
  "id": "nama_field_unik",
  "label": "Label yang ditampilkan ke sopir",
  "type": "boolean | select | number | text | checkboxgroup",
  "required": true,
  "options": ["Opsi 1", "Opsi 2"],
  "placeholder": "Teks placeholder opsional"
}
```

Perubahan template langsung aktif — tidak perlu deploy ulang.

---

## Stack Teknologi

| Komponen | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database & Auth | Supabase (Postgres + RLS + Realtime) |
| Storage | Supabase Storage |
| Maps | Leaflet + OpenStreetMap (gratis, tanpa API key) |
| UI | Tailwind CSS + shadcn/ui |
| Offline buffer | IndexedDB (via `idb`) |
| Deployment | Vercel + Supabase Cloud |
