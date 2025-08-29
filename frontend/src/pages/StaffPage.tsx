import { AddStaffForm } from '@/components/staff/AddStaffForm'
import { EditStaffForm } from '@/components/staff/EditStaffForm'
import { StaffList } from '@/components/staff/StaffList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from '@/contexts/LocationContext'
import { useStaffData } from '@/contexts/StaffDataContext'
import { staffService } from '@/services/staff'
import type { CreateStaffRequest, Staff, UpdateStaffRequest } from '@/types/staff'
import { Plus, Settings, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function StaffPage() {
  const { user } = useAuth()
  const { currentLocation } = useLocation()
  const { staff, loading, error, refreshStaff } = useStaffData()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

  // Check if location is selected
  const isLocationSelected = !!currentLocation?.id

  const handleCreateStaff = async (staffData: CreateStaffRequest) => {
    if (!user?.business_id || !isLocationSelected) return

    try {
      setCreating(true)
      const newStaff = await staffService.createStaff(user.business_id, staffData)
      // Update the shared context
      await refreshStaff()
      setShowAddForm(false)
    } catch (err) {
      console.error('Error creating staff:', err)
      throw err // Re-throw to prevent form reset
    } finally {
      setCreating(false)
    }
  }

  const handleEditStaff = (staff: Staff) => {
    setEditingStaff(staff)
  }

  const handleUpdateStaff = async (staffData: UpdateStaffRequest) => {
    if (!user?.business_id || !editingStaff || !isLocationSelected) return

    try {
      setUpdating(true)
      const updatedStaff = await staffService.updateStaff(user.business_id, editingStaff.id, staffData)
      // Update the shared context
      await refreshStaff()
      setEditingStaff(null)
    } catch (err) {
      console.error('Error updating staff:', err)
      throw err
    } finally {
      setUpdating(false)
    }
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
            disabled={!isLocationSelected || !staff || staff.length === 0}
          >
            <Settings className="mr-2 h-4 w-4" />
            Привязка услуг
          </Button>
          <Button onClick={() => setShowAddForm(true)} disabled={!isLocationSelected || showAddForm}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить сотрудника
          </Button>
        </div>
      </div>

      {!isLocationSelected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
          Пожалуйста, выберите локацию в верхнем меню для управления сотрудниками
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          {error}
        </div>
      )}

      {showAddForm && isLocationSelected && (
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
            {staff && staff.length > 0
              ? `Всего сотрудников: ${staff.length}`
              : isLocationSelected 
                ? 'Список сотрудников пуст'
                : 'Выберите локацию для просмотра сотрудников'
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

      <Dialog open={!!editingStaff} onOpenChange={(open) => !open && setEditingStaff(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {editingStaff && isLocationSelected && (
            <EditStaffForm
              staff={editingStaff}
              onSubmit={handleUpdateStaff}
              loading={updating}
              onCancel={() => setEditingStaff(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}