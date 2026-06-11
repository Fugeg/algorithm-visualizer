/**
 * @fileoverview 贪心算法控制面板组件
 * @description 提供贪心算法演示的通用控制界面，支持两种经典贪心问题：
 *              1. Change（找零问题）- 输入金额和硬币面值集合
 *              2. Activities（活动选择问题）- 输入活动列表（含开始/结束时间）
 *
 * @note 贪心算法特点：每步做出局部最优选择，希望达到全局最优。
 *       此组件根据inputType动态切换输入表单，适配不同问题的参数需求。
 */

import React from 'react';

/**
 * GreedyControls组件属性接口
 * @interface GreedyControlsProps
 * @property onStart - 开始算法执行的回调函数
 * @property onReset - 重置算法状态的回调函数
 * @property onSetDelay - 设置动画延迟的回调函数
 * @property isRunning - 当前算法是否正在运行
 * @property inputType - 贪心问题类型标识：'change' | 'activities'
 * @property defaultValue - 各输入字段的默认值（可选）
 */
interface GreedyControlsProps {
  onStart: (input: any) => void;
  onReset: () => void;
  onSetDelay: (delay: number) => void;
  isRunning: boolean;
  inputType: 'change' | 'activities';
  defaultValue?: any;
}

/**
 * 贪心算法控制面板组件
 * @param props - 组件属性（见接口定义）
 * @description 根据inputType渲染对应的输入界面：
 *              - change（找零）：金额输入框 + 硬币面值列表
 *              - activities（活动选择）：活动列表（格式：id,开始时间,结束时间|...）
 */
const GreedyControls: React.FC<GreedyControlsProps> = ({
  onStart,
  onReset,
  onSetDelay,
  isRunning,
  inputType,
  defaultValue
}) => {
  // ==================== 本地状态：各贪心问题的输入数据 ====================
  const [amount, setAmount] = React.useState(defaultValue?.amount || 63);        // 找零金额
  const [coins, setCoins] = React.useState(defaultValue?.coins || '1,5,10,25'); // 硬币面值（逗号分隔）
  // 活动列表格式示例：0,6,8|1,4,7|2,2,4 表示3个活动（id, start, end）
  const [activities, setActivities] = React.useState(defaultValue?.activities || '0,6,8|1,4,7|2,2,4|3,3,5|4,1,3|5,5,9');
  const [delay, setDelay] = React.useState(500);  // 动画延迟

  /**
   * 处理开始按钮点击事件
   * @description 根据当前inputType解析对应的输入数据并调用onStart
   */
  const handleStart = () => {
    if (inputType === 'change') {
      // 找零问题：解析硬币面值数组
      const coinArray = coins.split(',').map(Number).filter(n => !isNaN(n));
      onStart({ amount, coins: coinArray });
    } else {
      // 活动选择问题：解析活动列表字符串为对象数组
      const activityArray = activities.split('|').map(act => {
        const [id, start, end] = act.split(',').map(Number);
        return { id, start, end };
      });
      onStart(activityArray);
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
      {/* ==================== 根据问题类型动态渲染输入表单 ==================== */}
      {inputType === 'change' ? (
        /* 找零问题输入界面 */
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              金额
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isRunning}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              硬币面值（用逗号分隔）
            </label>
            <input
              type="text"
              value={coins}
              onChange={(e) => setCoins(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isRunning}
            />
          </div>
        </>
      ) : (
        /* 活动选择问题输入界面 */
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            活动列表（格式：id,开始时间,结束时间|...）
          </label>
          <input
            type="text"
            value={activities}
            onChange={(e) => setActivities(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isRunning}
          />
        </div>
      )}

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

export default GreedyControls;
