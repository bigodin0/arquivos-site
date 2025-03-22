// src/pages/PublicPlans.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async'; // Adicionar essa biblioteca
import { Check, Star, Crown, Zap, Shield, Award, ChevronRight } from 'lucide-react';
import apiConfig from '../config/api';

// Importar componentes do design system premium
import { 
  MainLayout,
  Card,
  Container,
  Grid,
  Button
} from '../design-system';

const PublicPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  
  useEffect(() => {
    // Carregar planos do backend
    const fetchPlans = async () => {
      try {
        // Usar endpoint do arquivo de configuração
        const response = await axios.get(apiConfig.endpoints.planos);
        setPlans(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar planos:', error);
        setLoading(false);
      }
    };
    
    fetchPlans();
  }, []);
  
  const handleSubscribe = async (planId) => {
    setProcessingPlan(planId);
    
    try {
      // Para um usuário novo, usamos um ID temporário
      const userId = 'new_user_' + Date.now();
      // Email temporário - na versão real, você pediria o email antes
      const userEmail = 'novo@exemplo.com'; 
      
      const payload = {
        planId,
        userId,
        email: userEmail,
        isNewUser: true // Flag para indicar que é um novo usuário
      };
      
      console.log('Enviando solicitação de checkout:', payload);
      
      // Usar endpoint do arquivo de configuração
      const response = await axios.post(apiConfig.endpoints.checkout, payload);
      
      console.log('Resposta recebida:', response.data);
      
      if (response.data.success && response.data.redirectUrl) {
        // Redireciona para a página de checkout do Mercado Pago
        window.location.href = response.data.redirectUrl;
      } else {
        alert('Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao processar checkout:', error);
      
      // Detalhes do erro para depuração
      if (error.response) {
        console.error('Resposta de erro do servidor:', error.response.status, error.response.data);
      }
      
      alert('Não foi possível processar sua solicitação. Por favor, tente novamente.');
    } finally {
      setProcessingPlan(null);
    }
  };
  
  // Mapeamento dos ícones para cada plano
  const getPlanIcon = (index) => {
    const icons = [
      <Star size={24} className="text-teal-600" />,
      <Zap size={24} className="text-purple-600" />,
      <Crown size={24} className="text-blue-600" />
    ];
    return icons[index % icons.length];
  };
  
  // Preparar dados estruturados para SEO (Schema.org)
  const getStructuredData = () => {
    if (!plans || plans.length === 0) return null;
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": plans.map((plan, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "name": `SimulaChat ${plan.name}`,
          "description": plan.features.join(". "),
          "offers": {
            "@type": "Offer",
            "price": plan.price.toFixed(2),
            "priceCurrency": "BRL",
            "availability": "https://schema.org/InStock"
          }
        }
      }))
    };
    
    return JSON.stringify(structuredData);
  };
  
  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <Helmet>
          <title>Carregando planos - SimulaChat</title>
          <meta name="description" content="Carregando os planos do SimulaChat..." />
        </Helmet>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-3 text-text-medium">Carregando planos...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white min-h-screen">
      {/* SEO Metadata com Helmet */}
      <Helmet>
        <title>Planos e Preços | SimulaChat - Simulador de Atendimento</title>
        <meta name="description" content="Conheça os planos do SimulaChat. Encontre a solução ideal para simular atendimentos ao cliente, treinar equipes e melhorar seu suporte." />
        <meta name="keywords" content="simulação de chat, atendimento ao cliente, treinamento de equipe, chatbot, planos, preços" />
        <meta property="og:title" content="Planos e Preços | SimulaChat" />
        <meta property="og:description" content="Escolha o plano ideal do SimulaChat para suas necessidades de treinamento e simulação de atendimento." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://simulachat.com/planos" />
        <meta property="og:image" content="https://simulachat.com/images/og-planos.jpg" />
        <link rel="canonical" href="https://simulachat.com/planos" />
        {/* Dados estruturados para Rich Snippets */}
        <script type="application/ld+json">
          {getStructuredData()}
        </script>
      </Helmet>
      
      {/* Header */}
      <header className="bg-primary text-white p-4">
        <Container>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">SimulaChat</h1>
            <div>
              <Link to="/login">
                <Button variant="ghost" className="text-white hover:text-gray-200">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </header>
      
      {/* Conteúdo principal */}
      <Container className="py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Nossos Planos</h1>
          <p className="text-xl text-text-medium">Escolha o plano ideal para suas necessidades</p>
        </div>
        
        <Grid cols={1} md={3} gap={8} className="max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={plan.id} 
              className="transform transition-transform hover:scale-105"
              bordered={true}
            >
              <div className="p-6 border-b">
                <div className="flex items-center mb-4">
                  <div className="mr-3">
                    {getPlanIcon(index)}
                  </div>
                  <h2 className="text-2xl font-bold text-text-dark">{plan.name}</h2>
                </div>
                <p className="text-4xl font-bold text-teal-600">
                  R$ {plan.price.toFixed(2)}
                  <span className="text-base font-normal text-text-medium ml-1">/mês</span>
                </p>
              </div>
              
              <div className="p-6">
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check size={16} className="text-teal-600 mr-2 mt-0.5" />
                      <span className="text-text-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={processingPlan === plan.id}
                >
                  {processingPlan === plan.id ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      Processando...
                    </span>
                  ) : (
                    'Assinar agora'
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </Grid>
        
        <div className="text-center mt-16">
          <p className="text-text-medium mb-4">Já é assinante?</p>
          <Link to="/login">
            <Button variant="link" className="text-primary hover:text-primary-dark font-semibold">
              Faça login para acessar sua conta
            </Button>
          </Link>
        </div>
      </Container>
      
      {/* Card de informações adicionais */}
      <Container className="pb-16">
        <Card 
          title="Informações Adicionais" 
          icon={<ChevronRight size={20} className="text-teal-600" />}
          className="bg-gray-50 max-w-4xl mx-auto"
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
        </Card>
      </Container>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <Container>
          <Grid cols={1} md={3} gap={8}>
            <div>
              <h3 className="text-xl font-bold mb-4">SimulaChat</h3>
              <p className="text-gray-400">A melhor plataforma para simular conversas e treinar atendimento ao cliente.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Links Úteis</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white">Início</Link></li>
                <li><Link to="/login" className="text-gray-400 hover:text-white">Login</Link></li>
                <li><Link to="/planos" className="text-gray-400 hover:text-white">Planos</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contato</h3>
              <p className="text-gray-400">contato@simulachat.com</p>
            </div>
          </Grid>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} SimulaChat. Todos os direitos reservados.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default PublicPlans;