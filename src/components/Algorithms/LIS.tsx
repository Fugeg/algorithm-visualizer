import React, { useState, useEffect } from 'react';
import { DynamicProgramming, DPStep } from '../../models/DynamicProgramming';
import { PlaybackController } from '../../models/PlaybackController';
import DPSteps from './DP/DPSteps';
import DPControls from './DP/DPControls';
import DPTable from './DP/DPTable';
import PlaybackControls from '../Visualization/PlaybackControls';
import CodeSyncPanel from '../Visualization/CodeSyncPanel';
import VariableMonitorPanel from '../Visualization/VariableMonitorPanel';

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

const LIS: React.FC = () => {
  const [dp] = useState(() => new DynamicProgramming());
  const [state, setState] = useState(() => dp.getState());
  const [isRunning, setIsRunning] = useState(false);
  const [playbackController] = useState(() => new PlaybackController<DPStep>(500));
  const [playbackState, setPlaybackState] = useState(playbackController.getState());

  useEffect(() => {
    const unsubscribe = dp.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, [dp]);

  useEffect(() => {
    const unsubscribe = playbackController.subscribe((newState) => {
      setPlaybackState(newState);
    });
    return () => unsubscribe();
  }, [playbackController]);

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

  const handleReset = () => {
    dp.reset();
    playbackController.reset();
  };

  const handleSetDelay = (delay: number) => {
    dp.setDelay(delay);
  };

  const renderCurrentState = () => {
    if (!state.steps[state.currentStep]) return null;

    const { nums, dp: dpArray, current, comparing, sequence } = state.steps[state.currentStep].state;

    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">序列状态</h3>
          <div className="flex flex-wrap gap-2">
            {nums.map((num: number, index: number) => (
              <div
                key={index}
                className={`w-10 h-10 flex items-center justify-center rounded border ${
                  index === current
                    ? 'bg-yellow-100 border-yellow-500'
                    : index === comparing
                    ? 'bg-blue-100 border-blue-500'
                    : sequence?.includes(num)
                    ? 'bg-green-100 border-green-500'
                    : 'bg-white border-gray-300'
                }`}
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">DP 数组</h3>
          <DPTable
            dp={[dpArray]}
            highlightCell={{ row: 0, col: current }}
            colLabels={nums.map(String)}
          />
        </div>

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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <DPSteps
            steps={state.steps}
            currentStep={state.currentStep}
          />
        </div>
        
        <div className="space-y-6">
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
            title={LIS_PSEUDOCODE.title}
            codeLines={LIS_PSEUDOCODE.lines}
            highlightLine={
              playbackState.currentStepIndex >= 0 && playbackState.steps[playbackState.currentStepIndex]
                ? playbackState.steps[playbackState.currentStepIndex].type === 'init' ? 2
                  : playbackState.steps[playbackState.currentStepIndex].type === 'calculate' ? 5
                  : 7
                : -1
            }
          />

          <VariableMonitorPanel
            variables={
              playbackState.currentStepIndex >= 0 && playbackState.steps[playbackState.currentStepIndex]
                ? (() => {
                    const stepState = playbackState.steps[playbackState.currentStepIndex].state;
                    const vars: Record<string, string | number> = {};
                    if (stepState.current !== undefined) {
                      vars['i'] = stepState.current;
                    }
                    if (stepState.comparing !== undefined) {
                      vars['j'] = stepState.comparing;
                    }
                    if (stepState.dp && stepState.current !== undefined) {
                      vars['dp[i]'] = stepState.dp[stepState.current];
                    }
                    if (stepState.dp) {
                      vars['maxLen'] = Math.max(...stepState.dp);
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">动态规划</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(n²)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(n)</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">二分优化</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(n log n)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(n)</td>
                </tr>
              </tbody>
            </table>
          </div>

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

      {state.message && (
        <div className="mt-4 p-2 bg-blue-100 text-blue-700 rounded">
          {state.message}
        </div>
      )}
    </div>
  );
};

export default LIS;
