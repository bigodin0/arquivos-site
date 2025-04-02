import React, { createContext, useState, useContext, useEffect } from 'react';
import ApiService from '../services/apiService';
import PlansService from '../services/plans';
import SecureStorageService from '../services/secureStorage';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Verificar se o usuário está autenticado ao carregar a página
    const initAuth = async () => {
      try {
        setLoading(true);
        
        // Verificar se o token é válido usando SecureStorageService
        if (SecureStorageService.isTokenValid()) {
          const token = SecureStorageService.getToken();
          
          // Verificar se não está expirado antes de tentar usá-lo
          if (token) {
            if (token.startsWith('admin-token-')) {
              // Para tokens administrativos, carregamos do localStorage diretamente
              const storedUser = localStorage.getItem('simulachat_user');
              if (storedUser) {
                setUser(JSON.parse(storedUser));
              }
            } else {
              // Para tokens normais, tentamos buscar dados atualizados do usuário
              try {
                const response = await ApiService.auth.me();
                if (response.success && response.user) {
                  setUser(response.user);
                  
                  // Armazenar apenas dados não sensíveis do usuário
                  const userData = {
                    id: response.user.id,
                    name: response.user.name,
                    email: response.user.email,
                    role: response.user.role,
                    plan: response.user.plan,
                    planExpiresAt: response.user.planExpiresAt
                  };
                  
                  localStorage.setItem('simulachat_user', JSON.stringify(userData));
                } else {
                  // Se a requisição foi bem-sucedida mas retornou erro
                  throw new Error('Dados do usuário inválidos');
                }
              } catch (error) {
                console.error('Erro ao obter dados do usuário:', error);
                // Se houver erro na requisição, fazer logout
                await logout();
              }
            }
          }
        } else {
          // Se o token está inválido, limpar dados de autenticação
          clearAuthData();
        }
      } catch (error) {
        console.error('Erro na inicialização da autenticação:', error);
        clearAuthData();
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initAuth();
  }, []);

  // Função para limpar dados de autenticação
  const clearAuthData = () => {
    SecureStorageService.clearAuth();
    setUser(null);
  };

  // Função atualizada para login
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      // Credenciais do administrador para bypass
      const ADMIN_EMAIL = 'simulawhats@gmail.com';
      const ADMIN_PASSWORD = 'Sc@022325';
      
      // Se for o e-mail do admin, conceda acesso automático com plano Premium
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        console.log('Login administrativo detectado - concedendo acesso Premium');
        
        const adminUser = {
          id: 'admin-user-' + Date.now(),
          name: 'Administrador',
          email: ADMIN_EMAIL,
          role: 'admin',
          isAdmin: true,
          plan: 'premium'
        };
        
        // Definir usuário e token no estado e localStorage
        setUser(adminUser);
        const adminToken = 'admin-token-' + Date.now();
        
        // Usar SecureStorageService para armazenar o token
        SecureStorageService.saveToken(adminToken);
        localStorage.setItem('simulachat_user', JSON.stringify(adminUser));
        
        return true;
      }
      
      // Fazer a chamada de login para a API
      try {
        const response = await ApiService.auth.login(email, password);
        
        if (response.success) {
          const { token, user: userData } = response;
          
          // Usar SecureStorageService para armazenar o token
          SecureStorageService.saveToken(token);
          
          // Armazenar apenas dados não sensíveis do usuário
          const userInfo = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            plan: userData.plan,
            planExpiresAt: userData.planExpiresAt
          };
          
          localStorage.setItem('simulachat_user', JSON.stringify(userInfo));
          
          setUser(userData);
          return true;
        } else {
          throw new Error(response.error || 'Erro ao fazer login');
        }
      } catch (error) {
        console.error('Erro ao fazer login:', error);
        throw error;
      }
    } catch (err) {
      setError(err.message || 'Erro ao fazer login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função atualizada para login com Google
  const googleLogin = async (token, email, name, picture) => {
    try {
      setError(null);
      setLoading(true);
      
      // Verifica se é o email do administrador
      const ADMIN_EMAIL = 'simulawhats@gmail.com';
      
      if (email === ADMIN_EMAIL) {
        console.log('Login administrativo via Google detectado - concedendo acesso Premium');
        
        const adminUser = {
          id: 'admin-user-' + Date.now(),
          name: 'Administrador',
          email: ADMIN_EMAIL,
          role: 'admin',
          isAdmin: true,
          plan: 'premium',
          picture
        };
        
        // Definir usuário e token no estado
        setUser(adminUser);
        const adminToken = 'admin-token-' + Date.now();
        
        // Usar SecureStorageService para armazenar o token
        SecureStorageService.saveToken(adminToken);
        localStorage.setItem('simulachat_user', JSON.stringify(adminUser));
        
        return true;
      }
      
      // Processo normal de login com Google
      try {
        const response = await ApiService.auth.googleLogin(token, email, name, picture);
        
        if (response.success) {
          const { token: authToken, user: userData } = response;
          
          // Usar SecureStorageService para armazenar o token
          SecureStorageService.saveToken(authToken);
          
          // Armazenar apenas dados não sensíveis
          const userInfo = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            plan: userData.plan,
            planExpiresAt: userData.planExpiresAt,
            picture: userData.picture
          };
          
          localStorage.setItem('simulachat_user', JSON.stringify(userInfo));
          
          setUser(userData);
          return true;
        } else {
          throw new Error(response.error || 'Erro ao fazer login com Google');
        }
      } catch (error) {
        console.error('Erro ao fazer login com Google:', error);
        
        // Em desenvolvimento, tentar fallback local
        if (process.env.NODE_ENV === 'development') {
          return localGoogleLogin(token, email, name, picture);
        }
        
        throw error;
      }
    } catch (err) {
      setError(err.message || 'Erro ao fazer login com Google');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função de login local com Google (desenvolvimento)
  const localGoogleLogin = (token, email, name, picture) => {
    try {
      // Verifica se é o email do administrador
      const ADMIN_EMAIL = 'simulawhats@gmail.com';
      
      if (email === ADMIN_EMAIL) {
        console.log('Login administrativo local via Google detectado - concedendo acesso Premium');
        
        const adminUser = {
          id: 'admin-user-' + Date.now(),
          name: 'Administrador',
          email: ADMIN_EMAIL,
          role: 'admin',
          isAdmin: true,
          plan: 'premium',
          picture
        };
        
        // Definir usuário e token no estado
        setUser(adminUser);
        const adminToken = 'admin-token-' + Date.now();
        
        // Usar SecureStorageService para armazenar o token
        SecureStorageService.saveToken(adminToken);
        localStorage.setItem('simulachat_user', JSON.stringify(adminUser));
        
        return true;
      }
      
      // Processo normal
      setError(null);
      setLoading(true);
      
      // Criar um usuário mock com os dados do Google
      const googleUser = {
        id: `google-${Date.now()}`,
        name,
        email,
        picture,
        role: 'user',
        plan: 'basic',
        provider: 'google'
      };
      
      // Criar um token falso para testes
      const mockToken = btoa(`google-user-${googleUser.id}-${Date.now()}`);
      
      // Usar SecureStorageService para armazenar o token
      SecureStorageService.saveToken(mockToken);
      localStorage.setItem('simulachat_user', JSON.stringify(googleUser));
      
      setUser(googleUser);
      return true;
    } catch (error) {
      console.error('Erro ao fazer login local com Google:', error);
      setError('Erro ao processar login com Google');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função para registro
  const register = async (name, email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      // Verificar se é o email do administrador
      const ADMIN_EMAIL = 'simulawhats@gmail.com';
      
      if (email === ADMIN_EMAIL) {
        console.log('Registro administrativo detectado - concedendo acesso Premium');
        
        const adminUser = {
          id: 'admin-user-' + Date.now(),
          name: name || 'Administrador',
          email: ADMIN_EMAIL,
          role: 'admin',
          isAdmin: true,
          plan: 'premium'
        };
        
        // Definir usuário e token no estado
        setUser(adminUser);
        const adminToken = 'admin-token-' + Date.now();
        
        // Usar SecureStorageService para armazenar o token
        SecureStorageService.saveToken(adminToken);
        localStorage.setItem('simulachat_user', JSON.stringify(adminUser));
        
        return true;
      }
      
      // Processo normal de registro
      try {
        const response = await ApiService.auth.register(name, email, password);
        
        if (response.success) {
          const { token, user: userData } = response;
          
          // Usar SecureStorageService para armazenar o token
          SecureStorageService.saveToken(token);
          
          // Armazenar apenas dados não sensíveis
          const userInfo = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            plan: userData.plan,
            planExpiresAt: userData.planExpiresAt
          };
          
          localStorage.setItem('simulachat_user', JSON.stringify(userInfo));
          
          setUser(userData);
          return true;
        } else {
          throw new Error(response.error || 'Erro ao registrar usuário');
        }
      } catch (error) {
        console.error('Erro ao registrar:', error);
        throw error;
      }
    } catch (err) {
      setError(err.message || 'Erro ao registrar usuário');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função para logout
  const logout = async () => {
    // Limpar token usando SecureStorageService
    SecureStorageService.clearAuth();
    localStorage.removeItem('simulachat_user');
    setUser(null);
  };

  // Função isAuthenticated melhorada
  const isAuthenticated = () => {
    // Usar SecureStorageService para verificar validade do token
    return SecureStorageService.isTokenValid();
  };

  const getPlanDetails = () => {
    // Verificar se o usuário é administrador a partir do localStorage
    const storedUser = JSON.parse(localStorage.getItem('simulachat_user') || '{}');
    
    if (storedUser.isAdmin || storedUser.role === 'admin' || (user && (user.isAdmin || user.role === 'admin'))) {
      // Se for administrador, retornar plano Premium com recursos ilimitados
      return {
        name: 'Premium',
        messagesPerFlowLimit: -1, // Ilimitado
        flowsLimit: -1, // Ilimitado
        features: {
          use_media: true,
          advanced_analytics: true,
          buttons: true,
          media: true,
          audio: true,
          gifs: true,
          video: true
        }
      };
    }
    
    // Se não for admin, usar a lógica normal
    if (!user) return PlansService.plans.free;
    return PlansService.getPlanDetails(user.plan);
  };

  const canPerformAction = (action, currentCount = 0) => {
    // Verificar se o usuário é administrador a partir do localStorage
    const storedUser = JSON.parse(localStorage.getItem('simulachat_user') || '{}');
    
    if (storedUser.isAdmin || storedUser.role === 'admin' || (user && (user.isAdmin || user.role === 'admin'))) {
      // Se for administrador, conceder permissão para qualquer ação
      return true;
    }
    
    // Se não for admin, usar a lógica normal
    if (!user) return PlansService.checkPlanAllowsAction('free', action, currentCount);
    return PlansService.checkPlanAllowsAction(user.plan, action, currentCount);
  };

  // Função de helper para obter o token atual
  const getToken = () => {
    return SecureStorageService.getToken();
  };
  
  // Função para obter headers para requisições autenticadas
  const getAuthHeaders = () => {
    return SecureStorageService.getAuthHeaders();
  };

  // Função para verificar e renovar token se necessário
  const refreshToken = async () => {
    if (SecureStorageService.shouldRefreshToken()) {
      try {
        const refreshToken = SecureStorageService.getRefreshToken();
        if (!refreshToken) return false;
        
        const response = await ApiService.auth.refreshToken(refreshToken);
        
        if (response.success && response.token) {
          SecureStorageService.updateToken(response.token);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Erro ao renovar token:', error);
        return false;
      }
    }
    return true;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login,
      googleLogin,
      logout, 
      register, 
      isAuthenticated, 
      loading,
      error,
      initialized,
      getPlanDetails,
      canPerformAction,
      getToken,
      getAuthHeaders,
      refreshToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export default AuthContext;