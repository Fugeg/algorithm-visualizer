/**
 * @fileoverview 队列可视化展示组件（QueueVisualizer）
 *
 * 本组件负责将队列数据渲染为水平排列的元素序列，模拟真实的队列结构。
 *
 * 可视化原理：
 * - 使用水平 Flexbox 布局，队首在左方，队尾在右方
 * - 每个元素显示位置标签（Front/Rear/Index）和值
 * - 队首使用绿色边框标记，队尾使用黄色边框标记
 * - 元素之间使用箭头图标表示入队方向
 *
 * 渲染逻辑：
 * 1. 遍历 items 数组，为每个元素创建容器
 * 2. 在相邻元素之间渲染右箭头（最后一个元素后不渲染）
 * 3. 根据索引判断是否为 front 或 rear，应用特殊边框颜色
 * 4. 底部显示 Front 和 Rear 指针的当前值
 */

import React from 'react';
import { FiArrowRight } from 'react-icons/fi';

/** QueueVisualizer 组件的 Props 接口定义 */
interface QueueVisualizerProps {
  items: any[];
  highlightIndices: number[];
  front: number;
  rear: number;
}

/**
 * 队列可视化组件
 */

const QueueVisualizer: React.FC<QueueVisualizerProps> = ({ 
  items, 
  highlightIndices = [], 
  front, 
  rear 
}) => {
  return (
    <div className="flex flex-col items-center space-y-8 min-h-[300px] my-4 p-4 border rounded-lg bg-gray-50">
      {/* 队列元素 */}
      <div className="flex items-center justify-start space-x-4 overflow-x-auto w-full">
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            {index < items.length - 1 && (
              <div className="flex items-center mx-2">
                <FiArrowRight className="text-blue-500" />
              </div>
            )}
            <div
              className={`
                flex flex-col items-center justify-center
                w-24 h-16
                border-2 rounded-lg
                ${highlightIndices.includes(index)
                  ? 'border-blue-500 bg-blue-100'
                  : 'border-gray-300 bg-white'}
                ${index === front ? 'border-green-500' : ''}
                ${index === rear ? 'border-yellow-500' : ''}
                transition-all duration-300
              `}
            >
              <span className="text-sm text-gray-500">
                {index === front ? 'Front' : index === rear ? 'Rear' : `Index ${index}`}
              </span>
              <span className="font-bold">{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 队列为空时的提示 */}
      {items.length === 0 && (
        <div className="text-gray-500 text-center w-full">
          空队列
        </div>
      )}

      {/* 队列指示器 */}
      <div className="flex justify-between w-full px-8">
        <div className="text-sm text-green-600">Front: {front}</div>
        <div className="text-sm text-yellow-600">Rear: {rear}</div>
      </div>
    </div>
  );
};

export default QueueVisualizer;
