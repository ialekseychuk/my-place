import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Save } from 'lucide-react'

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
          <p className="text-muted-foreground">
            Настройка системы и управление конфигурацией
          </p>
        </div>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Сохранить
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Общие настройки
          </CardTitle>
          <CardDescription>
            Здесь будут настройки системы и бизнеса
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Страница настроек в разработке...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}