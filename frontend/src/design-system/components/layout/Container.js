import React from 'react';

/**
 * Componente Container premium para layout central com largura máxima
 * 
 * @param {Object} props - Propriedades do componente
 * @param {React.ReactNode} props.children - Conteúdo do container
 * @param {string} [props.size='md'] - Tamanho do container (sm, md, lg, xl, full)
 * @param {boolean} [props.centered=true] - Se o container deve ser centralizado horizontalmente
 * @param {boolean} [props.withPadding=true] - Se o container deve ter padding horizontal
 * @param {string} [props.className] - Classes adicionais
 */
const Container = ({
  children,
  size = 'md',
  centered = true,
  withPadding = true,
  className = '',
  ...props
}) => {
  // Configuração de tamanhos do container
  const sizes = {
    sm: 'max-w-screen-sm', // 640px
    md: 'max-w-screen-md', // 768px
    lg: 'max-w-screen-lg', // 1024px
    xl: 'max-w-screen-xl', // 1280px
    '2xl': 'max-w-screen-2xl', // 1536px
    full: 'max-w-full',
  };
  
  // Classes base do container
  const containerClasses = [
    sizes[size] || sizes.md,
    centered ? 'mx-auto' : '',
    withPadding ? 'px-4 sm:px-6 md:px-8' : '',
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <div className={containerClasses} {...props}>
      {children}
    </div>
  );
};

export default Container;