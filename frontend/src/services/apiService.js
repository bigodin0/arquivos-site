import axios from 'axios';
import apiConfig from '../config/api';
import SecureStorageService from './secureStorage';

// Instância base do axios com configurações padrão
const axiosInstance = axios.create({
  baseURL: apiConfig.API_BASE_URL,
  timeout: 10000, // 10 segundos
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token de autenticação
axiosInstance.interceptors.request.use(
  (config) => {
    if (SecureStorageService.isTokenValid()) {
      const token = SecureStorageService.getToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar respostas de erro
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Se for erro de token expirado (401) e não for uma requisição de refresh
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Tentar renovar o token se possível
      if (SecureStorageService.shouldRefreshToken()) {
        try {
          // Buscar um novo token
          const refreshToken = SecureStorageService.getRefreshToken();
          if (!refreshToken) {
            throw new Error('Refresh token não disponível');
          }
          
          const response = await axios.post(
            `${apiConfig.API_BASE_URL}/api/auth/refresh-token`,
            { refreshToken },
            { skipAuthRefresh: true }
          );
          
          if (response.data && response.data.token) {
            SecureStorageService.updateToken(response.data.token);
            originalRequest.headers['Authorization'] = `Bearer ${response.data.token}`;
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          console.error('Erro ao renovar token:', refreshError);
          // Limpar token inválido
          SecureStorageService.clearAuth();
          // Redirecionar para login se necessário
          window.location.href = '/login';
        }
      } else {
        // Limpar token inválido
        SecureStorageService.clearAuth();
      }
    }
    
    return Promise.reject(error);
  }
);

// Método para obter a URL base da API
const getBaseUrl = () => {
  return apiConfig.API_BASE_URL;
};

// Métodos para chamadas comuns
const ApiService = {
  // Obter a URL base
  getBaseUrl,
  
  // Requisições GET
  async get(endpoint, params = {}, config = {}) {
    try {
      const response = await axiosInstance.get(endpoint, { ...config, params });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },
  
  // Requisições POST
  async post(endpoint, data = {}, config = {}) {
    try {
      const response = await axiosInstance.post(endpoint, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },
  
  // Requisições PUT
  async put(endpoint, data = {}, config = {}) {
    try {
      const response = await axiosInstance.put(endpoint, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },
  
  // Requisições DELETE
  async delete(endpoint, config = {}) {
    try {
      const response = await axiosInstance.delete(endpoint, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },
  
  // Tratamento centralizado de erros
  handleError(error) {
    // Log do erro para debugging
    console.error('API Error:', error);
    
    // Tratamento específico por código de erro
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          console.error('Erro de validação:', data.error || 'Dados inválidos');
          break;
        case 401:
          console.error('Não autorizado:', data.error || 'Autenticação necessária');
          break;
        case 403:
          console.error('Proibido:', data.error || 'Sem permissão para acessar este recurso');
          break;
        case 404:
          console.error('Não encontrado:', data.error || 'Recurso não encontrado');
          break;
        case 500:
          console.error('Erro do servidor:', data.error || 'Erro interno do servidor');
          break;
        default:
          console.error(`Erro ${status}:`, data.error || 'Algo deu errado');
      }
    } else if (error.request) {
      console.error('Sem resposta do servidor. Verifique sua conexão com a internet.');
    } else {
      console.error('Erro na configuração da requisição:', error.message);
    }
  },
  
  // Métodos específicos para endpoints comuns
  auth: {
    login: (email, password) => ApiService.post('/api/auth/login', { email, password }),
    register: (name, email, password) => ApiService.post('/api/auth/register', { name, email, password }),
    me: () => ApiService.get('/api/auth/me'),
    refreshToken: (refreshToken) => ApiService.post('/api/auth/refresh-token', { refreshToken }),
    googleLogin: (token, email, name, picture) => ApiService.post('/api/auth/google-login', { token, email, name, picture })
  },
  
  flows: {
    getAll: () => ApiService.get('/api/flows'),
    getById: (id) => ApiService.get(`/api/flows/${id}`),
    create: (flowData) => ApiService.post('/api/flows', flowData),
    update: (id, flowData) => ApiService.put(`/api/flows/${id}`, flowData),
    delete: (id) => ApiService.delete(`/api/flows/${id}`),
    fromTemplate: (templateId) => ApiService.post(`/api/flows/from-template/${templateId}`)
  },
  
  sharedFlows: {
    getByCode: (code) => ApiService.get(`/api/shared-flows/${code}`),
    getById: (code) => ApiService.get(`/api/shared-flows/${code}`),
    getPublic: (flowId) => ApiService.get(`/api/shared-flows/public/${flowId}`),
    share: (flowId) => ApiService.post('/api/shared-flows', { flowId, isPublic: true }),
    registerView: (code) => ApiService.post(`/api/shared-flows/${code}/view`),
    recordView: (code) => ApiService.post(`/api/shared-flows/${code}/view`)
  },
  
  templates: {
    getAll: () => ApiService.get('/api/templates'),
    getById: (id) => ApiService.get(`/api/templates/${id}`)
  },
  
  plans: {
    getAll: () => ApiService.get('/api/planos'),
    createCheckout: (planData) => ApiService.post('/api/checkout', planData),
    verifySubscription: (paymentId) => ApiService.get(`/api/subscriptions/verify/${paymentId}`)
  }
};

export default ApiService;