/**
 * @fileoverview 链表可视化展示组件（LinkedListVisualizer）
 *
 * 本组件负责将链表节点数据渲染为带箭头连接的可视化序列，是链表的"视图层"。
 *
 * 可视化原理：
 * - 使用 Flexbox 水平排列链表节点
 * - 每个节点渲染为 64x64 像素的方块，显示节点索引和值
 * - 节点之间使用箭头图标（FiArrowRight）表示指针指向关系
 * - 支持高亮显示特定位置的节点（用于标记操作位置）
 *
 * 渲染逻辑：
 * 1. 接收 nodes 节点数组和 highlightIndices 高亮索引数组
 * 2. 遍历 nodes 数组，为每个节点创建容器（包含值和标签）
 * 3. 在每对相邻节点之间渲染箭头图标（最后一个节点后不渲染）
 * 4. 空链表时显示"空链表"提示文本
 * 5. 容器支持水平滚动（overflow-x-auto），适应长链表
 */

import React from 'react';
import { FiArrowRight } from 'react-icons/fi';

/**
 * 链表节点数据接口定义
 * @interface LinkedListNodeData
 * @property {number | string} value - 节点存储的值
 */
interface LinkedListNodeData {
  value: number | string;
}

/**
 * LinkedListVisualizer 组件的 Props 接口定义
 * @interface LinkedListVisualizerProps
 * @property {LinkedListNodeData[]} nodes - 链表节点数据数组
 * @property {number[]} highlightIndices - 需要高亮的节点索引数组
 */
interface LinkedListVisualizerProps {
  nodes: LinkedListNodeData[];
  highlightIndices: number[];
}

/**
 * 链表可视化组件
 *
 * @component
 * @description 将链表数据渲染为带箭头的节点序列，支持高亮标记
 */

const LinkedListVisualizer: React.FC<LinkedListVisualizerProps> = ({ nodes, highlightIndices = [] }) => {
  return (
    <div className="flex items-center justify-start space-x-4 overflow-x-auto min-h-[200px] my-4 p-4 border rounded-lg bg-gray-50">
      {nodes.map((node, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`
              flex flex-col items-center justify-center
              w-16 h-16
              border-2 rounded-lg
              ${highlightIndices.includes(index)
                ? 'border-blue-500 bg-blue-100'
                : 'border-gray-300 bg-white'}
              transition-all duration-300
            `}
          >
            <span className="text-sm text-gray-500">Node {index}</span>
            <span className="font-bold">{node.value}</span>
          </div>
          {index < nodes.length - 1 && (
            <div className="flex items-center mx-2">
              <FiArrowRight className="text-blue-500" />
            </div>
          )}
        </div>
      ))}
      {nodes.length === 0 && (
        <div className="text-gray-500 text-center w-full">
          空链表
        </div>
      )}
    </div>
  );
};

export default LinkedListVisualizer;
