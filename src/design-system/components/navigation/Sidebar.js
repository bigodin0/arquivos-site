import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  LayoutGrid, 
  BarChart2, 
  CreditCard, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  User,
  Menu,
  X
} from 'lucide-react';
import SecureStorageService from '../../services/secureStorage';

/**
 * Sidebar premium com design elegante usando a paleta teal & cinza
 */
const Sidebar = ({ 
  user = null, 
  planDetails = null,
  onLogout = () => {}
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  const menuItems = [
    { 
      id: 'dashboard', 
      path: '/dashboard',
      label: 'Dashboard', 
      icon: <MessageSquare size={20} />,
      exact: true
    },
    { 
      id: 'templates', 
      path: '/templates', 
      label: 'Templates', 
      icon: <LayoutGrid size={20} /> 
    },
    { 
      id: 'analytics', 
      path: '/analytics', 
      label: 'Analytics', 
      icon: <BarChart2 size={20} /> 
    },
    { 
      id: 'plans', 
      path: '/plans', 
      label: 'Planos', 
      icon: <CreditCard size={20} /> 
    },
    { 
      id: 'settings', 
      path: '/settings', 
      label: 'Configurações', 
      icon: <Settings size={20} />,
      divider: true
    }
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  
  const toggleMobile = () => {
    setMobileOpen(!mobileOpen);
  };
  
  // Função segura para lidar com logout
  const handleLogout = () => {
    // Limpar token seguramente ao fazer logout
    SecureStorageService.clearToken();
    // Chamar função de logout fornecida por props
    onLogout();
  };
  
  // Mobile menu overlay
  const mobileMenu = (
    <div 
      className={`md:hidden fixed inset-0 bg-text-dark bg-opacity-50 z-40 transition-opacity duration-300 ${
        mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setMobileOpen(false)}
    >
      <div 
        className="absolute top-0 left-0 bottom-0 w-64 bg-white shadow-lg transition-transform duration-300 transform"
        style={{ transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)' }}
        onClick={e => e.stopPropagation()}
      >
        {renderSidebarContent(true)}
      </div>
    </div>
  );
  
  function renderSidebarContent(isMobile = false) {
    return (
      <div className="h-full flex flex-col">
        {/* Header with logo and collapse button */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-gradient-premium flex items-center justify-center text-white font-bold mr-2">
              S
            </div>
            {(!collapsed || isMobile) && (
              <h1 className="text-lg font-bold text-text-dark">SimulaChat</h1>
            )}
          </div>
          
          {!isMobile && (
            <button 
              onClick={toggleSidebar}
              className="p-1 rounded-md text-grey hover:bg-bg-dark transition-colors"
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}
          
          {isMobile && (
            <button 
              onClick={toggleMobile}
              className="p-1 rounded-md text-grey hover:bg-bg-dark transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        {/* User profile */}
        {user && (!collapsed || isMobile) && (
          <div className="p-4 border-b">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">
                {getInitials(user.name)}
              </div>
              <div className="ml-3">
                <p className="font-medium text-text-dark">{user.name}</p>
                <p className="text-xs text-text-light">{user.email}</p>
              </div>
            </div>
            
            {planDetails && (
              <div className="mt-3 bg-bg-dark rounded-md p-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-text-medium">Plano atual</span>
                  <Link to="/plans" className="text-xs text-primary-500 hover:text-primary-600">Upgrade</Link>
                </div>
                <p className="font-medium text-sm text-text-dark">{planDetails.name}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Collapsed user icon */}
        {user && collapsed && !isMobile && (
          <div className="py-4 flex justify-center border-b">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs">
              {getInitials(user.name)}
            </div>
          </div>
        )}
        
        {/* Menu items */}
        <nav className="flex-1 py-4">
          {menuItems.map((item) => (
            <React.Fragment key={item.id}>
              <Link
                to={item.path}
                className={`flex items-center px-4 py-2 mx-2 rounded-md transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-primary text-white' 
                    : 'text-text-medium hover:bg-bg-dark'
                } ${collapsed && !isMobile ? 'justify-center' : ''}`}
              >
                <span className={isActive(item.path) ? 'text-white' : 'text-grey-dark'}>
                  {item.icon}
                </span>
                
                {(!collapsed || isMobile) && (
                  <span className="ml-3">{item.label}</span>
                )}
              </Link>
              
              {item.divider && (!collapsed || isMobile) && (
                <div className="mx-4 my-4 border-t border-gray-200"></div>
              )}
            </React.Fragment>
          ))}
        </nav>
        
        {/* Logout button */}
        <div className="p-2 border-t">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center p-2 rounded-md text-text-medium hover:bg-bg-dark transition-colors ${
              collapsed && !isMobile ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} />
            {(!collapsed || isMobile) && <span className="ml-3">Sair</span>}
          </button>
        </div>
      </div>
    );
  }
  
  // Mobile menu trigger button
  const mobileTrigger = (
    <button
      className="md:hidden fixed top-4 left-4 z-30 p-2 rounded-md bg-white shadow-md text-primary"
      onClick={toggleMobile}
    >
      <Menu size={24} />
    </button>
  );
  
  return (
    <>
      {/* Desktop sidebar */}
      <div className={`hidden md:block h-screen ${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 shadow-md transition-all duration-300`}>
        {renderSidebarContent()}
      </div>
      
      {/* Mobile elements */}
      {mobileTrigger}
      {mobileMenu}
    </>
  );
};

export default Sidebar;