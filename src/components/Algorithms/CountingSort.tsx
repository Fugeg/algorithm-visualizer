/**
 * 计数排序可视化组件
 *
 * 【可视化策略】
 * 采用 SortingPage 通用排序可视化容器模式。计数排序是非比较型排序，
 * 可视化重点在于：
 * - 计数数组（Count Array）的构建过程：统计每个值的出现次数
 * - 前缀和（Prefix Sum）的计算过程：确定每个值的最终位置范围
 * - 根据计数结果将元素放回原数组的映射过程
 * - 计数数组与原数组的并行展示
 *
 * 【数据流向】Model → Step → UI
 * 1. 用户输入 → SortingPage 创建 Algorithm Model
 * 2. algo.generateCountingSortSteps() 生成步骤流
 * 3. Step 包含：originalArray（原始数组）、countArray（计数数组）、prefixSumArray（前缀和数组）、outputArray（输出数组）、currentPhase（当前阶段标记）
 * 4. UI 层需要同时渲染多个数组，用动画连接计数与输出的关系
 *
 * 【特殊交互设计】
 * - 计数排序是稳定排序，可视化应保持相同值元素的相对顺序
 * - 时间复杂度 O(n+k)，k 为数据范围，适合小范围整数
 * - 复杂度只需一行（所有情况相同），但需标注 k 的含义
 */
import React from 'react';
import SortingPage from './Sorting/SortingPage';

/**
 * 计数排序可视化页面组件
 *
 * 纯展示型包装组件。计数排序的可视化特色是需要同时展示
 * 原数组、计数数组和输出数组三个数据结构之间的关系。
 */
const CountingSort: React.FC = () => (
  <SortingPage
    algorithmType="counting"
    title="计数排序可视化"
    description="计数排序是一种非比较排序算法，通过统计每个值出现的次数来确定元素的最终位置，适合数据范围较小的整数排序。"
    complexityData={[
      { case: '所有情况', time: 'O(n+k)', space: 'O(k)', note: 'k为数据范围' },
    ]}
    /* 步骤生成回调：调用 Model 层的计数排序步骤生成方法 */
    generateSteps={(algo) => algo.generateCountingSortSteps()}
    algorithmNote="计数排序统计每个值出现的次数，然后根据计数确定元素的最终位置。是稳定排序算法，时间复杂度为 O(n+k)，其中 k 为数据范围，适合范围较小的整数排序。"
  />
);

export default CountingSort;
