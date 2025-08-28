import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import {
    Calendar,
    Home,
    Link2,
    LogOut,
    MapPin,
    Menu,
    Package,
    Settings,
    User,
    Users,
    X
} from 'lucide-react'
import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LocationSelector } from '@/components/LocationSelector'

const navigation = [
  { name: 'Панель управления', href: '/', icon: Home },
  { name: 'Локации', href: '/locations', icon: MapPin },
  { name: 'Персонал', href: '/staff', icon: Users },
  { name: 'Услуги персонала', href: '/staff-services', icon: Link2 },
  { name: 'Услуги', href: '/services', icon: Package },
  { name: 'Расписание', href: '/schedule', icon: Calendar },
  { name: 'Бронирования', href: '/bookings', icon: Calendar },
  { name: 'Клиенты', href: '/clients', icon: User },
  { name: 'Настройки', href: '/settings', icon: Settings },
]

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transition duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">MP</span>
            </div>
            <span className="font-semibold text-lg">MyPlace</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="mt-6 px-3">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <li key={item.name}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive && "bg-secondary"
                    )}
                    onClick={() => {
                      navigate(item.href)
                      setSidebarOpen(false)
                    }}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </Button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-card border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-4">
              <LocationSelector />
              <div className="text-sm text-muted-foreground">
                Добро пожаловать, {user?.email || 'Пользователь'}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Выйти</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}