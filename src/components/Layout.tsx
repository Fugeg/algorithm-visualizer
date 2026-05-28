import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { FiHome, FiCpu, FiCode, FiMenu, FiX, FiMessageSquare } from 'react-icons/fi';
import { UserMenu } from './Auth/UserMenu';
import { AuthModal } from './Auth/AuthModal';
import UserService from '../services/userService';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginTrigger, setLoginTrigger] = useState(0); // 用于触发重新检查登录状态
  const location = useLocation();

  useEffect(() => {
    const userService = UserService.getInstance();
    setIsLoggedIn(userService.isAuthenticated());
  }, [loginTrigger]); // 当 loginTrigger 变化时重新检查

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setLoginTrigger(prev => prev + 1); // 触发重新渲染
  };

  // 处理登出后的刷新（可选：使用更优雅的方式代替 window.location.reload）
  /*
  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginTrigger(prev => prev + 1);
  };
  */

  const navItems = [
    { path: '/', icon: <FiHome />, text: '首页' },
    { path: '/data-structures', icon: <FiCpu />, text: '数据结构' },
    { path: '/algorithms', icon: <FiCode />, text: '算法' },
    { path: '/ai-chat', icon: <FiMessageSquare />, text: 'AI助手' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <aside
        className={`
          bg-indigo-700 text-white
          ${sidebarOpen ? 'w-64' : 'w-16'}
          space-y-6 py-7 px-2 absolute inset-y-0 left-0
          transform transition-all duration-300 ease-in-out z-20
          md:relative overflow-hidden
          ${mobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        `}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center">
            <img
              src="/logo.svg"
              alt="Algorithm Visualizer"
              className={`
                w-8 h-8 transition-all duration-300
                ${sidebarOpen || mobileMenuOpen ? 'mr-3' : ''}
              `}
            />
            <span className={`
              font-semibold text-lg
              ${sidebarOpen || mobileMenuOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
              transition-all duration-300 whitespace-nowrap overflow-hidden
            `}>
              算法可视化
            </span>
          </Link>
          <button
            className="md:hidden p-1 hover:bg-indigo-600 rounded"
            onClick={() => setMobileMenuOpen(false)}
          >
            <FiX size={20} />
          </button>
        </div>

        <nav className="space-y-3">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center px-4 py-2.5 rounded 
                transition duration-200
                ${location.pathname === item.path ? 'bg-indigo-800' : 'hover:bg-indigo-600'}
              `}
            >
              <div className="min-w-[24px] flex items-center justify-center">
                {item.icon}
              </div>
              <span className={`
                ml-3 
                ${sidebarOpen || mobileMenuOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'} 
                transition-all duration-300
                overflow-hidden whitespace-nowrap
              `}>
                {item.text}
              </span>
            </Link>
          ))}
        </nav>

        {/* 底部信息 */}
        <div className={`
          absolute bottom-4 left-0 right-0 px-4
          ${sidebarOpen || mobileMenuOpen ? 'opacity-100' : 'opacity-0'}
          transition-opacity duration-300
        `}>
          <div className="text-xs text-indigo-200 text-center">
            {isLoggedIn ? (
              <span className="flex items-center justify-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                已登录
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                未登录
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* Header with User Menu */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setMobileMenuOpen(true)}
            >
              <FiMenu size={20} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              算法可视化平台
            </h1>
          </div>
          <UserMenu 
            onLoginClick={() => setIsAuthModalOpen(true)} 
          />
        </header>

        <main className="flex-1 overflow-auto">
          <div className={location.pathname === '/ai-chat' ? 'h-full' : 'container mx-auto px-4 py-6 h-full'}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default Layout;