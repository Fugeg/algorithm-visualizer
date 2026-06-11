/**
 * 编辑距离（Levenshtein Distance）动态规划可视化组件
 *
 * 【可视化策略】
 * 采用 DP 专用可视化架构。编辑距离是字符串处理类二维 DP 的典型代表，
 * 可视化重点在于：
 * - 两个输入字符串的逐字符展示，当前比较位置高亮
 * - 二维 DP 表格的逐步填充，行列分别对应两个字符串的前缀
 * - 三种编辑操作（插入、删除、替换）的可视化追踪
 * - 操作序列（operations）的最终展示
 *
 * 【数据流向】Model → Step → UI
 * 1. 用户输入（word1, word2）→ DPControls → dp.editDistance(word1, word2)
 * 2. Model 执行二维 DP 填表，每步生成 DPStep
 * 3. 每个 DPStep.state 包含：word1, word2, dp[][], current{i,j}, operations[]
 * 4. steps 注入 PlaybackController → 驱动 UI 步进渲染
 *
 * 【特殊交互设计】
 * - 字符串双行展示：word1 每个字符用黄色标记当前位置 i，word2 用蓝色标记位置 j
 * - DP 表格带字符标签：行标签=word1字符，列标签=word2字符，方便对应关系理解
 * - 编辑操作以标签云形式展示：每个操作（插入/删除/替换）用绿色圆角标签呈现
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

/** 编辑距离伪代码定义 */
const EDIT_DISTANCE_PSEUDOCODE = {
  title: '编辑距离 伪代码',
  lines: [
    { text: 'function editDistance(word1, word2):', indent: 0 },
    { text: 'm = word1.length, n = word2.length', indent: 1 },
    { text: 'dp = (m+1) × (n+1) matrix', indent: 1 },
    { text: 'for i = 0 to m: dp[i][0] = i', indent: 1 },
    { text: 'for j = 0 to n: dp[0][j] = j', indent: 1 },
    { text: 'for i = 1 to m:', indent: 1 },
    { text: 'for j = 1 to n:', indent: 2 },
    { text: 'if word1[i-1] == word2[j-1]:', indent: 3 },
    { text: 'dp[i][j] = dp[i-1][j-1]', indent: 4 },
    { text: 'else:', indent: 3 },
    { text: 'dp[i][j] = min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1', indent: 4 },
    { text: 'return dp[m][n]', indent: 1 },
  ]
};

/**
 * EditDistance 可视化主组件
 *
 * 组件状态设计（与 LIS/Knapsack 共享相同的 DP 可视化架构模式）
 */
const EditDistance: React.FC = () => {
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
   * 开始执行编辑距离算法
   * @param param0 - word1（源字符串）、word2（目标字符串）
   */
  const handleStart = async ({ word1, word2 }: { word1: string, word2: string }) => {
    setIsRunning(true);
    playbackController.reset();
    await dp.editDistance(word1, word2);
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
   * 1. 双字符串展示区：word1 和 word2 的字符方块，各自高亮当前比较位置
   * 2. DP 二维表格：带字符行/列标签，高亮当前计算的 (i+1, j+1) 单元格
   * 3. 编辑操作标签组：以绿色圆角标签展示已执行的操作序列
   */
  const renderCurrentState = () => {
    if (!state.steps[state.currentStep]) return null;

    /* 解构当前步骤的状态数据 */
    const { word1, word2, dp: dpArray, current, operations } = state.steps[state.currentStep].state;

    return (
      <div className="space-y-4">
        {/* 区域1：双字符串展示 —— word1 和 word2 各占一行 */}
        <div>
          <h3 className="font-semibold mb-2">字符串状态</h3>
          <div className="space-y-4">
            {/* word1 行：每个字符独立方块，当前位置 i 用黄色标记 */}
            <div>
              <div className="text-sm text-gray-500 mb-1">字符串 1:</div>
              <div className="flex gap-1">
                {word1.split('').map((char, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 flex items-center justify-center rounded border ${
                      current?.i === index ? 'bg-yellow-100 border-yellow-500' : 'border-gray-300'
                    }`}
                  >
                    {char}
                  </div>
                ))}
              </div>
            </div>
            {/* word2 行：每个字符独立方块，当前位置 j 用蓝色标记 */}
            <div>
              <div className="text-sm text-gray-500 mb-1">字符串 2:</div>
              <div className="flex gap-1">
                {word2.split('').map((char, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 flex items-center justify-center rounded border ${
                      current?.j === index ? 'bg-blue-100 border-blue-500' : 'border-gray-300'
                    }`}
                  >
                    {char}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 区域2：DP 二维表格 —— 带字符标签便于对照 */}
        <div>
          <h3 className="font-semibold mb-2">DP 表格</h3>
          <DPTable
            dp={dpArray}
            /*
             * 高亮单元格：(i+1, j+1) 因为 dp 数组的第0行/列是空串边界，
             * 实际字符从第1行/列开始对应 word1[0]/word2[0]
             */
            highlightCell={current ? { row: current.i + 1, col: current.j + 1 } : undefined}
            /* 行标签：空 + word1 的每个字符 */
            rowLabels={['', ...word1.split('')]}
            /* 列标签：空 + word2 的每个字符 */
            colLabels={['', ...word2.split('')]}
          />
        </div>

        {/* 区域3：编辑操作标签云 —— 仅在有操作记录时显示 */}
        {operations && (
          <div>
            <h3 className="font-semibold mb-2">编辑操作</h3>
            <div className="flex flex-wrap gap-2">
              {operations.map((op: string, index: number) => (
                <div
                  key={index}
                  className="px-3 py-1 bg-green-100 rounded-full text-sm border border-green-500"
                >
                  {op}
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
      <h2 className="text-2xl font-bold mb-6">编辑距离（动态规划）</h2>

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
          {/* 输入控制区：两个字符串输入框 */}
          <DPControls
            onStart={handleStart}
            onReset={handleReset}
            onSetDelay={handleSetDelay}
            isRunning={isRunning}
            inputType="editdistance"
            defaultValue={{
              word1: 'horse',
              word2: 'ros'
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
            title={EDIT_DISTANCE_PSEUDOCODE.title}
            codeLines={EDIT_DISTANCE_PSEUDOCODE.lines}
            highlightLine={
              playbackState.currentStepIndex >= 0 && playbackState.steps[playbackState.currentStepIndex]
                ? playbackState.steps[playbackState.currentStepIndex].highlightLine ?? -1
                : -1
            }
          />

          {/* 变量监控：i, j, word1[i], word2[j], dp[i][j] */}
          <VariableMonitorPanel
            variables={
              playbackState.currentStepIndex >= 0 && playbackState.steps[playbackState.currentStepIndex]
                ? (() => {
                    const stepState = playbackState.steps[playbackState.currentStepIndex].state;
                    const vars: Record<string, string | number> = {};
                    if (stepState.current) {
                      vars['i'] = stepState.current.i;
                      vars['j'] = stepState.current.j;
                    }
                    if (stepState.word1 && stepState.current) {
                      vars['word1[i]'] = stepState.word1[stepState.current.i] || '-';
                    }
                    if (stepState.word2 && stepState.current) {
                      vars['word2[j]'] = stepState.word2[stepState.current.j] || '-';
                    }
                    if (stepState.dp && stepState.current) {
                      const row = stepState.current.i + 1;
                      const col = stepState.current.j + 1;
                      if (stepState.dp[row] && stepState.dp[row][col] !== undefined) {
                        vars['dp[i][j]'] = stepState.dp[row][col];
                      }
                    }
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(mn)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(mn)</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium gray-900">空间优化</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(mn)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(min(m,n))</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 算法说明 */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-2 text-yellow-700">算法说明</h4>
            <div className="space-y-2 text-gray-700">
              <p>编辑距离（Levenshtein Distance）是一个经典的动态规划问题，用于计算将一个字符串转换成另一个字符串所需的最少操作次数。</p>
              <div className="mt-2">
                <h5 className="font-semibold">动态规划思路：</h5>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>定义 dp[i][j] 表示 word1 的前 i 个字符转换到 word2 的前 j 个字符需要的最少操作数</li>
                  <li>如果当前字符相同，不需要操作</li>
                  <li>如果不同，可以进行插入、删除或替换操作</li>
                  <li>状态转移方程：
                    <ul className="list-disc list-inside ml-4">
                      <li>如果 word1[i] === word2[j]：dp[i][j] = dp[i-1][j-1]</li>
                      <li>否则：dp[i][j] = min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1</li>
                    </ul>
                  </li>
                </ol>
              </div>
              <div className="mt-2 text-yellow-600">
                <p><strong>优化：</strong>可以使用滚动数组将空间复杂度优化到 O(min(m,n))。</p>
              </div>
            </div>
          </div>

          {/* 可视化图例说明 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-2 text-blue-700">可视化说明</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>黄色：word1 中当前正在比较的字符</li>
              <li>蓝色：word2 中当前正在比较的字符</li>
              <li>DP表格：行表示 word1 前缀，列表示 word2 前缀，值表示最小编辑距离</li>
              <li>绿色标签：显示具体的编辑操作步骤</li>
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

export default EditDistance;
