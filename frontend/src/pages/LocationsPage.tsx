import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from '@/contexts/LocationContext'
import { useDialog } from '@/hooks/use-dialog'
import { useToast } from '@/hooks/use-toast'
import type { Location, LocationRequest } from '@/types/location'
import { Edit, Plus, Trash2, RefreshCw } from 'lucide-react'
import React, { useState } from 'react'

export const LocationsPage: React.FC = () => {
  const { locations, currentLocation, setCurrentLocation, fetchLocations, createLocation, updateLocation, deleteLocation, isLoading, error, clearLocationCache } = useLocation()
  const { user } = useAuth()
  const { showConfirmDialog } = useDialog()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState<Omit<LocationRequest, 'business_id'>>({
    name: '',
    address: '',
    city: '',
    contact_info: '',
    timezone: 'UTC'
  })

  // Fetch locations when user is available
  React.useEffect(() => {
    let isMounted = true;
    
    if (user?.business_id) {
      fetchLocations(user.business_id, { forceRefresh: true })
    }
    
    return () => {
      isMounted = false;
    };
  }, [user?.business_id])

  const handleCreateLocation = () => {
    setEditingLocation(null)
    setFormData({
      name: '',
      address: '',
      city: '',
      contact_info: '',
      timezone: 'UTC'
    })
    setIsDialogOpen(true)
  }

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      contact_info: location.contact_info,
      timezone: location.timezone
    })
    setIsDialogOpen(true)
  }

  const handleDeleteLocation = async (locationId: string) => {
    if (!user?.business_id) return
    
    const confirmed = await showConfirmDialog({
      title: 'Подтверждение удаления',
      description: 'Вы уверены, что хотите удалить эту локацию? Это действие нельзя отменить.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'destructive'
    })
    
    if (confirmed) {
      try {
        await deleteLocation(user.business_id, locationId)
        toast({
          title: 'Успех',
          description: 'Локация успешно удалена'
        })
      } catch (err) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось удалить локацию',
          variant: 'destructive'
        })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.business_id) return

    try {
      if (editingLocation) {
        // Update existing location
        await updateLocation(user.business_id, editingLocation.id, formData)
        toast({
          title: 'Успех',
          description: 'Локация успешно обновлена'
        })
      } else {
        // Create new location
        await createLocation(user.business_id, formData)
        toast({
          title: 'Успех',
          description: 'Локация успешно создана'
        })
      }
      setIsDialogOpen(false)
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить локацию',
        variant: 'destructive'
      })
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSetCurrentLocation = (location: Location) => {
    setCurrentLocation(location)
  }

  const handleRefresh = () => {
    if (user?.business_id) {
      clearLocationCache(user.business_id);
      fetchLocations(user.business_id, { forceRefresh: true });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Локации</h1>
          <p className="text-muted-foreground">
            Управление локациями вашего бизнеса
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Обновить
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateLocation}>
                <Plus className="w-4 h-4 mr-2" />
                Добавить локацию
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingLocation ? 'Редактировать локацию' : 'Создать локацию'}</DialogTitle>
                <DialogDescription>
                  {editingLocation 
                    ? 'Внесите изменения в локацию' 
                    : 'Добавьте новую локацию для вашего бизнеса'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Название
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">
                      Адрес
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="city" className="text-right">
                      Город
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contact_info" className="text-right">
                      Контакт
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="contact_info"
                        value={formData.contact_info}
                        onChange={(e) => handleInputChange('contact_info', e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="timezone" className="text-right">
                      Часовой пояс
                    </Label>
                    <div className="col-span-3">
                      <Select 
                        value={formData.timezone} 
                        onValueChange={(value) => handleInputChange('timezone', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Выберите часовой пояс" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="Europe/Moscow">Europe/Moscow</SelectItem>
                          <SelectItem value="America/New_York">America/New_York</SelectItem>
                          <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingLocation ? 'Обновить локацию' : 'Создать локацию'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Card 
              key={location.id} 
              className={`relative ${currentLocation?.id === location.id ? 'border-primary' : ''}`}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{location.name}</span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditLocation(location)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteLocation(location.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  {location.city}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>{location.address}</p>
                  {location.contact_info && (
                    <p>Контакт: {location.contact_info}</p>
                  )}
                  <p>Часовой пояс: {location.timezone}</p>
                </div>
                <Button
                  variant={currentLocation?.id === location.id ? "default" : "outline"}
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => handleSetCurrentLocation(location)}
                >
                  {currentLocation?.id === location.id ? 'Текущая локация' : 'Сделать текущей'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}