import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, AlertTriangle, Loader, Phone, Share2 } from 'lucide-react';
import ChatPreview from '../components/ChatPreview';
import StorageService from '../services/storage';
import SecureStorageService from '../services/secureStorage';
import { MainLayout, Container, Card, Button } from '../design-system';
import axios from 'axios';
import apiConfig from '../config/api';
import { useAuth } from '../contexts/AuthContext';

const FlowPreview = ({ shared = false }) => {
  const { id, shareCode } = useParams();
  const [flow, setFlow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const { getToken } = useAuth();
  
  useEffect(() => {
    const loadFlow = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Determinar qual método usar com base no modo
        if (shared) {
          // Para fluxos compartilhados
          try {
            // Tentar obter da API
            let apiResponse = null;
            
            if (SecureStorageService.isTokenValid()) {
              try {
                const headers = SecureStorageService.getAuthHeaders().headers;
                
                const response = await axios.get(
                  apiConfig.endpoints.sharedFlow(shareCode), 
                  { headers }
                );
                
                if (response.data && response.data.success) {
                  apiResponse = response.data.data;
                }
              } catch (apiError) {
                console.error("Erro ao obter fluxo compartilhado da API:", apiError);
                
                // Verificar se é erro de token inválido
                if (apiError.response && apiError.response.status === 401) {
                  // Token expirado ou inválido
                  SecureStorageService.clearToken();
                }
              }
            }
            
            if (apiResponse && apiResponse.flow) {
              setFlow(apiResponse.flow);
            } else {
              // Fallback para local storage
              const sharedFlow = await StorageService.getSharedFlow(shareCode);
              if (sharedFlow && sharedFlow.flow) {
                setFlow(sharedFlow.flow);
              } else {
                setError("Fluxo compartilhado não encontrado");
              }
            }
          } catch (error) {
            console.error("Erro ao carregar fluxo compartilhado:", error);
            setError("Erro ao carregar fluxo compartilhado");
          }
        } else {
          // Para fluxos próprios
          try {
            // Tentar obter da API se o token for válido
            if (SecureStorageService.isTokenValid()) {
              try {
                const headers = SecureStorageService.getAuthHeaders().headers;
                
                const response = await axios.get(
                  apiConfig.endpoints.flow(id),
                  { headers }
                );
                
                if (response.data && response.data.success) {
                  setFlow(response.data.data);
                } else {
                  // Fallback para localStorage
                  const flowData = StorageService.getFlow(Number(id));
                  if (flowData) {
                    setFlow(flowData);
                  } else {
                    setError("Fluxo não encontrado");
                  }
                }
              } catch (apiError) {
                console.error("Erro ao obter fluxo da API:", apiError);
                
                // Verificar se é erro de token inválido
                if (apiError.response && apiError.response.status === 401) {
                  // Token expirado ou inválido
                  SecureStorageService.clearToken();
                }
                
                // Fallback para localStorage
                const flowData = StorageService.getFlow(Number(id));
                if (flowData) {
                  setFlow(flowData);
                } else {
                  setError("Fluxo não encontrado");
                }
              }
            } else {
              // Sem token válido, usar localStorage
              const flowData = StorageService.getFlow(Number(id));
              if (flowData) {
                setFlow(flowData);
              } else {
                setError("Fluxo não encontrado");
              }
            }
          } catch (error) {
            console.error("Erro ao carregar fluxo:", error);
            setError("Erro ao carregar fluxo");
          }
        }
      } catch (error) {
        console.error("Erro ao carregar fluxo:", error);
        setError("Erro ao carregar fluxo");
      } finally {
        setLoading(false);
      }
    };
    
    loadFlow();
  }, [id, shareCode, shared, getToken]);
  
  const handleCopyLink = async () => {
    try {
      // Certifique-se de que temos um ID para compartilhar
      if (!id) return;
      
      // Gerar os links de compartilhamento
      const shareData = await StorageService.shareFlow(id);
      const linkToCopy = shareData.shareUrl;
      
      await navigator.clipboard.writeText(linkToCopy);
      setCopySuccess(true);
      
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Erro ao copiar link:", error);
    }
  };
  
  // Determina a plataforma de chat para personalizar a UI
  const getPlatformDetails = () => {
    const platform = flow?.platform || 'whatsapp';
    
    switch (platform) {
      case 'whatsapp':
        return {
          name: 'WhatsApp',
          color: 'bg-green-600',
          bgLight: 'bg-green-50',
          border: 'border-green-200',
          icon: <MessageSquare size={18} className="text-green-600" />
        };
      case 'messenger':
        return {
          name: 'Messenger',
          color: 'bg-blue-600',
          bgLight: 'bg-blue-50',
          border: 'border-blue-200',
          icon: <MessageSquare size={18} className="text-blue-600" />
        };
      case 'instagram':
        return {
          name: 'Instagram',
          color: 'bg-purple-600',
          bgLight: 'bg-purple-50',
          border: 'border-purple-200',
          icon: <MessageSquare size={18} className="text-purple-600" />
        };
      case 'telegram':
        return {
          name: 'Telegram',
          color: 'bg-blue-500',
          bgLight: 'bg-blue-50',
          border: 'border-blue-200',
          icon: <MessageSquare size={18} className="text-blue-500" />
        };
      default:
        return {
          name: 'Chat',
          color: 'bg-teal-600',
          bgLight: 'bg-teal-50',
          border: 'border-teal-200',
          icon: <MessageSquare size={18} className="text-teal-600" />
        };
    }
  };
  
  // Componente de carregamento
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center text-center">
          <Loader size={36} className="text-teal-600 animate-spin mb-4" />
          <p className="text-gray-700 font-medium">Carregando visualização...</p>
        </div>
      </div>
    );
  }
  
  // Componente de erro (fluxo não encontrado)
  if (error || !flow) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle size={48} className="text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Fluxo não encontrado</h1>
          <p className="text-gray-600 mb-6">
            {error || "O fluxo que você está tentando visualizar não está disponível ou foi removido."}
          </p>
          <Button 
            variant="primary"
            as={Link}
            to={shared ? "/" : `/flow/${id}`}
          >
            {shared ? "Voltar para a página inicial" : "Voltar para o editor"}
          </Button>
        </Card>
      </div>
    );
  }
  
  const platformDetails = getPlatformDetails();
  
  // Para modo compartilhado, renderizamos um layout mais simples
  if (shared) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className={`border-b ${platformDetails.border} ${platformDetails.bgLight}`}>
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="text-gray-600 hover:text-gray-800 mr-4">
                <ArrowLeft size={18} />
              </Link>
              <h1 className="text-lg md:text-xl font-semibold truncate max-w-[200px] md:max-w-none flex items-center">
                {platformDetails.icon}
                <span className="ml-2">{flow.title}</span>
              </h1>
            </div>
            <span className={`${platformDetails.color} text-white px-2 py-1 rounded-full text-xs`}>
              {platformDetails.name}
            </span>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-4 md:py-6 flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <div className="h-[500px] md:h-[600px] w-full">
              <ChatPreview 
                messages={Array.isArray(flow.messages) ? flow.messages : []} 
                contactName={flow.contactName || 'Atendimento'} 
                platform={flow.platform || 'whatsapp'} 
                avatarUrl={flow.avatarUrl}
              />
            </div>
          </Card>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Criado com <Link to="/" className="text-teal-600 hover:underline font-medium">SimulaChat</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Para uso interno (não compartilhado), usamos o MainLayout
  return (
    <MainLayout title="Visualização de Fluxo">
      <Container>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <Link to={`/flow/${id}`} className="mr-3">
              <Button variant="ghost" icon={<ArrowLeft size={16} />}>
                Voltar para o editor
              </Button>
            </Link>
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">
                {flow.title}
              </h1>
              <span className={`ml-3 ${platformDetails.color} text-white px-2 py-1 rounded-full text-xs`}>
                {platformDetails.name}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleCopyLink}
              icon={<Share2 size={16} />}
            >
              {copySuccess ? 'Link copiado!' : 'Compartilhar'}
            </Button>
            <Button 
              variant="primary" 
              as={Link}
              to={`/flow/${id}`}
            >
              Editar Fluxo
            </Button>
          </div>
        </div>
        
        <Card className="overflow-hidden">
          <div className={`px-4 py-3 border-b ${platformDetails.border} ${platformDetails.bgLight} flex items-center`}>
            <div className="flex items-center">
              {platformDetails.icon}
              <span className="ml-2 font-medium">{flow.contactName || 'Atendimento'}</span>
            </div>
            <div className="ml-auto flex items-center text-gray-500">
              <Phone size={14} className="mr-1" />
              <span className="text-xs">Simulação</span>
            </div>
          </div>
          
          <div className="h-[600px] w-full bg-gray-50">
            <ChatPreview 
              messages={Array.isArray(flow.messages) ? flow.messages : []} 
              contactName={flow.contactName || 'Atendimento'} 
              platform={flow.platform || 'whatsapp'} 
              avatarUrl={flow.avatarUrl}
            />
          </div>
        </Card>
        
        <div className="mt-4 bg-teal-50 border border-teal-100 rounded-lg p-4">
          <h3 className="font-medium text-teal-800 mb-2">Dicas para teste</h3>
          <ul className="text-sm text-teal-700 space-y-1 ml-5 list-disc">
            <li>Verifique se o fluxo de conversa está fluindo naturalmente</li>
            <li>Observe os tempos de resposta (atrasos entre mensagens)</li>
            <li>Confirme se o tom de voz está adequado para seu público</li>
            <li>Verifique se todas as informações importantes estão incluídas</li>
          </ul>
        </div>
      </Container>
    </MainLayout>
  );
};

export default FlowPreview;