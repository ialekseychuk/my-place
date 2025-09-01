import { Widget } from '@/components/Widget'

export function WidgetPage() {
  // Using the business ID you provided
  const businessId = '8bdb031d-e6ca-45de-5d17-5afbe57b5975'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Widget businessId={businessId} />
      </div>
    </div>
  )
}