/**
 * 基数排序可视化组件
 *
 * 【可视化策略】
 * 采用 SortingPage 通用排序可视化容器模式。基数排序按位数从低到高逐位排序，
 * 可视化重点在于：
 * - 当前处理位（个位、十位、百位...）的高亮标识
 * - 每一轮按位分配到桶（0~9）中的过程
 * - 桶中元素的收集顺序（保持稳定性）
 * - 多轮排序后数组逐渐有序的过程
 *
 * 【数据流向】Model → Step → UI
 * 1. 用户输入 → SortingPage 创建 Algorithm Model
 * 2. algo.generateRadixSortSteps() 生成步骤流
 * 3. Step 包含：currentDigit（当前处理的位）、buckets（10个桶的内容）、arrayAfterRound（本轮后的数组状态）
 * 4. UI 层需展示桶的结构（0~9 编号）和每轮收集后的数组变化
 *
 * 【特殊交互设计】
 * - 基数排序是稳定排序，每一轮的桶内顺序必须保持
 * - 从最低位（LSD）到最高位逐位处理是最常见策略
 * - 时间复杂度 O(nk)，k 为最大数的位数，复杂度只需一行
 */
import React from 'react';
import SortingPage from './Sorting/SortingPage';

/**
 * 基数排序可视化页面组件
 *
 * 纯展示型包装组件。基数排序的可视化核心是多轮桶分配-收集过程，
 * 每轮关注一个数位，最终整体有序。
 */
const RadixSort: React.FC = () => (
  <SortingPage
    algorithmType="radix"
    title="基数排序可视化"
    description="基数排序是一种非比较排序算法，按位数从低到高依次对元素进行排序，适合整数或字符串排序。"
    complexityData={[
      { case: '所有情况', time: 'O(nk)', space: 'O(n+k)', note: 'k为基数，n为元素个数' },
    ]}
    /* 步骤生成回调：调用 Model 层的基数排序步骤生成方法 */
    generateSteps={(algo) => algo.generateRadixSortSteps()}
    algorithmNote="基数排序从最低位开始，对每一位进行计数排序，依次处理更高位直到最高位。是稳定排序算法，时间复杂度为 O(nk)，适合位数较少的整数排序。"
  />
);

export default RadixSort;
