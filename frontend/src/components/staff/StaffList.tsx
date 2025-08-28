import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLocation } from '@/contexts/LocationContext'
import type { Staff } from '@/types/staff'
import { Edit, MapPin, Phone, Trash2, Users } from 'lucide-react'

interface StaffListProps {
  staff: Staff[] | null
  loading?: boolean
  onEdit?: (staff: Staff) => void
  onDelete?: (staffId: string) => void
}

export function StaffList({ staff, loading = false, onEdit, onDelete }: StaffListProps) {
  const { locations } = useLocation()
  // Create a safe array to prevent null reference errors
  const safeStaff = Array.isArray(staff) ? staff : [];

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (safeStaff.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Нет сотрудников</h3>
          <p className="text-muted-foreground text-center">
            Добавьте первого сотрудника, чтобы начать работу
          </p>
        </CardContent>
      </Card>
    )
  }

  const getGenderLabel = (gender?: string): string => {
    switch (gender) {
      case 'male': return 'Мужской'
      case 'female': return 'Женский'
      case 'other': return 'Другой'
      case 'prefer_not_to_say': return 'Не указано'
      default: return 'Не указано'
    }
  }

  const getLocationName = (locationId?: string): string => {
    if (!locationId) return 'Не указана'
    const location = locations.find(loc => loc.id === locationId)
    return location ? location.name : 'Не найдена'
  }

  return (
    <div className="space-y-4">
      {safeStaff.map((member) => (
        <Card key={member.id} className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{member.full_name}</CardTitle>
                <p className="text-sm text-muted-foreground">{member.position}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={member.is_active ? "default" : "secondary"}>
                  {member.is_active ? 'Активен' : 'Неактивен'}
                </Badge>
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(member)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {member.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{member.phone}</span>
                </div>
              )}
              
              {member.gender && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{getGenderLabel(member.gender)}</span>
                </div>
              )}

              {member.location_id && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{getLocationName(member.location_id)}</span>
                </div>
              )}

              {member.specialization && (
                <div className="text-sm">
                  <span className="font-medium">Специализация: </span>
                  <span className="text-muted-foreground">{member.specialization}</span>
                </div>
              )}

              {member.description && (
                <div className="text-sm">
                  <span className="font-medium">Описание: </span>
                  <span className="text-muted-foreground">{member.description}</span>
                </div>
              )}

              <div className="text-xs text-muted-foreground pt-2">
                Добавлен: {new Date(member.created_at).toLocaleDateString('ru-RU')}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}