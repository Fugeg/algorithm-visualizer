/**
 * 汉诺塔递归可视化组件
 *
 * 【可视化策略】
 * 采用递归专用架构，但额外引入了 HanoiTower 物理模拟组件（圆盘+柱子）。
 * 汉诺塔的可视化是本系统中最具交互性的组件之一：
 * - 顶部区域：HanoiTower 组件展示三根柱子（A/B/C）和圆盘的物理状态
 * - 下方左侧：RecursionTree 展示递归调用树
 * - 下方右侧：控制面板 + 代码同步 + 变量监控 + 说明信息
 *
 * 【数据流向】Model → Step → UI（含特殊的数据转换层）
 * 1. 用户输入 n → 初始化 disks 数组 → recursionAlgorithm.hanoi(n, 'A', 'C', 'B')
 * 2. Model 每次移动生成 RecursionStep，message 中包含移动描述
 * 3. 特殊处理：通过正则解析 message 提取移动信息（from → to），更新 disks 状态
 * 4. HanoiTower 接收 disks[] 数组渲染柱子和圆盘，movingDisk 标记正在移动的圆盘
 *
 * 【特殊交互设计】
 * - Disk 接口：{ size: number, position: 'A' | 'B' | 'C' } —— 每个圆盘有大小和所在柱子
 * - 移动动画：setMovingDisk 触发后 500ms 自动清除，产生"移动中"的视觉暂留效果
 * - message 解析：用正则 /移动圆盘从 ([A-C]) 到 ([A-C])/ 提取源/目标柱子
 */
import React, { useState, useEffect } from 'react';
import { RecursionAlgorithm, RecursionStep } from '../../models/RecursionAlgorithm';
import { PlaybackController } from '../../models/PlaybackController';
import RecursionTree from './Recursion/RecursionTree';
import RecursionControls from './Recursion/RecursionControls';
import HanoiTower from './Recursion/HanoiTower';
import PlaybackControls from '../Visualization/PlaybackControls';
import CodeSyncPanel from '../Visualization/CodeSyncPanel';
import VariableMonitorPanel from '../Visualization/VariableMonitorPanel';

/** 汉诺塔伪代码定义 */
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

/**
 * 圆盘数据接口
 * @property size - 圆盘大小（数字越大表示圆盘越大，视觉上更宽）
 * @property position - 圆盘当前所在的柱子（A=起始柱, B=辅助柱, C=目标柱）
 */
interface Disk {
  size: number;
  position: 'A' | 'B' | 'C';
}

/**
 * Hanoi 可视化主组件
 *
 * 额外状态（相比基础递归架构）：
 * - disks: Disk[] —— 所有圆盘的位置状态，驱动 HanoiTower 渲染
 * - sourceRod / targetRod: 当前移动的源/目标柱子标记
 * - movingDisk: 正在移动中的圆盘 size（用于动画高亮）
 */
const Hanoi: React.FC = () => {
  const [recursionAlgorithm] = useState(() => new RecursionAlgorithm());
  const [state, setState] = useState(() => recursionAlgorithm.getState());
  const [isRunning, setIsRunning] = useState(false);
  /* 圆盘数组：每个圆盘记录其当前所在柱子 */
  const [disks, setDisks] = useState<Disk[]>([]);
  const [sourceRod, setSourceRod] = useState<string>('');
  const [targetRod, setTargetRod] = useState<string>('');
  /* 正在移动的圆盘大小编号，用于临时高亮动画 */
  const [movingDisk, setMovingDisk] = useState<number>();
  const [playbackController] = useState(() => new PlaybackController<RecursionStep>(500));
  const [playbackState, setPlaybackState] = useState(playbackController.getState());

  /*
   * Effect: 订阅递归算法模型的状态变更
   *
   * 特殊逻辑：除了更新 state 外，还解析 message 来驱动圆盘物理移动
   * 当 message 包含 "移动圆盘从 X 到 Y" 时：
   * 1. 用正则提取 source 和 target 柱子
   * 2. 在 disks 数组中找到位于 source 柱的最顶层圆盘
   * 3. 设置 movingDisk 触发动画，500ms 后清除
   * 4. 将该圆盘的 position 更新为 target 柱子
   */
  useEffect(() => {
    const unsubscribe = recursionAlgorithm.subscribe((newState) => {
      setState(newState);

      /* 解析移动信息：从 message 中提取源柱和目标柱 */
      const moveMatch = newState.message.match(/移动圆盘从 ([A-C]) 到 ([A-C])/);
      if (moveMatch) {
        const from = moveMatch[1];
        const to = moveMatch[2];
        setSourceRod(from);
        setTargetRod(to);

        /* 更新圆盘位置状态 */
        setDisks(prevDisks => {
          const newDisks = [...prevDisks];
          /* 找到位于源柱的最顶层圆盘（size 最小的，因为在同一柱子上小的在上面） */
          const movingDiskIndex = newDisks.findIndex(d => d.position === from);
          if (movingDiskIndex !== -1) {
            setMovingDisk(newDisks[movingDiskIndex].size);
            /* 500ms 后清除移动标记，完成动画效果 */
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

  /* Effect: 订阅播放控制器状态变更 */
  useEffect(() => {
    const unsubscribe = playbackController.subscribe((newState) => {
      setPlaybackState(newState);
    });
    return () => unsubscribe();
  }, [playbackController]);

  /**
   * 开始执行汉诺塔算法
   * @param n - 圆盘数量
   *
   * 初始化时将所有圆盘放在 A 柱上，size 从 n 到 1（大的在下）
   */
  const handleStart = async (n: number) => {
    setIsRunning(true);
    /*
     * 初始化圆盘数组：n 个圆盘，size 从 n 到 1（大的编号大）
     * 所有圆盘初始位置都在 A 柱（起始柱）
     */
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

  /** 重置所有状态（包括圆盘位置和移动标记） */
  const handleReset = () => {
    recursionAlgorithm.reset();
    playbackController.reset();
    setDisks([]);
    setSourceRod('');
    setTargetRod('');
    setMovingDisk(undefined);
  };

  /** 设置算法执行延迟 */
  const handleSetDelay = (delay: number) => {
    recursionAlgorithm.setDelay(delay);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">汉诺塔递归可视化</h2>

      <div className="grid grid-cols-1 gap-6">
        {/* 顶部区域：汉诺塔物理模拟 —— 三根柱子 + 圆盘 */}
        <div className="bg-white rounded-lg shadow p-4">
          <HanoiTower
            disks={disks}
            sourceRod={sourceRod}
            targetRod={targetRod}
            movingDisk={movingDisk}
          />
        </div>

        {/* 中部区域：左右分栏 —— 左侧递归树，右侧控制和详情 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左栏：递归调用树 */}
          <div>
            <RecursionTree
              steps={state.steps}
              currentStep={state.currentStep}
            />
          </div>

          {/* 右栏：控制面板 + 辅助信息 */}
          <div className="space-y-6">
            {/* 输入控制区 */}
            <RecursionControls
              onStart={handleStart}
              onReset={handleReset}
              onSetDelay={handleSetDelay}
              isRunning={isRunning}
              defaultValue={3}
              maxValue={8}
            />

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

            {/* 代码同步面板 */}
            <CodeSyncPanel
              title={HANOI_PSEUDOCODE.title}
              codeLines={HANOI_PSEUDOCODE.lines}
              highlightLine={
                playbackState.currentStepIndex >= 0 && playbackState.steps[playbackState.currentStepIndex]
                  ? playbackState.steps[playbackState.currentStepIndex].highlightLine ?? -1
                  : -1
              }
            />

            {/* 变量监控面板：n, from, to, aux, result, 递归深度 */}
            <VariableMonitorPanel
              variables={
                playbackState.currentStepIndex >= 0 && playbackState.steps[playbackState.currentStepIndex]
                  ? (() => {
                      const step = playbackState.steps[playbackState.currentStepIndex];
                      const vars: Record<string, string | number> = {};
                      /* 汉诺塔有4个参数：n(圆盘数), from(源柱), to(目标柱), aux(辅助柱) */
                      if (step.args && step.args.length >= 4) {
                        vars['n'] = step.args[0];
                        vars['from'] = step.args[1];
                        vars['to'] = step.args[2];
                        vars['aux'] = step.args[3];
                      }
                      if (step.result !== undefined) vars['result'] = step.result;
                      vars['递归深度'] = step.level;
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

            {/* 可视化图例说明 */}
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

      {/* 底部消息提示 */}
      {state.message && (
        <div className="mt-4 p-2 bg-blue-100 text-blue-700 rounded">
          {state.message}
        </div>
      )}
    </div>
  );
};

export default Hanoi;
