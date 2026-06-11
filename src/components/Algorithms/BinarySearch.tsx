/**
 * 二分查找算法可视化组件
 *
 * 【可视化策略】
 * 本组件采用自定义渲染架构（不使用通用容器），是搜索类算法的典型代表。
 * 二分查找的核心是在有序数组中通过不断折半缩小范围来定位目标值：
 * - 数组元素以彩色方块条形式展示，每个元素的状态用颜色编码
 * - 搜索范围 [left, right] 用 L/R 指针标记在数组下方
 * - 中间位置 mid 用 M 标记，是每次比较的核心位置
 *
 * 【数据状态编码】
 * - default/blue: 默认未搜索状态
 * - searching/yellow: 当前在搜索范围内的元素
 * - found/green: 找到目标元素
 * - eliminated/gray: 已排除（不在当前搜索范围内）的元素
 * - mid/orange: 当前中间位置元素
 *
 * 【数据流向】
 * 1. 用户设置数组大小 → algorithm.generateSortedArray(size) 生成有序数组
 * 2. 用户输入 target 并点击开始 → algorithm.binarySearch(target)
 * 3. 算法执行生成 BinarySearchStep[]，每步包含 array（带状态）、left/right/mid/message
 * 4. steps 注入 PlaybackController → 驱动 UI 渲染
 *
 * 【特殊交互设计】
 * - 数组大小可通过滑块动态调节（5~30），自动重新生成随机有序数组
 * - 目标值可手动输入或随机选择
 * - 初始加载时自动生成一个 16 元素的示例数组
 */
import React, { useState, useEffect, useCallback } from 'react';
import { BinarySearchAlgorithm, BinarySearchStep, ArrayElement } from '../../models/BinarySearchAlgorithm';
import { PlaybackController } from '../../models/PlaybackController';
import PlaybackControls from '../Visualization/PlaybackControls';
import CodeSyncPanel from '../Visualization/CodeSyncPanel';
import VariableMonitorPanel from '../Visualization/VariableMonitorPanel';

/** 二分查找伪代码定义 */
const BINARY_SEARCH_PSEUDOCODE = {
  title: '二分查找 伪代码',
  lines: [
    { text: 'function binarySearch(arr, target):', indent: 0 },
    { text: 'left = 0, right = arr.length - 1', indent: 1 },
    { text: 'while left <= right:', indent: 1 },
    { text: 'mid = floor((left + right) / 2)', indent: 2 },
    { text: 'if arr[mid] == target:', indent: 2 },
    { text: 'return mid', indent: 3 },
    { text: 'else if arr[mid] < target:', indent: 2 },
    { text: 'left = mid + 1', indent: 3 },
    { text: 'else:', indent: 2 },
    { text: 'right = mid - 1', indent: 3 },
    { text: 'return -1', indent: 1 },
  ]
};

/** 根据 ArrayElement 状态返回背景颜色 CSS 类 */
const getElementColor = (state: ArrayElement['state']) => {
  switch (state) {
    case 'searching': return 'bg-yellow-400 border-yellow-500';
    case 'found': return 'bg-green-400 border-green-500';
    case 'eliminated': return 'bg-gray-300 border-gray-400';
    case 'mid': return 'bg-orange-400 border-orange-500';
    default: return 'bg-blue-400 border-blue-500';
  }
};

/** 根据 ArrayElement 状态返回文字颜色 */
const getTextColor = (state: ArrayElement['state']) => {
  switch (state) {
    case 'eliminated': return 'text-gray-500';
    default: return 'text-white';
  }
};

/**
 * BinarySearch 可视化主组件
 *
 * 与其他组件不同：
 * - 不使用通用 Controls 组件，而是内嵌自定义参数区（滑块 + 输入框 + 按钮）
 * - 初始 useEffect 自动生成默认数组
 * - 播放按钮在无步骤时自动触发 handleStart
 */
const BinarySearch: React.FC = () => {
  const [algorithm] = useState(() => new BinarySearchAlgorithm());
  const [playbackController] = useState(() => new PlaybackController<BinarySearchStep>(600));
  const [playbackState, setPlaybackState] = useState(playbackController.getState());
  /* 数组大小，可通过滑块调节 */
  const [arraySize, setArraySize] = useState(16);
  /* 目标查找值 */
  const [target, setTarget] = useState(50);

  /* Effect: 订阅播放控制器 */
  useEffect(() => {
    const unsubscribe = playbackController.subscribe((state) => setPlaybackState(state));
    return () => unsubscribe();
  }, [playbackController]);

  /** 生成新的有序数组 */
  const handleGenerate = useCallback((size: number) => {
    playbackController.reset();
    algorithm.generateSortedArray(size);
    setArraySize(size);
  }, [algorithm, playbackController]);

  /** 开始二分查找 */
  const handleStart = useCallback(() => {
    algorithm.generateSortedArray(arraySize);
    algorithm.binarySearch(target);
    const steps = algorithm.getSteps();
    if (steps.length > 0) {
      playbackController.setSteps(steps);
      playbackController.play();
    }
  }, [algorithm, playbackController, arraySize, target]);

  /** 重置所有状态 */
  const handleReset = useCallback(() => {
    playbackController.reset();
    algorithm.reset();
  }, [playbackController, algorithm]);

  /* 初始加载时自动生成一个 16 元素的示例数组 */
  useEffect(() => { handleGenerate(16); }, [handleGenerate]);

  /* 从 playbackState 提取当前步骤数据 */
  const currentStep = playbackState.currentStepIndex >= 0 && playbackState.currentStepIndex < playbackState.steps.length
    ? playbackState.steps[playbackState.currentStepIndex]
    : null;
  const displayArray = currentStep?.array || algorithm.getState().array.map(v => ({ ...v, state: 'default' as const }));
  const left = currentStep?.left ?? 0;
  const right = currentStep?.right ?? displayArray.length - 1;
  const mid = currentStep?.mid ?? -1;
  const highlightLine = currentStep?.highlightLine ?? -1;
  const variables = currentStep?.variables || { left: 0, right: displayArray.length - 1, mid: -1, target };
  const message = currentStep?.message || '';

  /* 动态计算每个元素的显示宽度：随数组大小自适应 */
  const boxWidth = Math.max(36, Math.min(56, 700 / displayArray.length));

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">二分查找可视化</h2>
      <p className="text-gray-600 mb-4 text-sm">在有序数组中通过不断缩小搜索范围来高效查找目标元素</p>

      {/* 三栏布局：左侧数组展示占2栏，右侧信息占1栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 左侧区域（2栏宽）：数组可视化 + 统计卡片 + 播放控制 + 数据设置 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 数组元素条形图展示 */}
          <div className="border rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center justify-center gap-1 flex-wrap py-4">
              {displayArray.map((item, index) => (
                <div key={index} className="flex flex-col items-center" style={{ width: `${boxWidth}px` }}>
                  {/* 元素方块：颜色由状态决定 */}
                  <div className={`w-full h-12 flex items-center justify-center rounded border-2 transition-all duration-200 ${getElementColor(item.state)}`}>
                    <span className={`text-sm font-bold ${getTextColor(item.state)}`}>{item.value}</span>
                  </div>
                  {/* 元素索引号 */}
                  <span className="text-xs text-gray-400 mt-1">{index}</span>
                </div>
              ))}
            </div>

            {/* 指针标记行：L(左边界)、R(右边界)、M(中间位置) */}
            <div className="flex items-center justify-center gap-1 flex-wrap mt-2">
              {displayArray.map((_, index) => (
                <div key={index} className="flex flex-col items-center" style={{ width: `${boxWidth}px` }}>
                  <div className="h-6 flex items-center justify-center">
                    {index === left && (<span className="text-xs font-bold text-blue-600">← L</span>)}
                    {index === right && (<span className="text-xs font-bold text-red-600">R →</span>)}
                    {index === mid && mid >= 0 && (<span className="text-xs font-bold text-orange-600">↑ M</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 三列统计卡片：搜索范围、中间位置、步骤进度 */}

          {/* 播放控制条 */}

          {/* 操作提示消息 */}

          {/* 数据设置区：数组大小滑块 + 目标值输入 + 按钮 */}

        </div>

        {/* 右侧区域（1栏宽）：代码同步 + 变量监控 + 复杂度 + 说明 */}

      </div>
    </div>
  );
};

export default BinarySearch;
