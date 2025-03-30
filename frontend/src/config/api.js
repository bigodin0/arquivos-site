// src/config/api.js
// Configuração central para endpoints da API

// Detecção dinâmica do ambiente (igual ao storage.js)
const isDevelopment = process.env.NODE_ENV === 'development';
const API_BASE_URL = isDevelopment 
  ? process.env.REACT_APP_API_URL || 'http://localhost:5000' 
  : 'https://simulachat-backend.onrender.com';

// Base URL para o front-end (para links de compartilhamento)
export const BASE_URL = process.env.REACT_APP_BASE_URL || window.location.origin;

// Função para gerar URLs completos para compartilhamento
export const generateShareUrl = (shareCode) => `${BASE_URL}/shared/${shareCode}`;
export const generateEmbedUrl = (shareCode) => `${BASE_URL}/embed/${shareCode}`;

// Constantes relacionadas à autenticação
export const TOKEN_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
export const TOKEN_REFRESH_THRESHOLD = 30 * 60 * 1000; // 30 minutos em milissegundos

export default {
  API_BASE_URL,
  BASE_URL,
  endpoints: {
    // Auth endpoints
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    me: `${API_BASE_URL}/api/auth/me`,
    refreshToken: `${API_BASE_URL}/api/auth/refresh-token`, // Endpoint para renovar tokens
    
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
  },
  // Funções de utilidade para URLs de compartilhamento
  generateShareUrl,
  generateEmbedUrl,
  // Exportar constantes relacionadas à autenticação
  TOKEN_EXPIRY_TIME,
  TOKEN_REFRESH_THRESHOLD
};