// src/services/plans.js
// Serviço para gerenciar funcionalidades relacionadas aos planos de assinatura

const PlansService = {
  // Constantes de planos para referência
  PLANS: {
    FREE: 'free',
    BASIC: 'basic',
    PRO: 'premium',
    ENTERPRISE: 'enterprise'
  },

  // Estrutura de planos
  plans: {
    free: {
      name: 'Gratuito',
      messagesPerFlowLimit: 10,
      flowsLimit: 3,
      features: {
        use_media: false,
        advanced_analytics: false
      }
    },
    basic: {
      name: 'Básico',
      messagesPerFlowLimit: 20,
      flowsLimit: 5,
      features: {
        use_media: true,
        advanced_analytics: false
      }
    },
    premium: {
      name: 'Premium',
      messagesPerFlowLimit: 50,
      flowsLimit: 20,
      features: {
        use_media: true,
        advanced_analytics: true
      }
    },
    enterprise: {
      name: 'Empresarial',
      messagesPerFlowLimit: -1, // Ilimitado
      flowsLimit: -1, // Ilimitado
      features: {
        use_media: true,
        advanced_analytics: true
      }
    }
  },

  // Obter detalhes do plano pelo ID
  getPlanDetails(planId) {
    // Converter plano para string minúscula caso seja passado em maiúsculo
    const planKey = planId ? planId.toString().toLowerCase() : 'free';
    return this.plans[planKey] || this.plans.free;
  },

  // Obter detalhes do plano atual do usuário
  getCurrentPlan() {
    // Aqui você poderia buscar o plano do usuário de um armazenamento, API, etc.
    // Por enquanto, vamos retornar o plano básico como padrão
    return this.plans.basic;
  },

  // Verificar se o plano permite uma ação específica
  checkPlanAllowsAction(planId, action, currentCount = 0) {
    const plan = this.getPlanDetails(planId);
    
    switch (action) {
      case 'add_flow':
        return plan.flowsLimit === -1 || currentCount < plan.flowsLimit;
      
      case 'add_message':
        return plan.messagesPerFlowLimit === -1 || currentCount < plan.messagesPerFlowLimit;
      
      case 'use_media':
        return plan.features.use_media;
      
      case 'use_advanced_analytics':
        return plan.features.advanced_analytics;
      
      default:
        return true;
    }
  },

  // Obter lista de todos os planos disponíveis
  getAllPlans() {
    return [
      {
        id: 'free',
        name: this.plans.free.name,
        price: 0,
        messagesPerFlowLimit: this.plans.free.messagesPerFlowLimit,
        flowsLimit: this.plans.free.flowsLimit,
        features: this.plans.free.features
      },
      {
        id: 'basic',
        name: this.plans.basic.name,
        price: 19.90,
        messagesPerFlowLimit: this.plans.basic.messagesPerFlowLimit,
        flowsLimit: this.plans.basic.flowsLimit,
        features: this.plans.basic.features
      },
      {
        id: 'premium',
        name: this.plans.premium.name,
        price: 39.90,
        messagesPerFlowLimit: this.plans.premium.messagesPerFlowLimit,
        flowsLimit: this.plans.premium.flowsLimit,
        features: this.plans.premium.features
      },
      {
        id: 'enterprise',
        name: this.plans.enterprise.name,
        price: 99.90,
        messagesPerFlowLimit: this.plans.enterprise.messagesPerFlowLimit,
        flowsLimit: this.plans.enterprise.flowsLimit,
        features: this.plans.enterprise.features
      }
    ];
  },

  // Verificar limite de mensagens por fluxo
  getMessagesPerFlowLimit(planId) {
    const plan = this.getPlanDetails(planId);
    return plan.messagesPerFlowLimit;
  },

  // Verificar limite de fluxos
  getFlowsLimit(planId) {
    const plan = this.getPlanDetails(planId);
    return plan.flowsLimit;
  },

  // Verificar se o plano permite uso de mídia
  canUseMedia(planId) {
    const plan = this.getPlanDetails(planId);
    return plan.features.use_media;
  },

  // Verificar se o plano permite analytics avançado
  canUseAdvancedAnalytics(planId) {
    const plan = this.getPlanDetails(planId);
    return plan.features.advanced_analytics;
  }
};

export default PlansService;