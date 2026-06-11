/**
 * @file AnimationControls.tsx
 * @description 动画控制面板组件 - 算法可视化管线的"控制器视图"层
 *
 * 【管线位置】Model → Controller → View（本组件）
 * - 上游：接收用户交互事件（点击/拖动），转换为控制指令传递给 PlaybackController
 * - 本层：提供播放/暂停/重置/速度调节的 UI 控件
 * - 下游：通过回调函数通知父组件（通常是 PlaybackController 容器）执行状态转换
 *
 * 【核心职责】
 * 1. 提供动画生命周期的基本控制（开始/重置）
 * 2. 提供播放速度的连续调节能力（1-10 档位）
 * 3. 根据外部状态禁用/启用控件，防止非法操作
 *
 * 【与 PlaybackController 的协作】
 * - 本组件是 PlaybackController 的"薄视图层"，不维护业务状态
 * - 所有回调函数由 PlaybackController 注入，实现关注点分离
 * - disabled 属性反映 PlaybackController 的内部状态（如正在运行时禁用 Start）
 */

import React from 'react';

/**
 * AnimationControls 组件属性接口
 * @property {() => void} onStart - 开始播放回调，通知 PlaybackController 启动自动步进定时器
 * @property {() => void} onReset - 重置回调，通知 PlaybackController 将 currentStepIndex 归零并清除高亮状态
 * @property {(speed: number) => void} onSpeedChange - 速度变更回调，
 *   接收 1-10 的整数值，PlaybackController 据此调整 setInterval 的间隔时间
 * @property {boolean} disabled - 全局禁用标志，
 *   通常在动画运行期间或无数据时为 true，防止用户重复触发操作
 */
interface AnimationControlsProps {
  onStart: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  disabled: boolean;
}

/**
 * 动画控制面板组件 - 基础版播放控制 UI
 *
 * 【渲染策略】
 * - 采用水平布局排列控制按钮和速度滑块
 * - 使用原生 HTML <input type="range"> 实现速度调节，无需额外依赖
 * - 所有按钮统一应用 disabled 状态，保持 UI 一致性
 *
 * 【状态管理】
 * - 无状态组件（Stateless Component），完全依赖 props 驱动
 * - 不缓存任何用户输入，每次交互立即通过回调上报
 *
 * 【适用场景】
 * - 适用于简单算法演示场景（如单次排序过程）
 * - 对于需要精细控制的场景（如步进、进度条），应使用 PlaybackControls 组件替代
 *
 * @param props - 组件属性
 * @returns {JSX.Element} 动画控制面板 DOM 元素
 */
const AnimationControls: React.FC<AnimationControlsProps> = ({
  onStart,
  onReset,
  onSpeedChange,
  disabled,
}) => {
  return (
    <div className="animation-controls">
      {/* 
       * 开始按钮 - 触发动画自动播放
       * disabled 时表示：动画已在运行中 或 无可用数据
       */}
      <button onClick={onStart} disabled={disabled}>
        Start
      </button>
      
      {/* 
       * 重置按钮 - 将动画状态恢复到初始位置
       * 通常会清空高亮、将步骤索引归零、停止定时器
       */}
      <button onClick={onReset} disabled={disabled}>
        Reset
      </button>
      
      {/* 
       * 速度控制滑块 - 调节动画播放速率
       * - 范围：1（最慢）到 10（最快）
       * - 默认值：1（保守的初始速度）
       * - 回调参数：parseInt 确保传递数值类型而非字符串
       */}
      <label>
        Speed:
        <input
          type="range"
          min="1"
          max="10"
          defaultValue="1"
          onChange={(e) => onSpeedChange(parseInt(e.target.value))}
          disabled={disabled}
        />
      </label>
    </div>
  );
};

export default AnimationControls;