/**
 * @file PlaybackControls.tsx
 * @description 高级播放控制器组件 - 算法可视化管线的"完整控制器视图"层
 *
 * 【管线位置】Model → Controller → View（本组件）
 * - 上游：接收完整的 PlaybackState<T> 状态对象和用户交互事件
 * - 本层：提供专业级播放控制 UI（播放/暂停/步进/进度条/速度调节）
 * - 下游：通过 7 个回调函数精确控制 PlaybackController 的状态机转换
 *
 * 【核心职责】
 * 1. 实现完整的状态机可视化：空闲→播放中→暂停→完成 各状态的 UI 反馈
 * 2. 提供精细的步进控制：单步前进/后退、跳转到任意步骤、跳到末尾
 * 3. 可视化播放进度：进度条支持点击跳转，实时显示当前步/总步数
 * 4. 多档位速度控制：7 种预设速度（0.25x ~ 4x），满足不同学习节奏需求
 *
 * 【与 PlaybackController 的协作模式】
 * - 采用"状态注入 + 事件上报"的双向数据流模式
 * - PlaybackController 作为唯一数据源（Single Source of Truth）
 * - 本组件负责将复杂状态转换为直观的 UI 表现
 *
 * 【状态机说明】
 * ┌─────────┐    play     ┌──────────┐    complete   ┌────────┐
 * │  空闲   │ ──────────► │  播放中  │ ──────────► │  完成  │
 * │ (idle)  │             │(playing) │              │(done)  │
 * └─────────┘             └────┬─────┘              └────▲───┘
 *     ▲                        │ pause                   │
 *     │                        ▼                         │ reset
 *     └────────────────  ┌──────────┐  ◄─────────────────┘
 *                       │  暂停中   │
 *                       │(paused)  │
 *                       └──────────┘
 */

import React from 'react';
import { PlaybackState } from '../../models/PlaybackController';
import { FiPlay, FiPause, FiSkipForward, FiChevronLeft, FiChevronRight, FiRotateCcw } from 'react-icons/fi';

/**
 * PlaybackControls 组件属性接口（泛型设计）
 * @template T - 步骤数据的类型参数，支持任意算法的数据模型
 *
 * @property {PlaybackState<T>} playbackState - 完整的播放状态对象，包含：
 *   - isPlaying: 是否正在自动播放（定时器运行中）
 *   - speed: 当前播放倍速（对应 SPEED_OPTIONS 中的值）
 *   - currentStepIndex: 当前显示的步骤索引（从 0 开始）
 *   - totalSteps: 总步骤数（算法执行产生的快照总数）
 *   - isComplete: 是否已播放到最后一步
 *
 * @property {() => void} onPlay - 播放回调，
 *   通知 PlaybackController 启动 setInterval 定时器，开始自动步进
 *
 * @property {() => void} onPause - 暂停回调，
 *   通知 PlaybackController 清除 setInterval 定时器，保持当前步骤不变
 *
 * @property {() => void} onStepForward - 单步前进回调，
 *   将 currentStepIndex +1，触发 VisualizationCanvas 重绘
 *
 * @property {() => void} onStepBackward - 单步后退回调，
 *   将 currentStepIndex -1，回退到上一步骤的状态
 *
 * @property {() => void} onReset - 完全重置回调，
 *   currentStepIndex 归零、清除高亮、停止定时器、恢复初始状态
 *
 * @property {(speed: number) => void} onSpeedChange - 倍速变更回调，
 *   接收预设速度值，PlaybackController 需重建定时器以应用新速度
 *
 * @property {(index: number) => void} onGoToStep - 跳转到指定步骤回调，
 *   直接设置 currentStepIndex = index，用于进度条点击或跳到末尾
 */
interface PlaybackControlsProps<T> {
  playbackState: PlaybackState<T>;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onGoToStep: (index: number) => void;
}

/**
 * 预设播放速度选项数组
 * 覆盖从超慢速（适合初学者理解每一步）到超快速（快速预览整体过程）的场景
 * - 0.25x / 0.5x：教学演示模式，每个步骤停留足够长时间
 * - 1x：标准速度，平衡可观察性和效率
 * - 1.5x / 2x / 3x / 4x：快速浏览模式，用于已熟悉算法的用户
 */
const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2, 3, 4];

/**
 * 高级播放控制器组件 - 专业级算法动画控制面板
 *
 * 【渲染策略】
 * - 采用垂直布局：标题栏 → 进度条 → 控制按钮组 → 速度选择器
 * - 使用 react-icons 提供一致的图标风格
 * - 进度条使用自定义点击事件实现跳转功能（非原生 <input range>）
 *
 * 【按钮禁用逻辑】
 * - 重置按钮：无步骤时禁用（!hasSteps）
 * - 步退按钮：已在第一步或无步骤时禁用
 * - 播放/暂停按钮：无步骤时禁用
 * - 步进按钮：已在最后一步或无步骤时禁用
 * - 跳到末尾：无步骤时禁用
 *
 * 【性能考虑】
 * - 进度条宽度变化使用 CSS transition（duration-150）实现平滑过渡
 * - 速度按钮使用动态类名而非内联样式，利于 CSS 引擎优化
 *
 * @param props - 组件属性（泛型）
 * @returns {JSX.Element} 播放控制面板 DOM 元素
 */
const PlaybackControls = <T,>({
  playbackState,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onReset,
  onSpeedChange,
  onGoToStep
}: PlaybackControlsProps<T>) => {
  // 从 playbackState 中解构常用字段，减少模板中的属性访问链长度
  const { isPlaying, speed, currentStepIndex, totalSteps, isComplete } = playbackState;
  
  // 判断是否存在可用步骤（总步骤数 > 0）
  const hasSteps = totalSteps > 0;
  
  // 计算当前播放进度百分比（0-100），用于进度条宽度
  // 公式：(当前步骤 + 1) / 总步骤 × 100%，+1 是因为索引从 0 开始
  const progress = hasSteps ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      {/* 
       * 标题栏区域 - 显示标题和当前进度信息
       * 包含两部分：
       * 1. 左侧固定标题"播放控制"
       * 2. 右侧动态信息：步骤计数器 + 完成状态标签
       */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">播放控制</h3>
        <div className="flex items-center gap-2">
          {/* 
           * 步骤计数器 - 格式："当前步骤 / 总步骤"
           * 无数据时显示 "0 / 0"
           */}
          <span className="text-xs text-gray-500">
            {hasSteps ? `${currentStepIndex + 1} / ${totalSteps}` : '0 / 0'}
          </span>
          
          {/* 
           * 完成状态标签 - 仅在 isComplete=true 时显示
           * 使用绿色背景的圆角标签提供视觉反馈
           */}
          {isComplete && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">完成</span>
          )}
        </div>
      </div>

      {/* 
       * 自定义进度条 - 支持点击跳转到任意步骤
       * 
       * 【交互逻辑】
       * 1. 用户点击进度条任意位置
       * 2. 计算点击位置相对于进度条宽度的比例（ratio = x / width）
       * 3. 根据比例计算目标步骤索引：stepIndex = floor(ratio × totalSteps)
       * 4. 边界检查后调用 onGoToStep 跳转
       * 
       * 【视觉表现】
       * - 背景：灰色圆角条（bg-gray-200）
       * - 前景：蓝色填充条（bg-indigo-500），宽度 = progress%
       * - 过渡：150ms 平滑动画（transition-all duration-150）
       */}
      <div className="relative w-full h-2 bg-gray-200 rounded-full cursor-pointer"
        onClick={(e) => {
          // 获取进度条的边界矩形，用于计算相对坐标
          const rect = e.currentTarget.getBoundingClientRect();
          // 计算点击位置相对于进度条左边缘的偏移量
          const x = e.clientX - rect.left;
          // 转换为 0-1 的比例值
          const ratio = x / rect.width;
          // 根据比例计算目标步骤索引，向下取整确保不越界
          const stepIndex = Math.floor(ratio * totalSteps);
          // 边界安全检查后执行跳转
          if (stepIndex >= 0 && stepIndex < totalSteps) {
            onGoToStep(stepIndex);
          }
        }}
      >
        {/* 
         * 进度填充层 - 宽度由 progress 变量动态控制
         * 使用 absolute 定位覆盖在背景层之上
         */}
        <div
          className="absolute h-full bg-indigo-500 rounded-full transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 
       * 主控制按钮组 - 水平居中排列的 5 个操作按钮
       * 
       * 【按钮布局】[重置] [步退] [播放/暂停] [步进] [跳到末尾]
       * 
       * 【状态相关逻辑】
       * - 播放/暂停按钮是核心控件，使用更大的尺寸和醒目的配色（indigo-500）
       * - 其他按钮为辅助控件，统一使用灰色 hover 效果
       * - 所有按钮在 disabled 时降低透明度并禁止鼠标交互
       */}
      <div className="flex items-center justify-center gap-2">
        {/* 
         * 重置按钮 - 将播放状态完全恢复到初始状态
         * 图标：FiRotateCcw（逆时针旋转箭头）
         * 禁用条件：无可用步骤时
         */}
        <button
          onClick={onReset}
          disabled={!hasSteps}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="重置"
        >
          <FiRotateCcw className="w-4 h-4" />
        </button>

        {/* 
         * 步退按钮 - 回退到上一步骤
         * 图标：FiChevronLeft（左箭头）
         * 禁用条件：已在第一步（currentStepIndex <= 0）或无步骤
         */}
        <button
          onClick={onStepBackward}
          disabled={!hasSteps || currentStepIndex <= 0}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="步退"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>

        {/* 
         * 播放/暂停切换按钮 - 核心控制按钮
         * 
         * 【状态机转换】
         * - 当 isPlaying=false 时显示播放图标（FiPlay），点击触发 onPlay
         * - 当 isPlaying=true 时显示暂停图标（FiPause），点击触发 onPause
         * 
         * 【视觉差异化】
         * - 圆形按钮（rounded-full）+ 主色调背景（bg-indigo-500）
         * - 更大的 padding（p-3 vs p-2）和图标尺寸（w-5 h-5 vs w-4 h-4）
         * - 白色文字 + hover 时加深背景色
         */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={!hasSteps}
          className="p-3 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5" />}
        </button>

        {/* 
         * 步进按钮 - 前进到下一步骤
         * 图标：FiChevronRight（右箭头）
         * 禁用条件：已在最后一步（currentStepIndex >= totalSteps - 1）或无步骤
         */}
        <button
          onClick={onStepForward}
          disabled={!hasSteps || currentStepIndex >= totalSteps - 1}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="步进"
        >
          <FiChevronRight className="w-5 h-5" />
        </button>

        {/* 
         * 跳到末尾按钮 - 直接跳到最后一步，查看最终结果
         * 图标：FiSkipForward（快进箭头）
         * 点击时调用 onGoToStep(totalSteps - 1)
         * 禁用条件：无可用步骤
         */}
        <button
          onClick={() => onGoToStep(totalSteps - 1)}
          disabled={!hasSteps}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="跳到末尾"
        >
          <FiSkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* 
       * 速度选择器 - 7 个预设倍速按钮
       * 
       * 【交互逻辑】
       * - 点击某个速度按钮立即调用 onSpeedChange(s)
       * - 当前选中的速度以高亮样式显示（indigo-500 背景 + 白色文字）
       * - 未选中速度以灰色背景显示，hover 时略微加深
       * 
       * 【布局策略】
       * - 使用 flexbox + flex-wrap 实现自适应换行
       * - 在窄屏容器中自动换行显示
       */}
      <div className="flex flex-wrap items-center justify-center gap-1">
        <span className="text-xs text-gray-500 mr-1">速度:</span>
        
        {/* 
         * 遍历 SPEED_OPTIONS 数组生成速度按钮
         * 每个按钮显示如 "0.25x"、"1x"、"4x" 等
         */}
        {SPEED_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              speed === s
                ? 'bg-indigo-500 text-white'  // 选中状态：主色调高亮
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'  // 未选中状态：灰色默认
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
};

export default PlaybackControls;