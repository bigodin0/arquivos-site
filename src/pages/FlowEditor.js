import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Settings, 
  Download, 
  Share2, 
  Eye, 
  Trash2, 
  MessageSquare,
  Save,
  Clock,
  Smartphone,
  Clipboard,
  AlertTriangle,
  Loader
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import StorageService from '../services/storage';
import axios from 'axios';
import apiConfig from '../config/api';

// Importando componentes do design system premium
import { MainLayout, Button, TextField, Select, Card, Container, Grid } from '../design-system';

const FlowEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, canPerformAction, getPlanDetails, getToken } = useAuth();
  const messageEndRef = useRef(null);
  
  // Estados
  const [flow, setFlow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState({ 
    type: 'text', 
    sender: 'business', 
    content: '', 
    delay: 0 
  });
  const [errors, setErrors] = useState({});
  const [copied, setCopied] = useState(false);
  const [originalTitle, setOriginalTitle] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [embedLink, setEmbedLink] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('whatsapp');
  const [editMode, setEditMode] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveTimeoutId, setSaveTimeoutId] = useState(null);
  
  // Obtendo detalhes do plano no nível do componente
  const currentPlan = getPlanDetails();

  // Verificar disponibilidade de recursos com base no plano
  const checkFeatureAvailability = useCallback((feature) => {
    switch (feature) {
      case 'buttons':
        // Botões disponíveis em todos os planos
        return true;
      
      case 'media':
        // Mídia disponível apenas no plano intermediário e premium
        return currentPlan.name === 'Intermediário' || 
               currentPlan.name === 'Premium' ||
               currentPlan.name === 'Empresarial';
      
      case 'audio':
      case 'gifs':
      case 'video':
        // Disponível apenas no plano intermediário e premium
        return currentPlan.name === 'Intermediário' || 
               currentPlan.name === 'Premium' ||
               currentPlan.name === 'Empresarial';
      
      default:
        return false;
    }
  }, [currentPlan.name]);

  // Renderizar aviso de recursos restritos - memoizado
  const renderFeatureRestrictionWarning = useMemo(() => {
    if (currentPlan.name === 'Básico') {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800 mb-4">
          <div className="flex items-center">
            <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
            <p>
              Recursos de mídia (imagens, áudios, GIFs e vídeos) estão disponíveis apenas nos planos Intermediário e Premium.{' '}
              <Link to="/plans" className="text-teal-600 hover:underline font-medium">
                Faça upgrade do seu plano
              </Link>
            </p>
          </div>
        </div>
      );
    }
    
    return null;
  }, [currentPlan.name]);

  // Carregar fluxo
  useEffect(() => {
    const fetchFlow = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Tentar obter o fluxo do localStorage primeiro como fallback seguro
        const loadedFlow = StorageService.getFlow(id);
        
        if (loadedFlow) {
          setFlow(loadedFlow);
          setOriginalTitle(loadedFlow.title || '');
          setSelectedPlatform(loadedFlow.platform || 'whatsapp');
          
          // Gerar links
          try {
            const shareData = await StorageService.shareFlow(id);
            setShareLink(shareData?.shareUrl || '#');
            setEmbedLink(shareData?.embedUrl || '#');
          } catch (error) {
            console.error("Erro ao gerar links:", error);
            setShareLink('#');
            setEmbedLink('#');
          }
        }
        
        // Obter o token
        const token = getToken();
        
        if (token) {
          // Tentar buscar da API
          try {
            const response = await axios.get(`${apiConfig.endpoints.flow(id)}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.data && response.data.success) {
              const flowData = response.data.data;
              
              // Garantir que flowData.messages seja um array
              if (!flowData.messages) {
                flowData.messages = [];
              }
              
              setFlow(flowData);
              setOriginalTitle(flowData.title || '');
              setSelectedPlatform(flowData.platform || 'whatsapp');
              
              // Gerar links de compartilhamento
              try {
                const shareData = await StorageService.shareFlow(id);
                setShareLink(shareData?.shareUrl || '#');
                setEmbedLink(shareData?.embedUrl || '#');
              } catch (error) {
                console.error("Erro ao gerar links:", error);
              }
            }
          } catch (apiError) {
            console.error("Erro ao buscar fluxo da API:", apiError);
            // Já temos o fallback do localStorage acima
          }
        }
      } catch (err) {
        console.error("Erro ao carregar fluxo:", err);
        setError("Não foi possível carregar o fluxo");
      } finally {
        setLoading(false);
      }
    };

    fetchFlow();
  }, [id, navigate, getToken]);

  // Scroll para a última mensagem
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [flow?.messages]);

  // Debounce para a função de salvamento
  useEffect(() => {
    if (!flow) return;
    
    // Limpar o timeout anterior se existir
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
    }
    
    const debouncedSave = setTimeout(() => {
      if (flow && flow.title && flow.title.trim() !== originalTitle) {
        handleSaveFlow();
      }
    }, 2000);
    
    setSaveTimeoutId(debouncedSave);
    
    return () => {
      if (saveTimeoutId) clearTimeout(saveTimeoutId);
    };
  }, [flow?.title, originalTitle]);

  // Função para obter os estilos com base na plataforma - memoizado
  const getPlatformTheme = useCallback((platform) => {
    switch (platform) {
      case 'whatsapp':
        return {
          headerBg: 'bg-emerald-700',
          headerText: 'text-white',
          messageBubbleUser: 'bg-[#dcf8c6] text-gray-800',
          messageBubbleBusiness: 'bg-white text-gray-800',
          chatBg: 'bg-[#e5ddd5] bg-opacity-90',
          iconColor: 'text-emerald-600',
          accentColor: 'text-emerald-600',
          accentBg: 'bg-emerald-100'
        };
      case 'messenger':
        return {
          headerBg: 'bg-[#0084ff]',
          headerText: 'text-white',
          messageBubbleUser: 'bg-[#0084ff] text-white',
          messageBubbleBusiness: 'bg-gray-200 text-gray-800',
          chatBg: 'bg-gray-100',
          iconColor: 'text-blue-600',
          accentColor: 'text-blue-600',
          accentBg: 'bg-blue-100'
        };
      case 'instagram':
        return {
          headerBg: 'bg-white border-b border-gray-200',
          headerText: 'text-gray-800',
          messageBubbleUser: 'bg-gray-100 text-gray-800',
          messageBubbleBusiness: 'bg-gray-200 text-gray-800',
          chatBg: 'bg-white',
          iconColor: 'text-pink-600',
          accentColor: 'text-pink-600',
          accentBg: 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500'
        };
      case 'telegram':
        return {
          headerBg: 'bg-[#5682a3]',
          headerText: 'text-white',
          messageBubbleUser: 'bg-[#effdde] text-gray-800',
          messageBubbleBusiness: 'bg-white text-gray-800',
          chatBg: 'bg-[#e6ebee]',
          iconColor: 'text-blue-500',
          accentColor: 'text-blue-500',
          accentBg: 'bg-blue-100'
        };
      default:
        // Padrão - WhatsApp
        return {
          headerBg: 'bg-emerald-700',
          headerText: 'text-white',
          messageBubbleUser: 'bg-[#dcf8c6] text-gray-800',
          messageBubbleBusiness: 'bg-white text-gray-800',
          chatBg: 'bg-[#e5ddd5] bg-opacity-90',
          iconColor: 'text-emerald-600',
          accentColor: 'text-emerald-600',
          accentBg: 'bg-emerald-100'
        };
    }
  }, []);

  // Handlers
  const handleSaveFlow = useCallback(async () => {
    // Validação do fluxo
    const newErrors = {};
    if (!flow?.title?.trim()) {
      newErrors.title = 'Título é obrigatório';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setSaving(true);
    
    try {
      // Garantir que flow.messages seja sempre um array
      if (!flow.messages) {
        flow.messages = [];
      }
      
      // Atualizar contagens
      const updatedFlow = {
        ...flow,
        platform: selectedPlatform,
        messageCount: Array.isArray(flow.messages) ? flow.messages.length : 0,
        updatedAt: new Date().toLocaleDateString(),
      };
      
      // Obter o token
      const token = getToken();
      
      // Tentar salvar localmente primeiro para ter um fallback garantido
      const savedFlow = StorageService.updateFlow(updatedFlow);
      
      if (token) {
        // Tentar salvar na API
        try {
          const response = await axios.put(
            apiConfig.endpoints.flow(id),
            updatedFlow,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (!response.data || !response.data.success) {
            console.warn("API não retornou sucesso ao salvar. Usando salvamento local como fallback.");
          }
        } catch (apiError) {
          console.error("Erro ao salvar na API:", apiError);
          // Já temos o fallback local acima
        }
      }
      
      setErrors({});
      
      // Mostrar feedback
      const saveBtn = document.getElementById('save-btn');
      if (saveBtn) {
        saveBtn.textContent = 'Salvo!';
        setTimeout(() => {
          saveBtn.textContent = 'Salvar';
        }, 2000);
      }
    } catch (error) {
      console.error("Erro ao salvar fluxo:", error);
      setErrors({ general: "Erro ao salvar. Tente novamente." });
    } finally {
      setSaving(false);
    }
  }, [flow, id, selectedPlatform, getToken]);

  const handleAddMessage = useCallback(() => {
    // Validação da nova mensagem
    const msgErrors = {};
    if (!newMessage.content || !newMessage.content.trim()) {
      msgErrors.content = 'Conteúdo da mensagem é obrigatório';
      setErrors(msgErrors);
      return;
    }
    
    // Adicionar mensagem
    const message = {
      id: Date.now(),
      ...newMessage
    };
    
    // Garantir que flow e flow.messages sejam válidos
    if (!flow) {
      console.error("Flow não está definido!");
      return;
    }
    
    // Garantir que messages seja um array
    const currentMessages = Array.isArray(flow.messages) ? flow.messages : [];
    
    setFlow(prevFlow => ({
      ...prevFlow,
      messages: [...currentMessages, message]
    }));
    
    // Resetar
    setNewMessage({ 
      type: 'text', 
      sender: 'business', 
      content: '', 
      delay: 0 
    });
    setErrors({});
    
    // Salvar automaticamente após adicionar a mensagem
    setTimeout(() => {
      handleSaveFlow();
    }, 500);
  }, [newMessage, flow, handleSaveFlow]);

  const handleUpdateMessage = useCallback(() => {
    if (!newMessage.content.trim()) {
      setErrors({ content: 'Conteúdo da mensagem é obrigatório' });
      return;
    }
    
    setFlow(prevFlow => {
      const updatedMessages = [...prevFlow.messages];
      updatedMessages[editIndex] = {
        ...updatedMessages[editIndex],
        content: newMessage.content,
        sender: newMessage.sender,
        delay: newMessage.delay,
        type: newMessage.type
      };
      
      return {
        ...prevFlow,
        messages: updatedMessages
      };
    });
    
    // Resetar
    setNewMessage({ 
      type: 'text', 
      sender: 'business', 
      content: '', 
      delay: 0 
    });
    setEditMode(null);
    setEditIndex(null);
    setErrors({});
  }, [newMessage, editIndex]);

  const handleEditMessage = useCallback((index) => {
    const message = flow.messages[index];
    setNewMessage({
      type: message.type,
      sender: message.sender,
      content: message.content,
      delay: message.delay
    });
    setEditMode('edit');
    setEditIndex(index);
  }, [flow?.messages]);

  const handleDeleteMessage = useCallback((id) => {
    if (window.confirm('Tem certeza que deseja excluir esta mensagem?')) {
      setFlow(prevFlow => ({
        ...prevFlow,
        messages: prevFlow.messages.filter(msg => msg.id !== id)
      }));
    }
  }, []);

  const handleCopyLink = useCallback(async (type = 'share') => {
    try {
      const linkToCopy = type === 'share' ? (shareLink || '#') : (embedLink || '#');
      
      // Verifica se o link é válido antes de copiar
      if (linkToCopy === '#') {
        console.warn("Link não disponível para copiar");
        alert("Link não disponível no momento. Por favor, salve o fluxo primeiro.");
        return;
      }
      
      await navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Feedback para o usuário
      alert("Link copiado para a área de transferência!");
    } catch (error) {
      console.error("Erro ao copiar link:", error);
      alert("Não foi possível copiar o link. Por favor, tente novamente.");
    }
  }, [shareLink, embedLink]);

  const handlePreview = useCallback(() => {
    // Salvar antes de visualizar
    handleSaveFlow();
    navigate(`/flow/${id}/preview`);
  }, [handleSaveFlow, id, navigate]);

  // Funções de renderização
  const renderMessageBubble = useCallback((message, index) => {
    const isCustomer = message.sender === 'customer';
    const isBusiness = message.sender === 'business';
    const theme = getPlatformTheme(selectedPlatform);
    
    return (
      <div 
        key={message.id} 
        className={`flex mb-4 ${isCustomer ? 'justify-end' : 'justify-start'}`}
      >
        <div 
          className={`
            relative p-3 rounded-lg max-w-[80%] shadow-sm group
            ${isCustomer ? theme.messageBubbleUser : ''}
            ${isBusiness ? theme.messageBubbleBusiness : ''}
          `}
        >
          <div className="mb-1 text-xs opacity-70">
            {isCustomer ? 'Cliente' : 'Empresa'} 
            {message.delay > 0 && (
              <span className="ml-2 inline-flex items-center">
                <Clock size={12} className="mr-1" />
                {message.delay}s
              </span>
            )}
          </div>
          
          <div className="text-sm break-words">{message.content}</div>
          
          {/* Ações da mensagem - aparecem no hover */}
          <div className="absolute -top-3 -right-3 hidden group-hover:flex space-x-1">
            <button 
              onClick={() => handleEditMessage(index)}
              className="p-1 bg-white text-teal-600 rounded-full shadow-md hover:bg-teal-50"
            >
              <Settings size={14} />
            </button>
            <button 
              onClick={() => handleDeleteMessage(message.id)}
              className="p-1 bg-white text-red-500 rounded-full shadow-md hover:bg-red-50"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }, [selectedPlatform, getPlatformTheme, handleEditMessage, handleDeleteMessage]);
  
  // Uso de useMemo para otimizar renderização de mensagens
  const renderMessages = useMemo(() => {
    // Garantir que flow e flow.messages sejam válidos
    if (!flow || !Array.isArray(flow.messages) || flow.messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-60 text-gray-400">
          <MessageSquare size={40} className="mb-2 opacity-30" />
          <p>Nenhuma mensagem adicionada</p>
          <p className="text-sm">Adicione mensagens para criar seu fluxo</p>
        </div>
      );
    }
    return flow.messages.map((message, index) => renderMessageBubble(message, index));
  }, [flow?.messages, renderMessageBubble]);
  
  const renderPlatformPreview = useMemo(() => {
    const theme = getPlatformTheme(selectedPlatform);
    let platformIcon;
    
    switch (selectedPlatform) {
      case 'whatsapp':
        platformIcon = <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"><MessageSquare size={18} className="text-white" /></div>;
        break;
      case 'messenger':
        platformIcon = <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"><MessageSquare size={18} className="text-white" /></div>;
        break;
      case 'instagram':
        platformIcon = <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center"><MessageSquare size={18} className="text-white" /></div>;
        break;
      case 'telegram':
        platformIcon = <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center"><MessageSquare size={18} className="text-white" /></div>;
        break;
      default:
        platformIcon = <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center"><MessageSquare size={18} className="text-white" /></div>;
    }
    
    return (
      <div className={`border ${theme.chatBg} border-gray-200 rounded-xl p-4 mb-4 flex items-center space-x-3`}>
        {platformIcon}
        <div>
          <h3 className="font-medium text-gray-800">{selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}</h3>
          <p className="text-xs text-gray-500">Visualização personalizada para esta plataforma</p>
        </div>
      </div>
    );
  }, [selectedPlatform, getPlatformTheme]);

  // Estatísticas memoizadas
  const flowStats = useMemo(() => {
    if (!flow || !Array.isArray(flow.messages)) {
      return {
        totalMessages: 0,
        totalDelay: 0,
        businessMessages: 0,
        customerMessages: 0
      };
    }
    
    return {
      totalMessages: flow.messages.length,
      totalDelay: flow.messages.reduce((total, msg) => total + (msg.delay || 0), 0),
      businessMessages: flow.messages.filter(m => m.sender === 'business').length,
      customerMessages: flow.messages.filter(m => m.sender === 'customer').length
    };
  }, [flow?.messages]);

  if (loading) {
    return (
      <MainLayout>
        <Container>
          <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center">
              <Loader size={36} className="text-teal-600 animate-spin mb-4" />
              <div className="text-gray-600">Carregando fluxo...</div>
            </div>
          </div>
        </Container>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Container>
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center max-w-md">
              <AlertTriangle size={40} className="text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Erro ao carregar fluxo</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button 
                variant="primary" 
                onClick={() => navigate('/dashboard')}
              >
                Voltar para Dashboard
              </Button>
            </div>
          </div>
        </Container>
      </MainLayout>
    );
  }

  if (!flow) {
    return (
      <MainLayout>
        <Container>
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <AlertTriangle size={36} className="text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Fluxo não encontrado</h2>
              <p className="text-gray-600 mb-4">O fluxo que você está procurando não existe ou foi removido.</p>
              <Button 
                variant="primary" 
                onClick={() => navigate('/dashboard')}
              >
                Voltar para Dashboard
              </Button>
            </div>
          </div>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Editor de Fluxo">
      <Container>
        {/* Cabeçalho */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="mr-2"
              icon={<ArrowLeft size={16} />}
            >
              Voltar
            </Button>
            <TextField
              value={flow.title}
              onChange={(e) => setFlow({...flow, title: e.target.value})}
              placeholder="Título do fluxo"
              error={errors.title}
              className="font-semibold w-full max-w-md"
            />
            <Button 
              id="save-btn"
              variant="primary"
              onClick={handleSaveFlow}
              className="ml-2"
              icon={saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
          
          <TextField
            value={flow.description || ''}
            onChange={(e) => setFlow({...flow, description: e.target.value})}
            placeholder="Descrição do fluxo (opcional)"
            className="w-full text-sm mb-4"
          />
          
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center space-x-2">
              <Smartphone size={16} className="text-teal-600" />
              <span className="text-sm text-gray-700">Plataforma:</span>
            </div>
            <Select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              options={[
                { value: 'whatsapp', label: 'WhatsApp' },
                { value: 'messenger', label: 'Messenger' },
                { value: 'instagram', label: 'Instagram' },
                { value: 'telegram', label: 'Telegram' },
              ]}
              className="w-40"
            />
            
            <div className="flex space-x-2 ml-auto">
              <Button 
                variant="outline" 
                onClick={() => handleCopyLink('share')}
                icon={<Share2 size={16} />}
              >
                {copied ? 'Copiado!' : 'Copiar Link'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handlePreview}
                icon={<Eye size={16} />}
              >
                Visualizar
              </Button>
            </div>
          </div>
        </div>
        
        {/* Layout Principal */}
        <Grid cols={12} gap={6}>
          {/* Coluna da conversa */}
          <div className="col-span-12 lg:col-span-7">
            <Card>
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <MessageSquare size={18} className="mr-2 text-teal-600" />
                  Conversação
                </h2>
                
                {renderFeatureRestrictionWarning}
                
                {renderPlatformPreview}
                
                {/* Área de mensagens */}
                <div className={`${getPlatformTheme(selectedPlatform).chatBg} rounded-lg p-4 mb-4 min-h-[300px] max-h-[400px] overflow-y-auto`}>
                  {renderMessages}
                  <div ref={messageEndRef} />
                </div>
                
                {/* Formulário de mensagem */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-wrap gap-3 mb-3">
                    <Select
                      label="Remetente"
                      value={newMessage.sender}
                      onChange={(e) => setNewMessage({...newMessage, sender: e.target.value})}
                      options={[
                        { value: 'business', label: 'Empresa' },
                        { value: 'customer', label: 'Cliente' }
                      ]}
                      className="w-32"
                    />
                    
                    <Select
                      label="Tipo"
                      value={newMessage.type}
                      onChange={(e) => setNewMessage({...newMessage, type: e.target.value})}
                      options={[
                        { value: 'text', label: 'Texto' },
                        { value: 'buttons', label: 'Botões' },
                        { 
                          value: 'image', 
                          label: 'Imagem', 
                          disabled: !checkFeatureAvailability('media')
                        },
                        { 
                          value: 'audio', 
                          label: 'Áudio', 
                          disabled: !checkFeatureAvailability('audio')
                        },
                        { 
                          value: 'gif', 
                          label: 'GIF', 
                          disabled: !checkFeatureAvailability('gifs')
                        },
                        { 
                          value: 'video', 
                          label: 'Vídeo', 
                          disabled: !checkFeatureAvailability('video')
                        }
                      ]}
                      className="w-full sm:w-40"
                    />
                    
                    <div className="flex flex-col w-32">
                      <label className="text-xs font-medium text-gray-700 mb-1">Atraso (seg)</label>
                      <input
                        type="number"
                        min="0"value={newMessage.delay}
                        onChange={(e) => setNewMessage({...newMessage, delay: parseInt(e.target.value) || 0})}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <TextField
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                    placeholder="Digite a mensagem..."
                    multiline
                    rows={4}
                    error={errors.content}
                    className="w-full mb-3"
                  />
                  
                  <div className="flex justify-end space-x-2">
                    {editMode === 'edit' ? (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setNewMessage({ 
                              type: 'text', 
                              sender: 'business', 
                              content: '', 
                              delay: 0 
                            });
                            setEditMode(null);
                            setEditIndex(null);
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          variant="primary" 
                          onClick={handleUpdateMessage}
                          icon={<Save size={16} />}
                        >
                          Atualizar
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="primary" 
                        onClick={handleAddMessage}
                        icon={<Plus size={16} />}
                      >
                        Adicionar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Coluna de estatísticas e detalhes */}
          <div className="col-span-12 lg:col-span-5">
            <Card>
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Clipboard size={18} className="mr-2 text-teal-600" />
                  Detalhes do Fluxo
                </h2>
                
                {/* Estatísticas */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="border border-gray-200 rounded-lg p-3">
                    <div className="text-sm text-gray-500 mb-1">Total de mensagens</div>
                    <div className="text-2xl font-semibold text-gray-800">{flowStats.totalMessages}</div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-3">
                    <div className="text-sm text-gray-500 mb-1">Tempo total (segundos)</div>
                    <div className="text-2xl font-semibold text-gray-800">{flowStats.totalDelay}</div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-3">
                    <div className="text-sm text-gray-500 mb-1">Mensagens da empresa</div>
                    <div className="text-2xl font-semibold text-gray-800">{flowStats.businessMessages}</div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-3">
                    <div className="text-sm text-gray-500 mb-1">Mensagens do cliente</div>
                    <div className="text-2xl font-semibold text-gray-800">{flowStats.customerMessages}</div>
                  </div>
                </div>
                
                {/* Informações adicionais */}
                <div className="border border-gray-200 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-gray-800 mb-2">Informações do fluxo</h3>
                  
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="text-gray-500">ID:</div>
                    <div className="font-mono">{id}</div>
                    
                    <div className="text-gray-500">Criado em:</div>
                    <div>{flow.createdAt || 'N/A'}</div>
                    
                    <div className="text-gray-500">Atualizado em:</div>
                    <div>{flow.updatedAt || 'N/A'}</div>
                    
                    <div className="text-gray-500">Plataforma:</div>
                    <div className="capitalize">{selectedPlatform}</div>
                  </div>
                </div>
                
                {/* Ações avançadas */}
                <div className="flex flex-col space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handlePreview()}
                    className="w-full"
                    icon={<Eye size={16} />}
                  >
                    Modo de visualização
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => handleCopyLink('embed')}
                    className="w-full"
                    icon={<Share2 size={16} />}
                  >
                    Copiar código de incorporação
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja excluir este fluxo? Esta ação não pode ser desfeita.')) {
                        // Implementar exclusão
                        navigate('/dashboard');
                      }
                    }}
                    className="w-full text-red-600 hover:bg-red-50 border-red-200"
                    icon={<Trash2 size={16} />}
                  >
                    Excluir fluxo
                  </Button>
                </div>
              </div>
            </Card>
            
            {/* Dicas */}
            <Card className="mt-4">
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Dicas</h2>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                  <li>Alterne entre mensagens da empresa e do cliente para simular uma conversa real.</li>
                  <li>Adicione atrasos para simular o tempo de digitação.</li>
                  <li>Use o modo de visualização para testar como seu fluxo ficará para os usuários.</li>
                  <li>Salve regularmente para não perder seu progresso.</li>
                </ul>
              </div>
            </Card>
          </div>
        </Grid>
        
        {/* Feedback de erro geral */}
        {errors.general && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {errors.general}
          </div>
        )}
      </Container>
    </MainLayout>
  );
};

export default FlowEditor;