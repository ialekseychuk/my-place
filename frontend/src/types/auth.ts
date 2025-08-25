export interface User {
  id: string
  business_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  role: 'owner' | 'admin' | 'staff'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuthToken {
  access_token: string
  refresh_token: string
  expires_at: string
  token_type: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: AuthToken
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface RefreshTokenResponse {
  token: AuthToken
}