/**
 * 全排列回溯算法可视化组件
 *
 * 【可视化策略】
 * 采用「回溯算法专用可视化架构」。全排列是回溯思想的入门级经典问题，
 * 可视化重点在于：
 * - 当前排列（current array）的逐步构建过程
 - - 已使用数字（used[]）的标记状态，用灰色表示已占用
 * - 尝试（trying）和回溯（backtrack）位置的视觉区分
 * - 找到的完整解（solutions）以网格形式展示
 *
 * 【数据流向】Model → Step → UI
 * 1. 用户输入数组 nums → backtrackingAlgorithm.permutations(nums)
 * 2. Model 通过回溯遍历决策树，每步生成 BacktrackingStep
 * 3. BacktrackingStep.state 包含：current（当前排列）、used（使用标记）、trying（尝试索引）、backtrack（回溯索引）
 * 4. 找到完整解时 step.type='solution'，解存入 state.solutions 数组
 */
import React, { useState, useEffect } from 'react';
import { BacktrackingAlgorithm, BacktrackingStep } from '../../models/BacktrackingAlgorithm';
import { PlaybackController } from '../../models/PlaybackController';
import BacktrackingSteps from './Backtracking/BacktrackingSteps';
import BacktrackingControls from './Backtracking/BacktrackingControls';
import PlaybackControls from '../Visualization/PlaybackControls';
import CodeSyncPanel from '../Visualization/CodeSyncPanel';
import VariableMonitorPanel from '../Visualization/VariableMonitorPanel';

/** 全排列回溯伪代码定义 */
const PERMUTATIONS_PSEUDOCODE = {
  title: '全排列回溯 伪代码',
  lines: [
    { text: 'function permute(nums):', indent: 0 },
    { text: 'current = [], used = [false] × n', indent: 1 },
    { text: 'backtrack():', indent: 1 },
    { text: 'if current.length == n:', indent: 2 },
    { text: 'add copy of current to results', indent: 3 },
    { text: 'return', indent: 3 },
    { text: 'for i = 0 to n-1:', indent: 2 },
    { text: 'if used[i]: continue', indent: 3 },
    { text: 'used[i] = true', indent: 3 },
    { text: 'current.push(nums[i])', indent: 3 },
    { text: 'backtrack()', indent: 3 },
    { text: 'current.pop()', indent: 3 },
    { text: 'used[i] = false', indent: 3 },
  ]
};

/**
 * Permutations 可视化主组件
 *
 * 额外渲染函数：
 * - renderCurrentState(): 展示当前排列 + 可用数字（双行布局）
 * - renderSolutions(): 展示所有找到的完整排列解（网格卡片）
 */
const Permutations: React.FC = () => {
  const [backtrackingAlgorithm] = useState(() => new BacktrackingAlgorithm());
  const [state, setState] = useState(() => backtrackingAlgorithm.getState());
  const [isRunning, setIsRunning] = useState(false);
  /* 回溯算法步骤较多，初始延迟设为 300ms 以加快播放速度 */
  const [playbackController] = useState(() => new PlaybackController<BacktrackingStep>(300));
  const [playbackState, setPlaybackState] = useState(playbackController.getState());

  useEffect(() => {
    const unsubscribe = backtrackingAlgorithm.subscribe((newState) => setState(newState));
    return () => { unsubscribe(); };
  }, [backtrackingAlgorithm]);

  useEffect(() => {
    const unsubscribe = playbackController.subscribe((newState) => setPlaybackState(newState));
    return () => unsubscribe();
  }, [playbackController]);

  /** 开始执行全排列回溯算法 */
  const handleStart = async (nums: number[]) => {
    setIsRunning(true);
    playbackController.reset();
    await backtrackingAlgorithm.permutations(nums);
    const steps = backtrackingAlgorithm.getState().steps;
    if (steps.length > 0) playbackController.setSteps(steps);
    setIsRunning(false);
  };

  /** 重置所有状态 */
  const handleReset = () => {
    backtrackingAlgorithm.reset();
    playbackController.reset();
  };

  /** 设置算法执行延迟 */
  const handleSetDelay = (delay: number) => {
    backtrackingAlgorithm.setDelay(delay);
  };

  /**
   * 渲染当前步骤的状态详情
   *
   * 双行展示：
   * - 第一行「当前排列」：每个元素一个方块，最后一个元素若正在尝试则黄色，回溯位置则红色
   * - 第二行「可用数字」：每个候选数字一个方块，已使用的变灰
   */
  const renderCurrentState = () => {
    if (!state.steps[state.currentStep]) return null;
    const { current, used, trying, backtrack } = state.steps[state.currentStep].state;

    return (
      <div className="space-y-4">
        {/* 当前行：当前构建中的排列 */}
        <div className="flex items-center space-x-4">
          <span className="text-gray-700">当前排列:</span>
          <div className="flex space-x-2">
            {current.map((num: number, index: number) => (
              <div key={index} className={`w-8 h-8 flex items-center justify-center rounded border
                ${trying !== undefined && index === current.length - 1
                  ? 'bg-yellow-100 border-yellow-500'       /* 最后一个位置正在尝试新数字 */
                  : backtrack !== undefined && index === current.length
                  ? 'bg-red-100 border-red-500'               /* 回溯时标记被弹出的位置 */
                  : 'bg-white border-gray-300'                /* 普通已选元素 */}
              `}>
                {num}
              </div>
            ))}
          </div>
        </div>

        {/* 可用数字行：显示哪些数字还可以选择 */}
        <div className="flex items-center space-x-4">
          <span className="text-gray-700">可用数字:</span>
          <div className="flex space-x-2">
            {used.map((isUsed: boolean, index: number) => (
              <div key={index} className={`w-8 h-8 flex items-center justify-center rounded border
                ${isUsed ? 'bg-gray-100 border-gray-300 text-gray-400' : 'bg-white border-gray-300'}`}>
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /**
   * 渲染所有已找到的完整解
   * 以网格卡片形式展示，每个卡片内是一个完整的排列
   */
  const renderSolutions = () => {
    if (!state.solutions.length) return null;
    return (
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">所有解:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {state.solutions.map((solution: number[], index: number) => (
            <div key={index} className="p-2 bg-green-50 rounded border border-green-200 flex items-center justify-center">
              [{solution.join(', ')}]
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">全排列回溯算法可视化</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <BacktrackingSteps steps={state.steps} currentStep={state.currentStep} />
        </div>

        <div className="space-y-6">
          <BacktrackingControls onStart={handleStart} onReset={handleReset} onSetDelay={handleSetDelay}
            isRunning={isRunning} inputType="array" defaultValue="1,2,3" />

          {/* 当前排列状态 */}
          <div className="bg-white rounded-lg shadow p-4">{renderCurrentState()}</div>

          {/* 所有解的网格展示 */}
          <div className="bg-white rounded-lg shadow p-4">{renderSolutions()}</div>

          {/* 播放控制、代码同步、变量监控、复杂度分析、说明 —— 结构一致 */}

          <PlaybackControls playbackState={playbackState}
            onPlay={() => playbackController.play()} onPause={() => playbackController.pause()}
            onStepForward={() => playbackController.stepForward()} onStepBackward={() => playbackController.stepBackward()}
            onReset={() => playbackController.reset()} onSpeedChange={(s) => playbackController.setSpeed(s)}
            onGoToStep={(i) => playbackController.goToStep(i)} />

          <CodeSyncPanel title={PERMUTATIONS_PSEUDOCODE.title} codeLines={PERMUTATIONS_PSEUDOCODE.lines}
            highlightLine={playbackState.currentStepIndex >= 0 && playbackState.steps[playbackState.currentStepIndex]
              ? playbackState.steps[playbackState.currentStepIndex].highlightLine ?? -1 : -1} />

          <VariableMonitorPanel variables={
            playbackState.currentStepIndex >= 0 && playbackState.steps[playbackState.currentStepIndex]
              ? (() => {
                  const stepState = playbackState.steps[playbackState.currentStepIndex].state;
                  const vars: Record<string, string | number> = {};
                  if (stepState.current) vars['当前排列'] = `[${stepState.current.join(', ')}]`;
                  if (stepState.used) vars['可用位置'] = stepState.used.filter((u: boolean) => !u).length;
                  if (stepState.trying !== undefined) vars['尝试索引'] = stepState.trying;
                  if (stepState.backtrack !== undefined) vars['回溯索引'] = stepState.backtrack;
                  return vars;
                })()
              : {}}

          />
          {/* 复杂度 O(n!)、算法说明、可视化图例 */}

        </div>
      </div>

      {state.message && (<div className="mt-4 p-2 bg-blue-100 text-blue-700 rounded">{state.message}</div>)}
    </div>
  );
};

export default Permutations;
