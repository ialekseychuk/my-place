import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Calendar } from 'lucide-react'

export function SchedulePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Расписание</h1>
          <p className="text-muted-foreground">
            Управление рабочими сменами и расписанием сотрудников
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Добавить смену
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Календарь расписания
          </CardTitle>
          <CardDescription>
            Здесь будет отображаться календарь с расписанием работы
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Страница расписания в разработке...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}