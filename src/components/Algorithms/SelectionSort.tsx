/**
 * 选择排序可视化组件
 *
 * 【可视化策略】
 * 采用 SortingPage 通用排序可视化容器模式。选择排序的核心特征是「每轮选出最小值放到前端」，
 * 可视化重点在于：
 * - 未排序区域中当前最小值的追踪高亮
 * - 最终交换时的两个元素（最小值位置 vs 未排序区首位置）
 * - 已排序区域的逐步扩展（左侧逐渐变有序）
 *
 * 【数据流向】Model → Step → UI
 * 1. 用户输入 → SortingPage 创建 Algorithm Model
 * 2. algo.generateSelectionSortSteps() 生成步骤流
 * 3. Step 包含：minIndex（本轮找到的最小值索引）、currentIndex（当前扫描位置）、swapPair（交换对）
 * 4. UI 用不同颜色标识：已排序区（绿色）、当前最小值（黄色）、扫描指针（蓝色）
 *
 * 【特殊交互设计】
 * - 选择排序的交换次数恒定为 n-1 次，可视化可突出这一特性
 * - 无论输入如何时间复杂度始终为 O(n²)，复杂度表格只列一行
 */
import React from 'react';
import SortingPage from './Sorting/SortingPage';

/**
 * 选择排序可视化页面组件
 *
 * 纯展示型包装组件。选择排序的视觉效果特点是"安静"——
 * 相比冒泡排序的大量相邻交换，选择排序每轮只有一次交换。
 */
const SelectionSort: React.FC = () => (
  <SortingPage
    algorithmType="selection"
    title="选择排序可视化"
    description="选择排序是一种简单直观的排序算法，每次从未排序部分找到最小元素，放到已排序序列的末尾。"
    complexityData={[
      { case: '所有情况', time: 'O(n²)', space: 'O(1)', note: '需要进行 n-1 轮选择，每轮需要扫描未排序部分' },
    ]}
    /* 步骤生成回调：调用 Model 层的选择排序步骤生成方法 */
    generateSteps={(algo) => algo.generateSelectionSortSteps()}
    algorithmNote="选择排序每轮从未排序部分中找到最小元素，将其与未排序部分的第一个元素交换，直到所有元素排序完毕。交换次数最少，但时间复杂度始终为 O(n²)。"
  />
);

export default SelectionSort;
