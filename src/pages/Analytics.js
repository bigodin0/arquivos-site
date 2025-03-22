// src/pages/Analytics.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart2, 
  Activity, 
  Link2, 
  Eye, 
  TrendingUp, 
  MessageSquare,
  Clock, 
  CheckCircle,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import StorageService from '../services/storage';
import { MainLayout, Container, AnalyticsCard, Select, Grid } from '../design-system';
import axios from 'axios';
import apiConfig from '../config/api';
import { useAuth } from '../contexts/AuthContext';

const Analytics = () => {
  const [flows, setFlows] = useState([]);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [stats, setStats] = useState(null);
  const [activitySummary, setActivitySummary] = useState(null);
  const [timeRange, setTimeRange] = useState('week'); // 'day', 'week', 'month'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getToken } = useAuth();
  
  useEffect(() => {
    // Função para buscar os fluxos da API
    const fetchFlowsFromAPI = async () => {
      try {
        setLoading(true);
        
        // Obter o token de autorização
        const token = getToken();
        
        if (!token) {
          // Fallback para dados locais se não houver token
          const savedFlows = StorageService.getFlows() || [];
          setFlows(savedFlows);
          
          if (savedFlows.length > 0) {
            setSelectedFlow(savedFlows[0]);
          }
          
          // Carregar estatísticas locais
          const stats = StorageService.getStats() || { flows: {}, messages: {}, templates: {} };
          const activitySummary = {
            totalFlows: savedFlows.length,
            totalMessages: savedFlows.reduce((count, flow) => count + (flow.messages ? flow.messages.length : 0), 0),
            flowsCreated: stats.flows.created || 0,
            flowsEdited: stats.flows.edited || 0,
            flowsShared: stats.flows.shared || 0,
            flowsViewed: stats.flows.views || 0,
            messagesCreated: stats.messages.sent || 0,
            templatesUsed: Object.values(stats.templates.used || {}).reduce((sum, count) => sum + count, 0),
            lastUpdated: stats.lastUpdated
          };
          setActivitySummary(activitySummary);
          return;
        }
        
        // Fazer a chamada à API para buscar os fluxos
        const response = await axios.get(apiConfig.endpoints.flows, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Se a chamada for bem-sucedida e retornar dados
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          const apiFlows = response.data.data;
          setFlows(apiFlows);
          
          if (apiFlows.length > 0) {
            setSelectedFlow(apiFlows[0]);
          }
          
          // Calcular estatísticas básicas a partir dos fluxos
          const activitySummary = {
            totalFlows: apiFlows.length,
            totalMessages: apiFlows.reduce((count, flow) => count + (flow.messages ? flow.messages.length : 0), 0),
            flowsShared: apiFlows.reduce((count, flow) => count + (flow.shared ? 1 : 0), 0),
            // Valores padrão para outras estatísticas
            flowsCreated: apiFlows.length,
            flowsEdited: Math.floor(apiFlows.length * 1.5),
            flowsViewed: Math.floor(apiFlows.length * 5),
            messagesCreated: apiFlows.reduce((count, flow) => count + (flow.messages ? flow.messages.length : 0), 0),
            templatesUsed: Math.floor(apiFlows.length * 0.3),
            platformDistribution: {
              whatsapp: apiFlows.filter(f => f.platform === 'whatsapp').length,
              telegram: apiFlows.filter(f => f.platform === 'telegram').length,
              instagram: apiFlows.filter(f => f.platform === 'instagram').length
            }
          };
          setActivitySummary(activitySummary);
        } else {
          // Fallback para dados locais se a API não retornar dados válidos
          console.warn('API não retornou dados de fluxos válidos. Usando dados locais.');
          const savedFlows = StorageService.getFlows() || [];
          setFlows(savedFlows);
          
          if (savedFlows.length > 0) {
            setSelectedFlow(savedFlows[0]);
          }
          
          // Carregar estatísticas locais como fallback
          const stats = StorageService.getStats() || { flows: {}, messages: {}, templates: {} };
          const activitySummary = {
            totalFlows: savedFlows.length,
            totalMessages: savedFlows.reduce((count, flow) => count + (flow.messages ? flow.messages.length : 0), 0),
            flowsCreated: stats.flows.created || 0,
            flowsEdited: stats.flows.edited || 0,
            flowsShared: stats.flows.shared || 0,
            flowsViewed: stats.flows.views || 0,
            messagesCreated: stats.messages.sent || 0,
            templatesUsed: Object.values(stats.templates.used || {}).reduce((sum, count) => sum + count, 0),
            lastUpdated: stats.lastUpdated
          };
          setActivitySummary(activitySummary);
        }
      } catch (err) {
        console.error('Erro ao buscar fluxos:', err);
        setError('Não foi possível carregar seus fluxos. Por favor, tente novamente.');
        
        // Usar fluxos locais como fallback em caso de erro
        const savedFlows = StorageService.getFlows() || [];
        setFlows(savedFlows);
        
        if (savedFlows.length > 0) {
          setSelectedFlow(savedFlows[0]);
        }
        
        // Carregar estatísticas locais
        const stats = StorageService.getStats() || { flows: {}, messages: {}, templates: {} };
        const activitySummary = {
          totalFlows: savedFlows.length,
          totalMessages: savedFlows.reduce((count, flow) => count + (flow.messages ? flow.messages.length : 0), 0),
          flowsCreated: stats.flows.created || 0,
          flowsEdited: stats.flows.edited || 0,
          flowsShared: stats.flows.shared || 0,
          flowsViewed: stats.flows.views || 0,
          messagesCreated: stats.messages.sent || 0,
          templatesUsed: Object.values(stats.templates.used || {}).reduce((sum, count) => sum + count, 0),
          lastUpdated: stats.lastUpdated
        };
        setActivitySummary(activitySummary);
      } finally {
        setLoading(false);
      }
    };

    fetchFlowsFromAPI();
  }, [getToken]);
  
  // Estatísticas simuladas para o fluxo selecionado
  useEffect(() => {
    if (selectedFlow) {
      // Em uma versão real, buscaria esses dados do servidor
      setStats({
        views: Math.floor(Math.random() * 1000) + 100,
        starts: Math.floor(Math.random() * 500) + 50,
        completions: Math.floor(Math.random() * 200) + 20,
        clicks: Math.floor(Math.random() * 100) + 10,
        conversionRate: Math.floor(Math.random() * 30) + 5,
        // Dados simulados com tendências
        viewsTrend: Math.random() > 0.5 ? Math.floor(Math.random() * 20) + 1 : -Math.floor(Math.random() * 20) - 1,
        startsTrend: Math.random() > 0.5 ? Math.floor(Math.random() * 15) + 1 : -Math.floor(Math.random() * 15) - 1,
        completionsTrend: Math.random() > 0.5 ? Math.floor(Math.random() * 10) + 1 : -Math.floor(Math.random() * 10) - 1,
        conversionTrend: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : -Math.floor(Math.random() * 5) - 1,
        popularButtons: [
          { name: 'Sim, quero comprar', clicks: 45 },
          { name: 'Ver mais detalhes', clicks: 32 },
          { name: 'Não, obrigado', clicks: 18 }
        ],
        hourlyDistribution: [
          { hour: '8h', views: 12 },
          { hour: '9h', views: 19 },
          { hour: '10h', views: 28 },
          { hour: '11h', views: 32 },
          { hour: '12h', views: 21 },
          { hour: '13h', views: 18 },
          { hour: '14h', views: 23 },
          { hour: '15h', views: 34 },
          { hour: '16h', views: 42 },
          { hour: '17h', views: 39 },
          { hour: '18h', views: 26 },
          { hour: '19h', views: 17 }
        ],
        userInteractions: [
          { type: 'Completou', percentage: 35 },
          { type: 'Abandonou', percentage: 45 },
          { type: 'Clicou link', percentage: 20 }
        ],
        deviceDistribution: [
          { device: 'Mobile', percentage: 65 },
          { device: 'Desktop', percentage: 30 },
          { device: 'Tablet', percentage: 5 }
        ]
      });
    }
  }, [selectedFlow, timeRange]);
  
  const renderTrendIndicator = (value) => {
    if (value > 0) {
      return (
        <div className="flex items-center text-green-600">
          <ArrowUpRight size={16} className="mr-1" />
          <span>+{value}%</span>
        </div>
      );
    } else if (value < 0) {
      return (
        <div className="flex items-center text-red-500">
          <ArrowDownRight size={16} className="mr-1" />
          <span>{value}%</span>
        </div>
      );
    }
    return null;
  };
  
  // Renderiza as barras do gráfico de distribuição por horário
  const renderHourlyChart = () => {
    if (!stats || !stats.hourlyDistribution) return null;
    
    const maxViews = Math.max(...stats.hourlyDistribution.map(h => h.views));
    
    return (
      <div className="flex items-end justify-between h-56 pt-4">
        {stats.hourlyDistribution.map((item, index) => {
          const heightPercentage = (item.views / maxViews) * 100;
          
          return (
            <div key={index} className="flex flex-col items-center group">
              <div className="relative">
                <div 
                  className="w-8 bg-teal-500 hover:bg-teal-600 rounded-t transition-all duration-200 cursor-pointer"
                  style={{ height: `${heightPercentage}%` }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.views} visualizações
                  </div>
                </div>
              </div>
              <span className="text-xs mt-2 text-gray-600">{item.hour}</span>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Renderiza o gráfico de distribuição por tipo de interação
  const renderInteractionPieChart = () => {
    if (!stats || !stats.userInteractions) return null;
    
    const colors = ['bg-teal-500', 'bg-rose-500', 'bg-amber-500'];
    
    return (
      <div className="mt-4 space-y-3">
        {stats.userInteractions.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">{item.type}</span>
              <span className="font-medium">{item.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`${colors[index % colors.length]} h-2 rounded-full`} 
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <MainLayout title="Analytics">
        <Container>
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando dados de análise...</p>
            </div>
          </div>
        </Container>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Analytics">
        <Container>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center mx-auto max-w-2xl my-10">
            <div className="text-red-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Erro ao carregar dados</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded transition duration-150"
            >
              Tentar novamente
            </button>
          </div>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Analytics">
      <Container>
        {/* Filtros e seletores */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Análise de Desempenho</h1>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Período:</span>
            <div className="inline-flex bg-gray-100 rounded-lg p-1">
              <button 
                className={`px-3 py-1 text-sm rounded-md ${timeRange === 'day' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-600'}`}
                onClick={() => setTimeRange('day')}
              >
                Dia
              </button>
              <button 
                className={`px-3 py-1 text-sm rounded-md ${timeRange === 'week' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-600'}`}
                onClick={() => setTimeRange('week')}
              >
                Semana
              </button>
              <button 
                className={`px-3 py-1 text-sm rounded-md ${timeRange === 'month' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-600'}`}
                onClick={() => setTimeRange('month')}
              >
                Mês
              </button>
            </div>
          </div>
        </div>
        
        {/* Cards de resumo de atividade */}
        <Grid cols={1} md={2} lg={4} gap={6} className="mb-8">
          <AnalyticsCard>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center mr-3">
                    <BarChart2 size={20} className="text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 font-medium text-sm">Total de Fluxos</h3>
                    <p className="text-2xl font-bold text-gray-800">{activitySummary?.totalFlows || 0}</p>
                  </div>
                </div>
                <div className="flex items-center text-teal-600">
                  <Activity size={18} />
                </div>
              </div>
              <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 rounded-full" 
                  style={{ width: `${Math.min(100, ((activitySummary?.totalFlows || 0) / 10) * 100)}%` }}
                ></div>
              </div>
            </div>
          </AnalyticsCard>
          
          <AnalyticsCard>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <MessageSquare size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 font-medium text-sm">Total de Mensagens</h3>
                    <p className="text-2xl font-bold text-gray-800">{activitySummary?.totalMessages || 0}</p>
                  </div>
                </div>
                <div className="flex items-center text-blue-600">
                  <Activity size={18} />
                </div>
              </div>
              <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${Math.min(100, ((activitySummary?.totalMessages || 0) / 100) * 100)}%` }}
                ></div>
              </div>
            </div>
          </AnalyticsCard>
          
          <AnalyticsCard>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <Link2 size={20} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 font-medium text-sm">Fluxos Compartilhados</h3>
                    <p className="text-2xl font-bold text-gray-800">{activitySummary?.flowsShared || 0}</p>
                  </div>
                </div>
                <div className="flex items-center text-green-600">
                  <Activity size={18} />
                </div>
              </div>
              <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ width: `${Math.min(100, ((activitySummary?.flowsShared || 0) / 5) * 100)}%` }}
                ></div>
              </div>
            </div>
          </AnalyticsCard>
          
          <AnalyticsCard>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                    <Eye size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 font-medium text-sm">Plataforma Principal</h3>
                    <p className="text-xl font-bold text-gray-800 capitalize">
                      {activitySummary?.platformDistribution ? 
                        Object.entries(activitySummary.platformDistribution)
                          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-purple-600">
                  <Activity size={18} />
                </div>
              </div>
              <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full" 
                  style={{ width: '75%' }}
                ></div>
              </div>
            </div>
          </AnalyticsCard>
        </Grid>
        
        {/* Seletor de fluxo e estatísticas detalhadas */}
        <AnalyticsCard className="mb-8">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3 sm:mb-0">Estatísticas por Fluxo</h2>
              
              <Select
                className="w-full sm:w-64"
                value={selectedFlow?.id || ''}
                onChange={(e) => {
                  const flowId = Number(e.target.value) || e.target.value; // Aceitar tanto número quanto string
                  const flow = Array.isArray(flows) ? flows.find(f => String(f.id) === String(flowId)) : null;
                  setSelectedFlow(flow);
                }}
                options={[
                  { value: '', label: 'Selecione um fluxo', disabled: true },
                  ...(Array.isArray(flows) ? flows.map(flow => ({ 
                    value: flow.id, 
                    label: flow.title || 'Fluxo sem título' 
                  })) : [])
                ]}
              />
            </div>
            
            {selectedFlow && stats ? (
              <>
                {/* Métricas principais */}
                <Grid cols={1} md={2} lg={4} gap={4} className="mb-8">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-600 text-sm">Visualizações</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.views}</p>
                      </div>
                      <div className="bg-teal-100 p-2 rounded-full">
                        <Eye size={18} className="text-teal-600" />
                      </div>
                    </div>
                    {renderTrendIndicator(stats.viewsTrend)}
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-600 text-sm">Conversas iniciadas</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.starts}</p>
                      </div>
                      <div className="bg-blue-100 p-2 rounded-full">
                        <MessageSquare size={18} className="text-blue-600" />
                      </div>
                    </div>
                    {renderTrendIndicator(stats.startsTrend)}
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-600 text-sm">Conversas finalizadas</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.completions}</p>
                      </div>
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle size={18} className="text-green-600" />
                      </div>
                    </div>
                    {renderTrendIndicator(stats.completionsTrend)}
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-600 text-sm">Taxa de conversão</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.conversionRate}%</p>
                      </div>
                      <div className="bg-purple-100 p-2 rounded-full">
                        <TrendingUp size={18} className="text-purple-600" />
                      </div>
                    </div>
                    {renderTrendIndicator(stats.conversionTrend)}
                  </div>
                </Grid>
                
                {/* Gráficos e detalhamentos */}
                <Grid cols={1} md={2} gap={6}>
                  {/* Gráfico de distribuição por horário */}
                  <AnalyticsCard>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-800 flex items-center">
                          <Clock size={16} className="mr-2 text-teal-600" />
                          Distribuição por horário
                        </h3>
                        <div className="text-xs text-gray-500">
                          {timeRange === 'day' ? 'Hoje' : 
                           timeRange === 'week' ? 'Últimos 7 dias' : 
                           'Últimos 30 dias'}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">Visualizações por hora do dia</p>
                      
                      {renderHourlyChart()}
                    </div>
                  </AnalyticsCard>
                  
                  <div className="grid grid-cols-1 gap-6">
                    {/* Botões mais clicados */}
                    <AnalyticsCard>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-800 flex items-center mb-3">
                          <CheckCircle size={16} className="mr-2 text-teal-600" />
                          Botões mais clicados
                        </h3>
                        
                        <div className="space-y-3">
                          {Array.isArray(stats.popularButtons) && stats.popularButtons.map((button, index) => (
                            <div key={index} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                              <div className="flex items-center">
                                <span className="bg-teal-100 text-teal-800 text-xs px-1.5 py-0.5 rounded-full mr-2">
                                  {index + 1}
                                </span>
                                <span className="text-gray-700">{button.name}</span>
                              </div>
                              <span className="font-semibold text-teal-600">{button.clicks} cliques</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </AnalyticsCard>
                    
                    {/* Distribuição de interações */}
                    <AnalyticsCard>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-800 flex items-center mb-3">
                          <PieChart size={16} className="mr-2 text-teal-600" />
                          Interações dos usuários
                        </h3>
                        
                        {renderInteractionPieChart()}
                      </div>
                    </AnalyticsCard>
                  </div>
                </Grid>
                
                {/* Resumo e insights */}
                <div className="mt-8 bg-teal-50 rounded-lg p-4 border border-teal-100">
                  <h3 className="font-medium text-teal-800 mb-2">Insights automáticos</h3>
                  <ul className="space-y-2 text-sm text-teal-700">
                  <li className="flex items-start">
                      <div className="bg-teal-200 p-1 rounded-full mr-2 mt-0.5">
                        <TrendingUp size={12} className="text-teal-700" />
                      </div>
                      <span>O horário com maior engajamento é às 16h. Considere programar suas campanhas para este período.</span>
                    </li>
                    <li className="flex items-start"><div className="bg-teal-200 p-1 rounded-full mr-2 mt-0.5">
                        <TrendingUp size={12} className="text-teal-700" />
                      </div>
                      <span>O botão "Sim, quero comprar" tem a maior taxa de cliques. Considere destacá-lo na interface.</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-teal-200 p-1 rounded-full mr-2 mt-0.5">
                        <TrendingUp size={12} className="text-teal-700" />
                      </div>
                      <span>{stats.conversionRate}% é uma boa taxa de conversão para este tipo de simulação, acima da média de mercado.</span>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {!Array.isArray(flows) || flows.length === 0 ? (
                  <>
                    <p className="mb-3">Você ainda não possui fluxos para analisar.</p>
                    <Link 
                      to="/templates" 
                      className="text-teal-600 hover:text-teal-700 font-medium"
                    >
                      Crie seu primeiro fluxo
                    </Link>
                  </>
                ) : (
                  <p>Selecione um fluxo para visualizar suas estatísticas.</p>
                )}
              </div>
            )}
          </div>
        </AnalyticsCard>
      </Container>
    </MainLayout>
  );
};

export default Analytics;