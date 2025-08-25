import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
//import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  User, 
  Settings, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RegistrationData {
  // Business Information
  businessName: string
  businessType: string
  description: string
  
  // Contact Information
  address: string
  city: string
  phone: string
  email: string
  website: string
  
  // Owner Information
  ownerFirstName: string
  ownerLastName: string
  ownerPhone: string
  ownerEmail: string
  ownerPassword: string
  ownerPasswordConfirm: string
  
  // Business Settings
  workingHours: {
    monday: { start: string; end: string; enabled: boolean }
    tuesday: { start: string; end: string; enabled: boolean }
    wednesday: { start: string; end: string; enabled: boolean }
    thursday: { start: string; end: string; enabled: boolean }
    friday: { start: string; end: string; enabled: boolean }
    saturday: { start: string; end: string; enabled: boolean }
    sunday: { start: string; end: string; enabled: boolean }
  }
  timezone: string
  currency: string
  
  // Additional Settings
  enableOnlineBooking: boolean
  enableSMSNotifications: boolean
  enableEmailNotifications: boolean
  acceptTerms: boolean
}

const businessTypes = [
  { value: 'salon', label: 'Салон красоты' },
  { value: 'barbershop', label: 'Барбершоп' },
  { value: 'spa', label: 'SPA-салон' },
  { value: 'nails', label: 'Ногтевая студия' },
  { value: 'massage', label: 'Массажный салон' },
  { value: 'cosmetology', label: 'Косметология' },
  { value: 'fitness', label: 'Фитнес-центр' },
  { value: 'medical', label: 'Медицинский центр' },
  { value: 'other', label: 'Другое' }
]

const timezones = [
  { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
  { value: 'Europe/Kiev', label: 'Киев (UTC+2)' },
  { value: 'Asia/Almaty', label: 'Алматы (UTC+6)' },
  { value: 'Asia/Tashkent', label: 'Ташкент (UTC+5)' }
]

const currencies = [
  { value: 'RUB', label: '₽ Российский рубль' },
  { value: 'USD', label: '$ Доллар США' },
  { value: 'EUR', label: '€ Евро' },
  { value: 'KZT', label: '₸ Казахстанский тенге' }
]

const defaultWorkingHours = {
  start: '09:00',
  end: '18:00',
  enabled: true
}

const steps = [
  {
    id: 'business',
    title: 'Информация о бизнесе',
    description: 'Основные данные о вашем заведении',
    icon: Building2
  },
  {
    id: 'owner',
    title: 'Данные владельца',
    description: 'Информация о владельце и админе системы',
    icon: User
  },
  {
    id: 'settings',
    title: 'Настройки',
    description: 'Рабочее время и дополнительные параметры',
    icon: Settings
  },
  {
    id: 'complete',
    title: 'Завершение',
    description: 'Подтверждение и создание аккаунта',
    icon: CheckCircle
  }
]

export function BusinessRegistration() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [data, setData] = useState<RegistrationData>({
    businessName: '',
    businessType: '',
    description: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    website: '',
    ownerFirstName: '',
    ownerLastName: '',
    ownerPhone: '',
    ownerEmail: '',
    ownerPassword: '',
    ownerPasswordConfirm: '',
    workingHours: {
      monday: { ...defaultWorkingHours },
      tuesday: { ...defaultWorkingHours },
      wednesday: { ...defaultWorkingHours },
      thursday: { ...defaultWorkingHours },
      friday: { ...defaultWorkingHours },
      saturday: { start: '10:00', end: '16:00', enabled: true },
      sunday: { start: '10:00', end: '16:00', enabled: false }
    },
    timezone: 'Europe/Moscow',
    currency: 'RUB',
    enableOnlineBooking: true,
    enableSMSNotifications: true,
    enableEmailNotifications: true,
    acceptTerms: false
  })

  const updateData = (field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateWorkingHours = (day: string, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day as keyof typeof prev.workingHours],
          [field]: value
        }
      }
    }))
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/v1/businesses/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Registration failed')
      }

      const result = await response.json()
      console.log('Registration successful!', result)
      
      // Redirect to dashboard or success page
      window.location.href = '/'
    } catch (error) {
      console.error('Registration failed:', error)
      alert('Ошибка регистрации: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 0: // Business info
        return data.businessName && data.businessType && data.phone && data.email
      case 1: // Owner info
        return data.ownerFirstName && data.ownerLastName && data.ownerEmail && 
               data.ownerPassword && data.ownerPassword === data.ownerPasswordConfirm
      case 2: // Settings
        return data.timezone && data.currency
      case 3: // Complete
        return data.acceptTerms
      default:
        return false
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Регистрация бизнеса</h1>
          <p className="text-muted-foreground mt-2">
            Создайте аккаунт для управления вашим заведением
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              
              return (
                <div key={step.id} className="flex flex-col items-center space-y-2">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors",
                    isActive && "border-primary bg-primary text-primary-foreground",
                    isCompleted && "border-green-500 bg-green-500 text-white",
                    !isActive && !isCompleted && "border-muted bg-background"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className={cn(
                      "text-sm font-medium",
                      isActive && "text-foreground",
                      !isActive && "text-muted-foreground"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {React.createElement(steps[currentStep].icon, { className: "w-5 h-5" })}
              <span>{steps[currentStep].title}</span>
            </CardTitle>
            <CardDescription>
              {steps[currentStep].description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Business Information */}
            {currentStep === 0 && (
              <BusinessInfoStep data={data} updateData={updateData} />
            )}

            {/* Step 2: Owner Information */}
            {currentStep === 1 && (
              <OwnerInfoStep data={data} updateData={updateData} />
            )}

            {/* Step 3: Settings */}
            {currentStep === 2 && (
              <SettingsStep 
                data={data} 
                updateData={updateData}
                updateWorkingHours={updateWorkingHours}
              />
            )}

            {/* Step 4: Complete */}
            {currentStep === 3 && (
              <CompleteStep data={data} updateData={updateData} />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Назад</span>
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={nextStep}
              disabled={!isStepValid()}
              className="flex items-center space-x-2"
            >
              <span>Далее</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid() || isSubmitting}
              className="flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Создание аккаунта...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Завершить регистрацию</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Step Components
function BusinessInfoStep({ data, updateData }: { 
  data: RegistrationData
  updateData: (field: string, value: any) => void 
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="md:col-span-2">
        <Label htmlFor="businessName">Название заведения *</Label>
        <Input
          id="businessName"
          value={data.businessName}
          onChange={(e) => updateData('businessName', e.target.value)}
          placeholder="Например: Салон красоты 'Элегант'"
        />
      </div>

      <div>
        <Label htmlFor="businessType">Тип заведения *</Label>
        <Select value={data.businessType} onValueChange={(value) => updateData('businessType', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите тип" />
          </SelectTrigger>
          <SelectContent>
            {businessTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="city">Город</Label>
        <Input
          id="city"
          value={data.city}
          onChange={(e) => updateData('city', e.target.value)}
          placeholder="Москва"
        />
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="address">Адрес</Label>
        <Input
          id="address"
          value={data.address}
          onChange={(e) => updateData('address', e.target.value)}
          placeholder="ул. Примерная, д. 123"
        />
      </div>

      <div>
        <Label htmlFor="phone">Телефон *</Label>
        <Input
          id="phone"
          value={data.phone}
          onChange={(e) => updateData('phone', e.target.value)}
          placeholder="+7 (999) 123-45-67"
        />
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={data.email}
          onChange={(e) => updateData('email', e.target.value)}
          placeholder="info@salon.ru"
        />
      </div>

      <div>
        <Label htmlFor="website">Веб-сайт</Label>
        <Input
          id="website"
          value={data.website}
          onChange={(e) => updateData('website', e.target.value)}
          placeholder="https://salon.ru"
        />
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="description">Описание заведения</Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => updateData('description', e.target.value)}
          placeholder="Краткое описание вашего заведения, услуг и особенностей"
          rows={3}
        />
      </div>
    </div>
  )
}

function OwnerInfoStep({ data, updateData }: { 
  data: RegistrationData
  updateData: (field: string, value: any) => void 
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <Label htmlFor="ownerFirstName">Имя *</Label>
        <Input
          id="ownerFirstName"
          value={data.ownerFirstName}
          onChange={(e) => updateData('ownerFirstName', e.target.value)}
          placeholder="Иван"
        />
      </div>

      <div>
        <Label htmlFor="ownerLastName">Фамилия *</Label>
        <Input
          id="ownerLastName"
          value={data.ownerLastName}
          onChange={(e) => updateData('ownerLastName', e.target.value)}
          placeholder="Иванов"
        />
      </div>

      <div>
        <Label htmlFor="ownerPhone">Телефон</Label>
        <Input
          id="ownerPhone"
          value={data.ownerPhone}
          onChange={(e) => updateData('ownerPhone', e.target.value)}
          placeholder="+7 (999) 123-45-67"
        />
      </div>

      <div>
        <Label htmlFor="ownerEmail">Email для входа *</Label>
        <Input
          id="ownerEmail"
          type="email"
          value={data.ownerEmail}
          onChange={(e) => updateData('ownerEmail', e.target.value)}
          placeholder="admin@salon.ru"
        />
      </div>

      <div>
        <Label htmlFor="ownerPassword">Пароль *</Label>
        <Input
          id="ownerPassword"
          type="password"
          value={data.ownerPassword}
          onChange={(e) => updateData('ownerPassword', e.target.value)}
          placeholder="Минимум 8 символов"
        />
      </div>

      <div>
        <Label htmlFor="ownerPasswordConfirm">Подтверждение пароля *</Label>
        <Input
          id="ownerPasswordConfirm"
          type="password"
          value={data.ownerPasswordConfirm}
          onChange={(e) => updateData('ownerPasswordConfirm', e.target.value)}
          placeholder="Повторите пароль"
        />
        {data.ownerPassword && data.ownerPasswordConfirm && 
         data.ownerPassword !== data.ownerPasswordConfirm && (
          <p className="text-sm text-destructive mt-1">Пароли не совпадают</p>
        )}
      </div>

      <div className="md:col-span-2">
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Информация об учетной записи</h4>
          <p className="text-sm text-muted-foreground">
            Эти данные будут использоваться для входа в систему управления. 
            Вы сможете добавить других администраторов позже.
          </p>
        </div>
      </div>
    </div>
  )
}

function SettingsStep({ data, updateData, updateWorkingHours }: { 
  data: RegistrationData
  updateData: (field: string, value: any) => void
  updateWorkingHours: (day: string, field: string, value: any) => void
}) {
  const days = [
    { key: 'monday', label: 'Понедельник' },
    { key: 'tuesday', label: 'Вторник' },
    { key: 'wednesday', label: 'Среда' },
    { key: 'thursday', label: 'Четверг' },
    { key: 'friday', label: 'Пятница' },
    { key: 'saturday', label: 'Суббота' },
    { key: 'sunday', label: 'Воскресенье' }
  ]

  return (
    <div className="space-y-8">
      {/* Basic Settings */}
      <div>
        <h3 className="text-lg font-medium mb-4">Основные настройки</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="timezone">Часовой пояс *</Label>
            <Select value={data.timezone} onValueChange={(value) => updateData('timezone', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите часовой пояс" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="currency">Валюта *</Label>
            <Select value={data.currency} onValueChange={(value) => updateData('currency', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите валюту" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Working Hours */}
      <div>
        <h3 className="text-lg font-medium mb-4">Рабочее время</h3>
        <div className="space-y-3">
          {days.map((day) => {
            const dayData = data.workingHours[day.key as keyof typeof data.workingHours]
            return (
              <div key={day.key} className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={dayData.enabled}
                    onCheckedChange={(checked) => 
                      updateWorkingHours(day.key, 'enabled', checked)
                    }
                  />
                  <Label className="w-24">{day.label}</Label>
                </div>
                
                {dayData.enabled && (
                  <div className="flex items-center space-x-2">
                    <Input
                      type="time"
                      value={dayData.start}
                      onChange={(e) => updateWorkingHours(day.key, 'start', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">—</span>
                    <Input
                      type="time"
                      value={dayData.end}
                      onChange={(e) => updateWorkingHours(day.key, 'end', e.target.value)}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Additional Features */}
      <div>
        <h3 className="text-lg font-medium mb-4">Дополнительные возможности</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={data.enableOnlineBooking}
              onCheckedChange={(checked) => updateData('enableOnlineBooking', checked)}
            />
            <Label>Включить онлайн-запись</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={data.enableSMSNotifications}
              onCheckedChange={(checked) => updateData('enableSMSNotifications', checked)}
            />
            <Label>SMS-уведомления</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={data.enableEmailNotifications}
              onCheckedChange={(checked) => updateData('enableEmailNotifications', checked)}
            />
            <Label>Email-уведомления</Label>
          </div>
        </div>
      </div>
    </div>
  )
}

function CompleteStep({ data, updateData }: { 
  data: RegistrationData
  updateData: (field: string, value: any) => void 
}) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div>
        <h3 className="text-lg font-medium mb-4">Проверьте данные</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <Building2 className="w-4 h-4" />
                <span>Бизнес</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="font-medium">{data.businessName}</p>
                <p className="text-sm text-muted-foreground">
                  {businessTypes.find(t => t.value === data.businessType)?.label}
                </p>
              </div>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Phone className="w-3 h-3" />
                <span>{data.phone}</span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Mail className="w-3 h-3" />
                <span>{data.email}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Администратор</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="font-medium">{data.ownerFirstName} {data.ownerLastName}</p>
                <p className="text-sm text-muted-foreground">Владелец и администратор</p>
              </div>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Mail className="w-3 h-3" />
                <span>{data.ownerEmail}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="border rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Checkbox
            checked={data.acceptTerms}
            onCheckedChange={(checked) => updateData('acceptTerms', checked)}
            className="mt-1"
          />
          <div className="space-y-2">
            <Label>
              Я принимаю{' '}
              <a href="#" className="text-primary hover:underline">
                пользовательское соглашение
              </a>{' '}
              и{' '}
              <a href="#" className="text-primary hover:underline">
                политику конфиденциальности
              </a>
            </Label>
            <p className="text-sm text-muted-foreground">
              Регистрируясь, вы соглашаетесь с условиями использования сервиса 
              и обработкой персональных данных.
            </p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-medium mb-2">Что будет дальше?</h4>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• Создание вашего аккаунта</li>
          <li>• Настройка базовых параметров системы</li>
          <li>• Переход в панель управления</li>
          <li>• Возможность добавить сотрудников и услуги</li>
        </ul>
      </div>
    </div>
  )
}