import React, { useState } from 'react';
import { Search, Bell, ChevronDown, ExternalLink, Settings, LogOut, User } from 'lucide-react';
import SecureStorageService from '../../services/secureStorage';

/**
 * Navbar premium com design elegante usando a paleta teal & cinza
 */
const Navbar = ({ 
  title = "Dashboard",
  searchEnabled = true,
  notificationsEnabled = true,
  helpEnabled = true,
  onSearch = () => {},
  userProfile = null,
  breadcrumbs = [],
  onLogout = () => {}
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  const toggleSearch = () => setSearchOpen(!searchOpen);
  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    setProfileOpen(false);
  };
  const toggleProfile = () => {
    setProfileOpen(!profileOpen);
    setNotificationsOpen(false);
  };
  
  // Exemplo de notificações
  const notifications = [
    { id: 1, title: "Novo template disponível", time: "Agora", read: false },
    { id: 2, title: "Seu fluxo foi visualizado 10 vezes", time: "2h atrás", read: false },
    { id: 3, title: "Atualização de recursos", time: "Ontem", read: true }
  ];
  
  // Iniciais do usuário para avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  // Função segura para lidar com logout
  const handleLogout = () => {
    // Limpar token seguramente ao fazer logout
    SecureStorageService.clearToken();
    // Chamar função de logout fornecida por props
    onLogout();
  };
  
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Barra principal */}
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Lado esquerdo: Título e breadcrumbs */}
        <div>
          <h1 className="text-xl font-bold text-text-dark">{title}</h1>
          {breadcrumbs.length > 0 && (
            <div className="flex items-center text-sm text-text-light mt-1">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                  {crumb.link ? (
                    <a href={crumb.link} className="hover:text-primary hover:underline transition-colors">
                      {crumb.label}
                    </a>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
        
        {/* Lado direito: Ações rápidas */}
        <div className="flex items-center space-x-1 md:space-x-2">
          {/* Busca */}
          {searchEnabled && (
            <div className="relative">
              <button 
                onClick={toggleSearch}
                className="p-2 text-text-medium hover:text-primary rounded-full hover:bg-primary-50 transition-colors"
                title="Buscar"
              >
                <Search size={20} />
              </button>
              
              {searchOpen && (
                <div className="absolute right-0 top-12 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-20 p-3 animate-fade-in">
                  <div className="flex items-center bg-bg-dark rounded-md p-2">
                    <Search size={16} className="text-text-light mr-2" />
                    <input 
                      type="text" 
                      className="bg-transparent border-none outline-none text-sm flex-1 placeholder-text-light"
                      placeholder="Buscar..."
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Notificações */}
          {notificationsEnabled && (
            <div className="relative">
              <button 
                onClick={toggleNotifications}
                className="p-2 text-text-medium hover:text-primary rounded-full hover:bg-primary-50 transition-colors"
                title="Notificações"
              >
                <div className="relative">
                  <Bell size={20} />
                  <span className="absolute -top-1 -right-1 bg-error w-2 h-2 rounded-full"></span>
                </div>
              </button>
              
              {notificationsOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20 animate-fade-in">
                  <div className="p-3 border-b border-gray-200">
                    <h3 className="font-semibold text-text-dark">Notificações</h3>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className={`p-3 border-b border-gray-100 hover:bg-bg-light transition-colors ${
                            !notification.read ? 'bg-primary-50' : ''
                          }`}
                        >
                          <div className="flex items-start">
                            {!notification.read && (
                              <div className="mt-1.5 mr-2 w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                            )}
                            <div className={notification.read ? 'ml-4' : ''}>
                              <p className="text-sm text-text-dark">{notification.title}</p>
                              <p className="text-xs text-text-light mt-1">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-text-light text-sm">
                        Nenhuma notificação
                      </div>
                    )}
                  </div>
                  
                  <div className="p-2 border-t border-gray-200 text-center">
                    <a href="#" className="text-xs text-primary hover:underline">Ver todas</a>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Ajuda */}
          {helpEnabled && (
            <a 
              href="#" 
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center p-2 text-sm text-text-medium hover:text-primary rounded-md hover:bg-primary-50 transition-colors"
            >
              <span className="mr-1">Ajuda</span>
              <ExternalLink size={14} />
            </a>
          )}
          
          {/* Perfil do usuário */}
          {userProfile && (
            <div className="relative">
              <button 
                onClick={toggleProfile}
                className="flex items-center p-2 hover:bg-bg-light rounded-md transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold mr-1">
                  {getInitials(userProfile.name)}
                </div>
                <ChevronDown size={16} className="text-text-light ml-1 hidden md:block" />
              </button>
              
              {profileOpen && (
                <div className="absolute right-0 top-12 w-60 bg-white rounded-lg shadow-lg border border-gray-200 z-20 animate-fade-in">
                  <div className="p-3 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold mr-3">
                        {getInitials(userProfile.name)}
                      </div>
                      <div>
                        <h3 className="font-medium text-text-dark">{userProfile.name}</h3>
                        <p className="text-xs text-text-light">{userProfile.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-1">
                    <a href="/profile" className="flex items-center px-4 py-2 text-sm text-text-medium hover:bg-bg-light transition-colors">
                      <User size={16} className="mr-3 text-text-light" />
                      Perfil
                    </a>
                    <a href="/settings" className="flex items-center px-4 py-2 text-sm text-text-medium hover:bg-bg-light transition-colors">
                      <Settings size={16} className="mr-3 text-text-light" />
                      Configurações
                    </a>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-text-medium hover:bg-bg-light transition-colors"
                    >
                      <LogOut size={16} className="mr-3 text-text-light" />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;