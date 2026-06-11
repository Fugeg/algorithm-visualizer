/**
 * @fileoverview 链表复杂度分析展示组件（LinkedListComplexity）
 *
 * 本组件负责以表格形式展示链表各种操作的时间复杂度和空间复杂度分析。
 *
 * 展示的操作：
 * - 头部插入 (Prepend): O(1) - 直接修改头指针
 * - 尾部追加 (Append): O(n) - 需要遍历到链表末尾
 * - 指定位置插入: O(n) - 需要遍历到目标位置
 * - 删除: O(n) - 需要找到目标节点的前驱
 * - 搜索: O(n) - 需要顺序遍历整个链表
 */

import React from 'react';

/**
 * 链表复杂度分析组件
 */

const LinkedListComplexity: React.FC = () => {
  const complexityData = [
    { operation: '头部插入', time: 'O(1)', space: 'O(1)', description: '直接修改头指针' },
    { operation: '尾部追加', time: 'O(n)', space: 'O(1)', description: '需要遍历到末尾' },
    { operation: '指定位置插入', time: 'O(n)', space: 'O(1)', description: '需要遍历到指定位置' },
    { operation: '删除', time: 'O(n)', space: 'O(1)', description: '需要遍历到目标位置' },
    { operation: '搜索', time: 'O(n)', space: 'O(1)', description: '需要遍历整个链表' },
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

export default LinkedListComplexity;
