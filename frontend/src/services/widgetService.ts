import type { Booking } from '@/types/booking'
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

// Add the DayScheduleResponse interface
export interface ShiftResponse {
  id: string
  staff_id: string
  staff_name: string
  shift_date: string
  start_time: string
  end_time: string
  shift_type: string
  is_available: boolean
}

export interface DayScheduleResponse {
  date: string
  day_of_week: string
  is_working_day: boolean
  shifts: ShiftResponse[]
  total_hours: number
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

  // New method to get bookings for a specific staff member and date
  async getStaffBookings(businessId: string, staffId: string, date: string): Promise<Booking[]> {
    const url = `/api/v1/widget/bookings/${businessId}?staff_id=${staffId}&date=${date}`
    return await apiRequest<Booking[]>(url)
  }

  // New method to get staff day schedule (public endpoint for widget)
  async getStaffDaySchedule(staffId: string, date: string): Promise<DayScheduleResponse> {
    const url = `/api/v1/widget/staff/${staffId}/day?date=${date}`
    return await apiRequest<DayScheduleResponse>(url)
  }
}

export const widgetService = new WidgetService()