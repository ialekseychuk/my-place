import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Mail, Phone, Calendar, Edit, Trash2 } from 'lucide-react'
import type { Client } from '@/types/client'

interface ClientListItemProps {
  client: Client
  onEdit?: (client: Client) => void
  onDelete?: (clientId: string) => void
}

export function ClientListItem({ client, onEdit, onDelete }: ClientListItemProps) {
  const fullName = `${client.first_name} ${client.last_name}`
  
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-full p-2">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{fullName}</CardTitle>
              <p className="text-sm text-muted-foreground">Клиент</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(client)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(client.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {client.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{client.email}</span>
            </div>
          )}
          
          {client.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{client.phone}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Добавлен: {new Date(client.created_at).toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}