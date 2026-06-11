/**
 * @fileoverview 数组复杂度分析展示组件（ArrayComplexity）
 *
 * 本组件负责以表格形式展示数组各种操作的时间复杂度和空间复杂度分析。
 *
 * 功能说明：
 * - 展示数组4种核心操作的复杂度信息：访问、插入、删除、搜索
 * - 使用 HTML <table> 元素渲染结构化的复杂度数据
 * - 提供每个操作的简要说明，帮助用户理解复杂度的来源
 *
 * 数据结构：
 * - complexityData: 复杂度数据数组，每项包含：
 *   - operation: 操作名称（中文）
 *   - time: 时间复杂度（大O表示法）
 *   - space: 空间复杂度（大O表示法）
 *   - description: 操作说明（解释为什么是这个复杂度）
 *
 * UI 设计：
 * - 表头使用灰色背景（bg-gray-50）和 uppercase 文字样式
 * - 数据行使用分隔线（divide-y divide-gray-200）区分
 * - 整体容器有圆角边框和阴影效果
 */

import React from 'react';

/**
 * 数组复杂度分析组件
 *
 * @component
 * @description 以表格形式展示数组操作的时间/空间复杂度分析
 *
 * @example
 * ```tsx
 * <ArrayComplexity />
 * ```
 */

const ArrayComplexity: React.FC = () => {
  const complexityData = [
    { operation: '访问', time: 'O(1)', space: 'O(1)', description: '通过索引直接访问' },
    { operation: '插入', time: 'O(n)', space: 'O(1)', description: '需要移动后续元素' },
    { operation: '删除', time: 'O(n)', space: 'O(1)', description: '需要移动后续元素' },
    { operation: '搜索', time: 'O(n)', space: 'O(1)', description: '需要遍历整个数组' },
  ];

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">复杂度分析</h3>
      <table className="min-w-full bg-white border rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间复杂度</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">空间复杂度</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">说明</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {complexityData.map((item, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.operation}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.time}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.space}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ArrayComplexity; 