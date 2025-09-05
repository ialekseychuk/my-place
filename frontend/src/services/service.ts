import type {
  BusinessServicesResponse,
  CreateCategoryRequest,
  CreateServiceRequest,
  Service,
  ServiceCategory,
  UpdateCategoryRequest,
  UpdateServiceRequest
} from '@/types/service';

class ServiceService {
  private readonly baseURL = '/api/v1'

  // Service methods
  async getServicesByBusiness(businessId: string, locationId?: string): Promise<Service[]> {
    // Create URLSearchParams to handle query parameters
    const params = new URLSearchParams();
    if (locationId) {
      params.append('location_id', locationId);
    }
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await fetch(`${this.baseURL}/businesses/${businessId}/services${queryString}`, {
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

  async updateServicesOrder(businessId: string, serviceIds: string[]): Promise<void> {
    const response = await fetch(`${this.baseURL}/businesses/${businessId}/services/order`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ ids: serviceIds }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update services order')
    }
  }

  // Category methods
  async getCategories(businessId: string): Promise<ServiceCategory[]> {
    const response = await fetch(`${this.baseURL}/businesses/${businessId}/services/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch categories')
    }

    return response.json()
  }

  async getCategoryById(businessId: string, categoryId: string): Promise<ServiceCategory> {
    const response = await fetch(`${this.baseURL}/businesses/${businessId}/services/categories/${categoryId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch category')
    }

    return response.json()
  }

  async createCategory(businessId: string, categoryData: CreateCategoryRequest): Promise<ServiceCategory> {
    const response = await fetch(`${this.baseURL}/businesses/${businessId}/services/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(categoryData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create category')
    }

    return response.json()
  }

  async updateCategory(businessId: string, categoryId: string, categoryData: UpdateCategoryRequest): Promise<ServiceCategory> {
    const response = await fetch(`${this.baseURL}/businesses/${businessId}/services/categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(categoryData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update category')
    }

    return response.json()
  }

  async deleteCategory(businessId: string, categoryId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/businesses/${businessId}/services/categories/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete category')
    }
  }

  async getServicesByCategory(businessId: string, categoryId: string): Promise<Service[]> {
    const response = await fetch(`${this.baseURL}/businesses/${businessId}/services/categories/${categoryId}/services`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch services by category')
    }

    return response.json()
  }

  async updateCategoriesOrder(businessId: string, categoryIds: string[]): Promise<void> {
    const response = await fetch(`${this.baseURL}/businesses/${businessId}/services/categories/order`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ ids: categoryIds }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update categories order')
    }
  }

  // Combined methods
  async getServicesWithCategories(businessId: string): Promise<BusinessServicesResponse> {
    const response = await fetch(`${this.baseURL}/businesses/${businessId}/services/with-categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch services with categories')
    }

    return response.json()
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
}

export const serviceService = new ServiceService()
