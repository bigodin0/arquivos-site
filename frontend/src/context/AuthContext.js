import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import PlansService from '../services/plans';
import apiConfig from '../config/api';
import StorageService from '../services/storage'; // Mantendo para compatibilidade
import SecureStorageService from '../services/secureStorage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar se o usuário está autenticado ao carregar a página
    const initAuth = async () => {
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
            await fetchUserData(token);
          }
        }
      } else {
        // Se o token está inválido, limpar dados de autenticação
        logout();
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  // Função para verificar se o token está expirado
  const isTokenExpired = (token) => {
    if (!token) return true;
    
    // Token administrativo nunca expira
    if (token.startsWith('admin-token-')) return false;
    
    // Verificar expiração usando SecureStorageService
    return !SecureStorageService.isTokenValid();
  };

  // Função para buscar dados do usuário usando o token
  const fetchUserData = async (token) => {
    try {
      setLoading(true);
      // Usar getAuthHeaders() do SecureStorageService
      const response = await axios.get(apiConfig.endpoints.me, { 
        headers: SecureStorageService.getAuthHeaders().headers
      });
      
      if (response.data.success) {
        setUser(response.data.user);
        
        // Armazenar apenas dados não sensíveis do usuário
        const userData = {
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          role: response.data.user.role,
          plan: response.data.user.plan,
          planExpiresAt: response.data.user.planExpiresAt
        };
        
        localStorage.setItem('simulachat_user', JSON.stringify(userData));
      } else {
        // Se a requisição foi bem-sucedida mas retornou erro
        logout();
      }
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      // Se houver erro na requisição, fazer logout
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Função de login com acesso administrativo
  const login = async (email, password) => {
    try {
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
      
      // Continuar com o processo normal de login
      setError(null);
      setLoading(true);
      
      // Fazer a chamada de login para a API
      const response = await axios.post(apiConfig.endpoints.login, {
        email,
        password
      });
      
      if (response.data.success) {
        const { token, user: userData } = response.data;
        
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
        setError(response.data.error || 'Erro ao fazer login');
        return false;
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      
      // Adicionar mais informações de debug
      if (error.response) {
        console.log('Status do erro:', error.response.status);
        console.log('Dados da resposta:', error.response.data);
      } else if (error.request) {
        console.log('Requisição sem resposta:', error.request);
      }
      
      // Mensagem de erro mais informativa
      let errorMessage = 'Credenciais inválidas';
      
      if (error.response) {
        // O servidor respondeu com um código de status diferente de 2xx
        if (error.response.status === 404) {
          errorMessage = 'Servidor não encontrado. Verifique a conexão ou contate o suporte.';
        } else if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        // A requisição foi feita, mas não houve resposta
        errorMessage = 'Sem resposta do servidor. Verifique sua conexão com a internet.';
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Nova função para login com Google
  const googleLogin = async (token, email, name, picture) => {
    try {
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
      setError(null);
      setLoading(true);
      
      // Chamada para a API de login com Google
      const response = await axios.post(apiConfig.endpoints.googleLogin || '/api/auth/google-login', {
        token,
        email,
        name,
        picture
      });
      
      if (response.data.success) {
        const { token: authToken, user: userData } = response.data;
        
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
        setError(response.data.error || 'Erro ao fazer login com Google');
        return false;
      }
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error);
      
      // Informações de debug
      if (error.response) {
        console.log('Status do erro:', error.response.status);
        console.log('Dados da resposta:', error.response.data);
      }
      
      let errorMessage = 'Erro ao fazer login com Google';
      
      if (error.response) {
        if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        errorMessage = 'Sem resposta do servidor. Verifique sua conexão com a internet.';
      }
      
      setError(errorMessage);
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

  // Função que tentará login com Google pela API primeiro e, se falhar, usará o local no ambiente de desenvolvimento
  const handleGoogleLogin = async (token, email, name, picture) => {
    try {
      // Tenta o login real
      const success = await googleLogin(token, email, name, picture);
      if (success) return true;
      
      // Se estiver em desenvolvimento e o login real falhar, tenta o login local
      if (process.env.NODE_ENV === 'development') {
        console.log('Tentando login local com Google para desenvolvimento');
        return localGoogleLogin(token, email, name, picture);
      }
      
      return false;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Login com Google falhou, usando fallback local');
        return localGoogleLogin(token, email, name, picture);
      }
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
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
      setError(null);
      setLoading(true);
      
      // Chamada para a API de registro
      const response = await axios.post(apiConfig.endpoints.register, {
        name,
        email,
        password
      });
      
      if (response.data.success) {
        const { token, user: userData } = response.data;
        
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
        setError(response.data.error || 'Erro ao registrar usuário');
        return false;
      }
    } catch (error) {
      console.error('Erro ao registrar:', error);
      setError(error.response?.data?.error || 'Erro ao registrar usuário');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Usar SecureStorageService para limpar todos os tokens e dados sensíveis
    SecureStorageService.clearAuth();
    setUser(null);
  };

  // Função para fallback local quando a API não estiver disponível (desenvolvimento)
  const localLogin = (email, password) => {
    // Verificar se é o email do administrador
    const ADMIN_EMAIL = 'simulawhats@gmail.com';
    const ADMIN_PASSWORD = 'Sc@022325';
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      console.log('Login administrativo local detectado - concedendo acesso Premium');
      
      const adminUser = {
        id: 'admin-user-' + Date.now(),
        name: 'Administrador',
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
    
    // Usuários mock para desenvolvimento local
    const mockUsers = [
      {
        id: 1,
        name: 'Usuário Teste',
        email: 'teste@exemplo.com',
        password: 'senha123',
        role: 'user',
        plan: 'basic'
      },
      {
        id: 2,
        name: 'Admin',
        email: 'admin@exemplo.com',
        password: 'admin123',
        role: 'admin',
        plan: 'premium'
      }
    ];
    
    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
      // Remover a senha antes de armazenar
      const { password, ...userWithoutPassword } = user;
      
      // Criar um token falso para testes
      const mockToken = btoa(`user-${user.id}-${Date.now()}`);
      
      // Usar SecureStorageService para armazenar o token
      SecureStorageService.saveToken(mockToken);
      localStorage.setItem('simulachat_user', JSON.stringify(userWithoutPassword));
      
      setUser(userWithoutPassword);
      return true;
    }
    
    setError('Credenciais inválidas');
    return false;
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
    if (!user) return null;
    return PlansService.getPlanDetails(user.plan);
  };

  const canPerformAction = (action, currentCount) => {
    // Verificar se o usuário é administrador a partir do localStorage
    const storedUser = JSON.parse(localStorage.getItem('simulachat_user') || '{}');
    
    if (storedUser.isAdmin || storedUser.role === 'admin' || (user && (user.isAdmin || user.role === 'admin'))) {
      // Se for administrador, conceder permissão para qualquer ação
      return true;
    }
    
    // Se não for admin, usar a lógica normal
    if (!user) return false;
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
  const checkAndRefreshToken = async () => {
    if (SecureStorageService.shouldRefreshToken()) {
      // Implementar lógica de refresh token quando estiver disponível
      console.log('Token precisa ser renovado');
      // Por enquanto, apenas verificar validade atual
      return SecureStorageService.isTokenValid();
    }
    return true;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login,
      localLogin, // Login local para desenvolvimento
      googleLogin: handleGoogleLogin, // Nova função de login com Google
      logout, 
      register, 
      isAuthenticated, 
      loading,
      error,
      getPlanDetails,
      canPerformAction,
      getToken,
      getAuthHeaders,
      isTokenExpired, // Exportando a função para ser usada em outros componentes se necessário
      checkAndRefreshToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};