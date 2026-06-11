/**
 * @file Layout.tsx
 * @description 主布局容器组件 - 算法可视化项目的核心页面骨架
 *
 * 该组件作为整个应用的主布局框架，采用经典的侧边栏+内容区双栏布局模式：
 * - 左侧：固定宽度（256px）的导航侧边栏，提供主要功能模块入口
 * - 右侧：自适应宽度的主内容区域，通过 React Router 的 Outlet 渲染子路由页面
 *
 * 职责说明：
 * 1. 提供全局一致的页面布局结构
 * 2. 渲染主导航菜单，支持当前路由高亮显示
 * 3. 作为路由嵌套的父级容器，管理子页面的展示位置
 *
 * 使用场景：
 * - 作为 React Router 布局路由（layout route）使用
 * - 包裹所有需要侧边栏导航的页面组件
 */

import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { FiHome, FiDatabase, FiCode, FiMessageSquare } from 'react-icons/fi';

/**
 * 主布局组件
 *
 * 实现应用的核心页面结构，包含固定侧边栏和动态内容区。
 * 通过 useLocation hook 监听路由变化，实现导航项的激活状态切换。
 *
 * @returns {JSX.Element} 包含侧边栏和主内容区的完整布局结构
 */
const Layout: React.FC = () => {
  // 获取当前路由位置信息，用于判断哪个导航项处于激活状态
  const location = useLocation();

  /**
   * 判断指定路径是否为当前激活的路由
   *
   * 通过 startsWith 匹配实现前缀匹配，确保子路由也能正确高亮父级菜单项。
   * 例如：当访问 /data-structures/array 时，/data-structures 菜单项也会被标记为激活状态。
   *
   * @param path - 要检查的导航路径
   * @returns {boolean} 如果当前路由以该路径开头则返回 true
   */
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  // 导航菜单配置数组，定义应用的四个主要功能模块
  // 每个菜单项包含：路由路径、图标组件、显示文本
  const menuItems = [
    { path: '/', icon: FiHome, label: '首页' },
    { path: '/data-structures', icon: FiDatabase, label: '数据结构' },
    { path: '/algorithms', icon: FiCode, label: '算法' },
    { path: '/ai-chat', icon: FiMessageSquare, label: 'AI 助手' }
  ];

  return (
    {/* 外层容器：使用 flex 布局实现水平排列，占满整个视口高度 */}
    <div className="flex h-screen">
      {/* ===== 左侧导航栏区域 ===== */}
      {/* 固定宽度256px，深靛蓝色背景，白色文字 */}
      <div className="w-64 bg-indigo-600 text-white">
        <nav className="mt-5">
          {/* 遍历菜单配置数组，渲染导航链接列表 */}
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 text-lg hover:bg-indigo-700 transition-colors ${
                isActive(item.path) ? 'bg-indigo-700' : ''
              }`}
            >
              {/* 菜单项图标，右侧留出12px间距 */}
              <item.icon className="mr-3" />
              {/* 菜单项文字标签 */}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* ===== 右侧主内容区域 ===== */}
      {/* 自适应剩余宽度，启用垂直滚动以适应长内容 */}
      <div className="flex-1 overflow-auto">
        {/* React Router Outlet：渲染当前路由对应的子页面组件 */}
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
