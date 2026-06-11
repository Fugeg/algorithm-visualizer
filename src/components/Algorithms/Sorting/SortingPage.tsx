/**
 * @fileoverview 排序算法可视化主页面组件
 * @description 提供统一的排序算法可视化界面框架，支持多种排序算法的展示。
 *              包含数组柱状图可视化、播放控制、代码同步高亮、变量监控、
 *              复杂度分析表格等功能模块。采用左右分栏布局：左侧为可视化和控制区，
 *              右侧为代码和数据分析区。
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SortingAlgorithm, SortingStep, ArrayElement } from '../../../models/SortingAlgorithm';
import { PlaybackController } from '../../../models/PlaybackController';
import PlaybackControls from '../../Visualization/PlaybackControls';
import CodeSyncPanel, { SORTING_PSEUDOCODE } from '../../Visualization/CodeSyncPanel';
import VariableMonitorPanel from '../../Visualization/VariableMonitorPanel';

/**
 * SortingPage组件属性接口
 * @interface SortingPageProps
 * @property algorithmType - 算法类型标识（用于匹配伪代码）
 * @property title - 算法标题（如 "冒泡排序"）
 * @property description - 算法描述文本
 * @property complexityData - 复杂度分析数据数组
 * @property generateSteps - 生成算法步骤的回调函数
 * @property algorithmNote - 可选的算法补充说明
 */
interface SortingPageProps {
  algorithmType: string;
  title: string;
  description: string;
  complexityData: { case: string; time: string; space: string; note: string }[];
  generateSteps: (algo: SortingAlgorithm) => void;
  algorithmNote?: string;
}

/**
 * 排序可视化子组件 - 柱状图渲染器
 * @param array - 数组元素列表，每个元素包含值和状态信息
 * @description 将数组数据渲染为彩色柱状图，根据元素状态（比较中、交换中、已排序等）
 *              显示不同颜色，直观展示排序过程。柱子高度与数值成正比。
 */
const SortingVisualizer: React.FC<{ array: ArrayElement[] }> = ({ array }) => {
  // 计算数组最大值，用于归一化柱子高度
  const maxValue = Math.max(...array.map(item => item.value), 1);

  /**
   * 根据数组元素状态返回对应的颜色类名
   * @param state - 元素当前状态
   * @returns Tailwind CSS颜色类名
   */
  const getBarColor = (state: ArrayElement['state']) => {
    switch (state) {
      case 'comparing': return 'bg-yellow-500';   // 正在比较：黄色
      case 'swapping': return 'bg-red-500';       // 正在交换：红色
      case 'sorted': return 'bg-green-500';       // 已排序：绿色
      case 'pivot': return 'bg-purple-500';       // 基准值（快排）：紫色
      case 'current': return 'bg-orange-500';     // 当前元素：橙色
      case 'subarray': return 'bg-teal-400';      // 子数组：青色
      case 'heap': return 'bg-amber-600';         // 堆操作：琥珀色
      case 'counting': return 'bg-cyan-500';      // 计数排序：青蓝色
      case 'bucket': return 'bg-lime-500';        // 桶排序：柠檬绿
      case 'radix': return 'bg-pink-500';         // 基数排序：粉色
      default: return 'bg-blue-500';              // 默认：蓝色
    }
  };

  return (
    <div className="border rounded-lg bg-white p-4 shadow-sm">
      {/* 柱状图容器：自适应高度，水平可滚动 */}
      <div className="flex items-end justify-center min-h-[200px] overflow-x-auto gap-1">
        {array.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center"
            // 动态计算柱子宽度：根据数组长度自适应，保证最小20px最大60px
            style={{ width: `${Math.max(20, Math.min(60, 600 / array.length))}px` }}
          >
            {/* 柱子本体：高度按比例缩放，带圆角和过渡动画 */}
            <div
              className={`w-full ${getBarColor(item.state)} rounded-t transition-all duration-200`}
              style={{ height: `${(item.value / maxValue) * 200}px` }}
            />
            {/* 数值标签：仅当数组长度≤30时显示，避免过于拥挤 */}
            {array.length <= 30 && (
              <span className="text-xs mt-1 text-gray-600">{item.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 排序算法主页面组件
 * @param props - 组件属性（见 SortingPageProps 接口定义）
 * @description 整合排序可视化的所有功能模块：
 *              1. 算法引擎：SortingAlgorithm 实例管理数组状态和步骤生成
 *              2. 播放控制：PlaybackController 管理步骤播放、暂停、速度调节
 *              3. 可视化展示：柱状图 + 代码高亮 + 变量监控 + 复杂度分析
 *              4. 用户交互：数组大小调节、随机生成、自定义输入
 */
const SortingPage: React.FC<SortingPageProps> = ({
  algorithmType,
  title,
  description,
  complexityData,
  generateSteps,
  algorithmNote
}) => {
  // ==================== 核心状态初始化 ====================
  const [sortingAlgorithm] = useState(() => new SortingAlgorithm());           // 排序算法引擎实例
  const [playbackController] = useState(() => new PlaybackController<SortingStep>(500));  // 播放控制器（默认500ms间隔）
  const [playbackState, setPlaybackState] = useState(playbackController.getState());      // 播放状态快照
  const [arraySize, setArraySize] = useState(15);       // 当前数组大小
  const [customInput, setCustomInput] = useState('');   // 自定义输入内容
  const [showCustomInput, setShowCustomInput] = useState(false);  // 是否显示自定义输入框

  // 订阅播放控制器状态变化，实时更新UI
  useEffect(() => {
    const unsubscribe = playbackController.subscribe((state) => {
      setPlaybackState(state);
    });
    return () => unsubscribe();  // 组件卸载时取消订阅，防止内存泄漏
  }, [playbackController]);

  /**
   * 生成指定大小的随机数组
   * @param size - 目标数组大小
   * @description 重置播放状态并生成新的随机数组用于可视化演示
   */
  const handleGenerate = useCallback((size: number) => {
    playbackController.reset();
    sortingAlgorithm.generateRandomArray(size);
    setArraySize(size);
  }, [sortingAlgorithm, playbackController]);

  /**
   * 处理用户自定义数组输入
   * @description 解析逗号分隔的数字字符串，验证后设置为当前数组
   */
  const handleCustomInput = useCallback(() => {
    const values = customInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (values.length > 0) {
      playbackController.reset();
      sortingAlgorithm.setArray(values);
      setArraySize(values.length);
      setShowCustomInput(false);
    }
  }, [customInput, sortingAlgorithm, playbackController]);

  /**
   * 开始排序可视化演示
   * @description 调用算法生成步骤序列，然后启动播放控制器自动播放
   */
  const handleStart = useCallback(() => {
    generateSteps(sortingAlgorithm);
    const steps = sortingAlgorithm.getSteps();
    if (steps.length > 0) {
      playbackController.setSteps(steps);
      playbackController.play();
    }
  }, [sortingAlgorithm, playbackController, generateSteps]);

  /**
   * 重置排序演示到初始状态
   * @description 清空播放状态并重新生成随机数组
   */
  const handleReset = useCallback(() => {
    playbackController.reset();
    sortingAlgorithm.generateRandomArray(arraySize);
  }, [playbackController, sortingAlgorithm, arraySize]);

  // 组件首次挂载时，生成默认大小的随机数组
  useEffect(() => {
    handleGenerate(15);
  }, [handleGenerate]);

  // ==================== 当前步骤数据提取 ====================
  // 从播放状态中获取当前步骤信息（安全访问，防止越界）
  const currentStep = playbackState.currentStepIndex >= 0 && playbackState.currentStepIndex < playbackState.steps.length
    ? playbackState.steps[playbackState.currentStepIndex]
    : null;

  // 提取当前步骤的各维度数据，用于渲染各个展示模块
  const displayArray = currentStep?.array || sortingAlgorithm.getState().array.map(v => ({ ...v, state: 'default' as const }));
  const comparisons = currentStep?.comparisons || 0;     // 累计比较次数
  const swaps = currentStep?.swaps || 0;                 // 累计交换次数
  const highlightLine = currentStep?.highlightLine ?? -1; // 当前高亮代码行（-1表示无）
  const variables = currentStep?.variables || {};        // 变量监控数据
  const message = currentStep?.message || '';            // 步骤说明文字

  // 根据算法类型获取对应的伪代码配置
  const pseudocode = SORTING_PSEUDOCODE[algorithmType];

  // ==================== 渲染部分 ====================
  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* 页面标题和算法描述 */}
      <h2 className="text-2xl font-bold mb-2 text-gray-800">{title}</h2>
      <p className="text-gray-600 mb-4 text-sm">{description}</p>

      {/* 主布局：左右分栏（左侧2/3，右侧1/3） */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ==================== 左侧区域：可视化 + 统计 + 控制 ==================== */}
        <div className="lg:col-span-2 space-y-4">
          {/* 排序柱状图可视化 */}
          <SortingVisualizer array={displayArray} />

          {/* 实时统计指标卡片：比较次数、交换次数、步骤进度 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-600">比较次数</div>
              <div className="text-xl font-bold text-blue-800">{comparisons}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="text-xs text-red-600">交换次数</div>
              <div className="text-xl font-bold text-red-800">{swaps}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xs text-green-600">步骤进度</div>
              <div className="text-xl font-bold text-green-800">
                {playbackState.currentStepIndex + 1}/{playbackState.totalSteps}
              </div>
            </div>
          </div>

          {/* 播放控制条：播放/暂停、单步前进/后退、重置、速度调节、跳转 */}
          <PlaybackControls
            playbackState={playbackState}
            onPlay={() => {
              if (playbackState.totalSteps === 0) {
                handleStart();  // 无步骤时先生成步骤
              } else {
                playbackController.play();  // 有步骤时继续播放
              }
            }}
            onPause={() => playbackController.pause()}
            onStepForward={() => playbackController.stepForward()}
            onStepBackward={() => playbackController.stepBackward()}
            onReset={handleReset}
            onSpeedChange={(s) => playbackController.setSpeed(s)}
            onGoToStep={(i) => playbackController.goToStep(i)}
          />

          {/* 当前步骤说明文字（如有） */}
          {message && (
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg text-sm border border-indigo-100">
              {message}
            </div>
          )}

          {/* 数据设置面板：数组大小调节、随机生成、自定义输入 */}
          <div className="space-y-3">
            <div className="bg-white rounded-lg shadow p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">数据设置</h3>
              {/* 数组大小滑块：5-50范围可调 */}
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm text-gray-600 whitespace-nowrap">
                  数组大小: {arraySize}
                </label>
                <input
                  type="range" min="5" max="50" value={arraySize}
                  onChange={(e) => handleGenerate(parseInt(e.target.value))}
                  disabled={playbackState.isPlaying}
                  className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleGenerate(arraySize)}
                  disabled={playbackState.isPlaying}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
                >
                  随机生成
                </button>
                <button
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  disabled={playbackState.isPlaying}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-sm"
                >
                  自定义输入
                </button>
                {playbackState.totalSteps === 0 && (
                  <button
                    onClick={handleStart}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    生成步骤
                  </button>
                )}
              </div>
              {showCustomInput && (
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text" value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="输入数字，用逗号分隔，如: 5,3,8,1,9"
                    className="flex-1 border rounded px-3 py-2 text-sm"
                  />
                  <button onClick={handleCustomInput} className="px-4 py-2 bg-indigo-500 text-white rounded text-sm">
                    确认
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================== 右侧区域：代码 + 变量 + 复杂度 ==================== */}
        <div className="space-y-4">
          {/* 伪代码同步高亮面板 */}
          {pseudocode && (
            <CodeSyncPanel
              title={pseudocode.title}
              codeLines={pseudocode.lines}
              highlightLine={highlightLine}
            />
          )}

          {/* 变量监控面板：显示当前步骤的变量值变化 */}
          <VariableMonitorPanel variables={variables} />

          {/* 复杂度分析表格：展示最好/平均/最坏情况的时间和空间复杂度 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b">
              <h3 className="text-sm font-semibold text-gray-700">复杂度分析</h3>
            </div>
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">情况</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">时间</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">空间</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">说明</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {complexityData.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{row.case}</td>
                    <td className="px-4 py-2 text-sm text-gray-500 font-mono">{row.time}</td>
                    <td className="px-4 py-2 text-sm text-gray-500 font-mono">{row.space}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 算法补充说明（可选）：显示算法的特殊性质、优化建议等 */}
          {algorithmNote && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
              <h4 className="text-sm font-semibold mb-2 text-yellow-700">算法说明</h4>
              <div className="text-sm text-gray-700 space-y-1">{algorithmNote}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SortingPage;
