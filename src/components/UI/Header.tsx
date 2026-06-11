/**
 * @file Header.tsx
 * @description 顶部导航栏组件 - 应用的全局导航头部
 *
 * 该组件实现页面顶部的固定导航栏，包含：
 * - 左侧：应用品牌标识/Logo（"Algorithm Visualizer"）
 * - 右侧：主导航菜单链接（首页、数据结构、算法、关于）
 *
 * 职责说明：
 * 1. 提供全局导航入口，支持用户快速切换主要功能模块
 * 2. 展示应用品牌标识，强化产品认知
 * 3. 使用 React Router Link 组件实现客户端路由跳转（无刷新导航）
 *
 * 使用场景：
 * - 作为页面布局的顶部固定元素
 * - 在所有主要页面中保持一致的导航体验
 * 注意：该组件使用英文标签，可能是早期版本或面向国际用户的备用方案
 */

import React from 'react';
import { Link } from 'react-router-dom';

/**
 * 顶部导航栏组件
 *
 * 渲染应用的全局导航头部，包含品牌标题和导航链接。
 * 采用语义化的 header 和 nav 标签结构，利于 SEO 和无障碍访问。
 *
 * @returns {JSX.Element} 包含品牌标识和导航链接的头部组件
 */
const Header: React.FC = () => {
  return (
    <header className="header">
      {/* 应用品牌标识/Logo */}
      <h1>Algorithm Visualizer</h1>

      {/* 主导航区域 */}
      <nav>
        {/* 导航链接列表 */}
        <ul>
          {/* 首页链接 - 跳转到根路径 */}
          <li><Link to="/">Home</Link></li>

          {/* 数据结构模块入口 - 跳转到数据结构展示页面 */}
          <li><Link to="/data-structures">Data Structures</Link></li>

          {/* 算法模块入口 - 跳转到算法可视化页面 */}
          <li><Link to="/algorithms">Algorithms</Link></li>

          {/* 关于页面 - 展示项目介绍和使用说明 */}
          <li><Link to="/about">About</Link></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
