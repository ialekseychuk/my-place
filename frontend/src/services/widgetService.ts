import type { Location } from '@/types/location'
import type { Service } from '@/types/service'
import type { Staff } from '@/types/staff'
import type { StaffServiceAssignment } from '@/types/staff-service'
import { apiRequest } from './api'

export interface AvailableStaff {
  staff_id: string
  staff_name: string
  is_available: boolean
}

export class WidgetService {
  async getLocations(businessId: string): Promise<Location[]> {
    const response = await apiRequest<{ locations: Location[] }>(
      `/api/v1/widget/locations/${businessId}`
    )
    return response.locations
  }

  async getServices(businessId: string, locationId?: string): Promise<Service[]> {
    const url = locationId 
      ? `/api/v1/widget/services/${businessId}?location_id=${locationId}`
      : `/api/v1/widget/services/${businessId}`
    
    return await apiRequest<Service[]>(url)
  }

  async getStaff(businessId: string, locationId?: string): Promise<Staff[]> {
    const url = locationId 
      ? `/api/v1/widget/staff/${businessId}?location_id=${locationId}`
      : `/api/v1/widget/staff/${businessId}`
    
    return await apiRequest<Staff[]>(url)
  }

  async getStaffServices(businessId: string): Promise<StaffServiceAssignment[]> {
    return await apiRequest<StaffServiceAssignment[]>(
      `/api/v1/widget/staff-services/${businessId}`
    )
  }

  async getAvailableStaff(businessId: string, date: string, startTime?: string, endTime?: string, locationId?: string): Promise<AvailableStaff[]> {
    const params = new URLSearchParams()
    params.append('date', date)
    if (startTime) params.append('start_time', startTime)
    if (endTime) params.append('end_time', endTime)
    if (locationId) params.append('location_id', locationId)
    
    const url = `/api/v1/widget/availability/${businessId}?${params.toString()}`
    return await apiRequest<AvailableStaff[]>(url)
  }
}

export const widgetService = new WidgetService()