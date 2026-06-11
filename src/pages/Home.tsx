/**
 * @file 首页组件
 * @description 算法可视化平台的首页，展示平台的主要功能和入口
 * @route 路由位置: / (根路径)
 * @展示内容:
 *   - 平台主标题和介绍语
 *   - 快速导航按钮（数据结构、算法）
 *   - 五大核心功能特性卡片展示
 *   - 底部行动召唤区域
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FiCpu, FiCode, FiBook, FiPlay, FiBarChart2, FiArrowRight } from 'react-icons/fi';

/**
 * 功能特性卡片组件
 * @component
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.icon - 卡片图标（使用 react-icons 图标库）
 * @param {string} props.title - 特性标题
 * @param {string} props.description - 特性详细描述
 * @returns {JSX.Element} 渲染后的功能卡片UI
 *
 * @布局说明:
 * - 白色背景卡片，带圆角和阴影效果
 * - 悬停时上浮并增强阴影，提升交互体验
 * - 垂直布局：图标 → 标题 → 描述文本
 */
const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
    {/* 功能图标区域 - 使用 indigo 主题色 */}
    <div className="text-4xl text-indigo-500 mb-4">{icon}</div>
    {/* 功能标题 */}
    <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
    {/* 功能描述文本 */}
    <p className="text-gray-600">{description}</p>
  </div>
);

/**
 * 首页主组件
 * @component
 * @returns {JSX.Element} 完整的首页界面
 *
 * @页面结构:
 * 1. **顶部英雄区域（Hero Section）**
 *    - 大标题"算法可视化"，突出品牌定位
 *    - 副标题介绍平台核心价值
 *    - 双按钮CTA（Call-to-Action），引导用户进入数据结构或算法模块
 *
 * 2. **功能特性网格区域**
 *    - 响应式三列网格布局（大屏3列，中屏2列，小屏1列）
 *    - 展示5个核心功能特性：
 *      ✓ 数据结构可视化
 *      ✓ 算法学习
 *      ✓ 交互式模拟
 *      ✓ 全面解释文档
 *      ✓ 复杂度分析
 *
 * 3. **底部行动召唤区域（CTA Section）**
 *    - 浅色背景区分，视觉上引导用户注意
 *    - 再次提供入口链接，降低用户决策成本
 */
const Home: React.FC = () => {
  return (
    /* 主容器：最大宽度限制 + 居中对齐 + 内边距 */
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* ===== 英雄区域开始 ===== */}
      <div className="text-center mb-16">
        {/* 主标题：渐变强调"可视化"关键词 */}
        <h1 className="text-6xl font-bold mb-6 text-gray-800 animate-fade-in-down">
          算法 <span className="text-indigo-600">可视化</span>
        </h1>
        {/* 平台介绍副标题 */}
        <p className="text-xl mb-8 text-gray-600 max-w-2xl mx-auto">
          通过交互式可视化和逐步解释，探索并掌握数据结构和算法。
        </p>

        {/* 主要操作按钮组：响应式垂直/水平切换布局 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* 数据结构入口按钮 - indigo主题色 */}
          <Link to="/data-structures" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 inline-flex items-center">
            探索数据结构 <FiArrowRight className="ml-2" />
          </Link>
          {/* 算法入口按钮 - green主题色，与数据结构形成视觉对比 */}
          <Link to="/algorithms" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 inline-flex items-center">
            发现算法 <FiArrowRight className="ml-2" />
          </Link>
        </div>
      </div>
      {/* ===== 英雄区域结束 ===== */}

      {/* ===== 功能特性网格开始 ===== */}
      {/* 响应式网格：lg屏幕3列，md屏幕2列，默认1列 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {/* 数据结构功能卡片 */}
        <FeatureCard 
          icon={<FiCpu />}
          title="数据结构"
          description="可视化并理解各种数据结构，如数组、链表、树等。"
        />
        {/* 算法学习功能卡片 */}
        <FeatureCard 
          icon={<FiCode />}
          title="算法"
          description="通过逐步可视化学习流行的算法，包括排序、搜索和图算法。"
        />
        {/* 交互式模拟功能卡片 */}
        <FeatureCard 
          icon={<FiPlay />}
          title="交互式模拟"
          description="与可视化交互，控制动画速度，输入自定义数据，获得实践学习体验。"
        />
        {/* 全面解释功能卡片 */}
        <FeatureCard 
          icon={<FiBook />}
          title="全面解释"
          description="获取每种数据结构和算法的详细解释，包括其用例和实现。"
        />
        {/* 复杂度分析功能卡片 */}
        <FeatureCard 
          icon={<FiBarChart2 />}
          title="复杂度分析"
          description="理解不同操作和算法的时间和空间复杂度。"
        />
      </div>
      {/* ===== 功能特性网格结束 ===== */}

      {/* ===== 底部行动召唤区域开始 ===== */}
      {/* 浅色背景区块，用于视觉分隔和再次引导 */}
      <div className="bg-indigo-100 rounded-lg p-8 text-center">
        <h2 className="text-3xl font-semibold mb-4 text-indigo-800">准备好开始了吗？</h2>
        <p className="text-xl text-indigo-600 mb-8">选择一个主题，今天就开始你的学习之旅！</p>
        {/* 重复的CTA按钮组，强化转化 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/data-structures" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 inline-flex items-center">
            从数据结构开始 <FiArrowRight className="ml-2" />
          </Link>
          <Link to="/algorithms" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 inline-flex items-center">
            从算法开始 <FiArrowRight className="ml-2" />
          </Link>
        </div>
      </div>
      {/* ===== 底部行动召唤区域结束 ===== */}
    </div>
  );
};

export default Home;
