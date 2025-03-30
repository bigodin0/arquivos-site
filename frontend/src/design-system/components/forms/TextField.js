import React, { useState } from 'react';
import { Eye, EyeOff, X, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Componente TextField premium com design elegante
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} [props.id] - ID do campo
 * @param {string} [props.label] - Rótulo do campo
 * @param {string} [props.placeholder] - Texto de placeholder
 * @param {string} [props.helperText] - Texto de ajuda
 * @param {string} [props.type='text'] - Tipo do campo (text, email, password, etc.)
 * @param {string} [props.value] - Valor do campo
 * @param {Function} [props.onChange] - Função chamada quando o valor muda
 * @param {boolean} [props.required=false] - Se o campo é obrigatório
 * @param {string} [props.error] - Mensagem de erro
 * @param {boolean} [props.success=false] - Estado de sucesso
 * @param {boolean} [props.disabled=false] - Se o campo está desabilitado
 * @param {boolean} [props.fullWidth=true] - Se o campo deve ocupar toda a largura disponível
 * @param {React.ReactNode} [props.startIcon] - Ícone no início do campo
 * @param {React.ReactNode} [props.endIcon] - Ícone no final do campo
 * @param {boolean} [props.clearable=false] - Se deve mostrar botão para limpar
 * @param {string} [props.className] - Classes adicionais
 */
const TextField = ({
  id,
  label,
  placeholder,
  helperText,
  type = 'text',
  value = '',
  onChange,
  required = false,
  error,
  success = false,
  disabled = false,
  fullWidth = true,
  startIcon,
  endIcon,
  clearable = false,
  className = '',
  ...props
}) => {
  // Gera um ID único se não fornecido
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  // Estado para mostrar/esconder senha
  const [showPassword, setShowPassword] = useState(false);
  
  // Determina o tipo de input, considerando o toggle de senha
  const inputType = type === 'password' && showPassword ? 'text' : type;
  
  // Estado de validação
  const hasError = !!error;
  
  // Manipuladores de eventos
  const handleChange = (e) => {
    if (onChange) onChange(e);
  };
  
  const handleClear = () => {
    if (onChange) {
      // Cria um evento sintético simulando uma mudança para string vazia
      const syntheticEvent = { target: { value: '', name: props.name } };
      onChange(syntheticEvent);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Estilos base
  const wrapperClasses = `${fullWidth ? 'w-full' : ''} ${className}`;
  
  // Classes do input baseadas no estado
  const getInputClasses = () => {
    let baseClasses = "w-full bg-white border rounded-md py-2 outline-none transition-all duration-200 placeholder:text-gray-400";
    
    // Espaçamento para ícones
    if (startIcon) baseClasses += " pl-9";
    else baseClasses += " pl-3";
    
    if (endIcon || type === 'password' || (clearable && value)) baseClasses += " pr-9";
    else baseClasses += " pr-3";
    
    // Estados
    if (disabled) {
      baseClasses += " bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300";
    } else if (hasError) {
      baseClasses += " border-error text-text-dark focus:ring-2 focus:ring-error/30 focus:border-error";
    } else if (success) {
      baseClasses += " border-success text-text-dark focus:ring-2 focus:ring-success/30 focus:border-success";
    } else {
      baseClasses += " border-gray-300 text-text-dark focus:ring-2 focus:ring-primary/30 focus:border-primary";
    }
    
    return baseClasses;
  };
  
  return (
    <div className={wrapperClasses}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-medium text-text-dark mb-1"
        >
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      {/* Input container */}
      <div className="relative">
        {/* Start icon */}
        {startIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {startIcon}
          </div>
        )}
        
        {/* Input element */}
        <input
          id={inputId}
          type={inputType}
          value={value}
          onChange={handleChange}
          className={getInputClasses()}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          {...props}
        />
        
        {/* End elements (icon, clear button, password toggle) */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-1">
          {/* Success or error icons */}
          {!disabled && !endIcon && (
            <>
              {hasError && (
                <AlertCircle size={16} className="text-error" />
              )}
              {success && !hasError && (
                <CheckCircle size={16} className="text-success" />
              )}
            </>
          )}
          
          {/* Clear button */}
          {clearable && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear"
            >
              <X size={16} />
            </button>
          )}
          
          {/* Password toggle */}
          {type === 'password' && !disabled && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
          
          {/* Custom end icon */}
          {endIcon && !disabled && (
            <span className="text-gray-400">{endIcon}</span>
          )}
        </div>
      </div>
      
      {/* Helper text or error message */}
      {(helperText || error) && (
        <p className={`mt-1 text-xs ${error ? 'text-error' : 'text-text-light'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default TextField;