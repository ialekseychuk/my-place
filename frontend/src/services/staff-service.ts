import type { Service } from '@/types/service'
import type {
    AssignMultipleServicesToStaffRequest,
    AssignServiceToStaffRequest,
    StaffServiceAssignment
} from '@/types/staff-service'

class StaffServiceService {
  private readonly baseURL = '/api/v1'

  async getAllStaffServices(businessId: string): Promise<StaffServiceAssignment[]> {
    const response = await fetch(`${this.baseURL}/businesses/${businessId}/staff-services`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch staff services')
    }

    return response.json()
  }

  async getStaffServices(businessId: string, staffId: string): Promise<Service[]> {
    const response = await fetch(`${this.baseURL}/businesses/${businessId}/staff-services/${staffId}/services`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch staff services')
    }

    return response.json()
  }

  async assignServiceToStaff(
    businessId: string,
    staffId: string,
    serviceData: AssignServiceToStaffRequest
  ): Promise<StaffServiceAssignment> {
    const response = await fetch(`${this.baseURL}/businesses/${businessId}/staff-services/${staffId}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(serviceData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to assign service to staff')
    }

    return response.json()
  }

  async unassignServiceFromStaff(
    businessId: string,
    staffId: string,
    serviceId: string
  ): Promise<void> {
    const response = await fetch(
      `${this.baseURL}/businesses/${businessId}/staff-services/${staffId}/services/${serviceId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to unassign service from staff')
    }
  }

  async replaceStaffServices(
    businessId: string,
    staffId: string,
    serviceData: AssignMultipleServicesToStaffRequest
  ): Promise<Service[]> {
    const response = await fetch(`${this.baseURL}/businesses/${businessId}/staff-services/${staffId}/services`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(serviceData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update staff services')
    }

    return response.json()
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
}

export const staffServiceService = new StaffServiceService()