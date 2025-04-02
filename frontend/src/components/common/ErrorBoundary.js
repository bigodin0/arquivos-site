import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../../design-system';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Atualizar o estado para que a próxima renderização mostre a UI de fallback
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log do erro para monitoramento
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Aqui você pode enviar o erro para um serviço de monitoramento como Sentry
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error);
    // }
  }

  resetError = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render() {
    const { hasError, error } = this.state;
    const { fallback, children } = this.props;
    
    if (hasError) {
      // Se houver um fallback personalizado, usá-lo
      if (fallback) {
        return fallback(error, this.resetError);
      }
      
      // Fallback padrão
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
            <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Algo deu errado</h2>
            <p className="text-gray-600 mb-4">
              Ocorreu um erro ao exibir esta página. Nossa equipe foi notificada e estamos trabalhando para resolver o problema.
            </p>
            <div className="space-y-2">
              <Button 
                variant="primary" 
                onClick={this.resetError}
                fullWidth
              >
                Tentar novamente
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                fullWidth
              >
                Voltar para a página inicial
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;