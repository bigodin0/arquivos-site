import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Componente Breadcrumbs premium com design elegante
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Array} props.items - Array de itens do breadcrumb
 * @param {boolean} [props.showHomeIcon=true] - Se deve mostrar o ícone home no início
 * @param {React.ReactNode} [props.separator] - Separador personalizado entre os itens
 * @param {string} [props.className] - Classes adicionais
 */
const Breadcrumbs = ({
  items = [],
  showHomeIcon = true,
  separator,
  className = '',
  ...props
}) => {
  // Verifica se há itens para mostrar
  if (!items || items.length === 0) return null;
  
  // Componente separador padrão
  const defaultSeparator = <ChevronRight size={16} className="text-text-light mx-1" />;
  
  // Separador a ser usado
  const actualSeparator = separator || defaultSeparator;
  
  return (
    <nav className={`flex items-center text-sm ${className}`} aria-label="Breadcrumbs" {...props}>
      <ol className="flex items-center flex-wrap">
        {/* Ícone home opcional */}
        {showHomeIcon && (
          <li className="flex items-center">
            <Link 
              to="/" 
              className="text-text-light hover:text-primary transition-colors flex items-center"
              aria-label="Home"
            >
              <Home size={16} />
            </Link>
            {items.length > 0 && (
              <span className="mx-1">{actualSeparator}</span>
            )}
          </li>
        )}
        
        {/* Itens do breadcrumb */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center">
              {isLast ? (
                // Último item (atual) sem link
                <span className="font-medium text-text-dark" aria-current="page">
                  {item.label}
                </span>
              ) : (
                // Itens anteriores com link
                <>
                  <Link
                    to={item.href || '#'}
                    className="text-text-light hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                  <span className="mx-1">{actualSeparator}</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;