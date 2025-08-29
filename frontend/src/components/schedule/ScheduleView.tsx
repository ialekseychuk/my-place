import { DatePickerDialog } from '@/components/DatePickerDialog';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/contexts/LocationContext';
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

// Helper function to format time exactly as it comes from the backend
const formatTimeFromBackend = (dateString: string): string => {
  // Extract hours and minutes directly from the ISO string without conversion
  const date = new Date(dateString);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export function ScheduleView({ businessID }: ScheduleViewProps) {
  const { currentLocation } = useLocation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Generate time slots from 8:00 to 22:00 with 30-minute intervals for better readability
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 8;  // Start at 8:00
    const endHour = 22;   // End at 22:00
    const interval = 30; // 30-minute intervals for better readability
    
    const baseDate = startOfDay(selectedDate);
    
    for (let hour = startHour; hour <= endHour; hour++) {
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
  }, [businessID, selectedDate, currentLocation?.id]);

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch staff members with location filter
      const staffData = await staffService.getStaffByBusiness(businessID, currentLocation?.id || '')
      // Ensure staffData is always an array before setting state
      setStaffMembers(Array.isArray(staffData) ? staffData : [])
      
      // Format date for API call (YYYY-MM-DD)
      const formattedDate = format(selectedDate, 'yyyy-MM-dd')
      
      // Fetch bookings for the selected date with location filter
      const bookingData = await bookingService.getBookings(
        businessID,
        formattedDate,
        formattedDate,
        currentLocation?.id
      )
      
      // Ensure bookingData is always an array before setting state
      setBookings(Array.isArray(bookingData) ? bookingData : [])
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Не удалось загрузить данные')
      // Set empty arrays on error to prevent null reference issues
      setStaffMembers([])
      setBookings([])
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
      'bg-blue-100 border-blue-300 text-blue-800',       // Blue
      'bg-green-100 border-green-300 text-green-800',   // Green
      'bg-purple-100 border-purple-300 text-purple-800',     // Purple
      'bg-yellow-100 border-yellow-300 text-yellow-800', // Yellow
      'bg-pink-100 border-pink-300 text-pink-800', // Pink
      'bg-indigo-100 border-indigo-300 text-indigo-800',     // Indigo
      'bg-red-100 border-red-300 text-red-800', // Red
      'bg-teal-100 border-teal-300 text-teal-800'      // Teal
    ]
    return colors[hash % colors.length]
  }

  // Check if a booking is happening at a specific time slot for a specific staff
  const getBookingAtTimeSlot = (staffId: string, slotTime: Date): Booking | null => {
    const result = bookings.find(booking => {
      if (booking.staff_id !== staffId) return false
      
      // Get booking times in UTC (as they come from the backend)
      const bookingStart = new Date(booking.start_at);
      const bookingStartHour = bookingStart.getUTCHours();
      const bookingStartMinute = bookingStart.getUTCMinutes();
      
      const bookingEnd = new Date(booking.end_at);
      const bookingEndHour = bookingEnd.getUTCHours();
      const bookingEndMinute = bookingEnd.getUTCMinutes();
      
      // Convert slot time to backend-equivalent time for comparison
      const slotHour = slotTime.getHours();
      const slotMinute = slotTime.getMinutes();
      
      // End time of the current slot
      const slotEndHour = slotMinute === 30 ? slotHour + 1 : slotHour;
      const slotEndMinute = slotMinute === 30 ? 0 : 30;
      
      // Check if slot overlaps with booking
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
  
  // Check if this is the start of a booking (first slot where booking appears)
  const isBookingStart = (staffId: string, slotTime: Date): boolean => {
    const booking = getBookingAtTimeSlot(staffId, slotTime);
    if (!booking) return false;
    
    // Get booking start time in UTC (as it comes from the backend)
    const bookingStart = new Date(booking.start_at);
    const bookingStartHour = bookingStart.getUTCHours();
    const bookingStartMinute = bookingStart.getUTCMinutes();
    
    // Convert slot time for comparison
    const slotHour = slotTime.getHours();
    const slotMinute = slotTime.getMinutes();
    
    // Next slot time
    const slotEndHour = slotMinute === 30 ? slotHour + 1 : slotHour;
    const slotEndMinute = slotMinute === 30 ? 0 : 30;
    
    // Check if this slot is the first slot that contains the booking start
    return (slotHour === bookingStartHour && slotMinute === bookingStartMinute) ||
           (slotHour === bookingStartHour && slotMinute === 0 && bookingStartMinute < 30) ||
           (slotHour === bookingStartHour && slotMinute === 30 && bookingStartMinute >= 30);
  }

  // Calculate how many slots a booking should span
  const calculateBookingRowSpan = (booking: Booking): number => {
    const start = new Date(booking.start_at);
    const end = new Date(booking.end_at);
    
    // Calculate duration in minutes using UTC times
    const startMinutes = start.getUTCHours() * 60 + start.getUTCMinutes();
    const endMinutes = end.getUTCHours() * 60 + end.getUTCMinutes();
    const durationMinutes = endMinutes - startMinutes;
    
    return Math.max(1, Math.ceil(durationMinutes / 30)); // At least 1 slot
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-lg border">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateDay('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            className="font-medium"
            onClick={() => setIsDatePickerOpen(true)}
          >
            {format(selectedDate, 'dd MMMM yyyy', { locale: ru })}
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateDay('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {staffMembers.length} {staffMembers.length === 1 ? 'специалист' : 'специалиста'} на смене
        </div>
      </div>

      {/* Time slots grid */}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <div className="min-w-[900px]">
          {/* Staff headers */}
          <div className="grid grid-cols-[80px_repeat(auto-fit,minmax(120px,1fr))] gap-1 border-b bg-muted/50">
            <div className="font-medium text-center py-3 text-xs text-muted-foreground">
              Время
            </div>
            {staffMembers && Array.isArray(staffMembers) ? staffMembers.map(staff => (
              <div 
                key={staff.id} 
                className="font-medium text-center py-3 border-l text-sm truncate px-2"
                title={`${staff.first_name} ${staff.last_name}`}
              >
                <div className="font-semibold">{staff.first_name}</div>
                <div className="font-normal text-muted-foreground">{staff.last_name}</div>
              </div>
            )) : null}
          </div>

          {/* Time slots - restructured to support proper vertical spanning */}
          <div className="grid" style={{ display: 'grid', gridTemplateColumns: '80px repeat(auto-fit, minmax(120px, 1fr))' }}>
            {/* Time labels column */}
            <div className="grid-cols-1">
              {timeSlots.map((slot, index) => (
                <div 
                  key={index} 
                  className="text-xs text-muted-foreground py-3 text-center font-medium border-b last:border-b-0 h-[52px]"
                >
                  {slot.formattedTime}
                </div>
              ))}
            </div>
            
            {/* Staff columns */}
            {staffMembers.map(staff => (
              <div key={staff.id} className="border-l relative">
                {/* Empty grid cells for structure */}
                {timeSlots.map((slot, slotIndex) => (
                  <div 
                    key={`empty-${staff.id}-${slotIndex}`} 
                    className="border-b last:border-b-0 hover:bg-muted/50 cursor-pointer h-[52px]"
                  />
                ))}
                
                {/* Bookings overlaid on the grid */}
                {timeSlots.map((slot, slotIndex) => {
                  const booking = getBookingAtTimeSlot(staff.id, slot.time);
                  const isStart = isBookingStart(staff.id, slot.time);
                  
                  if (booking && isStart) {
                    // Calculate booking duration in slots (30-minute intervals)
                    const rowSpan = calculateBookingRowSpan(booking);
                    
                    // Calculate top position based on slot index
                    const topPosition = slotIndex * 52; // 52px is the height of each time slot
                    
                    return (
                      <div
                        key={`booking-${staff.id}-${slotIndex}`}
                        className={`rounded border-l-4 ${getBookingColor(booking.service_name)} p-2 text-xs shadow-sm absolute left-0 right-0 overflow-hidden`}
                        style={{ 
                          top: `${topPosition}px`,
                          height: `${rowSpan * 52}px`
                        }}
                        title={`${booking.customer_name} - ${booking.service_name}`}
                      >
                        <div className="font-semibold truncate">{booking.customer_name}</div>
                        <div className="font-medium truncate mt-1">{booking.service_name}</div>
                        <div className="flex items-center mt-2 text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          <span className="text-xs">
                            {formatTimeFromBackend(booking.start_at)} - {formatTimeFromBackend(booking.end_at)}
                          </span>
                        </div>
                        <div className="absolute bottom-1 right-1 text-muted-foreground">
                          <User className="h-3 w-3" />
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <DatePickerDialog
        isOpen={isDatePickerOpen}
        onOpenChange={setIsDatePickerOpen}
        title="Выберите дату"
        description="Выберите дату для просмотра расписания"
        onConfirm={handleDateSelect}
        onCancel={() => {}}
        defaultDate={format(selectedDate, 'yyyy-MM-dd')}
      />
    </div>
  )
}