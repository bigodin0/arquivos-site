// src/pages/Plans.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Crown, Zap, Shield, Award, ChevronRight, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import apiConfig from '../config/api';
import SecureStorageService from '../services/secureStorage';

// Importar componentes do design system premium
import { 
  MainLayout,
  PlanCard,
  Container,
  Grid,
  Button
} from '../design-system';

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPlan, setProcessingPlan] = useState(null);
  const { user, getPlanDetails, logout } = useAuth();
  const navigate = useNavigate();
  const currentPlan = getPlanDetails();
  
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Tentar obter planos da API
        try {
          // Verificar se há token válido para a requisição
          const headers = {};
          if (SecureStorageService.isTokenValid()) {
            const authHeaders = SecureStorageService.getAuthHeaders();
            Object.assign(headers, authHeaders.headers);
          }
          
          const response = await axios.get(apiConfig.endpoints.planos, { headers });
          
          if (response.data && Array.isArray(response.data)) {
            // Atualizar os preços dos planos da API
            const updatedPlans = response.data.map(plan => {
              if (plan.id === 1 || plan.name === 'Básico') {
                return { ...plan, price: 47.90 };
              } else if (plan.id === 2 || plan.name === 'Intermediário') {
                return { ...plan, price: 77.90 };
              } else if (plan.id === 3 || plan.name === 'Premium') {
                return { ...plan, price: 247.90 };
              }
              return plan;
            });
            setPlans(updatedPlans);
          } else {
            // Fallback para planos estáticos com preços atualizados
            setPlans(staticPlans);
          }
        } catch (apiError) {
          console.error('Erro ao buscar planos da API:', apiError);
          
          // Verificar se o erro é de autenticação
          if (apiError.response && apiError.response.status === 401) {
            // Limpar token inválido
            SecureStorageService.clearToken();
          }
          
          // Fallback para planos estáticos
          setPlans(staticPlans);
        }
      } catch (err) {
        console.error('Erro ao carregar planos:', err);
        setError('Não foi possível carregar os planos. Por favor, tente novamente.');
        // Fallback para planos estáticos
        setPlans(staticPlans);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlans();
  }, []);
  
  // Planos estáticos (fallback) com preços atualizados
  const staticPlans = [
    {
      id: 1,
      name: 'Básico',
      price: 47.90,
      color: 'teal',
      icon: <Star size={24} className="text-teal-600" />,
      features: [
        'Até 5 fluxos', 
        '20 mensagens por fluxo', 
        'Suporte por email'
      ]
    },
    {
      id: 2,
      name: 'Intermediário',
      price: 77.90,
      color: 'purple',
      icon: <Zap size={24} className="text-purple-600" />,
      features: [
        'Até 20 fluxos', 
        '50 mensagens por fluxo', 
        'Mídia nos fluxos', 
        'Suporte prioritário'
      ],
      recommended: true
    },
    {
      id: 3,
      name: 'Premium',
      price: 247.90,
      color: 'blue',
      icon: <Crown size={24} className="text-blue-600" />,
      features: [
        'Fluxos ilimitados', 
        'Mensagens ilimitadas por fluxo', 
        'Mídia nos fluxos', 
        'Recursos avançados', 
        'Suporte VIP'
      ]
    }
  ];
  
  const handleSubscribe = async (planId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setProcessingPlan(planId);
    
    try {
      // Verificar se o token é válido antes de prosseguir
      if (!SecureStorageService.isTokenValid()) {
        alert('Sessão expirada. Por favor, faça login novamente.');
        logout();
        navigate('/login');
        return;
      }
      
      // Preparar dados para checkout
      const payload = {
        planId,
        userId: user.id,
        email: user.email,
        isNewUser: false
      };
      
      // Adicionar informações adicionais para melhor identificação
      const userAgent = navigator.userAgent;
      const deviceInfo = {
        screen: `${window.screen.width}x${window.screen.height}`,
        viewPort: `${window.innerWidth}x${window.innerHeight}`,
        userAgent
      };
      
      payload.deviceInfo = deviceInfo;
      
      // Obter headers de autenticação usando SecureStorageService
      const headers = SecureStorageService.getAuthHeaders().headers;
      
      // Melhorar gestão de erros
      try {
        const response = await axios.post(
          apiConfig.endpoints.checkout,
          payload,
          { headers }
        );
        
        if (response.data && response.data.success && response.data.redirectUrl) {
          // Armazenar informação do plano sendo adquirido no localStorage
          // para usar após o retorno do pagamento
          localStorage.setItem('pending_plan', JSON.stringify({
            planId,
            timestamp: Date.now()
          }));
          
          // Redirecionar para página de pagamento
          window.location.href = response.data.redirectUrl;
        } else {
          throw new Error('Resposta inválida do servidor de pagamento');
        }
      } catch (requestError) {
        // Fornecer mensagens de erro mais específicas
        if (requestError.response) {
          const statusCode = requestError.response.status;
          const errorData = requestError.response.data;
          
          if (statusCode === 401) {
            alert('Sessão expirada. Por favor, faça login novamente.');
            // Limpar token inválido
            SecureStorageService.clearToken();
            logout();
            navigate('/login');
          } else if (statusCode === 400 && errorData.error) {
            alert(`Erro no processamento: ${errorData.error}`);
          } else {
            alert('Não foi possível processar o pagamento. Por favor, tente novamente.');
          }
        } else if (requestError.request) {
          alert('Servidor indisponível. Verifique sua conexão com a internet.');
        } else {
          alert('Erro ao processar pedido: ' + requestError.message);
        }
      }
    } catch (error) {
      console.error('Erro ao iniciar assinatura:', error);
      alert('Ocorreu um erro ao processar seu pedido. Por favor, tente novamente mais tarde.');
    } finally {
      setProcessingPlan(null);
    }
  };
  
  // Função para determinar se um plano é o atual
  const isCurrentPlan = (planName) => {
    return currentPlan.name === planName;
  };
  
  // Função para obter ícone do plano
  const getPlanIcon = (plan, index) => {
    if (plan.icon) return plan.icon;
    
    const icons = [
      <Star size={24} className="text-teal-600" />,
      <Zap size={24} className="text-purple-600" />,
      <Crown size={24} className="text-blue-600" />
    ];
    
    return icons[index % icons.length];
  };
  
  if (loading) {
    return (
      <MainLayout title="Planos e Preços">
        <Container>
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Loader size={36} className="text-primary mx-auto animate-spin mb-4" />
              <p className="text-gray-600">Carregando planos...</p>
            </div>
          </div>
        </Container>
      </MainLayout>
    );
  }
  
  if (error) {
    return (
      <MainLayout title="Planos e Preços">
        <Container>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center mx-auto max-w-lg my-10">
            <div className="text-red-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Erro ao carregar planos</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded transition duration-150"
            >
              Tentar novamente
            </button>
          </div>
        </Container>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title="Planos e Preços">
      <Container>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-dark mb-2">Planos e Preços</h1>
          <p className="text-text-medium">Escolha o plano ideal para as suas necessidades</p>
        </div>
        
        {/* Plano atual do usuário */}
        <PlanCard 
          className="mb-8"
          hover={false}
          title="Seu Plano Atual"
          icon={<Shield size={20} className="text-teal-600" />}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <p className="mb-2 text-text-medium">
                Você está usando o plano <span className="font-semibold text-text-dark">{currentPlan.name}</span>
              </p>
              <p className="text-text-medium">
                Com este plano, você tem direito a {currentPlan.flowsLimit === -1 ? 'fluxos ilimitados' : `${currentPlan.flowsLimit} fluxos`} e 
                {currentPlan.messagesPerFlowLimit === -1 ? ' mensagens ilimitadas' : ` ${currentPlan.messagesPerFlowLimit} mensagens`} por fluxo.
              </p>
            </div>
            <Button 
              variant="outline"
              className="mt-4 md:mt-0 w-full md:w-auto"
              onClick={() => navigate('/analytics')}
            >
              Ver meu uso
            </Button>
          </div>
        </PlanCard>
        
        {/* Opções de planos */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-text-dark mb-6 flex items-center">
            <Award size={20} className="text-teal-600 mr-2" />
            Opções de Upgrade
          </h2>
          
          <Grid cols={1} md={3} gap={6}>
            {plans.map((plan, index) => {
              const isPlanCurrent = isCurrentPlan(plan.name);
              const planColorClass = plan.recommended ? 'bg-teal-50 border-teal-200' : 'bg-white border-gray-200';
              
              return (
                <PlanCard
                  key={plan.id}
                  className={`relative ${planColorClass} transition-all duration-200 hover:border-teal-300 hover:shadow-md`}
                  bordered={true}
                >
                  {plan.recommended && (
                    <div className="absolute -top-3 right-4 bg-teal-600 text-white text-xs px-3 py-1 rounded-full">
                      Recomendado
                    </div>
                  )}
                  
                  <div className="flex items-center mb-4">
                    <div className="mr-3">
                      {getPlanIcon(plan, index)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text-dark">{plan.name}</h3>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-3xl font-bold text-teal-600">
                      R$ {plan.price.toFixed(2)}
                      <span className="text-sm font-normal text-text-medium ml-1">/mês</span>
                    </p>
                  </div>
                  
                  <ul className="mb-6 space-y-3">
                    {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-text-medium">
                        <Check size={16} className="text-teal-600 mr-2 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    variant={isPlanCurrent ? "outline" : "primary"}
                    className="w-full"
                    onClick={() => !isPlanCurrent && handleSubscribe(plan.id)}
                    disabled={isPlanCurrent || processingPlan === plan.id}
                  >
                    {processingPlan === plan.id ? (
                      <div className="flex items-center justify-center">
                        <Loader size={16} className="animate-spin mr-2" />
                        <span>Processando...</span>
                      </div>
                    ) : isPlanCurrent ? "Plano Atual" : "Assinar"}
                  </Button>
                </PlanCard>
              );
            })}
          </Grid>
        </div>
        
        {/* FAQs ou informações adicionais */}
        <PlanCard 
          title="Informações Adicionais" 
          icon={<ChevronRight size={20} className="text-teal-600" />}
          className="bg-gray-50"
        >
          <ul className="space-y-3">
            <li className="flex items-start">
              <Check size={16} className="text-teal-600 mr-2 mt-0.5" />
              <span className="text-text-medium">Cancele a qualquer momento sem taxas adicionais</span>
            </li>
            <li className="flex items-start">
              <Check size={16} className="text-teal-600 mr-2 mt-0.5" />
              <span className="text-text-medium">Suporte técnico disponível em todos os planos</span>
            </li>
            <li className="flex items-start">
              <Check size={16} className="text-teal-600 mr-2 mt-0.5" />
              <span className="text-text-medium">Pagamento seguro com criptografia</span>
            </li>
            <li className="flex items-start">
              <Check size={16} className="text-teal-600 mr-2 mt-0.5" />
              <span className="text-text-medium">Entre em contato para planos empresariais personalizados</span>
            </li>
          </ul>
        </PlanCard>
      </Container>
    </MainLayout>
  );
};

export default Plans;