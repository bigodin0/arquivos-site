import React from 'react';

/**
 * Componente de botão premium com design elegante
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} [props.variant='primary'] - Variante do botão (primary, secondary, outline, text, success, warning, error)
 * @param {string} [props.size='md'] - Tamanho do botão (sm, md, lg)
 * @param {boolean} [props.fullWidth=false] - Se o botão deve ocupar toda a largura disponível
 * @param {boolean} [props.disabled=false] - Estado desabilitado do botão
 * @param {boolean} [props.loading=false] - Estado de carregamento
 * @param {React.ReactNode} [props.icon] - Ícone opcional para o botão
 * @param {React.ReactNode} [props.iconRight] - Ícone opcional à direita do texto
 * @param {Function} [props.onClick] - Função de callback para o evento de clique
 * @param {string} [props.className] - Classes adicionais para estilização
 * @param {React.ReactNode} props.children - Conteúdo do botão
 */
const Button = ({ 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  disabled = false, 
  loading = false,
  icon,
  iconRight,
  onClick,
  className = '',
  children,
  ...props 
}) => {
  // Variantes de estilo
  const variants = {
    primary: 'bg-gradient-premium hover:shadow-premium text-white focus:ring-2 focus:ring-primary-200 active:bg-primary-600',
    secondary: 'bg-secondary-100 hover:bg-secondary-200 text-secondary-700 focus:ring-2 focus:ring-secondary-200 active:bg-secondary-300',
    outline: 'border border-primary hover:bg-primary-50 text-primary focus:ring-2 focus:ring-primary-100 active:bg-primary-100',
    text: 'text-primary hover:bg-primary-50 focus:ring-2 focus:ring-primary-100',
    success: 'bg-success hover:bg-success/90 text-white focus:ring-2 focus:ring-success/20',
    warning: 'bg-warning hover:bg-warning/90 text-text-dark focus:ring-2 focus:ring-warning/20',
    error: 'bg-error hover:bg-error/90 text-white focus:ring-2 focus:ring-error/20',
    glass: 'bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white',
  };

  // Tamanhos
  const sizes = {
    sm: 'px-3 py-1 text-xs rounded',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-6 py-3 text-base rounded-lg',
  };
  
  // Classes base
  const baseStyles = 'relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none';
  const widthStyles = fullWidth ? 'w-full' : '';
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';
  const variantStyles = variants[variant] || variants.primary;
  const sizeStyles = sizes[size] || sizes.md;
  
  // Compilar classes
  const buttonClasses = `${baseStyles} ${variantStyles} ${sizeStyles} ${widthStyles} ${disabledStyles} ${className}`;

  // Renderização do spinner de loading
  const renderSpinner = () => (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <button
      type="button"
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && renderSpinner()}
      {!loading && icon && <span className={`${children ? 'mr-2' : ''}`}>{icon}</span>}
      {children}
      {!loading && iconRight && <span className="ml-2">{iconRight}</span>}
    </button>
  );
};

export default Button;