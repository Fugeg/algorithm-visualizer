/**
 * 找零钱问题（贪心算法）可视化组件
 *
 * 【可视化策略】
 * 采用「贪心算法专用可视化架构」。找零钱是贪心策略的经典应用，
 * 可视化重点在于：
 * - 当前剩余金额的实时显示，展示贪心选择的"贪婪"过程
 * - 已选硬币的网格卡片展示：每个面值 × 数量
 * - 每步选择一个最大面值硬币的过程追踪
 *
 * 【数据流向】Model → Step → UI
 * 1. 用户输入 amount + coins → GreedyControls → greedyAlgorithm.makeChange(amount, coins)
 * 2. Model 按面值从大到小遍历，每选择一种硬币生成 GreedyStep
 * 3. 每个 GreedyStep.state 包含：remaining（剩余金额）、result（已选硬币列表 [{coin, count}]）
 * 4. steps 注入 PlaybackController → 驱动 UI 渲染
 */
import React, { useState, useEffect } from 'react';
import { GreedyAlgorithm, GreedyStep } from '../../models/GreedyAlgorithm';
import { PlaybackController } from '../../models/PlaybackController';
import GreedySteps from './Greedy/GreedySteps';
import GreedyControls from './Greedy/GreedyControls';
import PlaybackControls from '../Visualization/PlaybackControls';
import CodeSyncPanel from '../Visualization/CodeSyncPanel';
import VariableMonitorPanel from '../Visualization/VariableMonitorPanel';

/** 找零钱贪心伪代码定义 */
const MAKE_CHANGE_PSEUDOCODE = {
  title: '找零钱贪心 伪代码',
  lines: [
    { text: 'function makeChange(amount, coins):', indent: 0 },
    { text: 'sort coins in descending order', indent: 1 },
    { text: 'result = []', indent: 1 },
    { text: 'remaining = amount', indent: 1 },
    { text: 'for each coin in coins:', indent: 1 },
    { text: 'count = remaining / coin', indent: 2 },
    { text: 'if count > 0:', indent: 2 },
    { text: 'result.push({coin, count})', indent: 3 },
    { text: 'remaining = remaining % coin', indent: 3 },
    { text: 'if remaining == 0: break', indent: 2 },
    { text: 'return result', indent: 1 },
  ]
};

/**
 * MakeChange 可视化主组件
 *
 * 采用与 DP 组件类似的观察者模式架构：
 * - greedyAlgorithm: GreedyAlgorithm 实例
 * - state / playbackState: 订阅的状态
 * - renderCurrentState(): 自定义渲染函数，展示剩余金额 + 已选硬币网格
 */
const MakeChange: React.FC = () => {
  const [greedyAlgorithm] = useState(() => new GreedyAlgorithm());
  const [state, setState] = useState(() => greedyAlgorithm.getState());
  const [isRunning, setIsRunning] = useState(false);
  const [playbackController] = useState(() => new PlaybackController<GreedyStep>(500));
  const [playbackState, setPlaybackState] = useState(playbackController.getState());

  /* Effect: 订阅贪心算法模型状态变更 */
  useEffect(() => {
    const unsubscribe = greedyAlgorithm.subscribe((newState) => {
      setState(newState);
    });
    return () => { unsubscribe(); };
  }, [greedyAlgorithm]);

  /* Effect: 订阅播放控制器状态变更 */
  useEffect(() => {
    const unsubscribe = playbackController.subscribe((newState) => {
      setPlaybackState(newState);
    });
    return () => unsubscribe();
  }, [playbackController]);

  /** 开始执行找零钱贪心算法 */
  const handleStart = async ({ amount, coins }: { amount: number; coins: number[] }) => {
    setIsRunning(true);
    playbackController.reset();
    await greedyAlgorithm.makeChange(amount, coins);
    const steps = greedyAlgorithm.getState().steps;
    if (steps.length > 0) {
      playbackController.setSteps(steps);
    }
    setIsRunning(false);
  };

  /** 重置所有状态 */
  const handleReset = () => {
    greedyAlgorithm.reset();
    playbackController.reset();
  };

  /** 设置算法执行延迟 */
  const handleSetDelay = (delay: number) => {
    greedyAlgorithm.setDelay(delay);
  };

  /**
   * 渲染当前步骤状态详情
   *
   * 两个核心区域：
   * 1. 状态概览：剩余金额 + 已用硬币总数
   * 2. 已选硬币网格：每种面值一张卡片，显示面值和数量
   */
  const renderCurrentState = () => {
    if (!state.steps[state.currentStep]) return null;

    const { remaining, result = [] } = state.steps[state.currentStep].state;

    return (
      <div className="space-y-4">
        {/* 区域1：状态概览 —— 剩余金额和已用硬币数 */}
        <div>
          <h3 className="font-semibold mb-2">当前状态</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded">
              <span className="text-gray-600">剩余金额：</span>
              <span className="font-mono">{remaining}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <span className="text-gray-600">已用硬币数：</span>
              <span className="font-mono">
                {result.reduce((sum: number, { count }: { count: number }) => sum + count, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* 区域2：已选硬币网格 —— 每种面值一个绿色卡片 */}
        <div>
          <h3 className="font-semibold mb-2">已选硬币</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {result.map(({ coin, count }: { coin: number; count: number }, index: number) => (
              <div key={index} className="p-2 bg-green-50 rounded border border-green-200">
                <div className="text-center">
                  <span className="font-mono text-lg">{coin}¢</span>
                  <span className="text-sm text-gray-500 ml-2">× {count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">找零钱问题（贪心算法）</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左栏：步骤列表 */}
        <div>
          <GreedySteps
            steps={state.steps}
            currentStep={state.currentStep}
          />
        </div>

        {/* 右栏：控制面板 + 状态展示 + 辅助信息 */}
        <div className="space-y-6">
          <GreedyControls
            onStart={handleStart}
            onReset={handleReset}
            onSetDelay={handleSetDelay}
            isRunning={isRunning}
            inputType="change"
            defaultValue={{
              amount: 63,
              coins: '1,5,10,25'
            }}
          />

          <div className="bg-white rounded-lg shadow p-4">
            {renderCurrentState()}
          </div>

          <PlaybackControls
            state={state}
            dispatch={dispatch}
          />
          <CodeSyncPanel
            code={code}
            currentLine={state.currentStep >= 0 && state.currentStep < state.steps.length ? state.steps[state.currentStep].highlightLine ?? -1 : -1}
          />
          <VariableMonitorPanel
            variables={state.currentStep >= 0 && state.currentStep < state.steps.length ? state.steps[state.currentStep].variables : {}}
          />
          {/* 复杂度/说明/图略 —— 与其他组件结构一致 */}
        </div>
      </div>
    </div>
  );
};

export default MakeChange;
