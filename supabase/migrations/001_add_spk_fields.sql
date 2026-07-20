-- Migration 001: Add SPK (Surat Perintah Kerja) fields to trips
-- Run this in the Supabase SQL Editor after schema.sql
-- These fields capture print-job details per PT Aksara Buana's SOP

alter table public.trips
  add column if not exists jenis_cetakan      text,
  add column if not exists judul_cetakan      text,
  add column if not exists spesifikasi        text,
  add column if not exists quantity           integer,
  add column if not exists jumlah_dus         integer,
  add column if not exists catatan_kualitas   text,
  add column if not exists perlu_video_handover boolean not null default false;

-- Update the checklist templates to match the real SOP fields
-- (Re-runs the seed upsert for templates only)

insert into public.checklist_templates (id, type, name, fields) values
(
  'aaaaaaaa-0001-0001-0001-000000000001',
  'pre',
  'Cek Sebelum Berangkat (SOP Aksara Buana)',
  '[
    {"id":"kondisi_sehat","label":"Sopir dalam kondisi sehat & fit to drive","type":"boolean","required":true},
    {"id":"ingatkan_5s","label":"Sudah menerapkan 5S sebelum berangkat (Ringkas, Rapi, Resik, Rawat, Rajin)","type":"boolean","required":true},
    {"id":"stnk_sim","label":"STNK & SIM terbawa dan masih berlaku","type":"boolean","required":true},
    {"id":"seatbelt_helm","label":"Memakai sabuk pengaman / helm sesuai jenis kendaraan","type":"boolean","required":true},
    {"id":"fuel_level","label":"Level bahan bakar","type":"select","required":true,"options":["Kosong","¼","½","¾","Penuh"]},
    {"id":"vehicle_ok","label":"Kondisi kendaraan layak jalan (mesin, rem, ban)","type":"boolean","required":true},
    {"id":"vehicle_note","label":"Catatan kondisi kendaraan","type":"text","required":false,"placeholder":"Opsional — catat jika ada masalah"},
    {"id":"spk_dibawa","label":"Surat Perintah Kerja (SPK) / Surat Jalan terbawa","type":"boolean","required":true},
    {"id":"barang_sesuai_spk","label":"Barang sesuai SPK — jenis, jumlah, dan kondisi sudah dicek","type":"boolean","required":true},
    {"id":"odometer_start","label":"Odometer awal (km)","type":"number","required":true,"placeholder":"Contoh: 12345"},
    {"id":"notes","label":"Catatan tambahan","type":"text","required":false,"placeholder":"Opsional"}
  ]'::jsonb
),
(
  'aaaaaaaa-0002-0002-0002-000000000002',
  'post',
  'Cek Setelah Pengantaran (SOP Aksara Buana)',
  '[
    {"id":"goods_handed_over","label":"Barang diserahkan kepada penerima dengan baik","type":"boolean","required":true},
    {"id":"kondisi_barang_ok","label":"Kondisi barang baik saat diserahkan (tidak rusak / cacat)","type":"boolean","required":true},
    {"id":"video_kondisi","label":"Video kondisi barang saat serah terima sudah direkam (WAJIB untuk Roll Banner / Standing Banner)","type":"boolean","required":false},
    {"id":"recipient_name","label":"Nama lengkap penerima","type":"text","required":true,"placeholder":"Nama lengkap penerima"},
    {"id":"paraf_client","label":"Paraf / tanda terima dari client sudah diperoleh","type":"boolean","required":true},
    {"id":"wa_konfirmasi","label":"Laporan posisi & tanda terima sudah dikirim ke grup WA","type":"boolean","required":true},
    {"id":"bukti_kotak_admin","label":"Bukti tanda terima sudah dimasukkan ke kotak admin","type":"boolean","required":true},
    {"id":"odometer_end","label":"Odometer akhir (km)","type":"number","required":true,"placeholder":"Contoh: 12390"},
    {"id":"issues","label":"Kendala di lapangan","type":"text","required":false,"placeholder":"Opsional — catat jika ada kendala"}
  ]'::jsonb
)
on conflict (id) do update set fields = excluded.fields, name = excluded.name;
