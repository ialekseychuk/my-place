export interface StaffServiceAssignment {
  id: string
  staff_id: string
  service_id: string
  staff_name: string
  service_name: string
  created_at: string
  updated_at: string
}

export interface AssignServiceToStaffRequest {
  service_id: string
}

export interface AssignMultipleServicesToStaffRequest {
  service_ids: string[]
}

export interface StaffWithServices {
  id: string
  business_id: string
  first_name: string
  last_name: string
  full_name: string
  phone?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  position: string
  description?: string
  specialization?: string
  is_active: boolean
  services: Array<{
    id: string
    business_id: string
    name: string
    duration_min: number
    price_cents: number
    created_at: string
    updated_at: string
  }>
  created_at: string
  updated_at: string
}