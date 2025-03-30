import React, { createContext, useContext } from 'react';

const DesignContext = createContext();

export const DesignProvider = ({ children }) => {
  // Sempre use o novo design, sem alternar
  const useNewDesign = true;

  return (
    <DesignContext.Provider value={{ useNewDesign }}>
      {children}
    </DesignContext.Provider>
  );
};

export const useDesign = () => {
  const context = useContext(DesignContext);
  if (context === undefined) {
    throw new Error('useDesign deve ser usado dentro de um DesignProvider');
  }
  return context;
};

export default DesignContext;