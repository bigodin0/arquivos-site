import React from 'react';
import { Check } from 'lucide-react';

/**
 * Componente Checkbox premium com design elegante
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} [props.id] - ID do campo
 * @param {string} [props.label] - Rótulo do checkbox
 * @param {boolean} [props.checked] - Estado de marcação
 * @param {Function} [props.onChange] - Função chamada quando o estado muda
 * @param {boolean} [props.disabled=false] - Se o checkbox está desabilitado
 * @param {string} [props.error] - Mensagem de erro
 * @param {string} [props.helperText] - Texto de ajuda
 * @param {string} [props.className] - Classes adicionais
 */
const Checkbox = ({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  error,
  helperText,
  className = '',
  ...props
}) => {
  // Gera um ID único se não fornecido
  const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;
  
  // Estado de validação
  const hasError = !!error;
  
  // Manipuladores de eventos
  const handleChange = (e) => {
    if (onChange) onChange(e);
  };
  
  // Estilos base
  const wrapperClasses = `flex items-start ${className}`;
  
  // Classes do checkbox baseadas no estado
  const getCheckboxClasses = () => {
    let baseClasses = "h-5 w-5 border rounded transition-colors duration-150 flex items-center justify-center";
    
    if (disabled) {
      baseClasses += checked 
        ? " bg-primary-200 border-primary-200 cursor-not-allowed" 
        : " bg-gray-100 border-gray-300 cursor-not-allowed";
    } else if (checked) {
      baseClasses += " bg-primary border-primary text-white";
    } else if (hasError) {
      baseClasses += " border-error";
    } else {
      baseClasses += " border-gray-300 hover:border-primary";
    }
    
    return baseClasses;
  };
  
  return (
    <div className={wrapperClasses}>
      <div className="relative flex items-start">
        {/* Checkbox real (escondido) */}
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="absolute h-0 w-0 opacity-0"
          {...props}
        />
        
        {/* Checkbox visual customizado */}
        <div className="flex items-center h-5">
          <label 
            htmlFor={checkboxId}
            className={`${getCheckboxClasses()}`}
            role="checkbox"
            aria-checked={checked}
            tabIndex={disabled ? -1 : 0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!disabled && onChange) {
                  onChange({ target: { checked: !checked } });
                }
              }
            }}
          >
            {checked && <Check size={14} strokeWidth={3} />}
          </label>
        </div>
        
        {/* Label e textos de suporte */}
        <div className="ml-2 text-sm">
          {label && (
            <label htmlFor={checkboxId} className={`font-medium ${disabled ? 'text-gray-400' : 'text-text-dark'}`}>
              {label}
            </label>
          )}
          
          {(helperText || error) && (
            <p className={`mt-1 text-xs ${error ? 'text-error' : 'text-text-light'}`}>
              {error || helperText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkbox;