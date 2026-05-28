import React from 'react';
import SortingPage from './Sorting/SortingPage';

const RadixSort: React.FC = () => (
  <SortingPage
    algorithmType="radix"
    title="基数排序可视化"
    description="基数排序是一种非比较排序算法，按位数从低到高依次对元素进行排序，适合整数或字符串排序。"
    complexityData={[
      { case: '所有情况', time: 'O(nk)', space: 'O(n+k)', note: 'k为基数，n为元素个数' },
    ]}
    generateSteps={(algo) => algo.generateRadixSortSteps()}
    algorithmNote="基数排序从最低位开始，对每一位进行计数排序，依次处理更高位直到最高位。是稳定排序算法，时间复杂度为 O(nk)，适合位数较少的整数排序。"
  />
);

export default RadixSort;
