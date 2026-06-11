/**
 * 活动选择问题（贪心算法）可视化组件
 *
 * 【可视化策略】
 * 采用贪心算法专用架构。活动选择问题的核心是按结束时间排序后贪心选择不重叠活动，
 * 可视化重点在于：
 * - 时间轴（Timeline）渲染：每个活动用横向条表示其时间跨度
 * - 已选活动（绿色）与未选活动（灰色）的颜色区分
 * - 当前考虑的活动高亮标记
 *
 * 【数据流向】Model → Step → UI
 * 1. 用户输入活动列表 → greedyAlgorithm.selectActivities(activities)
 * 2. Model 按结束时间排序后逐个判断是否与已选集合冲突
 * 3. GreedyStep.state 包含：activity（当前考虑的活动）、selected（已选活动数组）
 * 4. renderTimeline() 将活动数据映射为基于绝对定位的横向条形图
 */
import React, { useState, useEffect } from 'react';
import { GreedyAlgorithm, GreedyStep } from '../../models/GreedyAlgorithm';
import { PlaybackController } from '../../models/PlaybackController';
import GreedySteps from './Greedy/GreedySteps';
import GreedyControls from './Greedy/GreedyControls';
import PlaybackControls from '../Visualization/PlaybackControls';
import CodeSyncPanel from '../Visualization/CodeSyncPanel';
import VariableMonitorPanel from '../Visualization/VariableMonitorPanel';

/** 活动选择贪心伪代码定义 */
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

/** 活动数据接口 */
interface Activity {
  id: number;
  start: number;
  end: number;
}

/**
 * ActivitySelection 可视化主组件
 *
 * 特殊渲染函数 renderTimeline：
 * - 根据 maxEnd 计算时间比例尺 (timeScale = 600 / maxEnd)
 * - 每个活动用 absolute 定位的 div 表示，left=startTime*scale, width=(end-start)*scale
 * - 已选活动绿色，未选灰色
 */
const ActivitySelection: React.FC = () => {
  const [greedyAlgorithm] = useState(() => new GreedyAlgorithm());
  const [state, setState] = useState(() => greedyAlgorithm.getState());
  const [isRunning, setIsRunning] = useState(false);
  const [playbackController] = useState(() => new PlaybackController<GreedyStep>(500));
  const [playbackState, setPlaybackState] = useState(playbackController.getState());

  useEffect(() => {
    const unsubscribe = greedyAlgorithm.subscribe((newState) => setState(newState));
    return () => { unsubscribe(); };
  }, [greedyAlgorithm]);

  useEffect(() => {
    const unsubscribe = playbackController.subscribe((newState) => setPlaybackState(newState));
    return () => unsubscribe();
  }, [playbackController]);

  /** 开始执行活动选择算法 */
  const handleStart = async (activities: Activity[]) => {
    setIsRunning(true);
    playbackController.reset();
    await greedyAlgorithm.selectActivities(activities);
    const steps = greedyAlgorithm.getState().steps;
    if (steps.length > 0) playbackController.setSteps(steps);
    setIsRunning(false);
  };

  /** 重置所有状态 */
  const handleReset = () => {
    greedyAlgorithm.reset();
    playbackController.reset();
  };

  /** 设置算法执行延迟 */
  const handleSetDelay = (delay: number) => {
    greedyAlgorithm.setDelay(delay);
  };

  /**
   * 渲染时间轴视图
   * @param activities - 所有活动数据
   * @param selected - 已选中的活动列表
   *
   * 布局说明：
   * - 底部有一条时间轴线（灰线 + 刻度标签）
   * - 上方每个活动用一个圆角横条表示，y 方向错开避免重叠
   * - 横条的 left/width 根据活动的 start/end 时间按比例计算
   */
  const renderTimeline = (activities: Activity[], selected: Activity[] = []) => {
    const maxEnd = Math.max(...activities.map(a => a.end));
    /* 时间比例尺：将时间值映射为像素宽度，总宽度 600px */
    const timeScale = 600 / maxEnd;

    return (
      <div className="relative h-[300px] mt-4">
        {/* 时间轴底线和刻度 */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gray-300">
          {Array.from({ length: maxEnd + 1 }).map((_, i) => (
            <div key={i} className="absolute h-2 w-[1px] bg-gray-300" style={{ left: `${i * timeScale}px` }}>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">{i}</div>
            </div>
          ))}
        </div>

        {/* 活动条：每个活动根据时间范围定位 */}
        {activities.map((activity, index) => {
          const isSelected = selected.some(s => s.id === activity.id);
          /* y 偏移使每个活动在垂直方向上错开显示 */
          const yOffset = index * 30 + 20;

          return (
            <div
              key={activity.id}
              className={`absolute h-6 rounded-full ${isSelected ? 'bg-green-500' : 'bg-gray-300'}`}
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

  /**
   * 渲染当前步骤状态详情
   * 包含：已选活动数、当前考虑的活动、时间轴可视化
   */
  const renderCurrentState = () => {
    if (!state.steps[state.currentStep]) return null;

    const { activity, selected = [] } = state.steps[state.currentStep].state;
    /* 合并当前活动和已选活动用于完整的时间轴展示 */
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

        {/* 时间轴可视化区域 */}
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
          <GreedySteps steps={state.steps} currentStep={state.currentStep} />
        </div>

        <div className="space-y-6">
          <GreedyControls onStart={handleStart} onReset={handleReset} onSetDelay={handleSetDelay}
            isRunning={isRunning} inputType="activities"
            defaultValue={{ activities: '0,6,8|1,4,7|2,2,4|3,3,5|4,1,3|5,5,9' }} />

          <div className="bg-white rounded-lg shadow p-4">{renderCurrentState()}</div>

          <PlaybackControls playbackState={playbackState}
            onPlay={() => playbackController.play()} onPause={() => playbackController.pause()}
            onStepForward={() => playbackController.stepForward()} onStepBackward={() => playbackController.stepBackward()}
            onReset={() => playbackController.reset()} onSpeedChange={(s) => playbackController.setSpeed(s)}
            onGoToStep={(i) => playbackController.goToStep(i)} />

          <CodeSyncPanel title={ACTIVITY_SELECTION_PSEUDOCODE.title} codeLines={ACTIVITY_SELECTION_PSEUDOCODE.lines}
            highlightLine={playbackState.currentStepIndex >= 0 && playbackState.steps[playbackState.currentStepIndex]
              ? playbackState.steps[playbackState.currentStepIndex].highlightLine ?? -1 : -1} />

          <VariableMonitorPanel variables={
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
                    if (stepState.selected.length > 0)
                      vars['最后结束时间'] = stepState.selected[stepState.selected.length - 1].end;
                  }
                  return vars;
                })()
              : {}}

          />
          {/* 复杂度分析、算法说明、可视化图例 —— 结构与其他组件一致 */}

        </div>
      </div>

      {state.message && (<div className="mt-4 p-2 bg-blue-100 text-blue-700 rounded">{state.message}</div>)}
    </div>
  );
};

export default ActivitySelection;
