import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import { useToast } from '@/hooks/use-toast'
import { ScheduleService } from '@/services/scheduleService'
import { widgetService } from '@/services/widgetService'
import type { CreateBookingRequest } from '@/types/booking'
import type { Location } from '@/types/location'
import type { Service } from '@/types/service'
import type { Staff } from '@/types/staff'
import type { StaffServiceAssignment } from '@/types/staff-service'
import { addDays, addMonths, format, getDay, isToday, startOfMonth } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ArrowLeft, Building, Calendar, ChevronLeft, ChevronRight, Scissors, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

interface WidgetProps {
  businessId: string
  locationId?: string
  businessName?: string
  businessAddress?: string
}

type Step = 'location' | 'selection' | 'confirmation'

interface ServiceCategory {
  id: string
  name: string
  services: Service[]
}

// Mock data for fallback when API fails
const mockLocations: Location[] = [
  {
    id: 'loc1',
    business_id: 'demo-business-id',
    name: 'Центральный филиал',
    address: 'ул. Примерная, д.1',
    city: 'Москва',
    contact_info: '+7 (999) 123-45-67',
    timezone: 'Europe/Moscow',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'loc2',
    business_id: 'demo-business-id',
    name: 'Северный филиал',
    address: 'ул. Ленина, д.42',
    city: 'Москва',
    contact_info: '+7 (999) 765-43-21',
    timezone: 'Europe/Moscow',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

const mockStaff: Staff[] = [
  {
    id: 'staff1',
    business_id: 'demo-business-id',
    first_name: 'Анна',
    last_name: 'Иванова',
    full_name: 'Анна Иванова',
    phone: '+7 (999) 123-45-67',
    gender: 'female',
    position: 'Стилист',
    description: 'Опытный стилист с 5-летним стажем',
    specialization: 'Женские стрижки, окрашивание',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'staff2',
    business_id: 'demo-business-id',
    first_name: 'Иван',
    last_name: 'Петров',
    full_name: 'Иван Петров',
    phone: '+7 (999) 765-43-21',
    gender: 'male',
    position: 'Барбер',
    description: 'Специалист по мужским стрижкам',
    specialization: 'Мужские стрижки, бритье',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

const mockServices: Service[] = [
  {
    id: 'service1',
    business_id: 'demo-business-id',
    name: 'Мужская стрижка',
    duration_min: 30,
    price_cents: 150000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'service2',
    business_id: 'demo-business-id',
    name: 'Женская стрижка',
    duration_min: 60,
    price_cents: 250000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'service3',
    business_id: 'demo-business-id',
    name: 'Окрашивание',
    duration_min: 120,
    price_cents: 500000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

const mockAssignments: StaffServiceAssignment[] = [
  {
    id: 'assign1',
    staff_id: 'staff1',
    service_id: 'service2',
    staff_name: 'Анна Иванова',
    service_name: 'Женская стрижка',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'assign2',
    staff_id: 'staff1',
    service_id: 'service3',
    staff_name: 'Анна Иванова',
    service_name: 'Окрашивание',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'assign3',
    staff_id: 'staff2',
    service_id: 'service1',
    staff_name: 'Иван Петров',
    service_name: 'Мужская стрижка',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export function Widget({ businessId, locationId: propLocationId, businessName = 'Мой Салон', businessAddress = 'ул. Примерная, д.1' }: WidgetProps) {
  const { toast } = useToast()
  const location = useLocation()
  const [services, setServices] = useState<Service[]>([])
  const [staffs, setStaffs] = useState<Staff[]>([])
  const [allServices, setAllServices] = useState<Service[]>([])
  const [allStaffs, setAllStaffs] = useState<Staff[]>([])
  const [staffServiceAssignments, setStaffServiceAssignments] = useState<StaffServiceAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  
  // Locations
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  
  // Selected values
  const [selectedService, setSelectedService] = useState<string>('')
  const [selectedServiceObj, setSelectedServiceObj] = useState<Service | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [selectedStaffObj, setSelectedStaffObj] = useState<Staff | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [customerName, setCustomerName] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')
  
  // UI State
  const [currentStep, setCurrentStep] = useState<Step>('location')
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('')
  
  // Search
  const [searchQuery, setSearchQuery] = useState('')

  // Parse URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const urlLocationId = urlParams.get('location_id')
    
    // Use URL location_id, then prop locationId, then empty string
    const initialLocationId = urlLocationId || propLocationId || ''
    setSelectedLocationId(initialLocationId)
    
    // If we have a location ID, skip to selection step
    if (initialLocationId) {
      setCurrentStep('selection')
    }
  }, [location.search, propLocationId])

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locationsData = await widgetService.getLocations(businessId)
        setLocations(locationsData)
        
        // Check if we have a selected location ID
        if (selectedLocationId) {
          // Find and set the selected location
          const location = locationsData.find(loc => loc.id === selectedLocationId)
          if (location) {
            setSelectedLocation(location)
            setCurrentStep('selection')
          }
        } else if (locationsData.length === 1) {
          // If we only have one location, auto-select it
          setSelectedLocationId(locationsData[0].id)
          setSelectedLocation(locationsData[0])
          setCurrentStep('selection')
        } else {
          // Multiple locations and no selection, stay on location step
          setCurrentStep('location')
        }
      } catch (error) {
        console.error('Error fetching locations:', error)
        // Use mock data as fallback
        setLocations(mockLocations)
        
        toast({
          title: 'Используются тестовые данные',
          description: 'Не удалось загрузить локации, используются тестовые данные',
          variant: 'warning',
        })
        
        if (mockLocations.length === 1) {
          setSelectedLocationId(mockLocations[0].id)
          setSelectedLocation(mockLocations[0])
          setCurrentStep('selection')
        } else {
          setCurrentStep('location')
        }
      }
    }
    
    if (businessId) {
      fetchLocations()
    }
  }, [businessId, selectedLocationId])

  // Generate available dates (current month and next month)
  useEffect(() => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 60; i++) {
      const date = addDays(today, i)
      dates.push(format(date, 'yyyy-MM-dd'))
    }
    setAvailableDates(dates)
    
    // Set default date to tomorrow
    if (dates.length > 1) {
      setSelectedDate(dates[1])
    }
  }, [])

  // Generate available times based on staff availability
  useEffect(() => {
    const fetchAvailableTimes = async () => {
      // Only fetch if we have a date selected
      if (!selectedDate || !selectedLocationId) {
        setAvailableTimes([])
        return
      }
      
      try {
        // If we have a staff member selected, get their specific availability
        if (selectedStaff) {
          const availableStaff = await widgetService.getAvailableStaff(
            businessId, 
            selectedDate, 
            undefined, 
            undefined, 
            selectedLocationId
          )
          
          // Check if the selected staff is available on this date
          const staffAvailability = availableStaff.find(s => s.staff_id === selectedStaff)
          if (staffAvailability && staffAvailability.is_available) {
            // Get staff schedule to generate times
            const scheduleService = new ScheduleService(businessId)
            const staffSchedule = await scheduleService.getStaffDaySchedule(selectedStaff, selectedDate)
            const times = generateTimesFromSchedule(staffSchedule)
            setAvailableTimes(times)
          } else {
            setAvailableTimes([])
          }
        } 
        // If we have a service selected but no staff, get availability for all staff who can provide the service
        else if (selectedService) {
          // Find all staff who can provide this service
          const staffIds = staffServiceAssignments
            .filter(assignment => assignment.service_id === selectedService)
            .map(assignment => assignment.staff_id)
          
          if (staffIds.length > 0) {
            // Get available staff for this date
            const availableStaff = await widgetService.getAvailableStaff(
              businessId, 
              selectedDate, 
              undefined, 
              undefined, 
              selectedLocationId
            )
            
            // Filter to only staff who can provide the service and are available
            const availableStaffIds = availableStaff
              .filter(s => s.is_available && staffIds.includes(s.staff_id))
              .map(s => s.staff_id)
            
            if (availableStaffIds.length > 0) {
              // Get schedules for all relevant staff
              const scheduleService = new ScheduleService(businessId)
              const schedules = await Promise.all(
                availableStaffIds.map(staffId => scheduleService.getStaffDaySchedule(staffId, selectedDate))
              )
              
              // Combine all available times
              const allTimes = schedules.flatMap(schedule => generateTimesFromSchedule(schedule))
              // Remove duplicates and sort
              const uniqueTimes = [...new Set(allTimes)].sort()
              setAvailableTimes(uniqueTimes)
            } else {
              setAvailableTimes([])
            }
          } else {
            setAvailableTimes([])
          }
        } 
        // If neither staff nor service selected, get availability for all staff
        else {
          // Get available staff for this date
          const availableStaff = await widgetService.getAvailableStaff(
            businessId, 
            selectedDate, 
            undefined, 
            undefined, 
            selectedLocationId
          )
          
          // Filter to only staff who are available
          const availableStaffIds = availableStaff
            .filter(s => s.is_available)
            .map(s => s.staff_id)
          
          if (availableStaffIds.length > 0) {
            // Get schedules for all available staff
            const scheduleService = new ScheduleService(businessId)
            const schedules = await Promise.all(
              availableStaffIds.map(staffId => scheduleService.getStaffDaySchedule(staffId, selectedDate))
            )
            
            // Combine all available times
            const allTimes = schedules.flatMap(schedule => generateTimesFromSchedule(schedule))
            // Remove duplicates and sort
            const uniqueTimes = [...new Set(allTimes)].sort()
            setAvailableTimes(uniqueTimes)
          } else {
            setAvailableTimes([])
          }
        }
      } catch (error) {
        console.error('Error fetching available times:', error)
        // Fallback to generated times
        const generatedTimes = generateTimesForStaff(selectedStaff, selectedDate)
        setAvailableTimes(generatedTimes)
      }
    }
    
    fetchAvailableTimes()
  }, [selectedStaff, selectedService, selectedDate, selectedLocationId, businessId, staffServiceAssignments])

  // Helper function to generate times from a staff schedule
  const generateTimesFromSchedule = (schedule: any) => {
    const times: string[] = []
    if (schedule && schedule.shifts && schedule.shifts.length > 0) {
      schedule.shifts.forEach((shift: any) => {
        if (shift.is_available) {
          // Generate 30-minute slots within the shift
          const start = new Date(`2000-01-01T${shift.start_time}`)
          const end = new Date(`2000-01-01T${shift.end_time}`)
          
          for (let time = new Date(start); time < end; time.setMinutes(time.getMinutes() + 30)) {
            const timeStr = format(time, 'HH:mm')
            times.push(timeStr)
          }
        }
      })
    }
    return times.sort()
  }

  // Generate available times based on staff availability (fallback)
  const generateTimesForStaff = (staffId: string, date: string) => {
    const times = []
    // Different available times for different staff members (for demo purposes)
    if (staffId && date) {
      const dayOfWeek = new Date(date).getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      
      // Morning shift (9:00 - 13:00)
      if (!isWeekend || Math.random() > 0.5) {
        for (let hour = 9; hour <= 13; hour++) {
          for (let minute of [0, 30]) {
            // Randomly skip some slots to simulate unavailability
            if (Math.random() > 0.3) {
              times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
            }
          }
        }
      }
      
      // Evening shift (15:00 - 21:00)
      if (!isWeekend || Math.random() > 0.3) {
        for (let hour = 15; hour <= 21; hour++) {
          for (let minute of [0, 30]) {
            if (hour === 21 && minute === 30) continue // Skip 21:30
            // Randomly skip some slots to simulate unavailability
            if (Math.random() > 0.3) {
              times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
            }
          }
        }
      }
    }
    return times.sort()
  }

  // Fetch services, staff, and assignments
  useEffect(() => {
    const fetchWidgetData = async () => {
      try {
        setLoading(true)
        
        // Only fetch data if we have a location selected
        if (!selectedLocationId) return
        
        const [servicesData, staffsData, staffServiceData] = await Promise.all([
          widgetService.getServices(businessId, selectedLocationId),
          widgetService.getStaff(businessId, selectedLocationId),
          widgetService.getStaffServices(businessId),
        ])
        
        setAllServices(servicesData)
        setAllStaffs(staffsData)
        setStaffServiceAssignments(staffServiceData)
        
        // Initially show all services and staff
        setServices(servicesData)
        setStaffs(staffsData)
        
        // Create service categories (just for demo - in real app would come from backend)
        const categories: ServiceCategory[] = [
          { id: 'haircuts', name: 'СТРИЖКИ', services: [] },
          { id: 'coloring', name: 'ОКРАШИВАНИЕ', services: [] },
          { id: 'styling', name: 'УКЛАДКИ', services: [] },
          { id: 'additional', name: 'ДОПОЛНИТЕЛЬНЫЕ', services: [] }
        ]
        
        // Distribute services among categories
        servicesData.forEach(service => {
          const randomIndex = Math.floor(Math.random() * categories.length)
          categories[randomIndex].services.push(service)
        })
        
        // Remove empty categories
        const nonEmptyCategories = categories.filter(cat => cat.services.length > 0)
        setServiceCategories(nonEmptyCategories)
        
        if (nonEmptyCategories.length > 0) {
          setActiveCategory(nonEmptyCategories[0].id)
        }
      } catch (error) {
        console.error('Error fetching widget data:', error)
        toast({
          title: 'Используются тестовые данные',
          description: 'Не удалось загрузить данные для бронирования, используются тестовые данные',
          variant: 'warning',
        })
        
        // Use mock data as fallback
        setAllServices(mockServices)
        setAllStaffs(mockStaff)
        setStaffServiceAssignments(mockAssignments)
        
        // Initially show all services and staff
        setServices(mockServices)
        setStaffs(mockStaff)
        
        // Create service categories
        const categories: ServiceCategory[] = [
          { id: 'haircuts', name: 'СТРИЖКИ', services: [] },
          { id: 'coloring', name: 'ОКРАШИВАНИЕ', services: [] },
        ]
        
        // Distribute services among categories
        mockServices.forEach(service => {
          if (service.name.includes('Мужская')) {
            categories[0].services.push(service)
          } else {
            categories[1].services.push(service)
          }
        })
        
        // Remove empty categories
        const nonEmptyCategories = categories.filter(cat => cat.services.length > 0)
        setServiceCategories(nonEmptyCategories)
        
        if (nonEmptyCategories.length > 0) {
          setActiveCategory(nonEmptyCategories[0].id)
        }
      } finally {
        setLoading(false)
      }
    }

    if (businessId && selectedLocationId) {
      fetchWidgetData()
    }
  }, [businessId, selectedLocationId])

  // Filter services based on selected staff
  useEffect(() => {
    if (!selectedStaff) {
      // If no staff selected, show all services
      setServices(allServices)
      return
    }
    
    // Find service IDs assigned to this staff member
    const serviceIds = staffServiceAssignments
      .filter(assignment => assignment.staff_id === selectedStaff)
      .map(assignment => assignment.service_id)
    
    // Filter services to only those this staff member can provide
    const filteredServices = allServices.filter(service => 
      serviceIds.includes(service.id)
    )
    
    setServices(filteredServices)
    
    // Update service categories
    const updatedCategories = [...serviceCategories]
    updatedCategories.forEach(category => {
      category.services = category.services.filter(service => 
        serviceIds.includes(service.id)
      )
    })
    setServiceCategories(updatedCategories.filter(cat => cat.services.length > 0))
    
    // If current service is not in filtered list, reset it
    if (selectedService && !serviceIds.includes(selectedService)) {
      setSelectedService('')
      setSelectedServiceObj(null)
    }
    
    // Update selected staff object
    const staffObj = allStaffs.find(staff => staff.id === selectedStaff)
    if (staffObj) {
      setSelectedStaffObj(staffObj)
    }
  }, [selectedStaff, allServices, staffServiceAssignments])

  // Filter staff based on selected service
  useEffect(() => {
    if (!selectedService) {
      // If no service selected, show all staff
      setStaffs(allStaffs)
      return
    }
    
    // Find staff IDs assigned to this service
    const staffIds = staffServiceAssignments
      .filter(assignment => assignment.service_id === selectedService)
      .map(assignment => assignment.staff_id)
    
    // Filter staff to only those who can provide this service
    const filteredStaff = allStaffs.filter(staff => 
      staffIds.includes(staff.id)
    )
    
    setStaffs(filteredStaff)
    
    // If current staff is not in filtered list, reset it
    if (selectedStaff && !staffIds.includes(selectedStaff)) {
      setSelectedStaff('')
      setSelectedStaffObj(null)
    }
    
    // Update selected service object
    const serviceObj = allServices.find(service => service.id === selectedService)
    if (serviceObj) {
      setSelectedServiceObj(serviceObj)
    }
  }, [selectedService, allStaffs, staffServiceAssignments])

  const handleBooking = async () => {
    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime || !customerName || !customerPhone) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, заполните все обязательные поля',
        variant: 'destructive',
      })
      return
    }

    try {
      setBookingLoading(true)
      
      const bookingData: CreateBookingRequest = {
        service_id: selectedService,
        staff_id: selectedStaff,
        start_at: `${selectedDate}T${selectedTime}:00`,
        customer_name: customerName,
        customer_phone: customerPhone,
        location_id: selectedLocationId,
      }
      
      await bookingService.createBooking(businessId, bookingData)
      
      toast({
        title: 'Успешно',
        description: 'Бронирование успешно создано!',
      })
      
      // Reset form
      setSelectedService('')
      setSelectedServiceObj(null)
      setSelectedStaff('')
      setSelectedStaffObj(null)
      setSelectedDate('')
      setSelectedTime('')
      setCustomerName('')
      setCustomerPhone('')
      setCurrentStep('selection')
    } catch (error: any) {
      console.error('Error creating booking:', error)
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось создать бронирование',
        variant: 'destructive',
      })
    } finally {
      setBookingLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'EEEE, d MMMM', { locale: ru })
  }
  
  const handleSelectLocation = (locationId: string) => {
    setSelectedLocationId(locationId)
    const location = locations.find(loc => loc.id === locationId)
    if (location) {
      setSelectedLocation(location)
    }
    setCurrentStep('selection')
  }
  
  const proceedToConfirmation = () => {
    if (selectedService && selectedStaff && selectedDate && selectedTime) {
      setCurrentStep('confirmation')
    } else {
      toast({
        title: 'Заполните все поля',
        description: 'Для продолжения необходимо выбрать услугу, мастера и время',
        variant: 'warning',
      })
    }
  }
  
  const goBack = () => {
    switch (currentStep) {
      case 'selection':
        if (!locationId) { // Only go back to location if locationId wasn't provided in props
          setCurrentStep('location')
        }
        break
      case 'confirmation':
        setCurrentStep('selection')
        break
      default:
        break
    }
  }
  
  const getDaysInMonth = (date: Date) => {
    const month = date.getMonth()
    const year = date.getFullYear()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const days = []
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day)
      days.push(currentDate)
    }
    
    return days
  }
  
  const getWeeks = (date: Date) => {
    const days = getDaysInMonth(date)
    const firstDayOfMonth = startOfMonth(date)
    const firstDayOfWeek = getDay(firstDayOfMonth) || 7
    
    const blanks = []
    for (let i = 1; i < firstDayOfWeek; i++) {
      blanks.push(null)
    }
    
    return [...blanks, ...days]
  }
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }
  
  const prevMonth = () => {
    const today = new Date()
    const prevMonth = addMonths(currentMonth, -1)
    if (prevMonth.getMonth() >= today.getMonth() || prevMonth.getFullYear() > today.getFullYear()) {
      setCurrentMonth(prevMonth)
    }
  }

  if (loading && currentStep !== 'location') {
    return (
      <div className="w-full bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Загрузка...</span>
        </div>
      </div>
    )
  }
  
  // Header component
  const Header = () => {
    // Use the selected location name if available
    const displayName = selectedLocation ? selectedLocation.name : businessName
    const displayAddress = selectedLocation ? selectedLocation.address : businessAddress
    
    return (
      <div className="p-4 border-b">
        <div className="flex items-center">
          {currentStep !== 'location' && (
            <button 
              onClick={goBack} 
              className="mr-2 p-1 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h2 className="text-lg font-bold">{displayName}</h2>
            <p className="text-sm text-gray-600">{displayAddress}</p>
          </div>
        </div>
      </div>
    )
  }
  
  // Location selection step
  const LocationStep = () => (
    <div className="p-4">
      <h3 className="text-xl font-bold mb-4">Выбрать филиал</h3>
      
      <div className="border rounded-lg overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h4 className="font-medium">Доступные филиалы</h4>
        </div>
        
        <div className="p-4">
          <div className="space-y-3">
            {locations.map(location => (
              <div 
                key={location.id}
                className="p-3 rounded-md border flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                onClick={() => handleSelectLocation(location.id)}
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    <Building className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="ml-3">
                    <div className="font-medium">{location.name}</div>
                    <div className="text-sm text-gray-600">{location.address}</div>
                    <div className="text-xs text-gray-500">{location.city}</div>
                  </div>
                </div>
                <div className="h-5 w-5 rounded-full border border-gray-300"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
  
  // Combined selection step (staff, service, date/time)
  const SelectionStep = () => {
    const weeks = getWeeks(currentMonth)
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    
    return (
      <div className="p-4">
        <div className="space-y-6">
          {/* Staff Selection */}
          <div className="border rounded-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-medium">Специалист</h3>
              <div className={`px-3 py-1 rounded-full text-sm ${selectedStaff ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                {selectedStaffObj ? selectedStaffObj.full_name : 'Не выбрано'}
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-3">
                <div 
                  className="p-3 rounded-md border flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedStaff('')
                    setSelectedStaffObj(null)
                  }}
                >
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <span className="ml-3 font-medium">Любой специалист</span>
                  </div>
                  <div className={`h-5 w-5 rounded-full ${selectedStaff === '' ? 'bg-blue-500' : 'border border-gray-300'}`}></div>
                </div>
                
                {staffs.map(staff => (
                  <div 
                    key={staff.id}
                    className="p-3 rounded-md border flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedStaff(staff.id)
                      setSelectedStaffObj(staff)
                    }}
                  >
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {/* Here would be staff photo */}
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="ml-3">
                        <div className="font-medium">{staff.full_name}</div>
                        <div className="text-sm text-gray-600">{staff.position}</div>
                        <div className="flex items-center mt-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className="text-yellow-400 text-xs">★</span>
                          ))}
                          <span className="text-xs text-gray-500 ml-1">{Math.floor(Math.random() * 100) + 20} отзывов</span>
                        </div>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-full ${selectedStaff === staff.id ? 'bg-blue-500' : 'border border-gray-300'}`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Service Selection */}
          <div className="border rounded-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-medium">Услуга</h3>
              <div className={`px-3 py-1 rounded-full text-sm ${selectedService ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                {selectedServiceObj ? selectedServiceObj.name : 'Не выбрано'}
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex overflow-x-auto space-x-2 pb-4 mb-3">
                {serviceCategories.map(category => (
                  <button
                    key={category.id}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium 
                      ${activeCategory === category.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}
                    `}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
              
              <div className="space-y-3">
                {serviceCategories
                  .find(cat => cat.id === activeCategory)?.services
                  .filter(service => !searchQuery || service.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(service => (
                    <div 
                      key={service.id}
                      className="p-3 rounded-md border flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedService(service.id)
                        setSelectedServiceObj(service)
                      }}
                    >
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-gray-500">
                          {service.duration_min} мин
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="text-blue-600 font-medium mr-3">
                          {service.price_cents / 100} ₽
                        </div>
                        <div className={`h-5 w-5 rounded-full ${selectedService === service.id ? 'bg-blue-500' : 'border border-gray-300'}`}></div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
          
          {/* Date and Time Selection */}
          <div className="border rounded-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-medium">Дата и время</h3>
              <div className={`px-3 py-1 rounded-full text-sm ${(selectedDate && selectedTime) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                {(selectedDate && selectedTime) ? `${formatDate(selectedDate)}, ${selectedTime}` : 'Не выбрано'}
              </div>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <button 
                    onClick={prevMonth}
                    className="p-1 rounded-full hover:bg-gray-100"
                    disabled={isPrevMonthDisabled()}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <h4 className="font-medium text-lg">
                    {format(currentMonth, 'LLLL', { locale: ru }).charAt(0).toUpperCase() + format(currentMonth, 'LLLL', { locale: ru }).slice(1)}
                  </h4>
                  
                  <button 
                    onClick={nextMonth}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-2 text-center">
                  {dayNames.map(day => (
                    <div key={day} className="text-sm font-medium text-gray-500 py-1">
                      {day}
                    </div>
                  ))}
                  
                  {weeks.map((day, i) => {
                    if (!day) {
                      return <div key={`empty-${i}`} className="h-9"></div>
                    }
                    
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const isSelected = selectedDate === dateStr
                    const isToday_ = isToday(day)
                    
                    return (
                      <div 
                        key={dateStr}
                        className={`h-9 flex items-center justify-center rounded-full cursor-pointer
                          ${isSelected ? 'bg-blue-500 text-white font-bold' : ''}
                          ${isToday_ && !isSelected ? 'border border-gray-300' : ''}
                        `}
                        onClick={() => setSelectedDate(dateStr)}
                      >
                        {format(day, 'd')}
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {selectedDate && (
                <div>
                  <h5 className="font-medium mb-3 text-sm">Доступное время</h5>
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimes.map(time => (
                      <div 
                        key={time}
                        className={`py-2 text-center rounded cursor-pointer
                          ${selectedTime === time 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}
                        `}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <Button 
            className="w-full py-6 text-lg"
            onClick={proceedToConfirmation}
            disabled={!selectedService || !selectedStaff || !selectedDate || !selectedTime}
          >
            Продолжить
          </Button>
        </div>
      </div>
    )
  }
  
  // Confirmation step
  const ConfirmationStep = () => (
    <div className="p-4">
      <h3 className="text-xl font-bold mb-4">Подтверждение записи</h3>
      
      <div className="space-y-4 mb-6">
        <div className="border rounded-lg overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium">Детали записи</h4>
          </div>
          
          <div className="p-4 space-y-4">
            {selectedServiceObj && (
              <div className="flex items-center">
                <Scissors className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="font-medium">{selectedServiceObj.name}</div>
                  <div className="text-sm text-gray-600">
                    {selectedServiceObj.duration_min} мин • {selectedServiceObj.price_cents / 100} ₽
                  </div>
                </div>
              </div>
            )}
            
            {selectedStaffObj && (
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="font-medium">{selectedStaffObj.full_name}</div>
                  <div className="text-sm text-gray-600">{selectedStaffObj.position}</div>
                </div>
              </div>
            )}
            
            {selectedDate && selectedTime && (
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="font-medium">{formatDate(selectedDate)}</div>
                  <div className="text-sm text-gray-600">{selectedTime}</div>
                </div>
              </div>
            )}
            
            {selectedLocation && (
              <div className="flex items-center">
                <Building className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="font-medium">{selectedLocation.name}</div>
                  <div className="text-sm text-gray-600">{selectedLocation.address}</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium">Контактные данные</h4>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Ваше имя</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Введите ваше имя"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Телефон</Label>
              <PhoneInput
                value={customerPhone}
                onChange={setCustomerPhone}
                placeholder="+7 (999) 123-45-67"
                defaultCountry="ru"
              />
            </div>
          </div>
        </div>
        
        <Button 
          className="w-full py-6 text-lg" 
          onClick={handleBooking}
          disabled={bookingLoading || !customerName || !customerPhone}
        >
          {bookingLoading ? 'Создание записи...' : 'Записаться'}
        </Button>
      </div>
    </div>
  )

  const isPrevMonthDisabled = () => {
    const today = new Date()
    const prevMonth = addMonths(currentMonth, -1)
    return prevMonth.getMonth() < today.getMonth() && prevMonth.getFullYear() <= today.getFullYear()
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
      <Header />
      
      {currentStep === 'location' && <LocationStep />}
      {currentStep === 'selection' && <SelectionStep />}
      {currentStep === 'confirmation' && <ConfirmationStep />}
      
      <div className="p-4 border-t text-center text-xs text-gray-500">
        Работает на <span className="font-medium">My Place</span>
      </div>
    </div>
  )
}
