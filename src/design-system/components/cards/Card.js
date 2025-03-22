import React from 'react';

/**
 * Componente de card genérico que serve como base para outros cards
 * 
 * @param {Object} props - Propriedades do componente
 * @param {React.ReactNode} props.children - Conteúdo do card
 * @param {React.ReactNode} [props.header] - Cabeçalho opcional do card
 * @param {React.ReactNode} [props.footer] - Rodapé opcional do card
 * @param {boolean} [props.hover=false] - Se o card deve ter efeito de hover
 * @param {string} [props.className] - Classes adicionais para estilização
 */
const Card = ({
  children,
  header,
  footer,
  hover = false,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`
        bg-white 
        rounded-lg 
        border border-gray-200 
        overflow-hidden 
        ${hover ? 'transition-all hover:shadow-md' : ''} 
        ${className}
      `}
      {...props}
    >
      {header && (
        <div className="px-4 py-3 border-b border-gray-100">
          {header}
        </div>
      )}
      
      <div className="p-4">
        {children}
      </div>
      
      {footer && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;