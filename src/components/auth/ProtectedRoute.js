import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SecureStorageService from '../../services/secureStorage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, refreshToken } = useAuth();
  const location = useLocation();
  
  // Verificar se a rota atual é uma rota pública que não deve redirecionar
  const isPublicRoute = location.pathname.startsWith('/shared/') || 
                       location.pathname.startsWith('/embed/') ||
                       location.pathname === '/planos';

  // Efeito para verificar se o token precisa ser renovado
  useEffect(() => {
    // Não precisamos verificar para rotas públicas
    if (isPublicRoute) return;
    
    // Verificar se o token está próximo de expirar e tentar renovar
    if (SecureStorageService.shouldRefreshToken()) {
      refreshToken().catch(err => {
        console.warn('Erro ao renovar token:', err);
      });
    }
  }, [location.pathname, isPublicRoute, refreshToken]);

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
  
  // Usar o SecureStorageService para uma verificação mais segura de autenticação
  if (!isAuthenticated()) {
    // Se não estiver autenticado, limpar qualquer token expirado ou inválido
    SecureStorageService.clearAuth();
    
    // Redirecionar para a página de login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Se estiver autenticado, mostrar o conteúdo protegido
  return children;
};

export default ProtectedRoute;