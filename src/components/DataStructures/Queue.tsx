/**
 * @fileoverview 队列（Queue）数据结构可视化主页面组件
 *
 * 本组件是队列数据结构的顶层容器，负责：
 * 1. 管理队列的元素数组（遵循先进先出 FIFO 原则）
 * 2. 提供队列的核心操作：入队（Enqueue）、出队（Dequeue）、查看队首（Peek）
 * 3. 实现操作时的动画效果（高亮显示操作的元素位置）
 * 4. 限制队列的最大容量为10个元素，防止溢出
 *
 * 可视化方式：
 * - 使用水平排列的矩形块展示队列元素
 * - 队首在左方，队尾在右方（符合从左到右的阅读习惯）
 * - 新元素从右端入队，从左端出队
 *
 * 操作类型：
 * - Enqueue: 将新元素添加到队尾（时间复杂度 O(1)）
 * - Dequeue: 移除并返回队首元素（时间复杂度 O(1)）
 * - Peek: 查看队首元素但不移除（时间复杂度 O(1)）
 *
 * 特点：本组件直接管理队列的状态（非观察者模式），使用简单的数组实现
 */

import React, { useState } from 'react';
import DataStructureLayout from '../Layout/DataStructureLayout';
import QueueVisualizer from './Queue/QueueVisualizer';

/**
 * 队列元素接口定义
 * @interface QueueItem
 * @property {number} value - 元素存储的数值
 */
interface QueueItem {
  value: number;
}

/**
 * 队列主页面组件
 *
 * @component
 * @description 提供队列的完整交互界面，支持动态演示元素的入队和出队过程
 *
 * @example
 * ```tsx
 * <Queue />
 * ```
 */

const Queue: React.FC = () => {
  /** 队列的最大容量限制，防止无限增长 */
  const maxSize = 10;

  /**
   * 管理队列中的元素数组
   * 数组开头代表队首，数组末尾代表队尾
   * 使用 shift 操作出队（O(n)），push 操作入队（O(1)）
   */
  const [items, setItems] = useState<QueueItem[]>([]);

  /** 用户输入的要入队的值 */
  const [inputValue, setInputValue] = useState<string>('');

  /**
   * 管理需要高亮显示的元素索引数组
   * 用于在操作时提供视觉反馈：
   * - 入队时高亮新添加的元素（最后一个元素）
   * - 出队或查看时高亮队首元素（第一个元素）
   */
  const [highlightIndices, setHighlightIndices] = useState<number[]>([]);

  /**
   * 处理入队操作（Enqueue）
   *
   * 操作逻辑：
   * 1. 验证输入值是否为有效数字
   * 2. 检查队列是否已满（达到 maxSize）
   * 3. 将新元素添加到数组末尾（队尾）
   * 4. 高亮新元素500毫秒后取消高亮
   *
   * 可视化效果：新元素出现在队尾位置并闪烁高亮
   */
    const value = parseInt(inputValue);
    if (isNaN(value)) {
      alert('请输入有效数字');
      return;
    }
    if (items.length >= maxSize) {
      alert('队列已满');
      return;
    }
    setItems([...items, { value }]);
    setInputValue('');
    setHighlightIndices([items.length]); // 高亮新添加的元素
    setTimeout(() => setHighlightIndices([]), 500); // 500ms 后取消高亮
  };

  /**
   * 处理出队操作（Dequeue）
   *
   * 操作逻辑：
   * 1. 检查队列是否为空
   * 2. 先高亮队首元素（视觉反馈）
   * 3. 延迟500毫秒后移除队首元素（让用户看到被移除的元素）
   *
   * 可视化效果：队首元素闪烁后被移除，剩余元素左移
   */
  const handleDequeue = () => {
    if (items.length === 0) {
      alert('队列为空');
      return;
    }
    setHighlightIndices([0]); // 高亮要移除的元素
    setTimeout(() => {
      setItems(items.slice(1));
      setHighlightIndices([]);
    }, 500);
  };

  /**
   * 处理查看队首操作（Peek）
   *
   * 操作逻辑：
   * 1. 检查队列是否为空
   * 2. 高亮队首元素500毫秒（只查看不移除）
   *
   * 可视化效果：队首元素短暂闪烁，帮助用户识别当前队首
   */
  const handlePeek = () => {
    if (items.length === 0) {
      alert('队列为空');
      return;
    }
    setHighlightIndices([0]); // 高亮队首元素
    setTimeout(() => setHighlightIndices([]), 500); // 500ms 后取消高亮
  };

  return (
    <DataStructureLayout
      title="队列"
      visualization={
        <QueueVisualizer 
          items={items}
          highlightIndices={highlightIndices}
          maxSize={maxSize}
        />
      }
      operations={
        <div className="flex items-center gap-4 w-full max-w-2xl justify-center p-4">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入值"
            className="border rounded px-3 py-1 w-28"
            onKeyPress={(e) => e.key === 'Enter' && handleEnqueue()}
          />
          <button
            onClick={handleEnqueue}
            className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            入队 (Enqueue)
          </button>
          <button
            onClick={handleDequeue}
            className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            出队 (Dequeue)
          </button>
          <button
            onClick={handlePeek}
            className="px-4 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            查看队首 (Peek)
          </button>
        </div>
      }
      features={{
        title: "队列特点",
        items: [
          "先进先出 (FIFO)",
          "只能从队尾添加元素",
          "只能从队首删除元素",
          "适用于任务调度、消息队列等"
        ]
      }}
      complexity={{
        title: "性能分析",
        items: [
          { operation: "入队 (Enqueue)", timeComplexity: "O(1)", spaceComplexity: "O(1)", description: "在队尾添加元素" },
          { operation: "出队 (Dequeue)", timeComplexity: "O(1)", spaceComplexity: "O(1)", description: "移除队首元素" },
          { operation: "查看队首 (Peek)", timeComplexity: "O(1)", spaceComplexity: "O(1)", description: "访问队首元素" },
          { operation: "判空", timeComplexity: "O(1)", spaceComplexity: "O(1)", description: "检查队列状态" }
        ],
        summary: {
          bestCase: "O(1)",
          averageCase: "O(1)",
          worstCase: "O(1)",
          spaceComplexity: "O(n)"
        }
      }}
    />
  );
};

export default Queue;
