import { AddStaffForm } from '@/components/AddStaffForm'
import { StaffList } from '@/components/StaffList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { staffService } from '@/services/staff'
import type { CreateStaffRequest, Staff } from '@/types/staff'
import { Plus, Settings, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function StaffPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStaff = async () => {
    if (!user?.business_id) return

    try {
      setLoading(true)
      const staffData = await staffService.getStaffByBusiness(user.business_id)
      setStaff(staffData)
      setError(null)
    } catch (err) {
      setError('Ошибка при загрузке списка сотрудников')
      console.error('Error loading staff:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
  }, [user?.business_id])

  const handleCreateStaff = async (staffData: CreateStaffRequest) => {
    if (!user?.business_id) return

    try {
      setCreating(true)
      const newStaff = await staffService.createStaff(user.business_id, staffData)
      setStaff(prev => [newStaff, ...prev])
      setShowAddForm(false)
      setError(null)
    } catch (err) {
      setError('Ошибка при создании сотрудника')
      console.error('Error creating staff:', err)
      throw err // Re-throw to prevent form reset
    } finally {
      setCreating(false)
    }
  }

  const handleEditStaff = (staff: Staff) => {
    // TODO: Implement edit functionality
    console.log('Edit staff:', staff)
  }

  const handleDeleteStaff = async (staffId: string) => {
    // TODO: Implement delete functionality
    console.log('Delete staff:', staffId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Персонал</h1>
          <p className="text-muted-foreground">
            Управление сотрудниками и их расписанием
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate('/staff-services')}
            disabled={staff.length === 0}
          >
            <Settings className="mr-2 h-4 w-4" />
            Привязка услуг
          </Button>
          <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить сотрудника
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <AddStaffForm
              onSubmit={handleCreateStaff}
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
            <Users className="mr-2 h-5 w-5" />
            Список сотрудников
          </CardTitle>
          <CardDescription>
            {staff.length > 0
              ? `Всего сотрудников: ${staff.length}`
              : 'Здесь будет отображаться список всех сотрудников'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffList
            staff={staff}
            loading={loading}
            onEdit={handleEditStaff}
            onDelete={handleDeleteStaff}
          />
        </CardContent>
      </Card>
    </div>
  )
}