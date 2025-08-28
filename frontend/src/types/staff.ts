export interface Staff {
  id: string
  business_id: string
  location_id?: string
  first_name: string
  last_name: string
  full_name: string
  phone?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  position: string
  description?: string
  specialization?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateStaffRequest {
  first_name: string
  last_name: string
  phone?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  position: string
  description?: string
  specialization?: string
  location_id?: string
}

export interface UpdateStaffRequest {
  first_name?: string
  last_name?: string
  phone?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  position?: string
  description?: string
  specialization?: string
  is_active?: boolean
  location_id?: string
}