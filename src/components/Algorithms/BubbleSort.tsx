import React from 'react';
import SortingPage from './Sorting/SortingPage';

const BubbleSort: React.FC = () => (
  <SortingPage
    algorithmType="bubble"
    title="冒泡排序可视化"
    description="冒泡排序是一种简单的排序算法，通过重复遍历待排序序列，依次比较相邻元素并交换顺序错误的元素对，直到序列有序。"
    complexityData={[
      { case: '最好情况', time: 'O(n)', space: 'O(1)', note: '数组已经有序' },
      { case: '平均情况', time: 'O(n²)', space: 'O(1)', note: '需要部分元素交换' },
      { case: '最坏情况', time: 'O(n²)', space: 'O(1)', note: '数组完全逆序' },
    ]}
    generateSteps={(algo) => algo.generateBubbleSortSteps()}
    algorithmNote="冒泡排序通过重复遍历序列，比较相邻元素并在顺序错误时交换它们。每轮遍历会将当前未排序部分的最大值「冒泡」到正确位置，直到整个序列有序。"
  />
);

export default BubbleSort;
