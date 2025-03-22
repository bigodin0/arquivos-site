// src/pages/LandingPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Check, 
  HelpCircle, 
  Star, 
  Users, 
  BarChart, 
  MessageSquare, 
  X,
  Play,
  ChevronRight
} from 'lucide-react';
import { Button } from '../design-system';

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('atendimento');
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const navigate = useNavigate();
  
  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email) {
      // Armazenar email para usar no registro
      localStorage.setItem('signup_email', email);
      navigate('/signup'); // Alterado de '/register' para '/signup'
    }
  };

  const toggleDemo = () => {
    setIsPlaying(!isPlaying);
  };

  // Dados de casos de uso para abas
  const useCases = {
    atendimento: {
      title: "Atendimento ao Cliente",
      description: "Simule conversas de atendimento para treinar sua equipe e padronizar respostas.",
      benefits: [
        "Redução de 40% no tempo de treinamento",
        "Aumento de satisfação do cliente",
        "Padronização de respostas",
        "Melhoria no tempo de resposta"
      ],
      image: "/images/customer-service-demo.png"
    },
    vendas: {
      title: "Suporte a Vendas",
      description: "Crie simulações de negociações e objeções para preparar sua equipe comercial.",
      benefits: [
        "Aumento de 25% na taxa de conversão",
        "Treinamento de objeções comuns",
        "Redução do ciclo de vendas",
        "Melhor qualificação de leads"
      ],
      image: "/images/sales-demo.png"
    },
    onboarding: {
      title: "Onboarding de Clientes",
      description: "Facilite a integração de novos clientes com fluxos de conversas simulados.",
      benefits: [
        "Redução de 60% no tempo de onboarding",
        "Diminuição de tickets de suporte",
        "Maior engajamento inicial",
        "Experiência personalizada"
      ],
      image: "/images/onboarding-demo.png"
    },
    treinamento: {
      title: "Treinamento de Equipe",
      description: "Crie cenários de treinamento realistas para diversas situações de atendimento.",
      benefits: [
        "Treinamento em escala sem impacto operacional",
        "Medição de performance individual",
        "Identificação de gaps de conhecimento",
        "Simulações de casos complexos"
      ],
      image: "/images/training-demo.png"
    }
  };

  // Dados de depoimentos
  const testimonials = [
    {
      name: "Ana Silva",
      company: "TechSupport Inc.",
      role: "Gerente de CS",
      image: "/images/testimonial-1.jpg",
      stars: 5,
      text: "O SimulaChat transformou nosso treinamento de atendimento. Conseguimos preparar nossa equipe para diversas situações de forma prática e eficiente."
    },
    {
      name: "Ricardo Mendes",
      company: "VendaMais",
      role: "Diretor Comercial",
      image: "/images/testimonial-2.jpg",
      stars: 4,
      text: "Implementamos o SimulaChat para treinar nossa equipe de vendas e vimos um aumento de 32% na taxa de conversão em apenas 3 meses."
    },
    {
      name: "Carla Ferreira",
      company: "EduTech",
      role: "Especialista em CX",
      image: "/images/testimonial-3.jpg",
      stars: 5,
      text: "A facilidade de criar fluxos personalizados nos permitiu simular dezenas de cenários diferentes. O melhor investimento que fizemos em treinamento."
    }
  ];

  // Dados para tabela de comparação
  const comparisonFeatures = [
    { name: "Simulações de chat", simuChat: true, comp1: false, comp2: true },
    { name: "Múltiplas plataformas", simuChat: true, comp1: true, comp2: false },
    { name: "Templates prontos", simuChat: true, comp1: false, comp2: false },
    { name: "Personalização completa", simuChat: true, comp1: false, comp2: true },
    { name: "Métricas e análises", simuChat: true, comp1: true, comp2: false },
    { name: "Integração multi-canal", simuChat: true, comp1: false, comp2: false },
    { name: "Compartilhamento facilitado", simuChat: true, comp1: false, comp2: true },
    { name: "Preço acessível", simuChat: true, comp1: false, comp2: false }
  ];

  // Exemplo simplificado de demonstração de chat
  const renderChatDemo = () => {
    const demoMessages = [
      { type: 'business', text: 'Olá! Como posso ajudar você hoje?' },
      { type: 'customer', text: 'Estou com um problema no pagamento da minha fatura.' },
      { type: 'business', text: 'Lamento pelo inconveniente. Pode me informar o número do seu pedido?' },
      { type: 'customer', text: 'Sim, é o #12345.' },
      { type: 'business', text: 'Obrigado! Estou verificando aqui... Vejo que houve um problema na transação. Posso te ajudar com algumas opções.' }
    ];
    
    // Mostrar apenas mensagens com base no estado de reprodução
    const visibleCount = isPlaying ? demoMessages.length : 2;
    
    return (
      <div className="relative bg-white rounded-lg shadow-lg p-2 border border-gray-200 max-w-md mx-auto">
        {/* Header da simulação */}
        <div className="bg-teal-600 text-white p-3 rounded-t-lg flex items-center">
          <MessageSquare size={20} className="mr-2" />
          <div>
            <p className="font-medium">Atendimento Simulado</p>
            <p className="text-xs opacity-75">Demonstração</p>
          </div>
          <button 
            className="ml-auto bg-white bg-opacity-20 rounded-full p-1 hover:bg-opacity-30"
            onClick={toggleDemo}
          >
            <Play size={16} className={`${isPlaying ? 'text-yellow-200' : 'text-white'}`} />
          </button>
        </div>
        
        {/* Corpo da simulação */}
        <div className="bg-gray-100 p-3 h-64 overflow-y-auto">
          {demoMessages.slice(0, visibleCount).map((msg, index) => (
            <div 
              key={index}
              className={`mb-3 max-w-[80%] ${msg.type === 'customer' ? 'ml-auto' : ''}`}
            >
              <div 
                className={`p-3 rounded-lg ${
                  msg.type === 'customer' 
                    ? 'bg-teal-500 text-white rounded-br-none' 
                    : 'bg-white rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
              <div className="text-xs text-gray-500 mt-1 text-right">
                {msg.type === 'customer' ? 'Cliente' : 'Atendente'}
              </div>
            </div>
          ))}
          
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-lg">
              <button 
                className="bg-teal-600 text-white font-bold py-3 px-6 rounded-full hover:bg-teal-700 transform transition hover:scale-105 flex items-center"
                onClick={toggleDemo}
              >
                <Play size={20} className="mr-2" />
                Ver demonstração
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-teal-600 to-teal-800 text-white py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <nav className="flex justify-between items-center mb-16">
            <div className="text-2xl font-bold flex items-center">
              <MessageSquare size={28} className="mr-2" />
              SimulaChat
            </div>
            <div className="flex items-center gap-4">
              <Link to="/planos" className="text-white hover:text-teal-200">
                Planos
              </Link>
              <Link to="/login" className="bg-white text-teal-600 px-4 py-2 rounded-md font-medium hover:bg-teal-100">
                Entrar
              </Link>
            </div>
          </nav>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                Crie simulações de chat que treinam, vendem e engajam
              </h1>
              <p className="text-xl md:text-2xl mb-6 text-teal-100">
                A partir de R$ 19,90. Cancele quando quiser.
              </p>
              
              <form onSubmit={handleEmailSubmit} className="max-w-lg mb-6">
                <p className="text-sm mb-4">
                  Crie suas simulações de conversas. Informe seu email para criar ou reiniciar sua assinatura.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Seu email"
                    className="flex-1 py-3 px-4 rounded text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-300"
                    required
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    className="py-3 px-6 font-medium bg-teal-500 hover:bg-teal-400 text-white"
                    iconRight={<ArrowRight size={20} />}
                  >
                    Começar grátis
                  </Button>
                </div>
              </form>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center">
                  <Check size={20} className="text-teal-300 mr-2" />
                  <span className="text-teal-100">Sem necessidade de cartão</span>
                </div>
                <div className="flex items-center">
                  <Check size={20} className="text-teal-300 mr-2" />
                  <span className="text-teal-100">Configuração em minutos</span>
                </div>
                <div className="flex items-center">
                  <Check size={20} className="text-teal-300 mr-2" />
                  <span className="text-teal-100">Suporte personalizado</span>
                </div>
              </div>
            </div>
            
            <div className="hidden md:block">
              {renderChatDemo()}
            </div>
          </div>
        </div>
      </header>

      {/* Demonstração mobile */}
      <div className="md:hidden -mt-12 px-4 mb-16">
        {renderChatDemo()}
      </div>
      
      {/* Marcas que confiam */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-gray-500 text-sm mb-6">UTILIZADO POR EMPRESAS DE TODOS OS PORTES</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <div className="text-gray-400 font-bold text-xl">TechCorp</div>
            <div className="text-gray-400 font-bold text-xl">SolutionsInc</div>
            <div className="text-gray-400 font-bold text-xl">NexaGroup</div>
            <div className="text-gray-400 font-bold text-xl">EduTech</div>
            <div className="text-gray-400 font-bold text-xl">RetailFlow</div>
          </div>
        </div>
      </section>
      
      {/* Benefícios / Por que escolher */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Por que escolher o SimulaChat</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Nossa plataforma permite criar, personalizar e compartilhar simulações de conversas 
              para diferentes objetivos como treinamento, marketing e suporte.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare size={24} className="text-teal-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Simulações realistas</h3>
              <p className="text-gray-600">
                Crie conversas que imitam com perfeição as interações reais entre clientes e sua equipe em diversos canais.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Users size={24} className="text-teal-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Treinamento eficaz</h3>
              <p className="text-gray-600">
                Prepare sua equipe para qualquer situação com simulações interativas que melhoram a eficiência do treinamento.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart size={24} className="text-teal-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Análises detalhadas</h3>
              <p className="text-gray-600">
                Obtenha insights sobre o desempenho das suas simulações com métricas e relatórios detalhados.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Casos de uso com abas */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Casos de uso</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Descubra como o SimulaChat pode ajudar em diferentes áreas da sua empresa.
            </p>
          </div>
          
          {/* Abas de navegação */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {Object.keys(useCases).map((key) => (
              <button
                key={key}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  activeTab === key 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setActiveTab(key)}
              >
                {useCases[key].title}
              </button>
            ))}
          </div>
          
          {/* Conteúdo da aba ativa */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-3">{useCases[activeTab].title}</h3>
                <p className="text-gray-700 mb-6">{useCases[activeTab].description}</p>
                
                <div className="space-y-3">
                  {useCases[activeTab].benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start">
                      <Check size={18} className="text-teal-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
                
                <button className="mt-8 text-teal-600 font-medium flex items-center hover:text-teal-700">
                  Saber mais
                  <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
              
              <div className="bg-gray-100 flex items-center justify-center p-8">
                <div className="rounded-lg shadow-md overflow-hidden">
                  <img 
                    src="/images/placeholder-image.jpg" 
                    alt={useCases[activeTab].title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Comparação competitiva */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Como nos comparamos</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Veja por que o SimulaChat é a escolha ideal para suas necessidades de simulação de conversas.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-4 border-b-2 border-gray-200">Recursos</th>
                  <th className="p-4 border-b-2 border-gray-200 bg-teal-50">
                    <div className="font-bold">SimulaChat</div>
                  </th>
                  <th className="p-4 border-b-2 border-gray-200">
                    <div className="font-bold text-gray-700">Concorrente A</div>
                  </th>
                  <th className="p-4 border-b-2 border-gray-200">
                    <div className="font-bold text-gray-700">Concorrente B</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="p-4 border-b border-gray-200">{feature.name}</td>
                    <td className="p-4 border-b border-gray-200 text-center bg-teal-50">
                      {feature.simuChat ? (
                        <Check size={20} className="text-teal-600 mx-auto" />
                      ) : (
                        <X size={20} className="text-gray-400 mx-auto" />
                      )}
                    </td>
                    <td className="p-4 border-b border-gray-200 text-center">
                      {feature.comp1 ? (
                        <Check size={20} className="text-green-600 mx-auto" />
                      ) : (
                        <X size={20} className="text-gray-400 mx-auto" />
                      )}
                    </td>
                    <td className="p-4 border-b border-gray-200 text-center">
                      {feature.comp2 ? (
                        <Check size={20} className="text-green-600 mx-auto" />
                      ) : (
                        <X size={20} className="text-gray-400 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      
      {/* Depoimentos */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">O que nossos clientes dizem</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Descubra como o SimulaChat tem ajudado empresas a melhorar seu atendimento, vendas e treinamento.
            </p>
          </div>
          
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index}
                  className={`bg-white p-6 rounded-lg shadow-md border border-gray-100 flex flex-col h-full transition-all duration-300 ${
                    currentTestimonial === index ? 'md:scale-105 md:shadow-lg' : ''
                  }`}
                  onMouseEnter={() => setCurrentTestimonial(index)}
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex-shrink-0 flex items-center justify-center">
                      {testimonial.image ? (
                        <img 
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-teal-600 font-bold">
                          {testimonial.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className="font-bold">{testimonial.name}</h3>
                      <p className="text-sm text-gray-600">{testimonial.role} • {testimonial.company}</p>
                    </div>
                  </div>
                  
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        className={i < testimonial.stars ? 'text-yellow-500' : 'text-gray-300'} 
                        fill={i < testimonial.stars ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  
                  <p className="text-gray-700 flex-grow">"{testimonial.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Final */}
      <section className="py-16 px-4 bg-teal-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Pronto para transformar suas conversas?</h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Comece agora mesmo a criar simulações de chat que vão elevar o nível do seu atendimento e treinamento.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              variant="primary"
              className="py-3 px-8 text-teal-700 bg-white hover:bg-teal-50 text-lg font-bold"
              onClick={() => {
                const emailInput = document.getElementById('email-bottom');
                if (emailInput && emailInput.value) {
                  localStorage.setItem('signup_email', emailInput.value);
                  navigate('/signup');
                } else {
                  navigate('/signup');
                }
              }}
            >
              Começar gratuitamente
            </Button>
            <Link to="/planos">
              <Button
                variant="outline"
                className="py-3 px-8 border-white text-white hover:bg-teal-700 text-lg font-bold"
              >
                Ver planos
              </Button>
            </Link>
          </div>
          
          <form onSubmit={handleEmailSubmit} className="max-w-lg mx-auto">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="email-bottom"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu email"
                className="flex-1 py-3 px-4 rounded text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-300"
                required
              />
              <Button
                type="submit"
                variant="primary"
                className="py-3 px-6 font-medium bg-teal-900 hover:bg-teal-800 text-white"
                iconRight={<ArrowRight size={20} />}
              >
                Começar grátis
              </Button>
            </div>
          </form>
        </div>
      </section>
      
      {/* Seção de perguntas frequentes */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">Perguntas Frequentes</h2>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button className="w-full p-4 text-left bg-white hover:bg-gray-50 flex justify-between items-center">
                <span className="font-medium">O que é o SimulaChat?</span>
                <HelpCircle size={20} className="text-teal-600 flex-shrink-0" />
              </button>
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <p className="text-gray-700">
                  SimulaChat é uma plataforma que permite criar, personalizar e compartilhar simulações de conversas para diferentes objetivos como marketing, treinamento de atendimento e demonstrações de produtos. Com ele, você pode criar fluxos de comunicação realistas para diversas plataformas como WhatsApp, Instagram e outros canais.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button className="w-full p-4 text-left bg-white hover:bg-gray-50 flex justify-between items-center">
                <span className="font-medium">Quanto custa o SimulaChat?</span>
                <HelpCircle size={20} className="text-teal-600 flex-shrink-0" />
              </button>
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <p className="text-gray-700">
                  O SimulaChat oferece planos a partir de R$ 19,90 por mês. Temos diferentes opções para atender às necessidades de diferentes portes de empresas, desde pequenos negócios até grandes corporações. Você pode cancelar a qualquer momento sem compromisso.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button className="w-full p-4 text-left bg-white hover:bg-gray-50 flex justify-between items-center">
                <span className="font-medium">Preciso ter conhecimento técnico para usar?</span>
                <HelpCircle size={20} className="text-teal-600 flex-shrink-0" />
              </button>
              <div className="p-4 bg-gray-50 border-t border-gray-200">
              // Continuação do código anterior...

<p className="text-gray-700">
  Não! O SimulaChat foi projetado para ser extremamente intuitivo. Nossa interface amigável permite que qualquer pessoa, mesmo sem conhecimentos técnicos, crie simulações de conversas profissionais em minutos. Oferecemos também templates prontos para você começar ainda mais rápido.
</p>
</div>
</div>

<div className="border border-gray-200 rounded-lg overflow-hidden">
<button className="w-full p-4 text-left bg-white hover:bg-gray-50 flex justify-between items-center">
<span className="font-medium">Quais plataformas de chat são suportadas?</span>
<HelpCircle size={20} className="text-teal-600 flex-shrink-0" />
</button>
<div className="p-4 bg-gray-50 border-t border-gray-200">
<p className="text-gray-700">
  Atualmente, o SimulaChat suporta simulações para WhatsApp, Instagram, Messenger e Telegram. Estamos constantemente adicionando suporte para novas plataformas para atender às necessidades dos nossos clientes.
</p>
</div>
</div>

<div className="border border-gray-200 rounded-lg overflow-hidden">
<button className="w-full p-4 text-left bg-white hover:bg-gray-50 flex justify-between items-center">
<span className="font-medium">Como posso compartilhar minhas simulações?</span>
<HelpCircle size={20} className="text-teal-600 flex-shrink-0" />
</button>
<div className="p-4 bg-gray-50 border-t border-gray-200">
<p className="text-gray-700">
  O SimulaChat permite compartilhar suas simulações facilmente através de links. Você pode enviar o link para sua equipe, incorporar em seu site ou compartilhar em materiais de treinamento. Os destinatários não precisam ter uma conta para visualizar a simulação.
</p>
</div>
</div>
</div>
</div>
</section>

{/* Footer */}
<footer className="bg-gray-800 text-white py-12 px-4">
<div className="container mx-auto max-w-6xl">
<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
<div>
<h3 className="text-lg font-bold mb-4 flex items-center">
<MessageSquare size={20} className="mr-2" />
SimulaChat
</h3>
<p className="text-gray-400 text-sm">
A melhor plataforma para simulações de conversas. Transforme seu atendimento, treinamento e vendas com simulações realistas.
</p>
</div>

<div>
<h4 className="font-medium mb-4">Plataformas</h4>
<ul className="space-y-2 text-gray-400 text-sm">
<li className="hover:text-teal-300 transition-colors">WhatsApp</li>
<li className="hover:text-teal-300 transition-colors">Instagram</li>
<li className="hover:text-teal-300 transition-colors">Messenger</li>
<li className="hover:text-teal-300 transition-colors">Telegram</li>
</ul>
</div>

<div>
<h4 className="font-medium mb-4">Links Úteis</h4>
<ul className="space-y-2 text-gray-400 text-sm">
<li><Link to="/planos" className="hover:text-teal-300 transition-colors">Planos</Link></li>
<li><Link to="/signup" className="hover:text-teal-300 transition-colors">Registrar</Link></li>
<li><Link to="/login" className="hover:text-teal-300 transition-colors">Entrar</Link></li>
<li><a href="#" className="hover:text-teal-300 transition-colors">Blog</a></li>
</ul>
</div>

<div>
<h4 className="font-medium mb-4">Contato</h4>
<p className="text-gray-400 text-sm mb-2">contato@simulachat.com.br</p>
<div className="flex space-x-4 text-gray-400">
<a href="#" className="hover:text-teal-300 transition-colors">
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
  </svg>
</a>
<a href="#" className="hover:text-teal-300 transition-colors">
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
  </svg>
</a>
<a href="#" className="hover:text-teal-300 transition-colors">
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
  </svg>
</a>
<a href="#" className="hover:text-teal-300 transition-colors">
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
  </svg>
</a>
</div>
</div>
</div>

<div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
<p>&copy; {new Date().getFullYear()} SimulaChat. Todos os direitos reservados.</p>
<div className="mt-2 flex justify-center space-x-6">
<a href="#" className="hover:text-teal-300 transition-colors">Termos de Serviço</a>
<a href="#" className="hover:text-teal-300 transition-colors">Política de Privacidade</a>
<a href="#" className="hover:text-teal-300 transition-colors">Cookies</a>
</div>
</div>
</div>
</footer>
</div>
);
};

export default LandingPage;