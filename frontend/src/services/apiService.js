import axios from 'axios';
import apiConfig from '../config/api';
import SecureStorageService from './secureStorage';

// Instância base do axios com configurações padrão
const axiosInstance = axios.create({
  baseURL: apiConfig.API_BASE_URL,
  timeout: 15000, // 15 segundos
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
          // Não redirecionar automaticamente para não perder dados do usuário
          return Promise.reject(error);
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
  
  // Verificar se a API está online
  async checkApiStatus() {
    try {
      const response = await fetch(`${apiConfig.API_BASE_URL}/api/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.warn('API indisponível:', error);
      return false;
    }
  },
  
  // Requisições GET com verificação de disponibilidade de API
  async get(endpoint, params = {}, config = {}) {
    try {
      // Tentar fazer requisição com retry
      const response = await this.requestWithRetry(() => 
        axiosInstance.get(endpoint, { ...config, params })
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },
  
  // Requisições POST
  async post(endpoint, data = {}, config = {}) {
    try {
      const response = await this.requestWithRetry(() => 
        axiosInstance.post(endpoint, data, config)
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },
  
  // Requisições PUT
  async put(endpoint, data = {}, config = {}) {
    try {
      const response = await this.requestWithRetry(() => 
        axiosInstance.put(endpoint, data, config)
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },
  
  // Requisições DELETE
  async delete(endpoint, config = {}) {
    try {
      const response = await this.requestWithRetry(() => 
        axiosInstance.delete(endpoint, config)
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },
  
  // Função de retry para requisições
  async requestWithRetry(requestFn, maxRetries = 2, delayMs = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // Só fazer retry em casos específicos (timeout, erros de rede, 503)
        const shouldRetry = !error.response || 
                           error.code === 'ECONNABORTED' || 
                           (error.response && error.response.status === 503);
        
        if (attempt >= maxRetries || !shouldRetry) {
          break;
        }
        
        // Esperar antes de tentar novamente (delay exponencial)
        const delay = delayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
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
          console.error('Erro de validação:', data.error || data.message || 'Dados inválidos');
          break;
        case 401:
          console.error('Não autorizado:', data.error || data.message || 'Autenticação necessária');
          break;
        case 403:
          console.error('Proibido:', data.error || data.message || 'Token inválido ou expirado');
          break;
        case 404:
          console.error('Não encontrado:', data.error || data.message || 'Recurso não encontrado');
          break;
        case 429:
          console.error('Muitas requisições:', data.error || data.message || 'Limite de requisições excedido');
          break;
        case 500:
          console.error('Erro do servidor:', data.error || data.message || 'Erro interno do servidor');
          break;
        default:
          console.error(`Erro ${status}:`, data.error || data.message || 'Algo deu errado');
      }
    } else if (error.request) {
      console.error('Sem resposta do servidor. Verifique sua conexão com a internet.');
    } else {
      console.error('Erro na configuração da requisição:', error.message);
    }
    
    // Enviar erro para um serviço de monitoramento (opcional)
    this.logError(error);
    
    return error;
  },
  
  // Função para registrar erros (pode ser integrada com serviços de monitoramento)
  logError(error) {
    // Aqui você poderia integrar com Sentry, LogRocket, etc.
    // Por enquanto vamos apenas registrar no localStorage para não perder infos
    try {
      const errorLogs = JSON.parse(localStorage.getItem('api_error_logs') || '[]');
      errorLogs.push({
        timestamp: new Date().toISOString(),
        message: error.message,
        status: error.response?.status,
        endpoint: error.config?.url,
        method: error.config?.method,
        stack: error.stack
      });
      
      // Manter apenas os últimos 20 erros
      while (errorLogs.length > 20) {
        errorLogs.shift();
      }
      
      localStorage.setItem('api_error_logs', JSON.stringify(errorLogs));
    } catch (e) {
      console.error('Erro ao salvar log de erro:', e);
    }
  },
  
  // Métodos específicos para endpoints comuns
  auth: {
    login: (email, password) => ApiService.post('/api/auth/login', { email, password }),
    register: (name, email, password) => ApiService.post('/api/auth/register', { name, email, password }),
    me: () => ApiService.get('/api/auth/me'),
    refreshToken: (refreshToken) => ApiService.post('/api/auth/refresh-token', { refreshToken }),
    googleLogin: (token, email, name, picture) => ApiService.post('/api/auth/google-login', { token, email, name, picture }),
    logout: () => {
      SecureStorageService.clearAuth();
      return Promise.resolve({ success: true });
    }
  },
  
  flows: {
    getAll: () => ApiService.get('/api/flows'),
    getById: (id) => ApiService.get(`/api/flows/${id}`),
    create: (flowData) => ApiService.post('/api/flows', flowData),
    update: (id, flowData) => ApiService.put(`/api/flows/${id}`, flowData),
    delete: (id) => ApiService.delete(`/api/flows/${id}`),
    fromTemplate: (templateId) => ApiService.post(`/api/flows/from-template/${templateId}`),
    getFallback: (id) => {
      // Método de fallback para quando a API estiver offline
      try {
        const flows = JSON.parse(localStorage.getItem('flows') || '[]');
        const flow = flows.find(f => f.id === id);
        return Promise.resolve({ success: true, data: flow || null });
      } catch (e) {
        return Promise.resolve({ success: false, error: 'Erro ao buscar fluxo do cache' });
      }
    }
  },
  
  sharedFlows: {
    getByCode: (code) => ApiService.get(`/api/shared-flows/${code}`),
    getById: (code) => ApiService.get(`/api/shared-flows/${code}`),
    getPublic: (flowId) => ApiService.get(`/api/shared-flows/public/${flowId}`),
    share: (flowId) => ApiService.post('/api/shared-flows', { flowId, isPublic: true }),
    registerView: (code) => ApiService.post(`/api/shared-flows/${code}/view`),
    generateShareUrl: (flowId) => {
      // Gerar URL de compartilhamento mesmo offline
      const baseUrl = window.location.origin;
      const shareCode = btoa(`flow_${flowId}_${Date.now()}`).replace(/=/g, '');
      return Promise.resolve({
        success: true,
        data: {
          shareUrl: `${baseUrl}/flow/share/${shareCode}`,
          embedUrl: `${baseUrl}/embed/${shareCode}`,
          code: shareCode
        }
      });
    }
  },
  
  templates: {
    getAll: () => ApiService.get('/api/templates'),
    getById: (id) => ApiService.get(`/api/templates/${id}`)
  },
  
  plans: {
    getAll: () => ApiService.get('/api/planos'),
    createCheckout: (planData) => ApiService.post('/api/checkout', planData),
    verifySubscription: (paymentId) => ApiService.get(`/api/subscriptions/verify/${paymentId}`)
  },
  
  media: {
    uploadFile: (file, onProgress) => {
      const formData = new FormData();
      formData.append('file', file);
      
      return ApiService.post('/api/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      });
    },
    getAll: () => ApiService.get('/api/media'),
    delete: (id) => ApiService.delete(`/api/media/${id}`)
  }
};

export default ApiService;