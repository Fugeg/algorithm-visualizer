import React from 'react';
import SortingPage from './Sorting/SortingPage';

const InsertionSort: React.FC = () => (
  <SortingPage
    algorithmType="insertion"
    title="插入排序可视化"
    description="插入排序通过将未排序元素逐个插入到已排序序列的正确位置来完成排序，对于小规模或基本有序的数据效率很高。"
    complexityData={[
      { case: '最好情况', time: 'O(n)', space: 'O(1)', note: '数组已经有序' },
      { case: '平均情况', time: 'O(n²)', space: 'O(1)', note: '需要部分元素移动' },
      { case: '最坏情况', time: 'O(n²)', space: 'O(1)', note: '数组完全逆序' },
    ]}
    generateSteps={(algo) => algo.generateInsertionSortSteps()}
    algorithmNote="插入排序从第二个元素开始，将每个元素插入到前面已排序序列的正确位置。对于基本有序的数据效率很高，是稳定排序算法。"
  />
);

export default InsertionSort;
