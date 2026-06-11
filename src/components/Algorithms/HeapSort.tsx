/**
 * 堆排序可视化组件
 *
 * 【可视化策略】
 * 采用 SortingPage 通用排序可视化容器模式。堆排序利用堆数据结构进行排序，
 * 可视化重点在于：
 * - 堆构建（Heapify）过程的动态展示：从最后一个非叶子节点开始逐层调整
 * - 堆顶元素（最大值）与末尾元素的交换及堆的重新调整（Sift Down）
 * - 堆结构的层级关系与数组索引的对应关系
 *
 * 【数据流向】Model → Step → UI
 * 1. 用户输入 → SortingPage 创建 Algorithm Model
 * 2. algo.generateHeapSortSteps() 生成步骤流（包含建堆和排序两个阶段）
 * 3. Step 包含：heapArray（当前堆状态）、heapSize（当前堆大小）、swapPair、siftIndex（调整位置）
 * 4. UI 层可用柱状图展示数组，同时用连线或颜色暗示堆的父子关系
 *
 * 【特殊交互设计】
 * - 堆排序时间复杂度恒定 O(n log n)，复杂度只需一行
 * - 原地排序（O(1) 额外空间）是其优势，可视化可强调无辅助数组
 * - 不稳定排序的特性可通过相等元素的位置变化观察
 */
import React from 'react';
import SortingPage from './Sorting/SortingPage';

/**
 * 堆排序可视化页面组件
 *
 * 纯展示型包装组件。堆排序的可视化挑战在于同时展示
 * 数组的线性存储结构和堆的逻辑树形结构。
 */
const HeapSort: React.FC = () => (
  <SortingPage
    algorithmType="heap"
    title="堆排序可视化"
    description="堆排序利用堆数据结构进行排序，先将序列构建成最大堆，然后反复取出堆顶元素并调整堆，时间复杂度稳定为 O(n log n)。"
    complexityData={[
      { case: '所有情况', time: 'O(n log n)', space: 'O(1)', note: '稳定的时间复杂度' },
    ]}
    /* 步骤生成回调：调用 Model 层的堆排序步骤生成方法 */
    generateSteps={(algo) => algo.generateHeapSortSteps()}
    algorithmNote="堆排序先将序列构建成最大堆，然后将堆顶元素（最大值）与末尾交换，对剩余元素重新调整堆，重复直到排序完成。是不稳定排序算法，空间效率高。"
  />
);

export default HeapSort;
