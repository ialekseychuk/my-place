import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLocation } from '@/contexts/LocationContext'
import type { Service, UpdateServiceRequest } from '@/types/service'
import { Loader2, Save } from 'lucide-react'
import React, { useEffect, useState } from 'react'

// Extended type for form state to include price input value
interface FormState extends UpdateServiceRequest {
  priceInputValue?: string
}

interface EditServiceFormProps {
  service: Service
  onSubmit: (data: UpdateServiceRequest) => Promise<void>
  loading?: boolean
  onCancel: () => void
}

export function EditServiceForm({ service, onSubmit, loading = false, onCancel }: EditServiceFormProps) {
  const { locations } = useLocation()
  const [formData, setFormData] = useState<FormState>({
    name: service.name,
    duration_min: service.duration_min,
    price_cents: service.price_cents,
    location_id: service.location_id,
    category_id: service.category_id,
    priceInputValue: (service.price_cents / 100).toFixed(2)
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update form data when service prop changes
  useEffect(() => {
    setFormData({
      name: service.name,
      duration_min: service.duration_min,
      price_cents: service.price_cents,
      location_id: service.location_id,
      category_id: service.category_id,
      priceInputValue: (service.price_cents / 100).toFixed(2)
    })
  }, [service])

  const parsePrice = (value: string): number => {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : Math.round(parsed * 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Parse the price from the input value
    const priceCents = parsePrice(formData.priceInputValue || '0')
    
    // Basic validation
    const newErrors: Record<string, string> = {}
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Название услуги обязательно'
    } else if (formData.name.length < 3) {
      newErrors.name = 'Название должно содержать минимум 3 символа'
    }

    if (formData.duration_min !== undefined && formData.duration_min <= 0) {
      newErrors.duration_min = 'Продолжительность должна быть больше 0'
    }

    if (priceCents <= 0) {
      newErrors.price_cents = 'Цена должна быть больше 0'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await onSubmit({
        name: formData.name,
        duration_min: formData.duration_min,
        price_cents: priceCents,
        location_id: formData.location_id,
        category_id: formData.category_id
      })
    } catch (error) {
      console.error('Error updating service:', error)
    }
  }

  const handleInputChange = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
    
    if (field === 'name') {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    } else if (field === 'duration_min') {
      const numValue = parseInt(value, 10)
      setFormData(prev => ({
        ...prev,
        [field]: isNaN(numValue) ? 0 : numValue
      }))
    } else if (field === 'priceInputValue') {
      // For price input, we store the raw value as string
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }

    // Clear error when user starts typing
    if (errors[field as keyof UpdateServiceRequest]) {
      setErrors(prev => ({ ...prev, [field as keyof UpdateServiceRequest]: '' }))
    }
  }

  const handleSelectChange = (field: keyof FormState, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || undefined
    }))
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          Редактировать услугу
        </CardTitle>
        <CardDescription>
          Измените информацию об услуге
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название услуги *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={handleInputChange('name')}
              placeholder="Например: Маникюр с покрытием"
              disabled={loading}
            />
            {errors.name && (
              <div className="text-sm text-red-600">{errors.name}</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration_min">Продолжительность (минуты) *</Label>
              <Input
                id="duration_min"
                type="number"
                min="1"
                value={formData.duration_min || ''}
                onChange={handleInputChange('duration_min')}
                placeholder="60"
                disabled={loading}
              />
              {errors.duration_min && (
                <div className="text-sm text-red-600">{errors.duration_min}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Цена (руб.) *</Label>
              <Input
                id="price"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.priceInputValue || ''}
                onChange={handleInputChange('priceInputValue')}
                placeholder="1500.00"
                disabled={loading}
              />
              {errors.price_cents && (
                <div className="text-sm text-red-600">{errors.price_cents}</div>
              )}
            </div>
          </div>

          {locations.length > 0 && (
            <div className="space-y-2">
              <Label>Локация</Label>
              <Select 
                value={formData.location_id || ''} 
                onValueChange={(value) => handleSelectChange('location_id', value)} 
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите локацию" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>* - обязательные поля</p>
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Сохранить изменения
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}