/**
 * 桶排序可视化组件
 *
 * 【可视化策略】
 * 采用 SortingPage 通用排序可视化容器模式。桶排序将元素分配到有限数量的桶中再分别排序，
 * 可视化重点在于：
 * - 数据到桶的映射过程：根据数值范围确定所属桶
 * - 各桶内部的排序过程（通常使用其他排序算法）
 * - 所有桶按顺序合并得到最终结果
 * - 桶的数量和数据分布对效率的影响
 *
 * 【数据流向】Model → Step → UI
 * 1. 用户输入 → SortingPage 创建 Algorithm Model
 * 2. algo.generateBucketSortSteps() 生成步骤流
 * 3. Step 包含：buckets（各桶及其内容）、bucketRange（每个桶的范围）、currentBucket（正在处理的桶）
 * 4. UI 层需要以分桶形式展示数据分布，以及合并过程
 *
 * 【特殊交互设计】
 * - 桶排序有三种复杂度情况，取决于数据分布是否均匀
 * - 最坏情况下所有元素落入同一个桶，退化为 O(n²)
 * - 是稳定排序算法，可视化应体现桶间合并时的顺序保持
 */
import React from 'react';
import SortingPage from './Sorting/SortingPage';

/**
 * 桶排序可视化页面组件
 *
 * 纯展示型包装组件。桶排序的可视化特色是数据的「分桶」过程——
 * 直观展示元素如何被分配到不同的区间桶中。
 */
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
    /* 步骤生成回调：调用 Model 层的桶排序步骤生成方法 */
    generateSteps={(algo) => algo.generateBucketSortSteps()}
    algorithmNote="桶排序将元素按范围分配到不同的桶中，对每个桶分别排序后按顺序合并。是稳定排序算法，数据分布均匀时效率很高，最坏情况退化为 O(n²)。"
  />
);

export default BucketSort;
