import React from 'react';
import SortingPage from './Sorting/SortingPage';

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
    generateSteps={(algo) => algo.generateQuickSortSteps()}
    algorithmNote="快速排序选择一个基准元素（pivot），将小于基准的元素放在左边，大于基准的放在右边，然后递归地对左右子序列进行排序。平均性能优秀，但不稳定。"
  />
);

export default QuickSort;
