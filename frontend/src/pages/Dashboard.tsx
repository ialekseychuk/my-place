import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Calendar, Package, TrendingUp, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function Dashboard() {
  const navigate = useNavigate()
  const stats = [
    {
      title: 'Активный персонал',
      value: '8',
      description: 'сотрудников работают',
      icon: Users,
      trend: '+2 за месяц'
    },
    {
      title: 'Бронирований сегодня',
      value: '23',
      description: 'записей на сегодня',
      icon: Calendar,
      trend: '+12% к вчера'
    },
    {
      title: 'Услуг',
      value: '15',
      description: 'доступных услуг',
      icon: Package,
      trend: '+3 за неделю'
    },
    {
      title: 'Выручка за день',
      value: '₽45,000',
      description: 'доход сегодня',
      icon: TrendingUp,
      trend: '+18% к вчера'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Панель управления</h1>
        <p className="text-muted-foreground">
          Обзор вашего бизнеса и ключевые метрики
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {stat.trend}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
            <CardDescription>
              Часто используемые функции для быстрого доступа
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Создать новое бронирование
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Добавить сотрудника
            </Button>
            <Button className="w-full justify-start" variant="outline"
              onClick={() => navigate('/register')}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Регистрация нового бизнеса (тест)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ближайшие записи</CardTitle>
            <CardDescription>
              Предстоящие бронирования на сегодня
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Мария Иванова</p>
                  <p className="text-sm text-muted-foreground">Стрижка • Анна</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  10:00
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Петр Сидоров</p>
                  <p className="text-sm text-muted-foreground">Бритье • Иван</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  11:30
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Анна Козлова</p>
                  <p className="text-sm text-muted-foreground">Окрашивание • Мария</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  14:00
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}