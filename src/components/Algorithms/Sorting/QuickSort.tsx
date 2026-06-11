/**
 * @fileoverview 快速排序可视化组件（独立版本）
 * @description 提供快速排序算法的独立可视化演示功能。
 *              采用分治策略，通过递归实现排序过程的动画展示。
 *              使用最后一个元素作为基准值（pivot），Lomuto分区方案。
 *
 * @note 此组件使用递归 + async/await 实现动画效果，
 *       每次元素移动都会触发重新渲染以展示排序过程。
 */

import React, { useState, useEffect } from 'react';
import VisualizationCanvas from '../../Visualization/VisualizationCanvas';
import AnimationControls from '../../Visualization/AnimationControls';

/**
 * 快速排序可视化组件
 * @description 功能包括：
 *              1. 随机数组生成（默认20个元素）
 *              2. 快速排序动画演示（展示分区和递归过程）
 *              3. 可调节动画速度
 *              4. 播放控制
 *
 * @note 时间复杂度：平均O(n log n)，最坏O(n²)（当数组已有序或逆序时）
 *      空间复杂度：O(log n) 递归调用栈空间
 */
const QuickSort: React.FC = () => {
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
   * @description 生成20个0-99范围的随机整数
   */
  const resetArray = () => {
    const newArray = Array.from({ length: 20 }, () => Math.floor(Math.random() * 100));
    setArray(newArray);
  };

  /**
   * 快速排序主函数入口
   * @description 设置排序状态并启动递归排序过程
   */
  const quickSort = async () => {
    setSorting(true);
    await quickSortHelper(0, array.length - 1);  // 对整个数组范围进行排序
    setSorting(false);
  };

  /**
   * 快速排序递归辅助函数
   * @param low - 子数组起始索引
   * @param high - 子数组结束索引
   * @description 递归地对子数组进行快速排序：
   *              1. 选择基准值并进行分区
   *              2. 递归排序基准值左侧的子数组
   *              3. 递归排序基准值右侧的子数组
   */
  const quickSortHelper = async (low: number, high: number) => {
    if (low < high) {  // 递归终止条件：子数组长度大于1
      const pivotIndex = await partition(low, high);  // 分区操作，获取基准值最终位置
      await quickSortHelper(low, pivotIndex - 1);     // 递归排序左半部分
      await quickSortHelper(pivotIndex + 1, high);    // 递归排序右半部分
    }
  };

  /**
   * 分区操作（Lomuto分区方案）
   * @param low - 子数组起始索引
   * @param high - 子数组结束索引（基准值位置）
   * @returns 基准值的最终正确位置索引
   * @description 将数组分为两部分：
   *              1. 选择array[high]作为基准值（pivot）
   *              2. 遍历数组，将小于pivot的元素移到左侧
   *              3. 最后将pivot放到正确的位置
   *              4. 返回pivot的最终索引
   */
  const partition = async (low: number, high: number) => {
    const pivot = array[high];  // 选择最后一个元素作为基准值
    let i = low - 1;            // i指向小于pivot的区域的末尾

    // 遍历子数组（不包括基准值本身）
    for (let j = low; j < high; j++) {
      if (array[j] < pivot) {
        i++;  // 扩展小于pivot的区域
        // 将较小元素交换到左侧区域
        [array[i], array[j]] = [array[j], array[i]];
        setArray([...array]);  // 触发重新渲染显示交换过程
        await new Promise(resolve => setTimeout(resolve, 1000 / speed));  // 动画延迟
      }
    }

    // 将基准值放到正确的最终位置（i+1）
    [array[i + 1], array[high]] = [array[high], array[i + 1]];
    setArray([...array]);
    await new Promise(resolve => setTimeout(resolve, 1000 / speed));

    return i + 1;  // 返回基准值的最终位置
  };

  return (
    <div className="quick-sort">
      <h2>Quick Sort Visualization</h2>
      {/* 数组可视化画布 */}
      <VisualizationCanvas data={array} />
      {/* 动画控制面板 */}
      <AnimationControls
        onStart={quickSort}
        onReset={resetArray}
        onSpeedChange={setSpeed}
        disabled={sorting}
      />
    </div>
  );
};

export default QuickSort;