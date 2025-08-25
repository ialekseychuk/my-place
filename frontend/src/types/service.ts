export interface Service {
  id: string
  business_id: string
  name: string
  duration_min: number
  price_cents: number
  created_at: string
  updated_at: string
}

export interface CreateServiceRequest {
  name: string
  duration_min: number
  price_cents: number
}

export interface UpdateServiceRequest {
  name?: string
  duration_min?: number
  price_cents?: number
}