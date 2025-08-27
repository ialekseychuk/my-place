import { DatePickerDialog } from '@/components/DatePickerDialog';
import { Button } from '@/components/ui/button';
import { bookingService } from '@/services/bookingService';
import { staffService } from '@/services/staff';
import type { Booking } from '@/types/booking';
import type { Staff } from '@/types/staff';
import { format, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ScheduleViewProps {
  businessID: string;
}

interface TimeSlot {
  time: Date;
  formattedTime: string;
}

export function ScheduleView({ businessID }: ScheduleViewProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Generate time slots from 5:00 to 24:00 with 15-minute intervals
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 5;  // Start at 5:00 to cover UTC times
    const endHour = 24;   // End at 24:00 to cover UTC times
    const interval = 15; // 15-minute intervals
    
    const baseDate = startOfDay(selectedDate);
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        // Create time slot in local time with clean hours and minutes only
        const time = new Date(
          baseDate.getFullYear(),
          baseDate.getMonth(),
          baseDate.getDate(),
          hour,
          minute,
          0,
          0
        );
        
        slots.push({
          time,
          formattedTime: format(time, 'HH:mm', { locale: ru })
        });
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    fetchData();
  }, [businessID, selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch staff members
      const staffData = await staffService.getStaffByBusiness(businessID)
      setStaffMembers(staffData)
      
      // Format date for API call (YYYY-MM-DD)
      const formattedDate = format(selectedDate, 'yyyy-MM-dd')
      
      // Fetch bookings for the selected date
      const bookingData = await bookingService.getBookings(
        businessID,
        formattedDate,
        formattedDate
      )
      
      setBookings(bookingData || [])
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(new Date(date))
  }

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setSelectedDate(newDate)
  }

  const getBookingColor = (serviceName: string): string => {
    // Simple hash function to generate consistent colors based on service name
    const hash = serviceName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const colors = [
      'bg-red-200 border-red-300',       // Red
      'bg-green-200 border-green-300',   // Green
      'bg-blue-200 border-blue-300',     // Blue
      'bg-yellow-200 border-yellow-300', // Yellow
      'bg-purple-200 border-purple-300', // Purple
      'bg-teal-200 border-teal-300',     // Teal
      'bg-orange-200 border-orange-300', // Orange
      'bg-pink-200 border-pink-300'      // Pink
    ]
    return colors[hash % colors.length]
  }

  // Check if a booking is happening at a specific time slot for a specific staff
  const getBookingAtTimeSlot = (staffId: string, slotTime: Date): Booking | null => {
    const result = bookings.find(booking => {
      if (booking.staff_id !== staffId) return false
      
      // Convert booking times to local time for comparison
      const bookingStart = new Date(booking.start_at);
      const bookingEnd = new Date(booking.end_at);
      
      // Compare hours and minutes only (not seconds or milliseconds)
      const slotHour = slotTime.getHours();
      const slotMinute = slotTime.getMinutes();
      const bookingStartHour = bookingStart.getHours();
      const bookingStartMinute = bookingStart.getMinutes();
      const bookingEndHour = bookingEnd.getHours();
      const bookingEndMinute = bookingEnd.getMinutes();
      
      // Check if the slot time is within the booking time range
      const isAfterOrAtStart = 
        (slotHour > bookingStartHour) || 
        (slotHour === bookingStartHour && slotMinute >= bookingStartMinute);
        
      const isBeforeEnd = 
        (slotHour < bookingEndHour) || 
        (slotHour === bookingEndHour && slotMinute < bookingEndMinute);
      
      return isAfterOrAtStart && isBeforeEnd;
    }) || null;
    
    return result;
  }
  
  // Check if this is the start of a booking
  const isBookingStart = (staffId: string, slotTime: Date): boolean => {
    const result = bookings.some(booking => {
      if (booking.staff_id !== staffId) return false
      
      // Convert booking start time to local time for comparison
      const bookingStart = new Date(booking.start_at);
      
      // Compare hours and minutes only (not seconds or milliseconds)
      const slotHour = slotTime.getHours();
      const slotMinute = slotTime.getMinutes();
      const bookingStartHour = bookingStart.getHours();
      const bookingStartMinute = bookingStart.getMinutes();
      
      // Check if this slot is the start of the booking
      return slotHour === bookingStartHour && slotMinute === bookingStartMinute;
    });
    
    return result;
  }

  if (loading) {
    return <div className="text-center py-8">Загрузка расписания...</div>
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchData} className="mt-4">Повторить попытку</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with date navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateDay('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsDatePickerOpen(true)}
            className="font-medium min-w-36"
          >
            {format(selectedDate, 'dd MMMM yyyy', { locale: ru })}
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateDay('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" onClick={() => setSelectedDate(new Date())}>
          Сегодня
        </Button>
      </div>

      {/* Schedule grid */}
      <div className="border rounded-lg overflow-hidden bg-white">
        {/* Staff headers */}
        <div className="grid" style={{ gridTemplateColumns: `100px repeat(${staffMembers.length}, minmax(180px, 1fr))` }}>
          <div className="border-r border-b bg-muted p-2"></div>
          {staffMembers.map(staff => (
            <div key={staff.id} className="border-r border-b p-3 bg-secondary text-center">
              <div className="font-medium text-sm truncate">{staff.full_name}</div>
              <div className="text-xs text-muted-foreground truncate">{staff.position}</div>
            </div>
          ))}
        </div>

        {/* Time slots and bookings */}
        {timeSlots.map((timeSlot, idx) => (
          <div 
            key={timeSlot.formattedTime}
            className="grid" 
            style={{ gridTemplateColumns: `100px repeat(${staffMembers.length}, minmax(180px, 1fr))` }}
          >
            {/* Time column */}
            <div className={`border-r ${idx !== timeSlots.length - 1 ? 'border-b' : ''} p-2 text-right text-sm text-muted-foreground`}>
              {timeSlot.formattedTime}
            </div>

            {/* Staff columns */}
            {staffMembers.map(staff => {
              // Try to find a booking at this time slot for this staff
              const booking = getBookingAtTimeSlot(staff.id, timeSlot.time)
              const isStart = booking && isBookingStart(staff.id, timeSlot.time)
              
              if (booking && isStart) {
                // Only show booking details at the start time
                const colorClasses = getBookingColor(booking.service_name);
                
                return (
                  <div
                    key={`${staff.id}-${timeSlot.formattedTime}`}
                    className={`${colorClasses} border-r ${idx !== timeSlots.length - 1 ? 'border-b' : ''} p-2 min-h-[60px] shadow-sm`}
                  >
                    <div className="font-medium text-sm truncate">{booking.service_name}</div>
                    <div className="flex items-center text-xs mt-1">
                      <User className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{booking.customer_name}</span>
                    </div>
                    <div className="flex items-center text-xs mt-1">
                      <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span>
                        {format(new Date(booking.start_at), 'HH:mm', { locale: ru })} - 
                        {format(new Date(booking.end_at), 'HH:mm', { locale: ru })}
                      </span>
                    </div>
                    <div className="text-xs mt-1 truncate">
                      <span className="opacity-70">{booking.customer_email}</span>
                    </div>
                  </div>
                )
              } else if (booking) {
                // If it's a continuation of a booking, just show a colored cell
                const colorClasses = getBookingColor(booking.service_name);
                return (
                  <div
                    key={`${staff.id}-${timeSlot.formattedTime}`}
                    className={`${colorClasses} border-r ${idx !== timeSlots.length - 1 ? 'border-b' : ''} min-h-[60px] shadow-sm`}
                  ></div>
                )
              }
              
              // Empty cell
              return (
                <div
                  key={`${staff.id}-${timeSlot.formattedTime}`}
                  className={`border-r ${idx !== timeSlots.length - 1 ? 'border-b' : ''} min-h-[60px]`}
                >
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <DatePickerDialog
        isOpen={isDatePickerOpen}
        onOpenChange={setIsDatePickerOpen}
        title="Выберите дату"
        description="Выберите дату для отображения расписания"
        onConfirm={handleDateSelect}
        onCancel={() => {}}
        defaultDate={format(selectedDate, 'yyyy-MM-dd')}
      />
    </div>
  )
}