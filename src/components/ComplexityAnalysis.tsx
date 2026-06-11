/**
 * @fileoverview 算法复杂度分析展示组件
 * @description 用于显示算法的时间和空间复杂度信息，帮助用户理解算法的性能特征。
 *              通常在算法可视化页面的侧边栏或底部展示，提供理论复杂度分析数据。
 */

import React from 'react';

/**
 * ComplexityAnalysis组件属性接口
 * @interface ComplexityAnalysisProps
 * @property timeComplexity - 时间复杂度表示（如 'O(n²)', 'O(n log n)' 等）
 * @property spaceComplexity - 空间复杂度表示（如 'O(1)', 'O(n)' 等）
 */
interface ComplexityAnalysisProps {
  timeComplexity: string;
  spaceComplexity: string;
}

/**
 * 复杂度分析展示组件
 * @param props - 组件属性：timeComplexity（时间复杂度）、spaceComplexity（空间复杂度）
 * @description 以卡片形式展示算法的时间复杂度和空间复杂度，
 *              使用简洁的布局呈现关键性能指标
 */
const ComplexityAnalysis: React.FC<ComplexityAnalysisProps> = ({ timeComplexity, spaceComplexity }) => {
  return (
    <div className="bg-gray-100 p-4 rounded">
      <h3 className="text-lg font-semibold mb-2">Complexity Analysis</h3>
      {/* 时间复杂度：衡量算法执行时间随输入规模增长的趋势 */}
      <p><strong>Time Complexity:</strong> {timeComplexity}</p>
      {/* 空间复杂度：衡量算法所需额外内存空间随输入规模增长的趋势 */}
      <p><strong>Space Complexity:</strong> {spaceComplexity}</p>
    </div>
  );
};

export default ComplexityAnalysis;