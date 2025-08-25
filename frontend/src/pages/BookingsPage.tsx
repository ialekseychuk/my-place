import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Calendar } from 'lucide-react'

export function BookingsPage() {
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
            Здесь будет отображаться список всех бронирований
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Страница бронирований в разработке...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}