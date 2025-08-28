import { BookingsManager } from '@/components/booking/BookingsManager'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { Calendar, Plus } from 'lucide-react'

export function BookingsPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Бронирования</h1>
          <p className="text-muted-foreground">
            Управление записями клиентов и бронированиями
          </p>
        </div>
        <Button>
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
            <BookingsManager businessID={user.business_id} />
          ) : (
            <p className="text-muted-foreground">
              Выберите бизнес для просмотра бронирований
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}