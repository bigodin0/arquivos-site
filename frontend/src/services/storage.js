// src/services/storage.js
import ApiService from './apiService';
import SecureStorageService from './secureStorage';

// URL base da API - Obtida do apiConfig
const API_BASE_URL = ApiService.getBaseUrl();

const StorageService = {
  // Chaves para diferentes tipos de dados
  KEYS: {
    FLOWS: 'simulachat_flows',
    TEMPLATES: 'simulachat_templates',
    USER: 'simulachat_user',
    STATS: 'simulachat_stats',
    SHARED: 'simulachat_shared',
    MEDIA: 'simulachat_media'
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

  // Verifica se localStorage está disponível
  isLocalStorageAvailable: () => {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('localStorage não está disponível:', e);
      return false;
    }
  },

  // Garantir que temos um ID válido
  ensureValidId: (id) => {
    if (!id || id === 'undefined' || id === 'null') {
      // Gerar um ID único se não for fornecido ou inválido
      return `flow_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    return id;
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
          const response = await ApiService.flows.getAll();
          
          if (response && response.success) {
            // Salvar no cache
            StorageService.setCachedData('flows', response.data);
            return response.data;
          }
        } catch (apiError) {
          console.warn('Erro ao buscar fluxos da API:', apiError);
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
      // Garantir que temos um ID válido
      if (!flow.id || flow.id === 'undefined' || flow.id === 'null') {
        flow.id = StorageService.ensureValidId(flow.id);
        flow.createdAt = new Date().toLocaleDateString();
      }
      
      // Garantir que flow.messages seja sempre um array
      if (!flow.messages) {
        flow.messages = [];
      }
      
      // Calcular messageCount
      flow.messageCount = Array.isArray(flow.messages) ? flow.messages.length : 0;
      
      // Atualizar timestamp
      flow.updatedAt = new Date().toLocaleDateString();
      
      // Se tem um ID, é uma atualização
      if (flow.id) {
        return StorageService.updateFlow(flow);
      }
      
      // Preparar dados para a API
      const flowData = {
        title: flow.title || 'Novo Fluxo',
        description: flow.description || '',
        platform: flow.platform || 'whatsapp',
        messages: flow.messages || [],
        contactName: flow.contactName || 'Atendimento',
        id: flow.id
      };
      
      // Tentar salvar na API se o token for válido
      if (SecureStorageService.isTokenValid()) {
        try {
          const response = await ApiService.flows.create(flowData);
          
          if (response && response.success) {
            // Atualizar estatísticas
            StorageService.updateStats('flow_save');
            
            // Invalidar o cache de fluxos
            StorageService.invalidateCache('flows');
            
            return response.data;
          }
        } catch (apiError) {
          console.warn('Erro ao salvar fluxo na API:', apiError);
          // Continuar para fallback
        }
      }
      
      // Fallback: salvar localmente
      console.warn('Fallback: Salvando fluxo no localStorage');
      const flows = await StorageService.getFlows();
      
      // Usar o domínio atual para gerar links
      const baseUrl = window.location.origin;
      
      // Garantir que o link use o domínio atual
      if (!flow.link || flow.link.includes('simulachat.app')) {
        flow.link = `${baseUrl}/flow/${flow.id}`;
      }
      
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
          flow.id = StorageService.ensureValidId(flow.id);
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
    if (!flow) {
      console.error("Tentativa de atualizar um fluxo sem dados");
      return null;
    }
    
    // Garantir que temos um ID válido
    if (!flow.id || flow.id === 'undefined' || flow.id === 'null') {
      flow.id = StorageService.ensureValidId(flow.id);
      console.warn(`ID de fluxo inválido foi substituído por: ${flow.id}`);
    }
    
    try {
      // Garantir que flow.messages seja sempre um array
      if (!flow.messages) {
        flow.messages = [];
      }
      
      // Calcular messageCount
      flow.messageCount = Array.isArray(flow.messages) ? flow.messages.length : 0;
      
      // Atualizar o timestamp de atualização
      flow.updatedAt = new Date().toLocaleDateString();
      
      // Preparar dados para a API
      const flowData = {
        title: flow.title || 'Fluxo Atualizado',
        description: flow.description || '',
        platform: flow.platform || 'whatsapp',
        messages: flow.messages || [],
        contactName: flow.contactName || 'Atendimento',
        sharePageSettings: flow.sharePageSettings || {}
      };
      
      // Tentar atualizar na API se o token for válido
      if (SecureStorageService.isTokenValid()) {
        try {
          const response = await ApiService.flows.update(flow.id, flowData);
          
          if (response && response.success) {
            // Atualizar estatísticas
            StorageService.updateStats('flow_edit');
            
            // Invalidar cache
            StorageService.invalidateCache('flows');
            StorageService.invalidateCache(`flow_${flow.id}`);
            
            return response.data;
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
      }
      
      // Fallback: atualizar localmente
      console.warn('Fallback: Atualizando fluxo no localStorage');
      
      // Obter fluxos locais
      const storedFlows = localStorage.getItem(StorageService.KEYS.FLOWS);
      let flows = storedFlows ? JSON.parse(storedFlows) : [];
      
      // Procurar o fluxo pelo ID
      const index = flows.findIndex(f => f.id === flow.id);
      
      if (index === -1) {
        // Se o fluxo não existir, adicioná-lo como novo
        console.warn(`Fluxo com ID ${flow.id} não encontrado para atualização. Adicionando como novo.`);
        flow.createdAt = flow.createdAt || new Date().toLocaleDateString();
        flows.push(flow);
      } else {
        // Preservar a data de criação
        flow.createdAt = flows[index].createdAt;
        // Atualizar o fluxo no array
        flows[index] = flow;
      }
      
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
        
        if (index === -1) {
          // Se o fluxo não existir, adicioná-lo como novo
          console.warn(`Fluxo com ID ${flow.id} não encontrado para atualização. Adicionando como novo.`);
          flow.createdAt = flow.createdAt || new Date().toLocaleDateString();
          flowsArray.push(flow);
        } else {
          // Preservar a data de criação
          flow.createdAt = flowsArray[index].createdAt;
          flowsArray[index] = flow;
        }
        
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
    // Garantir que temos um ID válido
    if (!id || id === 'undefined' || id === 'null') {
      console.error("Tentativa de excluir um fluxo com ID inválido");
      return null;
    }
    
    try {
      // Tentar excluir na API se o token for válido
      if (SecureStorageService.isTokenValid()) {
        try {
          const response = await ApiService.flows.delete(id);
          
          if (response && response.success) {
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
    // Garantir que temos um ID válido
    if (!id || id === 'undefined' || id === 'null') {
      console.warn("getFlow: ID inválido fornecido");
      return null;
    }
    
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
          const response = await ApiService.flows.getById(id);
          
          if (response && response.success) {
            // Garantir que messages seja um array
            if (!response.data.messages) {
              response.data.messages = [];
            }
            // Salvar no cache
            StorageService.setCachedData(`flow_${id}`, response.data);
            return response.data;
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
      const flow = flowsArray.find(f => String(f.id) === String(id));
      
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
          const flow = flowsArray.find(f => String(f.id) === String(id));
          
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

  // === COMPARTILHAMENTO DE FLUXOS ===
  
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
  shareFlow: async (flowId) => {
    // Garantir que temos um ID válido
    if (!flowId || flowId === 'undefined' || flowId === 'null') {
      console.error("Tentativa de compartilhar um fluxo com ID inválido");
      return {
        success: false,
        error: 'ID de fluxo inválido'
      };
    }
    
    try {
      // Obter o fluxo
      let flowToShare;
      
      // Se for um ID, obter o fluxo
      if (typeof flowId !== 'object') {
        flowToShare = await StorageService.getFlow(flowId);
        
        if (!flowToShare) {
          return {
            success: false,
            error: 'Fluxo não encontrado'
          };
        }
      } else {
        // Se for um objeto de fluxo, usar diretamente
        flowToShare = flowId;
      }
      
      // Tentar compartilhar via API se o token for válido
      if (SecureStorageService.isTokenValid()) {
        try {
          const response = await ApiService.sharedFlows.share(flowToShare.id);
          
          if (response && response.success) {
            // Atualizar estatísticas
            StorageService.updateStats('flow_share');
            
            // Retornar dados do compartilhamento
            const shareUrl = `${window.location.origin}/shared/${response.data.shareId}`;
            const embedUrl = `${window.location.origin}/embed/${response.data.shareId}`;
            return {
              success: true,
              shareId: response.data.shareId,
              shareUrl,
              embedUrl
            };
          }
        } catch (apiError) {
          console.warn('Erro ao compartilhar fluxo via API:', apiError);
          // Continuar para fallback
        }
      }
      
      // Fallback: compartilhar localmente
      console.warn('Fallback: Compartilhando fluxo localmente');
      
      // Gerar ID de compartilhamento
      const shareId = `f${flowToShare.id}_${StorageService.generateShareId()}`;
      
      // Obter fluxos compartilhados existentes
      const sharedFlows = StorageService.getSharedFlows();
      
      // Adicionar novo compartilhamento
      sharedFlows[shareId] = {
        flow: flowToShare,
        createdAt: new Date().toISOString(),
        views: 0
      };
      
      // Salvar no localStorage
      localStorage.setItem(StorageService.KEYS.SHARED, JSON.stringify(sharedFlows));
      
      // Atualizar estatísticas
      StorageService.updateStats('flow_share');
      
      // Construir URLs de compartilhamento
      const shareUrl = `${window.location.origin}/shared/${shareId}`;
      const embedUrl = `${window.location.origin}/embed/${shareId}`;
      
      return {
        success: true,
        shareId,
        shareUrl,
        embedUrl
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
    if (!shareId) {
      return null;
    }
    
    try {
      // Verificar cache primeiro
      const cachedSharedFlow = StorageService.getCachedData(`shared_flow_${shareId}`);
      if (cachedSharedFlow) {
        console.log(`Usando fluxo compartilhado ${shareId} do cache`);
        return cachedSharedFlow;
      }
      
      // Tentar obter da API
      try {
        const response = await ApiService.sharedFlows.getById(shareId);
        if (response && response.success) {
          // Salvar no cache
          StorageService.setCachedData(`shared_flow_${shareId}`, response.data);
          
          // Registrar visualização
          try {
            await ApiService.sharedFlows.registerView(shareId);
          } catch (viewError) {
            console.warn('Erro ao registrar visualização:', viewError);
          }
          
          return response.data;
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

  // === ARQUIVOS DE MÍDIA ===
  
  // Obter arquivos de mídia
  getMediaFiles: async () => {
    try {
      // Verificar cache primeiro
      const cachedMedia = StorageService.getCachedData('media_files');
      if (cachedMedia) {
        console.log('Usando arquivos de mídia do cache');
        return cachedMedia;
      }
      
      // Tentar obter da API se o token for válido
      if (SecureStorageService.isTokenValid()) {
        try {
          const response = await ApiService.media.getAll();
          
          if (response && response.success) {
            // Salvar no cache
            StorageService.setCachedData('media_files', response.data);
            return response.data;
          }
        } catch (apiError) {
          console.warn('Erro ao buscar arquivos de mídia da API:', apiError);
          // Continuar para fallback
        }
      }
      
      // Fallback para localStorage
      console.warn('Fallback: Usando arquivos de mídia do localStorage');
      const media = localStorage.getItem(StorageService.KEYS.MEDIA);
      const parsedMedia = media ? JSON.parse(media) : [];
      
      // Mockar alguns arquivos de mídia para desenvolvimento
      if (parsedMedia.length === 0) {
        const mockMedia = [
          {
            id: 'media_1',
            name: 'imagem_exemplo.jpg',
            type: 'image/jpeg',
            url: 'https://via.placeholder.com/300x200',
            size: 12345,
            createdAt: new Date().toISOString()
          },
          {
            id: 'media_2',
            name: 'video_exemplo.mp4',
            type: 'video/mp4',
            url: 'https://example.com/video.mp4',
            size: 98765,
            createdAt: new Date().toISOString()
          }
        ];
        
        localStorage.setItem(StorageService.KEYS.MEDIA, JSON.stringify(mockMedia));
        
        // Salvar no cache
        StorageService.setCachedData('media_files', mockMedia);
        
        return mockMedia;
      }
      
      // Salvar no cache
      StorageService.setCachedData('media_files', parsedMedia);
      
      return parsedMedia;
    } catch (error) {
      console.error('Erro ao buscar arquivos de mídia:', error);
      // Fallback para array vazio em vez de null
      return [];
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

  // Método para obter um fluxo compartilhado para exibição pública
  getFlowForPublicSharing: async (flowId) => {
    if (!flowId || flowId === 'undefined' || flowId === 'null') {
      console.error("ID inválido fornecido para compartilhamento público");
      return null;
    }

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
        const response = await ApiService.sharedFlows.getPublic(flowId);
        
        if (response && response.success) {
          console.log("Fluxo encontrado na API:", flowId);
          // Garantir que messages seja um array
          if (!response.data.flow.messages) {
            response.data.flow.messages = [];
          }
          // Salvar no cache
          StorageService.setCachedData(`public_flow_${flowId}`, response.data);
          return response.data;
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
    
    // Tentativa 1: Procurar nos fluxos compartilhados locais
    const sharedFlows = StorageService.getSharedFlows();
    
    // Procurar um compartilhamento que tenha esse flowId
    const matchingShare = Object.entries(sharedFlows).find(([key, share]) => 
      share.flow && String(share.flow.id) === String(flowId)
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
    
    // Tentativa 2: Se não encontrou nos compartilhamentos, tentar encontrar nos fluxos locais
    const flow = await StorageService.getFlow(flowId);
    if (flow) {
      console.log("Fluxo encontrado localmente:", flowId);
      
      // Garantir que messages seja um array
      if (!flow.messages) {
        flow.messages = [];
      }
      
      const flowData = {
        flow: {
          id: flow.id,
          title: flow.title || 'Fluxo Compartilhado',
          description: flow.description || '',
          platform: flow.platform || 'whatsapp',
          contactName: flow.contactName || 'Atendimento',
          messages: flow.messages || [],
          sharePageSettings: flow.sharePageSettings || {}
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
  },

  // Fixar links existentes para usar o domínio atual
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
  }
};

export default StorageService;