import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import PlansService from '../services/plans';
import apiConfig from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar se o usuário está autenticado ao carregar a página
    const token = localStorage.getItem('token');
    
    if (token) {
      // Verificar se o token está expirado antes de tentar usá-lo
      if (!isTokenExpired(token)) {
        fetchUserData(token);
      } else {
        logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Função para verificar se o token está expirado
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      // Obter a parte payload do token
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      // Verificar expiração
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (e) {
      console.error("Erro ao verificar token:", e);
      return true;
    }
  };

  // Função para buscar dados do usuário usando o token
  const fetchUserData = async (token) => {
    try {
      setLoading(true);
      const response = await axios.get(apiConfig.endpoints.me, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setUser(response.data.user);
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
        localStorage.setItem('token', adminToken);
        localStorage.setItem('simulachat_user', JSON.stringify(adminUser));
        
        return true;
      }
      
      // Continuar com o processo normal de login
      setError(null);
      setLoading(true);
      
      // Remover o Template Literal desnecessário na URL
      const response = await axios.post(apiConfig.endpoints.login, {
        email,
        password
      });
      
      if (response.data.success) {
        const { token, user: userData } = response.data;
        
        // Armazenar token e informações do usuário
        localStorage.setItem('token', token);
        localStorage.setItem('simulachat_user', JSON.stringify(userData));
        
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
        
        // Definir usuário e token no estado e localStorage
        setUser(adminUser);
        const adminToken = 'admin-token-' + Date.now();
        localStorage.setItem('token', adminToken);
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
        
        // Armazenar token e informações do usuário
        localStorage.setItem('token', authToken);
        localStorage.setItem('simulachat_user', JSON.stringify(userData));
        
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

  // Função para login local com Google (desenvolvimento)
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
        
        // Definir usuário e token no estado e localStorage
        setUser(adminUser);
        const adminToken = 'admin-token-' + Date.now();
        localStorage.setItem('token', adminToken);
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
      
      localStorage.setItem('token', mockToken);
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
        
        // Definir usuário e token no estado e localStorage
        setUser(adminUser);
        const adminToken = 'admin-token-' + Date.now();
        localStorage.setItem('token', adminToken);
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
        
        // Armazenar token e informações do usuário
        localStorage.setItem('token', token);
        localStorage.setItem('simulachat_user', JSON.stringify(userData));
        
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
    localStorage.removeItem('token');
    localStorage.removeItem('simulachat_user');
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
      
      // Definir usuário e token no estado e localStorage
      setUser(adminUser);
      const adminToken = 'admin-token-' + Date.now();
      localStorage.setItem('token', adminToken);
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
      
      localStorage.setItem('token', mockToken);
      localStorage.setItem('simulachat_user', JSON.stringify(userWithoutPassword));
      
      setUser(userWithoutPassword);
      return true;
    }
    
    setError('Credenciais inválidas');
    return false;
  };

  // Função isAuthenticated melhorada
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // Verificar se o token começa com 'admin-token-' - nosso método de autenticação de administrador
    if (token.startsWith('admin-token-')) {
      return true;
    }
    
    // Verificar se o token está expirado
    if (isTokenExpired(token)) {
      // Limpar token expirado
      localStorage.removeItem('token');
      localStorage.removeItem('simulachat_user');
      return false;
    }
    
    // Verificar se usuário está no estado
    if (!user) {
      // Se tiver token válido mas não tiver usuário no estado, recarregar usuário
      const storedUser = localStorage.getItem('simulachat_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        // Se não tiver nem usuário armazenado, fazer logout
        logout();
        return false;
      }
    }
    
    return true;
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
    return localStorage.getItem('token');
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
      isTokenExpired // Exportando a função para ser usada em outros componentes se necessário
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};