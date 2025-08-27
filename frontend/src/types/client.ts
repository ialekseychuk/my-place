export interface Client {
  id: string
  business_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  created_at: string
  updated_at: string
}

export interface ClientListResponse {
  clients: Client[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ClientListRequest {
  page?: number
  limit?: number
  search?: string
}

export interface UpdateClientRequest {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
}