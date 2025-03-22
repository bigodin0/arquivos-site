import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, LayoutTemplate } from 'lucide-react';
import StorageService from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import { MainLayout, Container, Grid, Button, FlowCard } from '../design-system';
import axios from 'axios';
import apiConfig from '../config/api';

const Dashboard = () => {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { canPerformAction, getPlanDetails, getToken } = useAuth();
  const currentPlan = getPlanDetails();

  // Função para buscar os fluxos da API
  const fetchFlowsFromAPI = async () => {
    try {
      setLoading(true);
      
      // Obter o token de autorização
      const token = getToken();
      
      if (!token) {
        // Se não houver token, usar os fluxos locais como fallback
        const localFlows = StorageService.getFlows() || [];
        setFlows(localFlows);
        return;
      }
      
      // Fazer a chamada à API
      const response = await axios.get(apiConfig.endpoints.flows, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Se a chamada for bem-sucedida e retornar dados
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setFlows(response.data.data);
      } else {
        // Usar fluxos locais como fallback se a API não retornar dados válidos
        console.warn('API não retornou dados de fluxos válidos. Usando dados locais.');
        const localFlows = StorageService.getFlows() || [];
        setFlows(localFlows);
      }
    } catch (err) {
      console.error('Erro ao buscar fluxos:', err);
      setError('Não foi possível carregar seus fluxos. Por favor, tente novamente.');
      
      // Usar fluxos locais como fallback em caso de erro
      const localFlows = StorageService.getFlows() || [];
      setFlows(localFlows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Buscar fluxos da API
    fetchFlowsFromAPI();
  }, []);

  // Função atualizada para usar async/await
  const handleCopyLink = async (id) => {
    try {
      // Gerar um compartilhamento e obter os links
      const shareData = await StorageService.shareFlow(id);
      const linkToCopy = shareData.shareUrl;

      navigator.clipboard.writeText(linkToCopy);
      // Não estamos usando setCopySuccess mais, pois não existe no código original
      
      // Mostrar feedback temporário
      alert("Link copiado para a área de transferência!");
    } catch (error) {
      console.error("Erro ao copiar link:", error);
      alert("Não foi possível copiar o link. Por favor, tente novamente.");
    }
  };

  const handleDeleteFlow = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este fluxo?')) {
      const updatedFlows = StorageService.deleteFlow(id);
      setFlows(updatedFlows);
    }
  };

  const handleDuplicateFlow = (flow) => {
    const duplicatedFlow = {
      ...flow,
      title: `${flow.title} (Cópia)`,
      id: null, // Será gerado um novo ID
      messages: [...flow.messages]
    };

    const saved = StorageService.saveFlow(duplicatedFlow);
    setFlows((prevFlows) => [...prevFlows, saved]);
  };

  // Função para criar um fluxo vazio
  const handleCreateEmptyFlow = () => {
    if (canPerformAction('create_flow', flows.length)) {
      // Criar um fluxo vazio diretamente
      const newFlow = {
        id: Date.now(),
        title: 'Novo Fluxo',
        description: 'Descrição do seu novo fluxo',
        platform: 'whatsapp',
        messageCount: 0,
        createdAt: new Date().toLocaleDateString(),
        updatedAt: new Date().toLocaleDateString(),
        messages: []
      };
      
      const savedFlow = StorageService.saveFlow(newFlow);
      setFlows((prevFlows) => [...prevFlows, savedFlow]);
      navigate(`/flow/${savedFlow.id}`);
    } else {
      alert(`Seu plano atual (${currentPlan.name}) permite apenas ${currentPlan.flowsLimit} fluxos. Atualize seu plano para criar mais fluxos.`);
    }
  };

  // Função para ir para a página de templates
  const handleUseTemplate = () => {
    if (canPerformAction('create_flow', flows.length)) {
      navigate('/templates');
    } else {
      alert(`Seu plano atual (${currentPlan.name}) permite apenas ${currentPlan.flowsLimit} fluxos. Atualize seu plano para criar mais fluxos.`);
    }
  };

  const handlePreviewFlow = (id) => {
    navigate(`/flow/${id}/preview`);
  };

  // Adicionar verificação para evitar o erro e.map
  const renderFlows = () => {
    if (loading) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p>Carregando fluxos...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
          <p className="text-red-600">{error}</p>
          <Button 
            variant="outline" 
            onClick={fetchFlowsFromAPI}
            className="mt-4"
          >
            Tentar Novamente
          </Button>
        </div>
      );
    }
    
    if (!flows || flows.length === 0) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum fluxo encontrado</h3>
            <p className="text-gray-600 mb-6">Você ainda não possui fluxos de mensagens. Crie seu primeiro fluxo para começar.</p>
            <div className="flex justify-center gap-2">
              <Button 
                variant="primary" 
                onClick={handleCreateEmptyFlow}
                icon={<PlusIcon size={18} />}
              >
                Criar do Zero
              </Button>
              <Button 
                variant="outline" 
                onClick={handleUseTemplate}
                icon={<LayoutTemplate size={18} />}
              >
                Usar Template
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <Grid cols={1} md={2} lg={3} gap={6}>
        {Array.isArray(flows) && flows.map((flow) => (
          <FlowCard
            key={flow.id}
            id={flow.id}
            title={flow.title}
            description={flow.description}
            messageCount={flow.messageCount || (flow.messages ? flow.messages.length : 0)}
            createdAt={flow.createdAt}
            updatedAt={flow.updatedAt}
            platform={flow.platform}
            link={flow.link}
            onShare={() => handleCopyLink(flow.id)}
            onDelete={() => handleDeleteFlow(flow.id)}
            onDuplicate={() => handleDuplicateFlow(flow)}
            onPreview={() => handlePreviewFlow(flow.id)}
          />
        ))}
      </Grid>
    );
  };

  return (
    <MainLayout title="Meus Fluxos">
      <Container>
        {/* Cabeçalho da página */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 sm:gap-0">
            <h1 className="text-2xl font-bold text-gray-800">Meus Fluxos</h1>
            <div className="flex gap-2">
              <Button 
                variant="primary" 
                onClick={handleCreateEmptyFlow}
                icon={<PlusIcon size={18} />}
              >
                Novo Fluxo
              </Button>
              <Button 
                variant="outline" 
                onClick={handleUseTemplate}
                icon={<LayoutTemplate size={18} />}
              >
                Usar Template
              </Button>
            </div>
          </div>
          
          <div className="bg-teal-50 border border-teal-100 rounded-md p-4 mb-6">
            <p className="text-sm text-teal-800">
              Você está usando <span className="font-semibold">{Array.isArray(flows) ? flows.length : 0}</span> de{' '}
              {currentPlan.flowsLimit === -1 ? 'ilimitados' : currentPlan.flowsLimit} fluxos disponíveis no plano {currentPlan.name}.
              {currentPlan.flowsLimit !== -1 && Array.isArray(flows) && flows.length >= currentPlan.flowsLimit && (
                <span className="ml-1">
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/plans')}
                    className="underline p-0 h-auto"
                  >
                    Atualize seu plano
                  </Button> para criar mais fluxos.
                </span>
              )}
            </p>
          </div>
        </div>
        
        {/* Conteúdo principal */}
        {renderFlows()}
      </Container>
    </MainLayout>
  );
};

export default Dashboard;