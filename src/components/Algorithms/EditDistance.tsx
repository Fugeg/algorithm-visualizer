import React, { useState, useEffect } from 'react';
import { DynamicProgramming, DPStep } from '../../models/DynamicProgramming';
import { PlaybackController } from '../../models/PlaybackController';
import DPSteps from './DP/DPSteps';
import DPControls from './DP/DPControls';
import DPTable from './DP/DPTable';
import PlaybackControls from '../Visualization/PlaybackControls';
import CodeSyncPanel from '../Visualization/CodeSyncPanel';
import VariableMonitorPanel from '../Visualization/VariableMonitorPanel';

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

const EditDistance: React.FC = () => {
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

  const handleReset = () => {
    dp.reset();
    playbackController.reset();
  };

  const handleSetDelay = (delay: number) => {
    dp.setDelay(delay);
  };

  const renderCurrentState = () => {
    if (!state.steps[state.currentStep]) return null;

    const { word1, word2, dp: dpArray, current, operations } = state.steps[state.currentStep].state;

    return (
      <div className="space-y-4">
        {/* 字符串显示 */}
        <div>
          <h3 className="font-semibold mb-2">字符串状态</h3>
          <div className="space-y-4">
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

        {/* DP 表格 */}
        <div>
          <h3 className="font-semibold mb-2">DP 表格</h3>
          <DPTable
            dp={dpArray}
            highlightCell={current ? { row: current.i + 1, col: current.j + 1 } : undefined}
            rowLabels={['', ...word1.split('')]}
            colLabels={['', ...word2.split('')]}
          />
        </div>

        {/* 编辑操作 */}
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
            inputType="editdistance"
            defaultValue={{
              word1: 'horse',
              word2: 'ros'
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
            title={EDIT_DISTANCE_PSEUDOCODE.title}
            codeLines={EDIT_DISTANCE_PSEUDOCODE.lines}
            highlightLine={
              playbackState.currentStepIndex >= 0 && playbackState.steps[playbackState.currentStepIndex]
                ? playbackState.steps[playbackState.currentStepIndex].type === 'init' ? 2
                  : playbackState.steps[playbackState.currentStepIndex].type === 'calculate' ? 7
                  : 11
                : -1
            }
          />

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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">动态规划</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(mn)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(mn)</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">空间优化</td>
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
                      <li>如果 word1[i] {'==='} word2[j]：dp[i][j] {'='} dp[i-1][j-1]</li>
                      <li>否则：dp[i][j] {'='} min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1</li>
                    </ul>
                  </li>
                </ol>
              </div>
              <div className="mt-2 text-yellow-600">
                <p><strong>优化：</strong>可以使用滚动数组将空间复杂度优化到 O(min(m,n))。</p>
              </div>
            </div>
          </div>

          {/* 可视化说明 */}
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

      {/* 操作提示 */}
      {state.message && (
        <div className="mt-4 p-2 bg-blue-100 text-blue-700 rounded">
          {state.message}
        </div>
      )}
    </div>
  );
};

export default EditDistance;
