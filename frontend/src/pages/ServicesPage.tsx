import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Package } from 'lucide-react'
import { AddServiceForm } from '@/components/AddServiceForm'
import { ServiceList } from '@/components/ServiceList'
import { serviceService } from '@/services/service'
import { useAuth } from '@/contexts/AuthContext'
import type { Service, CreateServiceRequest } from '@/types/service'

export function ServicesPage() {
  const { user } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadServices = async () => {
    if (!user?.business_id) return

    try {
      setLoading(true)
      const servicesData = await serviceService.getServicesByBusiness(user.business_id)
      setServices(servicesData)
      setError(null)
    } catch (err) {
      setError('Ошибка при загрузке списка услуг')
      console.error('Error loading services:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [user?.business_id])

  const handleCreateService = async (serviceData: CreateServiceRequest) => {
    if (!user?.business_id) return

    try {
      setCreating(true)
      const newService = await serviceService.createService(user.business_id, serviceData)
      setServices(prev => [newService, ...prev])
      setShowAddForm(false)
      setError(null)
    } catch (err) {
      setError('Ошибка при создании услуги')
      console.error('Error creating service:', err)
      throw err // Re-throw to prevent form reset
    } finally {
      setCreating(false)
    }
  }

  const handleEditService = (service: Service) => {
    // TODO: Implement edit functionality
    console.log('Edit service:', service)
  }

  const handleDeleteService = async (serviceId: string) => {
    // TODO: Implement delete functionality
    console.log('Delete service:', serviceId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Услуги</h1>
          <p className="text-muted-foreground">
            Управление услугами и их стоимостью
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить услугу
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <AddServiceForm
              onSubmit={handleCreateService}
              loading={creating}
            />
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
                disabled={creating}
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Список услуг
          </CardTitle>
          <CardDescription>
            {services.length > 0
              ? `Всего услуг: ${services.length}`
              : 'Здесь будет отображаться список всех услуг'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceList
            services={services}
            loading={loading}
            onEdit={handleEditService}
            onDelete={handleDeleteService}
          />
        </CardContent>
      </Card>
    </div>
  )
}