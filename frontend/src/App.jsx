// ===== frontend/src/App.jsx =====
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

//Herramientas Obligatorias y seleccionables
import { Analytics } from "@vercel/analytics/react"

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Dashboard
import Dashboard from './components/dashboard/Dashboard';

// Placeholder components (to be developed)
import ProjectsPage from './components/projects/ProjectsPage';
import MonitoringPage from './components/monitoring/MonitoringPage';
import PredictivePage from './components/predictive/PredictivePage';
import DocumentsPage from './components/documents/DocumentsPage';
import UsersPage from './components/users/UsersPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/projects/*" 
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/monitoring" 
            element={
              <ProtectedRoute roles={['operator', 'technician', 'manager', 'admin']}>
                <MonitoringPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/predictive" 
            element={
              <ProtectedRoute roles={['analyst', 'manager', 'admin']}>
                <PredictivePage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/documents" 
            element={
              <ProtectedRoute>
                <DocumentsPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/users/*" 
            element={
              <ProtectedRoute roles={['admin']}>
                <UsersPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/register" 
            element={
              <ProtectedRoute roles={['admin']}>
                <Register />
              </ProtectedRoute>
            } 
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
       <Analytics />
    </AuthProvider>
  );
}