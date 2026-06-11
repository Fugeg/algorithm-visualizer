/**
 * 快速排序可视化组件
 *
 * 【可视化策略】
 * 采用 SortingPage 通用排序可视化容器模式。快速排序基于分治法的划分（Partition）操作，
 * 可视化重点在于：
 * - 基准元素（pivot）的高亮标识及其在划分过程中的角色
 * - 划分过程的动态展示：小于 pivot 的移向左侧，大于 pivot 的移向右侧
 * - 递归深度和子问题的范围变化
 *
 * 【数据流向】Model → Step → UI
 * 1. 用户输入 → SortingPage 创建 Algorithm Model
 * 2. algo.generateQuickSortSteps() 生成步骤流
 * 3. Step 包含：pivotIndex（基准位置）、leftPtr（左指针）、rightPtr（右指针）、range（当前处理范围）
 * 4. UI 层用颜色区分：< pivot 区、= pivot（基准）、> pivot 区
 *
 * 【特殊交互设计】
 * - 快速排序有三种复杂度情况（取决于 pivot 选择），完整展示三种场景
 * - 不稳定排序的特性可通过相等元素的相对位置变化观察
 * - 最坏情况 O(n²) 可通过特定输入（如已排序数组+首元素作 pivot）触发演示
 */
import React from 'react';
import SortingPage from './Sorting/SortingPage';

/**
 * 快速排序可视化页面组件
 *
 * 纯展示型包装组件。快速排序的可视化核心是 Partition 操作——
 * 围绕 pivot 元素重新排列数组的过程最为关键。
 */
const QuickSort: React.FC = () => (
  <SortingPage
    algorithmType="quick"
    title="快速排序可视化"
    description="快速排序使用分治法策略，选择基准元素将序列分为两部分，递归地对子序列进行排序，是实践中最常用的排序算法之一。"
    complexityData={[
      { case: '最好情况', time: 'O(n log n)', space: 'O(log n)', note: '每次划分都平均' },
      { case: '平均情况', time: 'O(n log n)', space: 'O(log n)', note: '大部分划分较为平均' },
      { case: '最坏情况', time: 'O(n²)', space: 'O(n)', note: '每次划分都极不平均' },
    ]}
    /* 步骤生成回调：调用 Model 层的快速排序步骤生成方法 */
    generateSteps={(algo) => algo.generateQuickSortSteps()}
    algorithmNote="快速排序选择一个基准元素（pivot），将小于基准的元素放在左边，大于基准的放在右边，然后递归地对左右子序列进行排序。平均性能优秀，但不稳定。"
  />
);

export default QuickSort;
