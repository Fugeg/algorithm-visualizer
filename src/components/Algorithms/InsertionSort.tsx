/**
 * 插入排序可视化组件
 *
 * 【可视化策略】
 * 采用 SortingPage 通用排序可视化容器模式。插入排序的核心特征是「将元素逐个插入已排序区域」，
 * 可视化重点在于：
 * - 已排序区域与未排序区域的视觉分界
 * - 当前待插入元素的移动轨迹（从右向左扫描比较）
 * - 元素后移腾出位置的动画效果
 *
 * 【数据流向】Model → Step → UI
 * 1. 用户输入 → SortingPage 创建 Algorithm Model
 * 2. algo.generateInsertionSortSteps() 生成步骤流
 * 3. Step 包含：sortedBoundary（已排序边界）、currentKey（当前待插元素）、compareIndex（比较位置）
 * 4. UI 层根据 sortedBoundary 渲染分区颜色，currentKey 高亮显示正在处理的元素
 *
 * 【特殊交互设计】
 * - 插入排序的"稳定"特性可通过颜色保持来暗示（相同值元素的相对位置不变）
 * - 对于基本有序的数据，可视化能直观展示 O(n) 的快速完成过程
 */
import React from 'react';
import SortingPage from './Sorting/SortingPage';

/**
 * 插入排序可视化页面组件
 *
 * 纯展示型包装组件，所有状态管理和渲染逻辑由 SortingPage 统一处理。
 * 插入排序适合演示「增量构建」的算法思想。
 */
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
    /* 步骤生成回调：调用 Model 层的插入排序步骤生成方法 */
    generateSteps={(algo) => algo.generateInsertionSortSteps()}
    algorithmNote="插入排序从第二个元素开始，将每个元素插入到前面已排序序列的正确位置。对于基本有序的数据效率很高，是稳定排序算法。"
  />
);

export default InsertionSort;
