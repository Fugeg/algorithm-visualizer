import React from 'react';
import SortingPage from './Sorting/SortingPage';

const MergeSort: React.FC = () => (
  <SortingPage
    algorithmType="merge"
    title="归并排序可视化"
    description="归并排序是一种分治算法，将序列递归地分成两半，分别排序后再合并，时间复杂度稳定为 O(n log n)。"
    complexityData={[
      { case: '所有情况', time: 'O(n log n)', space: 'O(n)', note: '稳定的时间复杂度' },
    ]}
    generateSteps={(algo) => algo.generateMergeSortSteps()}
    algorithmNote="归并排序将序列递归地分成两半，分别排序后再将两个有序子序列合并。是稳定排序算法，时间复杂度始终为 O(n log n)，但需要额外的 O(n) 空间。"
  />
);

export default MergeSort;
