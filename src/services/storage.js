// Serviço para gerenciar o armazenamento dos fluxos de mensagens
import axios from 'axios';
import SecureStorageService from './secureStorage';

// URL base da API - Detecção dinâmica do ambiente
const isDevelopment = process.env.NODE_ENV === 'development';
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5000/api'  // URL de desenvolvimento
  : 'https://simulachat-backend.onrender.com/api'; // URL de produção

const StorageService = {
  // Chaves para diferentes tipos de dados (mantidas para compatibilidade)
  KEYS: {
    FLOWS: 'simulachat_flows',
    TEMPLATES: 'simulachat_templates',
    USER: 'simulachat_user',
    STATS: 'simulachat_stats',
    SHARED: 'simulachat_shared'
  },

  // Funções de cache
  getCachedData: (key, ttl = 3600000) => { // 1 hora por padrão
    const cached = localStorage.getItem(`cache_${key}`);
    if (!cached) return null;
    
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > ttl) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }
      return data;
    } catch (e) {
      localStorage.removeItem(`cache_${key}`);
      return null;
    }
  },

  setCachedData: (key, data) => {
    const cache = { 
      data, 
      timestamp: Date.now() 
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(cache));
  },

  invalidateCache: (key) => {
    localStorage.removeItem(`cache_${key}`);
  },

  // Verificar se há um usuário logado (usando SecureStorageService)
  isUserLoggedIn: () => {
    return SecureStorageService.isTokenValid();
  },

  // Obter o token de autenticação para chamadas API (usando SecureStorageService)
  getAuthToken: () => {
    return SecureStorageService.getToken();
  },

  // Método para obter headers de autenticação com melhor tratamento
  getAuthHeaders: () => {
    // Usar SecureStorageService para obter headers de autenticação
    const authHeaders = SecureStorageService.getAuthHeaders();
    if (authHeaders && authHeaders.headers) {
      return authHeaders.headers;
    }
    
    // Fallback para o caso de SecureStorageService não retornar headers válidos
    return {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? '*' : null
    };
  },

  // Método para chamadas de API com tratamento de erros e token
  makeApiCall: async (endpoint, method = 'GET', data = null) => {
    try {
      // Verificar se o token é válido
      if (!SecureStorageService.isTokenValid()) {
        throw new Error('Não autenticado');
      }

      // Obter headers de autenticação usando SecureStorageService
      const headers = SecureStorageService.getAuthHeaders().headers;

      const config = {
        method,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`${API_BASE_URL}/${endpoint}`, config);

      if (response.status === 401 || response.status === 403) {
        // Token inválido ou expirado, limpar token
        SecureStorageService.clearToken();
        window.location.href = '/login';
        throw new Error('Sessão expirada');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro na chamada da API:', error);
      throw error;
    }
  },

  // === FLUXOS ===
  
  // Obter todos os fluxos
  getFlows: async () => {
    try {
      // Verificar cache primeiro
      const cachedFlows = StorageService.getCachedData('flows');
      if (cachedFlows) {
        console.log('Usando fluxos do cache');
        return cachedFlows;
      }

      // Primeiro tenta obter da API se o token for válido
      if (SecureStorageService.isTokenValid()) {
        try {
          // Obter headers de autenticação usando SecureStorageService
          const headers = SecureStorageService.getAuthHeaders().headers;
          
          const response = await axios.get(`${API_BASE_URL}/flows`, { headers });
          
          if (response.data.success) {
            // Salvar no cache
            StorageService.setCachedData('flows', response.data.data);
            return response.data.data;
          }
        } catch (apiError) {
          console.warn('Erro ao buscar fluxos da API:', apiError);
          
          // Verificar se é um erro de autenticação
          if (apiError.response && apiError.response.status === 401) {
            // Token inválido ou expirado, limpar token
            SecureStorageService.clearToken();
          }
          
          // Continuar para fallback
        }
      }
      
      // Fallback para localStorage
      console.warn('Fallback: Usando fluxos do localStorage');
      const flows = localStorage.getItem(StorageService.KEYS.FLOWS);
      const parsedFlows = flows ? JSON.parse(flows) : [];
      
      // Salvar no cache
      StorageService.setCachedData('flows', parsedFlows);
      
      return parsedFlows;
    } catch (error) {
      console.error('Erro ao buscar fluxos:', error);
      // Fallback para array vazio em vez de null
      return [];
    }
  },

  // Salvar um fluxo
  saveFlow: async (flow) => {
    try {
      // Se tem um ID, é uma atualização
      if (flow.id) {
        return StorageService.updateFlow(flow);
      }
      
      // Preparar dados para a API
      const flowData = {
        title: flow.title,
        description: flow.description,
        platform: flow.platform || 'whatsapp',
        messages: flow.messages || [],
        contactName: flow.contactName || 'Atendimento'
      };
      
      // Tentar salvar na API se o token for válido
      if (SecureStorageService.isTokenValid()) {
        try {
          // Obter headers de autenticação usando SecureStorageService
          const headers = SecureStorageService.getAuthHeaders().headers;
          
          const response = await axios.post(`${API_BASE_URL}/flows`, flowData, { headers });
          
          if (response.data.success) {
            // Atualizar estatísticas
            StorageService.updateStats('flow_save');
            
            // Invalidar o cache de fluxos
            StorageService.invalidateCache('flows');
            
            return response.data.data;
          }
        } catch (apiError) {
          console.warn('Erro ao salvar fluxo na API:', apiError);
          
          // Verificar se é um erro de autenticação
          if (apiError.response && apiError.response.status === 401) {
            // Token inválido ou expirado, limpar token
            SecureStorageService.clearToken();
          }
          
          // Continuar para fallback
        }
      }
      
      // Fallback: salvar localmente
      console.warn('Fallback: Salvando fluxo no localStorage');
      const flows = await StorageService.getFlows();
      
      // Usar o domínio atual para gerar links
      const baseUrl = window.location.origin;
      
      // Se é um novo fluxo, gere um ID
      if (!flow.id) {
        flow.id = Date.now();
        flow.createdAt = new Date().toLocaleDateString();
        
        // Garantir que o link use o domínio atual
        if (!flow.link || flow.link.includes('simulachat.app')) {
          flow.link = `${baseUrl}/flow/${flow.id}`;
        }
      }
      
      flow.updatedAt = new Date().toLocaleDateString();
      
      // Garantir que flow.messages seja sempre um array
      if (!flow.messages) {
        flow.messages = [];
      }
      
      // Calcular messageCount
      flow.messageCount = Array.isArray(flow.messages) ? flow.messages.length : 0;
      
      // Adicionar ao array de fluxos
      flows.push(flow);
      
      // Salvar no localStorage
      localStorage.setItem(StorageService.KEYS.FLOWS, JSON.stringify(flows));
      
      // Atualizar estatísticas
      StorageService.updateStats('flow_save');
      
      // Invalidar o cache de fluxos
      StorageService.invalidateCache('flows');
      
      return flow;
    } catch (error) {
      console.error('Erro ao salvar fluxo:', error);
      // Último fallback: tentar salvar apenas no localStorage
      try {
        const flows = localStorage.getItem(StorageService.KEYS.FLOWS);
        const flowsArray = flows ? JSON.parse(flows) : [];
        
        // Gerar ID se necessário
        if (!flow.id) {
          flow.id = Date.now();
          flow.createdAt = new Date().toLocaleDateString();
        }
        
        flow.updatedAt = new Date().toLocaleDateString();
        
        // Garantir que flow.messages seja sempre um array
        if (!flow.messages) {
          flow.messages = [];
        }
        
        // Calcular messageCount
        flow.messageCount = Array.isArray(flow.messages) ? flow.messages.length : 0;
        
        // Verificar se já existe
        const existingIndex = flowsArray.findIndex(f => f.id === flow.id);
        if (existingIndex !== -1) {
          flowsArray[existingIndex] = flow;
        } else {
          flowsArray.push(flow);
        }
        
        localStorage.setItem(StorageService.KEYS.FLOWS, JSON.stringify(flowsArray));
        StorageService.updateStats('flow_save');
        
        // Invalidar o cache de fluxos
        StorageService.invalidateCache('flows');
        
        return flow;
      } catch (localError) {
        console.error('Erro no fallback local:', localError);
        return null;
      }
    }
  },

  // Atualizar um fluxo existente
  updateFlow: async (flow) => {
    if (!flow || !flow.id) {
      console.error("Tentativa de atualizar um fluxo sem ID");
      return null;
    }
    
    try {
      // Garantir que flow.messages seja sempre um array
      if (!flow.messages) {
        flow.messages = [];
      }
      
      // Calcular messageCount
      flow.messageCount = Array.isArray(flow.messages) ? flow.messages.length : 0;
      
      // Preparar dados para a API
      const flowData = {
        title: flow.title,
        description: flow.description,
        platform: flow.platform || 'whatsapp',
        messages: flow.messages || [],
        contactName: flow.contactName || 'Atendimento'
      };
      
      // Tentar atualizar na API se o token for válido
      if (SecureStorageService.isTokenValid()) {
        try {
          // Obter headers de autenticação usando SecureStorageService
          const headers = SecureStorageService.getAuthHeaders().headers;
          
          const response = await axios.put(`${API_BASE_URL}/flows/${flow.id}`, flowData, { headers });
          
          if (response.data.success) {
            // Atualizar estatísticas
            StorageService.updateStats('flow_edit');
            
            // Invalidar cache
            StorageService.invalidateCache('flows');
            StorageService.invalidateCache(`flow_${flow.id}`);
            
            return response.data.data;
          }
        } catch (apiError) {
          console.warn('Erro ao atualizar fluxo na API:', apiError);
          
          // Verificar se é um erro de autenticação
          if (apiError.response && apiError.response.status === 401) {
            // Token inválido ou expirado, limpar token
            SecureStorageService.clearToken();
          }
          
          // Continuar para fallback
        }
      }// Fallback: atualizar localmente
      console.warn('Fallback: Atualizando fluxo no localStorage');
      
      const flows = await StorageService.getFlows();
      const index = flows.findIndex(f => f.id === flow.id);
      
      if (index === -1) {
        console.error(`Fluxo com ID ${flow.id} não encontrado para atualização`);
        return null;
      }
      
      // Atualizar o timestamp de atualização
      flow.updatedAt = new Date().toLocaleDateString();
      
      // Atualizar o fluxo no array
      flows[index] = flow;
      
      // Salvar no localStorage
      localStorage.setItem(StorageService.KEYS.FLOWS, JSON.stringify(flows));
      
      // Atualizar estatísticas
      StorageService.updateStats('flow_edit');
      
      // Invalidar cache
      StorageService.invalidateCache('flows');
      StorageService.invalidateCache(`flow_${flow.id}`);
      
      return flow;
    } catch (error) {
      console.error('Erro ao atualizar fluxo:', error);
      // Último fallback: tentar atualizar apenas no localStorage
      try {
        const flows = localStorage.getItem(StorageService.KEYS.FLOWS);
        const flowsArray = flows ? JSON.parse(flows) : [];
        
        const index = flowsArray.findIndex(f => f.id === flow.id);
        if (index === -1) return null;
        
        flow.updatedAt = new Date().toLocaleDateString();
        
        // Garantir que flow.messages seja sempre um array
        if (!flow.messages) {
          flow.messages = [];
        }
        
        // Calcular messageCount
        flow.messageCount = Array.isArray(flow.messages) ? flow.messages.length : 0;
        
        flowsArray[index] = flow;
        
        try {
          localStorage.setItem(StorageService.KEYS.FLOWS, JSON.stringify(flowsArray));
          StorageService.updateStats('flow_edit');
          
          // Invalidar cache
          StorageService.invalidateCache('flows');
          StorageService.invalidateCache(`flow_${flow.id}`);
          
          return flow;
        } catch (storageError) {
          console.error('Erro ao salvar no localStorage:', storageError);
          return null;
        }
      } catch (localError) {
        console.error('Erro no fallback local:', localError);
        return null;
      }
    }
  },

  // Excluir um fluxo
  deleteFlow: async (id) => {
    try {
      // Tentar excluir na API se o token for válido
      if (SecureStorageService.isTokenValid()) {
        try {
          // Obter headers de autenticação usando SecureStorageService
          const headers = SecureStorageService.getAuthHeaders().headers;
          
          const response = await axios.delete(`${API_BASE_URL}/flows/${id}`, { headers });
          
          if (response.data.success) {
            // Atualizar estatísticas
            StorageService.updateStats('flow_delete');
            
            // Invalidar cache
            StorageService.invalidateCache('flows');
            StorageService.invalidateCache(`flow_${id}`);
            
            // Obter lista atualizada
            return await StorageService.getFlows();
          }
        } catch (apiError) {
          console.warn('Erro ao excluir fluxo na API:', apiError);
          
          // Verificar se é um erro de autenticação
          if (apiError.response && apiError.response.status === 401) {
            // Token inválido ou expirado, limpar token
            SecureStorageService.clearToken();
          }
          
          // Continuar para fallback
        }
      }
      
      // Fallback: excluir localmente
      console.warn('Fallback: Excluindo fluxo do localStorage');
      
      const flows = await StorageService.getFlows();
      const updatedFlows = flows.filter(f => f.id !== id);
      localStorage.setItem(StorageService.KEYS.FLOWS, JSON.stringify(updatedFlows));
      
      // Atualizar estatísticas
      StorageService.updateStats('flow_delete');
      
      // Invalidar cache
      StorageService.invalidateCache('flows');
      StorageService.invalidateCache(`flow_${id}`);
      
      return updatedFlows;
    } catch (error) {
      console.error('Erro ao excluir fluxo:', error);
      // Último fallback: tentar excluir apenas no localStorage
      try {
        const flows = localStorage.getItem(StorageService.KEYS.FLOWS);
        const flowsArray = flows ? JSON.parse(flows) : [];
        
        const updatedFlows = flowsArray.filter(f => f.id !== id);
        
        try {
          localStorage.setItem(StorageService.KEYS.FLOWS, JSON.stringify(updatedFlows));
          StorageService.updateStats('flow_delete');
          
          // Invalidar cache
          StorageService.invalidateCache('flows');
          StorageService.invalidateCache(`flow_${id}`);
          
          return updatedFlows;
        } catch (storageError) {
          console.error('Erro ao salvar no localStorage:', storageError);
          return flowsArray;
        }
      } catch (localError) {
        console.error('Erro no fallback local:', localError);
        const flows = localStorage.getItem(StorageService.KEYS.FLOWS);
        return flows ? JSON.parse(flows) : [];
      }
    }
  },

  // Obter um fluxo específico
  getFlow: async (id) => {
    try {
      // Verificar cache primeiro
      const cachedFlow = StorageService.getCachedData(`flow_${id}`);
      if (cachedFlow) {
        console.log(`Usando fluxo ${id} do cache`);
        return cachedFlow;
      }
      
      // Tentar obter da API se o token for válido
      if (SecureStorageService.isTokenValid()) {
        try {
          // Obter headers de autenticação usando SecureStorageService
          const headers = SecureStorageService.getAuthHeaders().headers;
          
          const response = await axios.get(`${API_BASE_URL}/flows/${id}`, { headers });
          
          if (response.data.success) {
            // Garantir que messages seja um array
            if (!response.data.data.messages) {
              response.data.data.messages = [];
            }
            // Salvar no cache
            StorageService.setCachedData(`flow_${id}`, response.data.data);
            return response.data.data;
          }
        } catch (apiError) {
          console.warn('Erro ao obter fluxo da API:', apiError);
          
          // Verificar se é um erro de autenticação
          if (apiError.response && apiError.response.status === 401) {
            // Token inválido ou expirado, limpar token
            SecureStorageService.clearToken();
          }
          
          // Continuar para fallback
        }
      }
      
      // Fallback: obter localmente
      console.warn('Fallback: Obtendo fluxo do localStorage');
      
      const flows = localStorage.getItem(StorageService.KEYS.FLOWS);
      if (!flows) return null;
      
      const flowsArray = JSON.parse(flows);
      const flow = flowsArray.find(f => Number(f.id) === Number(id));
      
      // Garantir que messages seja um array
      if (flow && !flow.messages) {
        flow.messages = [];
      }
      
      // Salvar no cache se encontrado
      if (flow) {
        StorageService.setCachedData(`flow_${id}`, flow);
      }
      
      return flow;
    } catch (error) {
      console.error('Erro ao obter fluxo:', error);
      // Último fallback: tentar obter diretamente do localStorage
      try {
        const flows = localStorage.getItem(StorageService.KEYS.FLOWS);
        if (!flows) return null;
        
        try {
          const flowsArray = JSON.parse(flows);
          const flow = flowsArray.find(f => Number(f.id) === Number(id));
          
          // Garantir que messages seja um array
          if (flow && !flow.messages) {
            flow.messages = [];
          }
          
          return flow;
        } catch (parseError) {
          console.error('Erro ao analisar fluxos:', parseError);
          return null;
        }
      } catch (localError) {
        console.error('Erro no fallback local:', localError);
        return null;
      }
    }
  },

  // Método para obter um fluxo compartilhado para exibição pública
  getFlowForPublicSharing: async (flowId) => {
    console.log("Buscando fluxo público com ID:", flowId);
    
    try {
      // Verificar cache primeiro
      const cachedPublicFlow = StorageService.getCachedData(`public_flow_${flowId}`);
      if (cachedPublicFlow) {
        console.log(`Usando fluxo público ${flowId} do cache`);
        return cachedPublicFlow;
      }
      
      // Tentar obter do backend (usando o ID original)
      try {
        const response = await axios.get(`${API_BASE_URL}/shared-flows/${flowId}`);
        
        if (response.data.success) {
          console.log("Fluxo encontrado na API:", flowId);
          // Garantir que messages seja um array
          if (!response.data.data.flow.messages) {
            response.data.data.flow.messages = [];
          }
          // Salvar no cache
          StorageService.setCachedData(`public_flow_${flowId}`, response.data.data);
          return response.data.data;
        }
      } catch (apiError) {
        console.warn('Erro ao buscar fluxo compartilhado da API:', apiError);
        // Continuar para fallback
      }
    } catch (error) {
      console.error("Erro ao buscar fluxo na API:", error);
    }
    
    // Se falhar, tenta usar o fallback local
    console.warn('Fallback: Buscando fluxo compartilhado no localStorage');
    
    // Tentativa 2: Procurar nos fluxos compartilhados locais
    const sharedFlows = StorageService.getSharedFlows();
    
    // Procurar um compartilhamento que tenha esse flowId
    const matchingShare = Object.entries(sharedFlows).find(([key, share]) => 
      share.flow && Number(share.flow.id) === Number(flowId)
    );
    
    if (matchingShare) {
      const [shareKey, shareData] = matchingShare;
      console.log("Fluxo compartilhado encontrado localmente:", shareKey);
      
      // Garantir que messages seja um array
      if (!shareData.flow.messages) {
        shareData.flow.messages = [];
      }
      
      // Salvar no cache
      StorageService.setCachedData(`public_flow_${flowId}`, shareData);
      return shareData;
    }
    
    // Se não encontrou nos compartilhamentos, tentar encontrar nos fluxos locais
    const flow = await StorageService.getFlow(flowId);
    if (flow) {
      console.log("Fluxo encontrado localmente:", flowId);
      
      // Garantir que messages seja um array
      if (!flow.messages) {
        flow.messages = [];
      }
      
      const flowData = {
        flow: {
          title: flow.title,
          description: flow.description,
          platform: flow.platform || 'whatsapp',
          contactName: flow.contactName || 'Atendimento',
          messages: flow.messages || []
        },
        createdAt: new Date().toISOString(),
        views: 0
      };
      
      // Salvar no cache
      StorageService.setCachedData(`public_flow_${flowId}`, flowData);
      
      return flowData;
    }
    
    console.error("Fluxo não encontrado em nenhum lugar:", flowId);
    return null;
  },// Fixar links existentes para usar o domínio atual
  fixExistingLinks: async () => {
    const flows = await StorageService.getFlows();
    const baseUrl = window.location.origin;
    let updated = false;
    
    const updatedFlows = flows.map(flow => {
      // Verificar se o link usa simulachat.vercel.app ou similar
      if (flow.link && (
        flow.link.includes('simulachat.vercel.app') || 
        flow.link.includes('simulachat.app') ||
        flow.link.includes('localhost')
      )) {
        // Atualizar para usar o domínio atual
        flow.link = `${baseUrl}/flow/${flow.id}`;
        updated = true;
      }
      return flow;
    });
    
    if (updated) {
      localStorage.setItem(StorageService.KEYS.FLOWS, JSON.stringify(updatedFlows));
      
      // Invalidar cache
      StorageService.invalidateCache('flows');
      
      console.log('Links atualizados para usar o domínio atual');
    }
    
    return updatedFlows;
  },

  // === TEMPLATES ===
  
  // Obter todos os templates
  getTemplates: async () => {
    try {
      // Verificar cache primeiro
      const cachedTemplates = StorageService.getCachedData('templates');
      if (cachedTemplates) {
        console.log('Usando templates do cache');
        return cachedTemplates;
      }
      
      // Tentar obter da API com token seguro
      if (SecureStorageService.isTokenValid()) {
        try {
          // Obter headers de autenticação usando SecureStorageService
          const headers = SecureStorageService.getAuthHeaders().headers;
          
          const response = await axios.get(`${API_BASE_URL}/templates`, { headers });
          if (response.data.success) {
            // Salvar no cache
            StorageService.setCachedData('templates', response.data.data);
            return response.data.data;
          }
        } catch (apiError) {
          console.warn('Erro ao buscar templates da API:', apiError);
          
          // Verificar se é um erro de autenticação
          if (apiError.response && apiError.response.status === 401) {
            // Token inválido ou expirado, limpar token
            SecureStorageService.clearToken();
          }
          
          // Continuar para fallback
        }
      }
      
      // Fallback para localStorage
      console.warn('Fallback: Usando templates do localStorage');
      const templates = localStorage.getItem(StorageService.KEYS.TEMPLATES);
      const parsedTemplates = templates ? JSON.parse(templates) : [];
      
      // Salvar no cache
      StorageService.setCachedData('templates', parsedTemplates);
      
      return parsedTemplates;
    } catch (error) {
      console.error('Erro ao obter templates:', error);
      // Último fallback
      const templates = localStorage.getItem(StorageService.KEYS.TEMPLATES);
      return templates ? JSON.parse(templates) : [];
    }
  },

  // Salvar templates
  saveTemplates: (templates) => {
    try {
      localStorage.setItem(StorageService.KEYS.TEMPLATES, JSON.stringify(templates));
      
      // Invalidar cache
      StorageService.invalidateCache('templates');
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar templates:', error);
      return false;
    }
  },

  // === USUÁRIO ===
  
  // Salvar dados do usuário
  saveUser: (user) => {
    try {
      localStorage.setItem(StorageService.KEYS.USER, JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      return false;
    }
  },

  // Obter dados do usuário
  getUser: () => {
    try {
      const user = localStorage.getItem(StorageService.KEYS.USER);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      return null;
    }
  },

  // Limpar dados do usuário
  clearUser: () => {
    try {
      localStorage.removeItem(StorageService.KEYS.USER);
      
      // Limpar token usando SecureStorageService
      SecureStorageService.clearToken();
      
      return true;
    } catch (error) {
      console.error('Erro ao limpar usuário:', error);
      return false;
    }
  },

  // === ESTATÍSTICAS ===
  
  // Obter estatísticas
  getStats: () => {
    try {
      const stats = localStorage.getItem(StorageService.KEYS.STATS);
      const parsedStats = stats ? JSON.parse(stats) : {
        flow_create: 0,
        flow_edit: 0,
        flow_save: 0,
        flow_delete: 0,
        flow_share: 0,
        flow_view: 0,
        share_view: 0,
        lastLoaded: new Date().toLocaleDateString()
      };
      
      return parsedStats;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      // Retornar estatísticas padrão
      return {
        flow_create: 0,
        flow_edit: 0,
        flow_save: 0,
        flow_delete: 0,
        flow_share: 0,
        flow_view: 0,
        share_view: 0,
        lastLoaded: new Date().toLocaleDateString()
      };
    }
  },

  // Atualizar estatísticas
  updateStats: (action) => {
    try {
      const stats = StorageService.getStats();
      
      // Incrementar a ação específica
      if (stats[action] !== undefined) {
        stats[action]++;
      } else {
        stats[action] = 1;
      }
      
      stats.lastUpdated = new Date().toLocaleDateString();
      
      // Salvar no localStorage
      localStorage.setItem(StorageService.KEYS.STATS, JSON.stringify(stats));
      
      return stats;
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
      return null;
    }
  },

  // === COMPARTILHAMENTO ===
  
  // Obter fluxos compartilhados
  getSharedFlows: () => {
    try {
      const shared = localStorage.getItem(StorageService.KEYS.SHARED);
      return shared ? JSON.parse(shared) : {};
    } catch (error) {
      console.error('Erro ao obter fluxos compartilhados:', error);
      return {};
    }
  },

  // Gerar um ID único para compartilhamento
  generateShareId: () => {
    // Gerar um ID aleatório de 8 caracteres
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    
    return result;
  },

  // Compartilhar um fluxo
  shareFlow: async (flow) => {
    try {
      // Tentar compartilhar via API se o token for válido
      if (SecureStorageService.isTokenValid()) {
        try {
          // Preparar dados para compartilhamento
          const shareData = {
            flowId: flow.id,
            isPublic: true
          };
          
          // Obter headers de autenticação usando SecureStorageService
          const headers = SecureStorageService.getAuthHeaders().headers;
          
          const response = await axios.post(`${API_BASE_URL}/shared-flows`, shareData, { headers });
          
          if (response.data.success) {
            // Atualizar estatísticas
            StorageService.updateStats('flow_share');
            
            // Retornar dados do compartilhamento
            const shareUrl = `${window.location.origin}/shared/${response.data.data.shareId}`;
            return {
              success: true,
              shareId: response.data.data.shareId,
              shareUrl
            };
          }
        } catch (apiError) {
          console.warn('Erro ao compartilhar fluxo via API:', apiError);
          
          // Verificar se é um erro de autenticação
          if (apiError.response && apiError.response.status === 401) {
            // Token inválido ou expirado, limpar token
            SecureStorageService.clearToken();
          }
          
          // Continuar para fallback
        }
      }
      
      // Fallback: compartilhar localmente
      console.warn('Fallback: Compartilhando fluxo localmente');
      
      // Gerar ID de compartilhamento
      const shareId = StorageService.generateShareId();
      
      // Obter fluxos compartilhados existentes
      const sharedFlows = StorageService.getSharedFlows();
      
      // Adicionar novo compartilhamento
      sharedFlows[shareId] = {
        flow: flow,
        createdAt: new Date().toISOString(),
        views: 0
      };
      
      // Salvar no localStorage
      localStorage.setItem(StorageService.KEYS.SHARED, JSON.stringify(sharedFlows));
      
      // Atualizar estatísticas
      StorageService.updateStats('flow_share');
      
      // Construir URL de compartilhamento
      const shareUrl = `${window.location.origin}/shared/${shareId}`;
      
      return {
        success: true,
        shareId,
        shareUrl
      };
    } catch (error) {
      console.error('Erro ao compartilhar fluxo:', error);
      return {
        success: false,
        error: 'Não foi possível compartilhar o fluxo'
      };
    }
  },

  // Obter um fluxo compartilhado pelo ID
  getSharedFlow: async (shareId) => {
    try {
      // Verificar cache primeiro
      const cachedSharedFlow = StorageService.getCachedData(`shared_flow_${shareId}`);
      if (cachedSharedFlow) {
        console.log(`Usando fluxo compartilhado ${shareId} do cache`);
        return cachedSharedFlow;
      }
      
      // Tentar obter da API
      try {
        const response = await axios.get(`${API_BASE_URL}/shared-flows/${shareId}`);
        if (response.data.success) {
          // Salvar no cache
          StorageService.setCachedData(`shared_flow_${shareId}`, response.data.data);
          
          // Registrar visualização
          try {
            await axios.post(`${API_BASE_URL}/shared-flows/${shareId}/view`);
          } catch (viewError) {
            console.warn('Erro ao registrar visualização:', viewError);
          }
          
          return response.data.data;
        }
      } catch (apiError) {
        console.warn('Erro ao buscar fluxo compartilhado da API:', apiError);
        // Continuar para fallback
      }
      
      // Fallback: buscar localmente
      console.warn('Fallback: Buscando fluxo compartilhado localmente');
      
      const sharedFlows = StorageService.getSharedFlows();
      const sharedFlow = sharedFlows[shareId];
      
      if (sharedFlow) {
        // Incrementar contagem de visualizações
        sharedFlow.views = (sharedFlow.views || 0) + 1;
        localStorage.setItem(StorageService.KEYS.SHARED, JSON.stringify(sharedFlows));
        
        // Atualizar estatísticas
        StorageService.updateStats('share_view');
        
        // Salvar no cache
        StorageService.setCachedData(`shared_flow_${shareId}`, sharedFlow);
        
        return sharedFlow;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao obter fluxo compartilhado:', error);
      // Último fallback
      try {
        const sharedFlows = StorageService.getSharedFlows();
        return sharedFlows[shareId] || null;
      } catch (localError) {
        console.error('Erro no fallback local:', localError);
        return null;
      }
    }
  },

  // Incrementar visualizações de um fluxo compartilhado
  incrementSharedFlowViews: async (shareId) => {
    try {
      // Tentar incrementar na API
      try {
        await axios.post(`${API_BASE_URL}/shared-flows/${shareId}/view`);
        return true;
      } catch (apiError) {
        console.warn('Erro ao incrementar visualizações na API:', apiError);
        // Continuar para fallback
      }
      
      // Fallback: incrementar localmente
      console.warn('Fallback: Incrementando visualizações localmente');
      
      const sharedFlows = StorageService.getSharedFlows();
      const sharedFlow = sharedFlows[shareId];
      
      if (sharedFlow) {
        // Incrementar contagem de visualizações
        sharedFlow.views = (sharedFlow.views || 0) + 1;
        localStorage.setItem(StorageService.KEYS.SHARED, JSON.stringify(sharedFlows));
        
        // Atualizar estatísticas
        StorageService.updateStats('share_view');
        
        // Invalidar cache
        StorageService.invalidateCache(`shared_flow_${shareId}`);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao incrementar visualizações:', error);
      return false;
    }
  }
};

export default StorageService;