import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
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
  const [staff, setStaff] = useState<Staff[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStaff = async () => {
    if (!user?.business_id) {
      setStaff([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const staffData = await staffService.getStaffByBusiness(user.business_id)
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
  }, [user?.business_id])

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