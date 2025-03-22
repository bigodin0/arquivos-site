import React from 'react';
import { Clock, MessageSquare } from 'lucide-react';
import Card from './Card';

/**
 * Componente de card para templates de simulação
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} props.title - Título do template
 * @param {string} props.description - Descrição do template
 * @param {string} [props.updatedAt] - Data da última atualização
 * @param {Function} props.onUse - Função chamada quando o usuário clica em "Usar template"
 * @param {string} [props.className] - Classes adicionais para estilização
 */
const TemplateCard = ({
  title,
  description,
  updatedAt,
  onUse,
  className = '',
  ...props
}) => {
  return (
    <Card 
      hover={true}
      className={className}
      {...props}
    >
      <div className="bg-gray-100 h-40 flex items-center justify-center border-b mb-4 -mt-4 -mx-4">
        <MessageSquare size={48} className="text-gray-400" />
      </div>
      
      <h4 className="font-semibold text-lg mb-1 text-text-dark">{title}</h4>
      <p className="text-text-medium text-sm mb-3">{description}</p>
      
      <div className="flex justify-between items-center">
        {updatedAt && (
          <span className="text-xs text-text-light flex items-center">
            <Clock size={14} className="mr-1" /> Atualizado {updatedAt}
          </span>
        )}
        <button 
          onClick={onUse}
          className="text-primary hover:text-primary-dark text-sm font-medium transition-colors"
        >
          Usar template
        </button>
      </div>
    </Card>
  );
};

export default TemplateCard;