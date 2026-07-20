-- ============================================================
-- Seed data for development/testing
-- Run AFTER schema.sql
-- Creates: 1 admin, 2 drivers, checklist templates, 1 sample trip
-- ============================================================

-- NOTE: auth.users rows must be created via Supabase Auth API or Dashboard.
-- These UUIDs are placeholders — replace with real UUIDs from your auth.users table,
-- OR run the seed via the Supabase JS client (see scripts/seed.ts).

-- ============================================================
-- Default checklist templates
-- ============================================================

insert into public.checklist_templates (id, type, name, fields) values
(
  'aaaaaaaa-0001-0001-0001-000000000001',
  'pre',
  'Cek Sebelum Berangkat (SOP Aksara Buana)',
  '[
    {
      "id": "kondisi_sehat",
      "label": "Sopir dalam kondisi sehat & fit to drive",
      "type": "boolean",
      "required": true
    },
    {
      "id": "ingatkan_5s",
      "label": "Sudah menerapkan 5S sebelum berangkat (Ringkas, Rapi, Resik, Rawat, Rajin)",
      "type": "boolean",
      "required": true
    },
    {
      "id": "stnk_sim",
      "label": "STNK & SIM terbawa dan masih berlaku",
      "type": "boolean",
      "required": true
    },
    {
      "id": "seatbelt_helm",
      "label": "Memakai sabuk pengaman / helm sesuai jenis kendaraan",
      "type": "boolean",
      "required": true
    },
    {
      "id": "fuel_level",
      "label": "Level bahan bakar",
      "type": "select",
      "required": true,
      "options": ["Kosong", "¼", "½", "¾", "Penuh"]
    },
    {
      "id": "vehicle_ok",
      "label": "Kondisi kendaraan layak jalan (mesin, rem, ban)",
      "type": "boolean",
      "required": true
    },
    {
      "id": "vehicle_note",
      "label": "Catatan kondisi kendaraan",
      "type": "text",
      "required": false,
      "placeholder": "Opsional — catat jika ada masalah"
    },
    {
      "id": "spk_dibawa",
      "label": "Surat Perintah Kerja (SPK) / Surat Jalan terbawa",
      "type": "boolean",
      "required": true
    },
    {
      "id": "barang_sesuai_spk",
      "label": "Barang sesuai SPK — jenis, jumlah, dan kondisi sudah dicek",
      "type": "boolean",
      "required": true
    },
    {
      "id": "odometer_start",
      "label": "Odometer awal (km)",
      "type": "number",
      "required": true,
      "placeholder": "Contoh: 12345"
    },
    {
      "id": "notes",
      "label": "Catatan tambahan",
      "type": "text",
      "required": false,
      "placeholder": "Opsional"
    }
  ]'::jsonb
),
(
  'aaaaaaaa-0002-0002-0002-000000000002',
  'post',
  'Cek Setelah Pengantaran (SOP Aksara Buana)',
  '[
    {
      "id": "goods_handed_over",
      "label": "Barang diserahkan kepada penerima dengan baik",
      "type": "boolean",
      "required": true
    },
    {
      "id": "kondisi_barang_ok",
      "label": "Kondisi barang baik saat diserahkan (tidak rusak / cacat)",
      "type": "boolean",
      "required": true
    },
    {
      "id": "video_kondisi",
      "label": "Video kondisi barang saat serah terima sudah direkam (WAJIB untuk Roll Banner / Standing Banner)",
      "type": "boolean",
      "required": false
    },
    {
      "id": "recipient_name",
      "label": "Nama lengkap penerima",
      "type": "text",
      "required": true,
      "placeholder": "Nama lengkap penerima"
    },
    {
      "id": "paraf_client",
      "label": "Paraf / tanda terima dari client sudah diperoleh",
      "type": "boolean",
      "required": true
    },
    {
      "id": "wa_konfirmasi",
      "label": "Laporan posisi & tanda terima sudah dikirim ke grup WA",
      "type": "boolean",
      "required": true
    },
    {
      "id": "bukti_kotak_admin",
      "label": "Bukti tanda terima sudah dimasukkan ke kotak admin",
      "type": "boolean",
      "required": true
    },
    {
      "id": "odometer_end",
      "label": "Odometer akhir (km)",
      "type": "number",
      "required": true,
      "placeholder": "Contoh: 12390"
    },
    {
      "id": "issues",
      "label": "Kendala di lapangan",
      "type": "text",
      "required": false,
      "placeholder": "Opsional — catat jika ada kendala"
    }
  ]'::jsonb
)
on conflict (id) do update set fields = excluded.fields, name = excluded.name;

-- ============================================================
-- Sample profile rows (assumes auth.users already exist)
-- Replace the UUIDs below with real auth.users IDs after creating
-- users via the Supabase Auth dashboard or the seed script.
-- ============================================================

-- These are commented out because UUIDs must match real auth.users rows.
-- Uncomment and fill in after creating users.

/*
insert into public.profiles (id, full_name, role, phone, vehicle_plate) values
('REPLACE-WITH-ADMIN-UUID',   'Budi Santoso (Admin)',  'admin',  '08111000001', null),
('REPLACE-WITH-DRIVER1-UUID', 'Andi Wijaya (Sopir 1)', 'driver', '08111000002', 'B 1234 XYZ'),
('REPLACE-WITH-DRIVER2-UUID', 'Doni Kusuma (Sopir 2)', 'driver', '08111000003', 'B 5678 ABC')
on conflict (id) do update
  set full_name = excluded.full_name,
      role = excluded.role,
      phone = excluded.phone,
      vehicle_plate = excluded.vehicle_plate;
*/
