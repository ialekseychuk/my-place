import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { serviceService } from '@/services/service'
import type { Service } from '@/types/service'

interface ServiceDataContextType {
  services: Service[] | null
  loading: boolean
  error: string | null
  refreshServices: () => Promise<void>
}

const ServiceDataContext = createContext<ServiceDataContextType | undefined>(undefined)

export function ServiceDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [services, setServices] = useState<Service[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadServices = async () => {
    if (!user?.business_id) {
      setServices([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const servicesData = await serviceService.getServicesByBusiness(user.business_id)
      // Ensure servicesData is an array
      const safeServicesData = Array.isArray(servicesData) ? servicesData : []
      setServices(safeServicesData)
      setError(null)
    } catch (err) {
      setError('Ошибка при загрузке списка услуг')
      console.error('Error loading services:', err)
      // Set empty array on error to prevent null reference
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [user?.business_id])

  const refreshServices = async () => {
    await loadServices()
  }

  return (
    <ServiceDataContext.Provider value={{ services, loading, error, refreshServices }}>
      {children}
    </ServiceDataContext.Provider>
  )
}

export function useServiceData() {
  const context = useContext(ServiceDataContext)
  if (context === undefined) {
    throw new Error('useServiceData must be used within a ServiceDataProvider')
  }
  return context
}