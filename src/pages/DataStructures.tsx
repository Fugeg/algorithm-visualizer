/**
 * @file 数据结构总览页面组件
 * @description 数据结构模块的主页面，采用左右分栏布局
 * @route 路由位置: /data-structures (父路由)
 * @子路由:
 *   - /data-structures/array - 数组可视化
 *   - /data-structures/linked-list - 链表可视化
 *   - /data-structures/stack - 栈可视化
 *   - /data-structures/queue - 队列可视化
 *   - /data-structures/binary-tree - 二叉树可视化
 *   - /data-structures/graph - 图可视化
 *   - /data-structures/hash-table - 哈希表可视化
 *   - /data-structures/graph-algorithms - 图算法可视化
 *
 * @展示内容:
 *   左侧：数据结构类型导航菜单（8种常用数据结构）
 *   右侧：选中数据结构的详细可视化内容（通过 Outlet 渲染）
 */

import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { FiGrid, FiLink, FiLayers, FiList, FiGitBranch, FiShare2, FiHash, FiNavigation } from 'react-icons/fi';

/**
 * 数据结构总览页面主组件
 * @component
 * @returns {JSX.Element} 数据结构浏览界面（左侧导航 + 右侧内容区）
 *
 * @布局架构:
 * 采用经典的"导航+内容"双栏布局模式：
 * ┌─────────────────────────────────────────────┐
 * │  左侧导航栏（固定宽度288px）│  右侧内容区（自适应）    │
 * │  - 白色背景              │  - 通过 <Outlet />     │
 * │  - 可滚动                │    渲染子路由组件      │
 * │  - 8个数据结构入口        │                       │
 * └─────────────────────────────────────────────┘
 *
 * @设计特点:
 * 1. **固定侧边栏**：左侧导航宽度固定，方便用户快速切换不同数据结构
 * 2. **响应式图标**：使用 react-icons 提供统一的视觉风格
 * 3. **嵌套路由**：通过 React Router 的 Outlet 实现内容区域的无刷新切换
 * 4. **悬停反馈**：每个导航项都有 hover 状态，提升交互体验
 */
const DataStructures: React.FC = () => {
  return (
    /* 主容器：全高 flex 布局，确保左右两栏填满可用空间 */
    <div className="h-full flex">
      {/* ===== 左侧导航栏开始 ===== */}
      {/* 固定宽度288px，白色背景，带轻微阴影，支持垂直滚动 */}
      <div className="w-72 bg-white shadow-sm p-4 overflow-y-auto">
        {/* 导航项容器：垂直间距16px */}
        <div className="space-y-4">
          {/* ----- 数组导航项 ----- */}
          <Link 
            to="/data-structures/array" 
            className="block p-3 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            {/* 导航项内部：水平排列的图标 + 文字信息 */}
            <div className="flex items-center space-x-3">
              {/* 图标区域 - indigo主题色 */}
              <div className="text-indigo-600">
                <FiGrid size={20} />
              </div>
              {/* 文字信息区：标题 + 描述 */}
              <div>
                <h3 className="font-medium">数组</h3>
                <p className="text-sm text-gray-500">在连续内存位置存储的元素集合</p>
              </div>
            </div>
          </Link>

          {/* ----- 链表导航项 ----- */}
          <Link 
            to="/data-structures/linked-list" 
            className="block p-3 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="text-indigo-600">
                <FiLink size={20} />
              </div>
              <div>
                <h3 className="font-medium">链表</h3>
                <p className="text-sm text-gray-500">元素的链性集合，其顺序不由物理内存位置给出</p>
              </div>
            </div>
          </Link>

          {/* ----- 栈导航项 ----- */}
          <Link 
            to="/data-structures/stack" 
            className="block p-3 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="text-indigo-600">
                <FiLayers size={20} />
              </div>
              <div>
                <h3 className="font-medium">栈</h3>
                <p className="text-sm text-gray-500">后进先出 (LIFO) 数据结构</p>
              </div>
            </div>
          </Link>

          {/* ----- 队列导航项 ----- */}
          <Link 
            to="/data-structures/queue" 
            className="block p-3 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="text-indigo-600">
                <FiList size={20} />
              </div>
              <div>
                <h3 className="font-medium">队列</h3>
                <p className="text-sm text-gray-500">先进先出 (FIFO) 数据结构</p>
              </div>
            </div>
          </Link>

          {/* ----- 二叉树导航项 ----- */}
          <Link 
            to="/data-structures/binary-tree" 
            className="block p-3 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="text-indigo-600">
                <FiGitBranch size={20} />
              </div>
              <div>
                <h3 className="font-medium">二叉树</h3>
                <p className="text-sm text-gray-500">每个节点最多有两个子节点的树数据结构</p>
              </div>
            </div>
          </Link>

          {/* ----- 图导航项 ----- */}
          <Link 
            to="/data-structures/graph" 
            className="block p-3 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="text-indigo-600">
                <FiShare2 size={20} />
              </div>
              <div>
                <h3 className="font-medium">图</h3>
                <p className="text-sm text-gray-500">由节点和边组成的非线性数据结构</p>
              </div>
            </div>
          </Link>

          {/* ----- 哈希表导航项 ----- */}
          <Link 
            to="/data-structures/hash-table" 
            className="block p-3 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="text-indigo-600">
                <FiHash size={20} />
              </div>
              <div>
                <h3 className="font-medium">哈希表</h3>
                <p className="text-sm text-gray-500">实现关联数组抽象数据类型的数据结构</p>
              </div>
            </div>
          </Link>

          {/* ----- 图算法导航项 ----- */}
          <Link 
            to="/data-structures/graph-algorithms" 
            className="block p-3 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="text-indigo-600">
                <FiNavigation size={20} />
              </div>
              <div>
                <h3 className="font-medium">图算法</h3>
                <p className="text-sm text-gray-500">Dijkstra最短路径、BFS、DFS等图论算法可视化</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
      {/* ===== 左侧导航栏结束 ===== */}

      {/* ===== 右侧内容区域开始 ===== */}
      {/* 自适应宽度，支持滚动，用于渲染选中的数据结构详情 */}
      <div className="flex-1 overflow-auto">
        {/* React Router Outlet：渲染与当前URL匹配的子路由组件 */}
        <Outlet />
      </div>
      {/* ===== 右侧内容区域结束 ===== */}
    </div>
  );
};

export default DataStructures;