import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ClientList } from '@/components/client/ClientList'
import { EditClientForm } from '@/components/client/EditClientForm'
import { useAuth } from '@/contexts/AuthContext'
import { clientService } from '@/services/client'
import type { Client, UpdateClientRequest } from '@/types/client'
import { Users } from 'lucide-react'

export function ClientsPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalClients, setTotalClients] = useState(0)

  const loadClients = async (page: number = 1, search: string = '') => {
    if (!user?.business_id) return

    try {
      setLoading(true)
      const response = await clientService.getClientsByBusiness(user.business_id, {
        page,
        limit: 10,
        search
      })
      
      setClients(response.clients)
      setTotalPages(response.pagination.pages)
      setTotalClients(response.pagination.total)
      setError(null)
    } catch (err) {
      setError('Ошибка при загрузке списка клиентов')
      console.error('Error loading clients:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [user?.business_id])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadClients(1, searchTerm)
      setCurrentPage(1)
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, user?.business_id])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
  }

  const handleUpdateClient = async (clientData: UpdateClientRequest) => {
    if (!user?.business_id || !editingClient) return

    try {
      setUpdating(true)
      const updatedClient = await clientService.updateClient(user.business_id, editingClient.id, clientData)
      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c))
      setEditingClient(null)
      setError(null)
      
      // Reload the client list to ensure consistency
      loadClients(currentPage, searchTerm)
    } catch (err) {
      setError('Ошибка при обновлении клиента')
      console.error('Error updating client:', err)
      throw err
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteClient = (clientId: string) => {
    // TODO: Implement delete functionality
    console.log('Delete client:', clientId)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Клиенты</h1>
        <p className="text-muted-foreground">
          Управление списком клиентов вашей компании
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Список клиентов
          </CardTitle>
          <CardDescription>
            {totalClients > 0
              ? `Всего клиентов: ${totalClients}`
              : 'Здесь будет отображаться список всех клиентов'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientList
            clients={clients}
            loading={loading}
            error={error || undefined}
            searchTerm={searchTerm}
            onSearch={handleSearch}
            onEdit={handleEditClient}
            onDelete={handleDeleteClient}
          />
        </CardContent>
      </Card>

      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {editingClient && (
            <EditClientForm
              client={editingClient}
              onSubmit={handleUpdateClient}
              loading={updating}
              onCancel={() => setEditingClient(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}