import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { serviceService } from '@/services/service'
import { staffService } from '@/services/staff'
import { staffServiceService } from '@/services/staff-service'
import type { Service } from '@/types/service'
import type { Staff } from '@/types/staff'
import { Package, RotateCcw, Save, Settings, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

export function StaffServiceAssignment() {
  const { user } = useAuth()
  const [staff, setStaff] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [staffServices, setStaffServices] = useState<Record<string, string[]>>({}) // staffId -> serviceIds[]
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const loadData = async () => {
    if (!user?.business_id) return

    try {
      setLoading(true)
      setError(null)

      const [staffData, servicesData] = await Promise.all([
        staffService.getStaffByBusiness(user.business_id),
        serviceService.getServicesByBusiness(user.business_id)
      ])

      setStaff(staffData)
      setServices(servicesData)

      // Load current staff-service assignments
      const assignments: Record<string, string[]> = {}
      for (const member of staffData) {
        try {
          const memberServices = await staffServiceService.getStaffServices(user.business_id, member.id)
          assignments[member.id] = memberServices.map(s => s.id)
        } catch (err) {
          console.error(`Failed to load services for staff ${member.id}:`, err)
          assignments[member.id] = []
        }
      }
      setStaffServices(assignments)
    } catch (err) {
      setError('Ошибка при загрузке данных')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.business_id])

  const handleServiceToggle = (staffId: string, serviceId: string, checked: boolean) => {
    setStaffServices(prev => {
      const current = prev[staffId] || []
      const updated = checked 
        ? [...current, serviceId]
        : current.filter(id => id !== serviceId)
      
      const newState = { ...prev, [staffId]: updated }
      setHasChanges(true)
      return newState
    })
  }

  const saveChanges = async () => {
    if (!user?.business_id) return

    try {
      setSaving(true)
      setError(null)

      // Update services for each staff member
      for (const [staffId, serviceIds] of Object.entries(staffServices)) {
        await staffServiceService.replaceStaffServices(user.business_id, staffId, {
          service_ids: serviceIds
        })
      }

      setHasChanges(false)
    } catch (err) {
      setError('Ошибка при сохранении изменений')
      console.error('Error saving changes:', err)
    } finally {
      setSaving(false)
    }
  }

  const resetChanges = () => {
    loadData()
    setHasChanges(false)
  }

  const getServiceCount = (staffId: string) => {
    return staffServices[staffId]?.length || 0
  }

  const getStaffCount = (serviceId: string) => {
    return Object.values(staffServices).filter(services => 
      services.includes(serviceId)
    ).length
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Привязка услуг к мастерам</h1>
            <p className="text-muted-foreground">
              Управление тем, какие услуги может выполнять каждый мастер
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (staff.length === 0 || services.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Привязка услуг к мастерам</h1>
            <p className="text-muted-foreground">
              Управление тем, какие услуги может выполнять каждый мастер
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Нет данных для настройки</h3>
            <p className="text-muted-foreground text-center">
              {staff.length === 0 && "Добавьте сотрудников чтобы настроить привязку услуг"}
              {services.length === 0 && "Добавьте услуги чтобы настроить привязку к мастерам"}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Привязка услуг к мастерам</h1>
          <p className="text-muted-foreground">
            Управление тем, какие услуги может выполнять каждый мастер
          </p>
        </div>
        
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetChanges} disabled={saving}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Отменить
            </Button>
            <Button onClick={saveChanges} disabled={saving}>
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Сохранить изменения
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Staff column */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Мастера ({staff.length})
            </CardTitle>
            <CardDescription>
              Выберите услуги для каждого мастера
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {staff.map((member) => (
              <div key={member.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{member.first_name} {member.last_name}</h4>
                    <p className="text-sm text-muted-foreground">{member.position}</p>
                  </div>
                  <Badge variant="outline">
                    {getServiceCount(member.id)} услуг
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {services.map((service) => (
                    <label
                      key={`${member.id}-${service.id}`}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <Checkbox
                        checked={staffServices[member.id]?.includes(service.id) || false}
                        onCheckedChange={(checked) => 
                          handleServiceToggle(member.id, service.id, checked as boolean)
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{service.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {service.duration_min} мин • {(service.price_cents / 100).toFixed(2)} ₽
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                {member.id !== staff[staff.length - 1].id && (
                  <Separator className="my-4" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Services column */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Услуги ({services.length})
            </CardTitle>
            <CardDescription>
              Показано, какие мастера могут выполнять каждую услугу
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {services.map((service) => (
              <div key={service.id} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{service.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {service.duration_min} мин • {(service.price_cents / 100).toFixed(2)} ₽
                    </p>
                  </div>
                  <Badge variant="outline">
                    {getStaffCount(service.id)} мастеров
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-1">
                  {staff
                    .filter(member => staffServices[member.id]?.includes(service.id))
                    .map(member => (
                      <Badge key={member.id} variant="secondary" className="text-xs">
                        {member.first_name} {member.last_name}
                      </Badge>
                    ))}
                  
                  {getStaffCount(service.id) === 0 && (
                    <span className="text-xs text-muted-foreground italic">
                      Нет назначенных мастеров
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {hasChanges && (
        <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="text-sm text-muted-foreground mb-3">
            У вас есть несохраненные изменения
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetChanges} disabled={saving}>
              Отменить
            </Button>
            <Button size="sm" onClick={saveChanges} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}