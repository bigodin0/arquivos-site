import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Componente Select premium com design elegante
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} [props.id] - ID do campo
 * @param {string} [props.label] - Rótulo do campo
 * @param {string} [props.placeholder] - Texto de placeholder
 * @param {Array} props.options - Array de opções para o select
 * @param {string} [props.value] - Valor selecionado
 * @param {Function} [props.onChange] - Função chamada quando o valor muda
 * @param {boolean} [props.required=false] - Se o campo é obrigatório
 * @param {string} [props.error] - Mensagem de erro
 * @param {string} [props.helperText] - Texto de ajuda
 * @param {boolean} [props.disabled=false] - Se o campo está desabilitado
 * @param {boolean} [props.fullWidth=true] - Se o campo deve ocupar toda a largura disponível
 * @param {string} [props.className] - Classes adicionais
 */
const Select = ({
  id,
  label,
  placeholder,
  options = [],
  value,
  onChange,
  required = false,
  error,
  helperText,
  disabled = false,
  fullWidth = true,
  className = '',
  ...props
}) => {
  // Gera um ID único se não fornecido
  const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;
  
  // Estado de validação
  const hasError = !!error;
  
  // Manipuladores de eventos
  const handleChange = (e) => {
    if (onChange) onChange(e);
  };
  
  // Estilos base
  const wrapperClasses = `${fullWidth ? 'w-full' : ''} ${className}`;
  
  // Classes do select baseadas no estado
  const getSelectClasses = () => {
    let baseClasses = "w-full bg-white border rounded-md py-2 pl-3 pr-10 appearance-none outline-none transition-all duration-200 text-text-dark";
    
    // Estados
    if (disabled) {
      baseClasses += " bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300";
    } else if (hasError) {
      baseClasses += " border-error focus:ring-2 focus:ring-error/30 focus:border-error";
    } else {
      baseClasses += " border-gray-300 focus:ring-2 focus:ring-primary/30 focus:border-primary";
    }
    
    return baseClasses;
  };
  
  return (
    <div className={wrapperClasses}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={selectId} 
          className="block text-sm font-medium text-text-dark mb-1"
        >
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      {/* Select container */}
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={handleChange}
          className={getSelectClasses()}
          disabled={disabled}
          required={required}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Ícone de seta */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown 
            size={18} 
            className={`text-gray-400 ${disabled ? 'opacity-50' : ''}`} 
          />
        </div>
      </div>
      
      {/* Helper text ou mensagem de erro */}
      {(helperText || error) && (
        <p className={`mt-1 text-xs ${error ? 'text-error' : 'text-text-light'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default Select;