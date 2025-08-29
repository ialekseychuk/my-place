import type { CreateStaffRequest, Staff, UpdateStaffRequest } from '@/types/staff';

class StaffService {
  private readonly baseURL = '/api/v1'

  async getStaffByBusiness(businessId: string, locationId: string): Promise<Staff[]> {
    // Create URLSearchParams to handle query parameters
    const params = new URLSearchParams();
    params.append('location_id', locationId);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await fetch(`${this.baseURL}/businesses/${businessId}/staffs${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch staff');
    }

    const data = await response.json();
    return data;
  }

  async createStaff(businessId: string, staffData: CreateStaffRequest): Promise<Staff> {
    const response = await fetch(`${this.baseURL}/businesses/${businessId}/staffs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(staffData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create staff')
    }

    return response.json()
  }

  async getStaffById(businessId: string, staffId: string): Promise<Staff> {
    const response = await fetch(`${this.baseURL}/businesses/${businessId}/staffs/${staffId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch staff')
    }

    return response.json()
  }

  async updateStaff(businessId: string, staffId: string, staffData: UpdateStaffRequest): Promise<Staff> {
    const response = await fetch(`${this.baseURL}/businesses/${businessId}/staffs/${staffId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(staffData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update staff')
    }

    return response.json()
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
}

export const staffService = new StaffService()