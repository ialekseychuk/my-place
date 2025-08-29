import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/contexts/NotificationContext'
import { formatTime } from '@/lib/utils'
import type {
  CreateShiftRequest,
  ShiftResponse,
  UpdateShiftRequest
} from '@/services/scheduleService'
import {
  ScheduleService
} from '@/services/scheduleService'
import { AlertTriangle, Calendar, CheckCircle, Clock, Edit, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

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
  const { showError, showSuccess, showConfirm, showPrompt } = useNotification()
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

  // Create a string representation of dateRange for useEffect dependencies
  const dateRangeString = useMemo(() => `${dateRange.start}-${dateRange.end}`, [dateRange])

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
  }, [dateRangeString, selectedStaffId]) // Use the string representation

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
    // Validate required fields
    if (!shiftForm.staff_id || !shiftForm.shift_date) {
      showError('Пожалуйста, заполните обязательные поля')
      return
    }

    // Validate time logic
    if (shiftForm.start_time >= shiftForm.end_time) {
      showError('Время окончания должно быть позже времени начала')
      return
    }

    // Validate break times if provided
    if (shiftForm.break_start_time && shiftForm.break_end_time) {
      if (shiftForm.break_start_time >= shiftForm.break_end_time) {
        showError('Время окончания перерыва должно быть позже времени начала перерыва')
        return
      }
      
      if (shiftForm.break_start_time < shiftForm.start_time || shiftForm.break_end_time > shiftForm.end_time) {
        showError('Перерыв должен быть в пределах рабочего времени')
        return
      }
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
      showSuccess('Смена успешно создана')
    } catch (error) {
      console.error('Error creating shift:', error)
      showError('Ошибка при создании смены')
    }
  }

  const handleUpdateShift = async () => {
    if (!editingShift) return

    // Validate time logic
    if (shiftForm.start_time >= shiftForm.end_time) {
      showError('Время окончания должно быть позже времени начала')
      return
    }

    // Validate break times if provided
    if (shiftForm.break_start_time && shiftForm.break_end_time) {
      if (shiftForm.break_start_time >= shiftForm.break_end_time) {
        showError('Время окончания перерыва должно быть позже времени начала перерыва')
        return
      }
      
      if (shiftForm.break_start_time < shiftForm.start_time || shiftForm.break_end_time > shiftForm.end_time) {
        showError('Перерыв должен быть в пределах рабочего времени')
        return
      }
    }

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
      showSuccess('Смена успешно обновлена')
    } catch (error) {
      console.error('Error updating shift:', error)
      showError('Ошибка при обновлении смены')
    }
  }

  const handleDeleteShift = async (shiftId: string) => {
    const confirmed = await showConfirm({
      title: 'Удаление смены',
      description: 'Вы уверены, что хотите удалить эту смену?',
      variant: 'destructive',
      confirmText: 'Удалить',
      cancelText: 'Отмена'
    })
    
    if (!confirmed) return

    try {
      await scheduleService.deleteShift(shiftId)
      setShifts(prev => prev.filter(s => s.id !== shiftId))
      showSuccess('Смена успешно удалена')
    } catch (error) {
      console.error('Error deleting shift:', error)
      showError('Ошибка при удалении смены')
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
      showError('Ошибка при изменении доступности смены')
    }
  }

  const handleBulkAction = async () => {
    if (selectedShifts.length === 0 || !bulkAction) return

    const reasonResult = await showPrompt({
      title: 'Причина действия',
      description: `Укажите причину для ${
        bulkAction === 'enable' ? 'включения' : 
        bulkAction === 'disable' ? 'отключения' : 'удаления'
      } смен:`,
      placeholder: 'Введите причину...'
    })
    
    if (!reasonResult.confirmed || !reasonResult.value) return

    try {
      // Note: This would need to be implemented on the backend
      // For now, we'll handle each shift individually
      for (const shiftId of selectedShifts) {
        if (bulkAction === 'delete') {
          await scheduleService.deleteShift(shiftId)
        } else {
          await scheduleService.updateShiftAvailability(shiftId, bulkAction === 'enable', reasonResult.value)
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
      showSuccess('Массовое действие выполнено успешно')
    } catch (error) {
      console.error('Error performing bulk action:', error)
      showError('Ошибка при выполнении массовой операции')
    }
  }

  const handleBulkCreateShifts = async () => {
    if (bulkShiftForm.staff_ids.length === 0) {
      showError('Выберите хотя бы одного сотрудника')
      return
    }

    if (!bulkShiftForm.start_date || !bulkShiftForm.end_date) {
      showError('Укажите период создания смен')
      return
    }

    // Validate date range
    if (bulkShiftForm.start_date > bulkShiftForm.end_date) {
      showError('Дата окончания должна быть позже даты начала')
      return
    }

    // Validate time logic
    if (bulkShiftForm.start_time >= bulkShiftForm.end_time) {
      showError('Время окончания должно быть позже времени начала')
      return
    }

    // Validate break times if provided
    if (bulkShiftForm.break_start_time && bulkShiftForm.break_end_time) {
      if (bulkShiftForm.break_start_time >= bulkShiftForm.break_end_time) {
        showError('Время окончания перерыва должно быть позже времени начала перерыва')
        return
      }
      
      if (bulkShiftForm.break_start_time < bulkShiftForm.start_time || bulkShiftForm.break_end_time > bulkShiftForm.end_time) {
        showError('Перерыв должен быть в пределах рабочего времени')
        return
      }
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
      showSuccess(`Создано ${createdShifts.length} смен`)
    } catch (error) {
      console.error('Error creating bulk shifts:', error)
      showError('Ошибка при массовом создании смен')
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
    const start = new Date(`2000-01-01T${startTime.slice(0,8)}`)
    const end = new Date(`2000-01-01T${endTime.slice(0,8)}`)
    let totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60)

    if (breakStart && breakEnd) {
      const breakStartTime = new Date(`2000-01-01T${breakStart.slice(0,8)}`)
      const breakEndTime = new Date(`2000-01-01T${breakEnd.slice(0,8)}`)
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
              <SelectTrigger className="w-[180px]">
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
              />
              <span>-</span>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Dialog open={isBulkCreateDialogOpen} onOpenChange={setIsBulkCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Массовое создание
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Массовое создание смен</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault()
                handleBulkCreateShifts()
              }}>
                <div className="grid gap-4 py-4">
                  {/* Staff selection with checkboxes */}
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">
                      Сотрудники
                    </Label>
                    <div className="col-span-3 space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                      {staff.map((s) => (
                        <div key={s.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`staff-${s.id}`}
                            checked={bulkShiftForm.staff_ids.includes(s.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setBulkShiftForm({
                                  ...bulkShiftForm,
                                  staff_ids: [...bulkShiftForm.staff_ids, s.id]
                                })
                              } else {
                                setBulkShiftForm({
                                  ...bulkShiftForm,
                                  staff_ids: bulkShiftForm.staff_ids.filter(id => id !== s.id)
                                })
                              }
                            }}
                          />
                          <Label htmlFor={`staff-${s.id}`}>
                            {s.first_name} {s.last_name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Date range fields */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">
                      Период
                    </Label>
                    <div className="col-span-3 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Input
                          type="date"
                          value={bulkShiftForm.start_date}
                          onChange={(e) => setBulkShiftForm({...bulkShiftForm, start_date: e.target.value})}
                        />
                        <span>-</span>
                        <Input
                          type="date"
                          value={bulkShiftForm.end_date}
                          onChange={(e) => setBulkShiftForm({...bulkShiftForm, end_date: e.target.value})}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="exclude-weekends"
                          checked={bulkShiftForm.exclude_weekends}
                          onCheckedChange={(checked) => setBulkShiftForm({...bulkShiftForm, exclude_weekends: !!checked})}
                        />
                        <Label htmlFor="exclude-weekends">
                          Исключить выходные
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Time fields */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="bulk_start_time" className="text-right">
                      Начало
                    </Label>
                    <Input
                      id="bulk_start_time"
                      type="time"
                      className="col-span-3"
                      value={bulkShiftForm.start_time}
                      onChange={(e) => setBulkShiftForm({...bulkShiftForm, start_time: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="bulk_end_time" className="text-right">
                      Окончание
                    </Label>
                    <Input
                      id="bulk_end_time"
                      type="time"
                      className="col-span-3"
                      value={bulkShiftForm.end_time}
                      onChange={(e) => setBulkShiftForm({...bulkShiftForm, end_time: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="bulk_break_start_time" className="text-right">
                      Начало перерыва
                    </Label>
                    <Input
                      id="bulk_break_start_time"
                      type="time"
                      className="col-span-3"
                      value={bulkShiftForm.break_start_time}
                      onChange={(e) => setBulkShiftForm({...bulkShiftForm, break_start_time: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="bulk_break_end_time" className="text-right">
                      Конец перерыва
                    </Label>
                    <Input
                      id="bulk_break_end_time"
                      type="time"
                      className="col-span-3"
                      value={bulkShiftForm.break_end_time}
                      onChange={(e) => setBulkShiftForm({...bulkShiftForm, break_end_time: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="bulk_shift_type" className="text-right">
                      Тип
                    </Label>
                    <Select
                      value={bulkShiftForm.shift_type}
                      onValueChange={(value) => setBulkShiftForm({...bulkShiftForm, shift_type: value as any})}
                    >
                      <SelectTrigger className="col-span-3">
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
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="bulk_notes" className="text-right">
                      Примечания
                    </Label>
                    <Textarea
                      id="bulk_notes"
                      className="col-span-3"
                      value={bulkShiftForm.notes}
                      onChange={(e) => setBulkShiftForm({...bulkShiftForm, notes: e.target.value})}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit">
                    Создать смены
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить смену
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedShifts.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Выбрано смен: {selectedShifts.length}
              </div>
              <div className="flex items-center space-x-2">
                <Select value={bulkAction} onValueChange={(value) => setBulkAction(value as any)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Выберите действие" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enable">Включить</SelectItem>
                    <SelectItem value="disable">Отключить</SelectItem>
                    <SelectItem value="delete">Удалить</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                >
                  Применить
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shifts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Смены сотрудников
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : Object.keys(groupedShifts).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет смен для отображения
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedShifts)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, dateShifts]) => (
                  <div key={date} className="border rounded-lg">
                    <div className="bg-gray-50 px-4 py-2 border-b">
                      <h3 className="font-medium">
                        {new Date(date).toLocaleDateString('ru-RU', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {dateShifts
                        .sort((a, b) => a.start_time.localeCompare(b.start_time))
                        .map((shift) => (
                          <div 
                            key={shift.id} 
                            className={`p-4 border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              selectedShifts.includes(shift.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-3">
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
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium">
                                    {staff.find(s => s.id === shift.staff_id)?.first_name}{' '}
                                    {staff.find(s => s.id === shift.staff_id)?.last_name}
                                  </span>
                                  <Badge className={getShiftTypeColor(shift.shift_type)}>
                                    {getShiftTypeLabel(shift.shift_type)}
                                  </Badge>
                                  {!shift.is_available && (
                                    <Badge variant="destructive" className="flex items-center">
                                      <AlertTriangle className="mr-1 h-3 w-3" />
                                      Недоступна
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                  {shift.break_start_time && shift.break_end_time && (
                                    <span className="ml-2">
                                      (перерыв {formatTime(shift.break_start_time)}-{formatTime(shift.break_end_time)})
                                    </span>
                                  )}
                                  <span className="ml-2">
                                    ({calculateShiftDuration(
                                      shift.start_time, 
                                      shift.end_time, 
                                      shift.break_start_time, 
                                      shift.break_end_time
                                    )} ч)
                                  </span>
                                </div>
                                {shift.notes && (
                                  <div className="text-sm mt-1">
                                    {shift.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEdit(shift)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteShift(shift.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Shift Dialog */}
      <Dialog open={isCreateDialogOpen || !!editingShift} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false)
          setEditingShift(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingShift ? 'Редактировать смену' : 'Создать смену'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            editingShift ? handleUpdateShift() : handleCreateShift()
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="staff" className="text-right">
                  Сотрудник
                </Label>
                <Select
                  value={shiftForm.staff_id}
                  onValueChange={(value) => setShiftForm({...shiftForm, staff_id: value})}
                  disabled={!!editingShift}
                >
                  <SelectTrigger className="col-span-3">
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
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="shift_date" className="text-right">
                  Дата
                </Label>
                <Input
                  id="shift_date"
                  type="date"
                  className="col-span-3"
                  value={shiftForm.shift_date}
                  onChange={(e) => setShiftForm({...shiftForm, shift_date: e.target.value})}
                  disabled={!!editingShift}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start_time" className="text-right">
                  Начало
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  className="col-span-3"
                  value={shiftForm.start_time}
                  onChange={(e) => setShiftForm({...shiftForm, start_time: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="end_time" className="text-right">
                  Окончание
                </Label>
                <Input
                  id="end_time"
                  type="time"
                  className="col-span-3"
                  value={shiftForm.end_time}
                  onChange={(e) => setShiftForm({...shiftForm, end_time: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="break_start_time" className="text-right">
                  Начало перерыва
                </Label>
                <Input
                  id="break_start_time"
                  type="time"
                  className="col-span-3"
                  value={shiftForm.break_start_time}
                  onChange={(e) => setShiftForm({...shiftForm, break_start_time: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="break_end_time" className="text-right">
                  Конец перерыва
                </Label>
                <Input
                  id="break_end_time"
                  type="time"
                  className="col-span-3"
                  value={shiftForm.break_end_time}
                  onChange={(e) => setShiftForm({...shiftForm, break_end_time: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="shift_type" className="text-right">
                  Тип
                </Label>
                <Select
                  value={shiftForm.shift_type}
                  onValueChange={(value) => setShiftForm({...shiftForm, shift_type: value as any})}
                >
                  <SelectTrigger className="col-span-3">
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
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Примечания
                </Label>
                <Textarea
                  id="notes"
                  className="col-span-3"
                  value={shiftForm.notes}
                  onChange={(e) => setShiftForm({...shiftForm, notes: e.target.value})}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                {editingShift ? 'Сохранить' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}