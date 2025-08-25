import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Clock, Edit, Trash2 } from 'lucide-react'
import type { Service } from '@/types/service'

interface ServiceListProps {
  services: Service[]
  loading?: boolean
  onEdit?: (service: Service) => void
  onDelete?: (serviceId: string) => void
}

export function ServiceList({ services, loading = false, onEdit, onDelete }: ServiceListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/5"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Нет услуг</h3>
          <p className="text-muted-foreground text-center">
            Добавьте первую услугу, чтобы клиенты могли записываться
          </p>
        </CardContent>
      </Card>
    )
  }

  const formatPrice = (cents: number): string => {
    return (cents / 100).toFixed(2)
  }

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} мин`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return `${hours} ч`
    }
    return `${hours} ч ${remainingMinutes} мин`
  }

  return (
    <div className="space-y-4">
      {services.map((service) => (
        <Card key={service.id} className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{service.name}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(service)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(service.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDuration(service.duration_min)}</span>
                </div>
                
                <div className="flex items-center gap-1 text-lg font-semibold">
                  <span>{formatPrice(service.price_cents)} ₽</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Добавлена: {new Date(service.created_at).toLocaleDateString('ru-RU')}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}