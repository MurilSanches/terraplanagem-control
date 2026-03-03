import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import DailyPage from './pages/DailyPage';
import AbsencesPage from './pages/AbsencesPage';
import EquipmentPage from './pages/EquipmentPage';
import DriversPage from './pages/DriversPage';
import WorkSitesPage from './pages/WorkSitesPage';
import ReportsPage from './pages/ReportsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/daily" replace />} />
              <Route path="/daily" element={<DailyPage />} />
              <Route path="/absences" element={<AbsencesPage />} />
              <Route path="/equipment" element={<EquipmentPage />} />
              <Route path="/drivers" element={<DriversPage />} />
              <Route path="/work-sites" element={<WorkSitesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/daily" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
