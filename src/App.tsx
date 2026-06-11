/**
 * @file App.tsx
 * @description React应用根组件 - 定义整个应用的路由结构和页面布局
 * 
 * 该文件是应用的入口组件，主要职责：
 * - 配置React Router路由系统（使用v6版本的路由配置）
 * - 组织页面的层级结构（Layout嵌套路由）
 * - 集成所有功能模块（算法可视化、数据结构展示、AI对话等）
 * 
 * 路由架构设计：
 * └── / (根路径，Layout布局容器)
 *     ├── / (首页 Home)
 *     ├── /algorithms/* (算法模块)
 *     │   ├── /algorithms/binary-search (二分查找)
 *     │   ├── /algorithms/avl-tree (AVL平衡树)
 *     │   └── /algorithms/n-queens (N皇后问题)
 *     ├── /data-structures/* (数据结构模块)
 *     │   ├── /data-structures/array (数组)
 *     │   ├── /data-structures/linked-list (链表)
 *     │   ├── /data-structures/stack (栈)
 *     │   ├── /data-structures/queue (队列)
 *     │   ├── /data-structures/binary-tree (二叉树)
 *     │   ├── /data-structures/graph (图)
 *     │   ├── /data-structures/hash-table (哈希表)
 *     │   └── /data-structures/graph-algorithms (图算法)
 *     └── /ai-chat (AI智能对话)
 * 
 * @module App
 */

import React from 'react';
// 引入React Router v6的核心组件
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 布局组件 - 提供统一的页面框架（导航栏+侧边栏+内容区）
import Layout from './components/Layout';

// 页面级组件
import Home from './pages/Home';                    // 首页 - 项目介绍和导航入口
import AlgorithmsPage from './pages/AlgorithmsPage'; // 算法总览页 - 算法列表和分类
import DataStructures from './pages/DataStructures'; // 数据结构总览页 - 数据结构分类

// 数据结构可视化组件（具体实现）
import Array from './components/DataStructures/Array';           // 数组 - 基础线性结构
import LinkedList from './components/DataStructures/LinkedList'; // 链表 - 动态链式结构
import Stack from './components/DataStructures/Stack';           // 栈 - 后进先出结构
import Queue from './components/DataStructures/Queue';           // 队列 - 先进先出结构
import BinaryTree from './components/DataStructures/BinaryTree'; // 二叉树 - 树形层次结构
import Graph from './components/DataStructures/Graph';           // 图 - 复杂网状结构
import HashTable from './components/DataStructures/HashTable';   // 哈希表 - 键值映射结构

// 算法可视化组件（具体实现）
import BinarySearch from './components/Algorithms/BinarySearch'; // 二分查找 - 分治算法典型
import AVLTreePage from './components/Algorithms/AVLTreePage';   // AVL树 - 自平衡二叉搜索树
import NQueens from './components/Algorithms/NQueens';           // N皇后 - 回溯算法经典问题
import GraphAlgorithms from './components/DataStructures/GraphAlgorithms'; // 图算法集合

// AI对话功能组件
import AIChatLayout from './components/AIChat/AIChatLayout';     // AI聊天界面 - 智能问答系统

/**
 * 应用根组件
 * 
 * 作为整个React应用的顶层组件，负责：
 * 1. 初始化路由系统（BrowserRouter提供历史管理）
 * 2. 定义所有页面的URL映射关系
 * 3. 通过Layout组件统一包装所有页面，保持一致的UI风格
 * 
 * 路由设计特点：
 * - 采用嵌套路由（Outlet模式），Layout作为父路由包裹所有子页面
 * - 使用通配符(*)支持子路由的灵活扩展
 * - 算法和数据结构采用模块化组织，便于后续添加新内容
 * 
 * @component
 * @returns {JSX.Element} 包含完整路由系统的React元素
 */
const App: React.FC = () => {
  return (
    <Router>
      {/* 路由配置区域 */}
      <Routes>
        {/* 
          根路由配置
          Layout作为布局容器，包含：
          - 顶部导航栏
          - 左侧边栏菜单
          - 主内容区（通过<Outlet/>渲染子路由）
        */}
        <Route path="/" element={<Layout />}>
          
          {/* 首页 - 默认路由（index属性表示匹配父路径"/"） */}
          <Route index element={<Home />} />
          
          {/* 
            算法模块路由组
            路径前缀: /algorithms/*
            AlgorithmsPage作为容器组件，渲染算法列表
            子路由在AlgorithmsPage内部通过Outlet展示
          */}
          <Route path="algorithms/*" element={<AlgorithmsPage />}>
            {/* 具体算法页面路由 */}
            <Route path="binary-search" element={<BinarySearch />} />    {/* 二分查找算法 */}
            <Route path="avl-tree" element={<AVLTreePage />} />           {/* AVL自平衡树 */}
            <Route path="n-queens" element={<NQueens />} />              {/* N皇后回溯算法 */}
          </Route>
          
          {/* 
            数据结构模块路由组
            路径前缀: /data-structures/*
            DataStructures作为容器组件，渲染数据结构分类列表
            支持多种基础和高级数据结构的交互式可视化
          */}
          <Route path="data-structures/*" element={<DataStructures />}>
            {/* 基础数据结构 */}
            <Route path="array" element={<Array />} />                   {/* 数组 - 随机访问O(1) */}
            <Route path="linked-list" element={<LinkedList />} />        {/* 链表 - 动态插入删除 */}
            <Route path="stack" element={<Stack />} />                   {/* 栈 - 函数调用/撤销操作 */}
            <Route path="queue" element={<Queue />} />                   {/* 队列 - 任务调度/BFS */}
            
            {/* 高级数据结构 */}
            <Route path="binary-tree" element={<BinaryTree />} />        {/* 二叉树 - 层次化数据 */}
            <Route path="graph" element={<Graph />} />                   {/* 图 - 关系网络建模 */}
            <Route path="hash-table" element={<HashTable />} />          {/* 哈希表 - 快速查找 */}
            
            {/* 图相关算法（独立页面，因功能较复杂） */}
            <Route path="graph-algorithms" element={<GraphAlgorithms />} /> {/* DFS/BFS/最短路径等 */}
          </Route>
          
          {/* AI对话模块 - 独立路由，不使用通用布局 */}
          <Route path="ai-chat" element={<AIChatLayout />} />
          
        </Route>
      </Routes>
    </Router>
  );
};

export default App;