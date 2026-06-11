/**
 * @fileoverview 动态规划算法控制面板组件
 * @description 提供动态规划算法演示的通用控制界面，支持多种DP问题类型：
 *              1. LIS（最长递增子序列）- 输入数字序列
 *              2. Knapsack（0/1背包问题）- 输入物品重量、价值、背包容量
 *              3. EditDistance（编辑距离）- 输入两个字符串
 *
 * @note 根据inputType属性动态渲染不同的输入表单，
 *       实现一个组件适配多种DP问题的设计模式。
 */

import React from 'react';

/**
 * DPControls组件属性接口
 * @interface DPControlsProps
 * @property onStart - 开始算法执行的回调函数（参数根据inputType不同而变化）
 * @property onReset - 重置算法状态的回调函数
 * @property onSetDelay - 设置动画延迟的回调函数
 * @property isRunning - 当前算法是否正在运行
 * @property inputType - DP问题类型标识：'lis' | 'knapsack' | 'editdistance'
 * @property defaultValue - 各输入字段的默认值（可选）
 */
interface DPControlsProps {
  onStart: (input: any) => void;
  onReset: () => void;
  onSetDelay: (delay: number) => void;
  isRunning: boolean;
  inputType: 'lis' | 'knapsack' | 'editdistance';
  defaultValue?: any;
}

/**
 * 动态规划控制面板组件
 * @param props - 组件属性（见接口定义）
 * @description 根据inputType渲染对应的输入界面：
 *              - LIS：单个文本框输入数字序列
 *              - Knapsack：三个输入框（重量、价值、容量）
 *              - EditDistance：两个文本框（字符串1、字符串2）
 */
const DPControls: React.FC<DPControlsProps> = ({
  onStart,
  onReset,
  onSetDelay,
  isRunning,
  inputType,
  defaultValue
}) => {
  // ==================== 本地状态：各DP问题的输入数据 ====================
  const [sequence, setSequence] = React.useState(defaultValue?.sequence || '10,9,2,5,3,7,101,18');  // LIS序列
  const [weights, setWeights] = React.useState(defaultValue?.weights || '2,3,4,5');               // 背包物品重量
  const [values, setValues] = React.useState(defaultValue?.values || '3,4,5,6');                 // 背包物品价值
  const [capacity, setCapacity] = React.useState(defaultValue?.capacity || 10);                   // 背包容量
  const [word1, setWord1] = React.useState(defaultValue?.word1 || 'horse');                       // 编辑距离字符串1
  const [word2, setWord2] = React.useState(defaultValue?.word2 || 'ros');                         // 编辑距离字符串2
  const [delay, setDelay] = React.useState(500);                                                  // 动画延迟

  /**
   * 处理开始按钮点击事件
   * @description 根据当前inputType解析对应的输入数据，并调用onStart回调
   */
  const handleStart = () => {
    switch (inputType) {
      case 'lis':
        // LIS：解析逗号分隔的数字序列
        const nums = sequence.split(',').map(Number).filter(n => !isNaN(n));
        onStart(nums);
        break;
      case 'knapsack':
        // 背包问题：解析重量数组、价值数组，结合容量
        const w = weights.split(',').map(Number).filter(n => !isNaN(n));
        const v = values.split(',').map(Number).filter(n => !isNaN(n));
        onStart({ weights: w, values: v, capacity });
        break;
      case 'editdistance':
        // 编辑距离：直接传递两个字符串
        onStart({ word1, word2 });
        break;
    }
  };

  /** 处理动画延迟滑块变化 */
  const handleDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDelay = parseInt(e.target.value);
    setDelay(newDelay);
    onSetDelay(newDelay);
  };

  /**
   * 根据inputType动态渲染对应的输入表单
   * @returns 对应问题类型的JSX输入元素
   */
  const renderInputs = () => {
    switch (inputType) {
      case 'lis':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              输入序列（用逗号分隔）
            </label>
            <input
              type="text"
              value={sequence}
              onChange={(e) => setSequence(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isRunning}
            />
          </div>
        );
      case 'knapsack':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                物品重量（用逗号分隔）
              </label>
              <input
                type="text"
                value={weights}
                onChange={(e) => setWeights(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                物品价值（用逗号分隔）
              </label>
              <input
                type="text"
                value={values}
                onChange={(e) => setValues(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                背包容量
              </label>
              <input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isRunning}
              />
            </div>
          </>
        );
      case 'editdistance':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                字符串 1
              </label>
              <input
                type="text"
                value={word1}
                onChange={(e) => setWord1(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                字符串 2
              </label>
              <input
                type="text"
                value={word2}
                onChange={(e) => setWord2(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isRunning}
              />
            </div>
          </>
        );
    }
  };

  return (
    <div className="space-y-4 bg-white p-4 rounded-lg shadow">
      {/* 根据问题类型动态渲染输入表单 */}
      {renderInputs()}

      {/* 动画延迟控制滑块：100-2000ms范围，步进100ms */}
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
          disabled={isRunning}  // 运行中禁止调整
        />
      </div>

      {/* 操作按钮组：开始和重置 */}
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

export default DPControls;
