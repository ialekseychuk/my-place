import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LayersIcon } from 'lucide-react';
import type { ServiceCategory, CreateCategoryRequest } from '@/types/service';

interface CategoryFormProps {
  category?: ServiceCategory;
  onSubmit: (data: CreateCategoryRequest) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
  title?: string;
  submitText?: string;
}

export function CategoryForm({
  category,
  onSubmit,
  loading = false,
  onCancel,
  title = 'Категория услуг',
  submitText = 'Сохранить',
}: CategoryFormProps) {
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: category?.name || '',
  });
  const [error, setError] = useState<string>('');

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Название категории обязательно');
      return false;
    }
    if (formData.name.length < 3) {
      setError('Название должно содержать минимум 3 символа');
      return false;
    }
    if (formData.name.length > 100) {
      setError('Максимальная длина - 100 символов');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting category:', error);
      setError('Не удалось сохранить категорию. Попробуйте снова.');
    }
  };

  return (
    <div className="p-6">
      {title && (
        <div className="mb-6 flex items-center">
          <LayersIcon className="mr-2 h-6 w-6" />
          <h2 className="text-2xl font-semibold">{title}</h2>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="category-name">Название категории</Label>
          <Input
            id="category-name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (error) setError('');
            }}
            placeholder="Например: Маникюр, Стрижки, Окрашивание"
            disabled={loading}
            className={error ? 'border-red-500' : ''}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Отмена
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Сохранение...' : submitText}
          </Button>
        </div>
      </form>
    </div>
  );
}