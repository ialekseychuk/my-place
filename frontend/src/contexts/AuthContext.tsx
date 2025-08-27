import { authService } from '@/services/auth'
import type { LoginRequest, User } from '@/types/auth'
import type { ReactNode } from 'react'
import React, { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  user: User | null
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is authenticated on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // In a real app, you might want to fetch user profile here
          // For now, we'll just set a basic authenticated state
          // You could add a /auth/profile endpoint to get current user
          const token = authService.getAccessToken()
          if (token) {
            // Decode token to get user info (simplified)
            const payload = JSON.parse(atob(token.split('.')[1]))
            setUser({
              id: payload.user_id,
              business_id: payload.business_id,
              first_name: '',
              last_name: '',
              email: payload.email,
              phone: '',
              role: payload.role,
              is_active: true,
              created_at: '',
              updated_at: '',
            })
          }
        }
      } catch (error) {
        authService.clearTokens()
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authService.login(credentials)
      setUser(response.user)
    } catch (error) {
      throw error // Re-throw to handle in component
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}