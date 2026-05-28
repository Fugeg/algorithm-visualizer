import React from 'react';
import SortingPage from './Sorting/SortingPage';

const BucketSort: React.FC = () => (
  <SortingPage
    algorithmType="bucket"
    title="桶排序可视化"
    description="桶排序将元素分配到有限数量的桶中，每个桶分别排序后再合并，适合数据分布均匀的场景。"
    complexityData={[
      { case: '最好情况', time: 'O(n+k)', space: 'O(n+k)', note: '数据均匀分布' },
      { case: '平均情况', time: 'O(n+k)', space: 'O(n+k)', note: 'k为桶的数量' },
      { case: '最坏情况', time: 'O(n²)', space: 'O(n+k)', note: '所有元素在同一个桶' },
    ]}
    generateSteps={(algo) => algo.generateBucketSortSteps()}
    algorithmNote="桶排序将元素按范围分配到不同的桶中，对每个桶分别排序后按顺序合并。是稳定排序算法，数据分布均匀时效率很高，最坏情况退化为 O(n²)。"
  />
);

export default BucketSort;
