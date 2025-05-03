import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import NotFound from './pages/NotFound'
import RadId from './pages/RadId'
import IndexWrapper from './pages/IndexWrapper'
import DoctorCases from './pages/DoctorCases'
import SupervisorLogin from './pages/SupervisorLogin'
import SupervisorDashboard from './pages/SupervisorDashboard'

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RadId />} />
          <Route path="/doctor/:doctorId" element={<DoctorCases />} />
          <Route path="/rad/:radId" element={<IndexWrapper />} />
          
          {/* Supervisor routes */}
          <Route path="/supervisor" element={<SupervisorLogin />} />
          <Route path="/supervisor/dashboard/:supervisorId" element={<SupervisorDashboard />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
