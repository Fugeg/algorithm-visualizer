/**
 * @file 关于页面组件
 * @description 算法可视化平台的关于/介绍页面，展示项目信息、功能特性和平台定位
 * @route 路由位置: /about
 *
 * @页面用途:
 * - 向用户介绍算法可视化平台的核心价值和设计理念
 * - 展示平台的主要功能特性列表
 * - 提供项目背景信息，帮助用户快速了解平台能力
 *
 * @目标用户:
 * - 初学者：了解平台能提供什么学习支持
 * - 教育工作者：评估是否适合用于教学场景
 * - 开发者：理解项目的功能范围和技术定位
 */

import React from 'react';

/**
 * 关于页面主组件
 * @component
 * @returns {JSX.Element} 关于页面的完整界面
 *
 * @页面结构:
 * 1. **标题区域**: 显示"About Algorithm Visualizer"
 * 2. **介绍段落**: 平台定位描述（交互式学习平台）
 * 3. **功能特性列表**: 四大核心特性的详细说明
 *
 * @内容要点:
 * - 强调"交互式"和"可视化"的学习方式
 * - 面向初学者（beginners）的设计定位
 * - 聚焦数据结构和算法两大核心领域
 */
const About: React.FC = () => {
  return (
    /* 主容器：使用 about 类名进行样式控制 */
    <div className="about">
      {/* ===== 页面标题区域 ===== */}
      <h1>About Algorithm Visualizer</h1>

      {/* ===== 平台介绍段落 ===== */}
      {/* 
       * 核心价值主张：
       * 1. Interactive learning platform - 交互式学习平台
       * 2. Help beginners understand - 帮助初学者理解
       * 3. Visual representations - 通过可视化方式呈现
       * 4. Data structures and algorithms - 数据结构与算法主题
       */}
      <p>
        Algorithm Visualizer is an interactive learning platform designed to help
        beginners understand data structures and algorithms through visual representations.
      </p>

      {/* ===== 功能特性区域 ===== */}
      <h2>Features</h2>

      {/* 
       * 核心功能列表：四大特性
       * 采用无序列表形式展示，清晰易读
       */}
      <ul>
        {/* 
         * 特性1: 数据结构可视化
         * 支持多种常用数据结构的图形化展示
         */}
        <li>Interactive visualizations of various data structures</li>
        
        {/* 
         * 特性2: 分步执行 + 速度控制
         * 用户可以观察算法的每一步执行过程
         * 可调节动画速度以适应不同学习节奏
         */}
        <li>Step-by-step algorithm execution with adjustable speed</li>
        
        {/* 
         * 特性3: 解释文档 + 复杂度分析
         * 提供算法原理的文字解释
         * 包含时间和空间复杂度的专业分析
         */}
        <li>Explanations and complexity analysis for each algorithm</li>
        
        {/* 
         * 特性4: 自定义输入
         * 允许用户输入自己的测试数据
         * 增强动手实践的学习体验
         */}
        <li>Custom input options for hands-on learning</li>
      </ul>
    </div>
  );
};

export default About;