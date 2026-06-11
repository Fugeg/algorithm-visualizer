/**
 * @file DataStructureLayout.tsx
 * @description 数据结构可视化页面的专用布局组件
 *
 * 该组件为数据结构展示页面提供标准化的布局模板，采用自上而下的信息架构：
 * - 顶部：数据结构标题（带入场动画）
 * - 中部：可视化演示区域 + 操作控制面板（并排或堆叠显示）
 * - 底部：特点说明卡片 + 时间/空间复杂度分析面板（双栏网格布局）
 *
 * 设计理念：
 * 1. 统一所有数据结构页面（数组、链表、树、图等）的视觉呈现规范
 * 2. 通过 Framer Motion 实现流畅的入场动画和交互反馈，提升用户体验
 * 3. 将复杂度分析作为核心教学内容，帮助学生理解算法效率
 *
 * 职责说明：
 * 1. 组织数据结构页面的内容分区和视觉层次
 * 2. 管理子组件（可视化器、操作面板）的渲染位置
 * 3. 展示算法复杂度的结构化信息（最优/平均/最差情况）
 */

import React from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiList, FiCode } from 'react-icons/fi';
import { Feature, Complexity } from '../../types';

/**
 * 数据结构布局组件的属性接口定义
 *
 * @interface DataStructureLayoutProps
 * @property {string} title - 当前数据结构的名称（如"数组"、"二叉树"）
 * @property {React.ReactNode} visualization - 可视化演示区域组件（Canvas/SVG动画等）
 * @property {React.ReactNode} operations - 操作控制面板（插入、删除、搜索等按钮组）
 * @property {Feature} features - 特点说明配置（标题+特点列表）
 * @property {Complexity} complexity - 复杂度分析数据（概览+详细操作列表）
 */
interface DataStructureLayoutProps {
  title: string;
  visualization: React.ReactNode;
  operations: React.ReactNode;
  features: Feature;
  complexity: Complexity;
}

/**
 * 数据结构专用布局组件
 *
 * 提供标准化的数据结构教学页面模板，整合可视化演示、交互操作和理论分析三大模块。
 * 使用 Framer Motion 实现渐进式入场动画，增强学习体验。
 *
 * @param props - 布局属性配置对象
 * @returns {JSX.Element} 完整的数据结构展示页面布局
 */
const DataStructureLayout: React.FC<DataStructureLayoutProps> = ({
  title,
  visualization,
  operations,
  features,
  complexity
}) => {
  // 调试日志：输出复杂度数据，便于开发时排查数据传递问题
  console.log('Complexity prop:', complexity);

  return (
    <motion.div
      className="p-6 max-w-7xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* ===== 页面标题区域 ===== */}
      {/* 大标题样式，带从上方淡入的下落动画 */}
      <motion.h2
        className="text-3xl font-bold mb-6 text-gray-800"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {title}
      </motion.h2>

      {/* ===== 主内容区域：垂直排列的模块容器 ===== */}
      <div className="flex flex-col gap-6">
        {/* ---------- 第一块：可视化演示区域 ---------- */}
        {/* 白色卡片容器，圆角阴影，悬停时轻微放大（1.01倍） */}
        <motion.div
          className="w-full bg-white rounded-xl shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
          transition={{ duration: 0.5 }}
        >
          {/* 渲染传入的可视化子组件（如数组可视化器、树形图渲染器等） */}
          {visualization}
        </motion.div>

        {/* ---------- 第二块：操作控制面板 ---------- */}
        {/* 包含标题栏和操作按钮组的白色卡片 */}
        <motion.div
          className="w-full bg-white rounded-xl shadow-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
          transition={{ duration: 0.5, delay: 0.1 }}  // 延迟0.1s入场，形成错落感
        >
          {/* 操作面板标题栏：代码图标 + "操作面板"文字 */}
          <div className="flex items-center gap-2 mb-3">
            <FiCode className="text-blue-500 text-xl" />
            <h3 className="text-lg font-semibold text-gray-800">操作面板</h3>
          </div>
          {/* 渲染传入的操作子组件（如插入/删除/搜索按钮组） */}
          {operations}
        </motion.div>

        /* ===== 第三块：特点说明 + 复杂度分析（双栏布局） ===== */
        {/* 中等屏幕以上并排显示，小屏幕自动堆叠 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* ~~~~~~ 左栏：数据结构特点说明 ~~~~~~ */}
          <motion.div
            className="bg-white rounded-xl shadow-lg p-6"
            initial={{ opacity: 0, x: -20 }}  // 从左侧滑入
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* 特点区域标题：列表图标 + 动态标题（来自props） */}
            <div className="flex items-center gap-2 mb-4">
              <FiList className="text-blue-500 text-xl" />
              <h3 className="text-lg font-semibold text-gray-800">{features.title}</h3>
            </div>
            {/* 特点列表：逐条淡入动画，每项延迟0.1s形成瀑布效果 */}
            <ul className="space-y-3">
              {features.items.map((item, index) => (
                <motion.li
                  key={index}
                  className="flex items-start gap-3 text-gray-600"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  {/* 蓝色圆点标记 */}
                  <span className="w-1.5 h-1.5 mt-2 rounded-full bg-blue-400 shrink-0" />
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* ~~~~~~ 右栏：时间/空间复杂度分析 ~~~~~~ */}
          <motion.div
            className="bg-white rounded-xl shadow-lg p-6"
            initial={{ opacity: 0, x: 20 }}  // 从右侧滑入
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* 复杂度区域标题：时钟图标 + 动态标题 */}
            <div className="flex items-center gap-2 mb-4">
              <FiClock className="text-blue-500 text-xl" />
              <h3 className="text-lg font-semibold text-gray-800">{complexity.title}</h3>
            </div>

            <div className="space-y-6">
              {/* ---- 复杂度概览卡片（浅蓝色背景） ---- */}
              {/* 展示四种基本情况的大O表示法 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-3">复杂度概览</h4>
                {/* 2x2 网格：最优/平均/最差时间 + 空间复杂度 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-blue-600 mb-1">最优情况</p>
                    <p className="font-mono text-sm">{complexity.summary.bestCase}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 mb-1">平均情况</p>
                    <p className="font-mono text-sm">{complexity.summary.averageCase}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 mb-1">最差情况</p>
                    <p className="font-mono text-sm">{complexity.summary.worstCase}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 mb-1">空间复杂度</p>
                    <p className="font-mono text-sm">{complexity.summary.spaceComplexity}</p>
                  </div>
                </div>
              </div>

              {/* ---- 具体操作复杂度明细列表 ---- */}
              {/* 遍历每个具体操作（如插入、删除、查找），展示其独立的时间/空间复杂度 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">操作复杂度分析</h4>
                <div className="space-y-3">
                  {complexity.items.map((item, index) => (
                    <motion.div
                      key={index}
                      className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors duration-200"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      {/* 操作名称 + 复杂度标签行 */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{item.operation}</span>
                        {/* 时间复杂度（蓝色标签）和空间复杂度（绿色标签） */}
                        <div className="flex gap-2">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                            时间: {item.timeComplexity}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            空间: {item.spaceComplexity}
                          </span>
                        </div>
                      </div>
                      {/* 操作描述文字 */}
                      <p className="text-xs text-gray-600">{item.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ---- 复杂度符号说明（底部辅助提示） ---- */}
              {/* 帮助初学者理解大O表示法的含义 */}
              <div className="text-xs text-gray-500 space-y-1 border-t border-gray-100 pt-3">
                <p>• O(1): 常数时间，与输入规模无关</p>
                <p>• O(n): 线性时间，与输入规模成正比</p>
                <p>• O(log n): 对数时间，随输入规模增长而缓慢增加</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default DataStructureLayout;
