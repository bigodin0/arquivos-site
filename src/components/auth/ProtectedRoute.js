import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // Verificar se a rota atual é uma rota pública que não deve redirecionar
  const isPublicRoute = location.pathname.startsWith('/shared/') || 
                       location.pathname.startsWith('/embed/') ||
                       location.pathname === '/planos';

  // Mostrar nada enquanto carrega para evitar flashes
  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
    </div>;
  }
  
  // Se a rota for pública, não redirecionar mesmo sem autenticação
  if (isPublicRoute) {
    return children;
  }
  
  // Se não estiver autenticado e não for uma rota pública, redirecionar para login
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Se estiver autenticado, mostrar o conteúdo protegido
  return children;
};

export default ProtectedRoute;