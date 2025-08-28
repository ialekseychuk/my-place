import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import type {
  ShiftResponse,
  WeeklyScheduleViewResponse
} from '@/services/scheduleService'
import { ScheduleService } from '@/services/scheduleService'
import { AlertCircle, ChevronLeft, ChevronRight, Clock, Edit, Plus, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

interface Staff {
  id: string
  first_name: string
  last_name: string
  position: string
  is_active: boolean
}

interface CalendarViewProps {
  staff: Staff[]
  businessId: string
  onShiftClick?: (shift: ShiftResponse) => void
  onDateClick?: (date: string, staffId: string) => void
}

export function CalendarView({ staff, businessId, onShiftClick, onDateClick }: CalendarViewProps) {
  const { user } = useAuth()
  const [scheduleService] = useState(() => new ScheduleService(businessId))
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleViewResponse | null>(null)
  const [currentWeek, setCurrentWeek] = useState(() => {
    const now = new Date()
    const monday = new Date(now.setDate(now.getDate() - now.getDay() + 1))
    return monday.toISOString().split('T')[0]
  })
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [showShiftDetails, setShowShiftDetails] = useState(false)
  const [selectedShift, setSelectedShift] = useState<ShiftResponse | null>(null)

  // Create a string representation of selectedStaffIds for useEffect dependencies
  const selectedStaffIdsString = useMemo(() => selectedStaffIds.join(','), [selectedStaffIds])

  useEffect(() => {
    loadWeeklySchedule()
  }, [currentWeek, selectedStaffIdsString]) // Use the string representation

  const loadWeeklySchedule = async () => {
    setLoading(true)
    try {
      const data = await scheduleService.getWeeklyScheduleView(
        currentWeek, 
        selectedStaffIds.length > 0 ? selectedStaffIds : undefined
      )
      setWeeklySchedule(data)
    } catch (error) {
      // Handle error appropriately
    } finally {
      setLoading(false)
    }
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const currentDate = new Date(currentWeek)
    const offset = direction === 'next' ? 7 : -7
    currentDate.setDate(currentDate.getDate() + offset)
    setCurrentWeek(currentDate.toISOString().split('T')[0])
  }

  const goToToday = () => {
    const now = new Date()
    const monday = new Date(now.setDate(now.getDate() - now.getDay() + 1))
    setCurrentWeek(monday.toISOString().split('T')[0])
  }

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'regular': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'overtime': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'holiday': return 'bg-green-100 text-green-800 border-green-200'
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDayNames = () => [
    'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'
  ]

  const getDayAbbr = () => ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  const formatTime = (time: string) => {
    return time.slice(0, 5) // Remove seconds
  }

  const handleShiftClick = (shift: ShiftResponse) => {
    setSelectedShift(shift)
    setShowShiftDetails(true)
    onShiftClick?.(shift)
  }

  const handleDateClick = (date: string, staffId: string) => {
    onDateClick?.(date, staffId)
  }

  const isToday = (date: string) => {
    const today = new Date().toISOString().split('T')[0]
    return date === today
  }

  const filteredStaff = selectedStaffIds.length > 0 
    ? staff.filter(s => selectedStaffIds.includes(s.id))
    : staff

  if (!weeklySchedule) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          {loading ? 'Загрузка...' : 'Нет данных для отображения'}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Сегодня
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-lg font-semibold">
            {new Date(weeklySchedule.week_start_date).toLocaleDateString('ru-RU')} - {' '}
            {new Date(weeklySchedule.week_end_date).toLocaleDateString('ru-RU')}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Select 
            value={selectedStaffIds.length === 0 ? 'all' : selectedStaffIds.join(',')} 
            onValueChange={(value) => setSelectedStaffIds(value === 'all' ? [] : value.split(','))}
          >
            <SelectTrigger className="w-[200px]">
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
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Календарь расписания
            </div>
            <Badge variant="outline">
              <Users className="mr-1 h-3 w-3" />
              {weeklySchedule.staff_schedules.length} сотрудников
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header with days */}
              <div className="grid grid-cols-8 gap-1 mb-2">
                <div className="p-2 font-semibold text-sm text-gray-600">Сотрудник</div>
                {getDayAbbr().map((day, index) => {
                  const monday = new Date(weeklySchedule.week_start_date)
                  const currentDate = new Date(monday)
                  currentDate.setDate(monday.getDate() + index)
                  const dateStr = currentDate.toISOString().split('T')[0]
                  
                  return (
                    <div 
                      key={day} 
                      className={`p-2 font-semibold text-sm text-center border rounded ${
                        isToday(dateStr) ? 'bg-blue-50 border-blue-200 text-blue-800' : 'text-gray-600'
                      }`}
                    >
                      <div>{day}</div>
                      <div className="text-xs font-normal">
                        {currentDate.getDate()}.{(currentDate.getMonth() + 1).toString().padStart(2, '0')}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Schedule rows */}
              {weeklySchedule.staff_schedules.map((staffSchedule) => (
                <div key={staffSchedule.staff_id} className="grid grid-cols-8 gap-1 mb-1">
                  {/* Staff info */}
                  <div className="p-3 bg-gray-50 rounded flex flex-col">
                    <div className="font-medium text-sm">{staffSchedule.staff_name}</div>
                    <div className="text-xs text-gray-500">{staffSchedule.position}</div>
                    <div className="text-xs text-blue-600 font-medium mt-1">
                      {staffSchedule.total_hours.toFixed(1)}ч/нед
                    </div>
                  </div>

                  {/* Days */}
                  {Array.from({ length: 7 }, (_, dayIndex) => {
                    const monday = new Date(weeklySchedule.week_start_date)
                    const currentDate = new Date(monday)
                    currentDate.setDate(monday.getDate() + dayIndex)
                    const dateStr = currentDate.toISOString().split('T')[0]
                    const daySchedule = staffSchedule.days[dateStr]
                    
                    return (
                      <div 
                        key={dayIndex} 
                        className={`min-h-[100px] border rounded p-1 cursor-pointer hover:bg-gray-50 ${
                          isToday(dateStr) ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => handleDateClick(dateStr, staffSchedule.staff_id)}
                      >
                        {daySchedule ? (
                          <div className="space-y-1">
                            {daySchedule.shifts.map((shift) => (
                              <div 
                                key={shift.id} 
                                className={`text-xs p-1 rounded border cursor-pointer hover:shadow-sm ${getShiftTypeColor(shift.shift_type)}`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleShiftClick(shift)
                                }}
                              >
                                <div className="font-medium">
                                  {formatTime(shift.start_time)}-{formatTime(shift.end_time)}
                                </div>
                                {!shift.is_available && (
                                  <div className="flex items-center">
                                    <AlertCircle className="h-3 w-3 text-red-500 mr-1" />
                                    <span className="text-red-600">Недоступен</span>
                                  </div>
                                )}
                              </div>
                            ))}
                            
                            {daySchedule.has_time_off && (
                              <div className="text-xs p-1 rounded bg-red-100 text-red-800 border border-red-200">
                                Отпуск/Отгул
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-500 mt-1">
                              {daySchedule.total_hours}ч
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <Plus 
                              className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100" 
                              onClick={() => handleDateClick(dateStr, staffSchedule.staff_id)}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shift Details Dialog */}
      <Dialog open={showShiftDetails} onOpenChange={setShowShiftDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Детали смены</DialogTitle>
          </DialogHeader>
          
          {selectedShift && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Сотрудник</Label>
                  <p className="text-sm font-medium">{selectedShift.staff_name}</p>
                </div>
                <div>
                  <Label>Дата</Label>
                  <p className="text-sm">{new Date(selectedShift.shift_date).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Время работы</Label>
                  <p className="text-sm">{formatTime(selectedShift.start_time)} - {formatTime(selectedShift.end_time)}</p>
                </div>
                <div>
                  <Label>Перерыв</Label>
                  <p className="text-sm">
                    {selectedShift.break_start_time && selectedShift.break_end_time
                      ? `${formatTime(selectedShift.break_start_time)} - ${formatTime(selectedShift.break_end_time)}`
                      : 'Не указан'
                    }
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Тип смены</Label>
                  <Badge className={getShiftTypeColor(selectedShift.shift_type)}>
                    {selectedShift.shift_type}
                  </Badge>
                </div>
                <div>
                  <Label>Статус</Label>
                  <div className="flex items-center">
                    {selectedShift.is_available ? (
                      <Badge className="bg-green-100 text-green-800">Доступна</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Недоступна</Badge>
                    )}
                  </div>
                </div>
              </div>

              {selectedShift.notes && (
                <div>
                  <Label>Примечания</Label>
                  <p className="text-sm text-gray-600">{selectedShift.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowShiftDetails(false)}>
                  Закрыть
                </Button>
                <Button onClick={() => {
                  setShowShiftDetails(false)
                  // Here you could trigger an edit dialog
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Редактировать
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}