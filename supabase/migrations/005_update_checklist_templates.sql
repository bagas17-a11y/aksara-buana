-- Update checklist templates to match physical SOP paper

UPDATE checklist_templates
SET
  name   = 'Checklist Kurir Sebelum Pengiriman',
  fields = '[
    {"id":"sehat_fit",        "label":"Kondisi tubuh sehat dan fit",        "type":"boolean","required":true},
    {"id":"hp_aktif",         "label":"Handphone aktif",                    "type":"boolean","required":true},
    {"id":"sim_aktif",        "label":"Driver membawa SIM aktif",           "type":"boolean","required":true},
    {"id":"kondisi_kendaraan","label":"Kondisi kendaraan baik",             "type":"boolean","required":true},
    {"id":"ban_baik",         "label":"Ban kendaraan dalam kondisi baik",   "type":"boolean","required":true},
    {"id":"lampu_rem",        "label":"Lampu dan rem berfungsi",            "type":"boolean","required":true},
    {"id":"bbm_cukup",        "label":"BBM mencukupi",                      "type":"boolean","required":true},
    {"id":"surat_jalan",      "label":"Surat jalan dan dokumen lengkap",    "type":"boolean","required":true},
    {"id":"barang_sesuai",    "label":"Barang sesuai dengan surat jalan",   "type":"boolean","required":true},
    {"id":"barang_aman",      "label":"Barang tersusun dengan aman",        "type":"boolean","required":true}
  ]'::jsonb
WHERE id = 'aaaaaaaa-0001-0001-0001-000000000001';

UPDATE checklist_templates
SET
  name   = 'Checklist Kurir Setelah Pengiriman',
  fields = '[
    {"id":"barang_diterima",   "label":"Barang sudah diterima klien",       "type":"boolean","required":true},
    {"id":"bukti_lengkap",     "label":"Bukti penerimaan lengkap",          "type":"boolean","required":true},
    {"id":"laporan_selesai",   "label":"Laporan pengiriman selesai",        "type":"boolean","required":true},
    {"id":"kendala_dilaporkan","label":"Kendala pengiriman dilaporkan",     "type":"boolean","required":true},
    {"id":"parkir_aman",       "label":"Kendaraan diparkir aman",           "type":"boolean","required":true},
    {"id":"surat_kembali",     "label":"Surat jalan dikembalikan",          "type":"boolean","required":true},
    {"id":"kendaraan_bersih",  "label":"Kendaraan dibersihkan",             "type":"boolean","required":true},
    {"id":"kunci_kembali",     "label":"Kunci kendaraan dikembalikan",      "type":"boolean","required":true}
  ]'::jsonb
WHERE id = 'aaaaaaaa-0002-0002-0002-000000000002';
