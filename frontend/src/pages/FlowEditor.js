import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
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
  Loader,
  Copy,
  Image,
  Film,
  Music,
  FileImage
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StorageService from '../services/storage';
import SecureStorageService from '../services/secureStorage';
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
  const [buttonsConfig, setButtonsConfig] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [sharePageSettings, setSharePageSettings] = useState({
    showHeader: true,
    headerColor: '#00A19D',
    headerText: '',
    logoUrl: '',
    productImage: '',
    productDescription: '',
    showFooter: true,
    footerText: '',
    watermarkEnabled: true
  });
  
  // Obtendo detalhes do plano no nível do componente
  const currentPlan = getPlanDetails();

  // Verificação de autenticação (adicionada da correção)
  const checkAuthentication = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('Token de autenticação não encontrado');
      return false;
    }
    
    // Verificar se o token está expirado (se tiver um mecanismo para isso)
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      if (tokenData.exp && tokenData.exp < Date.now() / 1000) {
        console.warn('Token expirado, redirecionando para login');
        // Redirecionar para login ou renovar o token
        return false;
      }
    } catch (e) {
      console.error('Erro ao verificar token:', e);
      return false;
    }
    
    return true;
  };

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

  // Função para carregar arquivos de mídia
  useEffect(() => {
    const loadMediaFiles = async () => {
      try {
        // Correção: Verificar se o objeto existe e tem a função antes de chamar
        if (StorageService && typeof StorageService.getMediaFiles === 'function') {
          const files = await StorageService.getMediaFiles();
          setMediaFiles(files || []);
        } else {
          // Fallback para um array vazio se a função não existir
          console.warn('StorageService.getMediaFiles não está disponível');
          setMediaFiles([]);
        }
      } catch (error) {
        console.error("Erro ao carregar arquivos de mídia:", error);
        setMediaFiles([]);
      }
    };
    
    if (checkFeatureAvailability('media')) {
      loadMediaFiles();
    }
  }, [checkFeatureAvailability]);

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
          // Garantir que o ID da URL seja atribuído ao fluxo
          loadedFlow.id = id;
          
          setFlow(loadedFlow);
          setOriginalTitle(loadedFlow.title || '');
          setSelectedPlatform(loadedFlow.platform || 'whatsapp');
          
          // Carregar configurações da página de compartilhamento se existir
          if (loadedFlow.sharePageSettings) {
            setSharePageSettings(loadedFlow.sharePageSettings);
          }
          
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
        } else {
          // Se não existe um fluxo com este ID, criar um novo
          const uniqueId = id || `flow_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          const newFlow = {
            id: uniqueId,
            title: 'Novo Fluxo',
            description: 'Descrição do seu novo fluxo',
            platform: 'whatsapp',
            messages: [],
            createdAt: new Date().toLocaleDateString(),
            updatedAt: new Date().toLocaleDateString(),
            sharePageSettings: {
              showHeader: true,
              headerColor: '#00A19D',
              headerText: '',
              logoUrl: '',
              productImage: '',
              productDescription: '',
              showFooter: true,
              footerText: '',
              watermarkEnabled: true
            }
          };
          
          setFlow(newFlow);
          setOriginalTitle(newFlow.title);
          setSelectedPlatform(newFlow.platform);
          
          // Salvar o novo fluxo imediatamente para garantir persistência
          setTimeout(() => {
            StorageService.saveFlow(newFlow);
          }, 0);
        }
        
        // Verificar se o token é válido usando a nova função de checkAuthentication
        if (checkAuthentication()) {
          // Tentar buscar da API
          try {
            const headers = SecureStorageService.getAuthHeaders().headers;
            
            const response = await axios.get(`${apiConfig.endpoints.flow(id)}`, {
              headers
            });
            
            if (response.data && response.data.success) {
              const flowData = response.data.data;
              
              // Garantir que o ID da URL seja atribuído ao fluxo
              flowData.id = id;
              
              // Garantir que flowData.messages seja um array
              if (!flowData.messages) {
                flowData.messages = [];
              }
              
              setFlow(flowData);
              setOriginalTitle(flowData.title || '');
              setSelectedPlatform(flowData.platform || 'whatsapp');
              
              // Carregar configurações da página de compartilhamento se existir
              if (flowData.sharePageSettings) {
                setSharePageSettings(flowData.sharePageSettings);
              }
              
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

  // Função para lidar com arrastar e soltar mensagens
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(flow.messages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setFlow({
      ...flow,
      messages: items
    });
    
    // Salvar automaticamente após reordenar
    setTimeout(() => {
      handleSaveFlow();
    }, 500);
  };

  // Handlers
  const handleSaveFlow = useCallback(async () => {
    // Validação do fluxo
    const newErrors = {};
    if (!flow?.title?.trim()) {
      newErrors.title = 'Título é obrigatório';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    
    setSaving(true);
    
    try {
      // Garantir que flow.messages seja sempre um array
      if (!flow.messages) {
        flow.messages = [];
      }
      
      // Garantir que o ID seja definido
      if (!flow.id) {
        flow.id = id;
      }
      
      // Atualizar contagens
      const updatedFlow = {
        ...flow,
        id: id, // Garantir que o ID está explicitamente definido
        platform: selectedPlatform,
        messageCount: Array.isArray(flow.messages) ? flow.messages.length : 0,
        updatedAt: new Date().toLocaleDateString(),
        sharePageSettings // Incluir configurações de personalização da página de compartilhamento
      };
      
      // Tentar salvar localmente primeiro para ter um fallback garantido
      const savedFlow = StorageService.updateFlow(updatedFlow);
      
      // Verificar se o token é válido usando a nova função de checkAuthentication
      if (checkAuthentication()) {
        try {
          const headers = SecureStorageService.getAuthHeaders().headers;
          
          const response = await axios.put(
            apiConfig.endpoints.flow(id),
            updatedFlow,
            { headers }
          );
          
          if (!response.data || !response.data.success) {
            console.warn("API não retornou sucesso ao salvar. Usando salvamento local como fallback.");
          }
        } catch (apiError) {
          console.error("Erro ao salvar na API:", apiError);
          // Já temos o fallback do localStorage acima
          
          // Verificar se é erro de token inválido
          if (apiError.response && apiError.response.status === 401) {
            // Token expirado ou inválido
            SecureStorageService.clearToken();
            // Não redirecionamos aqui para evitar perda de dados não salvos
          }
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
      
      return true;
    } catch (error) {
      console.error("Erro ao salvar fluxo:", error);
      setErrors({ general: "Erro ao salvar. Tente novamente." });
      return false;
    } finally {
      setSaving(false);
    }
  }, [flow, id, selectedPlatform, sharePageSettings]);

  const handleAddButtonOption = () => {
    setButtonsConfig([...buttonsConfig, { 
      id: Date.now(),
      text: '',
      responseMessage: '',
      jumpTo: ''
    }]);
  };

  const handleUpdateButtonConfig = (index, field, value) => {
    const updatedButtons = [...buttonsConfig];
    updatedButtons[index][field] = value;
    setButtonsConfig(updatedButtons);
  };

  const handleRemoveButtonOption = (index) => {
    const updatedButtons = [...buttonsConfig];
    updatedButtons.splice(index, 1);
    setButtonsConfig(updatedButtons);
  };

  // Função para lidar com interação do botão na visualização
  const handleButtonInteraction = (button, messageId) => {
    // Adicionar a resposta do cliente ao fluxo
    if (button.responseMessage || button.text) {
      const customerResponse = {
        id: Date.now(),
        type: 'text',
        sender: 'customer',
        content: button.responseMessage || button.text,
        delay: 0
      };
      
      // Adicionar resposta ao fluxo
      setFlow(prevFlow => ({
        ...prevFlow,
        messages: [...prevFlow.messages, customerResponse]
      }));
    }
    
    // Se houver um destino (jumpTo), implementar a lógica de pular
    if (button.jumpTo) {
      // Esta lógica seria implementada na visualização/simulação
      console.log(`Pulando para mensagem ID: ${button.jumpTo}`);
    }
  };

  const handleAddMessage = useCallback(() => {
    // Validação da nova mensagem
    const msgErrors = {};
    if (!newMessage.content || !newMessage.content.trim()) {
      msgErrors.content = 'Conteúdo da mensagem é obrigatório';
      setErrors(msgErrors);
      return;
    }
    
    // Adicionar mensagem
    let messageToAdd = {
      id: Date.now(),
      ...newMessage
    };
    
    // Adicionar botões se o tipo for 'buttons'
    if (newMessage.type === 'buttons' && buttonsConfig.length > 0) {
      messageToAdd.buttons = buttonsConfig;
    }
    
    // Garantir que flow e flow.messages sejam válidos
    if (!flow) {
      console.error("Flow não está definido!");
      return;
    }
    
    // Garantir que messages seja um array
    const currentMessages = Array.isArray(flow.messages) ? flow.messages : [];
    
    setFlow(prevFlow => ({
      ...prevFlow,
      messages: [...currentMessages, messageToAdd]
    }));
    
    // Resetar
    setNewMessage({ 
      type: 'text', 
      sender: 'business', 
      content: '', 
      delay: 0 
    });
    setButtonsConfig([]);
    setErrors({});
    setShowMediaSelector(false);
    
    // Salvar automaticamente após adicionar a mensagem
    setTimeout(() => {
      handleSaveFlow();
    }, 500);
  }, [newMessage, flow, buttonsConfig, handleSaveFlow]);

  const handleUpdateMessage = useCallback(() => {
    if (!newMessage.content.trim()) {
      setErrors({ content: 'Conteúdo da mensagem é obrigatório' });
      return;
    }
    
    let updatedMessage = {
      ...flow.messages[editIndex],
      content: newMessage.content,
      sender: newMessage.sender,
      delay: newMessage.delay,
      type: newMessage.type
    };
    
    // Adicionar botões se o tipo for 'buttons'
    if (newMessage.type === 'buttons') {
      updatedMessage.buttons = buttonsConfig;
    }
    
    setFlow(prevFlow => {
      const updatedMessages = [...prevFlow.messages];
      updatedMessages[editIndex] = updatedMessage;
      
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
    setButtonsConfig([]);
    setEditMode(null);
    setEditIndex(null);
    setErrors({});
    setShowMediaSelector(false);
    
    // Salvar após atualizar
    setTimeout(() => {
      handleSaveFlow();
    }, 500);
  }, [newMessage, editIndex, flow?.messages, buttonsConfig, handleSaveFlow]);

  const handleEditMessage = useCallback((index) => {
    const message = flow.messages[index];
    setNewMessage({
      type: message.type,
      sender: message.sender,
      content: message.content,
      delay: message.delay
    });
    
    // Carregar config de botões se for uma mensagem de botões
    if (message.type === 'buttons' && Array.isArray(message.buttons)) {
      setButtonsConfig(message.buttons);
    } else {
      setButtonsConfig([]);
    }
    
    // Mostrar seletor de mídia se for um tipo de mídia
    if (['image', 'video', 'audio', 'gif'].includes(message.type)) {
      setShowMediaSelector(true);
    } else {
      setShowMediaSelector(false);
    }
    
    setEditMode('edit');
    setEditIndex(index);
  }, [flow?.messages]);

  const handleDeleteMessage = useCallback((id) => {
    if (window.confirm('Tem certeza que deseja excluir esta mensagem?')) {
      setFlow(prevFlow => ({
        ...prevFlow,
        messages: prevFlow.messages.filter(msg => msg.id !== id)
      }));
      
      // Salvar após deletar
      setTimeout(() => {
        handleSaveFlow();
      }, 500);
    }
  }, [handleSaveFlow]);

  const handleCopyLink = useCallback(async (type = 'share') => {
    try {
      // Primeiro, garantir que o fluxo está salvo com dados atualizados
      const saved = await handleSaveFlow();
      
      if (!saved) {
        throw new Error("Não foi possível salvar o fluxo antes de compartilhar");
      }
      
      // Gerar links de compartilhamento
      const shareData = await StorageService.shareFlow(id);
      
      if (!shareData || !shareData.success) {
        throw new Error("Não foi possível gerar o link de compartilhamento");
      }
      
      // Atualizar os links no estado
      setShareLink(shareData.shareUrl || '#');
      setEmbedLink(shareData.embedUrl || '#');
      
      // Verificar se os links são válidos
      const linkToCopy = type === 'share' ? shareData.shareUrl : shareData.embedUrl;
      
      if (!linkToCopy || linkToCopy === '#') {
        console.error("Link não disponível para copiar");
        alert("Erro ao gerar link. Por favor, tente novamente.");
        return;
      }
      
      // Copiar o link apropriado
      await navigator.clipboard.writeText(linkToCopy);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Feedback para o usuário
      alert(`Link ${type === 'share' ? 'de compartilhamento' : 'de incorporação'} copiado!`);
    } catch (error) {
      console.error("Erro ao copiar link:", error);
      alert("Erro ao gerar o link. Por favor, salve o fluxo primeiro e tente novamente.");
    }
  }, [id, handleSaveFlow]);

  const handlePreview = useCallback(() => {
    // Salvar antes de visualizar
    handleSaveFlow();
    navigate(`/flow/${id}/preview`);
  }, [handleSaveFlow, id, navigate]);

  // Função para selecionar arquivo de mídia
  const handleSelectMedia = (fileUrl) => {
    setNewMessage({...newMessage, content: fileUrl});
    setShowMediaSelector(false);
  };

  // Função para obter o ícone apropriado para o tipo de mídia
  const getMediaTypeIcon = (type) => {
    switch (type) {
      case 'image':
        return <Image size={16} className="mr-1" />;
      case 'video':
        return <Film size={16} className="mr-1" />;
      case 'audio':
        return <Music size={16} className="mr-1" />;
      case 'gif':
        return <FileImage size={16} className="mr-1" />;
      default:
        return <FileImage size={16} className="mr-1" />;
    }
  };

  // Componente de seleção de mídia
  const MediaSelector = () => {
    if (!checkFeatureAvailability('media')) {
      return (
        <div className="bg-gray-50 p-3 rounded-lg text-gray-500 text-sm text-center mb-4">
          Upgrade seu plano para utilizar recursos de mídia
        </div>
      );
    }
    
    return (
      <div className="border rounded-lg p-3 bg-gray-50 mb-4">
        <h5 className="font-medium text-sm mb-3">Selecione um arquivo de mídia:</h5>
        
        {mediaFiles.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-gray-500 text-sm">Nenhum arquivo disponível</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => navigate('/media-library')}
            >
              Adicionar arquivos
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {mediaFiles.map(file => (
              <div
                key={file.id}
                className="border rounded p-2 hover:border-teal-400 cursor-pointer transition-colors"
                onClick={() => handleSelectMedia(file.url)}
              >
                <div className="h-16 bg-gray-200 flex items-center justify-center mb-1">
                  {file.type.startsWith('image/') ? (
                    <img src={file.url} alt={file.name} className="h-full object-contain" />
                  ) : file.type.startsWith('video/') ? (
                    <Film size={24} className="text-gray-500" />
                  ) : file.type.startsWith('audio/') ? (
                    <Music size={24} className="text-gray-500" />
                  ) : (
                    <div className="text-gray-500 text-xs">{file.type.split('/')[0]}</div>
                  )}
                </div>
                <p className="text-xs truncate">{file.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

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
          <div className="mb-1 text-xs opacity-70 flex items-center justify-between">
            <span>{isCustomer ? 'Cliente' : 'Empresa'}</span>
            {message.delay > 0 && (
              <span className="ml-2 inline-flex items-center">
                <Clock size={12} className="mr-1" />
                {message.delay}s
              </span>
            )}
            <span className="text-xs text-teal-600 opacity-50 ml-2">ID: {message.id}</span>
          </div>
          
          <div className="text-sm break-words">
            {message.type === 'buttons' && Array.isArray(message.buttons) ? (
              <div>
                <p className="mb-3">{message.content}</p>
                <div className="space-y-2">
                  {message.buttons.map((button, btnIndex) => (
                    <button
                      key={btnIndex}
                      className="w-full py-2 px-3 rounded-lg text-center bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 transition-colors"
                      onClick={() => handleButtonInteraction(button, message.id)}
                    >
                      {button.text}
                      {button.jumpTo && (
                        <span className="ml-1 text-xs text-gray-500">
                          → {button.jumpTo}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : message.type === 'image' ? (
              <div>
                <img 
                  src={message.content} 
                  alt="Imagem" 
                  className="max-w-full rounded" 
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = 'https://via.placeholder.com/150?text=Imagem+não+encontrada';
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">Imagem</p>
              </div>
            ) : message.type === 'video' ? (
              <div>
                <div className="bg-gray-800 rounded-lg p-2 flex items-center justify-center">
                  <Film size={24} className="text-gray-400" />
                  <span className="ml-2 text-gray-400">{message.content}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">Vídeo</p>
              </div>
            ) : message.type === 'audio' ? (
              <div>
                <div className="bg-gray-100 rounded-lg p-2 flex items-center">
                  <Music size={20} className="text-gray-500" />
                  <span className="ml-2 text-gray-600">{message.content}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">Áudio</p>
              </div>
            ) : message.type === 'gif' ? (
              <div>
                <img 
                  src={message.content} 
                  alt="GIF" 
                  className="max-w-full rounded" 
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = 'https://via.placeholder.com/150?text=GIF+não+encontrado';
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">GIF</p>
              </div>
            ) : (
              message.content
            )}
          </div>
          
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
  }, [selectedPlatform, getPlatformTheme, handleEditMessage, handleDeleteMessage, handleButtonInteraction]);
  
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
                
                {/* Área de mensagens com drag and drop */}
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="messages">
                    {(provided) => (
                      <div 
                        className={`${getPlatformTheme(selectedPlatform).chatBg} rounded-lg p-4 mb-4 min-h-[300px] max-h-[400px] overflow-y-auto`}
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {flow.messages.map((message, index) => (
                          <Draggable 
                            key={message.id.toString()} 
                            draggableId={message.id.toString()} 
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                {renderMessageBubble(message, index)}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        <div ref={messageEndRef} />
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                
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
                      onChange={(e) => {
                        setNewMessage({...newMessage, type: e.target.value});
                        setShowMediaSelector(['image', 'video', 'audio', 'gif'].includes(e.target.value));
                      }}
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
                        min="0"
                        value={newMessage.delay}
                        onChange={(e) => {
                          // Permitir campo vazio para facilitar a edição
                          const value = e.target.value === '' ? '' : parseInt(e.target.value);
                          setNewMessage({...newMessage, delay: value === '' ? 0 : value});
                        }}
                        onFocus={(e) => {
                          // Selecionar todo o texto ao focar para facilitar substituição
                          e.target.select();
                        }}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                  </div>

                  {/* Seletor de mídia para tipos não texto/botões */}
                  {showMediaSelector && (
                    <MediaSelector />
                  )}

                  {/* Editor de conteúdo da mensagem */}
                  <TextField
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                    placeholder="Digite a mensagem..."
                    multiline
                    rows={3}
                    error={errors.content}
                    className="w-full mb-3"
                  />

                  {/* Configuração de botões */}
                  {newMessage.type === 'buttons' && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-sm">Configuração de Botões</h5>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddButtonOption}
                        >
                          Adicionar Botão
                        </Button>
                      </div>
                      
                      {buttonsConfig.length === 0 ? (
                        <div className="text-center py-3 text-gray-500 text-sm">
                          Adicione botões para interação
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {buttonsConfig.map((button, index) => (
                            <div key={index} className="border rounded-lg p-3 bg-white">
                              <div className="flex justify-between items-center mb-2">
                                <h6 className="font-medium text-sm text-gray-700">Botão {index + 1}</h6>
                                <button
                                  onClick={() => handleRemoveButtonOption(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              
                              <div className="space-y-3">
                                <TextField
                                  label="Texto do botão"
                                  value={button.text}
                                  onChange={(e) => handleUpdateButtonConfig(index, 'text', e.target.value)}
                                  placeholder="Ex: Sim, quero comprar"
                                  size="sm"
                                />
                                
                                <TextField
                                  label="Mensagem de resposta"
                                  value={button.responseMessage}
                                  onChange={(e) => handleUpdateButtonConfig(index, 'responseMessage', e.target.value)}
                                  placeholder="Texto que aparecerá como resposta do cliente"
                                  size="sm"
                                />
                                
                                <div className="border-t pt-3 mt-3">
                                  <h6 className="text-xs font-medium mb-2 text-gray-700">Pular para mensagem específica:</h6>
                                  
                                  <Select
                                    value={button.jumpTo || ''}
                                    onChange={(e) => handleUpdateButtonConfig(index, 'jumpTo', e.target.value)}
                                    options={[
                                      { value: '', label: 'Continuar sequência normal' },
                                      ...flow.messages.map(msg => ({
                                        value: msg.id,
                                        label: `${msg.content.substring(0, 30)}${msg.content.length > 30 ? '...' : ''}`
                                      }))
                                    ]}
                                    size="sm"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

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
                            setButtonsConfig([]);
                            setEditMode(null);
                            setEditIndex(null);
                            setShowMediaSelector(false);
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleUpdateMessage}
                          icon={<Save size={16} />}
                        >
                          Atualizar Mensagem
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={handleAddMessage}
                        icon={<Plus size={16} />}
                      >
                        Adicionar Mensagem
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Personalização da página de compartilhamento */}
            <Card className="mt-6">
              <div className="p-4">
                <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                  <Eye size={16} className="mr-2 text-teal-600" />
                  Personalização da Página de Visualização
                </h3>
                
                <div className="space-y-4">
                  <TextField
                    label="Título da página"
                    value={sharePageSettings.headerText}
                    onChange={(e) => setSharePageSettings({...sharePageSettings, headerText: e.target.value})}
                    placeholder="Ex: Oferta Especial - Lançamento Exclusivo"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cor do cabeçalho
                      </label>
                      <input
                        type="color"
                        value={sharePageSettings.headerColor}
                        onChange={(e) => setSharePageSettings({...sharePageSettings, headerColor: e.target.value})}
                        className="w-full h-10 cursor-pointer rounded border"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL da Logo (opcional)
                      </label>
                      <input
                        type="text"
                        value={sharePageSettings.logoUrl}
                        onChange={(e) => setSharePageSettings({...sharePageSettings, logoUrl: e.target.value})}
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Imagem do produto (opcional)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={sharePageSettings.productImage}
                        onChange={(e) => setSharePageSettings({...sharePageSettings, productImage: e.target.value})}
                        className="flex-1 border border-gray-300 rounded p-2 text-sm"
                        placeholder="https://example.com/product.jpg"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMediaSelector(true)}
                      >
                        Selecionar
                      </Button>
                    </div>
                  </div>
                  
                  <TextField
                    label="Descrição do produto (opcional)"
                    value={sharePageSettings.productDescription}
                    onChange={(e) => setSharePageSettings({...sharePageSettings, productDescription: e.target.value})}
                    placeholder="Breve descrição do seu produto ou serviço"
                    multiline
                    rows={2}
                  />
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sharePageSettings.watermarkEnabled}
                        onChange={(e) => setSharePageSettings({...sharePageSettings, watermarkEnabled: e.target.checked})}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-700">Mostrar marca d'água do SimulaChat</span>
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Coluna de estatísticas */}
          <div className="col-span-12 lg:col-span-5">
            <Card>
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Clipboard size={18} className="mr-2 text-teal-600" />
                  Estatísticas do Fluxo
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-teal-50 rounded-lg p-4">
                    <div className="text-xs text-teal-600 font-medium mb-1">Total de Mensagens</div>
                    <div className="text-2xl font-bold text-gray-800">{flowStats.totalMessages}</div>
                  </div>
                  
                  <div className="bg-amber-50 rounded-lg p-4">
                    <div className="text-xs text-amber-600 font-medium mb-1">Tempo Total (seg)</div>
                    <div className="text-2xl font-bold text-gray-800">{flowStats.totalDelay}</div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-xs text-blue-600 font-medium mb-1">Mensagens da Empresa</div>
                    <div className="text-2xl font-bold text-gray-800">{flowStats.businessMessages}</div>
                  </div>
                  
                  <div className="bg-pink-50 rounded-lg p-4">
                    <div className="text-xs text-pink-600 font-medium mb-1">Mensagens do Cliente</div>
                    <div className="text-2xl font-bold text-gray-800">{flowStats.customerMessages}</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Código de Incorporação</h3>
                  <div className="bg-gray-100 rounded p-3 text-xs font-mono text-gray-700 overflow-x-auto">
                    {`<script src="${embedLink || 'https://seu-dominio.com/embed.js'}"></script>`}
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => handleCopyLink('embed')}
                    className="mt-2 text-xs"
                    icon={<Copy size={14} />}
                  >
                    Copiar Código
                  </Button>
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  <p className="mb-2">
                    <span className="font-medium text-gray-700">Última atualização:</span>{' '}
                    {flow.updatedAt || new Date().toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">ID do Fluxo:</span>{' '}
                    <span className="font-mono text-xs">{id}</span>
                  </p>
                </div>

                <div className="border-t pt-4 mt-4">
                  <Button
                    variant="danger"
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja excluir este fluxo? Esta ação não pode ser desfeita.')) {
                        // Lógica para excluir fluxo
                        StorageService.deleteFlow(id);
                        navigate('/dashboard');
                      }
                    }}
                    icon={<Trash2 size={16} />}
                    fullWidth
                  >
                    Excluir Fluxo
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </Grid>
      </Container>
    </MainLayout>
  );
};

export default FlowEditor;