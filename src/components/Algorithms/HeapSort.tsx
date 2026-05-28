import React from 'react';
import SortingPage from './Sorting/SortingPage';

const HeapSort: React.FC = () => (
  <SortingPage
    algorithmType="heap"
    title="堆排序可视化"
    description="堆排序利用堆数据结构进行排序，先将序列构建成最大堆，然后反复取出堆顶元素并调整堆，时间复杂度稳定为 O(n log n)。"
    complexityData={[
      { case: '所有情况', time: 'O(n log n)', space: 'O(1)', note: '稳定的时间复杂度' },
    ]}
    generateSteps={(algo) => algo.generateHeapSortSteps()}
    algorithmNote="堆排序先将序列构建成最大堆，然后将堆顶元素（最大值）与末尾交换，对剩余元素重新调整堆，重复直到排序完成。是不稳定排序算法，空间效率高。"
  />
);

export default HeapSort;
