// src/services/secureStorage.js
/**
 * Serviço para gerenciar o armazenamento seguro de tokens e dados sensíveis
 * Evita armazenar informações críticas diretamente no localStorage
 */

 const SecureStorageService = {
    // Chaves usadas pelo sistema
    KEYS: {
      TOKEN: 'token',
      TOKEN_EXPIRY: 'token_expiry',
      REFRESH_TOKEN: 'refresh_token'
    },
  
    // Armazenar apenas tokens, sem dados sensíveis
    saveToken: (token, refreshToken = null) => {
      // Armazenar o token principal
      localStorage.setItem(SecureStorageService.KEYS.TOKEN, token);
      
      // Definir uma hora de expiração (1 hora por padrão)
      const expiry = Date.now() + (60 * 60 * 1000); // 1 hora
      localStorage.setItem(SecureStorageService.KEYS.TOKEN_EXPIRY, expiry.toString());
      
      // Opcionalmente armazenar refresh token se fornecido
      if (refreshToken) {
        localStorage.setItem(SecureStorageService.KEYS.REFRESH_TOKEN, refreshToken);
      }
      
      return true;
    },
    
    // Obter o token principal
    getToken: () => {
      return localStorage.getItem(SecureStorageService.KEYS.TOKEN);
    },
    
    // Obter o refresh token se existir
    getRefreshToken: () => {
      return localStorage.getItem(SecureStorageService.KEYS.REFRESH_TOKEN);
    },
    
    // Verificar se o token ainda é válido
    isTokenValid: () => {
      // Verificar se temos um token
      const token = localStorage.getItem(SecureStorageService.KEYS.TOKEN);
      if (!token) return false;
      
      // Se for um token administrativo (formato especial usado no sistema)
      if (token.startsWith('admin-token-')) {
        return true; // Tokens administrativos são sempre válidos
      }
      
      // Verificar pela expiração armazenada localmente
      const expiry = localStorage.getItem(SecureStorageService.KEYS.TOKEN_EXPIRY);
      if (!expiry) return false;
      
      // Verificar se não expirou
      return parseInt(expiry) > Date.now();
    },
    
    // Verificar se precisamos renovar o token
    shouldRefreshToken: () => {
      // Verificar se temos um token
      const token = localStorage.getItem(SecureStorageService.KEYS.TOKEN);
      if (!token) return false;
      
      // Se for um token administrativo, não precisamos renovar
      if (token.startsWith('admin-token-')) {
        return false;
      }
      
      // Verificar pela expiração armazenada
      const expiry = localStorage.getItem(SecureStorageService.KEYS.TOKEN_EXPIRY);
      if (!expiry) return true; // Se não temos expiração, melhor renovar por segurança
      
      const expiryTime = parseInt(expiry);
      
      // Renovar se estiver a menos de 10 minutos de expirar
      const tenMinutesFromNow = Date.now() + (10 * 60 * 1000);
      return expiryTime < tenMinutesFromNow;
    },
    
    // Atualizar um token existente
    updateToken: (newToken) => {
      // Preservar o refresh token existente
      const refreshToken = localStorage.getItem(SecureStorageService.KEYS.REFRESH_TOKEN);
      
      // Atualizar o token principal
      localStorage.setItem(SecureStorageService.KEYS.TOKEN, newToken);
      
      // Redefinir a expiração
      const expiry = Date.now() + (60 * 60 * 1000); // 1 hora
      localStorage.setItem(SecureStorageService.KEYS.TOKEN_EXPIRY, expiry.toString());
      
      return true;
    },
    
    // Limpar tokens e dados sensíveis
    clearAuth: () => {
      localStorage.removeItem(SecureStorageService.KEYS.TOKEN);
      localStorage.removeItem(SecureStorageService.KEYS.TOKEN_EXPIRY);
      localStorage.removeItem(SecureStorageService.KEYS.REFRESH_TOKEN);
      
      // Remover outros dados de usuário
      localStorage.removeItem('simulachat_user');
    },
    
    // Obter headers para requisições autenticadas
    getAuthHeaders: () => {
      const token = SecureStorageService.getToken();
      
      return {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      };
    }
  };
  
  export default SecureStorageService;