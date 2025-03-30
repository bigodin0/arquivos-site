import React from 'react';

/**
 * Botão de ícone que segue o novo design do SimulaChat
 * 
 * @param {Object} props - Propriedades do componente
 * @param {React.ReactNode} props.icon - Ícone a ser exibido no botão
 * @param {string} [props.variant='default'] - Variante do botão (default, primary, success, warning, error)
 * @param {boolean} [props.disabled=false] - Estado desabilitado do botão
 * @param {Function} [props.onClick] - Função de callback para o evento de clique
 * @param {string} [props.className] - Classes adicionais para estilização
 * @param {string} [props.ariaLabel] - Texto para acessibilidade
 */
const IconButton = ({
  icon,
  variant = 'default',
  disabled = false,
  onClick,
  className = '',
  ariaLabel,
  ...props
}) => {
  const variants = {
    default: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    primary: 'bg-primary/10 hover:bg-primary/20 text-primary',
    success: 'bg-success/10 hover:bg-success/20 text-success',
    warning: 'bg-warning/10 hover:bg-warning/20 text-warning',
    error: 'bg-error/10 hover:bg-error/20 text-error',
  };

  const baseStyles = 'p-2 rounded-full transition-colors duration-200 flex items-center justify-center';
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const variantStyles = variants[variant] || variants.default;
  
  const buttonClasses = `${baseStyles} ${variantStyles} ${disabledStyles} ${className}`;

  return (
    <button
      type="button"
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      {...props}
    >
      {icon}
    </button>
  );
};

export default IconButton;