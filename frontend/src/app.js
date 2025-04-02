import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './styles/App.css';

// Importações de fontes
import '@fontsource/inter';
import '@fontsource/montserrat';

// Importações de páginas e componentes
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import FlowEditor from './pages/FlowEditor';
import FlowPreview from './pages/FlowPreview';
import Templates from './pages/Templates';
import Plans from './pages/Plans';
import Analytics from './pages/Analytics';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DesignProvider } from './context/DesignContext';
import { ToastProvider } from './context/ToastContext';
import PublicPlans from './pages/PublicPlans';
import SharedFlowPreview from './pages/SharedFlowPreview';
import FlowEmbed from './pages/FlowEmbed';
import LandingPage from './pages/LandingPage';
import RegisterPassword from './pages/RegisterPassword';
import PlanSelection from './pages/PlanSelection';
import PaymentMethod from './pages/PaymentMethod';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import Files from './pages/Files';

// Componente para gerenciar redirecionamentos após login
const AuthRedirect = () => {
  const { initialized, isAuthenticated } = useAuth();
  const location = useLocation();
  
  // Obter rota de redirecionamento do estado da localização
  const from = location.state?.from || '/dashboard';
  
  // Mostrar estado de carregamento
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner size="lg" color="primary" text="Carregando..." />
      </div>
    );
  }
  
  // Se estiver autenticado, redirecionar para a página original ou dashboard
  if (isAuthenticated()) {
    return <Navigate to={from} replace />;
  }
  
  // Se não estiver autenticado, mostrar a página de login
  return <Login />;
};

// Componente para redirecionar usuários autenticados para o dashboard
const PublicRoute = ({ children }) => {
  const { initialized, isAuthenticated, loading } = useAuth();
  
  // Mostrar estado de carregamento
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner size="lg" color="primary" text="Carregando..." />
      </div>
    );
  }
  
  // Se o usuário estiver autenticado, redirecionar para o dashboard
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Se não estiver autenticado, mostrar a página pública
  return children;
};

function App() {
  return (
    <div className="app-container">
      <ErrorBoundary>
        <HelmetProvider>
          <AuthProvider>
            <DesignProvider>
              <ToastProvider>
                <Router>
                  <Routes>
                  {/* Rotas Públicas (acessíveis sem login) */}
                  <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
                  <Route path="/login" element={<AuthRedirect />} />
                  <Route path="/planos" element={<PublicPlans />} />
                  <Route path="/shared/:shareCode" element={<SharedFlowPreview />} />
                  <Route path="/embed/:shareCode" element={<FlowEmbed />} />
                  
                  {/* Rotas de Cadastro (acessíveis apenas sem login) */}
                  <Route path="/signup" element={<PublicRoute><RegisterPassword /></PublicRoute>} />
                  <Route path="/signup/planform" element={<PublicRoute><PlanSelection /></PublicRoute>} />
                  <Route path="/signup/payment" element={<PublicRoute><PaymentMethod /></PublicRoute>} />
                  
                  {/* Rotas Protegidas (requerem login) */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/flow/:id" 
                    element={
                      <ProtectedRoute>
                        <FlowEditor />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/flow/:id/preview" 
                    element={
                      <ProtectedRoute>
                        <FlowPreview />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/templates" 
                    element={
                      <ProtectedRoute>
                        <Templates />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/plans" 
                    element={
                      <ProtectedRoute>
                        <Plans />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/analytics" 
                    element={
                      <ProtectedRoute>
                        <Analytics />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/assinatura/sucesso" 
                    element={
                      <ProtectedRoute>
                        <SubscriptionSuccess />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/files" 
                    element={
                      <ProtectedRoute>
                        <Files />
                      </ProtectedRoute>
                    } 
                  />
                  {/* Rota de fallback para páginas não encontradas */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Router>
              </ToastProvider>
            </DesignProvider>
          </AuthProvider>
        </HelmetProvider>
      </ErrorBoundary>
    </div>
  );
}

export default App;