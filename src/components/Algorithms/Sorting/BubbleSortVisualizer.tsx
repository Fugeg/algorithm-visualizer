/**
 * @fileoverview 冒泡排序专用可视化渲染组件
 * @description 专门为冒泡排序算法设计的柱状图可视化组件。
 *              与通用排序可视化器不同，此组件仅处理冒泡排序相关的状态类型，
 *              支持比较中（黄色）、交换中（红色）、已排序（绿色）三种核心状态。
 *
 * @note 此组件是纯展示组件，不包含任何业务逻辑或状态管理，
 *       所有数据通过 props 传入。
 */

import React from 'react';
import { ArrayElement } from '../../../models/SortingAlgorithm';

/**
 * BubbleSortVisualizer组件属性接口
 * @interface BubbleSortVisualizerProps
 * @property array - 数组元素列表，每个元素包含值和当前状态信息
 */
interface BubbleSortVisualizerProps {
  array: ArrayElement[];
}

/**
 * 冒泡排序柱状图可视化组件
 * @param props - 组件属性：array（带状态的数组数据）
 * @description 将数组渲染为彩色柱状图：
 *              - 柱子高度与数值成正比
 *              - 颜色根据元素状态动态变化
 *              - 带过渡动画效果，平滑展示状态变化
 */
const BubbleSortVisualizer: React.FC<BubbleSortVisualizerProps> = ({ array }) => {
  // 计算数组最大值用于归一化柱子高度（至少为1，避免除零错误）
  const maxValue = Math.max(...array.map(item => item.value));
  
  /**
   * 根据元素状态返回对应的颜色类名
   * @param state - 元素当前状态
   * @returns Tailwind CSS背景色类名
   */
  const getBarColor = (state: ArrayElement['state']) => {
    switch (state) {
      case 'comparing': return 'bg-yellow-500';   // 正在比较的元素对：黄色高亮
      case 'swapping': return 'bg-red-500';       // 正在交换的元素：红色警示
      case 'sorted': return 'bg-green-500';       // 已完成排序的元素：绿色确认
      default: return 'bg-blue-500';              // 未处理元素：默认蓝色
    }
  };

  return (
    <div className="border rounded-lg bg-white p-4 shadow-sm">
      {/* 柱状图容器：固定高度264px，水平居中对齐 */}
      <div className="flex items-end justify-center h-64 gap-1">
        {array.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center"
            // 动态计算每个柱子的宽度：根据数组长度自适应（30px-600px范围）
            style={{ width: `${Math.max(30, 600 / array.length)}px` }}
          >
            {/* 柱子本体 */}
            <div
              className={`w-full ${getBarColor(item.state)} rounded-t transition-all duration-300`}
              style={{
                // 高度按比例缩放：最大值对应200px高度
                height: `${(item.value / maxValue) * 200}px`,
              }}
            />
            {/* 数值标签：显示在柱子下方 */}
            <span className="text-xs mt-1">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BubbleSortVisualizer;
