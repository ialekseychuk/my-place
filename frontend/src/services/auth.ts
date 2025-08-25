import type { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse } from '@/types/auth'

class AuthService {
  private readonly baseURL = '/api/v1/auth'

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    const data = await response.json()
    
    // Store tokens in localStorage
    this.setAccessToken(data.token.access_token)
    this.setRefreshToken(data.token.refresh_token)
    
    return data
  }

  async logout(): Promise<void> {
    const token = this.getAccessToken()
    
    if (token) {
      try {
        await fetch(`${this.baseURL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      } catch (error) {
        console.error('Logout API call failed:', error)
      }
    }

    // Always clear tokens from localStorage
    this.clearTokens()
  }

  async refreshToken(): Promise<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken()
    
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await fetch(`${this.baseURL}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) {
      this.clearTokens()
      throw new Error('Token refresh failed')
    }

    const data = await response.json()
    
    // Update tokens in localStorage
    this.setAccessToken(data.token.access_token)
    this.setRefreshToken(data.token.refresh_token)
    
    return data
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token')
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token')
  }

  setAccessToken(token: string): void {
    localStorage.setItem('access_token', token)
  }

  setRefreshToken(token: string): void {
    localStorage.setItem('refresh_token', token)
  }

  clearTokens(): void {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken()
    if (!token) return false

    try {
      // Decode JWT payload to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Date.now() / 1000
      
      // Check if token is expired
      if (payload.exp < currentTime) {
        this.clearTokens()
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error checking token validity:', error)
      this.clearTokens()
      return false
    }
  }

  getAuthHeaders(): Record<string, string> {
    const token = this.getAccessToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
}

export const authService = new AuthService()