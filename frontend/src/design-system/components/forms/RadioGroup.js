import React from 'react';

/**
 * Componente RadioGroup premium com design elegante
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} [props.id] - ID base do grupo de radio buttons
 * @param {string} [props.name] - Nome do grupo de radio buttons
 * @param {string} [props.label] - Rótulo do grupo
 * @param {Array} props.options - Array de opções para os radio buttons
 * @param {string|number} [props.value] - Valor selecionado
 * @param {Function} [props.onChange] - Função chamada quando o valor muda
 * @param {string} [props.orientation='vertical'] - Orientação dos radio buttons (vertical/horizontal)
 * @param {boolean} [props.disabled=false] - Se o grupo está desabilitado
 * @param {string} [props.error] - Mensagem de erro
 * @param {string} [props.helperText] - Texto de ajuda
 * @param {string} [props.className] - Classes adicionais
 */
const RadioGroup = ({
  id,
  name,
  label,
  options = [],
  value,
  onChange,
  orientation = 'vertical',
  disabled = false,
  error,
  helperText,
  className = '',
  ...props
}) => {
  // Gera um ID base único se não fornecido
  const groupId = id || `radio-group-${Math.random().toString(36).substring(2, 9)}`;
  const groupName = name || groupId;
  
  // Estado de validação
  const hasError = !!error;
  
  // Manipuladores de eventos
  const handleChange = (e) => {
    if (onChange) onChange(e);
  };
  
  // Classes de orientação
  const orientationClasses = orientation === 'horizontal' 
    ? 'flex flex-row flex-wrap gap-4' 
    : 'flex flex-col space-y-2';
  
  return (
    <div className={`${className}`}>
      {/* Label do grupo */}
      {label && (
        <label className="block text-sm font-medium text-text-dark mb-2">
          {label}
        </label>
      )}
      
      {/* Grupo de radio buttons */}
      <div className={orientationClasses}>
        {options.map((option, index) => {
          const optionId = `${groupId}-${index}`;
          const isChecked = value === option.value;
          
          return (
            <div key={optionId} className="flex items-center">
              <div className="relative flex items-start">
                {/* Radio button real (escondido) */}
                <input
                  type="radio"
                  id={optionId}
                  name={groupName}
                  value={option.value}
                  checked={isChecked}
                  onChange={handleChange}
                  disabled={disabled || option.disabled}
                  className="absolute h-0 w-0 opacity-0"
                  {...props}
                />
                
                {/* Radio button visual customizado */}
                <div className="flex items-center h-5">
                  <label 
                    htmlFor={optionId}
                    className={`h-4 w-4 rounded-full border transition-colors duration-150 flex items-center justify-center ${
                      disabled || option.disabled
                        ? isChecked 
                          ? 'bg-gray-200 border-gray-300' 
                          : 'bg-gray-100 border-gray-300'
                        : isChecked
                          ? 'border-primary border-2'
                          : hasError
                            ? 'border-error'
                            : 'border-gray-300 hover:border-gray-400'
                    }`}
                    role="radio"
                    aria-checked={isChecked}
                    tabIndex={disabled || option.disabled ? -1 : 0}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!disabled && !option.disabled && onChange) {
                          onChange({ target: { value: option.value } });
                        }
                      }
                    }}
                  >
                    {isChecked && (
                      <div className={`h-2 w-2 rounded-full ${disabled || option.disabled ? 'bg-gray-400' : 'bg-primary'}`}></div>
                    )}
                  </label>
                </div>
                
                {/* Label do radio button */}
                <div className="ml-2 text-sm">
                  <label 
                    htmlFor={optionId} 
                    className={`${
                      disabled || option.disabled ? 'text-gray-400' : 'text-text-dark'
                    }`}
                  >
                    {option.label}
                  </label>
                  
                  {option.description && (
                    <p className="text-xs text-text-light mt-0.5">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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

export default RadioGroup;