// Serviço para gerenciar o armazenamento dos fluxos de mensagens
import axios from 'axios';

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

  // Verificar se há um usuário logado
  isUserLoggedIn: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Obter o token de autenticação para chamadas API
  getAuthToken: () => {
    return localStorage.getItem('token');
  },

  // Obter headers para requisições autenticadas
  getAuthHeaders: () => {
    const token = StorageService.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
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

      // Primeiro tenta obter da API
      const token = StorageService.getAuthToken();
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/flows`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.data.success) {
            // Salvar no cache
            StorageService.setCachedData('flows', response.data.data);
            return response.data.data;
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
      
      // Tentar salvar na API
      const token = StorageService.getAuthToken();
      if (token) {
        try {
          const response = await axios.post(`${API_BASE_URL}/flows`, flowData, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.data.success) {
            // Atualizar estatísticas
            StorageService.updateStats('flow_save');
            
            // Invalidar o cache de fluxos
            StorageService.invalidateCache('flows');
            
            return response.data.data;
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
      
      // Verificar se o fluxo já existe no array
      const existingIndex = flows.findIndex(f => f.id === flow.id);
      if (existingIndex !== -1) {
        flows[existingIndex] = flow;
      } else {
        flows.push(flow);
      }
      
      localStorage.setItem(StorageService.KEYS.FLOWS, JSON.stringify(flows));
      
      // Atualizar estatísticas
      StorageService.updateStats('flow_save');
      
      // Invalidar o cache de fluxos
      StorageService.invalidateCache('flows');
      
      return flow;
    } catch (error) {
      console.error('Erro ao salvar fluxo:', error);
      
      // Último fallback: tentar salvar apenas no localStorage
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
      
      // Tentar atualizar na API
      const token = StorageService.getAuthToken();
      if (token) {
        try {
          const response = await axios.put(`${API_BASE_URL}/flows/${flow.id}`, flowData, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
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
          // Continuar para fallback
        }
      }
      
      // Fallback: atualizar localmente
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
        
        localStorage.setItem(StorageService.KEYS.FLOWS, JSON.stringify(flowsArray));
        StorageService.updateStats('flow_edit');
        
        // Invalidar cache
        StorageService.invalidateCache('flows');
        StorageService.invalidateCache(`flow_${flow.id}`);
        
        return flow;
      } catch (localError) {
        console.error('Erro no fallback local:', localError);
        return null;
      }
    }
  },

  // Excluir um fluxo
  deleteFlow: async (id) => {
    try {
      // Tentar excluir na API
      const token = StorageService.getAuthToken();
      if (token) {
        try {
          const response = await axios.delete(`${API_BASE_URL}/flows/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
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
        localStorage.setItem(StorageService.KEYS.FLOWS, JSON.stringify(updatedFlows));
        
        StorageService.updateStats('flow_delete');
        
        // Invalidar cache
        StorageService.invalidateCache('flows');
        StorageService.invalidateCache(`flow_${id}`);
        
        return updatedFlows;
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
      
      // Tentar obter da API
      const token = StorageService.getAuthToken();
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/flows/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
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
        
        const flowsArray = JSON.parse(flows);
        const flow = flowsArray.find(f => Number(f.id) === Number(id));
        
        // Garantir que messages seja um array
        if (flow && !flow.messages) {
          flow.messages = [];
        }
        
        return flow;
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
  },

  // Fixar links existentes para usar o domínio atual
  fixExistingLinks: async () => {
    const flows = await StorageService.getFlows();
    const baseUrl = window.location.origin;
    let updated = false;
    
    const updatedFlows = flows.map(flow => {
      // Verificar se o link existe e precisa ser atualizado
      if (flow.link) {
        // Extrair o ID do fluxo do link atual
        const urlParts = flow.link.split('/');
        const flowId = urlParts[urlParts.length - 1];
        
        // Criar novo link com o domínio atual
        const newLink = `${baseUrl}/flow/${flowId}`;
        
        // Atualizar apenas se o link for diferente
        if (flow.link !== newLink) {
          flow.link = newLink;
          updated = true;
        }
      }
      
      // Garantir que messages seja um array
      if (!flow.messages) {
        flow.messages = [];
        updated = true;
      }
      
      return flow;
    });
    
    // Atualizar na API ou salvar localmente
    if (updated) {
      // Salvar cada fluxo atualizado
      for (const flow of updatedFlows) {
        await StorageService.updateFlow(flow);
      }
      
      // Para compatibilidade
      localStorage.setItem(StorageService.KEYS.FLOWS, JSON.stringify(updatedFlows));
      
      // Invalidar cache de fluxos
      StorageService.invalidateCache('flows');
    }
    
    return updatedFlows;
  },

  // === TEMPLATES ===

  // Obter todos os templates
  getTemplates: () => {
    // Verificar cache primeiro
    const cachedTemplates = StorageService.getCachedData('templates');
    if (cachedTemplates) {
      console.log('Usando templates do cache');
      return cachedTemplates;
    }
    
    // Templates padrão caso não exista nenhum
    const defaultTemplates = [
      {
        id: 1,
        title: "Atendimento inicial WhatsApp",
        description: "Template básico para primeiro atendimento no WhatsApp",
        category: "atendimento",
        platform: "whatsapp",
        messages: [
          {
            id: 101,
            type: "text",
            sender: "business",
            content: "Olá! Como posso ajudar você hoje?",
            delay: 0
          },
          {
            id: 102,
            type: "text",
            sender: "customer",
            content: "Olá, tenho uma dúvida sobre o produto X",
            delay: 1
          },
          {
            id: 103,
            type: "buttons",
            sender: "business",
            content: "Claro! Posso ajudar com informações sobre o produto X. O que você gostaria de saber?",
            delay: 1,
            buttons: [
              {
                id: "btn1",
                text: "Preço",
                responseMessage: "Quanto custa o produto X?",
                jumpTo: 104
              },
              {
                id: "btn2",
                text: "Características",
                responseMessage: "Quais são as características do produto X?",
                jumpTo: 105
              }
            ]
          },
          {
            id: 104,
            type: "text",
            sender: "business",
            content: "O produto X custa R$ 99,90 e pode ser parcelado em até 10x sem juros.",
            delay: 1
          },
          {
            id: 105,
            type: "text",
            sender: "business",
            content: "O produto X tem as seguintes características: resistente à água, garantia de 1 ano e está disponível em 3 cores.",
            delay: 1
          }
        ]
      },
      {
        id: 2,
        title: 'Vendas de Infoprodutos',
        description: 'Fluxo otimizado para venda de cursos online e produtos digitais',
        messageCount: 3,
        platform: 'whatsapp',
        category: 'vendas',
        messages: [
          {
            id: 1,
            type: 'text',
            sender: 'business',
            content: 'Olá! Obrigado por entrar em contato com a nossa loja. Como posso ajudar?',
            delay: 0
          },
          {
            id: 2,
            type: 'text',
            sender: 'customer',
            content: 'Olá! Gostaria de saber mais sobre o curso de marketing digital.',
            delay: 1
          },
          {
            id: 3,
            type: 'text',
            sender: 'business',
            content: 'Claro! Nosso curso de marketing digital é completo, com mais de 40 horas de conteúdo. Você terá acesso a aulas sobre tráfego pago, SEO, redes sociais e mais. O investimento é de R$ 497,00 ou 12x de R$ 49,90.',
            delay: 2
          }
        ]
      },
      {
        id: 3,
        title: 'Vendas de Produtos Físicos',
        description: 'Fluxo para lojas online e e-commerces',
        messageCount: 3,
        platform: 'whatsapp',
        category: 'vendas',
        messages: [
          {
            id: 1,
            type: 'text',
            sender: 'business',
            content: 'Olá! Bem-vindo à nossa loja online. Como posso ajudar?',
            delay: 0
          },
          {
            id: 2,
            type: 'text',
            sender: 'customer',
            content: 'Olá! Vi um produto no site de vocês e gostaria de saber mais detalhes.',
            delay: 1
          },
          {
            id: 3,
            type: 'text',
            sender: 'business',
            content: 'Com certeza! Qual produto específico chamou sua atenção? Posso te passar todas as informações e condições especiais de pagamento.',
            delay: 2
          }
        ]
      }
    ];
    
    try {
      // Tentar obter templates do localStorage
      const savedTemplates = localStorage.getItem(StorageService.KEYS.TEMPLATES);
      
      if (savedTemplates) {
        const parsedTemplates = JSON.parse(savedTemplates);
        
        // Garantir que todos os templates tenham a propriedade messages como array
        parsedTemplates.forEach(template => {
          if (!template.messages) {
            template.messages = [];
          }
        });
        
        // Salvar no cache
        StorageService.setCachedData('templates', parsedTemplates);
        
        return parsedTemplates;
      }
      
      // Se não houver templates salvos, usar os padrões e salvar no localStorage
      localStorage.setItem(StorageService.KEYS.TEMPLATES, JSON.stringify(defaultTemplates));
      
      // Salvar no cache
      StorageService.setCachedData('templates', defaultTemplates);
      
      return defaultTemplates;
    } catch (error) {
      console.error('Erro ao obter templates:', error);
      
      // Salvar no cache
      StorageService.setCachedData('templates', defaultTemplates);
      
      return defaultTemplates; // Retornar templates padrão em caso de erro
    }
  },

  // Função para obter um template específico por ID
  getTemplateById: (id) => {
    const templates = StorageService.getTemplates();
    const template = templates.find(template => template.id === parseInt(id));
    
    // Garantir que messages seja um array
    if (template && !template.messages) {
      template.messages = [];
    }
    
    return template;
  },
  
  // Aplicar um template como base para um novo fluxo
  applyTemplate: (templateId) => {
    try {
      // Buscar template
      const templates = StorageService.getTemplates();
      const template = templates.find(t => t.id === templateId || t.id === Number(templateId));
      
      if (!template) {
        console.error(`Template com ID ${templateId} não encontrado`);
        return null;
      }
      
      // Criar um novo fluxo baseado no template
      const newFlow = {
        id: Date.now(),
        title: template.title || 'Fluxo baseado em template',
        description: template.description || 'Descrição do fluxo',
        platform: template.platform || 'whatsapp',
        createdAt: new Date().toLocaleDateString(),
        updatedAt: new Date().toLocaleDateString(),
        // Garantir que messages seja sempre um array
        messages: template.messages ? [...template.messages] : []
      };
      
      // Atualizar estatísticas
      StorageService.updateStats('template_use');
      
      // Salvar o novo fluxo
      return StorageService.saveFlow(newFlow);
    } catch (error) {
      console.error('Erro ao aplicar template:', error);
      return null;
    }
  },

  // === COMPARTILHAMENTO ===
  
  // Função para armazenar dados de compartilhamento
  getSharedFlows: () => {
    const shared = localStorage.getItem(StorageService.KEYS.SHARED);
    return shared ? JSON.parse(shared) : {};
  },
  
  // Função para rastrear visualizações de fluxos compartilhados
  trackFlowView: async (shareId) => {
    try {
      // Tentar atualizar visualizações na API
      try {
        const response = await axios.post(`${API_BASE_URL}/shared-flows/${shareId}/view`);
        
        if (response.data.success) {
          console.log('Visualização registrada na API');
          return true;
        }
      } catch (apiError) {
        console.warn('Erro ao registrar visualização na API:', apiError);
        // Continuar para fallback
      }
      
      // Fallback: registrar localmente
      console.warn('Fallback: Registrando visualização no localStorage');
      
      const sharedFlows = StorageService.getSharedFlows();
      
      if (sharedFlows[shareId]) {
        sharedFlows[shareId].views = (sharedFlows[shareId].views || 0) + 1;
        sharedFlows[shareId].lastViewed = new Date().toISOString();
        
        localStorage.setItem(StorageService.KEYS.SHARED, JSON.stringify(sharedFlows));
        console.log(`Visualização registrada localmente para ${shareId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao registrar visualização:', error);
      
      // Último fallback: tentar atualizar apenas no localStorage
      try {
        const sharedFlows = localStorage.getItem(StorageService.KEYS.SHARED);
        const sharedData = sharedFlows ? JSON.parse(sharedFlows) : {};
        
        if (sharedData[shareId]) {
          sharedData[shareId].views = (sharedData[shareId].views || 0) + 1;
          sharedData[shareId].lastViewed = new Date().toISOString();
          
          localStorage.setItem(StorageService.KEYS.SHARED, JSON.stringify(sharedData));
          return true;
        }
        
        return false;
      } catch (localError) {
        console.error('Erro no fallback local:', localError);
        return false;
      }
    }
  },
  
  // Compartilhar um fluxo
  shareFlow: async (flowId) => {
    try {
      const flow = await StorageService.getFlow(flowId);
      
      if (!flow) {
        console.error(`Fluxo com ID ${flowId} não encontrado para compartilhamento`);
        return null;
      }
      
      // Tentar compartilhar na API
      const token = StorageService.getAuthToken();
      if (token) {
        try {
          const response = await axios.post(`${API_BASE_URL}/shared-flows`, 
            { flowId }, 
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          if (response.data.success) {
            // Atualizar estatísticas
            StorageService.updateStats('flow_share');
            
            return response.data.data;
          }
        } catch (apiError) {
          console.warn('Erro ao compartilhar fluxo na API:', apiError);
          // Continuar para fallback
        }
      }
      
      // Fallback: compartilhar localmente
      console.warn('Fallback: Compartilhando fluxo no localStorage');
      
      // Gerar um ID único para o compartilhamento
      const shareId = `share_${Date.now()}`;
      
      // Obter dados de compartilhamento existentes
      const sharedFlows = StorageService.getSharedFlows();
      
      // Adicionar novo compartilhamento
      sharedFlows[shareId] = {
        id: shareId,
        flow: flow,
        createdAt: new Date().toISOString(),
        views: 0
      };
      
      // Salvar no localStorage
      localStorage.setItem(StorageService.KEYS.SHARED, JSON.stringify(sharedFlows));
      
      // Atualizar estatísticas
      StorageService.updateStats('flow_share');
      
      return sharedFlows[shareId];
    } catch (error) {
      console.error('Erro ao compartilhar fluxo:', error);
      
      // Último fallback: tentar compartilhar apenas no localStorage
      try {
        const flow = await StorageService.getFlow(flowId);
        
        if (!flow) return null;
        
        const shareId = `share_${Date.now()}`;
        const sharedFlows = localStorage.getItem(StorageService.KEYS.SHARED);
        const sharedData = sharedFlows ? JSON.parse(sharedFlows) : {};
        
        sharedData[shareId] = {
          id: shareId,
          flow: flow,
          createdAt: new Date().toISOString(),
          views: 0
        };
        
        localStorage.setItem(StorageService.KEYS.SHARED, JSON.stringify(sharedData));
        
        return sharedData[shareId];
      } catch (localError) {
        console.error('Erro no fallback local:', localError);
        return null;
      }
    }
  },
  
  // Parar de compartilhar um fluxo
  unshareFlow: async (shareId) => {
    try {
      // Tentar remover compartilhamento na API
      const token = StorageService.getAuthToken();
      if (token) {
        try {
          const response = await axios.delete(`${API_BASE_URL}/shared-flows/${shareId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.data.success) {
            return true;
          }
        } catch (apiError) {
          console.warn('Erro ao remover compartilhamento na API:', apiError);
          // Continuar para fallback
        }
      }
      
      // Fallback: remover localmente
      console.warn('Fallback: Removendo compartilhamento do localStorage');
      
      const sharedFlows = StorageService.getSharedFlows();
      
      if (sharedFlows[shareId]) {
        delete sharedFlows[shareId];
        localStorage.setItem(StorageService.KEYS.SHARED, JSON.stringify(sharedFlows));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao remover compartilhamento:', error);
      
      // Último fallback: tentar remover apenas no localStorage
      try {
        const sharedFlows = localStorage.getItem(StorageService.KEYS.SHARED);
        const sharedData = sharedFlows ? JSON.parse(sharedFlows) : {};
        
        if (sharedData[shareId]) {
          delete sharedData[shareId];
          localStorage.setItem(StorageService.KEYS.SHARED, JSON.stringify(sharedData));
          return true;
        }
        
        return false;
      } catch (localError) {
        console.error('Erro no fallback local:', localError);
        return false;
      }
    }
  },
  
  // === ESTATÍSTICAS ===
  
  // Obter estatísticas de uso
  getStats: () => {
    try {
      const defaultStats = {
        flows_created: 0,
        flows_edited: 0,
        flows_deleted: 0,
        flows_shared: 0,
        templates_used: 0,
        last_active: new Date().toISOString()
      };
      
      // Verificar cache primeiro
      const cachedStats = StorageService.getCachedData('stats');
      if (cachedStats) {
        console.log('Usando estatísticas do cache');
        return cachedStats;
      }
      
      // Tentar obter do localStorage
      const stats = localStorage.getItem(StorageService.KEYS.STATS);
      const parsedStats = stats ? JSON.parse(stats) : defaultStats;
      
      // Salvar no cache
      StorageService.setCachedData('stats', parsedStats);
      
      return parsedStats;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      
      // Retornar estatísticas padrão em caso de erro
      const defaultStats = {
        flows_created: 0,
        flows_edited: 0,
        flows_deleted: 0,
        flows_shared: 0,
        templates_used: 0,
        last_active: new Date().toISOString()
      };
      
      // Salvar no cache
      StorageService.setCachedData('stats', defaultStats);
      
      return defaultStats;
    }
  },
  
  // Atualizar estatísticas
  updateStats: (action) => {
    try {
      const stats = StorageService.getStats();
      
      // Atualizar estatística específica com base na ação
      switch (action) {
        case 'flow_save':
          stats.flows_created = (stats.flows_created || 0) + 1;
          break;
        case 'flow_edit':
          stats.flows_edited = (stats.flows_edited || 0) + 1;
          break;
        case 'flow_delete':
          stats.flows_deleted = (stats.flows_deleted || 0) + 1;
          break;
        case 'flow_share':
          stats.flows_shared = (stats.flows_shared || 0) + 1;
          break;
        case 'template_use':
          stats.templates_used = (stats.templates_used || 0) + 1;
          break;
        default:
          break;
      }
      
      // Atualizar última atividade
      stats.last_active = new Date().toISOString();
      
      // Salvar no localStorage
      localStorage.setItem(StorageService.KEYS.STATS, JSON.stringify(stats));
      
      // Invalidar cache de estatísticas
      StorageService.invalidateCache('stats');
      
      return stats;
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
      return null;
    }
  },
  
  // === AUTENTICAÇÃO ===
  
  // Registrar um novo usuário
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      
      if (response.data.success) {
        // Salvar token no localStorage
        localStorage.setItem('token', response.data.token);
        
        // Salvar informações básicas do usuário
        localStorage.setItem(StorageService.KEYS.USER, JSON.stringify({
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          createdAt: response.data.user.createdAt
        }));
        
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      return { success: false, error: error.response?.data?.message || 'Erro ao registrar usuário' };
    }
  },
  
  // Login de usuário
  login: async (credentials) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
      
      if (response.data.success) {
        // Salvar token no localStorage
        localStorage.setItem('token', response.data.token);
        
        // Salvar informações básicas do usuário
        localStorage.setItem(StorageService.KEYS.USER, JSON.stringify({
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          createdAt: response.data.user.createdAt
        }));
        
        // Invalidar todos os caches para recarregar dados do servidor
        StorageService.invalidateCache('flows');
        StorageService.invalidateCache('templates');
        StorageService.invalidateCache('stats');
        
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return { success: false, error: error.response?.data?.message || 'Erro ao fazer login' };
    }
  },
  
  // Logout de usuário
  logout: () => {
    try {
      // Remover token
      localStorage.removeItem('token');
      
      // Remover dados do usuário
      localStorage.removeItem(StorageService.KEYS.USER);
      
      // Invalidar todos os caches
      StorageService.invalidateCache('flows');
      StorageService.invalidateCache('templates');
      StorageService.invalidateCache('stats');
      
      return true;
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return false;
    }
  },
  
  // Obter informações do usuário atual
  getCurrentUser: async () => {
    try {
      // Verificar cache primeiro
      const cachedUser = StorageService.getCachedData('current_user');
      if (cachedUser) {
        console.log('Usando usuário do cache');
        return cachedUser;
      }
      
      // Verificar se há token
      const token = StorageService.getAuthToken();
      if (!token) {
        return null;
      }
      
      // Tentar obter da API
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          // Salvar no cache
          StorageService.setCachedData('current_user', response.data.user);
          
          // Atualizar no localStorage também
          localStorage.setItem(StorageService.KEYS.USER, JSON.stringify(response.data.user));
          
          return response.data.user;
        }
      } catch (apiError) {
        console.warn('Erro ao obter usuário da API:', apiError);
        // Continuar para fallback
      }
      
      // Fallback: obter do localStorage
      console.warn('Fallback: Obtendo usuário do localStorage');
      
      const userData = localStorage.getItem(StorageService.KEYS.USER);
      if (!userData) {
        return null;
      }
      
      const user = JSON.parse(userData);
      
      // Salvar no cache
      StorageService.setCachedData('current_user', user);
      
      return user;
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      return null;
    }
  }
};

export default StorageService;