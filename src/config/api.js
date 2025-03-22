// src/config/api.js
// Configuração central para endpoints da API

// Base URL para API - Corrigido para apontar para a URL base correta
const API_BASE_URL = 'https://simulachat-backend.onrender.com';

export default {
  API_BASE_URL,
  endpoints: {
    // Auth endpoints
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    me: `${API_BASE_URL}/api/auth/me`,
    
    // Flows endpoints
    flows: `${API_BASE_URL}/api/flows`,
    flow: (id) => `${API_BASE_URL}/api/flows/${id}`,
    
    // Shared flows endpoints
    sharedFlows: `${API_BASE_URL}/api/shared-flows`,
    sharedFlow: (code) => `${API_BASE_URL}/api/shared-flows/${code}`,
    shareFlow: `${API_BASE_URL}/api/shared-flows/share`,
    
    // Planos e pagamentos
    planos: `${API_BASE_URL}/api/planos`,
    checkout: `${API_BASE_URL}/api/checkout`,
    assinaturas: `${API_BASE_URL}/api/criar-assinatura`,
    verificarAssinatura: `${API_BASE_URL}/api/verificar-assinatura`
  }
};