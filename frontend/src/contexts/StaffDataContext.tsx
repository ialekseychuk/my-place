import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { useLocation } from './LocationContext'
import { staffService } from '@/services/staff'
import type { Staff } from '@/types/staff'

interface StaffDataContextType {
  staff: Staff[] | null
  loading: boolean
  error: string | null
  refreshStaff: () => Promise<void>
}

const StaffDataContext = createContext<StaffDataContextType | undefined>(undefined)

export function StaffDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { currentLocation } = useLocation()
  const [staff, setStaff] = useState<Staff[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStaff = async () => {
    // If no business or location is selected, clear staff data
    if (!user?.business_id || !currentLocation?.id) {
      setStaff([])
      setLoading(false)
      // Set appropriate error message when no location is selected
      if (!currentLocation?.id && user?.business_id) {
        setError('Пожалуйста, выберите локацию для просмотра сотрудников')
      } else {
        setError(null)
      }
      return
    }

    try {
      setLoading(true)
      console.log('Loading staff...', user.business_id, currentLocation.id)
      const staffData = await staffService.getStaffByBusiness(user.business_id, currentLocation.id)
      // Ensure we always set an array, even if the API returns null
      setStaff(Array.isArray(staffData) ? staffData : [])
      setError(null)
    } catch (err) {
      setError('Ошибка при загрузке списка сотрудников')
      console.error('Error loading staff:', err)
      // Set empty array on error to prevent null reference
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
  }, [user?.business_id, currentLocation?.id])

  const refreshStaff = async () => {
    await loadStaff()
  }

  return (
    <StaffDataContext.Provider value={{ staff, loading, error, refreshStaff }}>
      {children}
    </StaffDataContext.Provider>
  )
}

export function useStaffData() {
  const context = useContext(StaffDataContext)
  if (context === undefined) {
    throw new Error('useStaffData must be used within a StaffDataProvider')
  }
  return context
}