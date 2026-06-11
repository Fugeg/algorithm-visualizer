/**
 * @file Sidebar.tsx
 * @description 侧边栏导航组件 - 应用的垂直导航菜单
 *
 * 该组件实现页面左侧的固定侧边栏导航，提供主要功能模块的快速入口：
 * - 首页：应用主入口和功能概览
 * - 算法：各类算法可视化演示（排序、搜索等）
 * - 数据结构：数据结构可视化教学（数组、链表、树、图等）
 *
 * 职责说明：
 * 1. 提供垂直排列的导航菜单，节省水平空间
 * 2. 使用语义化 HTML 标签（aside + nav）提升可访问性
 * 3. 通过 React Router Link 实现无刷新的单页应用导航
 *
 * 设计特点：
 * - 与 Header.tsx 互为补充：Header 提供横向导航，Sidebar 提供纵向导航
 * - 使用中文标签，面向中文用户群体
 * - 可配合响应式设计在小屏幕上隐藏或转换为抽屉式菜单
 */

import React from 'react';
import { Link } from 'react-router-dom';

/**
 * 侧边栏导航组件
 *
 * 渲染应用的垂直导航菜单，采用简洁的三项核心功能入口。
 * 使用 aside 语义化标签表示辅助导航内容。
 *
 * @returns {JSX.Element} 包含导航链接列表的侧边栏组件
 */
const Sidebar: React.FC = () => {
  return (
    {/* 语义化侧边栏容器，aside 表示页面辅助内容区域 */}
    <aside className="sidebar">
      {/* 导航内容包裹器 */}
      <nav>
        {/* 导航链接垂直列表 */}
        <ul>
          {/* 首页入口 - 跳转到应用根路径 */}
          <li><Link to="/">首页</Link></li>

          {/* 算法模块入口 - 跳转到算法分类浏览页面 */}
          <li><Link to="/algorithms">算法</Link></li>

          {/* 数据结构模块入口 - 跳转到数据结构选择页面 */}
          <li><Link to="/data-structures">数据结构</Link></li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
