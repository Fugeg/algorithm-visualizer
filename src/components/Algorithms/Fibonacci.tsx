/**
 * 斐波那契数列递归可视化组件
 *
 * 【可视化策略】
 * 采用「递归算法专用可视化架构」，核心展示递归调用树（RecursionTree）。
 * 斐波那契递归的可视化重点在于：
 * - 递归树的动态构建：每个节点代表一次 fib(n) 调用，边表示调用关系
 * - 节点状态颜色编码：active(计算中/黄色) → returning(返回中/蓝色) → complete(已完成/绿色) → pending(待计算/灰色)
 * - 重复子问题的直观暴露：相同的 fib(n) 节点多次出现，引出优化动机
 * - 返回值的传播路径：从叶子节点向根节点回传
 *
 * 【数据流向】Model → Step → UI
 * 1. 用户输入 n → RecursionControls → recursionAlgorithm.fibonacci(n)
 * 2. RecursionAlgorithm Model 模拟递归调用过程，每进入/退出一个函数调用生成 RecursionStep
 * 3. 每个 RecursionStep 包含：args([n]), result, level(递归深度), state(active/returning/complete), highlightLine
 * 4. steps 注入 PlaybackController → 驱动 RecursionTree 和辅助面板渲染
 *
 * 【特殊交互设计】
 * - RecursionTree 组件占据顶部整行宽度，突出树形结构
 * - 变量监控面板额外展示「状态」中文映射和「递归深度」
 * - 优化建议卡片引导用户思考记忆化、DP、矩阵快速幂等改进方案
 */
import React, { useState, useEffect } from 'react';
import { RecursionAlgorithm, RecursionStep } from '../../models/RecursionAlgorithm';
import { PlaybackController } from '../../models/PlaybackController';
import RecursionTree from './Recursion/RecursionTree';
import RecursionControls from './Recursion/RecursionControls';
import PlaybackControls from '../Visualization/PlaybackControls';
import CodeSyncPanel from '../Visualization/CodeSyncPanel';
import VariableMonitorPanel from '../Visualization/VariableMonitorPanel';

/** 斐波那契递归伪代码定义 */
const FIBONACCI_PSEUDOCODE = {
  title: '斐波那契递归 伪代码',
  lines: [
    { text: 'function fib(n):', indent: 0 },
    { text: 'if n <= 1:', indent: 1 },
    { text: '  return n', indent: 1 },
    { text: 'left = fib(n - 1)', indent: 1 },
    { text: 'right = fib(n - 2)', indent: 1 },
    { text: 'return left + right', indent: 1 },
    { text: '// end fib', indent: 0 },
  ]
};

/**
 * Fibonacci 可视化主组件
 *
 * 组件状态设计：
 * - recursionAlgorithm: RecursionAlgorithm 实例，管理递归模拟逻辑
 * - state: 订阅的模型状态（steps + currentStep）
 * - isRunning: 算法执行锁
 * - playbackController / playbackState: 播放控制
 */
const Fibonacci: React.FC = () => {
  const [recursionAlgorithm] = useState(() => new RecursionAlgorithm());
  const [state, setState] = useState(() => recursionAlgorithm.getState());
  const [isRunning, setIsRunning] = useState(false);
  /* 播放控制器泛型参数为 RecursionStep，初始延迟 500ms */
  const [playbackController] = useState(() => new PlaybackController<RecursionStep>(500));
  const [playbackState, setPlaybackState] = useState(playbackController.getState());

  /* Effect: 订阅递归算法模型的状态变更 */
  useEffect(() => {
    const unsubscribe = recursionAlgorithm.subscribe((newState) => {
      setState(newState);
    });
    return () => { unsubscribe(); };
  }, [recursionAlgorithm]);

  /* Effect: 订阅播放控制器的状态变更 */
  useEffect(() => {
    const unsubscribe = playbackController.subscribe((newState) => {
      setPlaybackState(newState);
    });
    return () => unsubscribe();
  }, [playbackController]);

  /**
   * 开始执行斐波那契递归
   * @param n - 要计算的斐波那契数列第 n 项（从 0 开始）
   */
  const handleStart = async (n: number) => {
    setIsRunning(true);
    playbackController.reset();
    await recursionAlgorithm.fibonacci(n);
    const steps = recursionAlgorithm.getState().steps;
    if (steps.length > 0) {
      playbackController.setSteps(steps);
    }
    setIsRunning(false);
  };

  /** 重置所有状态 */
  const handleReset = () => {
    recursionAlgorithm.reset();
    playbackController.reset();
  };

  /** 设置算法执行延迟 */
  const handleSetDelay = (delay: number) => {
    recursionAlgorithm.setDelay(delay);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">斐波那契数列递归可视化</h2>

      {/* 主布局：递归树独占顶行，下方左右分栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 递归树：占据整行宽度以充分展示树形结构 */}
        <div className="lg:col-span-2">
          <RecursionTree
            steps={state.steps}
            currentStep={state.currentStep}
          />
        </div>

        {/* 左栏：输入控制 */}
        <div>
          <RecursionControls
            onStart={handleStart}
            onReset={handleReset}
            onSetDelay={handleSetDelay}
            isRunning={isRunning}
            defaultValue={5}
            maxValue={10}
          />
        </div>

        {/* 右栏：播放控制 + 代码同步 + 变量监控 + 说明信息 */}
        <div>
          <div className="space-y-6">
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

            {/* 代码同步面板：伪代码 + 当前行高亮 */}
            <CodeSyncPanel
              title={FIBONACCI_PSEUDOCODE.title}
              codeLines={FIBONACCI_PSEUDOCODE.lines}
              highlightLine={
                playbackState.currentStepIndex >= 0 && playbackState.steps[playbackState.currentStepIndex]
                  ? playbackState.steps[playbackState.currentStepIndex].highlightLine ?? -1
                  : -1
              }
            />

            {/* 变量监控面板：n, result, 递归深度, 状态（中文映射） */}
            <VariableMonitorPanel
              variables={
                playbackState.currentStepIndex >= 0 && playbackState.steps[playbackState.currentStepIndex]
                  ? (() => {
                      const step = playbackState.steps[playbackState.currentStepIndex];
                      const vars: Record<string, string | number> = {};
                      if (step.args && step.args.length > 0) vars['n'] = step.args[0];
                      if (step.result !== undefined) vars['result'] = step.result;
                      vars['递归深度'] = step.level;
                      /* 将英文状态码映射为中文描述 */
                      vars['状态'] = step.state === 'active' ? '计算中' : step.state === 'returning' ? '返回中' : step.state === 'complete' ? '已完成' : '待计算';
                      return vars;
                    })()
                  : {}
              }
            />

            {/* 复杂度分析表格 */}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium gray-900">递归实现</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(2ⁿ)</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(n)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 算法说明卡片 */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-2 text-yellow-700">算法说明</h4>
              <div className="space-y-2 text-gray-700">
                <p>斐波那契数列是一个经典的递归问题，每个数是前两个数的和。</p>
                <div className="mt-2">
                  <h5 className="font-semibold">递归定义：</h5>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>F(0) = 0</li>
                    <li>F(1) = 1</li>
                    <li>F(n) = F(n-1) + F(n-2)，当 n &gt; 1</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 可视化图例说明 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-2 text-blue-700">可视化说明</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>黄色：当前正在计算的节点</li>
                <li>蓝色：正在返回结果的节点</li>
                <li>绿色：已完成计算的节点</li>
                <li>灰色：待计算的节点</li>
              </ul>
            </div>

            {/* 优化建议卡片 —— 引导用户思考递归的效率问题 */}
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-2 text-green-700">优化建议</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>使用记忆化搜索避免重复计算</li>
                <li>使用动态规划自底向上计算</li>
                <li>使用循环代替递归减少栈空间使用</li>
                <li>使用矩阵快速幂优化大数计算</li>
              </ul>
            </div>
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

export default Fibonacci;
