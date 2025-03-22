import React from 'react';
import Card from './Card';

/**
 * Componente de card específico para planos na página Plans
 * 
 * @param {Object} props - Propriedades do componente
 * @param {React.ReactNode} props.children - Conteúdo do card
 * @param {string} [props.title] - Título do card
 * @param {React.ReactNode} [props.icon] - Ícone do card
 * @param {boolean} [props.hover=false] - Se deve ter efeito hover
 * @param {boolean} [props.bordered=false] - Se deve ter borda
 * @param {string} [props.className] - Classes adicionais
 */
const PlanCard = ({
  children,
  title,
  icon,
  hover = false,
  bordered = false,
  className = '',
  ...props
}) => {
  // Componente específico para Plans sem informações de fluxo
  return (
    <Card
      title={title}
      icon={icon}
      hover={hover}
      bordered={bordered}
      className={className}
      {...props}
    >
      {children}
    </Card>
  );
};

export default PlanCard;