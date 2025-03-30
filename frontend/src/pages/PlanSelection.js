// src/pages/PlanSelection.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Check, ArrowRight } from 'lucide-react';
import { Button } from '../design-system';
import SecureStorageService from '../services/secureStorage';

const PlanSelection = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const navigate = useNavigate();
  
  // Verificar se o usuário já está autenticado ao carregar a página
  useEffect(() => {
    if (SecureStorageService.isTokenValid()) {
      navigate('/dashboard');
    }
  }, [navigate]);
  
  const plans = [
    {
      id: 1,
      name: 'Básico',
      price: 47.90,
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
      features: [
        'Fluxos ilimitados',
        'Mensagens ilimitadas por fluxo',
        'Mídia nos fluxos',
        'Recursos avançados',
        'Suporte VIP'
      ]
    }
  ];
  
  const handleContinue = () => {
    if (selectedPlan) {
      // Salvar plano selecionado de forma segura
      // Usamos localStorage porque precisamos manter o dado após navegação
      // e não é um dado sensível como tokens
      localStorage.setItem('selected_plan', selectedPlan);
      navigate('/signup/payment');
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <MessageSquare size={28} className="text-teal-600 mr-2" />
            <h1 className="text-xl font-bold">SimulaChat</h1>
          </div>
        </div>
      </header>
      
      <main className="flex-1 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-lg font-medium text-gray-600">PASSO 2 DE 3</h2>
            <h1 className="text-3xl font-bold mb-4">Escolha o melhor plano para você</h1>
            <p className="text-gray-600">Sem compromisso, cancele quando quiser.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {plans.map(plan => (
              <div 
                key={plan.id}
                className={`
                  border rounded-lg p-6 bg-white 
                  ${selectedPlan === plan.id ? 'border-teal-500 ring-2 ring-teal-500 shadow-md' : 'border-gray-200'}
                  ${plan.recommended ? 'relative' : ''}
                `}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-teal-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Recomendado
                  </div>
                )}
                
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">R$ {plan.price.toFixed(2)}</span>
                  <span className="text-gray-500">/mês</span>
                </div>
                
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check size={16} className="mt-0.5 mr-2 text-teal-600 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    variant={selectedPlan === plan.id ? "primary" : "outline"}
                    fullWidth
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {selectedPlan === plan.id ? 'Selecionado' : 'Selecionar'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Button
              variant="primary"
              size="lg"
              disabled={!selectedPlan}
              onClick={handleContinue}
              className="px-10"
              iconRight={<ArrowRight size={18} />}
            >
              Continuar
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlanSelection;