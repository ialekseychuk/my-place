import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLocation } from '@/contexts/LocationContext'
import type {
  BusinessServicesResponse,
  Service,
  ServiceCategory
} from '@/types/service'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Edit,
  Grip,
  LayersIcon,
  MapPin,
  Package,
  Plus,
  Trash2
} from 'lucide-react'
import { useState } from 'react'

interface CategorizedServiceListProps {
  data: BusinessServicesResponse
  loading?: boolean
  onEditService?: (service: Service) => void
  onDeleteService?: (serviceId: string) => void
  onEditCategory?: (category: ServiceCategory) => void
  onDeleteCategory?: (categoryId: string) => void
  onAddService?: (categoryId?: string) => void
  onAddCategory?: () => void
  onCategoriesReorder?: (categoryIds: string[]) => Promise<void>
  onServicesReorder?: (serviceIds: string[], categoryId?: string) => Promise<void>
}

export function CategorizedServiceList({ 
  data, 
  loading = false, 
  onEditService, 
  onDeleteService,
  onEditCategory,
  onDeleteCategory,
  onAddService,
  onAddCategory,
  onCategoriesReorder,
  onServicesReorder,
}: CategorizedServiceListProps) {
  const { locations } = useLocation()
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  // Check if a category is expanded
  const isCategoryExpanded = (categoryId: string) => {
    return expandedCategories[categoryId] !== false // Default to expanded
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/5"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data.categories?.length && !data.uncategorized_services?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Нет услуг</h3>
          <p className="text-muted-foreground text-center">
            Добавьте первую услугу, чтобы клиенты могли записываться
          </p>
          {onAddService && (
            <Button className="mt-4" onClick={() => onAddService()}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить услугу
            </Button>
          )}
          {onAddCategory && (
            <Button variant="outline" className="mt-2" onClick={onAddCategory}>
              <LayersIcon className="mr-2 h-4 w-4" />
              Добавить категорию
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  const formatPrice = (cents: number): string => {
    return (cents / 100).toFixed(2)
  }

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} мин`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return `${hours} ч`
    }
    return `${hours} ч ${remainingMinutes} мин`
  }

  const getLocationName = (locationId?: string): string => {
    if (!locationId) return 'Не указана'
    const location = locations.find(loc => loc.id === locationId)
    return location ? location.name : 'Не найдена'
  }

  const handleDragEnd = (result: any) => {
    const { source, destination, type } = result

    // Dropped outside the list
    if (!destination) {
      return
    }

    // If the item didn't change position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return
    }

    if (type === 'CATEGORY') {
      // Handle category reordering
      const newCategoryOrder = Array.from(data.categories)
      const [removed] = newCategoryOrder.splice(source.index, 1)
      newCategoryOrder.splice(destination.index, 0, removed)

      // Update backend
      if (onCategoriesReorder) {
        onCategoriesReorder(newCategoryOrder.map(cat => cat.id))
      }
    } else {
      // Handle service reordering
      const sourceId = source.droppableId
      const destId = destination.droppableId

      // Reordering within the same category
      if (sourceId === destId) {
        let services: Service[] = []
        
        if (sourceId === 'uncategorized') {
          services = [...(data.uncategorized_services || [])]
        } else {
          const categoryIndex = data.categories.findIndex(cat => cat.id === sourceId)
          if (categoryIndex >= 0) {
            services = [...data.categories[categoryIndex].services]
          }
        }

        if (services.length) {
          // Reorder services
          const [removed] = services.splice(source.index, 1)
          services.splice(destination.index, 0, removed)

          // Update backend
          if (onServicesReorder) {
            const categoryId = sourceId === 'uncategorized' ? undefined : sourceId
            onServicesReorder(services.map(service => service.id), categoryId)
          }
        }
      }
      // Moving between categories is handled by the edit service function
      // which allows explicitly setting the category_id
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        {/* Add category button */}
        {onAddCategory && (
          <div className="mb-4 flex justify-end">
            <Button variant="outline" onClick={onAddCategory}>
              <LayersIcon className="mr-2 h-4 w-4" />
              Добавить категорию
            </Button>
          </div>
        )}

        {/* Categories */}
        <Droppable droppableId="categories" type="CATEGORY">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-4"
            >
              {data.categories.map((category, index) => (
                <Draggable
                  key={category.id}
                  draggableId={category.id}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <Card className="transition-shadow hover:shadow-md">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center">
                              <div {...provided.dragHandleProps} className="mr-2 cursor-grab">
                                <Grip className="h-5 w-5 text-gray-400" />
                              </div>
                              <div className="flex flex-col">
                                <CardTitle className="text-lg flex items-center">
                                  <span>{category.name}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="ml-2 h-6 w-6 p-0"
                                    onClick={() => toggleCategory(category.id)}
                                  >
                                    {isCategoryExpanded(category.id) ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                </CardTitle>
                                <span className="text-sm text-muted-foreground">
                                  Содержит услуг: {category.services.length}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {onAddService && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onAddService(category.id)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )}
                              {onEditCategory && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onEditCategory(category)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {onDeleteCategory && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onDeleteCategory(category.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        
                        {/* Category services */}
                        {isCategoryExpanded(category.id) && (
                          <CardContent>
                            <Droppable 
                              droppableId={category.id} 
                              type="SERVICE"
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className="space-y-3"
                                >
                                  {category.services.length > 0 ? (
                                    category.services.map((service, index) => (
                                      <Draggable
                                        key={service.id}
                                        draggableId={service.id}
                                        index={index}
                                      >
                                        {(provided) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className="border rounded-md p-3 transition-shadow hover:shadow-sm"
                                          >
                                            <div className="flex items-start justify-between">
                                              <div className="flex items-center">
                                                <div {...provided.dragHandleProps} className="mr-2 cursor-grab">
                                                  <Grip className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <div>
                                                  <h3 className="font-medium">{service.name}</h3>
                                                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                                                    <Clock className="mr-1 h-3 w-3" />
                                                    <span>{formatDuration(service.duration_min)}</span>
                                                    <span className="mx-2">•</span>
                                                    <span>{formatPrice(service.price_cents)} ₽</span>
                                                  </div>
                                                  {service.location_id && (
                                                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                                                      <MapPin className="mr-1 h-3 w-3" />
                                                      <span>{getLocationName(service.location_id)}</span>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                {onEditService && (
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => onEditService(service)}
                                                  >
                                                    <Edit className="h-3 w-3" />
                                                  </Button>
                                                )}
                                                {onDeleteService && (
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => onDeleteService(service.id)}
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))
                                  ) : (
                                    <div className="text-center p-4 text-muted-foreground">
                                      Нет услуг в этой категории
                                    </div>
                                  )}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </CardContent>
                        )}
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {/* Uncategorized services */}
        {data.uncategorized_services && data.uncategorized_services.length > 0 && (
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <CardTitle className="text-lg">Услуги без категории</CardTitle>
                  <span className="text-sm text-muted-foreground">
                    Содержит услуг: {data.uncategorized_services.length}
                  </span>
                </div>
                {onAddService && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddService()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Droppable droppableId="uncategorized" type="SERVICE">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-3"
                  >
                    {data.uncategorized_services.map((service, index) => (
                      <Draggable
                        key={service.id}
                        draggableId={service.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="border rounded-md p-3 transition-shadow hover:shadow-sm"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center">
                                <div {...provided.dragHandleProps} className="mr-2 cursor-grab">
                                  <Grip className="h-4 w-4 text-gray-400" />
                                </div>
                                <div>
                                  <h3 className="font-medium">{service.name}</h3>
                                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                                    <Clock className="mr-1 h-3 w-3" />
                                    <span>{formatDuration(service.duration_min)}</span>
                                    <span className="mx-2">•</span>
                                    <span>{formatPrice(service.price_cents)} ₽</span>
                                  </div>
                                  {service.location_id && (
                                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                                      <MapPin className="mr-1 h-3 w-3" />
                                      <span>{getLocationName(service.location_id)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {onEditService && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => onEditService(service)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                                {onDeleteService && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => onDeleteService(service.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </CardContent>
          </Card>
        )}
      </div>
    </DragDropContext>
  )
}