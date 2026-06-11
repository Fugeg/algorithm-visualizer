/**
 * @fileoverview 递归算法控制面板组件
 * @description 提供递归算法演示（如汉诺塔、阶乘、斐波那契等）的通用控制界面。
 *              包含输入值设置、动画速度调节、开始/重置操作等功能。
 *
 * @note 与其他算法控制面板的区别：
 *       - 输入为单个数值（如圆盘数量n），而非数组或复杂结构
 *       - 默认值和最大值可配置，适应不同递归问题的参数范围
 */

import React from 'react';

/**
 * RecursionControls组件属性接口
 * @interface RecursionControlsProps
 * @property onStart - 开始算法执行的回调函数（参数为输入值n）
 * @property onReset - 重置算法状态的回调函数
 * @property onSetDelay - 设置动画延迟的回调函数
 * @property isRunning - 当前算法是否正在运行
 * @property defaultValue - 输入框的默认值（可选，默认5）
 * @property maxValue - 输入值的最大限制（可选，默认10）
 */
interface RecursionControlsProps {
  onStart: (n: number) => void;
  onReset: () => void;
  onSetDelay: (delay: number) => void;
  isRunning: boolean;
  defaultValue?: number;
  maxValue?: number;
}

/**
 * 递归算法控制面板组件
 * @param props - 组件属性（见接口定义）
 * @description 提供以下交互功能：
 *              1. 数值输入框：设置递归深度或问题规模（1-maxValue）
 *              2. 动画速度滑块：100-2000ms可调
 *              3. 开始/重置按钮：控制算法执行流程
 */
const RecursionControls: React.FC<RecursionControlsProps> = ({
  onStart,
  onReset,
  onSetDelay,
  isRunning,
  defaultValue = 5,     // 默认输入值：5个圆盘
  maxValue = 10        // 最大值限制：防止递归过深导致性能问题
}) => {
  // ==================== 本地状态管理 ====================
  const [inputValue, setInputValue] = React.useState(defaultValue);  // 用户输入的数值
  const [delay, setDelay] = React.useState(500);                      // 动画延迟

  /** 处理开始按钮点击 */
  const handleStart = () => {
    onStart(inputValue);
  };

  /** 处理动画延迟滑块变化 */
  const handleDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDelay = parseInt(e.target.value);
    setDelay(newDelay);
    onSetDelay(newDelay);
  };

  return (
    <div className="space-y-4 bg-white p-4 rounded-lg shadow">
      {/* ==================== 数值输入区 ==================== */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          输入值 (1-{maxValue})
        </label>
        <input
          type="number"
          min="1"
          max={maxValue}
          value={inputValue}
          onChange={(e) => setInputValue(parseInt(e.target.value))}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          disabled={isRunning}  // 运行中禁止修改
        />
      </div>

      {/* ==================== 动画速度控制区 ==================== */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          延迟 (ms): {delay}
        </label>
        <input
          type="range"
          min="100"
          max="2000"
          step="100"
          value={delay}
          onChange={handleDelayChange}
          className="block w-full"
          disabled={isRunning}
        />
      </div>

      {/* ==================== 操作按钮组 ==================== */}
      <div className="flex space-x-4">
        {/* 开始执行按钮 */}
        <button
          onClick={handleStart}
          disabled={isRunning}
          className={`flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${isRunning
              ? 'bg-gray-400 cursor-not-allowed'        // 禁用状态：灰色
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
        >
          开始
        </button>
        {/* 重置按钮 */}
        <button
          onClick={onReset}
          disabled={isRunning}
          className={`flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${isRunning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
            }`}
        >
          重置
        </button>
      </div>
    </div>
  );
};

export default RecursionControls;
