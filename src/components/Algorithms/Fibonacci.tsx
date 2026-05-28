import React, { useState, useEffect } from 'react';
import { RecursionAlgorithm, RecursionStep } from '../../models/RecursionAlgorithm';
import { PlaybackController } from '../../models/PlaybackController';
import RecursionTree from './Recursion/RecursionTree';
import RecursionControls from './Recursion/RecursionControls';
import PlaybackControls from '../Visualization/PlaybackControls';
import CodeSyncPanel from '../Visualization/CodeSyncPanel';
import VariableMonitorPanel from '../Visualization/VariableMonitorPanel';

const FIBONACCI_PSEUDOCODE = {
  title: '斐波那契递归 伪代码',
  lines: [
    { text: 'function fib(n):', indent: 0 },
    { text: 'if n == 0: return 0', indent: 1 },
    { text: 'if n == 1: return 1', indent: 1 },
    { text: 'left = fib(n - 1)', indent: 1 },
    { text: 'right = fib(n - 2)', indent: 1 },
    { text: 'return left + right', indent: 1 },
  ]
};

const Fibonacci: React.FC = () => {
  const [recursionAlgorithm] = useState(() => new RecursionAlgorithm());
  const [state, setState] = useState(() => recursionAlgorithm.getState());
  const [isRunning, setIsRunning] = useState(false);
  const [playbackController] = useState(() => new PlaybackController<RecursionStep>(500));
  const [playbackState, setPlaybackState] = useState(playbackController.getState());

  useEffect(() => {
    const unsubscribe = recursionAlgorithm.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, [recursionAlgorithm]);

  useEffect(() => {
    const unsubscribe = playbackController.subscribe((newState) => {
      setPlaybackState(newState);
    });
    return () => unsubscribe();
  }, [playbackController]);

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

  const handleReset = () => {
    recursionAlgorithm.reset();
    playbackController.reset();
  };

  const handleSetDelay = (delay: number) => {
    recursionAlgorithm.setDelay(delay);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">斐波那契数列递归可视化</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <RecursionTree
            steps={state.steps}
            currentStep={state.currentStep}
          />
        </div>
        
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
        
        <div>
          <div className="space-y-6">
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

            <CodeSyncPanel
              title={FIBONACCI_PSEUDOCODE.title}
              codeLines={FIBONACCI_PSEUDOCODE.lines}
              highlightLine={
                playbackState.currentStepIndex >= 0 && playbackState.steps[playbackState.currentStepIndex]
                  ? playbackState.steps[playbackState.currentStepIndex].state === 'active' ? 0
                    : playbackState.steps[playbackState.currentStepIndex].state === 'returning' ? 5
                    : playbackState.steps[playbackState.currentStepIndex].state === 'complete' ? 5
                    : -1
                  : -1
              }
            />

            <VariableMonitorPanel
              variables={
                playbackState.currentStepIndex >= 0 && playbackState.steps[playbackState.currentStepIndex]
                  ? (() => {
                      const step = playbackState.steps[playbackState.currentStepIndex];
                      const vars: Record<string, string | number> = {};
                      if (step.args && step.args.length > 0) {
                        vars['n'] = step.args[0];
                      }
                      if (step.result !== undefined) {
                        vars['result'] = step.result;
                      }
                      vars['递归深度'] = step.level;
                      vars['状态'] = step.state === 'active' ? '计算中' : step.state === 'returning' ? '返回中' : step.state === 'complete' ? '已完成' : '待计算';
                      return vars;
                    })()
                  : {}
              }
            />

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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">递归实现</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(2ⁿ)</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(n)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 算法说明 */}
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

            {/* 可视化说明 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-2 text-blue-700">可视化说明</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>黄色：当前正在计算的节点</li>
                <li>蓝色：正在返回结果的节点</li>
                <li>绿色：已完成计算的节点</li>
                <li>灰色：待计算的节点</li>
              </ul>
            </div>

            {/* 优化建议 */}
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

      {/* 操作提示 */}
      {state.message && (
        <div className="mt-4 p-2 bg-blue-100 text-blue-700 rounded">
          {state.message}
        </div>
      )}
    </div>
  );
};

export default Fibonacci;
