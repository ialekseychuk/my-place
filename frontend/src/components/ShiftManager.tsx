import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import type {
    CreateShiftRequest,
    ShiftResponse,
    UpdateShiftRequest
} from '@/services/scheduleService'
import {
    ScheduleService
} from '@/services/scheduleService'
import { AlertTriangle, Calendar, CheckCircle, Clock, Edit, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Staff {
  id: string
  first_name: string
  last_name: string
  position: string
  is_active: boolean
}

interface ShiftManagerProps {
  staff: Staff[]
  businessId: string
  selectedDate?: string
  onShiftCreated?: (shift: ShiftResponse) => void
  onShiftUpdated?: (shift: ShiftResponse) => void
}

export function ShiftManager({ 
  staff, 
  businessId, 
  selectedDate = new Date().toISOString().split('T')[0],
  onShiftCreated,
  onShiftUpdated 
}: ShiftManagerProps) {
  const { user } = useAuth()
  const [scheduleService] = useState(() => new ScheduleService(businessId))
  const [shifts, setShifts] = useState<ShiftResponse[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<ShiftResponse | null>(null)
  const [selectedShifts, setSelectedShifts] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<'enable' | 'disable' | 'delete' | ''>('')
  const [isBulkCreateDialogOpen, setIsBulkCreateDialogOpen] = useState(false)
  const [dateRange, setDateRange] = useState({
    start: selectedDate,
    end: selectedDate
  })

  // Form state
  const [shiftForm, setShiftForm] = useState<CreateShiftRequest>({
    staff_id: '',
    shift_date: selectedDate,
    start_time: '09:00',
    end_time: '18:00',
    break_start_time: '12:00',
    break_end_time: '13:00',
    shift_type: 'regular',
    notes: '',
    created_by: user?.id || ''
  })

  // Bulk creation form state
  const [bulkShiftForm, setBulkShiftForm] = useState({
    staff_ids: [] as string[],
    start_date: selectedDate,
    end_date: selectedDate,
    start_time: '09:00',
    end_time: '18:00',
    break_start_time: '12:00',
    break_end_time: '13:00',
    shift_type: 'regular' as 'regular' | 'overtime' | 'holiday' | 'emergency',
    notes: '',
    exclude_weekends: true,
    template_id: ''
  })

  useEffect(() => {
    loadShifts()
  }, [dateRange, selectedStaffId])

  const loadShifts = async () => {
    setLoading(true)
    try {
      if (selectedStaffId) {
        const data = await scheduleService.getStaffShifts(selectedStaffId, dateRange.start, dateRange.end)
        setShifts(data)
      } else {
        // Load shifts for all staff in date range
        const allShifts: ShiftResponse[] = []
        for (const staffMember of staff) {
          try {
            const staffShifts = await scheduleService.getStaffShifts(staffMember.id, dateRange.start, dateRange.end)
            allShifts.push(...staffShifts)
          } catch (error) {
            console.error(`Error loading shifts for staff ${staffMember.id}:`, error)
          }
        }
        setShifts(allShifts)
      }
    } catch (error) {
      console.error('Error loading shifts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateShift = async () => {
    if (!shiftForm.staff_id || !shiftForm.shift_date) {
      alert('Пожалуйста, заполните обязательные поля')
      return
    }

    try {
      const newShift = await scheduleService.createShift({
        ...shiftForm,
        created_by: user?.id || ''
      })
      setShifts(prev => [...prev, newShift])
      setIsCreateDialogOpen(false)
      resetForm()
      onShiftCreated?.(newShift)
    } catch (error) {
      console.error('Error creating shift:', error)
      alert('Ошибка при создании смены')
    }
  }

  const handleUpdateShift = async () => {
    if (!editingShift) return

    try {
      const updateData: UpdateShiftRequest = {
        start_time: shiftForm.start_time,
        end_time: shiftForm.end_time,
        break_start_time: shiftForm.break_start_time,
        break_end_time: shiftForm.break_end_time,
        shift_type: shiftForm.shift_type,
        notes: shiftForm.notes,
        updated_by: user?.id || ''
      }
      
      const updatedShift = await scheduleService.updateShift(editingShift.id, updateData)
      setShifts(prev => prev.map(s => s.id === editingShift.id ? updatedShift : s))
      setEditingShift(null)
      resetForm()
      onShiftUpdated?.(updatedShift)
    } catch (error) {
      console.error('Error updating shift:', error)
      alert('Ошибка при обновлении смены')
    }
  }

  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту смену?')) return

    try {
      await scheduleService.deleteShift(shiftId)
      setShifts(prev => prev.filter(s => s.id !== shiftId))
    } catch (error) {
      console.error('Error deleting shift:', error)
      alert('Ошибка при удалении смены')
    }
  }

  const handleToggleAvailability = async (shiftId: string, isAvailable: boolean) => {
    try {
      await scheduleService.updateShiftAvailability(shiftId, isAvailable, 
        isAvailable ? 'Включено администратором' : 'Отключено администратором')
      setShifts(prev => prev.map(s => 
        s.id === shiftId ? { ...s, is_available: isAvailable } : s
      ))
    } catch (error) {
      console.error('Error updating shift availability:', error)
      alert('Ошибка при изменении доступности смены')
    }
  }

  const handleBulkAction = async () => {
    if (selectedShifts.length === 0 || !bulkAction) return

    const reason = prompt(`Укажите причину для ${
      bulkAction === 'enable' ? 'включения' : 
      bulkAction === 'disable' ? 'отключения' : 'удаления'
    } смен:`)
    
    if (!reason) return

    try {
      // Note: This would need to be implemented on the backend
      // For now, we'll handle each shift individually
      for (const shiftId of selectedShifts) {
        if (bulkAction === 'delete') {
          await scheduleService.deleteShift(shiftId)
        } else {
          await scheduleService.updateShiftAvailability(shiftId, bulkAction === 'enable', reason)
        }
      }

      setShifts(prev => {
        if (bulkAction === 'delete') {
          return prev.filter(s => !selectedShifts.includes(s.id))
        } else {
          return prev.map(s => 
            selectedShifts.includes(s.id) 
              ? { ...s, is_available: bulkAction === 'enable' }
              : s
          )
        }
      })

      setSelectedShifts([])
      setBulkAction('')
    } catch (error) {
      console.error('Error performing bulk action:', error)
      alert('Ошибка при выполнении массовой операции')
    }
  }

  const handleBulkCreateShifts = async () => {
    if (bulkShiftForm.staff_ids.length === 0) {
      alert('Выберите хотя бы одного сотрудника')
      return
    }

    if (!bulkShiftForm.start_date || !bulkShiftForm.end_date) {
      alert('Укажите период создания смен')
      return
    }

    try {
      const startDate = new Date(bulkShiftForm.start_date)
      const endDate = new Date(bulkShiftForm.end_date)
      const createdShifts: ShiftResponse[] = []

      for (const staffId of bulkShiftForm.staff_ids) {
        const currentDate = new Date(startDate)
        
        while (currentDate <= endDate) {
          const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6
          
          if (!bulkShiftForm.exclude_weekends || !isWeekend) {
            try {
              const newShift = await scheduleService.createShift({
                staff_id: staffId,
                shift_date: currentDate.toISOString().split('T')[0],
                start_time: bulkShiftForm.start_time,
                end_time: bulkShiftForm.end_time,
                break_start_time: bulkShiftForm.break_start_time,
                break_end_time: bulkShiftForm.break_end_time,
                shift_type: bulkShiftForm.shift_type,
                notes: bulkShiftForm.notes,
                created_by: user?.id || ''
              })
              createdShifts.push(newShift)
            } catch (error) {
              console.error(`Error creating shift for ${staffId} on ${currentDate.toISOString().split('T')[0]}:`, error)
            }
          }
          
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }

      setShifts(prev => [...prev, ...createdShifts])
      setIsBulkCreateDialogOpen(false)
      resetBulkForm()
      alert(`Создано ${createdShifts.length} смен`)
    } catch (error) {
      console.error('Error creating bulk shifts:', error)
      alert('Ошибка при массовом создании смен')
    }
  }

  const resetForm = () => {
    setShiftForm({
      staff_id: '',
      shift_date: selectedDate,
      start_time: '09:00',
      end_time: '18:00',
      break_start_time: '12:00',
      break_end_time: '13:00',
      shift_type: 'regular',
      notes: '',
      created_by: user?.id || ''
    })
  }

  const resetBulkForm = () => {
    setBulkShiftForm({
      staff_ids: [],
      start_date: selectedDate,
      end_date: selectedDate,
      start_time: '09:00',
      end_time: '18:00',
      break_start_time: '12:00',
      break_end_time: '13:00',
      shift_type: 'regular',
      notes: '',
      exclude_weekends: true,
      template_id: ''
    })
  }

  const startEdit = (shift: ShiftResponse) => {
    setEditingShift(shift)
    setShiftForm({
      staff_id: shift.staff_id,
      shift_date: shift.shift_date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      break_start_time: shift.break_start_time || '12:00',
      break_end_time: shift.break_end_time || '13:00',
      shift_type: shift.shift_type as 'regular' | 'overtime' | 'holiday' | 'emergency',
      notes: shift.notes || '',
      created_by: user?.id || ''
    })
  }

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'regular': return 'bg-blue-100 text-blue-800'
      case 'overtime': return 'bg-orange-100 text-orange-800'
      case 'holiday': return 'bg-green-100 text-green-800'
      case 'emergency': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getShiftTypeLabel = (type: string) => {
    switch (type) {
      case 'regular': return 'Обычная'
      case 'overtime': return 'Сверхурочная'
      case 'holiday': return 'Праздничная'
      case 'emergency': return 'Экстренная'
      default: return type
    }
  }

  const calculateShiftDuration = (startTime: string, endTime: string, breakStart?: string, breakEnd?: string) => {
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    let totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60)

    if (breakStart && breakEnd) {
      const breakStartTime = new Date(`2000-01-01T${breakStart}:00`)
      const breakEndTime = new Date(`2000-01-01T${breakEnd}:00`)
      const breakMinutes = (breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60)
      totalMinutes -= breakMinutes
    }

    return (totalMinutes / 60).toFixed(1)
  }

  const filteredShifts = shifts.filter(shift => 
    !selectedStaffId || shift.staff_id === selectedStaffId
  )

  const groupedShifts = filteredShifts.reduce((groups, shift) => {
    const date = shift.shift_date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(shift)
    return groups
  }, {} as Record<string, ShiftResponse[]>)

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="space-y-2">
            <Label>Сотрудник</Label>
            <Select value={selectedStaffId || 'all'} onValueChange={(value) => setSelectedStaffId(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Все сотрудники" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все сотрудники</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.first_name} {s.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Период</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-[150px]"
              />
              <span>—</span>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-[150px]"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {selectedShifts.length > 0 && (
            <>
              <Select value={bulkAction} onValueChange={(value) => setBulkAction(value as 'enable' | 'disable' | 'delete' | '')}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Действие" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enable">Включить</SelectItem>
                  <SelectItem value="disable">Отключить</SelectItem>
                  <SelectItem value="delete">Удалить</SelectItem>
                </SelectContent>
              </Select>
              {bulkAction && (
                <Button onClick={handleBulkAction} variant="outline">
                  Применить ({selectedShifts.length})
                </Button>
              )}
            </>
          )}

          <Dialog open={isCreateDialogOpen || !!editingShift} onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false)
              setEditingShift(null)
              resetForm()
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить смену
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingShift ? 'Редактировать смену' : 'Создать смену'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Сотрудник</Label>
                    <Select 
                      value={shiftForm.staff_id} 
                      onValueChange={(value) => setShiftForm(prev => ({ ...prev, staff_id: value }))}
                      disabled={!!editingShift}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите сотрудника" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.first_name} {s.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Дата</Label>
                    <Input
                      type="date"
                      value={shiftForm.shift_date}
                      onChange={(e) => setShiftForm(prev => ({ ...prev, shift_date: e.target.value }))}
                      disabled={!!editingShift}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Начало смены</Label>
                    <Input
                      type="time"
                      value={shiftForm.start_time}
                      onChange={(e) => setShiftForm(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Конец смены</Label>
                    <Input
                      type="time"
                      value={shiftForm.end_time}
                      onChange={(e) => setShiftForm(prev => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Начало перерыва</Label>
                    <Input
                      type="time"
                      value={shiftForm.break_start_time}
                      onChange={(e) => setShiftForm(prev => ({ ...prev, break_start_time: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Конец перерыва</Label>
                    <Input
                      type="time"
                      value={shiftForm.break_end_time}
                      onChange={(e) => setShiftForm(prev => ({ ...prev, break_end_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Тип смены</Label>
                  <Select 
                    value={shiftForm.shift_type} 
                    onValueChange={(value) => setShiftForm(prev => ({ 
                      ...prev, 
                      shift_type: value as 'regular' | 'overtime' | 'holiday' | 'emergency'
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Обычная</SelectItem>
                      <SelectItem value="overtime">Сверхурочная</SelectItem>
                      <SelectItem value="holiday">Праздничная</SelectItem>
                      <SelectItem value="emergency">Экстренная</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Примечания</Label>
                  <Textarea
                    value={shiftForm.notes}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Дополнительная информация о смене"
                    rows={3}
                  />
                </div>

                <div className="text-sm text-gray-600">
                  Продолжительность: {calculateShiftDuration(
                    shiftForm.start_time, 
                    shiftForm.end_time, 
                    shiftForm.break_start_time, 
                    shiftForm.break_end_time
                  )} часов
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsCreateDialogOpen(false)
                    setEditingShift(null)
                    resetForm()
                  }}>
                    Отмена
                  </Button>
                  <Button onClick={editingShift ? handleUpdateShift : handleCreateShift}>
                    <Save className="mr-2 h-4 w-4" />
                    {editingShift ? 'Обновить' : 'Создать'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isBulkCreateDialogOpen} onOpenChange={setIsBulkCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Массовое создание
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Массовое создание смен</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Сотрудники</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {staff.map((s) => (
                      <label key={s.id} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                        <Checkbox
                          checked={bulkShiftForm.staff_ids.includes(s.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setBulkShiftForm(prev => ({
                                ...prev,
                                staff_ids: [...prev.staff_ids, s.id]
                              }))
                            } else {
                              setBulkShiftForm(prev => ({
                                ...prev,
                                staff_ids: prev.staff_ids.filter(id => id !== s.id)
                              }))
                            }
                          }}
                        />
                        <span className="text-sm">{s.first_name} {s.last_name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Дата начала</Label>
                    <Input
                      type="date"
                      value={bulkShiftForm.start_date}
                      onChange={(e) => setBulkShiftForm(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Дата окончания</Label>
                    <Input
                      type="date"
                      value={bulkShiftForm.end_date}
                      onChange={(e) => setBulkShiftForm(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Начало смены</Label>
                    <Input
                      type="time"
                      value={bulkShiftForm.start_time}
                      onChange={(e) => setBulkShiftForm(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Конец смены</Label>
                    <Input
                      type="time"
                      value={bulkShiftForm.end_time}
                      onChange={(e) => setBulkShiftForm(prev => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Начало перерыва</Label>
                    <Input
                      type="time"
                      value={bulkShiftForm.break_start_time}
                      onChange={(e) => setBulkShiftForm(prev => ({ ...prev, break_start_time: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Конец перерыва</Label>
                    <Input
                      type="time"
                      value={bulkShiftForm.break_end_time}
                      onChange={(e) => setBulkShiftForm(prev => ({ ...prev, break_end_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Тип смены</Label>
                    <Select 
                      value={bulkShiftForm.shift_type} 
                      onValueChange={(value) => setBulkShiftForm(prev => ({ 
                        ...prev, 
                        shift_type: value as 'regular' | 'overtime' | 'holiday' | 'emergency'
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Обычная</SelectItem>
                        <SelectItem value="overtime">Сверхурочная</SelectItem>
                        <SelectItem value="holiday">Праздничная</SelectItem>
                        <SelectItem value="emergency">Экстренная</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      <Checkbox 
                        checked={bulkShiftForm.exclude_weekends}
                        onCheckedChange={(checked) => 
                          setBulkShiftForm(prev => ({ ...prev, exclude_weekends: !!checked }))
                        }
                      />
                      <span className="ml-2">Исключить выходные</span>
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Примечания</Label>
                  <Textarea
                    value={bulkShiftForm.notes}
                    onChange={(e) => setBulkShiftForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Общие примечания для всех смен"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsBulkCreateDialogOpen(false)
                    resetBulkForm()
                  }}>
                    Отмена
                  </Button>
                  <Button onClick={handleBulkCreateShifts}>
                    <Save className="mr-2 h-4 w-4" />
                    Создать смены
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Shifts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Загрузка...</div>
        ) : Object.keys(groupedShifts).length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Нет смен в выбранном периоде</p>
              <p className="text-sm text-gray-400">Создайте первую смену</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedShifts)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, dateShifts]) => (
              <Card key={date}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5" />
                      {new Date(date).toLocaleDateString('ru-RU', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <Badge variant="outline">
                      {dateShifts.length} смен
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dateShifts.map((shift) => (
                      <div 
                        key={shift.id} 
                        className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedShifts.includes(shift.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedShifts(prev => [...prev, shift.id])
                              } else {
                                setSelectedShifts(prev => prev.filter(id => id !== shift.id))
                              }
                            }}
                          />
                          <div>
                            <div className="font-medium">{shift.staff_name}</div>
                            <div className="text-sm text-gray-600">
                              {shift.start_time} - {shift.end_time}
                              {shift.break_start_time && (
                                <span className="ml-2">
                                  (перерыв: {shift.break_start_time} - {shift.break_end_time})
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              Продолжительность: {calculateShiftDuration(
                                shift.start_time, 
                                shift.end_time, 
                                shift.break_start_time, 
                                shift.break_end_time
                              )} часов
                            </div>
                            {shift.notes && (
                              <div className="text-xs text-gray-500 mt-1">
                                Примечания: {shift.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Badge className={getShiftTypeColor(shift.shift_type)}>
                            {getShiftTypeLabel(shift.shift_type)}
                          </Badge>
                          
                          {shift.is_available ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleAvailability(shift.id, !shift.is_available)}
                          >
                            {shift.is_available ? 'Отключить' : 'Включить'}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(shift)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteShift(shift.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  )
}