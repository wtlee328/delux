import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminToursPage from './pages/admin/AdminToursPage';
import AdminTourDetailPage from './pages/admin/AdminTourDetailPage';
import SupplierDashboardPage from './pages/supplier/SupplierDashboardPage';
import CreateProductPage from './pages/supplier/CreateProductPage';
import EditProductPage from './pages/supplier/EditProductPage';
import AgencyDashboardPage from './pages/agency/AgencyDashboardPage';
import AgencyTourDetailPage from './pages/agency/AgencyTourDetailPage';
import ProtectedRoute from './components/ProtectedRoute';

// Component to handle role-based redirect after login
const RoleBasedRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/users" replace />;
    case 'supplier':
      return <Navigate to="/supplier/dashboard" replace />;
    case 'agency':
      return <Navigate to="/agency/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/select-role" element={<RoleSelectionPage />} />
              
              {/* Root redirect based on authentication */}
              <Route path="/" element={<RoleBasedRedirect />} />

              {/* Admin routes */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tours"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminToursPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tours/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminTourDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Supplier routes */}
              <Route
                path="/supplier/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['supplier']}>
                    <SupplierDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/supplier/tours/new"
                element={
                  <ProtectedRoute allowedRoles={['supplier']}>
                    <CreateProductPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/supplier/tours/edit/:id"
                element={
                  <ProtectedRoute allowedRoles={['supplier']}>
                    <EditProductPage />
                  </ProtectedRoute>
                }
              />

              {/* Agency routes */}
              <Route
                path="/agency/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['agency']}>
                    <AgencyDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agency/tours/:id"
                element={
                  <ProtectedRoute allowedRoles={['agency']}>
                    <AgencyTourDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch all - redirect to root */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
