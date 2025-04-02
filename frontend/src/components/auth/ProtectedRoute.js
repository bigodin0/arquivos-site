import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, initialized, refreshToken } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  
  // Verificar se a rota atual é uma rota pública que não deve redirecionar
  const isPublicRoute = location.pathname.startsWith('/shared/') || 
                       location.pathname.startsWith('/embed/') ||
                       location.pathname === '/planos';

  // Efeito para verificar se o token precisa ser renovado
  useEffect(() => {
    const checkAuth = async () => {
      // Não precisamos verificar para rotas públicas
      if (isPublicRoute) {
        setIsChecking(false);
        return;
      }
      
      // Aguardar a inicialização do contexto de autenticação
      if (!initialized) return;
      
      // Tentar renovar o token se necessário
      if (isAuthenticated()) {
        try {
          await refreshToken();
        } catch (err) {
          console.warn('Erro ao renovar token:', err);
        }
      }
      
      setIsChecking(false);
    };
    
    checkAuth();
  }, [location.pathname, isPublicRoute, refreshToken, isAuthenticated, initialized]);

  // Mostrar nada enquanto carrega para evitar flashes
  if (loading || isChecking) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner size="lg" color="primary" text="Carregando..." />
      </div>
    );
  }
  
  // Se a rota for pública, não redirecionar mesmo sem autenticação
  if (isPublicRoute) {
    return children;
  }
  
  // Verificar autenticação para rotas protegidas
  if (!isAuthenticated()) {
    // Redirecionar para a página de login com o caminho original para redirecionamento após login
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }
  
  // Se estiver autenticado, mostrar o conteúdo protegido
  return children;
};

export default ProtectedRoute;