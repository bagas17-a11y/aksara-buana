/**
 * All user-facing UI strings in Bahasa Indonesia.
 * Swap values here to change language or update copy.
 */
export const t = {
  // App
  appName: 'Aksara Buana — Sistem Pengantaran',
  appShortName: 'Aksara Buana',

  // Auth
  login: 'Masuk',
  logout: 'Keluar',
  email: 'Email',
  password: 'Kata Sandi',
  loginTitle: 'Masuk ke Sistem',
  loginSubtitle: 'Masukkan email dan kata sandi Anda',
  loginError: 'Email atau kata sandi salah.',
  loggingIn: 'Memproses...',

  // Roles
  roleDriver: 'Sopir',
  roleAdmin: 'Admin / Dispatcher',

  // Navigation
  navDashboard: 'Dasbor',
  navTrips: 'Pengantaran',
  navDrivers: 'Sopir',
  navHistory: 'Riwayat',
  navLiveMap: 'Peta Langsung',

  // Trip status labels
  statusAssigned: 'Ditugaskan',
  statusPreCheckDone: 'Cek Pra-Perjalanan Selesai',
  statusInTransit: 'Dalam Perjalanan',
  statusDelivered: 'Terkirim',
  statusAtOffice: 'Sudah di Kantor',
  statusCompleted: 'Selesai',
  statusCancelled: 'Dibatalkan',

  // Stop status
  stopPending: 'Menunggu',
  stopInTransit: 'Dalam Perjalanan',
  stopDelivered: 'Terkirim',

  // Trip actions
  startTrip: 'Mulai Perjalanan',
  completeTrip: 'Selesaikan Perjalanan',
  cancelTrip: 'Batalkan',
  addFollowUp: 'Tambah Pengantaran',
  assignDriver: 'Tugaskan Sopir',
  createTrip: 'Buat Pengantaran',
  editTrip: 'Edit Pengantaran',
  addStop: 'Tambah Tujuan',

  // Checklist — pre-trip
  preCheckTitle: 'Cek Sebelum Berangkat',
  preCheckSubtitle: 'Lengkapi semua item sebelum memulai perjalanan.',
  preCheckSubmit: 'Kirim & Mulai Perjalanan',
  preCheckDone: 'Cek pra-perjalanan sudah selesai.',

  // Checklist field labels — pre-trip
  fieldKondisiSehat: 'Sopir dalam kondisi sehat & fit to drive',
  fieldIngatkan5s: 'Sudah menerapkan 5S sebelum berangkat',
  fieldStnkSim: 'STNK & SIM terbawa dan masih berlaku',
  fieldSeatbeltHelm: 'Memakai sabuk pengaman / helm sesuai kendaraan',
  fieldFuelLevel: 'Level bahan bakar',
  fieldVehicleOk: 'Kondisi kendaraan layak jalan (mesin, rem, ban)',
  fieldVehicleNote: 'Catatan kondisi kendaraan',
  fieldSpkDibawa: 'SPK / Surat Jalan terbawa',
  fieldBarangSesuaiSpk: 'Barang sesuai SPK — jenis, jumlah, kondisi dicek',
  fieldOdometerStart: 'Odometer awal (km)',
  fieldNotes: 'Catatan tambahan',

  // Checklist — post-trip
  postCheckTitle: 'Cek Setelah Pengantaran',
  postCheckSubtitle: 'Isi formulir ini setelah barang diserahkan.',
  postCheckSubmit: 'Kirim & Selesaikan',

  fieldGoodsHandedOver: 'Barang diserahkan kepada penerima',
  fieldKondisiBarangOk: 'Kondisi barang baik saat diserahkan',
  fieldVideoKondisi: 'Video kondisi barang sudah direkam',
  fieldRecipientName: 'Nama lengkap penerima',
  fieldParafClient: 'Paraf / tanda terima dari client diperoleh',
  fieldWaKonfirmasi: 'Laporan WA ke grup sudah dikirim',
  fieldBuktiKotakAdmin: 'Bukti tanda terima dimasukkan ke kotak admin',
  fieldSignature: 'Tanda tangan penerima',
  fieldSignatureClear: 'Hapus Tanda Tangan',
  fieldPodPhoto: 'Foto bukti pengantaran (POD)',
  fieldInvoiceUpload: 'Upload invoice / nota',
  fieldOdometerEnd: 'Odometer akhir (km)',
  fieldIssues: 'Kendala di lapangan',
  fieldCompletionTime: 'Waktu selesai',

  // Trip form — SPK / print job fields
  spkSection: 'Detail SPK (Surat Perintah Kerja)',
  jenisCetakan: 'Jenis Cetakan',
  judulCetakan: 'Judul / Nama Cetakan',
  spesifikasi: 'Spesifikasi',
  quantity: 'Jumlah (pcs)',
  jumlahDus: 'Jumlah Dus / Kardus',
  catatanKualitas: 'Catatan Kualitas Khusus',
  perluVideoHandover: 'Wajib video rekam saat serah terima',
  perluVideoHandoverHint: 'Aktifkan untuk Roll Banner, Standing Banner, atau cetakan besar lainnya',
  jenisCetakanPlaceholder: 'Contoh: Roll Banner, Standing Banner, Spanduk, X Banner…',
  judulCetakanPlaceholder: 'Contoh: Promo Hari Raya 2026',
  spesifikasiPlaceholder: 'Contoh: 60x160cm, laminasi doff, mata ayam 4 sisi',
  catatanKualitasPlaceholder: 'Contoh: Jangan dilipat, harus digulung',

  // Fuel options
  fuelEmpty: 'Kosong',
  fuelQuarter: '¼',
  fuelHalf: '½',
  fuelThreeQuarter: '¾',
  fuelFull: 'Penuh',

  // Yes / No
  yes: 'Ya',
  no: 'Tidak',

  // Live tracking
  locationActive: 'Lokasi aktif — sedang dibagikan',
  locationStale: 'Sinyal lemah — terakhir dilihat',
  locationPermissionDenied: 'Izin lokasi ditolak. Aktifkan di pengaturan browser.',
  locationUnavailable: 'Lokasi tidak tersedia.',
  stopSharing: 'Hentikan Berbagi Lokasi',

  // Driver dashboard
  myTrips: 'Perjalanan Saya',
  noTrips: 'Tidak ada perjalanan yang ditugaskan.',
  tripDetail: 'Detail Perjalanan',
  stops: 'Tujuan',
  cargo: 'Muatan',
  customer: 'Pelanggan',
  scheduled: 'Dijadwalkan',

  // Admin dashboard
  activeDrivers: 'Sopir Aktif',
  totalTripsToday: 'Total Perjalanan Hari Ini',
  pendingTrips: 'Menunggu',
  completedToday: 'Selesai Hari Ini',
  noActiveDrivers: 'Tidak ada sopir yang sedang beroperasi.',

  // Map
  mapTitle: 'Peta Sopir Aktif',
  lastSeen: 'Terakhir terlihat',
  minutesAgo: 'menit lalu',
  currentTrip: 'Perjalanan saat ini',
  destination: 'Tujuan',
  origin: 'Asal',

  // Forms
  save: 'Simpan',
  cancel: 'Batal',
  confirm: 'Konfirmasi',
  delete: 'Hapus',
  upload: 'Unggah',
  uploading: 'Mengunggah...',
  loading: 'Memuat...',
  submitting: 'Mengirim...',
  saving: 'Menyimpan...',
  required: 'Wajib diisi',
  optional: 'Opsional',
  selectPlaceholder: 'Pilih...',

  // History
  historyTitle: 'Riwayat Perjalanan',
  exportCsv: 'Ekspor CSV',
  filterByDate: 'Filter Tanggal',
  filterByDriver: 'Filter Sopir',
  filterByStatus: 'Filter Status',
  allDrivers: 'Semua Sopir',
  allStatuses: 'Semua Status',
  noHistory: 'Belum ada riwayat perjalanan.',

  // Errors
  errorGeneric: 'Terjadi kesalahan. Coba lagi.',
  errorRequired: 'Bidang ini wajib diisi.',
  errorUpload: 'Gagal mengunggah file.',
  blockStartTrip: 'Selesaikan cek pra-perjalanan dulu.',

  // PWA
  installPrompt: 'Pasang aplikasi ini di layar utama untuk akses lebih mudah.',
  installAction: 'Pasang',
  installDismiss: 'Nanti',
}

export type TranslationKey = keyof typeof t
