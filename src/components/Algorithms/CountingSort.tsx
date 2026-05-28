import React from 'react';
import SortingPage from './Sorting/SortingPage';

const CountingSort: React.FC = () => (
  <SortingPage
    algorithmType="counting"
    title="计数排序可视化"
    description="计数排序是一种非比较排序算法，通过统计每个值出现的次数来确定元素的最终位置，适合数据范围较小的整数排序。"
    complexityData={[
      { case: '所有情况', time: 'O(n+k)', space: 'O(k)', note: 'k为数据范围' },
    ]}
    generateSteps={(algo) => algo.generateCountingSortSteps()}
    algorithmNote="计数排序统计每个值出现的次数，然后根据计数确定元素的最终位置。是稳定排序算法，时间复杂度为 O(n+k)，其中 k 为数据范围，适合范围较小的整数排序。"
  />
);

export default CountingSort;
