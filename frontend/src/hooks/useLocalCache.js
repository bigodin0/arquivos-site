import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para gerenciar cache local com TTL (Time To Live)
 * @param {string} key - Chave única para o cache
 * @param {Function} fetchFunction - Função para buscar dados quando o cache é inválido
 * @param {number} ttl - Tempo de vida do cache em milissegundos (padrão: 1 hora)
 * @returns {Object} - Estados e funções para gerenciar o cache
 */
const useLocalCache = (key, fetchFunction, ttl = 3600000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Função para verificar se o cache está expirado
  const isCacheExpired = useCallback(() => {
    try {
      const cachedData = localStorage.getItem(`cache_${key}`);
      if (!cachedData) return true;
      
      const { timestamp } = JSON.parse(cachedData);
      return Date.now() - timestamp > ttl;
    } catch (error) {
      console.error('Erro ao verificar cache:', error);
      return true;
    }
  }, [key, ttl]);

  // Função para obter dados do cache
  const getFromCache = useCallback(() => {
    try {
      const cachedData = localStorage.getItem(`cache_${key}`);
      if (!cachedData) return null;
      
      const { data, timestamp } = JSON.parse(cachedData);
      
      // Verificar se o cache expirou
      if (Date.now() - timestamp > ttl) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }
      
      setLastUpdated(timestamp);
      return data;
    } catch (error) {
      console.error('Erro ao obter cache:', error);
      return null;
    }
  }, [key, ttl]);

  // Função para salvar dados no cache
  const saveToCache = useCallback((data) => {
    try {
      const cache = { 
        data, 
        timestamp: Date.now() 
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(cache));
      setLastUpdated(cache.timestamp);
    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
    }
  }, [key]);

  // Função para atualizar dados com fallback para cache
  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar se podemos usar o cache
      if (!forceRefresh) {
        const cachedData = getFromCache();
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return cachedData;
        }
      }
      
      // Se não tiver cache válido ou forçar atualização, buscar dados
      const result = await fetchFunction();
      
      // Salvar no cache e atualizar estado
      saveToCache(result);
      setData(result);
      
      return result;
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setError(error.message || 'Erro ao buscar dados');
      
      // Em caso de erro, tentar usar cache como fallback
      const cachedData = getFromCache();
      if (cachedData) {
        setData(cachedData);
        return cachedData;
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, getFromCache, saveToCache]);

  // Função para limpar o cache
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(`cache_${key}`);
      setData(null);
      setLastUpdated(null);
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }, [key]);

  // Carregar dados iniciais
  useEffect(() => {
    // Verificar se o cache está expirado
    if (isCacheExpired()) {
      fetchData();
    } else {
      const cachedData = getFromCache();
      if (cachedData) {
        setData(cachedData);
      } else {
        fetchData();
      }
    }
  }, [isCacheExpired, getFromCache, fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refreshData: () => fetchData(true),
    clearCache
  };
};

export default useLocalCache;