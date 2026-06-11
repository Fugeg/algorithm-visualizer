/**
 * 希尔排序可视化组件
 *
 * 【可视化策略】
 * 采用 SortingPage 通用排序可视化容器模式。希尔排序是插入排序的增量改进版本，
 * 可视化重点在于：
 * - 增量序列（Gap Sequence）的变化过程：从大增量逐步缩小到1
 * - 每个增量下分组插入排序的过程：同组元素间隔显示
 * - 元素在不同增量下的移动轨迹（大步长跳跃 vs 最终精细调整）
 *
 * 【数据流向】Model → Step → UI
 * 1. 用户输入 → SortingPage 创建 Algorithm Model
 * 2. algo.generateShellSortSteps() 生成步骤流
 * 3. Step 包含：currentGap（当前增量/间隔）、groupMembers（当前组的成员索引）、comparingPair、insertingElement
 * 4. UI 层可用连线或底色区分同一增量组内的元素，展示"跳跃式"插入的特点
 *
 * 【特殊交互设计】
 * - 希尔排序有三种复杂度情况，取决于增量序列的选择
 * - 不稳定排序：相等的元素可能因不同轮次的分组而被分离
 * - 可视化可突出展示"预排序"效果——大增量快速将元素移到大致正确位置
 */
import React from 'react';
import SortingPage from './Sorting/SortingPage';

/**
 * 希尔排序可视化页面组件
 *
 * 纯展示型包装组件。希尔排序的可视化核心是增量变化带来的
 * 分组效果——相同颜色的元素属于同一插入排序组。
 */
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
    /* 步骤生成回调：调用 Model 层的希尔排序步骤生成方法 */
    generateSteps={(algo) => algo.generateShellSortSteps()}
    algorithmNote="希尔排序按增量序列将元素分组，对每组进行插入排序，然后逐步缩小增量。增量序列的选择对性能影响很大，是不稳定排序算法。"
  />
);

export default ShellSort;
