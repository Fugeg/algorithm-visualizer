/**
 * @file index.tsx
 * @description React应用入口文件 - 应用的启动点和初始化配置
 * 
 * 该文件是整个React应用的执行入口，主要职责：
 * - 获取DOM挂载点（root元素）
 * - 创建React 18的Root实例（使用新的createRoot API）
 * - 配置全局样式（Tailwind CSS）
 * - 渲染根组件到DOM中
 * 
 * 执行流程：
 * 1. 等待DOM加载完成（通过script标签的加载顺序保证）
 * 2. 定位HTML中的<div id="root">容器元素
 * 3. 使用React 18的并发模式创建渲染根
 * 4. 在StrictMode下渲染App组件（开发环境双重渲染检测副作用）
 * 
 * 技术要点：
 * - 使用React 18的createRoot API替代旧的ReactDOM.render
 * - StrictMode帮助发现潜在问题（如不安全的生命周期、遗留API等）
 * - Tailwind CSS作为全局样式框架，提供原子化CSS类
 * 
 * @module index
 */

import React from 'react';
// 引入React 18的新API，用于创建并发模式的渲染根
import { createRoot } from 'react-dom/client';

// 导入Tailwind CSS框架样式
// 包含所有工具类、组件类和响应式断点定义
// 这是应用的全局样式基础，所有组件都依赖这些样式
import './styles/tailwind.css';

// 导入应用根组件
// App组件包含完整的路由系统和页面结构
import App from './App';

/**
 * 应用启动流程
 * 
 * 步骤说明：
 * 1. 从HTML文档中获取挂载点元素
 *    - 该元素通常在public/index.html中定义为：<div id="root"></div>
 *    - 如果找不到则抛出错误，防止静默失败
 * 
 * 2. 创建React 18 Root实例
 *    - createRoot启用并发特性（Concurrent Features）
 *    - 支持Suspense、自动批处理、优先级更新等新特性
 *    - 相比React 17的render方法有更好的性能和用户体验
 * 
 * 3. 渲染应用组件
 *    - StrictMode是开发辅助工具：
 *      a. 双重调用渲染函数检测不纯渲染
 *      b. 双重调用useEffect/setup函数检测内存泄漏
 *      c. 检查废弃的生命周期方法
 *    - 生产环境中StrictMode不影响性能（仅开发模式生效）
 */

// 获取DOM中的根容器元素
// 必须确保index.html中有 <div id="root"></div>
const container = document.getElementById('root');

// 安全检查：如果找不到root元素，立即抛出明确错误
// 这有助于快速定位HTML模板配置问题
if (!container) throw new Error('Failed to find the root element');

// 使用React 18的createRoot API创建渲染根
// 返回的root对象支持并发渲染特性
const root = createRoot(container);

// 将App组件渲染到DOM中
// React.StrictMode包装器在开发模式下会：
// - 额外运行一次渲染生命周期以检测副作用
// - 对类组件调用两次constructor和render
// - 对函数组件调用两次函数体
// 这些行为仅在开发环境发生，生产构建会被移除
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);