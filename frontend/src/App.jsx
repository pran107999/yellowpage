import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Classifieds from './pages/Classifieds';
import ClassifiedDetail from './pages/ClassifiedDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import MyClassifieds from './pages/MyClassifieds';
import CreateClassified from './pages/CreateClassified';
import EditClassified from './pages/EditClassified';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children, requireAdmin, requireVerifiedEmail }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/" replace />;
  if (requireVerifiedEmail && !user.emailVerified) return <Navigate to="/verify-email" replace state={{ requireVerification: true }} />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="classifieds" element={<Classifieds />} />
        <Route path="classifieds/:id" element={<ClassifiedDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="verify-email" element={<VerifyEmail />} />
        <Route
          path="my-classifieds"
          element={
            <ProtectedRoute>
              <MyClassifieds />
            </ProtectedRoute>
          }
        />
        <Route
          path="classifieds/create"
          element={
            <ProtectedRoute requireVerifiedEmail>
              <CreateClassified />
            </ProtectedRoute>
          }
        />
        <Route
          path="classifieds/:id/edit"
          element={
            <ProtectedRoute requireVerifiedEmail>
              <EditClassified />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
