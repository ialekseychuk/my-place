import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Plus } from 'lucide-react'
import type { CreateServiceRequest } from '@/types/service'

interface AddServiceFormProps {
  onSubmit: (data: CreateServiceRequest) => Promise<void>
  loading?: boolean
}

export function AddServiceForm({ onSubmit, loading = false }: AddServiceFormProps) {
  const [formData, setFormData] = useState<CreateServiceRequest>({
    name: '',
    duration_min: 0,
    price_cents: 0,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Helper functions for price formatting
  const formatPrice = (cents: number): string => {
    return (cents / 100).toFixed(2)
  }

  const parsePrice = (value: string): number => {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : Math.round(parsed * 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Basic validation
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Название услуги обязательно'
    } else if (formData.name.length < 3) {
      newErrors.name = 'Название должно содержать минимум 3 символа'
    }

    if (formData.duration_min <= 0) {
      newErrors.duration_min = 'Продолжительность должна быть больше 0'
    }

    if (formData.price_cents <= 0) {
      newErrors.price_cents = 'Цена должна быть больше 0'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await onSubmit(formData)
      // Reset form on success
      setFormData({
        name: '',
        duration_min: 0,
        price_cents: 0,
      })
    } catch (error) {
      console.error('Error creating service:', error)
    }
  }

  const handleInputChange = (field: keyof CreateServiceRequest) => (
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
    } else if (field === 'price_cents') {
      const priceInCents = parsePrice(value)
      setFormData(prev => ({
        ...prev,
        [field]: priceInCents
      }))
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Добавить услугу
        </CardTitle>
        <CardDescription>
          Заполните информацию о новой услуге
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название услуги *</Label>
            <Input
              id="name"
              value={formData.name}
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
                value={formatPrice(formData.price_cents)}
                onChange={handleInputChange('price_cents')}
                placeholder="1500.00"
                disabled={loading}
              />
              {errors.price_cents && (
                <div className="text-sm text-red-600">{errors.price_cents}</div>
              )}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>* - обязательные поля</p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Добавление...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Добавить услугу
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}