import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { bookingService } from '@/services/bookingService'
import { serviceService } from '@/services/service'
import { staffService } from '@/services/staff'
import { staffServiceService } from '@/services/staff-service'
import { ScheduleService } from '@/services/scheduleService'
import type { CreateBookingRequest } from '@/types/booking'
import type { Service } from '@/types/service'
import type { Staff } from '@/types/staff'
import type { StaffServiceAssignment } from '@/types/staff-service'
import { useEffect, useState } from 'react'

interface BookingCreationDialogProps {
  businessID: string
  locationID?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function BookingCreationDialog({
  businessID,
  locationID,
  open,
  onOpenChange,
  onSuccess,
}: BookingCreationDialogProps) {
  const { toast } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [staffs, setStaffs] = useState<Staff[]>([])
  const [allServices, setAllServices] = useState<Service[]>([])
  const [allStaffs, setAllStaffs] = useState<Staff[]>([])
  const [staffServiceAssignments, setStaffServiceAssignments] = useState<StaffServiceAssignment[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateBookingRequest>({
    service_id: '',
    staff_id: '',
    start_at: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    location_id: locationID,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      fetchServicesAndStaff()
      // Reset form when dialog opens
      setFormData({
        service_id: '',
        staff_id: '',
        start_at: '',
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        location_id: locationID,
      })
      setErrors({})
    }
  }, [open, locationID])

  const fetchServicesAndStaff = async () => {
    try {
      setLoading(true)
      const [servicesData, staffsData, staffServiceData] = await Promise.all([
        serviceService.getServicesByBusiness(businessID, locationID),
        staffService.getStaffByBusiness(businessID, locationID || ''),
        staffServiceService.getAllStaffServices(businessID),
      ])
      
      setAllServices(servicesData)
      setAllStaffs(staffsData)
      setStaffServiceAssignments(staffServiceData)
      
      // Initially show all services and staff
      setServices(servicesData)
      setStaffs(staffsData)
    } catch (error) {
      console.error('Error fetching services or staff:', error)
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные для создания бронирования',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter services based on selected staff
  const filterServicesByStaff = (staffId: string) => {
    if (!staffId) {
      // If no staff selected, show all services
      setServices(allServices);
      return;
    }
    
    // Find service IDs assigned to this staff member
    const serviceIds = staffServiceAssignments
      .filter(assignment => assignment.staff_id === staffId)
      .map(assignment => assignment.service_id);
    
    // Filter services to only those this staff member can provide
    const filteredServices = allServices.filter(service => 
      serviceIds.includes(service.id)
    );
    
    setServices(filteredServices);
  }

  // Filter staff based on selected service
  const filterStaffByService = (serviceId: string) => {
    if (!serviceId) {
      // If no service selected, show all staff
      setStaffs(allStaffs);
      return;
    }
    
    // Find staff IDs assigned to this service
    const staffIds = staffServiceAssignments
      .filter(assignment => assignment.service_id === serviceId)
      .map(assignment => assignment.staff_id);
    
    // Filter staff to only those who can provide this service
    const filteredStaff = allStaffs.filter(staff => 
      staffIds.includes(staff.id)
    );
    
    setStaffs(filteredStaff);
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.service_id) {
      newErrors.service_id = 'Пожалуйста, выберите услугу'
    }
    
    if (!formData.staff_id) {
      newErrors.staff_id = 'Пожалуйста, выберите сотрудника'
    }
    
    if (!formData.start_at) {
      newErrors.start_at = 'Пожалуйста, выберите дату и время'
    }
    
    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Пожалуйста, введите имя клиента'
    }
    
    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = 'Пожалуйста, введите номер телефона клиента'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    try {
      setLoading(true)
      await bookingService.createBooking(businessID, formData)
      toast({
        title: 'Успешно',
        description: 'Бронирование успешно создано',
      })
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error creating booking:', error)
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось создать бронирование',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = async (date: string, time: string) => {
    if (date) {
      let dateTimeString = formData.start_at;
      if (time) {
        dateTimeString = `${date}T${time}:00`;
        setFormData({ ...formData, start_at: dateTimeString });
      } else if (!formData.start_at) {
        // If no time provided and no existing datetime, set to beginning of day
        dateTimeString = `${date}T00:00:00`;
        setFormData({ ...formData, start_at: dateTimeString });
      }
      
      if (errors.start_at) {
        setErrors({ ...errors, start_at: '' });
      }
      
      // Filter staff by shift date
      try {
        const scheduleService = new ScheduleService(businessID);
        // Get available staff for the selected date
        // If time is selected, use it for more precise filtering
        // Otherwise, just check if staff have shifts on that date
        let availableStaff;
        if (time) {
          availableStaff = await scheduleService.getAvailableStaff(date, time, time, locationID);
        } else {
          // For date-only filtering, we'll use a broad time range to check availability
          availableStaff = await scheduleService.getAvailableStaff(date, '00:00', '23:59', locationID);
        }
        
        // Filter allStaffs to only include staff who are available on the selected date
        const staffOnShift = allStaffs.filter(staff => 
          availableStaff.some(available => available.staff_id === staff.id && available.is_available)
        );
        
        // Update the staff list
        setStaffs(staffOnShift);
        
        // If the currently selected staff is not available on the new date, reset the selection
        if (formData.staff_id && !staffOnShift.some(staff => staff.id === formData.staff_id)) {
          setFormData(prev => ({ ...prev, staff_id: '' }));
          
          // Also reset service if it was tied to the staff member
          if (formData.service_id) {
            setFormData(prev => ({ ...prev, service_id: '' }));
          }
        }
      } catch (error) {
        console.error('Error filtering staff by date:', error);
        // If there's an error, show all staff
        setStaffs(allStaffs);
      }
    }
  }

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]
  
  // Generate time options (every 30 minutes from 08:00 to 20:00)
  const timeOptions = []
  for (let hour = 8; hour <= 20; hour++) {
    for (let minute of [0, 30]) {
      if (hour === 20 && minute === 30) continue // Skip 20:30
      timeOptions.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Новое бронирование</DialogTitle>
          <DialogDescription>
            Заполните форму для создания нового бронирования
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service">Услуга</Label>
            <Select
              value={formData.service_id}
              onValueChange={(value) => {
                // If the "reset" value is selected, reset to empty string
                const serviceId = value === "reset" ? "" : value;
                
                setFormData({ ...formData, service_id: serviceId });
                // When service changes, filter staff who can provide this service
                filterStaffByService(serviceId);
                if (errors.service_id) setErrors({ ...errors, service_id: '' });
                
                // If current staff cannot provide this service, reset staff selection
                if (formData.staff_id && serviceId) {
                  const staffCanProvideService = staffServiceAssignments.some(
                    assignment => assignment.staff_id === formData.staff_id && assignment.service_id === serviceId
                  );
                  if (!staffCanProvideService) {
                    setFormData(prev => ({ ...prev, staff_id: '' }));
                  }
                }
              }}
            >
              <SelectTrigger id="service" className={errors.service_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Выберите услугу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reset">Выбрать услугу</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} ({service.duration_min} мин)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.service_id && <p className="text-sm text-red-500">{errors.service_id}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="staff">Сотрудник</Label>
            <Select
              value={formData.staff_id}
              onValueChange={(value) => {
                // If the "reset" value is selected, reset to empty string
                const staffId = value === "reset" ? "" : value;
                
                setFormData({ ...formData, staff_id: staffId });
                // When staff changes, filter services this staff can provide
                filterServicesByStaff(staffId);
                if (errors.staff_id) setErrors({ ...errors, staff_id: '' });
                
                // If current service cannot be provided by this staff, reset service selection
                if (formData.service_id && staffId) {
                  const staffCanProvideService = staffServiceAssignments.some(
                    assignment => assignment.staff_id === staffId && assignment.service_id === formData.service_id
                  );
                  if (!staffCanProvideService) {
                    setFormData(prev => ({ ...prev, service_id: '' }));
                  }
                }
              }}
            >
              <SelectTrigger id="staff" className={errors.staff_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Выберите сотрудника" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reset">Выбрать сотрудника</SelectItem>
                {staffs.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.full_name} ({staff.position})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.staff_id && <p className="text-sm text-red-500">{errors.staff_id}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Дата и время</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                id="date"
                min={today}
                value={formData.start_at ? formData.start_at.split('T')[0] : ''}
                onChange={(e) => handleDateChange(e.target.value, formData.start_at.split('T')[1]?.substring(0, 5) || '09:00')}
                className={errors.start_at ? 'border-red-500' : ''}
              />
              <Select
                value={formData.start_at ? formData.start_at.split('T')[1]?.substring(0, 5) : ''}
                onValueChange={(value) => handleDateChange(formData.start_at.split('T')[0] || today, value)}
              >
                <SelectTrigger className={errors.start_at ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Время" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.start_at && <p className="text-sm text-red-500">{errors.start_at}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customer_name">Имя клиента</Label>
            <Input
              id="customer_name"
              value={formData.customer_name}
              onChange={(e) => {
                setFormData({ ...formData, customer_name: e.target.value })
                if (errors.customer_name) setErrors({ ...errors, customer_name: '' })
              }}
              className={errors.customer_name ? 'border-red-500' : ''}
              placeholder="Введите имя клиента"
            />
            {errors.customer_name && <p className="text-sm text-red-500">{errors.customer_name}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customer_phone">Телефон клиента</Label>
            <PhoneInput
              value={formData.customer_phone}
              onChange={(value) => {
                setFormData({ ...formData, customer_phone: value })
                if (errors.customer_phone) setErrors({ ...errors, customer_phone: '' })
              }}
              className={errors.customer_phone ? 'border-red-500' : ''}
              placeholder="+7 (999) 123-45-67"
              defaultCountry="ru"
            />
            {errors.customer_phone && <p className="text-sm text-red-500">{errors.customer_phone}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customer_email">Email клиента (необязательно)</Label>
            <Input
              id="customer_email"
              type="email"
              value={formData.customer_email || ''}
              onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              placeholder="Введите email клиента"
            />
          </div>
          
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Создание...' : 'Создать бронирование'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
