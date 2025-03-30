import React, { useState, useEffect, useRef } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  ArrowPathIcon
} from '@heroicons/react/24/solid';

const ChatPreview = ({ 
  messages, 
  contactName, 
  platform, 
  avatarUrl, 
  disableEvents = false,
  autoStart = false,  // Propriedade para iniciar automaticamente
  hideControls = false // Nova propriedade para esconder os controles de PLAY/PAUSE
}) => {
  // Lista de plataformas válidas
  const validPlatforms = ['whatsapp', 'messenger', 'instagram', 'telegram'];
  
  // Usar a plataforma fornecida apenas se for válida, caso contrário, usar 'whatsapp' como padrão
  const actualPlatform = validPlatforms.includes(platform) ? platform : 'whatsapp';

  const [visibleMessages, setVisibleMessages] = useState([]);
  const [messageQueue, setMessageQueue] = useState([]);
  const [selectedButton, setSelectedButton] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const chatEndRef = useRef(null);
  const [processingJump, setProcessingJump] = useState(false);

  // Inicializar a fila de mensagens quando os messages mudam
  useEffect(() => {
    // Se disableEvents estiver ativo, mostrar todas as mensagens imediatamente
    if (disableEvents && messages.length > 0) {
      setVisibleMessages([...messages]);
      setMessageQueue([]);
      setIsPaused(true);
      return;
    }
    
    setMessageQueue([...messages]);
    setVisibleMessages([]);
    setSelectedButton(null);
    setProcessingJump(false);
    
    // Iniciar automaticamente se a propriedade autoStart estiver ativa
    setIsPaused(!autoStart);
  }, [messages, disableEvents, autoStart]);

  // Processar a fila de mensagens com atrasos
  useEffect(() => {
    if (messageQueue.length === 0 || processingJump || isPaused || disableEvents) return;
    
    const nextMessage = messageQueue[0];
    // Ajustar o delay com base na velocidade de reprodução
    const delay = (nextMessage.delay * 1000 || 500) / playbackSpeed;
    
    const timer = setTimeout(() => {
      setVisibleMessages(prev => [...prev, nextMessage]);
      setMessageQueue(prev => prev.slice(1));
    }, delay);
    
    return () => clearTimeout(timer);
  }, [messageQueue, processingJump, isPaused, playbackSpeed, disableEvents]);

  // Rolar para o fim do chat quando novas mensagens aparecerem
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [visibleMessages]);

  // Função para obter as classes CSS da mensagem baseadas no remetente
  const getMessageClasses = (sender) => {
    if (sender === 'business') {
      return 'bg-gray-200 rounded-tr-lg rounded-tl-lg rounded-bl-lg';
    } else {
      return 'bg-simulachat-whatsapp text-white rounded-tr-lg rounded-tl-lg rounded-br-lg ml-auto';
    }
  };

  // Função para reiniciar a prévia
  const handleRestart = () => {
    setMessageQueue([...messages]);
    setVisibleMessages([]);
    setSelectedButton(null);
    setProcessingJump(false);
    setIsPaused(false);
  };

  // Função para alternar pausa/reprodução
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Função para alterar a velocidade de reprodução
  const changeSpeed = () => {
    // Ciclo entre 0.5x, 1x e 2x
    setPlaybackSpeed(current => {
      if (current === 0.5) return 1;
      if (current === 1) return 2;
      return 0.5;
    });
  };

  // Função para simular clique em botão
  const handleButtonClick = (button, messageIndex) => {
    if (disableEvents) return; // Não processar cliques se disableEvents estiver ativo
    
    setSelectedButton({ messageIndex, buttonText: button.text });
    
    // Se o botão tem um destino definido
    if (button.jumpTo) {
      // Pausa o processamento da fila enquanto preparamos o salto
      setProcessingJump(true);
      
      // Espera um momento para mostrar o botão selecionado
      setTimeout(() => {
        // Encontra a mensagem alvo pelo ID
        const targetIndex = messages.findIndex(m => m.id === button.jumpTo);
        
        if (targetIndex !== -1) {
          // Reconstruir a fila a partir do ponto de destino
          const newQueue = messages.slice(targetIndex);
          setMessageQueue(newQueue);
          
          // Reinicia o processamento
          setProcessingJump(false);
        } else {
          // Se não encontrar o destino, continua normalmente
          setProcessingJump(false);
        }
      }, 800); // Espera breve para efeito visual
    } else {
      // Se o botão não tiver destino, apenas mostra a resposta do cliente
      if (button.responseMessage) {
        setTimeout(() => {
          // Adiciona a mensagem de resposta do cliente
          const customerResponse = {
            id: Date.now(),
            type: 'text',
            sender: 'customer',
            content: button.responseMessage,
            delay: 0
          };
          
          setVisibleMessages(prev => [...prev, customerResponse]);
        }, 500);
      }
    }
  };

  const renderMessageContent = (message, index) => {
    if (message.type === 'text') {
      return <p className="whitespace-pre-wrap">{message.content}</p>;
    } else if (message.type === 'buttons') {
      return (
        <div>
          <p className="whitespace-pre-wrap mb-3">{message.content}</p>
          <div className="space-y-2">
            {message.buttons && message.buttons.map((button) => (
              <button
                key={button.id}
                className={`w-full py-2 px-3 rounded-lg text-center ${
                  selectedButton && 
                  selectedButton.messageIndex === index && 
                  selectedButton.buttonText === button.text
                    ? 'bg-primary text-white'
                    : 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50'
                }`}
                onClick={() => handleButtonClick(button, index)}
                disabled={disableEvents} // Desabilitar botões se disableEvents estiver ativo
              >
                {button.text}
              </button>
            ))}
          </div>
        </div>
      );
    } else if (message.type === 'image') {
      return (
        <img 
          src={message.content} 
          alt="Imagem" 
          className="max-w-full rounded"
          onError={(e) => {e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150?text=Erro+na+imagem'}}
        />
      );
    } else {
      return (
        <div className="flex items-center bg-gray-100 p-2 rounded">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Arquivo</span>
        </div>
      );
    }
  };

  const getAvatarElement = () => {
    if (avatarUrl) {
      return (
        <div className="bg-gray-200 rounded-full h-8 w-8 md:h-10 md:w-10 overflow-hidden">
          <img 
            src={avatarUrl} 
            alt={contactName} 
            className="h-full w-full object-cover"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><text x="50%" y="50%" font-size="20" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" fill="%23666">' + contactName.charAt(0).toUpperCase() + '</text></svg>';
            }}
          />
        </div>
      );
    } else {
      return (
        <div className="bg-gray-200 rounded-full h-8 w-8 md:h-10 md:w-10 flex items-center justify-center">
          <span className="text-gray-600 font-bold">
            {contactName.charAt(0).toUpperCase()}
          </span>
        </div>
      );
    }
  };

  // Controles de reprodução
  const renderPlaybackControls = () => {
    // Não mostrar controles se disableEvents estiver ativo ou hideControls for true
    if (disableEvents || hideControls) return null;
    
    return (
      <div className="absolute bottom-4 right-4 flex items-center space-x-2 z-10">
        <button
          onClick={handleRestart}
          className="bg-gray-700 bg-opacity-70 hover:bg-opacity-90 text-white p-2 rounded-full"
          title="Reiniciar"
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
        
        <button
          onClick={togglePause}
          className="bg-gray-700 bg-opacity-70 hover:bg-opacity-90 text-white p-2 rounded-full"
          title={isPaused ? "Reproduzir" : "Pausar"}
        >
          {isPaused ? (
            <PlayIcon className="h-5 w-5" />
          ) : (
            <PauseIcon className="h-5 w-5" />
          )}
        </button>
        
        <button
          onClick={changeSpeed}
          className="bg-gray-700 bg-opacity-70 hover:bg-opacity-90 text-white px-2 py-1 rounded-full text-xs font-medium"
          title="Alterar velocidade"
        >
          {playbackSpeed}x
        </button>
      </div>
    );
  };

  const getWhatsAppInterface = () => (
    <>
      {/* Cabeçalho do WhatsApp */}
      <div className="bg-emerald-700 text-white p-2 md:p-3 flex items-center">
        <div className="mr-2 md:mr-3">
          {getAvatarElement()}
        </div>
        <div>
          <h3 className="font-medium text-sm md:text-base">{contactName}</h3>
          <p className="text-xs opacity-80">online</p>
        </div>
      </div>
      
      {/* Corpo do chat WhatsApp */}
      <div className="flex-1 p-3 md:p-4 overflow-y-auto bg-[#e5ddd5] bg-opacity-90 relative" style={{ backgroundImage: "url('https://web.whatsapp.com/img/bg-chat-tile-light_686b98c9fdffef3f63127759e2057750.png')" }}>
        <div className="space-y-2 md:space-y-3">
          {visibleMessages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[75%] md:max-w-xs p-2 md:p-3 relative rounded-lg ${
                  message.sender === 'business' 
                    ? 'bg-white rounded-tr-lg rounded-tl-lg rounded-bl-lg' 
                    : 'bg-[#dcf8c6] rounded-tr-lg rounded-tl-lg rounded-br-lg ml-auto'
                }`}
              >
                {renderMessageContent(message, index)}
                <div className="text-xs opacity-70 text-right mt-1">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {message.sender === 'business' ? null : (
                    <span className="ml-1 text-emerald-600">✓✓</span>
                  )}
                </div>
                
                {/* Triângulo para mensagem da empresa */}
                {message.sender === 'business' && message.type !== 'buttons' && (
                  <div className="absolute left-0 top-0 -translate-x-2 w-4 h-4 overflow-hidden">
                    <div className="absolute transform rotate-45 bg-white w-2 h-2 translate-x-1 translate-y-1"></div>
                  </div>
                )}
                
                {/* Triângulo para mensagem do cliente */}
                {message.sender === 'customer' && message.type !== 'buttons' && (
                  <div className="absolute right-0 top-0 translate-x-2 w-4 h-4 overflow-hidden">
                    <div className="absolute transform rotate-45 bg-[#dcf8c6] w-2 h-2 translate-x-1 translate-y-1"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        
        {renderPlaybackControls()}
      </div>
      
      {/* Campo de entrada do WhatsApp */}
      <div className="p-2 md:p-3 bg-[#f0f0f0] flex items-center">
        <div className="bg-white rounded-full flex-1 flex items-center p-1 pl-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <input
            type="text"
            className="flex-1 p-1 border-none outline-none text-sm"
            placeholder="Mensagem (preview apenas)"
            disabled
          />
          <div className="p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-4v4m0-11v-4" />
            </svg>
          </div>
        </div>
        <button className="ml-2 bg-emerald-600 rounded-full w-10 h-10 flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-4v4m0-11v-4" />
          </svg>
        </button>
      </div>
    </>
  );

  const getMessengerInterface = () => (
    <>
      {/* Cabeçalho do Messenger */}
      <div className="bg-[#0084ff] text-white p-2 md:p-3 flex items-center">
        <div className="mr-2 md:mr-3">
          {avatarUrl ? (
            <div className="bg-white rounded-full h-8 w-8 md:h-10 md:w-10 p-0.5 overflow-hidden">
              <img 
                src={avatarUrl} 
                alt={contactName} 
                className="h-full w-full object-cover rounded-full"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="%23f0f0f0"/><text x="50%" y="50%" font-size="20" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" fill="%23666">' + contactName.charAt(0).toUpperCase() + '</text></svg>';
                }}
              />
            </div>
          ) : (
            <div className="bg-gray-200 rounded-full h-8 w-8 md:h-10 md:w-10 flex items-center justify-center">
              <span className="text-gray-600 font-bold">
                {contactName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-sm md:text-base">{contactName}</h3>
        </div>
        <div className="flex space-x-2 md:space-x-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      
      {/* Corpo do chat Messenger */}
      <div className="flex-1 p-3 md:p-4 overflow-y-auto bg-[#f0f0f0] relative">
        <div className="space-y-2 md:space-y-3">
          {visibleMessages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[75%] md:max-w-xs p-2 md:p-3 rounded-2xl ${
                  message.sender === 'business' 
                    ? message.type === 'buttons' 
                      ? 'bg-white shadow-sm' 
                      : 'bg-white text-black' 
                    : 'bg-[#0084ff] text-white'
                }`}
              >
                {renderMessageContent(message, index)}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        
        {renderPlaybackControls()}
      </div>
      
      {/* Campo de entrada do Messenger */}
      <div className="p-2 md:p-3 bg-white border-t border-gray-200 flex items-center">
        <button className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-blue-500 mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <input
          type="text"
          className="flex-1 p-2 text-sm border-none outline-none"
          placeholder="Mensagem (preview apenas)"
          disabled
        />
        <button className="ml-2 text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </>
  );

  const getInstagramInterface = () => (
    <>
      {/* Cabeçalho do Instagram */}
      <div className="bg-white border-b border-gray-200 text-black p-2 md:p-3 flex items-center">
        <div className="mr-2 md:mr-3">
          {avatarUrl ? (
            <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full p-0.5">
              <div className="bg-white rounded-full p-0.5">
                <img 
                  src={avatarUrl} 
                  alt={contactName} 
                  className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="%23f0f0f0"/><text x="50%" y="50%" font-size="20" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" fill="%23666">' + contactName.charAt(0).toUpperCase() + '</text></svg>';
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full p-0.5">
              <div className="bg-white rounded-full p-0.5">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-600 font-bold">
                    {contactName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm md:text-base">{contactName}</h3>
          <p className="text-xs text-gray-500">Ativo agora</p>
        </div>
        <div className="flex space-x-3 md:space-x-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      
      {/* Corpo do chat Instagram */}
      <div className="flex-1 p-3 md:p-4 overflow-y-auto bg-white relative">
        <div className="space-y-2 md:space-y-3">
          {visibleMessages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[75%] md:max-w-xs p-2 md:p-3 rounded-3xl ${
                  message.sender === 'business' 
                    ? message.type === 'buttons' 
                      ? 'bg-gray-200' 
                      : 'bg-gray-200 text-black' 
                    : 'bg-gray-100 text-black'
                }`}
              >
                {renderMessageContent(message, index)}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        
        {renderPlaybackControls()}
      </div>
      
      {/* Campo de entrada do Instagram */}
      <div className="p-2 md:p-3 bg-white border-t border-gray-200 flex items-center">
        <input
          type="text"
          className="flex-1 py-2 px-4 text-sm border border-gray-300 rounded-full outline-none focus:border-gray-400"
          placeholder="Mensagem... (preview apenas)"
          disabled
        />
        <button className="ml-2 text-blue-500 font-semibold text-sm">
          Enviar
        </button>
      </div>
    </>
  );

  // Implementação para Telegram (básica, caso seja adicionada no futuro)
  const getTelegramInterface = () => (
    <>
      {/* Cabeçalho do Telegram */}
      <div className="bg-[#5682a3] text-white p-2 md:p-3 flex items-center">
        <div className="mr-2 md:mr-3">
          {getAvatarElement()}
        </div>
        <div>
          <h3 className="font-medium text-sm md:text-base">{contactName}</h3>
          <p className="text-xs opacity-80">última vez hoje</p>
        </div>
      </div>
      
      {/* Corpo do chat Telegram */}
      <div className="flex-1 p-3 md:p-4 overflow-y-auto bg-[#e7ebf0] relative">
        <div className="space-y-2 md:space-y-3">
          {visibleMessages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[75%] md:max-w-xs p-2 md:p-3 rounded-lg ${
                  message.sender === 'business' 
                    ? 'bg-white text-black' 
                    : 'bg-[#effdde] text-black'
                }`}
              >
                {renderMessageContent(message, index)}
                <div className="text-xs opacity-70 text-right mt-1">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {message.sender === 'business' ? null : (
                    <span className="ml-1 text-blue-500">✓</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        
        {renderPlaybackControls()}
      </div>
      
      {/* Campo de entrada do Telegram */}
      <div className="p-2 md:p-3 bg-white border-t border-gray-200 flex items-center">
        <button className="w-8 h-8 md:w-10 md:h-10 text-gray-500 mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input
          type="text"
          className="flex-1 p-2 text-sm border rounded-full outline-none"
          placeholder="Mensagem (preview apenas)"
          disabled
        />
        <button className="ml-2 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-blue-500 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </>
  );

  // Renderizar a interface com base na plataforma selecionada
  const renderChatInterface = () => {
    switch (actualPlatform) {
      case 'messenger':
        return getMessengerInterface();
      case 'instagram':
        return getInstagramInterface();
      case 'telegram':
        return getTelegramInterface();
      case 'whatsapp':
      default:
        return getWhatsAppInterface();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200 max-w-sm mx-auto">
      {renderChatInterface()}
    </div>
  );
};

export default ChatPreview;