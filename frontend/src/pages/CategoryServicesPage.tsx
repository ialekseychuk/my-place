import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, LayersIcon } from 'lucide-react'
import { AddServiceForm } from '@/components/service/AddServiceForm'
import { EditServiceForm } from '@/components/service/EditServiceForm'
import { CategorizedServiceList } from '@/components/service/CategorizedServiceList'
import { CategoryForm } from '@/components/service/CategoryForm'
import { useAuth } from '@/contexts/AuthContext'
import { useServiceData } from '@/contexts/ServiceDataContext'
import { serviceService } from '@/services/service'
import type { Service, CreateServiceRequest, UpdateServiceRequest, ServiceCategory, CreateCategoryRequest } from '@/types/service'
import { useToast } from '@/hooks/use-toast'
import { useNotification } from '@/contexts/NotificationContext'

export function CategoryServicesPage() {
  const { user } = useAuth()
  const { 
    categorizedServices, 
    loading, 
    error, 
    refreshServices, 
    refreshCategories,
    refreshServicesWithCategories,
    updateServicesOrder,
    updateCategoriesOrder
  } = useServiceData()
  
  // Service state
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showAddServiceForm, setShowAddServiceForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined)
  
  // Category state
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [updatingCategory, setUpdatingCategory] = useState(false)
  
  const { toast } = useToast()
  const { showConfirm } = useNotification()

  // Service handlers
  const handleCreateService = async (serviceData: CreateServiceRequest) => {
    if (!user?.business_id) return

    try {
      setCreating(true)
      // Add the selected category to the service data
      const dataWithCategory = {
        ...serviceData,
        category_id: selectedCategoryId
      }
      await serviceService.createService(user.business_id, dataWithCategory)
      await refreshServicesWithCategories()
      setShowAddServiceForm(false)
      setSelectedCategoryId(undefined)
      toast({
        title: 'Услуга создана',
        description: 'Услуга успешно создана'
      })
    } catch (err) {
      console.error('Error creating service:', err)
      toast({
        title: 'Ошибка создания',
        description: 'Не удалось создать услугу. Попробуйте позже.',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  const handleEditService = (service: Service) => {
    setEditingService(service)
  }

  const handleUpdateService = async (serviceData: UpdateServiceRequest) => {
    if (!user?.business_id || !editingService) return

    try {
      setUpdating(true)
      await serviceService.updateService(user.business_id, editingService.id, serviceData)
      await refreshServicesWithCategories()
      setEditingService(null)
      toast({
        title: 'Услуга обновлена',
        description: 'Услуга успешно обновлена'
      })
    } catch (err) {
      console.error('Error updating service:', err)
      toast({
        title: 'Ошибка обновления',
        description: 'Не удалось обновить услугу. Попробуйте позже.',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!user?.business_id) return

    // Show confirmation dialog
    const confirmed = await showConfirm({
      title: 'Удалить услугу?',
      description: 'Вы уверены, что хотите удалить эту услугу? Это действие нельзя отменить.',
      variant: 'destructive',
      confirmText: 'Удалить',
      cancelText: 'Отмена'
    })

    if (!confirmed) return

    try {
      await serviceService.deleteService(user.business_id, serviceId)
      await refreshServicesWithCategories()
      toast({
        title: 'Услуга удалена',
        description: 'Услуга успешно удалена',
      })
    } catch (err) {
      console.error('Error deleting service:', err)
      toast({
        title: 'Ошибка удаления',
        description: 'Не удалось удалить услугу. Попробуйте позже.',
        variant: 'destructive',
      })
    }
  }

  // Category handlers
  const handleAddCategory = () => {
    setShowAddCategoryForm(true)
  }

  const handleCreateCategory = async (data: CreateCategoryRequest) => {
    if (!user?.business_id) return

    try {
      setCreatingCategory(true)
      await serviceService.createCategory(user.business_id, data)
      await refreshServicesWithCategories()
      setShowAddCategoryForm(false)
      toast({
        title: 'Категория создана',
        description: 'Категория успешно создана'
      })
    } catch (err) {
      console.error('Error creating category:', err)
      toast({
        title: 'Ошибка создания',
        description: 'Не удалось создать категорию. Попробуйте позже.',
        variant: 'destructive',
      })
      throw err
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleEditCategory = (category: ServiceCategory) => {
    setEditingCategory(category)
  }

  const handleUpdateCategory = async (data: { name: string }) => {
    if (!user?.business_id || !editingCategory) return

    try {
      setUpdatingCategory(true)
      await serviceService.updateCategory(user.business_id, editingCategory.id, { name: data.name })
      await refreshServicesWithCategories()
      setEditingCategory(null)
      toast({
        title: 'Категория обновлена',
        description: 'Категория успешно обновлена'
      })
    } catch (err) {
      console.error('Error updating category:', err)
      toast({
        title: 'Ошибка обновления',
        description: 'Не удалось обновить категорию. Попробуйте позже.',
        variant: 'destructive',
      })
      throw err
    } finally {
      setUpdatingCategory(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!user?.business_id) return

    // Show confirmation dialog
    const confirmed = await showConfirm({
      title: 'Удалить категорию?',
      description: 'Вы уверены, что хотите удалить эту категорию? Все услуги в этой категории будут помечены как "Без категории".',
      variant: 'destructive',
      confirmText: 'Удалить',
      cancelText: 'Отмена'
    })

    if (!confirmed) return

    try {
      await serviceService.deleteCategory(user.business_id, categoryId)
      await refreshServicesWithCategories()
      toast({
        title: 'Категория удалена',
        description: 'Категория успешно удалена',
      })
    } catch (err) {
      console.error('Error deleting category:', err)
      toast({
        title: 'Ошибка удаления',
        description: 'Не удалось удалить категорию. Попробуйте позже.',
        variant: 'destructive',
      })
    }
  }

  const handleAddService = (categoryId?: string) => {
    setSelectedCategoryId(categoryId)
    setShowAddServiceForm(true)
  }

  const handleCategoriesReorder = async (categoryIds: string[]) => {
    if (!user?.business_id) return
    
    try {
      await serviceService.updateCategoriesOrder(user.business_id, categoryIds)
      await refreshServicesWithCategories()
    } catch (err) {
      console.error('Error reordering categories:', err)
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить порядок категорий',
        variant: 'destructive',
      })
    }
  }

  const handleServicesReorder = async (serviceIds: string[], categoryId?: string) => {
    if (!user?.business_id) return
    
    try {
      await serviceService.updateServicesOrder(user.business_id, serviceIds)
      await refreshServicesWithCategories()
    } catch (err) {
      console.error('Error reordering services:', err)
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить порядок услуг',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Услуги по категориям</h1>
          <p className="text-muted-foreground">
            Управление категориями и услугами
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowAddServiceForm(true)} disabled={showAddServiceForm}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить услугу
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Categorized Services List */}
      {categorizedServices && (
        <CategorizedServiceList
          data={categorizedServices}
          loading={loading}
          onEditService={handleEditService}
          onDeleteService={handleDeleteService}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
          onAddService={handleAddService}
          onAddCategory={handleAddCategory}
          onCategoriesReorder={handleCategoriesReorder}
          onServicesReorder={handleServicesReorder}
        />
      )}

      {/* Add Service Dialog */}
      <Dialog open={showAddServiceForm} onOpenChange={setShowAddServiceForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AddServiceForm
            onSubmit={handleCreateService}
            loading={creating}
            onCancel={() => setShowAddServiceForm(false)}
            initialCategoryId={selectedCategoryId}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {editingService && (
            <EditServiceForm
              service={editingService}
              onSubmit={handleUpdateService}
              loading={updating}
              onCancel={() => setEditingService(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategoryForm} onOpenChange={setShowAddCategoryForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Добавить категорию</DialogTitle>
            <DialogDescription>Введите название новой категории услуг</DialogDescription>
          </DialogHeader>
          <CategoryForm
            onSubmit={handleCreateCategory}
            loading={creatingCategory}
            onCancel={() => setShowAddCategoryForm(false)}
            title=""
            submitText="Добавить"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={setEditingCategory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать категорию</DialogTitle>
            <DialogDescription>Измените название категории услуг</DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              category={editingCategory}
              onSubmit={handleUpdateCategory}
              loading={updatingCategory}
              onCancel={() => setEditingCategory(null)}
              title=""
              submitText="Сохранить"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}