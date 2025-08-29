import { DatePickerDialog } from '@/components/DatePickerDialog'
import { ScheduleView } from '@/components/schedule/ScheduleView'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLocation } from '@/contexts/LocationContext'
import { bookingService } from '@/services/bookingService'
import type { Booking } from '@/types/booking'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Calendar, CalendarDays, Clock, Mail, Table, User } from 'lucide-react'
import { useEffect, useState } from 'react'

// Helper function to format time exactly as it comes from the backend
const formatTimeFromBackend = (dateString: string): string => {
  // Extract hours and minutes directly from the ISO string without conversion
  const date = new Date(dateString);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Helper function to format date from backend
const formatDateFromBackend = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, 'dd MMMM yyyy', { locale: ru });
};

interface BookingsManagerProps {
  businessID: string
}

export function BookingsManager({ businessID }: BookingsManagerProps) {
  const { currentLocation } = useLocation()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [dateFilter, setDateFilter] = useState<{ start?: string; end?: string }>({})
  const [filterType, setFilterType] = useState<'start' | 'end'>('start')

  useEffect(() => {
    fetchBookings()
  }, [businessID, dateFilter, currentLocation?.id])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const data = await bookingService.getBookings(
        businessID,
        dateFilter.start,
        dateFilter.end,
        currentLocation?.id
      )
      setBookings(data || []) // Ensure we always set an array, even if data is null
      setError(null)
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError('Не удалось загрузить бронирования')
      setBookings([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleDateSelect = (date: string) => {
    if (filterType === 'start') {
      setDateFilter(prev => ({ ...prev, start: date }))
    } else {
      setDateFilter(prev => ({ ...prev, end: date }))
    }
  }

  const clearFilters = () => {
    setDateFilter({})
  }

  const formatDate = (dateString: string) => {
    return formatDateFromBackend(dateString);
  }

  const formatTime = (dateString: string) => {
    return formatTimeFromBackend(dateString);
  }

  if (loading) {
    return <div className="text-center py-8">Загрузка бронирований...</div>
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Ошибка</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchBookings}>Повторить попытку</Button>
        </CardContent>
      </Card>
    )
  }

  // Ensure bookings is an array before accessing its length
  const bookingsArray = Array.isArray(bookings) ? bookings : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => {
            setFilterType('start')
            setIsDatePickerOpen(true)
          }}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Дата начала
          {dateFilter.start && (
            <Badge variant="secondary" className="ml-2">
              {formatDate(dateFilter.start)}
            </Badge>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => {
            setFilterType('end')
            setIsDatePickerOpen(true)
          }}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Дата окончания
          {dateFilter.end && (
            <Badge variant="secondary" className="ml-2">
              {formatDate(dateFilter.end)}
            </Badge>
          )}
        </Button>
        
        {(dateFilter.start || dateFilter.end) && (
          <Button variant="ghost" onClick={clearFilters}>
            Очистить фильтры
          </Button>
        )}
      </div>

      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Расписание
          </TabsTrigger>
          <TabsTrigger value="cards" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Карточки
          </TabsTrigger>
        </TabsList>
        <TabsContent value="schedule" className="mt-4">
          <ScheduleView businessID={businessID} />
        </TabsContent>
        <TabsContent value="cards" className="mt-4">
          {bookingsArray.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  {dateFilter.start || dateFilter.end
                    ? 'Нет бронирований по заданным фильтрам'
                    : 'Нет бронирований'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bookingsArray.map((booking) => (
                <Card key={booking.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{booking.service_name}</span>
                      <Badge variant="outline">{booking.staff_name}</Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <User className="mr-1 h-4 w-4" />
                      {booking.customer_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(booking.start_at)}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>
                        {formatTime(booking.start_at)} - {formatTime(booking.end_at)}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{booking.customer_email}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DatePickerDialog
        isOpen={isDatePickerOpen}
        onOpenChange={setIsDatePickerOpen}
        title={`Выберите ${filterType === 'start' ? 'дату начала' : 'дату окончания'}`}
        description={`Выберите ${filterType === 'start' ? 'дату начала' : 'дату окончания'} для фильтрации бронирований`}
        onConfirm={handleDateSelect}
        onCancel={() => {}}
      />
    </div>
  )
}