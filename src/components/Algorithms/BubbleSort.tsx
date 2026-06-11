/**
 * 冒泡排序可视化组件
 *
 * 【可视化策略】
 * 本组件采用「排序算法通用可视化页面」模式（SortingPage），作为轻量级包装层。
 * 冒泡排序的核心特征是相邻元素的两两比较与交换，可视化重点在于：
 * - 每轮遍历时相邻元素的比较高亮（当前比较对）
 * - 交换操作的动画效果
 * - 每轮结束后最大元素"冒泡"到末尾的视觉呈现
 *
 * 【数据流向】Model → Step → UI
 * 1. 用户输入数组 → SortingPage 内部创建 Algorithm Model 实例
 * 2. 调用 algo.generateBubbleSortSteps() 生成排序步骤序列（Step[]）
 * 3. 每个 Step 包含：当前数组状态、比较索引、交换索引、是否已排序标记
 * 4. SortingPage 将 Step 数据映射为柱状图/条形图的视觉属性（颜色、高度、位置）
 *
 * 【特殊交互设计】
 * - algorithmType="bubble" 告知 SortingPage 使用冒泡排序专用的视觉配色方案
 * - generateSteps 回调函数桥接 Model 层的具体算法实现
 * - 复杂度数据以表格形式展示，帮助理解算法效率特征
 */
import React from 'react';
import SortingPage from './Sorting/SortingPage';

/**
 * 冒泡排序可视化页面组件
 *
 * 作为纯展示型组件，本组件不管理任何内部状态，
 * 所有交互逻辑和状态管理均委托给 SortingPage 通用容器。
 */
const BubbleSort: React.FC = () => (
  <SortingPage
    /* 算法类型标识，用于 SortingPage 内部选择对应的视觉渲染策略和配色 */
    algorithmType="bubble"
    /* 页面标题 */
    title="冒泡排序可视化"
    /* 算法描述文本，展示在页面顶部帮助用户理解算法原理 */
    description="冒泡排序是一种简单的排序算法，通过重复遍历待排序序列，依次比较相邻元素并交换顺序错误的元素对，直到序列有序。"
    /* 复杂度分析数据：包含最好/平均/最坏情况的时间和空间复杂度及备注说明 */
    complexityData={[
      { case: '最好情况', time: 'O(n)', space: 'O(1)', note: '数组已经有序' },
      { case: '平均情况', time: 'O(n²)', space: 'O(1)', note: '需要部分元素交换' },
      { case: '最坏情况', time: 'O(n²)', space: 'O(1)', note: '数组完全逆序' },
    ]}
    /*
     * 步骤生成回调：接收 Algorithm Model 实例，调用其冒泡排序步骤生成方法。
     * 这是连接具体算法实现与通用可视化框架的关键桥梁：
     * SortingPage 通过此回调获取完整的排序过程快照序列。
     */
    generateSteps={(algo) => algo.generateBubbleSortSteps()}
    /* 算法详细说明文字，补充描述冒泡排序的核心思想和执行特点 */
    algorithmNote="冒泡排序通过重复遍历序列，比较相邻元素并在顺序错误时交换它们。每轮遍历会将当前未排序部分的最大值「冒泡」到正确位置，直到整个序列有序。"
  />
);

export default BubbleSort;
