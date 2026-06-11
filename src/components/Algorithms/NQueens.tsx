/**
 * N皇后问题回溯算法可视化组件
 *
 * 【可视化策略】
 * 本组件是本系统中最复杂的可视化之一，采用自定义的 ChessBoard 棋盘渲染。
 * N皇后的核心是在 N×N 棋盘上放置 N 个皇后使它们互不攻击：
 * - ChessBoard 子组件：用 SVG/Div 渲染国际象棋风格的棋盘格子，每个格子可处于多种状态
 * - 内嵌子组件设计：ChessBoard 作为 NQueens 的内部组件，接收 board 数据和当前步骤信息
 * - 颜色状态机：empty(空) → trying(尝试放置/黄色) → queen(已放置) / backtrack(回溯撤销/红色) → solution(解的一部分/绿色)
 *
 * 【数据流向】Model → Step → UI（含棋盘状态同步）
 * 1. 用户选择 N → algorithm.nQueens(N)
 * 2. Model 逐行尝试放置皇后，每步生成 BacktrackingStep（含完整 board 快照）
 * 3. 通过两个 Effect 同步棋盘状态：
 *    - algorithm.subscribe: 收集 solutions 和更新 currentBoard
 *    - playbackController.subscribe: 根据播放进度切换 currentBoard
 * 4. ChessBoard 接收 currentBoard + currentStep 渲染棋盘和颜色高亮
 *
 * 【特殊交互设计】
 * - 棋盘大小 N 可通过滑块动态调节（4~8），实时重置棋盘
 * - 找到的所有解以缩略图网格展示（最多显示12个，超出则折叠）
 * - 统计面板实时显示：棋盘大小 N、已找到解数、当前步骤进度
 * - 平衡因子颜色编码：绿色=平衡(|bf|≤1)、橙色=轻微不平衡(|bf|=1)、红色=需旋转(|bf|>1)
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BacktrackingAlgorithm, BacktrackingStep } from '../../models/BacktrackingAlgorithm';
import { PlaybackController } from '../../models/PlaybackController';
import PlaybackControls from '../Visualization/PlaybackControls';
import CodeSyncPanel from '../Visualization/CodeSyncPanel';
import VariableMonitorPanel from '../Visualization/VariableMonitorPanel';

/** N皇后回溯伪代码定义 */
const NQUEENS_PSEUDOCODE = {
  title: 'N皇后回溯 伪代码',
  lines: [
    { text: 'function solveNQueens(n):', indent: 0 },
    { text: 'board = n×n empty grid', indent: 1 },
    { text: 'backtrack(row=0):', indent: 1 },
    { text: 'if row == n: found solution', indent: 2 },
    { text: 'for col = 0 to n-1:', indent: 2 },
    { text: 'if isValid(row, col):', indent: 3 },
    { text: 'place queen at (row, col)', indent: 4 },
    { text: 'backtrack(row + 1)', indent: 4 },
    { text: 'remove queen at (row, col)', indent: 4 },
    { text: 'function isValid(row, col):', indent: 1 },
    { text: 'check column & diagonals', indent: 2 },
  ]
};

/**
 * 棋盘格子状态类型
 * - empty: 空格子，无皇后
 * - queen: 已放置皇后（正常状态）
 * - trying: 正在尝试放置（黄色高亮）
 * - backtrack: 回溯撤销中（红色高亮）
 * - solution: 属于最终解的皇后位置（绿色高亮）
 */
interface BoardCell {
  row: number;
  col: number;
  state: 'empty' | 'queen' | 'trying' | 'backtrack' | 'solution';
}

/**
 * 国际象棋风格棋盘子组件
 *
 * @param board - 二维数组，1 表示有皇后，0 表示空
 * @param n - 棋盘大小
 * @param currentStep - 当前播放步骤（用于确定 trying/backtrack 高亮位置）
 *
 * 渲染逻辑：
 * 1. 将 board 数组映射为 BoardCell[][] 格栅数据
 * 2. 根据 currentStep 覆盖 trying/backtrack/solution 状态
 * 3. 基础底色采用国际象棋配色（amber-200/amber-50 交替）
 * 4. 状态覆盖优先级：solution > backtrack > trying > queen > empty
 * 5. 有皇后的格子显示 ♛ 符号（Unicode 黑色皇后）
 */
const ChessBoard: React.FC<{
  board: number[][];
  n: number;
  currentStep: BacktrackingStep | null;
}> = ({ board, n, currentStep }) => {
  /* 将二维 board 数组转换为带状态的 Cell 栅格 */
  const cells: BoardCell[][] = board.map((row, ri) =>
    row.map((cell, ci) => {
      /* 默认状态：有皇后=queen，无皇后=empty */
      let state: BoardCell['state'] = cell === 1 ? 'queen' : 'empty';

      if (currentStep) {
        const { trying, backtrack: btInfo } = currentStep.state;
        /* 尝试放置状态覆盖 */
        if (trying && trying.row === ri && trying.col === ci) state = 'trying';
        /* 回溯撤销状态覆盖 */
        else if (btInfo && btInfo.row === ri && btInfo.col === ci) state = 'backtrack';
        /* 如果当前步骤是找到解的类型，所有皇后标记为 solution */
        if (currentStep.type === 'solution') {
          if (cell === 1) state = 'solution';
        }
      }

      return { row: ri, col: ci, state };
    })
  );

  /** 根据格子状态返回 Tailwind CSS 颜色类名 */
  const getCellColor = (cell: BoardCell, isDark: boolean) => {
    const base = isDark ? 'bg-amber-200' : 'bg-amber-50';  /* 国际象棋底色 */
    switch (cell.state) {
      case 'trying': return 'bg-yellow-300 border-yellow-500';
      case 'backtrack': return 'bg-red-300 border-red-500';
      case 'solution': return 'bg-green-300 border-green-500';
      case 'queen': return isDark ? 'bg-amber-300' : 'bg-amber-100';
      default: return base;
    }
  };

  /* 动态计算格子大小：随 N 增大而缩小，范围 28px~56px */
  const cellSize = Math.max(28, Math.min(56, 400 / n));

  return (
    <div className="inline-block border-2 border-amber-700 rounded overflow-hidden shadow-md">
      {cells.map((row, ri) => (
        <div key={ri} className="flex">
          {row.map((cell, ci) => {
            const isDark = (ri + ci) % 2 === 1;  /* 棋盘格交替着色 */
            return (
              <div key={ci}
                className={`flex items-center justify-center border transition-all duration-200 ${getCellColor(cell, isDark)}`}
                style={{ width: cellSize, height: cellSize }}
              >
                {/* 皇后符号：仅在有皇子的格子里显示 */}
                {(cell.state === 'queen' || cell.state === 'solution') && (
                  <span className="select-none" style={{ fontSize: `${cellSize * 0.6}px` }}>♛</span>
                )}
                {cell.state === 'trying' && (
                  <span className="select-none text-yellow-700" style={{ fontSize: `${cellSize * 0.6}px` }}>♛</span>
                )}
                {cell.state === 'backtrack' && (
                  <span className="select-none text-red-700 opacity-50" style={{ fontSize: `${cellSize * 0.6}px` }}>♛</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/**
 * NQueens 可视化主组件
 *
 * 架构特点：
 * - 不使用通用的 BacktrackingControls，而是内嵌自定义参数设置区（滑块+按钮）
 * - 使用 useCallback 优化 handleStart/handleReset 避免不必要的重渲染
 * - 使用 useRef(runRef) 防止重复执行
 * - 双重 Effect 驱动棋盘同步：算法执行时更新 → 播放步进时更新
 */
const NQueens: React.FC = () => {
  const [algorithm] = useState(() => new BacktrackingAlgorithm());
  const [playbackController] = useState(() => new PlaybackController<BacktrackingStep>(300));
  const [playbackState, setPlaybackState] = useState(playbackController.getState());
  /* 棋盘大小 N，可通过滑块调节 */
  const [boardSize, setBoardSize] = useState(4);
  const [isRunning, setIsRunning] = useState(false);
  /* 所有找到的解的集合 */
  const [solutions, setSolutions] = useState<number[][][]>([]);
  /* 当前渲染用的棋盘快照 */
  const [currentBoard, setCurrentBoard] = useState<number[][]>(
    Array(4).fill(0).map(() => Array(4).fill(0))
  );
  /* 防止重复执行的引用标记 */
  const runRef = useRef(false);

  /* Effect: 订阅播放控制器状态变更 */
  useEffect(() => {
    const unsubscribe = playbackController.subscribe((state) => setPlaybackState(state));
    return () => unsubscribe();
  }, [playbackController]);

  /*
   * Effect: 订阅算法模型状态变更 —— 用于收集解和初始棋盘更新
   * 当算法找到新解或步骤变化时，更新 solutions 数组和 currentBoard
   */
  useEffect(() => {
    const unsubscribe = algorithm.subscribe((state) => {
      if (state.solutions) setSolutions([...state.solutions]);
      if (state.steps.length > 0 && state.currentStep >= 0) {
        const step = state.steps.find(s => s.id === state.currentStep);
        if (step?.state?.board) setCurrentBoard(step.state.board);
      }
    });
    return () => unsubscribe();
  }, [algorithm]);

  /**
   * 开始求解 N 皇后问题
   * 使用 useCallback 优化：仅在依赖项变化时重建函数引用
   */
  const handleStart = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    runRef.current = true;
    playbackController.reset();
    algorithm.reset();
    setSolutions([]);
    setCurrentBoard(Array(boardSize).fill(0).map(() => Array(boardSize).fill(0)));

    /* 设延迟为 0 以最快速度完成计算，之后通过 playbackController 播放 */
    algorithm.setDelay(0);
    await algorithm.nQueens(boardSize);

    const steps = algorithm.getState().steps;
    if (steps.length > 0) {
      playbackController.setSteps(steps);
      setCurrentBoard(steps[0].state.board || Array(boardSize).fill(0).map(() => Array(boardSize).fill(0)));
    }

    setIsRunning(false);
  }, [algorithm, playbackController, boardSize, isRunning]);

  /*
   * Effect: 播放步进时同步更新棋盘
   * 当用户通过 PlaybackControls 切换步骤时，从 steps 中取出对应 board 更新显示
   */
  useEffect(() => {
    const step = playbackState.currentStepIndex >= 0 && playbackState.currentStepIndex < playbackState.steps.length
      ? playbackState.steps[playbackState.currentStepIndex]
      : null;

    if (step?.state?.board) setCurrentBoard(step.state.board);
  }, [playbackState.currentStepIndex, playbackState.steps]);

  /** 重置所有状态 */
  const handleReset = useCallback(() => {
    playbackController.reset();
    algorithm.reset();
    setSolutions([]);
    setCurrentBoard(Array(boardSize).fill(0).map(() => Array(boardSize).fill(0)));
  }, [playbackController, algorithm, boardSize]);

  /* 从 playbackState 提取当前步骤用于变量监控和高亮行号 */
  const currentStep = playbackState.currentStepIndex >= 0 && playbackState.currentStepIndex < playbackState.steps.length
    ? playbackState.steps[playbackState.currentStepIndex]
    : null;
  const highlightLine = currentStep?.highlightLine ?? -1;

  /* 变量监控字典构建 */
  const variables: Record<string, string | number> = {};
  if (currentStep) {
    if (currentStep.state.trying) { variables['当前行'] = currentStep.state.trying.row; variables['当前列'] = currentStep.state.trying.col; }
    if (currentStep.state.backtrack) { variables['回溯行'] = currentStep.state.backtrack.row; variables['回溯列'] = currentStep.state.backtrack.col; }
    variables['棋盘大小'] = boardSize;
    variables['已找到解'] = solutions.length;
    variables['步骤类型'] = currentStep.type === 'try' ? '尝试' : currentStep.type === 'backtrack' ? '回溯' : '找到解';
  } else {
    variables['棋盘大小'] = boardSize;
    variables['已找到解'] = 0;
  }

  const message = currentStep?.description || '';

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">N皇后问题可视化</h2>
      <p className="text-gray-600 mb-4 text-sm">在 N×N 棋盘上放置 N 个皇后，使其互不攻击（同行、同列、同对角线无其他皇后）</p>

      {/* 三栏布局：左侧棋盘区域占2栏，右侧信息和控制占1栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 左侧区域（2栏宽）：棋盘 + 统计卡片 + 播放控制 + 参数设置 + 解列表 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 棋盘渲染区 */}
          <div className="border rounded-lg bg-white p-6 shadow-sm flex justify-center">
            <ChessBoard board={currentBoard} n={boardSize} currentStep={currentStep} />
          </div>

          {/* 三列统计卡片 */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-indigo-50 rounded-lg p-3">
              <div className="text-xs text-indigo-600">棋盘大小</div>
              <div className="text-xl font-bold text-indigo-800">{boardSize}×{boardSize}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xs text-green-600">已找到解</div>
              <div className="text-xl font-bold text-green-800">{solutions.length}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-600">步骤进度</div>
              <div className="text-xl font-bold text-blue-800">{playbackState.currentStepIndex + 1}/{playbackState.totalSteps}</div>
            </div>
          </div>

          {/* 播放控制条（注意：空步骤时点击播放会自动触发 handleStart） */}

          {/* 参数设置区：滑块调节 N + 开始/重置按钮 */}

          {/* 已找到的解列表（最多显示12个） */}

        </div>

        {/* 右侧区域（1栏宽）：代码同步 + 变量监控 + 复杂度 + 说明 */}

      </div>
    </div>
  );
};

export default NQueens;
