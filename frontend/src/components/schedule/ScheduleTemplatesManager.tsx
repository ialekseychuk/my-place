import { DatePickerDialog } from '@/components/DatePickerDialog'
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
import { useNotification } from '@/contexts/NotificationContext'
import type {
  CreateScheduleTemplateRequest,
  DayScheduleTemplate,
  ScheduleTemplateResponse,
  WeeklyScheduleTemplate
} from '@/services/scheduleService'
import {
  ScheduleService
} from '@/services/scheduleService'
import { Calendar, Edit, FileText, Plus, Save, Star, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Staff {
  id: string
  first_name: string
  last_name: string
  position: string
  is_active: boolean
}

interface ScheduleTemplatesManagerProps {
  staff: Staff[]
  businessId: string
  onTemplateCreated?: (template: ScheduleTemplateResponse) => void
}

export function ScheduleTemplatesManager({ staff, businessId, onTemplateCreated }: ScheduleTemplatesManagerProps) {
  const { user } = useAuth()
  const { showError, showSuccess, showConfirm, showPrompt } = useNotification()
  const [scheduleService] = useState(() => new ScheduleService(businessId))
  const [templates, setTemplates] = useState<ScheduleTemplateResponse[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplateResponse | null>(null)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [currentTemplateId, setCurrentTemplateId] = useState<string>('')

  // Form state
  const [templateForm, setTemplateForm] = useState<CreateScheduleTemplateRequest>({
    staff_id: '',
    name: '',
    description: '',
    is_default: false,
    schedule: createEmptyWeeklySchedule()
  })

  useEffect(() => {
    if (selectedStaffId) {
      loadStaffTemplates(selectedStaffId)
    } else {
      setTemplates([])
    }
  }, [selectedStaffId])

  function createEmptyWeeklySchedule(): WeeklyScheduleTemplate {
    const emptyDay: DayScheduleTemplate = {
      is_working_day: false,
      start_time: '09:00',
      end_time: '18:00',
      break_start_time: '12:00',
      break_end_time: '13:00',
      shifts: []
    }

    return {
      monday: { ...emptyDay },
      tuesday: { ...emptyDay },
      wednesday: { ...emptyDay },
      thursday: { ...emptyDay },
      friday: { ...emptyDay },
      saturday: { ...emptyDay },
      sunday: { ...emptyDay }
    }
  }

  const loadStaffTemplates = async (staffId: string) => {
    setLoading(true)
    try {
      const data = await scheduleService.getStaffScheduleTemplates(staffId)
      setTemplates(data)
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!templateForm.staff_id || !templateForm.name) {
      showError('Пожалуйста, заполните обязательные поля')
      return
    }

    try {
      const newTemplate = await scheduleService.createScheduleTemplate(templateForm)
      setTemplates(prev => [...prev, newTemplate])
      setIsCreateDialogOpen(false)
      resetForm()
      onTemplateCreated?.(newTemplate)
      showSuccess('Шаблон успешно создан')
    } catch (error) {
      console.error('Error creating template:', error)
      showError('Ошибка при создании шаблона')
    }
  }

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return

    try {
      const updatedTemplate = await scheduleService.updateScheduleTemplate(editingTemplate.id, templateForm)
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t))
      setEditingTemplate(null)
      resetForm()
      showSuccess('Шаблон успешно обновлён')
    } catch (error) {
      console.error('Error updating template:', error)
      showError('Ошибка при обновлении шаблона')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    const confirmed = await showConfirm({
      title: 'Удаление шаблона',
      description: 'Вы уверены, что хотите удалить этот шаблон?',
      variant: 'destructive',
      confirmText: 'Удалить',
      cancelText: 'Отмена'
    })
    
    if (!confirmed) return

    try {
      await scheduleService.deleteScheduleTemplate(templateId)
      setTemplates(prev => prev.filter(t => t.id !== templateId))
      showSuccess('Шаблон успешно удалён')
    } catch (error) {
      console.error('Error deleting template:', error)
      showError('Ошибка при удалении шаблона')
    }
  }

  const handleSetDefault = async (templateId: string) => {
    if (!selectedStaffId) return

    try {
      await scheduleService.setDefaultTemplate(selectedStaffId, templateId)
      setTemplates(prev => prev.map(t => ({
        ...t,
        is_default: t.id === templateId
      })))
      showSuccess('Шаблон установлен по умолчанию')
    } catch (error) {
      console.error('Error setting default template:', error)
      showError('Ошибка при установке шаблона по умолчанию')
    }
  }

  const handleGenerateSchedule = (templateId: string) => {
    if (!selectedStaffId) return
    
    setCurrentTemplateId(templateId)
    setIsDatePickerOpen(true)
  }

  const handleDateConfirm = async (startDate: string) => {
    if (!selectedStaffId || !currentTemplateId) return

    const weeksResult = await showPrompt({
      title: 'Количество недель',
      description: 'Укажите количество недель:',
      defaultValue: '1',
      placeholder: '1'
    })
    if (!weeksResult.confirmed) return
    const weeks = parseInt(weeksResult.value || '1')

    const overwriteExisting = await showConfirm({
      title: 'Перезапись смен',
      description: 'Перезаписать существующие смены?',
      confirmText: 'Перезаписать',
      cancelText: 'Оставить'
    })

    try {
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + (weeks * 7) - 1)
      
      await scheduleService.generateStaffSchedule(selectedStaffId, {
        start_date: startDate,
        end_date: endDate.toISOString().split('T')[0],
        template_id: currentTemplateId,
        overwrite_existing: overwriteExisting
      })

      showSuccess(`Расписание создано на ${weeks} недель`)
    } catch (error) {
      console.error('Error generating schedule:', error)
      showError('Ошибка при создании расписания')
    } finally {
      setCurrentTemplateId('')
    }
  }

  const resetForm = () => {
    setTemplateForm({
      staff_id: selectedStaffId,
      name: '',
      description: '',
      is_default: false,
      schedule: createEmptyWeeklySchedule()
    })
  }

  const startEdit = (template: ScheduleTemplateResponse) => {
    setEditingTemplate(template)
    setTemplateForm({
      staff_id: template.staff_id,
      name: template.name,
      description: template.description,
      is_default: template.is_default,
      schedule: template.schedule
    })
  }

  const updateDaySchedule = (dayKey: keyof WeeklyScheduleTemplate, daySchedule: DayScheduleTemplate) => {
    setTemplateForm(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [dayKey]: daySchedule
      }
    }))
  }

  const getDayName = (dayKey: string) => {
    const dayNames: Record<string, string> = {
      monday: 'Понедельник',
      tuesday: 'Вторник',
      wednesday: 'Среда',
      thursday: 'Четверг',
      friday: 'Пятница',
      saturday: 'Суббота',
      sunday: 'Воскресенье'
    }
    return dayNames[dayKey] || dayKey
  }

  const calculateWorkingDays = (schedule: WeeklyScheduleTemplate) => {
    return Object.values(schedule).filter(day => day.is_working_day).length
  }

  const selectedStaff = staff.find(s => s.id === selectedStaffId)

  return (
    <div className="space-y-4">
      {/* Staff Selection */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Label htmlFor="staff-select">Выберите сотрудника</Label>
          <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Выберите сотрудника" />
            </SelectTrigger>
            <SelectContent>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} - {s.position}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedStaffId && (
          <Dialog open={isCreateDialogOpen || !!editingTemplate} onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false)
              setEditingTemplate(null)
              resetForm()
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setTemplateForm(prev => ({ ...prev, staff_id: selectedStaffId }))
                setIsCreateDialogOpen(true)
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Создать шаблон
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Редактировать шаблон' : 'Создать шаблон расписания'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Template Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Название шаблона</Label>
                    <Input
                      id="template-name"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Например: Стандартная неделя"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      <Checkbox 
                        checked={templateForm.is_default}
                        onCheckedChange={(checked) => 
                          setTemplateForm(prev => ({ ...prev, is_default: !!checked }))
                        }
                      />
                      <span className="ml-2">Шаблон по умолчанию</span>
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-description">Описание</Label>
                  <Textarea
                    id="template-description"
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Описание шаблона"
                    rows={3}
                  />
                </div>

                {/* Weekly Schedule */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Недельное расписание</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(templateForm.schedule).map(([dayKey, daySchedule]) => (
                      <Card key={dayKey}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center justify-between">
                            {getDayName(dayKey)}
                            <Checkbox
                              checked={daySchedule.is_working_day}
                              onCheckedChange={(checked) => updateDaySchedule(
                                dayKey as keyof WeeklyScheduleTemplate,
                                { ...daySchedule, is_working_day: !!checked }
                              )}
                            />
                          </CardTitle>
                        </CardHeader>
                        {daySchedule.is_working_day && (
                          <CardContent className="pt-0">
                            <div className="grid grid-cols-4 gap-4">
                              <div className="space-y-2">
                                <Label>Начало работы</Label>
                                <Input
                                  type="time"
                                  value={daySchedule.start_time || '09:00'}
                                  onChange={(e) => updateDaySchedule(
                                    dayKey as keyof WeeklyScheduleTemplate,
                                    { ...daySchedule, start_time: e.target.value }
                                  )}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Конец работы</Label>
                                <Input
                                  type="time"
                                  value={daySchedule.end_time || '18:00'}
                                  onChange={(e) => updateDaySchedule(
                                    dayKey as keyof WeeklyScheduleTemplate,
                                    { ...daySchedule, end_time: e.target.value }
                                  )}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Начало перерыва</Label>
                                <Input
                                  type="time"
                                  value={daySchedule.break_start_time || '12:00'}
                                  onChange={(e) => updateDaySchedule(
                                    dayKey as keyof WeeklyScheduleTemplate,
                                    { ...daySchedule, break_start_time: e.target.value }
                                  )}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Конец перерыва</Label>
                                <Input
                                  type="time"
                                  value={daySchedule.break_end_time || '13:00'}
                                  onChange={(e) => updateDaySchedule(
                                    dayKey as keyof WeeklyScheduleTemplate,
                                    { ...daySchedule, break_end_time: e.target.value }
                                  )}
                                />
                              </div>
                            </div>

                            {/* Shift Templates */}
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Шаблоны смен</Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newShift = {
                                      start_time: daySchedule.start_time || '09:00',
                                      end_time: daySchedule.end_time || '18:00',
                                      break_start_time: daySchedule.break_start_time,
                                      break_end_time: daySchedule.break_end_time,
                                      shift_type: 'regular' as 'regular' | 'overtime'
                                    }
                                    updateDaySchedule(
                                      dayKey as keyof WeeklyScheduleTemplate,
                                      { 
                                        ...daySchedule, 
                                        shifts: [...(daySchedule.shifts || []), newShift] 
                                      }
                                    )
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Добавить смену
                                </Button>
                              </div>
                              
                              {daySchedule.shifts?.map((shift: any, shiftIndex: number) => (
                                <div key={shiftIndex} className="border rounded p-2 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Смена {shiftIndex + 1}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const updatedShifts = daySchedule.shifts?.filter((_: any, i: number) => i !== shiftIndex) || []
                                        updateDaySchedule(
                                          dayKey as keyof WeeklyScheduleTemplate,
                                          { ...daySchedule, shifts: updatedShifts }
                                        )
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Начало</Label>
                                      <Input
                                        type="time"
                                        value={shift.start_time}
                                        onChange={(e) => {
                                          const updatedShifts = [...(daySchedule.shifts || [])]
                                          updatedShifts[shiftIndex] = { ...shift, start_time: e.target.value }
                                          updateDaySchedule(
                                            dayKey as keyof WeeklyScheduleTemplate,
                                            { ...daySchedule, shifts: updatedShifts }
                                          )
                                        }}
                                        className="text-xs"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Конец</Label>
                                      <Input
                                        type="time"
                                        value={shift.end_time}
                                        onChange={(e) => {
                                          const updatedShifts = [...(daySchedule.shifts || [])]
                                          updatedShifts[shiftIndex] = { ...shift, end_time: e.target.value }
                                          updateDaySchedule(
                                            dayKey as keyof WeeklyScheduleTemplate,
                                            { ...daySchedule, shifts: updatedShifts }
                                          )
                                        }}
                                        className="text-xs"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Тип</Label>
                                      <Select
                                        value={shift.shift_type}
                                        onValueChange={(value) => {
                                          const updatedShifts = [...(daySchedule.shifts || [])]
                                          updatedShifts[shiftIndex] = { 
                                            ...shift, 
                                            shift_type: value as 'regular' | 'overtime' 
                                          }
                                          updateDaySchedule(
                                            dayKey as keyof WeeklyScheduleTemplate,
                                            { ...daySchedule, shifts: updatedShifts }
                                          )
                                        }}
                                      >
                                        <SelectTrigger className="text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="regular">Обычная</SelectItem>
                                          <SelectItem value="overtime">Сверхурочная</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsCreateDialogOpen(false)
                    setEditingTemplate(null)
                    resetForm()
                  }}>
                    Отмена
                  </Button>
                  <Button onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}>
                    <Save className="mr-2 h-4 w-4" />
                    {editingTemplate ? 'Обновить' : 'Создать'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Templates List */}
      {selectedStaffId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Шаблоны расписания для {selectedStaff?.first_name} {selectedStaff?.last_name}
            </h3>
            <Badge variant="outline">
              {templates.length} шаблонов
            </Badge>
          </div>

          {loading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Нет шаблонов расписания</p>
                <p className="text-sm text-gray-400">Создайте первый шаблон для этого сотрудника</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className={template.is_default ? 'ring-2 ring-blue-500' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-5 w-5" />
                        {template.name}
                        {template.is_default && (
                          <Star className="ml-2 h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {template.description && (
                        <p className="text-sm text-gray-600">{template.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <span>Рабочих дней в неделе:</span>
                        <Badge variant="outline">
                          {calculateWorkingDays(template.schedule)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-xs">
                        {Object.entries(template.schedule).map(([dayKey, daySchedule]) => (
                          <div
                            key={dayKey}
                            className={`p-1 rounded text-center ${
                              daySchedule.is_working_day 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {dayKey.slice(0, 2).toUpperCase()}
                            {daySchedule.is_working_day && daySchedule.start_time && (
                              <div className="text-xs">
                                {daySchedule.start_time}-{daySchedule.end_time}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between">
                        <div className="flex space-x-2">
                          {!template.is_default && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefault(template.id)}
                            >
                              <Star className="mr-1 h-3 w-3" />
                              По умолчанию
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateSchedule(template.id)}
                          >
                            <Calendar className="mr-1 h-3 w-3" />
                            Создать смены
                          </Button>
                        </div>
                        <div className="text-xs text-gray-500">
                          Создан: {new Date(template.created_at).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Date Picker Dialog for Schedule Generation */}
      <DatePickerDialog
        isOpen={isDatePickerOpen}
        onOpenChange={setIsDatePickerOpen}
        title="Генерация расписания"
        description="Выберите дату начала для генерации расписания:"
        onConfirm={handleDateConfirm}
        onCancel={() => {
          setIsDatePickerOpen(false)
          setCurrentTemplateId('')
        }}
        defaultDate={new Date().toISOString().split('T')[0]}
      />
    </div>
  )
}