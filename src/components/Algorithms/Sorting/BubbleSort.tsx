/**
 * @fileoverview 冒泡排序可视化组件（独立版本）
 * @description 提供冒泡排序算法的独立可视化演示功能。
 *              与 SortingPage 中的集成版本不同，此组件是自包含的，
 *              包含自己的数组状态管理和动画控制逻辑。
 *              适用于需要单独展示冒泡排序的场景。
 *
 * @note 此组件使用 async/await 实现动画延迟，通过 setState 触发重新渲染
 *       来展示每一步的排序过程。适合教学演示，但不适合大规模数据集。
 */

import React, { useState, useEffect } from 'react';
import VisualizationCanvas from '../../Visualization/VisualizationCanvas';
import AnimationControls from '../../Visualization/AnimationControls';

/**
 * 冒泡排序可视化组件
 * @description 功能包括：
 *              1. 随机数组生成（默认20个元素，范围0-99）
 *              2. 冒泡排序动画演示（可调节速度）
 *              3. 算法说明和复杂度分析展示
 *              4. 播放控制（开始、重置、速度调节）
 */
const BubbleSort: React.FC = () => {
  // ==================== 状态管理 ====================
  const [array, setArray] = useState<number[]>([]);   // 当前数组数据
  const [sorting, setSorting] = useState(false);        // 是否正在排序
  const [speed, setSpeed] = useState(1);                // 动画速度倍率

  // 组件挂载时初始化随机数组
  useEffect(() => {
    resetArray();
  }, []);

  /**
   * 重置/生成新的随机数组
   * @description 生成指定长度（20）的随机整数数组，数值范围0-99
   */
  const resetArray = () => {
    const newArray = Array.from({ length: 20 }, () => Math.floor(Math.random() * 100));
    setArray(newArray);
  };

  /**
   * 执行冒泡排序算法（带动画效果）
   * @description 标准冒泡排序实现：
   *              1. 外层循环控制遍历轮数（n-1轮）
   *              2. 内层循环比较相邻元素
   *              3. 如果前一个大于后一个则交换
   *              4. 每次交换后更新状态并等待动画延迟
   * @note 时间复杂度：最好O(n)，平均/最坏O(n²)
   *      空间复杂度：O(1) 原地排序
   */
  const bubbleSort = async () => {
    setSorting(true);
    const arr = [...array];           // 创建数组副本以避免直接修改state
    const n = arr.length;

    // 外层循环：共需n-1轮遍历
    for (let i = 0; i < n - 1; i++) {
      // 内层循环：每轮将最大元素"冒泡"到末尾
      // 注意：每轮结束后末尾i个元素已有序，无需再比较
      for (let j = 0; j < n - i - 1; j++) {
        if (arr[j] > arr[j + 1]) {
          // 相邻元素逆序，执行交换
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          setArray([...arr]);  // 更新状态触发重新渲染
          await new Promise(resolve => setTimeout(resolve, 1000 / speed));  // 动画延迟
        }
      }
    }

    setSorting(false);  // 排序完成
  };

  return (
    <div className="bubble-sort">
      <h2>Bubble Sort Visualization</h2>
      <p>
        Bubble Sort is a simple sorting algorithm that repeatedly steps through the list, 
        compares adjacent elements and swaps them if they are in the wrong order. 
        The pass through the list is repeated until the list is sorted.
      </p>
      {/* 时间复杂度说明 */}
      <h3>Time Complexity</h3>
      <ul>
        <li>Best Case: O(n) when the array is already sorted</li>
        <li>Average Case: O(n²)</li>
        <li>Worst Case: O(n²) when the array is reverse sorted</li>
      </ul>

      {/* 数组可视化画布 */}
      <VisualizationCanvas data={array} />

      {/* 动画控制面板：开始、重置、速度调节 */}
      <AnimationControls
        onStart={bubbleSort}
        onReset={resetArray}
        onSpeedChange={setSpeed}
        disabled={sorting}  // 排序进行中时禁用控制按钮
      />
    </div>
  );
};

export default BubbleSort;