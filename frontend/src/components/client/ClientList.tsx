import React from 'react'
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Users } from 'lucide-react'
import { ClientTableRow } from '@/components/client/ClientTableRow'
import type { Client } from '@/types/client'

interface ClientListProps {
  clients: Client[]
  loading?: boolean
  error?: string
  searchTerm?: string
  onSearch?: (term: string) => void
  onEdit?: (client: Client) => void
  onDelete?: (clientId: string) => void
}

export function ClientList({ 
  clients, 
  loading = false, 
  error,
  searchTerm = '',
  onSearch,
  onEdit,
  onDelete
}: ClientListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {/* Skeleton for search input */}
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          
          {/* Skeleton for table */}
          <div className="border rounded-md">
            <div className="h-12 bg-gray-200 rounded-t-md"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 border-b"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
            {error}
          </div>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Повторить попытку
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Нет клиентов</h3>
          <p className="text-muted-foreground text-center">
            {searchTerm 
              ? 'По вашему запросу клиенты не найдены' 
              : 'Добавьте первого клиента, чтобы начать работу'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {onSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Поиск клиентов..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      )}
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Имя клиента</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Добавлен</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <ClientTableRow
                key={client.id}
                client={client}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}