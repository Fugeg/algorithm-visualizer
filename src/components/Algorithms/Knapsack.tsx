/**
 * 0/1 背包问题动态规划可视化组件
 *
 * 【可视化策略】
 * 采用与 LIS 相同的动态规划专用可视化架构。0/1 背包问题是二维 DP 的典型代表，
 * 可视化重点在于：
 * - 二维 DP 表格（dp[i][w]）的逐步填充，行=前i个物品，列=当前容量
 * - 物品列表的展示：每个物品的重量和价值，以及是否被选中
 * - 当前考虑的物品和容量的高亮追踪
 * - 最终选中物品集合的回溯展示
 *
 * 【数据流向】Model → Step → UI
 * 1. 用户输入（weights, values, capacity）→ DPControls → dp.knapsack(weights, values, capacity)
 * 2. DynamicProgramming Model 执行二维 DP 填表，每步生成 DPStep
 * 3. 每个 DPStep.state 包含：weights[], values[], dp[][], current{item, weight}, selected[]
 * 4. steps 注入 PlaybackController → 驱动 UI 步进渲染
 *
 * 【特殊交互设计】
 * - DP 表格使用二维高亮：highlightCell 指向当前计算的 (item+1, weight) 单元格
 * - 物品表格中同时用颜色标记「当前物品」（黄色）和「已选物品」（绿色）
 * - 已选物品区域以卡片形式展示每个选中物品的详细信息
 */
import React, { useState, useEffect } from 'react';
import { DynamicProgramming, DPStep } from '../../models/DynamicProgramming';
import { PlaybackController } from '../../models/PlaybackController';
import DPSteps from './DP/DPSteps';
import DPControls from './DP/DPControls';
import DPTable from './DP/DPTable';
import PlaybackControls from '../Visualization/PlaybackControls';
import CodeSyncPanel from '../Visualization/CodeSyncPanel';
import VariableMonitorPanel from '../Visualization/VariableMonitorPanel';

/** 0/1背包问题伪代码定义 */
const KNAPSACK_PSEUDOCODE = {
  title: '0/1 背包问题 伪代码',
  lines: [
    { text: 'function knapsack(weights, values, capacity):', indent: 0 },
    { text: 'n = weights.length', indent: 1 },
    { text: 'dp = (n+1) × (capacity+1) matrix', indent: 1 },
    { text: 'for i = 1 to n:', indent: 1 },
    { text: 'for w = 0 to capacity:', indent: 2 },
    { text: 'dp[i][w] = dp[i-1][w]', indent: 3 },
    { text: 'if w >= weights[i-1]:', indent: 3 },
    { text: 'dp[i][w] = max(dp[i][w], dp[i-1][w-weights[i-1]] + values[i-1])', indent: 4 },
    { text: 'return dp[n][capacity]', indent: 1 },
  ]
};

/**
 * Knapsack 可视化主组件
 *
 * 组件状态设计（与 LIS 共享相同的架构模式）：
 * - dp: DynamicProgramming 实例（不变）
 * - state: 订阅的模型状态
 * - isRunning: 运行锁
 * - playbackController / playbackState: 播放控制
 */
const Knapsack: React.FC = () => {
  const [dp] = useState(() => new DynamicProgramming());
  const [state, setState] = useState(() => dp.getState());
  const [isRunning, setIsRunning] = useState(false);
  const [playbackController] = useState(() => new PlaybackController<DPStep>(500));
  const [playbackState, setPlaybackState] = useState(playbackController.getState());

  /* Effect: 订阅 DP 模型状态变更 */
  useEffect(() => {
    const unsubscribe = dp.subscribe((newState) => {
      setState(newState);
    });
    return () => { unsubscribe(); };
  }, [dp]);

  /* Effect: 订阅播放控制器状态变更 */
  useEffect(() => {
    const unsubscribe = playbackController.subscribe((newState) => {
      setPlaybackState(newState);
    });
    return () => unsubscribe();
  }, [playbackController]);

  /**
   * 开始执行 0/1 背包算法
   * @param param0 - 包含 weights（重量数组）、values（价值数组）、capacity（背包容量）
   */
  const handleStart = async ({ weights, values, capacity }: { weights: number[], values: number[], capacity: number }) => {
    setIsRunning(true);
    playbackController.reset();
    await dp.knapsack(weights, values, capacity);
    const steps = dp.getState().steps;
    if (steps.length > 0) {
      playbackController.setSteps(steps);
    }
    setIsRunning(false);
  };

  /** 重置所有状态 */
  const handleReset = () => {
    dp.reset();
    playbackController.reset();
  };

  /** 设置算法执行延迟 */
  const handleSetDelay = (delay: number) => {
    dp.setDelay(delay);
  };

  /**
   * 渲染当前步骤的状态详情
   *
   * 三个核心渲染区域：
   * 1. 物品列表表格：重量行 + 价值行，当前物品黄色高亮，已选物品绿色标记
   * 2. DP 二维表格：行列分别对应物品和容量，当前单元格高亮
   * 3. 已选物品卡片组：展示最终选中的物品详情（编号、重量、价值）
   */
  const renderCurrentState = () => {
    if (!state.steps[state.currentStep]) return null;

    /* 解构当前步骤的状态数据 */
    const { weights, values, dp: dpArray, current, selected } = state.steps[state.currentStep].state;

    return (
      <div className="space-y-4">
        {/* 区域1：物品列表 —— 以表格形式展示每个物品的重量和价值 */}
        <div>
          <h3 className="font-semibold mb-2">物品列表</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2">物品</th>
                  {weights.map((_: any, index: number) => (
                    <th key={index} className="px-4 py-2">{index + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* 重量行：显示每个物品的重量值 */}
                <tr>
                  <td className="px-4 py-2 font-medium">重量</td>
                  {weights.map((w: number, index: number) => (
                    <td
                      key={index}
                      /*
                       * 双重颜色判断：current.item 标记当前正在考虑的物品（黄色）
                       * selected 数组包含已选中的物品索引（绿色）
                       * 两者可叠加——当前物品如果已被选中则绿色优先
                       */
                      className={`px-4 py-2 text-center ${
                        current?.item === index ? 'bg-yellow-100' : ''
                      } ${selected?.includes(index) ? 'bg-green-100' : ''}`}
                    >
                      {w}
                    </td>
                  ))}
                </tr>
                {/* 价值行：显示每个物品的价值值 */}
                <tr>
                  <td className="px-4 py-2 font-medium">价值</td>
                  {values.map((v: number, index: number) => (
                    <td
                      key={index}
                      className={`px-4 py-2 text-center ${
                        current?.item === index ? 'bg-yellow-100' : ''
                      } ${selected?.includes(index) ? 'bg-green-100' : ''}`}
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 区域2：DP 二维表格 —— 行=物品(0~n)，列=容量(0~capacity) */}
        <div>
          <h3 className="font-semibold mb-2">DP 表格</h3>
          <DPTable
            dp={dpArray}
            /*
             * 高亮单元格：行号为 item+1（因为 dp 数组第0行是边界条件，
             * 实际物品从第1行开始），列号为当前考虑的容量 weight
             */
            highlightCell={current ? { row: current.item + 1, col: current.weight } : undefined}
          />
        </div>

        {/* 区域3：已选物品卡片组 —— 仅在已有选择结果时显示 */}
        {selected && (
          <div>
            <h3 className="font-semibold mb-2">已选物品</h3>
            <div className="flex flex-wrap gap-4">
              {selected.map((index: number) => (
                <div
                  key={index}
                  className="p-2 bg-green-100 rounded-lg border border-green-500"
                >
                  <div>物品 {index + 1}</div>
                  <div>重量: {weights[index]}</div>
                  <div>价值: {values[index]}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">0/1 背包问题（动态规划）</h2>

      {/* 主布局：左右双栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左栏：步骤列表 */}
        <div>
          <DPSteps
            steps={state.steps}
            currentStep={state.currentStep}
          />
        </div>

        {/* 右栏：控制面板 + 状态展示 + 辅助信息 */}
        <div className="space-y-6">
          {/* 输入控制区：重量、价值、容量输入 */}
          <DPControls
            onStart={handleStart}
            onReset={handleReset}
            onSetDelay={handleSetDelay}
            isRunning={isRunning}
            inputType="knapsack"
            defaultValue={{
              weights: '2,3,4,5',
              values: '3,4,5,6',
              capacity: 10
            }}
          />

          {/* 当前步骤状态渲染 */}
          <div className="bg-white rounded-lg shadow p-4">
            {renderCurrentState()}
          </div>

          {/* 播放控制条 */}
          <PlaybackControls
            playbackState={playbackState}
            onPlay={() => playbackController.play()}
            onPause={() => playbackController.pause()}
            onStepForward={() => playbackController.stepForward()}
            onStepBackward={() => playbackController.stepBackward()}
            onReset={() => playbackController.reset()}
            onSpeedChange={(s) => playbackController.setSpeed(s)}
            onGoToStep={(i) => playbackController.goToStep(i)}
          />

          {/* 代码同步面板 */}
          <CodeSyncPanel
            title={KNAPSACK_PSEUDOCODE.title}
            codeLines={KNAPSACK_PSEUDOCODE.lines}
            highlightLine={
              playbackState.currentStepIndex >= 0 && playbackState.steps[playbackState.currentStepIndex]
                ? playbackState.steps[playbackState.currentStepIndex].highlightLine ?? -1
                : -1
            }
          />

          {/* 变量监控：i(物品), w(容量), dp[i][w], 物品数, 已选数 */}
          <VariableMonitorPanel
            variables={
              playbackState.currentStepIndex >= 0 && playbackState.steps[playbackState.currentStepIndex]
                ? (() => {
                    const stepState = playbackState.steps[playbackState.currentStepIndex].state;
                    const vars: Record<string, string | number> = {};
                    if (stepState.current) {
                      vars['i (物品)'] = stepState.current.item;
                      vars['w (容量)'] = stepState.current.weight;
                    }
                    if (stepState.dp && stepState.current) {
                      const row = stepState.current.item + 1;
                      const col = stepState.current.weight;
                      if (stepState.dp[row] && stepState.dp[row][col] !== undefined) {
                        vars['dp[i][w]'] = stepState.dp[row][col];
                      }
                    }
                    if (stepState.weights) vars['物品数'] = stepState.weights.length;
                    if (stepState.selected) vars['已选物品数'] = stepState.selected.length;
                    return vars;
                  })()
                : {}
            }
          />

          {/* 复杂度分析 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">情况</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间复杂度</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">空间复杂度</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium gray-900">动态规划</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(nW)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(nW)</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium gray-900">空间优化</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(nW)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(W)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 算法说明 */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-2 text-yellow-700">算法说明</h4>
            <div className="space-y-2 text-gray-700">
              <p>0/1 背包问题是一个经典的动态规划问题，目标是在有限的容量下，选择物品使得总价值最大。每个物品只能选择一次（0或1次）。</p>
              <div className="mt-2">
                <h5 className="font-semibold">动态规划思路：</h5>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>定义 dp[i][w] 表示前 i 个物品，容量为 w 时的最大价值</li>
                  <li>对于每个物品，有两种选择：放入或不放入</li>
                  <li>如果当前容量不足，则不能放入当前物品</li>
                  <li>状态转移方程：dp[i][w] = max(dp[i-1][w], dp[i-1][w-weights[i]] + values[i])</li>
                </ol>
              </div>
              <div className="mt-2 text-yellow-600">
                <p><strong>优化：</strong>可以使用滚动数组将空间复杂度优化到 O(W)。</p>
              </div>
            </div>
          </div>

          {/* 可视化图例说明 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-2 text-blue-700">可视化说明</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>黄色：当前正在考虑的物品</li>
              <li>绿色：最终选择的物品</li>
              <li>DP表格：行表示前i个物品，列表示容量，值表示最大价值</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 底部消息提示 */}
      {state.message && (
        <div className="mt-4 p-2 bg-blue-100 text-blue-700 rounded">
          {state.message}
        </div>
      )}
    </div>
  );
};

export default Knapsack;
