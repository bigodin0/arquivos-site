import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, XCircle, X } from 'lucide-react';

/**
 * Componente de notificação toast que segue o novo design do SimulaChat
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} [props.variant='info'] - Variante do toast (success, info, warning, error)
 * @param {string} props.title - Título do toast
 * @param {string} [props.message] - Mensagem do toast
 * @param {boolean} [props.show=false] - Se o toast deve ser exibido
 * @param {Function} props.onClose - Função chamada quando o toast é fechado
 * @param {number} [props.autoClose=5000] - Tempo em milissegundos antes do toast fechar automaticamente (0 para desabilitar)
 * @param {string} [props.className] - Classes adicionais para estilização
 */
const Toast = ({
  variant = 'info',
  title,
  message,
  show = false,
  onClose,
  autoClose = 5000,
  className = '',
  ...props
}) => {
  // Auto-close após o tempo definido
  useEffect(() => {
    if (show && autoClose > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoClose);
      
      return () => clearTimeout(timer);
    }
  }, [show, autoClose, onClose]);
  
  // Configurações de estilo baseadas na variante
  const variantConfig = {
    success: {
      bgColor: 'bg-success/10',
      borderColor: 'border-success',
      textColor: 'text-success',
      icon: <CheckCircle className="h-5 w-5" />
    },
    info: {
      bgColor: 'bg-secondary/10',
      borderColor: 'border-secondary',
      textColor: 'text-secondary',
      icon: <AlertCircle className="h-5 w-5" />
    },
    warning: {
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning',
      textColor: 'text-warning',
      icon: <AlertTriangle className="h-5 w-5" />
    },
    error: {
      bgColor: 'bg-error/10',
      borderColor: 'border-error',
      textColor: 'text-error',
      icon: <XCircle className="h-5 w-5" />
    }
  };
  
  const config = variantConfig[variant] || variantConfig.info;
  
  if (!show) return null;
  
  return (
    <div 
      className={`${config.bgColor} border-l-4 ${config.borderColor} p-4 rounded shadow-md max-w-sm animate-fade-in relative ${className}`}
      role="alert"
      {...props}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <span className={config.textColor}>{config.icon}</span>
        </div>
        <div className="ml-3 pr-6">
          <p className={`text-sm font-medium ${config.textColor}`}>{title}</p>
          {message && <p className="text-sm mt-1 text-text-medium">{message}</p>}
        </div>
        
        <button 
          type="button"
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={onClose}
          aria-label="Fechar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toast;