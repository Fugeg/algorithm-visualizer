import React from 'react';
import SortingPage from './Sorting/SortingPage';

const SelectionSort: React.FC = () => (
  <SortingPage
    algorithmType="selection"
    title="选择排序可视化"
    description="选择排序是一种简单直观的排序算法，每次从未排序部分找到最小元素，放到已排序序列的末尾。"
    complexityData={[
      { case: '所有情况', time: 'O(n²)', space: 'O(1)', note: '需要进行 n-1 轮选择，每轮需要扫描未排序部分' },
    ]}
    generateSteps={(algo) => algo.generateSelectionSortSteps()}
    algorithmNote="选择排序每轮从未排序部分中找到最小元素，将其与未排序部分的第一个元素交换，直到所有元素排序完毕。交换次数最少，但时间复杂度始终为 O(n²)。"
  />
);

export default SelectionSort;
