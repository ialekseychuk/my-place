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
import type { CreateBookingRequest } from '@/types/booking'
import type { Service } from '@/types/service'
import type { Staff } from '@/types/staff'
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
      const [servicesData, staffsData] = await Promise.all([
        serviceService.getServicesByBusiness(businessID, locationID),
        staffService.getStaffByBusiness(businessID, locationID || ''),
      ])
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

  const handleDateChange = (date: string, time: string) => {
    if (date && time) {
      const dateTimeString = `${date}T${time}:00`
      setFormData({ ...formData, start_at: dateTimeString })
      if (errors.start_at) {
        setErrors({ ...errors, start_at: '' })
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
                setFormData({ ...formData, service_id: value })
                if (errors.service_id) setErrors({ ...errors, service_id: '' })
              }}
            >
              <SelectTrigger id="service" className={errors.service_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Выберите услугу" />
              </SelectTrigger>
              <SelectContent>
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
                setFormData({ ...formData, staff_id: value })
                if (errors.staff_id) setErrors({ ...errors, staff_id: '' })
              }}
            >
              <SelectTrigger id="staff" className={errors.staff_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Выберите сотрудника" />
              </SelectTrigger>
              <SelectContent>
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
            <Input
              id="customer_phone"
              value={formData.customer_phone}
              onChange={(e) => {
                setFormData({ ...formData, customer_phone: e.target.value })
                if (errors.customer_phone) setErrors({ ...errors, customer_phone: '' })
              }}
              className={errors.customer_phone ? 'border-red-500' : ''}
              placeholder="Введите номер телефона"
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