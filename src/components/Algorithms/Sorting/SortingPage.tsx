import React, { useState, useEffect, useCallback } from 'react';
import { SortingAlgorithm, SortingStep, ArrayElement } from '../../../models/SortingAlgorithm';
import { PlaybackController } from '../../../models/PlaybackController';
import PlaybackControls from '../../Visualization/PlaybackControls';
import CodeSyncPanel, { SORTING_PSEUDOCODE } from '../../Visualization/CodeSyncPanel';
import VariableMonitorPanel from '../../Visualization/VariableMonitorPanel';

interface SortingPageProps {
  algorithmType: string;
  title: string;
  description: string;
  complexityData: { case: string; time: string; space: string; note: string }[];
  generateSteps: (algo: SortingAlgorithm) => void;
  algorithmNote?: string;
}

const SortingVisualizer: React.FC<{ array: ArrayElement[] }> = ({ array }) => {
  const maxValue = Math.max(...array.map(item => item.value), 1);

  const getBarColor = (state: ArrayElement['state']) => {
    switch (state) {
      case 'comparing': return 'bg-yellow-500';
      case 'swapping': return 'bg-red-500';
      case 'sorted': return 'bg-green-500';
      case 'pivot': return 'bg-purple-500';
      case 'current': return 'bg-orange-500';
      case 'subarray': return 'bg-teal-400';
      case 'heap': return 'bg-amber-600';
      case 'counting': return 'bg-cyan-500';
      case 'bucket': return 'bg-lime-500';
      case 'radix': return 'bg-pink-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="border rounded-lg bg-white p-4 shadow-sm">
      <div className="flex items-end justify-center min-h-[200px] overflow-x-auto gap-1">
        {array.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center"
            style={{ width: `${Math.max(20, Math.min(60, 600 / array.length))}px` }}
          >
            <div
              className={`w-full ${getBarColor(item.state)} rounded-t transition-all duration-200`}
              style={{ height: `${(item.value / maxValue) * 200}px` }}
            />
            {array.length <= 30 && (
              <span className="text-xs mt-1 text-gray-600">{item.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const SortingPage: React.FC<SortingPageProps> = ({
  algorithmType,
  title,
  description,
  complexityData,
  generateSteps,
  algorithmNote
}) => {
  const [sortingAlgorithm] = useState(() => new SortingAlgorithm());
  const [playbackController] = useState(() => new PlaybackController<SortingStep>(500));
  const [playbackState, setPlaybackState] = useState(playbackController.getState());
  const [arraySize, setArraySize] = useState(15);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    const unsubscribe = playbackController.subscribe((state) => {
      setPlaybackState(state);
    });
    return () => unsubscribe();
  }, [playbackController]);

  const handleGenerate = useCallback((size: number) => {
    playbackController.reset();
    sortingAlgorithm.generateRandomArray(size);
    setArraySize(size);
  }, [sortingAlgorithm, playbackController]);

  const handleCustomInput = useCallback(() => {
    const values = customInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (values.length > 0) {
      playbackController.reset();
      sortingAlgorithm.setArray(values);
      setArraySize(values.length);
      setShowCustomInput(false);
    }
  }, [customInput, sortingAlgorithm, playbackController]);

  const handleStart = useCallback(() => {
    generateSteps(sortingAlgorithm);
    const steps = sortingAlgorithm.getSteps();
    if (steps.length > 0) {
      playbackController.setSteps(steps);
      playbackController.play();
    }
  }, [sortingAlgorithm, playbackController, generateSteps]);

  const handleReset = useCallback(() => {
    playbackController.reset();
    sortingAlgorithm.generateRandomArray(arraySize);
  }, [playbackController, sortingAlgorithm, arraySize]);

  useEffect(() => {
    handleGenerate(15);
  }, [handleGenerate]);

  const currentStep = playbackState.currentStepIndex >= 0 && playbackState.currentStepIndex < playbackState.steps.length
    ? playbackState.steps[playbackState.currentStepIndex]
    : null;

  const displayArray = currentStep?.array || sortingAlgorithm.getState().array.map(v => ({ ...v, state: 'default' as const }));
  const comparisons = currentStep?.comparisons || 0;
  const swaps = currentStep?.swaps || 0;
  const highlightLine = currentStep?.highlightLine ?? -1;
  const variables = currentStep?.variables || {};
  const message = currentStep?.message || '';

  const pseudocode = SORTING_PSEUDOCODE[algorithmType];

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">{title}</h2>
      <p className="text-gray-600 mb-4 text-sm">{description}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <SortingVisualizer array={displayArray} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-600">比较次数</div>
              <div className="text-xl font-bold text-blue-800">{comparisons}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="text-xs text-red-600">交换次数</div>
              <div className="text-xl font-bold text-red-800">{swaps}</div>
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

          <div className="space-y-3">
            <div className="bg-white rounded-lg shadow p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">数据设置</h3>
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm text-gray-600 whitespace-nowrap">
                  数组大小: {arraySize}
                </label>
                <input
                  type="range" min="5" max="50" value={arraySize}
                  onChange={(e) => handleGenerate(parseInt(e.target.value))}
                  disabled={playbackState.isPlaying}
                  className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleGenerate(arraySize)}
                  disabled={playbackState.isPlaying}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
                >
                  随机生成
                </button>
                <button
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  disabled={playbackState.isPlaying}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-sm"
                >
                  自定义输入
                </button>
                {playbackState.totalSteps === 0 && (
                  <button
                    onClick={handleStart}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    生成步骤
                  </button>
                )}
              </div>
              {showCustomInput && (
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text" value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="输入数字，用逗号分隔，如: 5,3,8,1,9"
                    className="flex-1 border rounded px-3 py-2 text-sm"
                  />
                  <button onClick={handleCustomInput} className="px-4 py-2 bg-indigo-500 text-white rounded text-sm">
                    确认
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {pseudocode && (
            <CodeSyncPanel
              title={pseudocode.title}
              codeLines={pseudocode.lines}
              highlightLine={highlightLine}
            />
          )}

          <VariableMonitorPanel variables={variables} />

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
                {complexityData.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{row.case}</td>
                    <td className="px-4 py-2 text-sm text-gray-500 font-mono">{row.time}</td>
                    <td className="px-4 py-2 text-sm text-gray-500 font-mono">{row.space}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {algorithmNote && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
              <h4 className="text-sm font-semibold mb-2 text-yellow-700">算法说明</h4>
              <div className="text-sm text-gray-700 space-y-1">{algorithmNote}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SortingPage;
