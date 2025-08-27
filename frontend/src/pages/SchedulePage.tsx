import { CalendarView } from '@/components/CalendarView'
import { ScheduleTemplatesManager } from '@/components/ScheduleTemplatesManager'
import { ShiftManager } from '@/components/ShiftManager'
import { TimeOffManager } from '@/components/TimeOffManager'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/services/api'
import type {
    ScheduleStatsResponse,
    ScheduleTemplateResponse,
    ShiftResponse,
    TimeOffResponse,
    WeeklyScheduleViewResponse
} from '@/services/scheduleService'
import { ScheduleService } from '@/services/scheduleService'
import { BarChart3, CalendarDays, Clock, FileText, Plus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Staff {
  id: string
  first_name: string
  last_name: string
  position: string
  is_active: boolean
}

export function SchedulePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('calendar')
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek())
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(false)
  const [businessId, setBusinessId] = useState<string>('')
  const [scheduleService, setScheduleService] = useState<ScheduleService | null>(null)
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleViewResponse | null>(null)
  const [businessStats, setBusinessStats] = useState<ScheduleStatsResponse[]>([])

  useEffect(() => {
    if (user?.business_id) {
      setBusinessId(user.business_id)
      setScheduleService(new ScheduleService(user.business_id))
      loadData(user.business_id)
    }
  }, [user])

  useEffect(() => {
    if (scheduleService && activeTab === 'calendar') {
      loadWeeklySchedule()
    }
  }, [selectedWeek, scheduleService, activeTab])

  const loadData = async (businessIdParam?: string) => {
    const currentBusinessId = businessIdParam || businessId
    if (!currentBusinessId) {
      return
    }
    
    setLoading(true)
    try {
      // Load staff data
      const staffData = await apiRequest<Staff[]>(`/api/v1/businesses/${currentBusinessId}/staffs`)
      setStaff(staffData.filter((s: Staff) => s.is_active))
      
      // Load business statistics
      if (scheduleService) {
        try {
          const stats = await scheduleService.getBusinessScheduleStats('current_month')
          setBusinessStats(stats)
        } catch (error) {
          // Silently handle stats loading error
        }
      }
    } catch (error) {
      // Handle error appropriately
    } finally {
      setLoading(false)
    }
  }

  const loadWeeklySchedule = async () => {
    if (!scheduleService) return
    
    try {
      const weeklyData = await scheduleService.getWeeklyScheduleView(selectedWeek)
      setWeeklySchedule(weeklyData)
    } catch (error) {
      // Handle error appropriately
    }
  }

  function getCurrentWeek(): string {
    const now = new Date()
    const monday = new Date(now.setDate(now.getDate() - now.getDay() + 1))
    return monday.toISOString().split('T')[0]
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

  const handleTemplateCreated = (template: ScheduleTemplateResponse) => {
    // Optionally refresh data or show notification
  }

  const handleShiftCreated = (shift: ShiftResponse) => {
    // Refresh weekly schedule if we're on calendar tab
    if (activeTab === 'calendar') {
      loadWeeklySchedule()
    }
  }

  const handleShiftUpdated = (shift: ShiftResponse) => {
    // Refresh weekly schedule if we're on calendar tab
    if (activeTab === 'calendar') {
      loadWeeklySchedule()
    }
  }

  const handleTimeOffCreated = (timeOff: TimeOffResponse) => {
    // Refresh weekly schedule if we're on calendar tab
    if (activeTab === 'calendar') {
      loadWeeklySchedule()
    }
  }

  const handleTimeOffUpdated = (timeOff: TimeOffResponse) => {
    // Refresh weekly schedule if we're on calendar tab
    if (activeTab === 'calendar') {
      loadWeeklySchedule()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Расписание сотрудников</h1>
          <p className="text-muted-foreground">
            Управление рабочими сменами, шаблонами расписания и отпусками
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setActiveTab('shifts')}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить смену
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('templates')}>
            <FileText className="mr-2 h-4 w-4" />
            Создать шаблон
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('time-off')}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Заявка на отпуск
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Календарь</TabsTrigger>
          <TabsTrigger value="shifts">Смены</TabsTrigger>
          <TabsTrigger value="templates">Шаблоны</TabsTrigger>
          <TabsTrigger value="time-off">Отпуска</TabsTrigger>
          <TabsTrigger value="stats">Статистика</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          {!businessId && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Загрузка данных...</p>
              </CardContent>
            </Card>
          )}
          {businessId && staff.length === 0 && loading && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Загрузка сотрудников...</p>
              </CardContent>
            </Card>
          )}
          {businessId && staff.length === 0 && !loading && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Нет активных сотрудников. Добавьте сотрудника для работы с расписанием.</p>
              </CardContent>
            </Card>
          )}
          {businessId && staff.length > 0 && (
            <CalendarView 
              staff={staff}
              businessId={businessId}
              onShiftClick={(shift) => {
                // You can add edit functionality here
              }}
              onDateClick={(date, staffId) => {
                // You can add quick shift creation here
                setActiveTab('shifts')
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="shifts" className="space-y-4">
          {businessId && (
            <ShiftManager 
              staff={staff}
              businessId={businessId}
              selectedDate={selectedWeek}
              onShiftCreated={handleShiftCreated}
              onShiftUpdated={handleShiftUpdated}
            />
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {businessId && (
            <ScheduleTemplatesManager 
              staff={staff}
              businessId={businessId}
              onTemplateCreated={handleTemplateCreated}
            />
          )}
        </TabsContent>

        <TabsContent value="time-off" className="space-y-4">
          {businessId && (
            <TimeOffManager 
              staff={staff}
              businessId={businessId}
              onTimeOffCreated={handleTimeOffCreated}
              onTimeOffUpdated={handleTimeOffUpdated}
            />
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Активные сотрудники
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staff.filter(s => s.is_active).length}</div>
                <div className="text-sm text-muted-foreground">из {staff.length} всего</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Смены на неделе
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {weeklySchedule ? 
                    weeklySchedule.staff_schedules.reduce((total, staff) => 
                      total + Object.values(staff.days).reduce((dayTotal, day) => dayTotal + day.shifts.length, 0), 0
                    ) : '0'
                  }
                </div>
                <div className="text-sm text-muted-foreground">запланировано</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Всего часов
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {weeklySchedule ? 
                    weeklySchedule.staff_schedules.reduce((total, staff) => total + staff.total_hours, 0).toFixed(1)
                    : '0'
                  }
                </div>
                <div className="text-sm text-muted-foreground">часов на неделе</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarDays className="mr-2 h-5 w-5" />
                  Отпуска
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {weeklySchedule ? 
                    weeklySchedule.staff_schedules.reduce((total, staff) => 
                      total + (staff.time_off?.filter(t => t.status === 'approved').length || 0), 0
                    ) : '0'
                  }
                </div>
                <div className="text-sm text-muted-foreground">одобренных заявок</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}