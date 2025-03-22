import React from 'react';

/**
 * Componente Grid premium para layouts em grade responsiva
 * 
 * @param {Object} props - Propriedades do componente
 * @param {React.ReactNode} props.children - Itens da grade
 * @param {number} [props.cols=1] - Número de colunas no mobile (padrão)
 * @param {number} [props.sm] - Número de colunas em telas pequenas (640px+)
 * @param {number} [props.md] - Número de colunas em telas médias (768px+)
 * @param {number} [props.lg] - Número de colunas em telas grandes (1024px+)
 * @param {number} [props.xl] - Número de colunas em telas extra grandes (1280px+)
 * @param {number|string} [props.gap=4] - Espaçamento entre os itens (1-12 ou px/rem)
 * @param {boolean} [props.autoRows=false] - Se as linhas devem se ajustar automaticamente ao conteúdo
 * @param {string} [props.className] - Classes adicionais
 */
const Grid = ({
  children,
  cols = 1,
  sm,
  md,
  lg,
  xl,
  gap = 4,
  autoRows = false,
  className = '',
  ...props
}) => {
  // Mapear número de colunas para classes Tailwind
  const getColsClass = (breakpoint, value) => {
    if (value === undefined) return '';
    
    const prefix = breakpoint ? `${breakpoint}:` : '';
    return `${prefix}grid-cols-${value}`;
  };
  
  // Mapear gap para classes Tailwind
  const getGapClass = () => {
    if (typeof gap === 'number') {
      return `gap-${gap}`;
    }
    
    // Se for string, assume que já é um valor válido (ex: 'gap-x-4')
    return gap.startsWith('gap') ? gap : `gap-${gap}`;
  };
  
  // Classes do grid
  const gridClasses = [
    'grid',
    getColsClass('', cols),
    sm && getColsClass('sm', sm),
    md && getColsClass('md', md),
    lg && getColsClass('lg', lg),
    xl && getColsClass('xl', xl),
    getGapClass(),
    autoRows ? 'auto-rows-auto' : '',
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <div className={gridClasses} {...props}>
      {children}
    </div>
  );
};

/**
 * Item individual para o Grid
 * 
 * @param {Object} props - Propriedades do componente
 * @param {React.ReactNode} props.children - Conteúdo do item
 * @param {number} [props.span=1] - Quantas colunas o item deve ocupar
 * @param {number} [props.sm] - Quantidade de colunas em telas pequenas
 * @param {number} [props.md] - Quantidade de colunas em telas médias
 * @param {number} [props.lg] - Quantidade de colunas em telas grandes
 * @param {number} [props.xl] - Quantidade de colunas em telas extra grandes
 * @param {string} [props.className] - Classes adicionais
 */
export const GridItem = ({
  children,
  span = 1,
  sm,
  md,
  lg,
  xl,
  className = '',
  ...props
}) => {
  // Mapear span para classes Tailwind
  const getSpanClass = (breakpoint, value) => {
    if (value === undefined) return '';
    
    const prefix = breakpoint ? `${breakpoint}:` : '';
    return `${prefix}col-span-${value}`;
  };
  
  // Classes do item
  const itemClasses = [
    getSpanClass('', span),
    sm && getSpanClass('sm', sm),
    md && getSpanClass('md', md),
    lg && getSpanClass('lg', lg),
    xl && getSpanClass('xl', xl),
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <div className={itemClasses} {...props}>
      {children}
    </div>
  );
};

export default Grid;