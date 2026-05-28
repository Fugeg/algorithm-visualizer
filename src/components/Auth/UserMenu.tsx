import React, { useState } from 'react';
import { FiUser, FiLogOut, FiSettings, FiCheck } from 'react-icons/fi';
import UserService from '../../services/userService';

interface UserMenuProps {
  onLoginClick: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onLoginClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const userService = UserService.getInstance();
  const user = userService.getCurrentUser();
  const isAuthenticated = userService.isAuthenticated();

  const handleLogout = () => {
    userService.logout();
    setIsOpen(false);
    setShowLogoutConfirm(false);
    // 刷新页面以更新状态
    window.location.reload();
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    setShowLogoutConfirm(true);
  };

  if (!isAuthenticated) {
    return (
      <button
        onClick={onLoginClick}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
      >
        <FiUser className="w-4 h-4" />
        <span>登录</span>
      </button>
    );
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
            {user?.username.charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:inline">{user?.username}</span>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-20 border">
              <div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
                <p className="text-sm font-semibold text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
              </div>
              
              <div className="py-1">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // 可以在这里打开个人设置模态框
                    alert('个人设置功能开发中...');
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors"
                >
                  <FiSettings className="w-4 h-4" />
                  个人设置
                </button>
                
                <button
                  onClick={handleLogoutClick}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                >
                  <FiLogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 登出确认对话框 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiLogOut className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                确认退出登录？
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                您将退出当前账号，需要重新登录才能使用 AI 助手等功能。
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <FiCheck className="w-4 h-4" />
                  确认退出
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};