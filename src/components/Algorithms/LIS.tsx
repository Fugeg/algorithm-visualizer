/**
 * 最长递增子序列（LIS）动态规划可视化组件
 *
 * 【可视化策略】
 * 本组件采用「动态规划专用可视化架构」，与排序算法的 SortingPage 模式不同，
 * DP 问题需要同时展示：一维/二维 DP 表格、原始数据状态、变量追踪。
 * LIS 的可视化重点在于：
 * - 原始序列中当前处理位置（i）和比较位置（j）的双指针高亮
 * - DP 数组（dp[]）的逐步填充过程，每个位置显示以该元素结尾的最长递增子序列长度
 * - 最终找到的最长递增子序列（sequence）的高亮展示
 *
 * 【数据流向】Model → Step → UI
 * 1. 用户输入序列 → DPControls 收集输入 → 调用 dp.longestIncreasingSubsequence(nums)
 * 2. DynamicProgramming Model 内部执行算法，每步生成 DPStep 推入 steps 数组
 * 3. 每个 DPStep 包含：
 *    - state: { nums, dp, current(i), comparing(j), sequence }
 *    - highlightLine: 对应伪代码的行号，用于代码同步高亮
 * 4. 算法执行完毕后，steps 数组传入 PlaybackController 进行播放控制
 * 5. UI 层从 playbackState.steps[currentStepIndex] 取出当前 step 渲染
 *
 * 【特殊交互设计】
 * - 采用观察者模式：DynamicProgramming 和 PlaybackController 都通过 subscribe 发布状态变更
 * - 双面板布局：左侧 DPSteps 展示步骤列表，右侧展示当前状态详情 + 控制面板
 * - CodeSyncPanel 实现伪代码与执行步骤的行级同步高亮
 * - VariableMonitorPanel 实时展示 i, j, dp[i], maxLen 等关键变量
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

/** LIS 伪代码定义，用于 CodeSyncPanel 的代码高亮同步展示 */
const LIS_PSEUDOCODE = {
  title: '最长递增子序列 伪代码',
  lines: [
    { text: 'function LIS(nums):', indent: 0 },
    { text: 'n = nums.length', indent: 1 },
    { text: 'dp = [1] × n', indent: 1 },
    { text: 'for i = 1 to n-1:', indent: 1 },
    { text: 'for j = 0 to i-1:', indent: 2 },
    { text: 'if nums[j] < nums[i]:', indent: 3 },
    { text: 'dp[i] = max(dp[i], dp[j] + 1)', indent: 4 },
    { text: 'maxLen = max(dp)', indent: 1 },
    { text: 'return maxLen', indent: 1 },
  ]
};

/**
 * LIS 可视化主组件
 *
 * 组件状态设计：
 * - dp: DynamicProgramming 实例，管理算法逻辑和步骤生成（生命周期内不变）
 * - state: 从 dp 订阅的最新状态，包含 steps 数组和 currentStep 索引
 * - isRunning: 标记算法是否正在执行，用于禁用控制按钮防止重复触发
 * - playbackController: 播放控制器，管理步骤的播放/暂停/步进/速度
 * - playbackState: 从 playbackController 订阅的最新播放状态
 *
 * Effect 生命周期：
 * - useEffect [dp]: 订阅 DynamicProgramming 的状态变更，更新本地 state
 * - useEffect [playbackController]: 订阅 PlaybackController 的播放状态变更
 */
const LIS: React.FC = () => {
  /* 创建 DP 算法模型实例，使用惰性初始化避免重复创建 */
  const [dp] = useState(() => new DynamicProgramming());
  /* 初始化状态为 dp 模型的当前状态（空状态） */
  const [state, setState] = useState(() => dp.getState());
  /* 算法运行标记，防止用户在执行过程中重复点击开始 */
  const [isRunning, setIsRunning] = useState(false);
  /* 创建播放控制器，初始延迟 500ms，泛型参数 DPStep 定义步骤类型 */
  const [playbackController] = useState(() => new PlaybackController<DPStep>(500));
  /* 播放控制器的实时状态，驱动 UI 的步骤渲染和控件状态 */
  const [playbackState, setPlaybackState] = useState(playbackController.getState());

  /*
   * Effect: 订阅 DynamicProgramming 模型的状态变更
   * 当模型内部 push 新的 step 或修改 currentStep 时，回调触发 setState 更新 UI
   * 返回 unsubscribe 函数用于组件卸载时清理订阅，避免内存泄漏
   */
  useEffect(() => {
    const unsubscribe = dp.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, [dp]);

  /*
   * Effect: 订阅 PlaybackController 的播放状态变更
   * 播放、暂停、步进、跳转等操作都会通过此订阅更新 playbackState
   */
  useEffect(() => {
    const unsubscribe = playbackController.subscribe((newState) => {
      setPlaybackState(newState);
    });
    return () => unsubscribe();
  }, [playbackController]);

  /**
   * 开始执行 LIS 算法
   * @param nums - 用户输入的数字序列
   *
   * 执行流程：
   * 1. 设置 isRunning=true 禁用操作按钮
   * 2. 重置播放控制器（清除之前的步骤和进度）
   * 3. 调用 dp.longestIncreasingSubsequence(nums) 异步执行算法
   *    （算法内部会在每个关键步骤 yield/push step，实现逐步可视化）
   * 4. 算法完成后获取生成的 steps，注入 playbackController
   * 5. 恢复 isRunning=false
   */
  const handleStart = async (nums: number[]) => {
    setIsRunning(true);
    playbackController.reset();
    await dp.longestIncreasingSubsequence(nums);
    const steps = dp.getState().steps;
    if (steps.length > 0) {
      playbackController.setSteps(steps);
    }
    setIsRunning(false);
  };

  /** 重置所有状态：清空 DP 模型和播放控制器 */
  const handleReset = () => {
    dp.reset();
    playbackController.reset();
  };

  /** 设置算法执行延迟（影响自动播放时每步的停留时间） */
  const handleSetDelay = (delay: number) => {
    dp.setDelay(delay);
  };

  /**
   * 渲染当前步骤的状态详情
   *
   * 从 state.steps[currentStep] 中提取当前步骤的数据，渲染三个区域：
   * 1. 序列状态：每个数字方块根据角色着色——黄色=当前位置i，蓝色=比较位置j，绿色=最终LIS成员
   * 2. DP 表格：使用 DPTable 组件展示一维 dp 数组，高亮当前计算的单元格
   * 3. 最长递增子序列：如果已找到完整解，展示最终的递增子序列
   *
   * 颜色映射规则：
   * - 黄色 (bg-yellow-100): 当前外层循环位置 i
   * - 蓝色 (bg-blue-100): 当前内层比较位置 j
   * - 绿色 (bg-green-100): 属于最终最长递增子序列的元素
   * - 白色 (bg-white): 尚未参与或普通元素
   */
  const renderCurrentState = () => {
    if (!state.steps[state.currentStep]) return null;

    /* 解构当前步骤的状态数据 */
    const { nums, dp: dpArray, current, comparing, sequence } = state.steps[state.currentStep].state;

    return (
      <div className="space-y-4">
        {/* 区域1：原始序列的可视化展示 */}
        <div>
          <h3 className="font-semibold mb-2">序列状态</h3>
          <div className="flex flex-wrap gap-2">
            {nums.map((num: number, index: number) => (
              <div
                key={index}
                /*
                 * 三级颜色判断优先级：current > comparing > sequence > default
                 * 这反映了 LIS 算法的核心关注点：先看当前位置，再看比较对象，最后看结果
                 */
                className={`w-10 h-10 flex items-center justify-center rounded border ${
                  index === current
                    ? 'bg-yellow-100 border-yellow-500'       /* 当前处理的位置 i */
                    : index === comparing
                    ? 'bg-blue-100 border-blue-500'             /* 正在比较的位置 j */
                    : sequence?.includes(num)
                    ? 'bg-green-100 border-green-500'           /* 属于最终LIS的元素 */
                    : 'bg-white border-gray-300'               /* 普通元素 */
                }`}
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        {/* 区域2：DP 数组表格展示 */}
        <div>
          <h3 className="font-semibold mb-2">DP 数组</h3>
          <DPTable
            /* 一维 DP 数组包装为二维形式传入（LIS 使用一维 dp） */
            dp={[dpArray]}
            /* 高亮当前正在计算的单元格：第0行（唯一一行），第 current 列 */
            highlightCell={{ row: 0, col: current }}
            /* 列标签使用原始序列的数值，方便对应 */
            colLabels={nums.map(String)}
          />
        </div>

        {/* 区域3：最终找到的最长递增子序列（仅在已有结果时显示） */}
        {sequence && (
          <div>
            <h3 className="font-semibold mb-2">最长递增子序列</h3>
            <div className="flex flex-wrap gap-2">
              {sequence.map((num: number, index: number) => (
                <div
                  key={index}
                  className="w-10 h-10 flex items-center justify-center rounded bg-green-100 border border-green-500"
                >
                  {num}
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
      <h2 className="text-2xl font-bold mb-6">最长递增子序列（动态规划）</h2>

      {/* 主布局：左右双栏 —— 左侧步骤列表，右侧控制和详情 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左栏：DP 步骤列表 */}
        <div>
          <DPSteps
            steps={state.steps}
            currentStep={state.currentStep}
          />
        </div>

        {/* 右栏：控制面板 + 状态展示 + 辅助信息 */}
        <div className="space-y-6">
          {/* 输入控制区：序列输入框 + 开始/重置按钮 + 延迟调节 */}
          <DPControls
            onStart={handleStart}
            onReset={handleReset}
            onSetDelay={handleSetDelay}
            isRunning={isRunning}
            inputType="lis"
            defaultValue={{
              sequence: '10,9,2,5,3,7,101,18'
            }}
          />

          {/* 当前步骤的核心状态渲染 */}
          <div className="bg-white rounded-lg shadow p-4">
            {renderCurrentState()}
          </div>

          {/* 播放控制条：播放/暂停/上一步/下一步/速度/跳转 */}
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

          {/* 代码同步面板：伪代码 + 当前行高亮 */}
          <CodeSyncPanel
            title={LIS_PSEUDOCODE.title}
            codeLines={LIS_PSEUDOCODE.lines}
            highlightLine={
              playbackState.currentStepIndex >= 0 && playbackState.steps[playbackState.currentStepIndex]
                ? playbackState.steps[playbackState.currentStepIndex].highlightLine ?? -1
                : -1
            }
          />

          {/* 变量监控面板：实时展示 i, j, dp[i], maxLen 等关键变量的值 */}
          <VariableMonitorPanel
            variables={
              playbackState.currentStepIndex >= 0 && playbackState.steps[playbackState.currentStepIndex]
                ? (() => {
                    /* 从当前步骤的 state 中提取变量值，构建监控字典 */
                    const stepState = playbackState.steps[playbackState.currentStepIndex].state;
                    const vars: Record<string, string | number> = {};
                    if (stepState.current !== undefined) vars['i'] = stepState.current;
                    if (stepState.comparing !== undefined) vars['j'] = stepState.comparing;
                    if (stepState.dp && stepState.current !== undefined) vars['dp[i]'] = stepState.dp[stepState.current];
                    if (stepState.dp) vars['maxLen'] = Math.max(...stepState.dp);
                    return vars;
                  })()
                : {}
            }
          />

          {/* 复杂度分析表格 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b">
              <h3 className="text-sm font-semibold text-gray-700">复杂度分析</h3>
            </div>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(n²)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(n)</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium gray-900">二分优化</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(n log n)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(n)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 算法说明卡片：文字描述 + 动态规划思路分解 */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-2 text-yellow-700">算法说明</h4>
            <div className="space-y-2 text-gray-700">
              <p>最长递增子序列（LIS）是一个经典的动态规划问题，目标是找到一个最长的子序列，使得这个子序列中的所有元素是严格递增的。</p>
              <div className="mt-2">
                <h5 className="font-semibold">动态规划思路：</h5>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>定义 dp[i] 表示以第 i 个数结尾的最长递增子序列的长度</li>
                  <li>对于每个位置 i，遍历它前面的所有位置 j</li>
                  <li>如果 nums[i] {'>'} nums[j]，则可以将 nums[i] 接在以 nums[j] 结尾的子序列后面</li>
                  <li>状态转移方程：dp[i] = max(dp[j] + 1) 其中 j {'<'} i 且 nums[j] {'<'} nums[i]</li>
                </ol>
              </div>
              <div className="mt-2 text-yellow-600">
                <p><strong>优化：</strong>可以使用二分查找优化时间复杂度到 O(n log n)。</p>
              </div>
            </div>
          </div>

          {/* 可视化图例说明：颜色含义对照表 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-2 text-blue-700">可视化说明</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>黄色：当前正在处理的位置</li>
              <li>蓝色：正在比较的位置</li>
              <li>绿色：最终的最长递增子序列</li>
              <li>DP表格：显示每个位置的最长递增子序列长度</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 底部消息提示条：显示算法执行过程中的提示信息 */}
      {state.message && (
        <div className="mt-4 p-2 bg-blue-100 text-blue-700 rounded">
          {state.message}
        </div>
      )}
    </div>
  );
};

export default LIS;
