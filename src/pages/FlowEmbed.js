import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, AlertCircle, Loader } from 'lucide-react';
import StorageService from '../services/storage';
import ChatPreview from '../components/ChatPreview';
import { Card } from '../design-system';
import axios from 'axios';
import apiConfig from '../config/api';

// Componente otimizado para incorporação em sites externos
const FlowEmbed = () => {
  const [flow, setFlow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { shareCode } = useParams();
  
  useEffect(() => {
    const loadFlow = async () => {
      try {
        setLoading(true);
        console.log("Tentando carregar fluxo para incorporação:", shareCode);
        
        // Tentar obter da API primeiro
        try {
          const response = await axios.get(apiConfig.endpoints.sharedFlow(shareCode));
          
          if (response.data && response.data.success && response.data.data) {
            console.log("Fluxo encontrado na API:", shareCode);
            setFlow(response.data.data.flow);
            setError(null);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.error("Erro ao buscar fluxo na API:", apiError);
          // Continuar com fallback para StorageService
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
              console.log("Fluxo encontrado na API:", shareCode);
              setFlow(sharedData.flow);
              setError(null);
              return;
            }
            
            // Buscar o fluxo diretamente usando o ID
            const flowData = await StorageService.getFlowForPublicSharing(flowId);
            
            if (flowData && flowData.flow) {
              console.log("Fluxo encontrado para incorporação");
              setFlow(flowData.flow);
              setError(null);
            } else {
              console.error("Fluxo não encontrado com o ID:", flowId);
              setError("Conteúdo não disponível");
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
                console.log("Fluxo encontrado na API (formato antigo):", shareCode);
                setFlow(sharedData.flow);
                setError(null);
                return;
              }
              
              // Buscar o fluxo diretamente usando o ID
              const flowData = await StorageService.getFlowForPublicSharing(flowId);
              
              if (flowData && flowData.flow) {
                console.log("Fluxo encontrado para incorporação");
                setFlow(flowData.flow);
                setError(null);
              } else {
                console.error("Fluxo não encontrado com o ID (formato antigo):", flowId);
                setError("Conteúdo não disponível");
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
        console.error("Erro ao carregar fluxo para incorporação:", err);
        setError("Erro ao carregar conteúdo");
      } finally {
        setLoading(false);
      }
    };

    loadFlow();
  }, [shareCode]);

  // Estado de carregamento
  if (loading) {
    return (
      <div className="flex justify-center items-center w-full h-full min-h-[400px] bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 text-teal-600 animate-spin mb-4">
            <Loader size={48} className="animate-spin" />
          </div>
          <p className="text-teal-600 font-medium">Carregando simulação...</p>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (error || !flow) {
    return (
      <Card className="w-full h-full min-h-[400px] flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center p-6 text-center">
          <div className="w-16 h-16 text-gray-400 mb-4">
            <AlertCircle size={64} className="text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {error || "Conteúdo não disponível"}
          </h3>
          <p className="text-gray-600 max-w-md">
            Não foi possível carregar esta simulação. O link pode estar incorreto ou o conteúdo pode ter sido removido.
          </p>
        </div>
      </Card>
    );
  }

  // Determina a classe do container baseado na plataforma
  const getPlatformClass = () => {
    switch (flow.platform) {
      case 'whatsapp':
        return 'bg-green-50 border-green-200';
      case 'messenger':
        return 'bg-blue-50 border-blue-200';
      case 'instagram':
        return 'bg-purple-50 border-purple-200';
      case 'telegram':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-teal-50 border-teal-100';
    }
  };

  // Render principal do fluxo
  return (
    <div className="w-full h-full min-h-screen overflow-hidden flex flex-col">
      {/* Cabeçalho da plataforma */}
      <div className={`p-3 border-b ${getPlatformClass()} flex items-center`}>
        <MessageSquare size={20} className="mr-2 text-teal-600" />
        <span className="font-medium text-gray-800">
          {flow.title || 'Simulação de Chat'}
        </span>
        {flow.platform && (
          <span className="ml-auto text-xs bg-teal-600 text-white px-2 py-1 rounded-full">
            {flow.platform.charAt(0).toUpperCase() + flow.platform.slice(1)}
          </span>
        )}
      </div>
      
      {/* Container principal do chat */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        <ChatPreview 
          messages={Array.isArray(flow.messages) ? flow.messages : []} 
          contactName={flow.contactName || 'Chat'} 
          platform={flow.platform || 'whatsapp'} 
          disableEvents={false} // Permitir animações
          autoStart={true} // Iniciar automaticamente a reprodução
          hideControls={true} // Ocultar os controles de play/pause
        />
      </div>
      
      {/* Rodapé com branding discreto */}
      <div className="py-2 px-3 bg-gray-100 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          Criado com <span className="text-teal-600 font-medium">SimulaChat</span>
        </p>
      </div>
    </div>
  );
};

export default FlowEmbed;