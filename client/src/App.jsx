import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerFamilies from './pages/ManagerFamilies';
import ManagerFamilyDetail from './pages/ManagerFamilyDetail';
import DonorDashboard from './pages/DonorDashboard';
import FamilyRegister from './pages/FamilyRegister';
import FamilyDetail from './pages/FamilyDetail';
import VolunteerRequests from './pages/VolunteerRequests';
import VolunteerDistribution from './pages/VolunteerDistribution';
import Reports from './pages/Reports';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/volunteer"
          element={
            <ProtectedRoute allowedRoles={['volunteer']}>
              <VolunteerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/volunteer/families/new"
          element={
            <ProtectedRoute allowedRoles={['volunteer']}>
              <FamilyRegister />
            </ProtectedRoute>
          }
        />
        <Route
          path="/volunteer/families/:id"
          element={
            <ProtectedRoute allowedRoles={['volunteer']}>
              <FamilyDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/volunteer/requests"
          element={
            <ProtectedRoute allowedRoles={['volunteer']}>
              <VolunteerRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/volunteer/distribution"
          element={
            <ProtectedRoute allowedRoles={['volunteer']}>
              <VolunteerDistribution />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/families"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerFamilies />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/families/:id"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerFamilyDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor"
          element={
            <ProtectedRoute allowedRoles={['donor']}>
              <DonorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
