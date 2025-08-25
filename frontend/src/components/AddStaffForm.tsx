import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Plus } from 'lucide-react'
import type { CreateStaffRequest } from '@/types/staff'

interface AddStaffFormProps {
  onSubmit: (data: CreateStaffRequest) => Promise<void>
  loading?: boolean
}

export function AddStaffForm({ onSubmit, loading = false }: AddStaffFormProps) {
  const [formData, setFormData] = useState<CreateStaffRequest>({
    first_name: '',
    last_name: '',
    phone: '',
    gender: undefined,
    position: '',
    description: '',
    specialization: '',
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

    if (formData.phone && (formData.phone.length < 10 || formData.phone.length > 20)) {
      newErrors.phone = 'Телефон должен содержать от 10 до 20 символов'
    }

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

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      gender: value as CreateStaffRequest['gender']
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
              <Input
                id="phone"
                value={formData.phone}
                onChange={handleInputChange('phone')}
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
              <Select value={formData.gender || ''} onValueChange={handleSelectChange} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите пол" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Мужской</SelectItem>
                  <SelectItem value="female">Женский</SelectItem>
                  <SelectItem value="other">Другой</SelectItem>
                  <SelectItem value="prefer_not_to_say">Предпочитаю не указывать</SelectItem>
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