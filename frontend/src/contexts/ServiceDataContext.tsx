import { serviceService } from '@/services/service'
import type {
  BusinessServicesResponse,
  Service,
  ServiceCategory
} from '@/types/service'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { useLocation } from './LocationContext'

interface ServiceDataContextType {
  services: Service[] | null
  categories: ServiceCategory[] | null
  categorizedServices: BusinessServicesResponse | null
  loading: boolean
  categoriesLoading: boolean
  error: string | null
  refreshServices: () => Promise<void>
  refreshCategories: () => Promise<void>
  refreshServicesWithCategories: () => Promise<void>
  updateServicesOrder: (serviceIds: string[]) => Promise<void>
  updateCategoriesOrder: (categoryIds: string[]) => Promise<void>
}

const ServiceDataContext = createContext<ServiceDataContextType | undefined>(undefined)

export function ServiceDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { currentLocation } = useLocation()
  const [services, setServices] = useState<Service[] | null>(null)
  const [categories, setCategories] = useState<ServiceCategory[] | null>(null)
  const [categorizedServices, setCategorizedServices] = useState<BusinessServicesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadServices = async () => {
    if (!user?.business_id) {
      setServices([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const servicesData = await serviceService.getServicesByBusiness(user.business_id, currentLocation?.id)
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

  const loadCategories = async () => {
    if (!user?.business_id) {
      setCategories([])
      setCategoriesLoading(false)
      return
    }

    try {
      setCategoriesLoading(true)
      const categoriesData = await serviceService.getCategories(user.business_id)
      // Ensure categoriesData is an array
      const safeCategoriesData = Array.isArray(categoriesData) ? categoriesData : []
      setCategories(safeCategoriesData)
      setError(null)
    } catch (err) {
      setError('Ошибка при загрузке категорий услуг')
      console.error('Error loading categories:', err)
      // Set empty array on error to prevent null reference
      setCategories([])
    } finally {
      setCategoriesLoading(false)
    }
  }

  const loadServicesWithCategories = async () => {
    if (!user?.business_id) {
      setCategorizedServices({
        categories: [],
        uncategorized_services: []
      })
      setLoading(false)
      setCategoriesLoading(false)
      return
    }

    try {
      setLoading(true)
      setCategoriesLoading(true)
      const data = await serviceService.getServicesWithCategories(user.business_id)
      setCategorizedServices(data)
      setError(null)
    } catch (err) {
      setError('Ошибка при загрузке услуг с категориями')
      console.error('Error loading services with categories:', err)
      // Set empty structure on error to prevent null reference
      setCategorizedServices({
        categories: [],
        uncategorized_services: []
      })
    } finally {
      setLoading(false)
      setCategoriesLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
    loadCategories()
    loadServicesWithCategories()
  }, [user?.business_id, currentLocation?.id])

  const refreshServices = async () => {
    await loadServices()
  }

  const refreshCategories = async () => {
    await loadCategories()
  }

  const refreshServicesWithCategories = async () => {
    await loadServicesWithCategories()
  }

  const updateServicesOrder = async (serviceIds: string[]) => {
    if (!user?.business_id) return

    try {
      await serviceService.updateServicesOrder(user.business_id, serviceIds)
      await loadServicesWithCategories()
    } catch (err) {
      setError('Ошибка при обновлении порядка услуг')
      console.error('Error updating services order:', err)
    }
  }

  const updateCategoriesOrder = async (categoryIds: string[]) => {
    if (!user?.business_id) return

    try {
      await serviceService.updateCategoriesOrder(user.business_id, categoryIds)
      await loadServicesWithCategories()
    } catch (err) {
      setError('Ошибка при обновлении порядка категорий')
      console.error('Error updating categories order:', err)
    }
  }

  return (
    <ServiceDataContext.Provider 
      value={{ 
        services, 
        categories, 
        categorizedServices,
        loading, 
        categoriesLoading,
        error, 
        refreshServices, 
        refreshCategories,
        refreshServicesWithCategories,
        updateServicesOrder,
        updateCategoriesOrder
      }}
    >
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