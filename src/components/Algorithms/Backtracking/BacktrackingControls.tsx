/**
 * @fileoverview 回溯算法控制面板组件
 * @description 提供回溯算法演示（如N皇后、子集、排列组合等）的通用控制界面。
 *              支持两种输入模式：
 *              1. array（数组输入）- 如排列组合问题，输入候选元素集合
 *              2. number（数值输入）- 如N皇后问题，输入棋盘大小N
 *
 * @note 回溯算法特点：通过递归探索所有可能的解空间，当发现当前路径
 *       无法到达有效解时，立即返回（"回溯"）尝试其他路径。
 *       此组件的输入类型根据具体问题的需求动态切换。
 */

import React from 'react';

/**
 * BacktrackingControls组件属性接口
 * @interface BacktrackingControlsProps
 * @property onStart - 开始算法执行的回调函数
 * @property onReset - 重置算法状态的回调函数
 * @property onSetDelay - 设置动画延迟的回调函数
 * @property isRunning - 当前算法是否正在运行
 * @property inputType - 输入类型标识：'array' | 'number'
 * @property defaultValue - 输入框的默认值（可选）
 * @property maxValue - 数值输入的最大限制（可选，默认8）
 */
interface BacktrackingControlsProps {
  onStart: (input: any) => void;
  onReset: () => void;
  onSetDelay: (delay: number) => void;
  isRunning: boolean;
  inputType: 'array' | 'number';
  defaultValue?: any;
  maxValue?: number;
}

/**
 * 回溯算法控制面板组件
 * @param props - 组件属性（见接口定义）
 * @description 提供以下交互功能：
 *              1. 根据inputType显示不同的输入控件：
 *                 - array模式：文本框输入逗号分隔的数组元素
 *                 - number模式：数字输入框（带最大值限制）
 *              2. 动画速度滑块控制
 *              3. 开始/重置操作按钮
 */
const BacktrackingControls: React.FC<BacktrackingControlsProps> = ({
  onStart,
  onReset,
  onSetDelay,
  isRunning,
  inputType,
  defaultValue = inputType === 'array' ? [1, 2, 3] : 4,  // 默认值根据类型不同
  maxValue = 8   // 数值模式的最大值（如N皇后的最大N）
}) => {
  // ==================== 本地状态管理 ====================
  const [inputValue, setInputValue] = React.useState(defaultValue);  // 用户输入的数据
  const [delay, setDelay] = React.useState(500);                      // 动画延迟

  /**
   * 处理开始按钮点击事件
   * @description 根据inputType解析输入数据并调用onStart回调
   */
  const handleStart = () => {
    if (inputType === 'array') {
      // 数组模式：解析逗号分隔的字符串为数字数组
      const arr = inputValue.split(',').map(Number).filter(n => !isNaN(n));
      onStart(arr);
    } else {
      // 数值模式：直接传递整数值
      onStart(parseInt(inputValue));
    }
  };

  /** 处理动画延迟滑块变化 */
  const handleDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDelay = parseInt(e.target.value);
    setDelay(newDelay);
    onSetDelay(newDelay);
  };

  return (
    <div className="space-y-4 bg-white p-4 rounded-lg shadow">
      {/* ==================== 输入数据区 ==================== */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {/* 根据输入类型显示不同的标签文字 */}
          {inputType === 'array' ? '输入数组 (用逗号分隔)' : `输入值 (1-${maxValue})`}
        </label>
        <input
          // 根据输入类型使用不同的HTML输入框类型
          type={inputType === 'array' ? 'text' : 'number'}
          min={inputType === 'array' ? undefined : 1}
          max={inputType === 'array' ? undefined : maxValue}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
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
        <button
          onClick={handleStart}
          disabled={isRunning}
          className={`flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${isRunning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
        >
          开始
        </button>
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

export default BacktrackingControls;
