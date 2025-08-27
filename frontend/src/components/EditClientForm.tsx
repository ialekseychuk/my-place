import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save } from 'lucide-react'
import type { Client, UpdateClientRequest } from '@/types/client'

interface EditClientFormProps {
  client: Client
  onSubmit: (data: UpdateClientRequest) => Promise<void>
  loading?: boolean
  onCancel: () => void
}

export function EditClientForm({ client, onSubmit, loading = false, onCancel }: EditClientFormProps) {
  const [formData, setFormData] = useState<UpdateClientRequest>({
    first_name: client.first_name,
    last_name: client.last_name,
    email: client.email,
    phone: client.phone,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update form data when client prop changes
  useEffect(() => {
    setFormData({
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      phone: client.phone,
    })
  }, [client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Basic validation
    const newErrors: Record<string, string> = {}
    
    if (!formData.first_name?.trim()) {
      newErrors.first_name = 'Имя обязательно'
    } else if (formData.first_name.length < 2) {
      newErrors.first_name = 'Имя должно содержать минимум 2 символа'
    }

    if (!formData.last_name?.trim()) {
      newErrors.last_name = 'Фамилия обязательна'
    } else if (formData.last_name.length < 2) {
      newErrors.last_name = 'Фамилия должна содержать минимум 2 символа'
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email обязателен'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Некорректный формат email'
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Телефон обязателен'
    } else if (formData.phone.length < 10 || formData.phone.length > 20) {
      newErrors.phone = 'Телефон должен содержать от 10 до 20 символов'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Error updating client:', error)
    }
  }

  const handleInputChange = (field: keyof UpdateClientRequest) => (
    e: React.ChangeEvent<HTMLInputElement>
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

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          Редактировать клиента
        </CardTitle>
        <CardDescription>
          Измените информацию о клиенте
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Имя *</Label>
              <Input
                id="first_name"
                value={formData.first_name || ''}
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
                value={formData.last_name || ''}
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
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={handleInputChange('email')}
                placeholder="example@email.com"
                disabled={loading}
              />
              {errors.email && (
                <div className="text-sm text-red-600">{errors.email}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон *</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={handleInputChange('phone')}
                placeholder="+7 (999) 123-45-67"
                disabled={loading}
              />
              {errors.phone && (
                <div className="text-sm text-red-600">{errors.phone}</div>
              )}
            </div>
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