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
    CreateTimeOffRequest,
    TimeOffResponse
} from '@/services/scheduleService'
import {
    ScheduleService
} from '@/services/scheduleService'
import { Calendar, CheckCircle, Clock, FileText, Plus, Save, User, X, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Staff {
  id: string
  first_name: string
  last_name: string
  position: string
  is_active: boolean
}

interface TimeOffManagerProps {
  staff: Staff[]
  businessId: string
  onTimeOffCreated?: (timeOff: TimeOffResponse) => void
  onTimeOffUpdated?: (timeOff: TimeOffResponse) => void
}

export function TimeOffManager({ 
  staff, 
  businessId, 
  onTimeOffCreated,
  onTimeOffUpdated 
}: TimeOffManagerProps) {
  const { user } = useAuth()
  const { showError, showSuccess, showConfirm, showPrompt } = useNotification()
  const [scheduleService] = useState(() => new ScheduleService(businessId))
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffResponse[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  // Form state
  const [timeOffForm, setTimeOffForm] = useState<CreateTimeOffRequest>({
    staff_id: '',
    start_date: '',
    end_date: '',
    type: 'vacation',
    reason: '',
    is_half_day: false,
    half_day_type: 'morning',
    requested_by: user?.id || ''
  })

  useEffect(() => {
    loadTimeOffRequests()
  }, [selectedStaffId])

  const loadTimeOffRequests = async () => {
    setLoading(true)
    try {
      if (selectedStaffId) {
        const data = await scheduleService.getStaffTimeOffRequests(selectedStaffId)
        setTimeOffRequests(data)
      } else {
        const data = await scheduleService.getBusinessTimeOffRequests()
        setTimeOffRequests(data)
      }
    } catch (error) {
      console.error('Error loading time off requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTimeOff = async () => {
    if (!timeOffForm.staff_id || !timeOffForm.start_date || !timeOffForm.end_date || !timeOffForm.reason) {
      showError('Пожалуйста, заполните все обязательные поля')
      return
    }

    if (new Date(timeOffForm.start_date) > new Date(timeOffForm.end_date)) {
      showError('Дата начала не может быть позже даты окончания')
      return
    }

    try {
      const newTimeOff = await scheduleService.createTimeOffRequest({
        ...timeOffForm,
        requested_by: user?.id || ''
      })
      setTimeOffRequests(prev => [...prev, newTimeOff])
      setIsCreateDialogOpen(false)
      resetForm()
      onTimeOffCreated?.(newTimeOff)
      showSuccess('Заявка на отпуск успешно создана')
    } catch (error) {
      console.error('Error creating time off request:', error)
      showError('Ошибка при создании заявки на отпуск')
    }
  }

  const handleUpdateTimeOffStatus = async (requestId: string, status: 'approved' | 'rejected', comments?: string) => {
    try {
      const updatedTimeOff = await scheduleService.updateTimeOffRequest(requestId, {
        status,
        approval_by: user?.id,
        comments
      })
      setTimeOffRequests(prev => prev.map(t => t.id === requestId ? updatedTimeOff : t))
      onTimeOffUpdated?.(updatedTimeOff)
      showSuccess(`Статус заявки обновлён: ${status === 'approved' ? 'Одобрено' : 'Отклонено'}`)
    } catch (error) {
      console.error('Error updating time off status:', error)
      showError('Ошибка при обновлении статуса заявки')
    }
  }

  const handleDeleteTimeOff = async (requestId: string) => {
    const confirmed = await showConfirm({
      title: 'Удаление заявки',
      description: 'Вы уверены, что хотите удалить эту заявку?',
      variant: 'destructive',
      confirmText: 'Удалить',
      cancelText: 'Отмена'
    })
    
    if (!confirmed) return

    try {
      await scheduleService.deleteTimeOffRequest(requestId)
      setTimeOffRequests(prev => prev.filter(t => t.id !== requestId))
      showSuccess('Заявка успешно удалена')
    } catch (error) {
      console.error('Error deleting time off request:', error)
      showError('Ошибка при удалении заявки')
    }
  }

  const resetForm = () => {
    setTimeOffForm({
      staff_id: '',
      start_date: '',
      end_date: '',
      type: 'vacation',
      reason: '',
      is_half_day: false,
      half_day_type: 'morning',
      requested_by: user?.id || ''
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'На рассмотрении'
      case 'approved': return 'Одобрено'
      case 'rejected': return 'Отклонено'
      case 'cancelled': return 'Отменено'
      default: return status
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vacation': return 'bg-blue-100 text-blue-800'
      case 'sick_leave': return 'bg-red-100 text-red-800'
      case 'personal_day': return 'bg-purple-100 text-purple-800'
      case 'emergency': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'vacation': return 'Отпуск'
      case 'sick_leave': return 'Больничный'
      case 'personal_day': return 'Личный день'
      case 'emergency': return 'Экстренный'
      default: return type
    }
  }

  const calculateDuration = (startDate: string, endDate: string, isHalfDay: boolean) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    
    if (isHalfDay && diffDays === 1) {
      return '0.5 дня'
    }
    
    return `${diffDays} ${diffDays === 1 ? 'день' : diffDays < 5 ? 'дня' : 'дней'}`
  }

  const filteredRequests = timeOffRequests.filter(request => {
    if (viewMode !== 'all' && request.status !== viewMode) {
      return false
    }
    return !selectedStaffId || request.staff_id === selectedStaffId
  })

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
            <Label>Статус</Label>
            <Select value={viewMode} onValueChange={(value) => setViewMode(value as 'all' | 'pending' | 'approved' | 'rejected')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все заявки</SelectItem>
                <SelectItem value="pending">На рассмотрении</SelectItem>
                <SelectItem value="approved">Одобренные</SelectItem>
                <SelectItem value="rejected">Отклоненные</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Подать заявку
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Подать заявку на отпуск/отгул</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Сотрудник</Label>
                <Select 
                  value={timeOffForm.staff_id} 
                  onValueChange={(value) => setTimeOffForm(prev => ({ ...prev, staff_id: value }))}
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
                <Label>Тип отпуска/отгула</Label>
                <Select 
                  value={timeOffForm.type} 
                  onValueChange={(value) => setTimeOffForm(prev => ({ 
                    ...prev, 
                    type: value as 'vacation' | 'sick_leave' | 'personal_day' | 'emergency'
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacation">Отпуск</SelectItem>
                    <SelectItem value="sick_leave">Больничный</SelectItem>
                    <SelectItem value="personal_day">Личный день</SelectItem>
                    <SelectItem value="emergency">Экстренный</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Дата начала</Label>
                  <Input
                    type="date"
                    value={timeOffForm.start_date}
                    onChange={(e) => setTimeOffForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Дата окончания</Label>
                  <Input
                    type="date"
                    value={timeOffForm.end_date}
                    onChange={(e) => setTimeOffForm(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center">
                  <Checkbox 
                    checked={timeOffForm.is_half_day}
                    onCheckedChange={(checked) => 
                      setTimeOffForm(prev => ({ ...prev, is_half_day: !!checked }))
                    }
                  />
                  <span className="ml-2">Половина рабочего дня</span>
                </Label>
                
                {timeOffForm.is_half_day && (
                  <Select 
                    value={timeOffForm.half_day_type} 
                    onValueChange={(value) => setTimeOffForm(prev => ({ 
                      ...prev, 
                      half_day_type: value as 'morning' | 'afternoon'
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Первая половина дня</SelectItem>
                      <SelectItem value="afternoon">Вторая половина дня</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Причина</Label>
                <Textarea
                  value={timeOffForm.reason}
                  onChange={(e) => setTimeOffForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Укажите причину отпуска/отгула"
                  rows={3}
                />
              </div>

              {timeOffForm.start_date && timeOffForm.end_date && (
                <div className="text-sm text-gray-600">
                  Продолжительность: {calculateDuration(
                    timeOffForm.start_date, 
                    timeOffForm.end_date, 
                    timeOffForm.is_half_day
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    resetForm()
                  }}
                >
                  Отмена
                </Button>
                <Button onClick={handleCreateTimeOff}>
                  <Save className="mr-2 h-4 w-4" />
                  Подать заявку
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Всего заявок</p>
                <p className="text-2xl font-bold">{filteredRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">На рассмотрении</p>
                <p className="text-2xl font-bold">
                  {filteredRequests.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Одобрено</p>
                <p className="text-2xl font-bold">
                  {filteredRequests.filter(r => r.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <XCircle className="h-4 w-4 text-red-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Отклонено</p>
                <p className="text-2xl font-bold">
                  {filteredRequests.filter(r => r.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Off Requests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Загрузка...</div>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Нет заявок на отпуск</p>
              <p className="text-sm text-gray-400">Подайте первую заявку</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests
            .sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime())
            .map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5" />
                      <span>{request.staff_name}</span>
                      <Badge className={getTypeColor(request.type)}>
                        {getTypeLabel(request.type)}
                      </Badge>
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusLabel(request.status)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(request.requested_at).toLocaleDateString('ru-RU')}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Период:</span>{' '}
                        {new Date(request.start_date).toLocaleDateString('ru-RU')} -{' '}
                        {new Date(request.end_date).toLocaleDateString('ru-RU')}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Продолжительность:</span>{' '}
                        {calculateDuration(request.start_date, request.end_date, request.is_half_day)}
                      </div>
                      {request.is_half_day && (
                        <div className="text-sm">
                          <span className="font-medium">Время:</span>{' '}
                          {request.half_day_type === 'morning' ? 'Первая половина дня' : 'Вторая половина дня'}
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="font-medium">Причина:</span>{' '}
                        {request.reason}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {request.comments && (
                        <div className="text-sm">
                          <span className="font-medium">Комментарий:</span>{' '}
                          {request.comments}
                        </div>
                      )}
                      {request.processed_at && (
                        <div className="text-sm">
                          <span className="font-medium">Обработано:</span>{' '}
                          {new Date(request.processed_at).toLocaleDateString('ru-RU')}
                        </div>
                      )}

                      {request.status === 'pending' && (
                        <div className="flex space-x-2 mt-4">
                          <Button
                            size="sm"
                            onClick={() => {
                              const comments = prompt('Комментарий к одобрению (необязательно):')
                              handleUpdateTimeOffStatus(request.id, 'approved', comments || undefined)
                            }}
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Одобрить
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const comments = prompt('Причина отклонения:')
                              if (comments) {
                                handleUpdateTimeOffStatus(request.id, 'rejected', comments)
                              }
                            }}
                          >
                            <X className="mr-1 h-3 w-3" />
                            Отклонить
                          </Button>
                        </div>
                      )}

                      {(request.status === 'pending' || request.status === 'rejected') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteTimeOff(request.id)}
                          className="ml-2"
                        >
                          Удалить
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  )
}