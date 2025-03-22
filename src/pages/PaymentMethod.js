// src/pages/PaymentMethod.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, CreditCard, ArrowRight } from 'lucide-react';
import { Button, TextField } from '../design-system';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import apiConfig from '../config/api';

const PaymentMethod = () => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const navigate = useNavigate();
  const { register } = useAuth();
  
  useEffect(() => {
    // Recuperar dados das etapas anteriores
    const planId = localStorage.getItem('selected_plan');
    const signupData = localStorage.getItem('signup_data');
    
    if (!planId || !signupData) {
      navigate('/');
      return;
    }
    
    // Obter detalhes do plano selecionado
    const fetchPlanDetails = async () => {
      try {
        const response = await axios.get(apiConfig.endpoints.planos);
        if (response.data) {
          const plan = response.data.find(p => p.id === parseInt(planId));
          setSelectedPlan(plan);
        }
      } catch (error) {
        console.error('Erro ao obter detalhes do plano:', error);
      }
    };
    
    fetchPlanDetails();
  }, [navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      setError('Selecione um plano primeiro');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Recuperar dados de cadastro
      const signupData = JSON.parse(localStorage.getItem('signup_data'));
      
      // Registrar o usuário
      const success = await register(
        signupData.name,
        signupData.email,
        signupData.password
      );
      
      if (success) {
        // Iniciar processo de pagamento
        const payload = {
          planId: selectedPlan.id,
          userId: localStorage.getItem('userId'), // Obtido após registro
          email: signupData.email,
          isNewUser: true
        };
        
        const response = await axios.post(
          apiConfig.endpoints.checkout,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data && response.data.success && response.data.redirectUrl) {
          // Limpar dados de cadastro do localStorage por segurança
          localStorage.removeItem('signup_data');
          localStorage.removeItem('signup_email');
          localStorage.removeItem('selected_plan');
          
          // Redirecionar para a página de pagamento
          window.location.href = response.data.redirectUrl;
        } else {
          throw new Error('Falha ao iniciar processo de pagamento');
        }
      } else {
        throw new Error('Falha ao registrar usuário');
      }
    } catch (error) {
      console.error('Erro no processo de pagamento:', error);
      setError('Ocorreu um erro ao processar seu pagamento. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-t-2 border-teal-500 border-r-2 rounded-full mx-auto mb-4"></div>
          <p>Carregando detalhes do plano...</p>
        </div>
      </div>
    );
  }
  
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
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-lg font-medium text-gray-600">PASSO 3 DE 3</h2>
            <h1 className="text-3xl font-bold mb-4">Configure seu método de pagamento</h1>
            <p className="text-gray-600">Sua assinatura começará imediatamente após a confirmação do pagamento.</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-bold text-lg mb-2">Resumo</h3>
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <p className="text-gray-600 text-sm">Plano selecionado</p>
                  <p className="font-bold">{selectedPlan.name}</p>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-600 text-sm">Valor</p>
                  <p className="font-bold text-xl">R$ {selectedPlan.price.toFixed(2)}/mês</p>
                  <p className="text-gray-600 text-sm mt-1">Cobrado mensalmente</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between mb-2">
                    <span>Subtotal:</span>
                    <span>R$ {selectedPlan.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total hoje:</span>
                    <span>R$ {selectedPlan.price.toFixed(2)}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500">
                  Ao confirmar, você concorda com nossos <a href="/termos" className="text-teal-600 hover:underline">Termos de Serviço</a> e <a href="/privacidade" className="text-teal-600 hover:underline">Política de Privacidade</a>.
                </p>
              </div>
            </div>
            
            <div className="md:w-2/3">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center">
                  <CreditCard size={20} className="mr-2 text-teal-600" />
                  Informações de pagamento
                </h3>
                
                {error && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <TextField
                      label="Número do cartão"
                      name="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={handleChange}
                      fullWidth
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <TextField
                      label="Nome do titular"
                      name="cardName"
                      placeholder="Como está no cartão"
                      value={formData.cardName}
                      onChange={handleChange}
                      fullWidth
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <TextField
                        label="Data de validade"
                        name="expiryDate"
                        placeholder="MM/AA"
                        value={formData.expiryDate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <TextField
                        label="Código de segurança (CVV)"
                        name="cvv"
                        placeholder="123"
                        value={formData.cvv}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    disabled={isLoading}
                    className="flex items-center justify-center"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <span className="animate-spin h-4 w-4 border-t-2 border-white border-r-2 rounded-full mr-2"></span>
                        Processando...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Iniciar assinatura
                        <ArrowRight size={18} className="ml-2" />
                      </span>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-600 text-sm">
            <p>© {new Date().getFullYear()} SimulaChat. Todos os direitos reservados.</p>
            <p className="mt-2">
              <a href="/termos" className="text-teal-600 hover:underline mr-4">Termos de Serviço</a>
              <a href="/privacidade" className="text-teal-600 hover:underline">Política de Privacidade</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PaymentMethod;