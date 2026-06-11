/**
 * @fileoverview 栈（Stack）数据结构可视化主页面组件
 *
 * 本组件是栈数据结构的顶层容器，负责：
 * 1. 管理栈的元素数组（遵循后进先出 LIFO 原则）
 * 2. 提供栈的核心操作：入栈（Push）、出栈（Pop）、查看栈顶（Peek）
 * 3. 实现操作时的动画效果（高亮显示操作的元素位置）
 * 4. 限制栈的最大容量为10个元素，防止溢出
 *
 * 可视化方式：
 * - 使用垂直堆叠的矩形块展示栈元素
 * - 栈底在下方，栈顶在上方（符合物理直觉）
 * - 新元素从顶部压入，从顶部弹出
 *
 * 操作类型：
 * - Push: 将新元素压入栈顶（时间复杂度 O(1)）
 * - Pop: 移除并返回栈顶元素（时间复杂度 O(1)）
 * - Peek: 查看栈顶元素但不移除（时间复杂度 O(1)）
 *
 * 特点：本组件直接管理栈的状态（非观察者模式），使用简单的数组实现
 */

import React, { useState } from 'react';
import DataStructureLayout from '../Layout/DataStructureLayout';
import StackVisualizer from './Stack/StackVisualizer';

/**
 * 栈元素接口定义
 * @interface StackItem
 * @property {number} value - 元素存储的数值
 */
interface StackItem {
  value: number;
}

/**
 * 栈主页面组件
 *
 * @component
 * @description 提供栈的完整交互界面，支持动态演示元素的入栈和出栈过程
 *
 * @example
 * ```tsx
 * <Stack />
 * ```
 */

const Stack: React.FC = () => {
  /** 栈的最大容量限制，防止无限增长 */
  const maxSize = 10;

  /**
   * 管理栈中的元素数组
   * 数组末尾代表栈顶，数组开头代表栈底
   * 使用 push/pop 操作实现 O(1) 时间复杂度的入栈和出栈
   */
  const [items, setItems] = useState<StackItem[]>([]);

  /** 用户输入的要压入栈的值 */
  const [inputValue, setInputValue] = useState<string>('');

  /**
   * 管理需要高亮显示的元素索引数组
   * 用于在操作时提供视觉反馈：
   * - 入栈时高亮新添加的元素（最后一个元素）
   * - 出栈或查看时高亮栈顶元素
   */
  const [highlightIndices, setHighlightIndices] = useState<number[]>([]);

  /**
   * 处理入栈操作（Push）
   *
   * 操作逻辑：
   * 1. 验证输入值是否为有效数字
   * 2. 检查栈是否已满（达到 maxSize）
   * 3. 将新元素添加到数组末尾（栈顶）
   * 4. 高亮新元素500毫秒后取消高亮
   *
   * 可视化效果：新元素出现在栈顶位置并闪烁高亮
   */
    const value = parseInt(inputValue);
    if (isNaN(value)) {
      alert('请输入有效数字');
      return;
    }
    if (items.length >= maxSize) {
      alert('栈已满');
      return;
    }
    setItems([...items, { value }]);
    setInputValue('');
    setHighlightIndices([items.length]); // 高亮新添加的元素
    setTimeout(() => setHighlightIndices([]), 500); // 500ms 后取消高亮
  };

  /**
   * 处理出栈操作（Pop）
   *
   * 操作逻辑：
   * 1. 检查栈是否为空
   * 2. 先高亮栈顶元素（视觉反馈）
   * 3. 延迟500毫秒后移除栈顶元素（让用户看到被弹出的元素）
   *
   * 可视化效果：栈顶元素闪烁后被移除，下方元素上移
   */
  const handlePop = () => {
    if (items.length === 0) {
      alert('栈为空');
      return;
    }
    setHighlightIndices([items.length - 1]); // 高亮要移除的元素
    setTimeout(() => {
      setItems(items.slice(0, -1));
      setHighlightIndices([]);
    }, 500);
  };

  /**
   * 处理查看栈顶操作（Peek）
   *
   * 操作逻辑：
   * 1. 检查栈是否为空
   * 2. 高亮栈顶元素500毫秒（只查看不移除）
   *
   * 可视化效果：栈顶元素短暂闪烁，帮助用户识别当前栈顶
   */
  const handlePeek = () => {
    if (items.length === 0) {
      alert('栈为空');
      return;
    }
    setHighlightIndices([items.length - 1]); // 高亮栈顶元素
    setTimeout(() => setHighlightIndices([]), 500); // 500ms 后取消高亮
  };

  return (
    <DataStructureLayout
      title="栈"
      visualization={
        <StackVisualizer 
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
            onKeyPress={(e) => e.key === 'Enter' && handlePush()}
          />
          <button
            onClick={handlePush}
            className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            入栈 (Push)
          </button>
          <button
            onClick={handlePop}
            className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            出栈 (Pop)
          </button>
          <button
            onClick={handlePeek}
            className="px-4 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            查看栈顶 (Peek)
          </button>
        </div>
      }
      features={{
        title: "栈特点",
        items: [
          "后进先出 (LIFO)",
          "只能从顶部添加或删除元素",
          "可以快速查看顶部元素",
          "适用于函数调用、表达式求值等"
        ]
      }}
      complexity={{
        title: "性能分析",
        items: [
          { operation: "入栈 (Push)", timeComplexity: "O(1)", spaceComplexity: "O(1)", description: "在栈顶添加元素" },
          { operation: "出栈 (Pop)", timeComplexity: "O(1)", spaceComplexity: "O(1)", description: "移除栈顶元素" },
          { operation: "查看栈顶 (Peek)", timeComplexity: "O(1)", spaceComplexity: "O(1)", description: "访问栈顶元素" },
          { operation: "判空/判满", timeComplexity: "O(1)", spaceComplexity: "O(1)", description: "检查栈的状态" }
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

export default Stack;
