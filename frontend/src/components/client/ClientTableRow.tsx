import React from 'react'
import { 
  TableBody, 
  TableCell, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import type { Client } from '@/types/client'

interface ClientTableRowProps {
  client: Client
  onEdit?: (client: Client) => void
  onDelete?: (clientId: string) => void
}

export function ClientTableRow({ client, onEdit, onDelete }: ClientTableRowProps) {
  const fullName = `${client.first_name} ${client.last_name}`
  const formattedDate = new Date(client.created_at).toLocaleDateString('ru-RU')
  
  return (
    <TableRow>
      <TableCell className="font-medium">{fullName}</TableCell>
      <TableCell>{client.email}</TableCell>
      <TableCell>{client.phone}</TableCell>
      <TableCell>{formattedDate}</TableCell>
      <TableCell>
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
      </TableCell>
    </TableRow>
  )
}