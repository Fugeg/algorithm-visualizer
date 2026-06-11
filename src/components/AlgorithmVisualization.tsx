import React from 'react';

/**
 * @deprecated 此组件为占位实现。
 * 算法可视化功能已分散到各具体算法组件中（如 Sorting/ 目录下的排序算法组件、
 * AlgorithmsPage 中的递归/回溯/贪心/DP 算法组件）。
 * 
 * @description 历史遗留的通用算法可视化容器，现已弃用。
 *              实际的算法可视化功能已迁移到各个具体的算法子模块中实现，
 *              以提供更专业和针对性的可视化效果。此组件仅保留用于向后兼容，
 *              新代码不应引用此组件。
 */
const AlgorithmVisualization: React.FC = () => {
  return (
    <div className="p-8 text-center text-gray-400">
      <p>算法可视化功能请通过「算法」页面访问各具体算法模块</p>
    </div>
  );
};

export default AlgorithmVisualization;
