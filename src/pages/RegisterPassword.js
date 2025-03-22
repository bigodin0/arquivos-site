// src/pages/RegisterPassword.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { Button, TextField } from '../design-system';

const RegisterPassword = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Recuperar email da etapa anterior
    const savedEmail = localStorage.getItem('signup_email');
    if (savedEmail) {
      setEmail(savedEmail);
    } else {
      navigate('/');
    }
  }, [navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      setError('Todos os campos são obrigatórios');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Armazenar dados para uso posterior
      localStorage.setItem('signup_data', JSON.stringify({
        name,
        email,
        password
      }));
      
      // Avançar para a próxima etapa
      navigate('/signup/planform');
    } catch (error) {
      console.error('Erro:', error);
      setError('Ocorreu um erro ao processar sua solicitação');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <MessageSquare size={32} className="text-teal-600 mr-2" />
            <h1 className="text-2xl font-bold">SimulaChat</h1>
          </div>
          
          <h2 className="text-lg font-medium text-gray-800">PASSO 1 DE 3</h2>
          <p className="text-2xl font-bold mb-2">Complete seus dados para continuar</p>
          <p className="text-gray-600">Só mais alguns passos para começar!</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="seu@email.com"
            disabled={!!localStorage.getItem('signup_email')}
            required
            className="mb-4"
          />
          
          <TextField
            label="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome completo"
            required
            className="mb-4"
          />
          
          <TextField
            label="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Crie uma senha segura"
            required
            className="mb-6"
          />
          
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading}
            className="flex items-center justify-center"
          >
            {isLoading ? 'Processando...' : 'Próximo'}
            {!isLoading && <ArrowRight size={16} className="ml-2" />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPassword;