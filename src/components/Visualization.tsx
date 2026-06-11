import React from 'react';

/**
 * @deprecated 此组件为占位实现，已被各数据结构模块的专用可视化组件替代。
 * 请使用 DataStructures 目录下的具体可视化组件（如 ArrayVisualizer、LinkedListVisualizer 等）。
 *
 * @description 通用数据结构可视化容器的废弃版本。
 *              原本用于统一展示不同类型的数据结构（数组、链表、栈、队列、树、图、哈希表），
 *              但由于各数据结构的可视化需求差异较大，已拆分为独立的专用组件。
 *              此组件现在仅显示弃用警告，引导开发者使用正确的专用组件。
 */

/**
 * Visualization组件属性接口（已废弃）
 * @interface VisualizationProps
 * @property data - 要可视化的数据（任意类型）
 * @property type - 数据结构类型标识
 */
interface VisualizationProps {
  data: any;
  type: 'array' | 'linkedList' | 'stack' | 'queue' | 'binaryTree' | 'graph' | 'hashTable';
}

/**
 * 通用可视化组件（已弃用）
 * @param props - 组件属性：data（数据）、type（数据结构类型）
 * @description 显示弃用提示，并在控制台输出警告信息，
 *              引导开发者迁移到对应的专用可视化组件
 */
const Visualization: React.FC<VisualizationProps> = ({ data, type }) => {
  // 在控制台输出弃用警告，包含当前使用的类型信息，便于定位需要迁移的代码
  console.warn(`[Visualization] 此组件已弃用，type="${type}" 应使用对应的专用可视化组件`);
  
  return (
    <div className="border rounded p-4 bg-yellow-50 text-center text-gray-500">
      <p>通用可视化组件已弃用</p>
      <p className="text-sm">请使用 {type} 对应的专用可视化组件</p>
    </div>
  );
};

export default Visualization;
