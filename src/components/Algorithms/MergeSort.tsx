/**
 * 归并排序可视化组件
 *
 * 【可视化策略】
 * 采用 SortingPage 通用排序可视化容器模式。归并排序是典型的分治算法，
 * 可视化重点在于：
 * - 分解阶段：数组被递归地二分为子数组
 * - 合并阶段：两个有序子数组的合并过程（双指针比较）
 * - 临时辅助数组的占用情况展示
 *
 * 【数据流向】Model → Step → UI
 * 1. 用户输入 → SortingPage 创建 Algorithm Model
 * 2. algo.generateMergeSortSteps() 生成步骤流（包含分解和合并两个阶段）
 * 3. Step 包含：leftRange（左子数组范围）、rightRange（右子数组范围）、mergePoint（合并进度）、tempArray（临时数组快照）
 * 4. UI 层可用嵌套区块表示子数组归属关系，合并时展示双指针移动
 *
 * 【特殊交互设计】
 * - 归并排序是稳定排序且时间复杂度恒定 O(n log n)，复杂度只需一行
 * - 需要额外 O(n) 空间，可视化可展示辅助数组的使用
 * - 分治结构天然适合递归树形式的辅助展示
 */
import React from 'react';
import SortingPage from './Sorting/SortingPage';

/**
 * 归并排序可视化页面组件
 *
 * 纯展示型包装组件。归并排序的可视化挑战在于同时展示
 * 分治的层次结构和合并的双指针过程。
 */
const MergeSort: React.FC = () => (
  <SortingPage
    algorithmType="merge"
    title="归并排序可视化"
    description="归并排序是一种分治算法，将序列递归地分成两半，分别排序后再合并，时间复杂度稳定为 O(n log n)。"
    complexityData={[
      { case: '所有情况', time: 'O(n log n)', space: 'O(n)', note: '稳定的时间复杂度' },
    ]}
    /* 步骤生成回调：调用 Model 层的归并排序步骤生成方法 */
    generateSteps={(algo) => algo.generateMergeSortSteps()}
    algorithmNote="归并排序将序列递归地分成两半，分别排序后再将两个有序子序列合并。是稳定排序算法，时间复杂度始终为 O(n log n)，但需要额外的 O(n) 空间。"
  />
);

export default MergeSort;
