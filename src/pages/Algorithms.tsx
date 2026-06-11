/**
 * @file 算法总览页面组件（简化版/备用版）
 * @description 算法模块的基础路由容器，用于渲染具体的算法可视化组件
 * @route 路由位置: /algorithms (父路由)
 *
 * @注意:
 * 此文件是算法模块的早期实现版本，功能较为基础。
 * 当前项目主要使用 AlgorithmsPage.tsx 作为算法主页面（具有完整的左侧导航和分类展示）。
 * 该文件可能作为备用方案或历史版本保留。
 *
 * @当前支持的路由:
 *   - /algorithms (根路由) - 显示提示信息
 *   - /algorithms/bubble-sort - 冒泡排序可视化
 *
 * @待扩展: 需要添加其他算法的路由配置（参见 AlgorithmsPage.tsx 的完整实现）
 */

import React from 'react';
import { Route, Routes, useMatch } from 'react-router-dom';
import BubbleSort from '../components/Algorithms/Sorting/BubbleSort';
// Import other algorithm components here

/**
 * 算法总览页面主组件（简化版）
 * @component
 * @returns {JSX.Element} 基础的算法展示容器
 *
 * @功能说明:
 * 1. **路径匹配检测**：使用 useMatch 获取当前URL路径，用于调试或条件渲染
 * 2. **路由配置**：通过 React Router 的 Routes 组件定义子路由规则
 * 3. **默认页面**：当未选择具体算法时，显示引导性提示文字
 *
 * @与 AlgorithmsPage.tsx 的区别:
 * - 本文件：简单路由容器，无导航栏，无算法列表
 * - AlgorithmsPage.tsx：完整实现，包含左侧分类导航 + 右侧内容区 + 默认欢迎页
 */
const Algorithms: React.FC = () => {
  // 使用 useMatch hook 匹配当前URL路径
  // 返回匹配对象或 null，用于获取精确的路径信息
  const match = useMatch('/algorithms/*');
  // 提取当前实际路径名，如果无匹配则回退到 '/algorithms'
  const path = match ? match.pathname : '/algorithms';

  return (
    <div>
      {/* 页面标题 */}
      <h1>Algorithms</h1>

      {/* ===== 路由配置区域 ===== */}
      <Routes>
        {/* 根路由：显示默认提示信息，引导用户从侧边栏选择算法 */}
        <Route index element={<p>Select an algorithm from the sidebar to visualize.</p>} />

        {/* 冒泡排序路由：加载冒泡排序可视化组件 */}
        <Route path="bubble-sort" element={<BubbleSort />} />

        {/* 占位符：预留其他算法的路由位置 */}
        {/* Add routes for other algorithms */}
      </Routes>
    </div>
  );
};

export default Algorithms;