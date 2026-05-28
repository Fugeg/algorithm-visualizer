import React from 'react';
import SortingPage from './Sorting/SortingPage';

const ShellSort: React.FC = () => (
  <SortingPage
    algorithmType="shell"
    title="希尔排序可视化"
    description="希尔排序是插入排序的改进版本，通过按增量序列对元素进行分组插入排序，逐步缩小增量直到为1。"
    complexityData={[
      { case: '最好情况', time: 'O(n log n)', space: 'O(1)', note: '数组基本有序' },
      { case: '平均情况', time: 'O(n^1.3)', space: 'O(1)', note: '取决于间隔序列' },
      { case: '最坏情况', time: 'O(n²)', space: 'O(1)', note: '不好的间隔序列' },
    ]}
    generateSteps={(algo) => algo.generateShellSortSteps()}
    algorithmNote="希尔排序按增量序列将元素分组，对每组进行插入排序，然后逐步缩小增量。增量序列的选择对性能影响很大，是不稳定排序算法。"
  />
);

export default ShellSort;
