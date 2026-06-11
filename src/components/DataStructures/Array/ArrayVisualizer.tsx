/**
 * @fileoverview 数组可视化展示组件（ArrayVisualizer）
 *
 * 本组件负责将数组数据渲染为可视化的矩形块序列，是数组的"视图层"。
 *
 * 可视化原理：
 * - 使用 Flexbox 水平排列数组元素
 * - 每个元素渲染为一个 48x48 像素的正方形块
 * - 元素块包含边框、背景色和居中显示的值
 * - 支持高亮显示特定位置的元素（用于标记操作位置或搜索结果）
 *
 * 渲染逻辑：
 * 1. 接收 data 数组和 highlightIndices 高亮索引数组作为 props
 * 2. 遍历 data 数组，为每个元素创建一个 div 容器
 * 3. 根据当前索引是否在 highlightIndices 中，动态设置样式类名
 * 4. 高亮元素使用蓝色边框和浅蓝背景，普通元素使用灰色边框和白色背景
 * 5. 使用 CSS transition 实现300毫秒的平滑过渡动画
 */

import React from 'react';

/**
 * ArrayVisualizer 组件的 Props 接口定义
 * @interface ArrayVisualizerProps
 * @property {(number | string)[]} data - 要显示的数组数据，每个元素可以是数字或字符串
 * @property {number[]} highlightIndices - 需要高亮显示的元素索引数组
 */
interface ArrayVisualizerProps {
  data: (number | string)[];
  highlightIndices: number[];
}

/**
 * 数组可视化组件
 *
 * @component
 * @description 将一维数组数据渲染为水平排列的可视化元素块，支持高亮标记
 *
 * @param {ArrayVisualizerProps} props - 组件属性
 * @param {(number | string)[]} props.data - 数组数据
 * @param {number[]} props.highlightIndices - 高亮索引数组
 *
 * @example
 * ```tsx
 * <ArrayVisualizer data={[10, 20, 30]} highlightIndices={[1]} />
 * // 显示三个元素块，第二个元素（值为20）会被高亮
 * ```
 */

const ArrayVisualizer: React.FC<ArrayVisualizerProps> = ({ data, highlightIndices = [] }) => {
  /**
   * 渲染数组可视化
   *
   * DOM 结构说明：
   * - 外层容器：使用 flex 布局，水平居中排列元素块，设置最小高度和内边距
   * - 元素块容器（div）：每个数组元素对应一个方块
   *   - 尺寸：48x48 像素 (w-12 h-12)
   *   - 样式条件判断：
   *     * 如果当前索引在 highlightIndices 中 → 蓝色边框 + 浅蓝背景（高亮状态）
   *     * 否则 → 灰色边框 + 白色背景（普通状态）
   *   - transition-all duration-300：所有样式变化都有300ms过渡动画
   * - 元素值：在方块中心显示元素的具体数值或字符串
   */
  return (
    <div className="flex items-center justify-center space-x-2 min-h-[200px] my-4 p-4 border rounded-lg bg-gray-50">
      {data.map((value, index) => (
        <div
          key={index}
          className={`
            flex items-center justify-center
            w-12 h-12 
            border-2 rounded-lg
            ${highlightIndices.includes(index) 
              ? 'border-blue-500 bg-blue-100' 
              : 'border-gray-300 bg-white'}
            transition-all duration-300
          `}
        >
          {value}
        </div>
      ))}
    </div>
  );
};

export default ArrayVisualizer; 