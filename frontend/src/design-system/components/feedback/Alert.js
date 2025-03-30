import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, XCircle, X } from 'lucide-react';

/**
 * Componente de alerta que segue o novo design do SimulaChat
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} [props.variant='info'] - Variante do alerta (success, info, warning, error)
 * @param {string} props.title - Título do alerta
 * @param {string} [props.message] - Mensagem do alerta
 * @param {boolean} [props.dismissible=false] - Se o alerta pode ser fechado
 * @param {Function} [props.onDismiss] - Função chamada quando o alerta é fechado
 * @param {string} [props.className] - Classes adicionais para estilização
 */
const Alert = ({
  variant = 'info',
  title,
  message,
  dismissible = false,
  onDismiss,
  className = '',
  ...props
}) => {
  // Configurações de estilo baseadas na variante
  const variantConfig = {
    success: {
      borderColor: 'border-success',
      bgColor: 'bg-success/10',
      textColor: 'text-success',
      icon: <CheckCircle className="h-5 w-5" />
    },
    info: {
      borderColor: 'border-secondary',
      bgColor: 'bg-secondary/10',
      textColor: 'text-secondary',
      icon: <AlertCircle className="h-5 w-5" />
    },
    warning: {
      borderColor: 'border-warning',
      bgColor: 'bg-warning/10',
      textColor: 'text-warning',
      icon: <AlertTriangle className="h-5 w-5" />
    },
    error: {
      borderColor: 'border-error',
      bgColor: 'bg-error/10',
      textColor: 'text-error',
      icon: <XCircle className="h-5 w-5" />
    }
  };
  
  const config = variantConfig[variant] || variantConfig.info;
  
  return (
    <div 
      className={`${config.bgColor} border-l-4 ${config.borderColor} p-4 relative ${className}`}
      role="alert"
      {...props}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <span className={config.textColor}>{config.icon}</span>
        </div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${config.textColor}`}>{title}</p>
          {message && <p className="text-sm mt-1 text-text-medium">{message}</p>}
        </div>
        
        {dismissible && (
          <button 
            type="button"
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onDismiss}
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;