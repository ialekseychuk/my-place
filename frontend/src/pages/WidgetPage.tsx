import { Widget } from '@/components/Widget'

export function WidgetPage() {
  // In a real implementation, you would get the business ID from URL params or config
  // For now, we'll use a placeholder - in a real app this would come from the widget configuration
  const businessId = 'demo-business-id' // This should be dynamically set

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Widget businessId={businessId} />
      </div>
    </div>
  )
}