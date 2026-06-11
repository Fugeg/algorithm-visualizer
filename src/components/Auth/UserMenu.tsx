/**
 * @file UserMenu.tsx
 * @description 用户菜单下拉组件 - 已登录用户的操作入口和未登录用户的引导按钮
 *
 * 该组件实现用户认证状态相关的 UI 交互，根据用户是否登录展示不同的界面：
 *
 * 未登录状态：
 * - 显示"登录"按钮，点击触发 onLoginClick 回调打开 AuthModal 弹窗
 *
 * 已登录状态：
 * - 显示用户头像（首字母圆形图标）+ 用户名下拉触发器
 * - 点击展开下拉菜单，包含：
 *   - 用户信息卡片（用户名 + 邮箱）
 *   - 个人设置入口（当前为占位功能）
 *   - 退出登录按钮（带二次确认对话框）
 * - 支持点击外部区域自动关闭下拉菜单
 *
 * 职责说明：
 * 1. 根据认证状态动态渲染不同的 UI（条件渲染模式）
 * 2. 管理下拉菜单的展开/收起状态（受控组件）
 * 3. 实现退出登录的二次确认机制（防止误操作）
 * 4. 通过 UserService 单例获取当前用户信息和执行登出操作
 *
 * 安全设计：
 * - 退出操作需要用户二次确认，避免误触导致意外登出
 * - 登出后强制刷新页面，确保所有状态被重置（包括可能的内存缓存）
 */

import React, { useState } from 'react';
import { FiUser, FiLogOut, FiSettings, FiCheck } from 'react-icons/fi';
import UserService from '../../services/userService';

/**
 * 用户菜单组件的属性接口定义
 *
 * @interface UserMenuProps
 * @property {() => void} onLoginClick - 点击"登录"按钮时的回调函数，
 *                                       通常用于打开 AuthModal 认证弹窗
 */
interface UserMenuProps {
  onLoginClick: () => void;
}

/**
 * 用户菜单下拉组件
 *
 * 实现基于认证状态的条件渲染逻辑：
 * - 未登录：显示简洁的登录按钮
 * - 已登录：显示头像+下拉菜单的完整交互界面
 *
 * 使用 UserService 单例获取实时认证状态和用户信息。
 *
 * @param props - 组件属性对象
 * @returns {JSX.Element} 根据认证状态返回登录按钮或用户下拉菜单
 */
export const UserMenu: React.FC<UserMenuProps> = ({ onLoginClick }) => {
  // 下拉菜单展开/收起状态控制
  const [isOpen, setIsOpen] = useState(false);

  // 登出确认对话框的显示状态
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // 获取 UserService 单例实例
  const userService = UserService.getInstance();

  // 从服务中获取当前登录用户的信息对象（包含 username、email 等字段）
  const user = userService.getCurrentUser();

  // 获取当前认证状态：是否已登录（用于条件渲染判断）
  const isAuthenticated = userService.isAuthenticated();

  /**
   * 执行退出登录操作
   *
   * 业务流程：
   * 1. 调用 userService.logout() 清除本地存储的认证令牌和用户信息
   * 2. 关闭下拉菜单和确认对话框
   * 3. 强制刷新页面（window.location.reload()）以确保：
   *    - 清除内存中的所有 React 状态
   *    - 重新初始化应用上下文
   *    - 避免残留的认证状态导致 UI 不一致
   */
  const handleLogout = () => {
    userService.logout();
    setIsOpen(false);
    setShowLogoutConfirm(false);
    // 刷新页面以更新状态（确保完全重置应用状态）
    window.location.reload();
  };

  /**
   * 处理退出登录按钮点击事件
   *
   * 先关闭下拉菜单，然后显示二次确认对话框。
   * 将两个操作分离是为了确保 UI 过渡流畅：
   * - 用户先看到菜单消失
   * - 然后看到居中的确认弹窗出现
   */
  const handleLogoutClick = () => {
    setIsOpen(false);           // 第一步：关闭下拉菜单
    setShowLogoutConfirm(true); // 第二步：显示确认对话框
  };

  /* ===== 未登录状态渲染 ===== */
  if (!isAuthenticated) {
    return (
      <button
        onClick={onLoginClick}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
      >
        {/* 用户图标 */}
        <FiUser className="w-4 h-4" />
        <span>登录</span>
      </button>
    );
  }

  /* ===== 已登录状态渲染 ===== */
  return (
    <>
      {/* 外层相对定位容器：作为下拉菜单的定位参考点 */}
      <div className="relative">
        {/* ===== 用户信息触发按钮 ===== */}
        {/* 点击切换下拉菜单的展开/收起状态 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          {/* 用户头像：取用户名的首字母并大写，显示在靛蓝色圆形背景上 */}
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
            {user?.username.charAt(0).toUpperCase()}
          </div>
          {/* 用户名文本：在小屏幕设备上隐藏以节省空间 */}
          <span className="hidden sm:inline">{user?.username}</span>
        </button>

        {/* ===== 下拉菜单内容（条件渲染） ===== */}
        {isOpen && (
          <>
            {/* 遮罩层：覆盖整个屏幕，点击时关闭下拉菜单（实现"点击外部关闭"交互） */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* 下拉面板：绝对定位于触发按钮右下方 */}
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-20 border">
              {/* ---- 用户信息卡片区域（浅灰色背景区分） ---- */}
              <div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
                {/* 用户名：加粗显示 */}
                <p className="text-sm font-semibold text-gray-900">{user?.username}</p>
                {/* 邮箱地址：次要信息，小字号浅色显示 */}
                <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
              </div>

              {/* ---- 操作选项列表 ---- */}
              <div className="py-1">
                {/* 个人设置按钮（占位功能） */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // TODO: 可以在这里打开个人设置模态框，当前为临时提示
                    alert('个人设置功能开发中...');
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors"
                >
                  {/* 设置齿轮图标 */}
                  <FiSettings className="w-4 h-4" />
                  个人设置
                </button>

                {/* 退出登录按钮（红色警告样式，表示危险操作） */}
                <button
                  onClick={handleLogoutClick}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                >
                  {/* 登出图标 */}
                  <FiLogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ===== 登出确认对话框（条件渲染） ===== */}
      {/* 采用全屏遮罩 + 居中卡片的设计模式，确保用户注意力集中在确认操作上 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {/* 对话框主体：最大宽度384px，响应式边距 */}
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="text-center">
              {/* 警告图标：黄色圆形背景 + 登出图标，视觉上传达"需要注意"的含义 */}
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiLogOut className="w-6 h-6 text-yellow-600" />
              </div>

              {/* 确认标题 */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                确认退出登录？
              </h3>

              {/* 说明文字：告知用户退出的后果，帮助其做出知情决定 */}
              <p className="text-sm text-gray-500 mb-6">
                您将退出当前账号，需要重新登录才能使用 AI 助手等功能。
              </p>

              {/* 操作按钮组：取消 + 确认 */}
              <div className="flex gap-3 justify-center">
                {/* 取消按钮：次级样式（描边按钮），点击仅关闭对话框 */}
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>

                {/* 确认退出按钮：危险操作的主色调红色按钮 */}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  {/* 勾选图标：表示确认/执行 */}
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