/**
 * @file VisualizationCanvas.tsx
 * @description 可视化画布渲染组件 - 算法可视化管线的"视图层"核心
 *
 * 【管线位置】Model → Controller → View（本组件）
 * - 上游：接收 PlaybackController 传递的当前步骤数据模型（数组状态）
 * - 本层：将数据模型转换为视觉元素（柱状图/条形图）
 * - 下游：通过 CSS 类名和内联样式驱动动画过渡效果
 *
 * 【核心职责】
 * 1. 将一维数值数组渲染为等宽柱状图
 * 2. 根据高亮索引动态标记活跃元素（如比较/交换中的元素）
 * 3. 自动计算比例尺，确保最大值始终占满画布高度
 *
 * 【与 PlaybackController 的协作】
 * - PlaybackController 维护 currentStepIndex，每步推进时更新 data 和 highlightIndices
 * - 本组件为纯展示组件（Presentational Component），不维护内部状态
 * - 动画效果依赖 CSS transition，由父组件控制数据变更频率
 */

import React from 'react';

/**
 * VisualizationCanvas 组件属性接口
 * @property {number[]} data - 当前步骤的数组数据，每个元素对应一根柱子的高度值
 * @property {number[]} [highlightIndices=[]] - 需要高亮显示的柱子索引数组，
 *   用于标记当前算法正在操作的元素（如比较对、交换位、已排序区间等）
 */
interface VisualizationCanvasProps {
  data: number[];
  highlightIndices?: number[];
}

/**
 * 可视化画布组件 - 柱状图/数组可视化主画布
 *
 * 【渲染策略】
 * - 使用 flexbox 布局实现等宽柱状图，每根柱子宽度 = 100% / 数组长度
 * - 柱子高度按百分比计算：(当前值 / 最大值) × 100%，确保自适应缩放
 * - 高亮状态通过 CSS 类名切换，配合 transition 实现颜色渐变动画
 *
 * 【状态管理】
 * - 纯受控组件（Controlled Component），所有状态由 props 驱动
 * - 不使用 useState/useReducer，避免状态同步问题
 * - 每次 props 变更触发重新渲染，React 的 reconciliation 机制保证性能
 *
 * @param props - 组件属性
 * @returns {JSX.Element} 柱状图画布 DOM 元素
 */
const VisualizationCanvas: React.FC<VisualizationCanvasProps> = ({ data, highlightIndices = [] }) => {
  // 计算数组的最大值作为比例尺基准，空数组时默认使用 100 避免除零错误
  // 这确保了无论数据范围如何，最高柱子始终填满容器高度
  const maxValue = data.length > 0 ? Math.max(...data) : 100;

  return (
    <div className="visualization-canvas">
      {/* 
       * 遍历数据数组生成柱状图元素
       * 每根柱子的关键属性：
       * - key: 使用数组索引作为 React 的 reconciliation key
       * - className: 根据是否在高亮索引列表中动态添加 'highlighted' 类
       * - style.height: 按最大值归一化的百分比高度
       * - style.width: 等宽分配，确保所有柱子宽度一致
       */}
      {data.map((value, index) => (
        <div
          key={index}
          className={`bar ${highlightIndices.includes(index) ? 'highlighted' : ''}`}
          style={{
            height: `${(value / maxValue) * 100}%`,
            width: `${100 / data.length}%`,
          }}
        >
          {/* 在柱子内部显示具体数值，便于用户观察数据变化 */}
          {value}
        </div>
      ))}
    </div>
  );
};

export default VisualizationCanvas;