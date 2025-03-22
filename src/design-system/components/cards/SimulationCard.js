import React from 'react';
import { ChevronRight, Edit, Trash, Play, Pause } from 'lucide-react';
import Card from './Card';
import IconButton from '../buttons/IconButton';

/**
 * Componente de card para simulações ativas
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} props.title - Título da simulação
 * @param {string} props.description - Descrição da simulação
 * @param {boolean} [props.isActive=false] - Se a simulação está ativa
 * @param {Function} props.onView - Função chamada quando o usuário clica em "Ver detalhes"
 * @param {Function} props.onEdit - Função chamada quando o usuário clica no ícone de editar
 * @param {Function} props.onDelete - Função chamada quando o usuário clica no ícone de excluir
 * @param {Function} props.onToggleActive - Função chamada quando o usuário clica no ícone de play/pause
 * @param {string} [props.className] - Classes adicionais para estilização
 */
const SimulationCard = ({
  title,
  description,
  isActive = false,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
  className = '',
  ...props
}) => {
  const Header = () => (
    <div className="flex justify-between items-center">
      <span className="font-medium text-primary">{isActive ? 'Simulação Ativa' : 'Simulação'}</span>
      <div className="flex space-x-2">
        <IconButton 
          icon={<Edit size={16} />} 
          onClick={onEdit} 
          ariaLabel="Editar simulação"
        />
        <IconButton 
          icon={<Trash size={16} />} 
          onClick={onDelete} 
          variant="error"
          ariaLabel="Excluir simulação"
        />
      </div>
    </div>
  );

  return (
    <Card 
      header={<Header />}
      hover={true}
      className={`${isActive ? 'border-secondary border-opacity-50' : ''} ${className}`}
      {...props}
    >
      <h4 className="font-semibold text-lg mb-1 text-text-dark">{title}</h4>
      <p className="text-text-medium text-sm mb-3">{description}</p>
      
      <div className="flex justify-between items-center">
        <button
          onClick={onToggleActive}
          className={`flex items-center text-xs px-2 py-1 rounded-full ${
            isActive 
              ? 'bg-success/10 text-success' 
              : 'bg-gray-100 text-text-medium'
          }`}
        >
          {isActive ? (
            <>
              <Play size={12} className="mr-1" /> Em execução
            </>
          ) : (
            <>
              <Pause size={12} className="mr-1" /> Pausada
            </>
          )}
        </button>
        
        <button 
          onClick={onView}
          className="text-primary hover:text-primary-dark text-sm font-medium flex items-center transition-colors"
        >
          Ver detalhes <ChevronRight size={16} />
        </button>
      </div>
    </Card>
  );
};

export default SimulationCard;