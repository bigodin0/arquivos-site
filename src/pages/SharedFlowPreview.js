import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import StorageService from '../services/storage';
import ChatPreview from '../components/ChatPreview';
import axios from 'axios';
import apiConfig from '../config/api';
import { Loader, MessageSquare, AlertTriangle } from 'lucide-react';

const SharedFlowPreview = () => {
  const [flow, setFlow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { shareCode } = useParams();
  
  // Função de retry para busca de fluxos
  const fetchWithRetry = async (url, options = {}, retries = 3, delay = 1000) => {
    try {
      return await axios.get(url, options);
    } catch (error) {
      if (retries <= 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
  };
  
  useEffect(() => {
    const fetchSharedFlow = async () => {
      try {
        setLoading(true);
        console.log("Tentando carregar fluxo com código:", shareCode);
        
        // Tentar buscar da API primeiro com sistema de retry
        try {
          const token = localStorage.getItem('auth_token'); // Assumindo que o token está armazenado no localStorage
          const response = await fetchWithRetry(
            apiConfig.endpoints.sharedFlow(shareCode),
            { 
              headers: { 
                'Authorization': token ? `Bearer ${token}` : '' 
              } 
            }
          );
          
          if (response.data && response.data.success && response.data.data) {
            console.log("Fluxo encontrado na API:", shareCode);
            setFlow(response.data.data.flow);
            setError(null);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.warn('Erro ao buscar fluxo compartilhado após retries:', apiError);
          // Continuar com o fallback para localStorage
        }
        
        // Fallback para StorageService se a API falhar
        try {
          // Extrair o ID do fluxo do shareCode (formato: f1234_5678)
          const match = shareCode.match(/^f(\d+)_/);
          
          if (match && match[1]) {
            const flowId = parseInt(match[1]);
            console.log("ID do fluxo extraído:", flowId);
            
            // Tentar obter o fluxo compartilhado
            const sharedData = await StorageService.getSharedFlow(shareCode);
            
            if (sharedData && sharedData.flow) {
              console.log("Fluxo encontrado no Storage:", shareCode);
              setFlow(sharedData.flow);
              setError(null);
              return;
            }
            
            // Buscar o fluxo diretamente usando o ID
            const flowData = await StorageService.getFlowForPublicSharing(flowId);
            
            if (flowData && flowData.flow) {
              console.log("Fluxo encontrado para exibição pública");
              setFlow(flowData.flow);
              setError(null);
            } else {
              console.error("Fluxo não encontrado com o ID:", flowId);
              setError("Fluxo não encontrado ou expirado");
            }
          } else {
            // Tentar formato antigo: share_1234_5678
            const oldMatch = shareCode.match(/^share_(\d+)_/);
            if (oldMatch && oldMatch[1]) {
              const flowId = parseInt(oldMatch[1]);
              console.log("ID do fluxo extraído (formato antigo):", flowId);
              
              // Tentar obter da API primeiro
              const sharedData = await StorageService.getSharedFlow(shareCode);
              
              if (sharedData && sharedData.flow) {
                console.log("Fluxo encontrado no Storage (formato antigo):", shareCode);
                setFlow(sharedData.flow);
                setError(null);
                return;
              }
              
              // Buscar o fluxo diretamente usando o ID
              const flowData = await StorageService.getFlowForPublicSharing(flowId);
              
              if (flowData && flowData.flow) {
                console.log("Fluxo encontrado para exibição pública");
                setFlow(flowData.flow);
                setError(null);
              } else {
                console.error("Fluxo não encontrado com o ID (formato antigo):", flowId);
                setError("Fluxo não encontrado ou expirado");
              }
            } else {
              console.error("Formato de código de compartilhamento inválido:", shareCode);
              setError("Link inválido");
            }
          }
        } catch (localError) {
          console.error("Erro ao buscar no StorageService:", localError);
          setError("Erro ao carregar conteúdo");
        }
      } catch (err) {
        console.error("Erro ao carregar fluxo compartilhado:", err);
        setError("Ocorreu um erro ao carregar o fluxo");
      } finally {
        setLoading(false);
      }
    };

    if (shareCode) {
      fetchSharedFlow();
    }
  }, [shareCode]);

  // Exibir estado de carregamento
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen w-full bg-gray-100">
        <div className="flex flex-col items-center">
          <Loader size={36} className="text-teal-600 animate-spin mb-4" />
          <p className="text-teal-600 font-medium">Carregando visualização...</p>
        </div>
      </div>
    );
  }

  // Exibir mensagem de erro
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen w-full bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
          <h1 className="text-2xl font-bold mb-4 text-gray-800">{error}</h1>
          <p className="text-gray-600 mb-6">
            O fluxo que você está tentando acessar não está disponível ou foi removido.
          </p>
          <a 
            href="/" 
            className="inline-block bg-primary hover:bg-primary-dark text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Voltar para a página inicial
          </a>
        </div>
      </div>
    );
  }

  // Exibir o fluxo em tela cheia
  return (
    <div className="min-h-screen h-screen w-full flex flex-col overflow-hidden bg-gray-100">
      {/* Header com informações do fluxo */}
      <header className="bg-white border-b border-gray-200 py-3">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold flex items-center">
            <MessageSquare size={20} className="text-teal-600 mr-2" />
            {flow?.title || 'Simulação de Chat'}
          </h1>
          <div className="text-xs px-2 py-1 bg-teal-100 text-teal-800 rounded-full">
            {flow?.platform ? flow.platform.charAt(0).toUpperCase() + flow.platform.slice(1) : 'WhatsApp'}
          </div>
        </div>
      </header>
      
      {/* Chat Preview em tela cheia */}
      <div className="flex-1 w-full h-full overflow-hidden">
        {flow && (
          <ChatPreview 
            messages={Array.isArray(flow.messages) ? flow.messages : []} 
            contactName={flow.contactName || 'Atendimento'} 
            platform={flow.platform || 'whatsapp'} 
            disableEvents={false} // Permitir eventos e animações
            autoStart={true} // Iniciar automaticamente a reprodução
            hideControls={true} // Ocultar os controles de play/pause
          />
        )}
      </div>
      
      {/* Footer com marca d'água discreta */}
      <div className="py-2 bg-gray-100 border-t border-gray-200">
        <div className="text-center text-xs text-gray-500">
          Powered by <a href="https://simulachat.app" className="text-primary hover:underline">SimulaChat</a>
        </div>
      </div>
    </div>
  );
};

export default SharedFlowPreview;