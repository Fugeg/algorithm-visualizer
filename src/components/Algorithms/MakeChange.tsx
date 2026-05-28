import React, { useState, useEffect } from 'react';
import { GreedyAlgorithm, GreedyStep } from '../../models/GreedyAlgorithm';
import { PlaybackController } from '../../models/PlaybackController';
import GreedySteps from './Greedy/GreedySteps';
import GreedyControls from './Greedy/GreedyControls';
import PlaybackControls from '../Visualization/PlaybackControls';
import CodeSyncPanel from '../Visualization/CodeSyncPanel';
import VariableMonitorPanel from '../Visualization/VariableMonitorPanel';

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

const MakeChange: React.FC = () => {
  const [greedyAlgorithm] = useState(() => new GreedyAlgorithm());
  const [state, setState] = useState(() => greedyAlgorithm.getState());
  const [isRunning, setIsRunning] = useState(false);
  const [playbackController] = useState(() => new PlaybackController<GreedyStep>(500));
  const [playbackState, setPlaybackState] = useState(playbackController.getState());

  useEffect(() => {
    const unsubscribe = greedyAlgorithm.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, [greedyAlgorithm]);

  useEffect(() => {
    const unsubscribe = playbackController.subscribe((newState) => {
      setPlaybackState(newState);
    });
    return () => unsubscribe();
  }, [playbackController]);

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

  const handleReset = () => {
    greedyAlgorithm.reset();
    playbackController.reset();
  };

  const handleSetDelay = (delay: number) => {
    greedyAlgorithm.setDelay(delay);
  };

  const renderCurrentState = () => {
    if (!state.steps[state.currentStep]) return null;

    const { remaining, result = [] } = state.steps[state.currentStep].state;

    return (
      <div className="space-y-4">
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
        <div>
          <GreedySteps
            steps={state.steps}
            currentStep={state.currentStep}
          />
        </div>
        
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
            title={MAKE_CHANGE_PSEUDOCODE.title}
            codeLines={MAKE_CHANGE_PSEUDOCODE.lines}
            highlightLine={
              playbackState.currentStepIndex >= 0 && playbackState.steps[playbackState.currentStepIndex]
                ? playbackState.steps[playbackState.currentStepIndex].type === 'select' ? 5
                  : playbackState.steps[playbackState.currentStepIndex].type === 'skip' ? 5
                  : playbackState.steps[playbackState.currentStepIndex].type === 'solution' ? 10
                  : -1
                : -1
            }
          />

          <VariableMonitorPanel
            variables={
              playbackState.currentStepIndex >= 0 && playbackState.steps[playbackState.currentStepIndex]
                ? (() => {
                    const stepState = playbackState.steps[playbackState.currentStepIndex].state;
                    const vars: Record<string, string | number> = {};
                    if (stepState.remaining !== undefined) {
                      vars['剩余金额'] = stepState.remaining;
                    }
                    if (stepState.result) {
                      const currentCoin = stepState.result.length > 0
                        ? stepState.result[stepState.result.length - 1]
                        : null;
                      if (currentCoin) {
                        vars['当前硬币'] = currentCoin.coin;
                        vars['使用数量'] = currentCoin.count;
                      }
                      vars['已用硬币数'] = stepState.result.reduce(
                        (sum: number, { count }: { count: number }) => sum + count, 0
                      );
                    }
                    return vars;
                  })()
                : {}
            }
          />

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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">贪心实现</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(n)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(1)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-2 text-yellow-700">算法说明</h4>
            <div className="space-y-2 text-gray-700">
              <p>找零钱问题是一个经典的贪心算法问题，目标是用最少的硬币数量凑出指定金额。</p>
              <div className="mt-2">
                <h5 className="font-semibold">贪心策略：</h5>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>将硬币按面值从大到小排序</li>
                  <li>每次尽可能多地使用最大面值的硬币</li>
                  <li>如果当前面值的硬币无法使用，尝试下一个较小面值</li>
                  <li>重复直到凑出目标金额或无法继续</li>
                </ol>
              </div>
              <div className="mt-2 text-yellow-600">
                <p><strong>注意：</strong>贪心算法不一定能得到最优解，但在特定硬币系统下（如美国硬币系统）可以保证最优解。</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-2 text-blue-700">可视化说明</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>绿色：选择使用某个面值的硬币</li>
              <li>红色：跳过某个面值的硬币</li>
              <li>蓝色：找到完整解决方案</li>
            </ul>
          </div>
        </div>
      </div>

      {state.message && (
        <div className="mt-4 p-2 bg-blue-100 text-blue-700 rounded">
          {state.message}
        </div>
      )}
    </div>
  );
};

export default MakeChange;
