import React, { useState, useEffect } from 'react';
import { RecursionAlgorithm, RecursionStep } from '../../models/RecursionAlgorithm';
import { PlaybackController } from '../../models/PlaybackController';
import RecursionTree from './Recursion/RecursionTree';
import RecursionControls from './Recursion/RecursionControls';
import HanoiTower from './Recursion/HanoiTower';
import PlaybackControls from '../Visualization/PlaybackControls';
import CodeSyncPanel from '../Visualization/CodeSyncPanel';
import VariableMonitorPanel from '../Visualization/VariableMonitorPanel';

const HANOI_PSEUDOCODE = {
  title: '汉诺塔 伪代码',
  lines: [
    { text: 'function hanoi(n, from, to, aux):', indent: 0 },
    { text: 'if n == 1:', indent: 1 },
    { text: 'move disk from → to', indent: 2 },
    { text: 'return', indent: 2 },
    { text: 'hanoi(n-1, from, aux, to)', indent: 1 },
    { text: 'move disk from → to', indent: 1 },
    { text: 'hanoi(n-1, aux, to, from)', indent: 1 },
  ]
};

interface Disk {
  size: number;
  position: 'A' | 'B' | 'C';
}

const Hanoi: React.FC = () => {
  const [recursionAlgorithm] = useState(() => new RecursionAlgorithm());
  const [state, setState] = useState(() => recursionAlgorithm.getState());
  const [isRunning, setIsRunning] = useState(false);
  const [disks, setDisks] = useState<Disk[]>([]);
  const [sourceRod, setSourceRod] = useState<string>('');
  const [targetRod, setTargetRod] = useState<string>('');
  const [movingDisk, setMovingDisk] = useState<number>();
  const [playbackController] = useState(() => new PlaybackController<RecursionStep>(500));
  const [playbackState, setPlaybackState] = useState(playbackController.getState());

  useEffect(() => {
    const unsubscribe = recursionAlgorithm.subscribe((newState) => {
      setState(newState);
      
      // 解析移动信息
      const moveMatch = newState.message.match(/移动圆盘从 ([A-C]) 到 ([A-C])/);
      if (moveMatch) {
        const from = moveMatch[1];
        const to = moveMatch[2];
        setSourceRod(from);
        setTargetRod(to);
        
        // 更新圆盘位置
        setDisks(prevDisks => {
          const newDisks = [...prevDisks];
          const movingDiskIndex = newDisks.findIndex(d => d.position === from);
          if (movingDiskIndex !== -1) {
            setMovingDisk(newDisks[movingDiskIndex].size);
            setTimeout(() => {
              setMovingDisk(undefined);
            }, 500);
            newDisks[movingDiskIndex].position = to as 'A' | 'B' | 'C';
          }
          return newDisks;
        });
      }
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
    // 初始化圆盘
    setDisks(
      Array.from({ length: n }, (_, i) => ({
        size: n - i,
        position: 'A'
      }))
    );
    setSourceRod('');
    setTargetRod('');
    await recursionAlgorithm.hanoi(n, 'A', 'C', 'B');
    const steps = recursionAlgorithm.getState().steps;
    if (steps.length > 0) {
      playbackController.setSteps(steps);
    }
    setIsRunning(false);
  };

  const handleReset = () => {
    recursionAlgorithm.reset();
    playbackController.reset();
    setDisks([]);
    setSourceRod('');
    setTargetRod('');
    setMovingDisk(undefined);
  };

  const handleSetDelay = (delay: number) => {
    recursionAlgorithm.setDelay(delay);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">汉诺塔递归可视化</h2>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <HanoiTower
            disks={disks}
            sourceRod={sourceRod}
            targetRod={targetRod}
            movingDisk={movingDisk}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <RecursionTree
              steps={state.steps}
              currentStep={state.currentStep}
            />
          </div>
          
          <div className="space-y-6">
            <RecursionControls
              onStart={handleStart}
              onReset={handleReset}
              onSetDelay={handleSetDelay}
              isRunning={isRunning}
              defaultValue={3}
              maxValue={8}
            />

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
              title={HANOI_PSEUDOCODE.title}
              codeLines={HANOI_PSEUDOCODE.lines}
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
                      if (step.args && step.args.length >= 4) {
                        vars['n'] = step.args[0];
                        vars['from'] = step.args[1];
                        vars['to'] = step.args[2];
                        vars['aux'] = step.args[3];
                      }
                      if (step.result !== undefined) {
                        vars['result'] = step.result;
                      }
                      vars['递归深度'] = step.level;
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
                <p>汉诺塔是一个经典的递归问题，目标是将所有圆盘从起始柱子移动到目标柱子。</p>
                <div className="mt-2">
                  <h5 className="font-semibold">规则：</h5>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>每次只能移动一个圆盘</li>
                    <li>大圆盘不能放在小圆盘上面</li>
                    <li>可以使用辅助柱子</li>
                  </ul>
                </div>
                <div className="mt-2">
                  <h5 className="font-semibold">递归思路：</h5>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>将n-1个圆盘从源柱移到辅助柱</li>
                    <li>将最大的圆盘从源柱移到目标柱</li>
                    <li>将n-1个圆盘从辅助柱移到目标柱</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* 可视化说明 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-2 text-blue-700">可视化说明</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>柱子A：起始柱</li>
                <li>柱子B：辅助柱</li>
                <li>柱子C：目标柱</li>
                <li>圆盘大小：数字越大表示圆盘越大</li>
                <li>移动动画：显示圆盘的移动路径</li>
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

export default Hanoi;
