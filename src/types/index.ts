export type UserRole = 'admin' | 'driver'

export type TripStatus =
  | 'assigned'
  | 'pre_check_done'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled'

export type StopStatus = 'pending' | 'in_transit' | 'delivered'

export type ChecklistType = 'pre' | 'post'

export type AttachmentKind = 'invoice' | 'pod' | 'signature'

export type VehicleType = 'car' | 'motorcycle'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  phone: string | null
  vehicle_plate: string | null
  vehicle_type: VehicleType | null
  active: boolean
}

export interface ChecklistTemplateField {
  id: string
  label: string
  type: 'boolean' | 'select' | 'number' | 'text' | 'checkboxgroup'
  required: boolean
  options?: string[]        // for select / checkboxgroup
  placeholder?: string
}

export interface ChecklistTemplate {
  id: string
  type: ChecklistType
  name: string
  fields: ChecklistTemplateField[]
  active: boolean
}

export interface TripStop {
  id: string
  trip_id: string
  sequence: number
  label: string
  address: string
  lat: number | null
  lng: number | null
  status: StopStatus
  delivered_at: string | null
}

export interface Trip {
  id: string
  driver_id: string
  dispatcher_id: string
  status: TripStatus
  cargo_desc: string
  customer_name: string
  customer_phone: string | null
  scheduled_at: string
  created_at: string
  notes: string | null
  // SPK (Surat Perintah Kerja) fields — print job details
  jenis_cetakan: string | null
  judul_cetakan: string | null
  spesifikasi: string | null
  quantity: number | null
  jumlah_dus: number | null
  catatan_kualitas: string | null
  perlu_video_handover: boolean
  // joined
  driver?: Profile
  stops?: TripStop[]
}

export interface ChecklistSubmission {
  id: string
  trip_id: string
  driver_id: string
  template_id: string
  type: ChecklistType
  answers: Record<string, unknown>
  lat: number | null
  lng: number | null
  submitted_at: string
}

export interface DriverLocation {
  driver_id: string
  trip_id: string
  lat: number
  lng: number
  accuracy: number | null
  speed: number | null
  heading: number | null
  recorded_at: string
  // joined
  driver?: Profile
  trip?: Trip
}

export interface LocationPoint {
  id: string
  trip_id: string
  driver_id: string
  lat: number
  lng: number
  recorded_at: string
}

export interface Attachment {
  id: string
  trip_id: string
  kind: AttachmentKind
  storage_path: string
  uploaded_at: string
}
