import type { Service, CreateServiceRequest, UpdateServiceRequest } from '@/types/service'

class ServiceService {
  private readonly baseURL = '/api/v1'

  async getServicesByBusiness(businessId: string): Promise<Service[]> {
    const response = await fetch(`${this.baseURL}/businesses/${businessId}/services`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch services')
    }

    return response.json()
  }

  async createService(businessId: string, serviceData: CreateServiceRequest): Promise<Service> {
    const response = await fetch(`${this.baseURL}/businesses/${businessId}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(serviceData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create service')
    }

    return response.json()
  }

  async getServiceById(businessId: string, serviceId: string): Promise<Service> {
    const response = await fetch(`${this.baseURL}/businesses/${businessId}/services/${serviceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch service')
    }

    return response.json()
  }

  async updateService(businessId: string, serviceId: string, serviceData: UpdateServiceRequest): Promise<Service> {
    const response = await fetch(`${this.baseURL}/businesses/${businessId}/services/${serviceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(serviceData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update service')
    }

    return response.json()
  }

  async deleteService(businessId: string, serviceId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/businesses/${businessId}/services/${serviceId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete service')
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
}

export const serviceService = new ServiceService()