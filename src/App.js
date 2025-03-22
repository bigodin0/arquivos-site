import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import FlowEditor from './pages/FlowEditor';
import FlowPreview from './pages/FlowPreview';
import Templates from './pages/Templates';
import Plans from './pages/Plans';
import Analytics from './pages/Analytics';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { DesignProvider } from './contexts/DesignContext';
import PublicPlans from './pages/PublicPlans';
import SharedFlowPreview from './pages/SharedFlowPreview';
import FlowEmbed from './pages/FlowEmbed';

// Novos componentes do fluxo de cadastro
import LandingPage from './pages/LandingPage';
import RegisterPassword from './pages/RegisterPassword';
import PlanSelection from './pages/PlanSelection';
import PaymentMethod from './pages/PaymentMethod';

// Componente para redirecionar usuários autenticados
const RequireAuth = ({ children }) => {
  const { isAuthenticated } = require('./contexts/AuthContext').useAuth();
  
  // Se o usuário estiver autenticado, redirecionar para o dashboard
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Se não estiver autenticado, mostrar a página normalmente
  return children;
};

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <DesignProvider>
          <Router>
            <Routes>
              {/* Landing page como rota pública principal com redirecionamento para usuários autenticados */}
              <Route path="/" element={
                <RequireAuth>
                  <LandingPage />
                </RequireAuth>
              } />
              
              {/* Rotas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/planos" element={<PublicPlans />} />
              <Route path="/shared/:shareCode" element={<SharedFlowPreview />} />
              <Route path="/embed/:shareCode" element={<FlowEmbed />} />
              
              {/* Novas rotas do fluxo de cadastro */}
              <Route path="/signup" element={<RegisterPassword />} />
              <Route path="/signup/planform" element={<PlanSelection />} />
              <Route path="/signup/payment" element={<PaymentMethod />} />
              
              {/* Rotas protegidas */}
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
            </Routes>
          </Router>
        </DesignProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;