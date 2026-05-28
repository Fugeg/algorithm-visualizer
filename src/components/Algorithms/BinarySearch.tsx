import React, { useState, useEffect, useCallback } from 'react';
import { BinarySearchAlgorithm, BinarySearchStep, ArrayElement } from '../../models/BinarySearchAlgorithm';
import { PlaybackController } from '../../models/PlaybackController';
import PlaybackControls from '../Visualization/PlaybackControls';
import CodeSyncPanel from '../Visualization/CodeSyncPanel';
import VariableMonitorPanel from '../Visualization/VariableMonitorPanel';

const BINARY_SEARCH_PSEUDOCODE = {
  title: '二分查找 伪代码',
  lines: [
    { text: 'function binarySearch(arr, target):', indent: 0 },
    { text: 'left = 0, right = arr.length - 1', indent: 1 },
    { text: 'while left <= right:', indent: 1 },
    { text: 'mid = floor((left + right) / 2)', indent: 2 },
    { text: 'if arr[mid] == target:', indent: 2 },
    { text: 'return mid', indent: 3 },
    { text: 'else if arr[mid] < target:', indent: 2 },
    { text: 'left = mid + 1', indent: 3 },
    { text: 'else:', indent: 2 },
    { text: 'right = mid - 1', indent: 3 },
    { text: 'return -1', indent: 1 },
  ]
};

const getElementColor = (state: ArrayElement['state']) => {
  switch (state) {
    case 'searching': return 'bg-yellow-400 border-yellow-500';
    case 'found': return 'bg-green-400 border-green-500';
    case 'eliminated': return 'bg-gray-300 border-gray-400';
    case 'mid': return 'bg-orange-400 border-orange-500';
    default: return 'bg-blue-400 border-blue-500';
  }
};

const getTextColor = (state: ArrayElement['state']) => {
  switch (state) {
    case 'eliminated': return 'text-gray-500';
    default: return 'text-white';
  }
};

const BinarySearch: React.FC = () => {
  const [algorithm] = useState(() => new BinarySearchAlgorithm());
  const [playbackController] = useState(() => new PlaybackController<BinarySearchStep>(600));
  const [playbackState, setPlaybackState] = useState(playbackController.getState());
  const [arraySize, setArraySize] = useState(16);
  const [target, setTarget] = useState(50);

  useEffect(() => {
    const unsubscribe = playbackController.subscribe((state) => {
      setPlaybackState(state);
    });
    return () => unsubscribe();
  }, [playbackController]);

  const handleGenerate = useCallback((size: number) => {
    playbackController.reset();
    algorithm.generateSortedArray(size);
    setArraySize(size);
  }, [algorithm, playbackController]);

  const handleStart = useCallback(() => {
    algorithm.generateSortedArray(arraySize);
    algorithm.binarySearch(target);
    const steps = algorithm.getSteps();
    if (steps.length > 0) {
      playbackController.setSteps(steps);
      playbackController.play();
    }
  }, [algorithm, playbackController, arraySize, target]);

  const handleReset = useCallback(() => {
    playbackController.reset();
    algorithm.reset();
  }, [playbackController, algorithm]);

  useEffect(() => {
    handleGenerate(16);
  }, [handleGenerate]);

  const currentStep = playbackState.currentStepIndex >= 0 && playbackState.currentStepIndex < playbackState.steps.length
    ? playbackState.steps[playbackState.currentStepIndex]
    : null;

  const displayArray = currentStep?.array || algorithm.getState().array.map(v => ({ ...v, state: 'default' as const }));
  const left = currentStep?.left ?? 0;
  const right = currentStep?.right ?? displayArray.length - 1;
  const mid = currentStep?.mid ?? -1;
  const highlightLine = currentStep?.highlightLine ?? -1;
  const variables = currentStep?.variables || { left: 0, right: displayArray.length - 1, mid: -1, target };
  const message = currentStep?.message || '';

  const boxWidth = Math.max(36, Math.min(56, 700 / displayArray.length));

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">二分查找可视化</h2>
      <p className="text-gray-600 mb-4 text-sm">在有序数组中通过不断缩小搜索范围来高效查找目标元素</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="border rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center justify-center gap-1 flex-wrap py-4">
              {displayArray.map((item, index) => (
                <div key={index} className="flex flex-col items-center" style={{ width: `${boxWidth}px` }}>
                  <div
                    className={`w-full h-12 flex items-center justify-center rounded border-2 transition-all duration-200 ${getElementColor(item.state)}`}
                  >
                    <span className={`text-sm font-bold ${getTextColor(item.state)}`}>{item.value}</span>
                  </div>
                  <span className="text-xs text-gray-400 mt-1">{index}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-1 flex-wrap mt-2">
              {displayArray.map((_, index) => (
                <div key={index} className="flex flex-col items-center" style={{ width: `${boxWidth}px` }}>
                  <div className="h-6 flex items-center justify-center">
                    {index === left && (
                      <span className="text-xs font-bold text-blue-600">← L</span>
                    )}
                    {index === right && (
                      <span className="text-xs font-bold text-red-600">R →</span>
                    )}
                    {index === mid && mid >= 0 && (
                      <span className="text-xs font-bold text-orange-600">↑ M</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-600">搜索范围</div>
              <div className="text-xl font-bold text-blue-800">[{left}, {right}]</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="text-xs text-orange-600">中间位置</div>
              <div className="text-xl font-bold text-orange-800">{mid >= 0 ? mid : '-'}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xs text-green-600">步骤进度</div>
              <div className="text-xl font-bold text-green-800">
                {playbackState.currentStepIndex + 1}/{playbackState.totalSteps}
              </div>
            </div>
          </div>

          <PlaybackControls
            playbackState={playbackState}
            onPlay={() => {
              if (playbackState.totalSteps === 0) {
                handleStart();
              } else {
                playbackController.play();
              }
            }}
            onPause={() => playbackController.pause()}
            onStepForward={() => playbackController.stepForward()}
            onStepBackward={() => playbackController.stepBackward()}
            onReset={handleReset}
            onSpeedChange={(s) => playbackController.setSpeed(s)}
            onGoToStep={(i) => playbackController.goToStep(i)}
          />

          {message && (
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg text-sm border border-indigo-100">
              {message}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">数据设置</h3>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 whitespace-nowrap">
                数组大小: {arraySize}
              </label>
              <input
                type="range" min="5" max="30" value={arraySize}
                onChange={(e) => handleGenerate(parseInt(e.target.value))}
                disabled={playbackState.isPlaying}
                className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 whitespace-nowrap">
                目标值:
              </label>
              <input
                type="number" value={target}
                onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
                disabled={playbackState.isPlaying}
                className="border rounded px-3 py-1.5 text-sm w-24"
              />
              <button
                onClick={handleStart}
                disabled={playbackState.isPlaying}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50 text-sm"
              >
                开始查找
              </button>
              <button
                onClick={() => handleGenerate(arraySize)}
                disabled={playbackState.isPlaying}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
              >
                随机生成
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <CodeSyncPanel
            title={BINARY_SEARCH_PSEUDOCODE.title}
            codeLines={BINARY_SEARCH_PSEUDOCODE.lines}
            highlightLine={highlightLine}
          />

          <VariableMonitorPanel variables={variables} title="变量监控" />

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b">
              <h3 className="text-sm font-semibold text-gray-700">复杂度分析</h3>
            </div>
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">情况</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">时间</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">空间</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">说明</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">最好</td>
                  <td className="px-4 py-2 text-sm text-gray-500 font-mono">O(1)</td>
                  <td className="px-4 py-2 text-sm text-gray-500 font-mono">O(1)</td>
                  <td className="px-4 py-2 text-sm text-gray-500">目标恰好在中间</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">平均</td>
                  <td className="px-4 py-2 text-sm text-gray-500 font-mono">O(log n)</td>
                  <td className="px-4 py-2 text-sm text-gray-500 font-mono">O(1)</td>
                  <td className="px-4 py-2 text-sm text-gray-500">每次排除一半</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">最坏</td>
                  <td className="px-4 py-2 text-sm text-gray-500 font-mono">O(log n)</td>
                  <td className="px-4 py-2 text-sm text-gray-500 font-mono">O(1)</td>
                  <td className="px-4 py-2 text-sm text-gray-500">搜索范围缩小到1</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
            <h4 className="text-sm font-semibold mb-2 text-yellow-700">算法说明</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p>二分查找要求数组必须有序，通过比较中间元素与目标值来缩小搜索范围。</p>
              <div className="mt-2">
                <h5 className="font-semibold">颜色说明：</h5>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><span className="text-blue-500 font-medium">蓝色</span> - 默认/未搜索</li>
                  <li><span className="text-yellow-500 font-medium">黄色</span> - 当前搜索范围</li>
                  <li><span className="text-orange-500 font-medium">橙色</span> - 中间位置 (mid)</li>
                  <li><span className="text-green-500 font-medium">绿色</span> - 找到目标</li>
                  <li><span className="text-gray-400 font-medium">灰色</span> - 已排除</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BinarySearch;
