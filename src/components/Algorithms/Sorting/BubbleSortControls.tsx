/**
 * @fileoverview 冒泡排序控制面板组件
 * @description 提供冒泡排序算法的用户交互控制界面。
 *              包含数组大小调节、动画速度控制、开始/重置操作等功能。
 *              作为冒泡排序可视化页面的控制模块，与可视化渲染器配合使用。
 */

import React, { useState } from 'react';

/**
 * BubbleSortControls组件属性接口
 * @interface BubbleSortControlsProps
 * @property onSort - 开始排序的回调函数
 * @property onGenerateArray - 生成新数组的回调函数（参数为数组大小）
 * @property onSetDelay - 设置动画延迟的回调函数（参数为延迟毫秒数）
 * @property isSorting - 当前是否正在排序（用于禁用/启用控件）
 */
interface BubbleSortControlsProps {
  onSort: () => Promise<void>;
  onGenerateArray: (size: number) => void;
  onSetDelay: (delay: number) => void;
  isSorting: boolean;
}

/**
 * 冒泡排序控制面板组件
 * @param props - 组件属性（见接口定义）
 * @description 提供以下交互功能：
 *              1. 数组大小滑块：5-50范围可调，实时生效
 *              2. 动画速度滑块：50-1000ms可调，控制每步间隔时间
 *              3. 生成新数组按钮：使用当前大小重新生成随机数组
 *              4. 开始排序按钮：触发冒泡排序动画演示
 *              5. 排序状态指示：显示"排序进行中..."提示
 */
const BubbleSortControls: React.FC<BubbleSortControlsProps> = ({
  onSort,
  onGenerateArray,
  onSetDelay,
  isSorting
}) => {
  // ==================== 本地状态管理 ====================
  const [arraySize, setArraySize] = useState(10);   // 当前数组大小设置值
  const [delay, setDelay] = useState(500);          // 当前动画延迟设置值

  /**
   * 处理数组大小变化事件
   * @param e - 输入框change事件
   * @description 更新本地状态并立即调用父组件回调生成新数组
   */
  const handleArraySizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value);
    setArraySize(size);
    onGenerateArray(size);  // 立即生效：改变滑块即重新生成数组
  };

  /**
   * 处理动画延迟变化事件
   * @param e - 输入框change事件
   * @description 更新本地状态并通知父组件调整动画速度
   */
  const handleDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDelay = parseInt(e.target.value);
    setDelay(newDelay);
    onSetDelay(newDelay);
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      {/* ==================== 数组大小控制区 ==================== */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          数组大小: {arraySize}
        </label>
        <input
          type="range"
          min="5"
          max="50"
          value={arraySize}
          onChange={handleArraySizeChange}
          disabled={isSorting}  // 排序进行中时禁止调整
          className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* ==================== 动画速度控制区 ==================== */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          动画延迟: {delay}ms
        </label>
        <input
          type="range"
          min="50"
          max="1000"
          step="50"
          value={delay}
          onChange={handleDelayChange}
          disabled={isSorting}  // 排序进行中时禁止调整
          className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* ==================== 操作按钮区 ==================== */}
      <div className="flex space-x-2">
        {/* 生成新数组按钮 */}
        <button
          onClick={() => onGenerateArray(arraySize)}
          disabled={isSorting}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          生成新数组
        </button>
        {/* 开始排序按钮 */}
        <button
          onClick={onSort}
          disabled={isSorting}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          开始排序
        </button>
      </div>

      {/* 排序进行中的状态提示 */}
      {isSorting && (
        <div className="text-center text-blue-600">
          排序进行中...
        </div>
      )}
    </div>
  );
};

export default BubbleSortControls;
