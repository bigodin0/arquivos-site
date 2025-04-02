import { useState, useCallback } from 'react';

/**
 * Hook para gerenciar operações assíncronas com estados de carregamento e erro
 * @param {Function} asyncFunction - A função assíncrona a ser executada
 * @param {boolean} immediate - Se a função deve ser executada imediatamente
 * @returns {Object} - Estados e funções para controlar a operação assíncrona
 */
const useAsync = (asyncFunction, immediate = false) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Função para executar a operação assíncrona
  const execute = useCallback(async (...params) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await asyncFunction(...params);
      setData(result);
      
      return result;
    } catch (err) {
      setError(err.message || 'Ocorreu um erro');
      return Promise.reject(err);
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  // Executar imediatamente se especificado
  useState(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  // Função para limpar os estados
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
    setData
  };
};

export default useAsync;