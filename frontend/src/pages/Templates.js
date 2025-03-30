import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search,
  FileText,
  MessageSquare,
  CheckCircle,
  Loader
} from 'lucide-react';
import StorageService from '../services/storage';
import SecureStorageService from '../services/secureStorage';
import { MainLayout } from '../design-system';
import axios from 'axios';
import apiConfig from '../config/api';
import { useAuth } from '../contexts/AuthContext';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  
  // Função para carregar templates da API com tratamento de erros aprimorado
  const fetchTemplatesFromAPI = async () => {
    try {
      // Verificar se o token é válido
      if (!SecureStorageService.isTokenValid()) {
        throw new Error('Token inválido ou expirado');
      }

      // Obter headers de autenticação usando o SecureStorageService
      const authHeaders = SecureStorageService.getAuthHeaders();
      if (!authHeaders || !authHeaders.headers) {
        throw new Error('Headers de autenticação não disponíveis');
      }

      // Usar endpoint de templates ou fallback para URL base
      const templateEndpoint = apiConfig.endpoints?.templates || `${apiConfig.baseUrl}/templates`;
      
      const response = await axios.get(templateEndpoint, { headers: authHeaders.headers });
      
      // Verificar diferentes formatos de resposta possíveis
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data?.templates && Array.isArray(response.data.templates)) {
        return response.data.templates;
      } else {
        throw new Error('Formato de resposta inválido da API');
      }
    } catch (error) {
      console.error('Erro ao buscar templates da API:', error);
      
      // Verificar se é um erro de autenticação
      if (error.response && error.response.status === 401) {
        // Limpar token inválido
        SecureStorageService.clearToken();
        logout();
      }
      
      // Lançar erro para ser tratado pelo chamador
      throw error;
    }
  };
  
  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let templatesData = [];
        
        // Tentar carregar da API primeiro se estiver autenticado e o token for válido
        if (isAuthenticated && SecureStorageService.isTokenValid()) {
          try {
            templatesData = await fetchTemplatesFromAPI();
            console.log('Templates carregados da API com sucesso');
          } catch (apiError) {
            console.warn('Falha ao carregar templates da API, usando fallback local:', apiError);
            // Fallback: carregar do armazenamento local
            templatesData = StorageService.getTemplates() || [];
          }
        } else {
          // Se não estiver autenticado ou o token não for válido, usar armazenamento local
          templatesData = StorageService.getTemplates() || [];
        }
        
        // Garantir que templates é um array
        if (!Array.isArray(templatesData)) {
          console.warn('Templates não é um array, usando array vazio como fallback');
          templatesData = [];
        }
        
        setTemplates(templatesData);
        setFilteredTemplates(templatesData);
      } catch (error) {
        console.error('Erro ao carregar templates:', error);
        setError('Não foi possível carregar os templates. Por favor, tente novamente mais tarde.');
        
        // Usar array vazio como fallback
        setTemplates([]);
        setFilteredTemplates([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadTemplates();
  }, [isAuthenticated, logout]);
  
  useEffect(() => {
    // Filtrar templates com base nos critérios selecionados
    if (Array.isArray(templates)) {
      let filtered = [...templates];
      
      // Filtrar por categoria
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(template => 
          template && template.category === selectedCategory
        );
      }
      
      // Filtrar por plataforma
      if (selectedPlatform !== 'all') {
        filtered = filtered.filter(template => 
          template && template.platform === selectedPlatform
        );
      }
      
      // Filtrar por busca
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          template => 
            template && 
            ((template.title && template.title.toLowerCase().includes(query)) || 
             (template.description && template.description.toLowerCase().includes(query)))
        );
      }
      
      setFilteredTemplates(filtered);
    }
  }, [templates, selectedCategory, selectedPlatform, searchQuery]);
  
  const handleUseTemplate = async (templateId) => {
    try {
      let newFlow = null;
      
      // Tentar aplicar o template via API se autenticado e o token for válido
      if (isAuthenticated && SecureStorageService.isTokenValid()) {
        try {
          // Obter headers de autenticação usando o SecureStorageService
          const authHeaders = SecureStorageService.getAuthHeaders();
          
          const response = await axios.post(
            `${apiConfig.baseUrl}/flows/from-template/${templateId}`, 
            {}, 
            { headers: authHeaders.headers }
          );
          
          if (response.data && response.data.flow) {
            newFlow = response.data.flow;
          } else {
            throw new Error('Formato de resposta inválido da API');
          }
        } catch (apiError) {
          console.warn('Falha ao aplicar template via API, usando fallback local:', apiError);
          
          // Verificar se é um erro de autenticação
          if (apiError.response && apiError.response.status === 401) {
            // Limpar token inválido
            SecureStorageService.clearToken();
            logout();
          }
          
          // Fallback: aplicar template localmente
          newFlow = StorageService.applyTemplate(templateId);
        }
      } else {
        // Se não estiver autenticado ou o token não for válido, usar armazenamento local
        newFlow = StorageService.applyTemplate(templateId);
      }
      
      if (newFlow) {
        navigate(`/flow/${newFlow.id}`);
      } else {
        setError('Não foi possível criar um novo fluxo a partir do template.');
      }
    } catch (error) {
      console.error('Erro ao aplicar template:', error);
      setError('Ocorreu um erro ao aplicar o template. Por favor, tente novamente.');
    }
  };
  
  // Obter listas únicas de categorias e plataformas com validação para evitar undefined
  const getUniqueCategories = () => {
    if (!Array.isArray(templates)) return ['all'];
    
    const categoriesSet = new Set(
      templates
        .filter(t => t && t.category) // Remover itens nulos/undefined e sem categoria
        .map(t => t.category)
    );
    
    return ['all', ...categoriesSet];
  };
  
  const getUniquePlatforms = () => {
    if (!Array.isArray(templates)) return ['all'];
    
    const platformsSet = new Set(
      templates
        .filter(t => t && t.platform) // Remover itens nulos/undefined e sem plataforma
        .map(t => t.platform)
    );
    
    return ['all', ...platformsSet];
  };
  
  const categories = getUniqueCategories();
  const platforms = getUniquePlatforms();
  
  // Formatar nome da categoria para exibição com verificação de undefined
  const formatCategoryName = (category) => {
    if (!category || category === 'all') return 'Todas';
    return category.charAt(0).toUpperCase() + category.slice(1);
  };
  
  // Formatar nome da plataforma para exibição com verificação de undefined
  const formatPlatformName = (platform) => {
    if (!platform || platform === 'all') return 'Todas';
    if (platform === 'whatsapp') return 'WhatsApp';
    if (platform === 'instagram') return 'Instagram';
    if (platform === 'messenger') return 'Messenger';
    return platform.charAt(0).toUpperCase() + platform.slice(1);
  };
  
  const getPlatformColorClass = (platform) => {
    switch (platform) {
      case 'whatsapp':
        return 'text-green-600';
      case 'instagram':
        return 'text-purple-600';
      case 'messenger':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };
  
  // Renderização com estados de loading e erro
  if (loading) {
    return (
      <MainLayout title="Templates Prontos">
        <div className="container mx-auto px-4 py-20 flex justify-center">
          <div className="flex flex-col items-center">
            <Loader size={40} className="animate-spin text-primary mb-4" />
            <p className="text-gray-600">Carregando templates...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (error) {
    return (
      <MainLayout title="Templates Prontos">
        <div className="container mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-500 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Erro ao Carregar Templates</h3>
            <p className="text-red-700">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title="Templates Prontos">
      <div className="container mx-auto px-4">
        <div className="max-w-screen-xl mx-auto">
          {/* Cabeçalho da página */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Templates Prontos</h1>
            
            <div className="w-full sm:w-auto flex items-center bg-white rounded-lg border px-3 py-2">
              <Search size={18} className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Buscar template..."
                className="flex-1 border-none focus:ring-0 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Filtros corrigidos */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category || 'all'} value={category || 'all'}>
                    {formatCategoryName(category)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
              >
                {platforms.map(platform => (
                  <option key={platform || 'all'} value={platform || 'all'}>
                    {formatPlatformName(platform)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {!Array.isArray(filteredTemplates) || filteredTemplates.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600">Nenhum template encontrado com os filtros selecionados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template, index) => (
                <div 
                  key={template.id || index} 
                  className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-4 md:p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-gray-100 rounded-full p-2 flex-shrink-0">
                        <FileText size={18} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-semibold">{template.title || 'Template sem título'}</h3>
                        <p className={`text-xs ${getPlatformColorClass(template.platform)}`}>
                          {formatPlatformName(template.platform)}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-xs md:text-sm text-gray-600 mb-4 line-clamp-2">
                      {template.description || 'Sem descrição disponível'}
                    </p>
                    
                    <div className="flex items-center text-xs md:text-sm text-gray-600 mb-4">
                      <MessageSquare size={16} className="mr-2 text-primary" />
                      <span>{template.messageCount || template.messages?.length || 0} mensagens</span>
                    </div>
                    
                    <button 
                      onClick={() => handleUseTemplate(template.id)}
                      className="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded-md text-sm flex items-center justify-center"
                    >
                      <FileText size={16} className="mr-2" />
                      Usar Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Info sobre as categorias */}
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-4 md:p-5">
            <h3 className="text-lg font-semibold mb-4">Categorias de Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-100 rounded-lg p-3">
                <h4 className="font-medium text-primary flex items-center gap-2">
                  <CheckCircle size={16} />
                  Vendas
                </h4>
                <p className="text-sm text-gray-600">Templates otimizados para conversões e vendas de produtos ou serviços.</p>
              </div>
              <div className="border border-gray-100 rounded-lg p-3">
                <h4 className="font-medium text-primary flex items-center gap-2">
                  <CheckCircle size={16} />
                  Atendimento
                </h4>
                <p className="text-sm text-gray-600">Fluxos para atendimento ao cliente, suporte e resolução de problemas.</p>
              </div>
              <div className="border border-gray-100 rounded-lg p-3">
                <h4 className="font-medium text-primary flex items-center gap-2">
                  <CheckCircle size={16} />
                  Marketing
                </h4>
                <p className="text-sm text-gray-600">Templates para campanhas, eventos, sorteios e promoções.</p>
              </div>
              <div className="border border-gray-100 rounded-lg p-3">
                <h4 className="font-medium text-primary flex items-center gap-2">
                  <CheckCircle size={16} />
                  Suporte
                </h4>
                <p className="text-sm text-gray-600">Fluxos para apoiar clientes com dúvidas técnicas e solução de problemas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Templates;