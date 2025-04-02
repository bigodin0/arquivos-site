import React from 'react';

/**
 * Componente de indicador de carregamento
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} [props.size='md'] - Tamanho do spinner (sm, md, lg)
 * @param {string} [props.color='primary'] - Cor do spinner (primary, secondary, success, warning, error)
 * @param {string} [props.text] - Texto opcional a ser exibido junto com o spinner
 * @param {string} [props.className] - Classes adicionais para personalização
 */
const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  text, 
  className = '',
  ...props 
}) => {
  // Mapear tamanhos para classes
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  // Mapear cores para classes
  const colorClasses = {
    primary: 'border-primary',
    secondary: 'border-secondary',
    success: 'border-success',
    warning: 'border-warning',
    error: 'border-error',
    white: 'border-white'
  };
  
  return (
    <div className={`flex items-center justify-center ${className}`} {...props}>
      <div className={`animate-spin rounded-full border-2 border-b-transparent ${sizeClasses[size] || sizeClasses.md} ${colorClasses[color] || colorClasses.primary}`}></div>
      {text && <span className="ml-3 text-sm text-text-medium">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;