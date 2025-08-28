import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PhoneInput } from '@/components/ui/phone-input'
import { useLocation } from '@/contexts/LocationContext'
import type { CreateStaffRequest } from '@/types/staff'
import { Loader2, Plus } from 'lucide-react'
import React, { useState } from 'react'

interface AddStaffFormProps {
  onSubmit: (data: CreateStaffRequest) => Promise<void>
  loading?: boolean
}

export function AddStaffForm({ onSubmit, loading = false }: AddStaffFormProps) {
  const { locations, currentLocation } = useLocation()
  const [formData, setFormData] = useState<CreateStaffRequest>({
    first_name: '',
    last_name: '',
    phone: '',
    gender: undefined,
    position: '',
    description: '',
    specialization: '',
    location_id: currentLocation?.id
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Basic validation
    const newErrors: Record<string, string> = {}
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Имя обязательно'
    } else if (formData.first_name.length < 2) {
      newErrors.first_name = 'Имя должно содержать минимум 2 символа'
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Фамилия обязательна'
    } else if (formData.last_name.length < 2) {
      newErrors.last_name = 'Фамилия должна содержать минимум 2 символа'
    }

    if (!formData.position.trim()) {
      newErrors.position = 'Должность обязательна'
    } else if (formData.position.length < 2) {
      newErrors.position = 'Должность должна содержать минимум 2 символа'
    }

    // Phone validation is handled by the PhoneInput component

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await onSubmit(formData)
      // Reset form on success
      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        gender: undefined,
        position: '',
        description: '',
        specialization: '',
        location_id: currentLocation?.id
      })
    } catch (error) {
      console.error('Error creating staff:', error)
    }
  }

  const handleInputChange = (field: keyof CreateStaffRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSelectChange = (field: keyof CreateStaffRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value as any
    }))
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Добавить сотрудника
        </CardTitle>
        <CardDescription>
          Заполните информацию о новом сотруднике
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Имя *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={handleInputChange('first_name')}
                placeholder="Введите имя"
                disabled={loading}
              />
              {errors.first_name && (
                <div className="text-sm text-red-600">{errors.first_name}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Фамилия *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={handleInputChange('last_name')}
                placeholder="Введите фамилию"
                disabled={loading}
              />
              {errors.last_name && (
                <div className="text-sm text-red-600">{errors.last_name}</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Должность *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={handleInputChange('position')}
                placeholder="Например: Мастер маникюра"
                disabled={loading}
              />
              {errors.position && (
                <div className="text-sm text-red-600">{errors.position}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <PhoneInput
                id="phone"
                value={formData.phone}
                onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                placeholder="+7 (999) 123-45-67"
                disabled={loading}
              />
              {errors.phone && (
                <div className="text-sm text-red-600">{errors.phone}</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Пол</Label>
              <Select 
                value={formData.gender || ''} 
                onValueChange={(value) => handleSelectChange('gender', value)} 
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите пол" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Мужской</SelectItem>
                  <SelectItem value="female">Женский</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Специализация</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={handleInputChange('specialization')}
                placeholder="Например: Наращивание ресниц"
                disabled={loading}
              />
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

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={handleInputChange('description')}
              placeholder="Дополнительная информация о сотруднике"
              rows={3}
              disabled={loading}
            />
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
                Добавить сотрудника
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}