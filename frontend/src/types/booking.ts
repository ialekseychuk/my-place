export interface Booking {
  id: string
  service_id: string
  service_name: string
  staff_id: string
  staff_name: string
  start_at: string
  end_at: string
  customer_name: string
  customer_email: string
  created_at: string
  updated_at: string
}

export interface CreateBookingRequest {
  service_id: string
  staff_id: string
  start_at: string // ISO date string
  customer_phone: string
  customer_name: string
  customer_email?: string
  location_id?: string
}