import { apiRequest } from '@/services/api'
import type { Client, ClientListResponse, ClientListRequest } from '@/types/client'

class ClientService {
  private readonly baseURL = '/api/v1'

  async getClientsByBusiness(
    businessId: string,
    params: ClientListRequest = {}
  ): Promise<ClientListResponse> {
    const { page = 1, limit = 10, search = '' } = params
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    })

    const url = `${this.baseURL}/businesses/${businessId}/clients?${searchParams.toString()}`
    return apiRequest<ClientListResponse>(url)
  }

  async getClientById(businessId: string, clientId: string): Promise<Client> {
    const url = `${this.baseURL}/businesses/${businessId}/clients/${clientId}`
    return apiRequest<Client>(url)
  }

  async updateClient(businessId: string, clientId: string, clientData: UpdateClientRequest): Promise<Client> {
    const url = `${this.baseURL}/businesses/${businessId}/clients/${clientId}`
    return apiRequest<Client>(url, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    })
  }
}

export const clientService = new ClientService()