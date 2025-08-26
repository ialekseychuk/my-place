import { BusinessRegistration } from '@/components/BusinessRegistration'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthProvider } from '@/contexts/AuthContext'
import { BookingsPage } from '@/pages/BookingsPage'
import { Dashboard } from '@/pages/Dashboard'
import { LoginPage } from '@/pages/LoginPage'
import { SchedulePage } from '@/pages/SchedulePage'
import { ServicesPage } from '@/pages/ServicesPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { StaffServicePage } from '@/pages/StaffServicePage'
import { StaffPage } from '@/pages/StaffPage'
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
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
              <Route path="staff" element={<StaffPage />} />
              <Route path="staff-services" element={<StaffServicePage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="bookings" element={<BookingsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
