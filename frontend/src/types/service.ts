export interface Service {
  id: string
  business_id: string
  location_id?: string
  category_id?: string
  name: string
  duration_min: number
  price_cents: number
  order_index: number
  created_at: string
  updated_at: string
}

export interface CreateServiceRequest {
  name: string
  duration_min: number
  price_cents: number
  location_id?: string
  category_id?: string
  order_index?: number
}

export interface UpdateServiceRequest {
  name?: string
  duration_min?: number
  price_cents?: number
  location_id?: string
  category_id?: string
  order_index?: number
}

export interface ServiceCategory {
  id: string
  business_id: string
  name: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface CreateCategoryRequest {
  name: string
  order_index?: number
}

export interface UpdateCategoryRequest {
  name?: string
  order_index?: number
}

export interface UpdateOrderRequest {
  ids: string[]
}

export interface CategoryWithServices {
  id: string
  business_id: string
  name: string
  order_index: number
  created_at: string
  updated_at: string
  services: Service[]
}

export interface BusinessServicesResponse {
  categories: CategoryWithServices[]
  uncategorized_services?: Service[]
}