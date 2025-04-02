import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import SecureStorageService from '../services/secureStorage';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, localLogin, googleLogin } = useAuth();
  
  // Verificar se já existe um token válido ao carregar a página
  useEffect(() => {
    // Se o usuário já estiver autenticado, redirecionar para dashboard
    if (SecureStorageService.isTokenValid()) {
      navigate('/dashboard');
    }
  }, [navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Primeiro tenta login na API
      const success = await login(email, password);
      
      if (success) {
        navigate('/dashboard');
      } else {
        // Se falhou com a API, tenta o login local (para desenvolvimento)
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        if (isDevelopment) {
          console.log('Tentando login local para desenvolvimento');
          const localSuccess = localLogin(email, password);
          
          if (localSuccess) {
            navigate('/dashboard');
            return;
          }
        }
        
        setError('Email ou senha inválidos');
      }
    } catch (err) {
      console.error('Erro ao processar login:', err);
      
      // Verificar se o erro está relacionado à autenticação
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError('Email ou senha inválidos');
      } else {
        setError('Ocorreu um erro ao tentar fazer login. Por favor, tente novamente.');
      }
      
      // Garantir que nenhum token inválido permaneça
      SecureStorageService.clearToken();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função de login com Google
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Decodifica o token para obter as informações do usuário
      const decoded = jwtDecode(credentialResponse.credential);
      console.log("Google user info:", decoded);
      
      // Usar o método googleLogin do contexto de autenticação
      const success = await googleLogin(
        credentialResponse.credential,
        decoded.email,
        decoded.name,
        decoded.picture
      );
      
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Não foi possível fazer login com o Google. Tente novamente.');
        // Garantir que nenhum token parcial seja armazenado
        SecureStorageService.clearToken();
      }
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error);
      setError('Ocorreu um erro ao fazer login com o Google. Tente novamente.');
      SecureStorageService.clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginError = () => {
    setError('Não foi possível fazer login com o Google. Tente novamente.');
    SecureStorageService.clearToken();
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-primary rounded-full p-2 mr-2">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-primary">SimulaChat</h1>
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 mb-2">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <div className="mt-1 text-right">
              <a href="#" className="text-sm text-primary hover:underline">Esqueceu a senha?</a>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md transition-colors flex justify-center items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando...
              </>
            ) : 'Entrar'}
          </button>
        </form>
        
        {/* Divisor "OU" */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm">OU</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>
        
        {/* Botão de login com Google */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={handleGoogleLoginError}
            useOneTap
            theme="outline"
            size="large"
            logo_alignment="center"
            text="continue_with"
          />
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Não tem uma conta?{' '}
            <Link to="/signup" className="text-primary hover:underline">
              Registre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;