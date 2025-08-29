import { BookingCreationDialog } from '@/components/booking/BookingCreationDialog'
import { BookingsManager } from '@/components/booking/BookingsManager'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from '@/contexts/LocationContext'
import { Calendar, Plus } from 'lucide-react'
import { useState } from 'react'

export function BookingsPage() {
  const { user } = useAuth()
  const { currentLocation } = useLocation()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [key, setKey] = useState(0) // Used to force refresh the bookings manager

  const handleBookingCreated = () => {
    // Increment key to force refresh the bookings manager
    setKey(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Бронирования</h1>
          <p className="text-muted-foreground">
            Управление записями клиентов и бронированиями
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Новое бронирование
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Список бронирований
          </CardTitle>
          <CardDescription>
            Здесь отображаются все бронирования вашего бизнеса
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user?.business_id ? (
            <BookingsManager key={key} businessID={user.business_id} />
          ) : (
            <p className="text-muted-foreground">
              Выберите бизнес для просмотра бронирований
            </p>
          )}
        </CardContent>
      </Card>

      {user?.business_id && (
        <BookingCreationDialog
          businessID={user.business_id}
          locationID={currentLocation?.id}
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={handleBookingCreated}
        />
      )}
    </div>
  )
}