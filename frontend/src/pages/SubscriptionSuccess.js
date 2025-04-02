import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import apiConfig from '../config/api';
import { useAuth } from '../context/AuthContext';
import SecureStorageService from '../services/secureStorage';

const SubscriptionSuccess = () => {
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        // Verificar se o usuário está autenticado
        if (!isAuthenticated || !SecureStorageService.isTokenValid()) {
          console.error('Usuário não autenticado ou token inválido');
          setStatus('error');
          setMessage('Você precisa estar logado para verificar o status da assinatura.');
          return;
        }
        
        // Pegar parâmetros da URL
        const params = new URLSearchParams(location.search);
        const paymentId = params.get('payment_id');
        const paymentStatus = params.get('status');
        
        if (!paymentId) {
          setStatus('error');
          setMessage('Informações de pagamento incompletas.');
          return;
        }
        
        // Verificar o status no servidor
        try {
          // Obter headers de autenticação usando SecureStorageService
          const headers = SecureStorageService.getAuthHeaders().headers;
          
          // Chamada para a API verificar o status da assinatura
          const response = await axios.get(`${apiConfig.baseUrl}/subscriptions/verify/${paymentId}`, {
            headers
          });
          
          // Processar resposta do servidor
          if (response.data && response.data.status) {
            setStatus(response.data.status);
            if (response.data.message) {
              setMessage(response.data.message);
            }
          } else {
            // Fallback para status da URL, se presente
            if (paymentStatus) {
              setStatus(paymentStatus === 'approved' ? 'authorized' : paymentStatus);
            } else {
              // Caso não haja informação de status, consideramos erro
              setStatus('error');
              setMessage('Não foi possível verificar o status do pagamento.');
            }
          }
        } catch (apiError) {
          console.error('Erro na verificação da API:', apiError);
          
          // Verificar se é um erro de autenticação
          if (apiError.response && apiError.response.status === 401) {
            // Token inválido ou expirado, limpe-o
            SecureStorageService.clearToken();
            logout();
            setStatus('error');
            setMessage('Sessão expirada. Por favor, faça login novamente.');
            return;
          }
          
          // Use o status da URL como fallback, se presente
          if (paymentStatus) {
            setStatus(paymentStatus === 'approved' ? 'authorized' : paymentStatus);
          } else {
            setStatus('error');
            setMessage('Erro ao verificar o status da assinatura. Por favor, contate o suporte.');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar o status da assinatura:', error);
        setStatus('error');
        setMessage('Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.');
      }
    };
    
    checkSubscriptionStatus();
  }, [location, isAuthenticated, logout]);
  
  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if ((!isAuthenticated || !SecureStorageService.isTokenValid()) && status === 'error') {
      const timer = setTimeout(() => {
        navigate('/login', { state: { from: location.pathname + location.search } });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, status, navigate, location]);
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Status da Assinatura</h1>
        
        {status === 'verifying' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Verificando o status da sua assinatura...</p>
          </div>
        )}
        
        {status === 'authorized' || status === 'approved' && (
          <div className="text-center">
            <div className="bg-green-100 text-green-700 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-green-700">Assinatura Confirmada!</h2>
            <p className="mb-6">{message || 'Sua assinatura foi processada com sucesso. Aproveite todos os recursos do SimulaChat!'}</p>
            <Link to="/" className="inline-block bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-6 rounded">
              Ir para o Dashboard
            </Link>
          </div>
        )}
        
        {status === 'pending' && (
          <div className="text-center">
            <div className="bg-yellow-100 text-yellow-700 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-yellow-700">Pagamento Pendente</h2>
            <p className="mb-6">{message || 'Estamos processando seu pagamento. Assim que for confirmado, você terá acesso ao plano escolhido.'}</p>
            <Link to="/" className="inline-block bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-6 rounded">
              Voltar ao Dashboard
            </Link>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center">
            <div className="bg-red-100 text-red-700 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-red-700">Erro no Processamento</h2>
            <p className="mb-6">{message || 'Não foi possível confirmar sua assinatura. Por favor, tente novamente ou entre em contato com nosso suporte.'}</p>
            <Link to="/plans" className="inline-block bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-6 rounded">
              Voltar aos Planos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionSuccess;