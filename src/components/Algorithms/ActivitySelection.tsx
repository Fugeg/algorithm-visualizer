import React, { useState, useEffect } from 'react';
import { GreedyAlgorithm, GreedyStep } from '../../models/GreedyAlgorithm';
import { PlaybackController } from '../../models/PlaybackController';
import GreedySteps from './Greedy/GreedySteps';
import GreedyControls from './Greedy/GreedyControls';
import PlaybackControls from '../Visualization/PlaybackControls';
import CodeSyncPanel from '../Visualization/CodeSyncPanel';
import VariableMonitorPanel from '../Visualization/VariableMonitorPanel';

const ACTIVITY_SELECTION_PSEUDOCODE = {
  title: '活动选择贪心 伪代码',
  lines: [
    { text: 'function selectActivities(activities):', indent: 0 },
    { text: 'sort activities by end time', indent: 1 },
    { text: 'selected = [activities[0]]', indent: 1 },
    { text: 'lastEnd = activities[0].end', indent: 1 },
    { text: 'for i = 1 to n-1:', indent: 1 },
    { text: 'if activities[i].start >= lastEnd:', indent: 2 },
    { text: 'selected.push(activities[i])', indent: 3 },
    { text: 'lastEnd = activities[i].end', indent: 3 },
    { text: 'return selected', indent: 1 },
  ]
};

interface Activity {
  id: number;
  start: number;
  end: number;
}

const ActivitySelection: React.FC = () => {
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

  const handleStart = async (activities: Activity[]) => {
    setIsRunning(true);
    playbackController.reset();
    await greedyAlgorithm.selectActivities(activities);
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

  const renderTimeline = (activities: Activity[], selected: Activity[] = []) => {
    const maxEnd = Math.max(...activities.map(a => a.end));
    const timeScale = 600 / maxEnd; // 600px 是时间轴的总宽度

    return (
      <div className="relative h-[300px] mt-4">
        {/* 时间轴 */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gray-300">
          {Array.from({ length: maxEnd + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute h-2 w-[1px] bg-gray-300"
              style={{ left: `${i * timeScale}px` }}
            >
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
                {i}
              </div>
            </div>
          ))}
        </div>

        {/* 活动条 */}
        {activities.map((activity, index) => {
          const isSelected = selected.some(s => s.id === activity.id);
          const yOffset = index * 30 + 20;

          return (
            <div
              key={activity.id}
              className={`absolute h-6 rounded-full ${
                isSelected ? 'bg-green-500' : 'bg-gray-300'
              }`}
              style={{
                left: `${activity.start * timeScale}px`,
                top: `${yOffset}px`,
                width: `${(activity.end - activity.start) * timeScale}px`
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-xs text-white">
                活动 {activity.id}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCurrentState = () => {
    if (!state.steps[state.currentStep]) return null;

    const { activity, selected = [] } = state.steps[state.currentStep].state;
    const allActivities = selected.concat(activity ? [activity] : []);

    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">当前状态</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded">
              <span className="text-gray-600">已选活动数：</span>
              <span className="font-mono">{selected.length}</span>
            </div>
            {activity && (
              <div className="p-3 bg-gray-50 rounded">
                <span className="text-gray-600">当前考虑：</span>
                <span className="font-mono">活动 {activity.id}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">时间轴</h3>
          {renderTimeline(allActivities, selected)}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">活动选择问题（贪心算法）</h2>
      
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
            inputType="activities"
            defaultValue={{
              activities: '0,6,8|1,4,7|2,2,4|3,3,5|4,1,3|5,5,9'
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
            title={ACTIVITY_SELECTION_PSEUDOCODE.title}
            codeLines={ACTIVITY_SELECTION_PSEUDOCODE.lines}
            highlightLine={
              playbackState.currentStepIndex >= 0 && playbackState.steps[playbackState.currentStepIndex]
                ? playbackState.steps[playbackState.currentStepIndex].type === 'select' ? 5
                  : playbackState.steps[playbackState.currentStepIndex].type === 'skip' ? 5
                  : playbackState.steps[playbackState.currentStepIndex].type === 'solution' ? 8
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
                    if (stepState.activity) {
                      vars['当前活动'] = `活动 ${stepState.activity.id}`;
                      vars['开始时间'] = stepState.activity.start;
                      vars['结束时间'] = stepState.activity.end;
                    }
                    if (stepState.selected) {
                      vars['已选活动数'] = stepState.selected.length;
                      if (stepState.selected.length > 0) {
                        const lastActivity = stepState.selected[stepState.selected.length - 1];
                        vars['最后结束时间'] = lastActivity.end;
                      }
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(n log n)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">O(1)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-2 text-yellow-700">算法说明</h4>
            <div className="space-y-2 text-gray-700">
              <p>活动选择问题是一个经典的贪心算法问题，目标是在一组活动中选择最多的互不重叠的活动。</p>
              <div className="mt-2">
                <h5 className="font-semibold">贪心策略：</h5>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>将活动按结束时间排序</li>
                  <li>选择结束时间最早的活动</li>
                  <li>移除与已选活动时间重叠的活动</li>
                  <li>重复步骤2-3直到没有活动可选</li>
                </ol>
              </div>
              <div className="mt-2 text-yellow-600">
                <p><strong>证明：</strong>按结束时间排序并贪心选择可以保证得到最优解。</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-2 text-blue-700">可视化说明</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>绿色：已选择的活动</li>
              <li>灰色：未选择或被跳过的活动</li>
              <li>时间轴：显示活动的开始和结束时间</li>
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

export default ActivitySelection;
