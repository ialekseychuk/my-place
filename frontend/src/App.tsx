import { BusinessRegistration } from '@/components/BusinessRegistration'
import { DialogProvider } from '@/components/DialogProvider'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Toaster } from '@/components/Toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import { LocationProvider } from '@/contexts/LocationContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ServiceDataProvider } from '@/contexts/ServiceDataContext'
import { StaffDataProvider } from '@/contexts/StaffDataContext'
import { useDialog } from '@/hooks/use-dialog'
import { BookingsPage } from '@/pages/BookingsPage'
import { ClientsPage } from '@/pages/ClientsPage'
import { Dashboard } from '@/pages/Dashboard'
import { LocationsPage } from '@/pages/LocationsPage'
import { LoginPage } from '@/pages/LoginPage'
import { SchedulePage } from '@/pages/SchedulePage'
import { ServicesPage } from '@/pages/ServicesPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { StaffPage } from '@/pages/StaffPage'
import { StaffServicePage } from '@/pages/StaffServicePage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  const dialogState = useDialog()

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StaffDataProvider>
          <ServiceDataProvider>
            <LocationProvider>
              <DialogProvider dialogState={dialogState}>
                <NotificationProvider dialogState={dialogState}>
                  <Router>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<BusinessRegistration />} />
                      
                      {/* Protected routes (with layout) */}
                      <Route path="/" element={
                        <ProtectedRoute>
                          <Layout />
                        </ProtectedRoute>
                      }>
                        <Route index element={<Dashboard />} />
                        <Route path="locations" element={<LocationsPage />} />
                        <Route path="staff" element={<StaffPage />} />
                        <Route path="staff-services" element={<StaffServicePage />} />
                        <Route path="services" element={<ServicesPage />} />
                        <Route path="schedule" element={<SchedulePage />} />
                        <Route path="bookings" element={<BookingsPage />} />
                        <Route path="clients" element={<ClientsPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                      </Route>
                    </Routes>
                  </Router>
                  <Toaster />
                </NotificationProvider>
              </DialogProvider>
            </LocationProvider>
          </ServiceDataProvider>
        </StaffDataProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App