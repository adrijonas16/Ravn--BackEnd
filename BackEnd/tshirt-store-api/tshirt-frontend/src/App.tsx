import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import Navbar from './components/layout/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminPromosPage from './pages/AdminPromosPage';
import SavedProductsPage from './pages/SavedProductsPage';
import { ReactNode } from 'react';

// Ruta protegida: redirige al login si no está autenticado
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAuthLoading } = useAuth();
  if (isAuthLoading) return null;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function ManagerRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isAuthLoading } = useAuth();
  if (isAuthLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return user?.role === 'manager' ? <>{children}</> : <Navigate to="/" />;
}

function ClientRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isAuthLoading } = useAuth();
  if (isAuthLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return user?.role === 'client' ? <>{children}</> : <Navigate to="/orders" />;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<ProductsPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Rutas protegidas */}
        <Route path="/cart" element={<ClientRoute><CartPage /></ClientRoute>} />
        <Route path="/checkout" element={<ClientRoute><CheckoutPage /></ClientRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute><SavedProductsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ManagerRoute><AdminProductsPage /></ManagerRoute>} />
        <Route path="/admin/promos" element={<ManagerRoute><AdminPromosPage /></ManagerRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
