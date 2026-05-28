import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BacktrackingAlgorithm, BacktrackingStep } from '../../models/BacktrackingAlgorithm';
import { PlaybackController } from '../../models/PlaybackController';
import PlaybackControls from '../Visualization/PlaybackControls';
import CodeSyncPanel from '../Visualization/CodeSyncPanel';
import VariableMonitorPanel from '../Visualization/VariableMonitorPanel';

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

interface BoardCell {
  row: number;
  col: number;
  state: 'empty' | 'queen' | 'trying' | 'backtrack' | 'solution';
}

const ChessBoard: React.FC<{
  board: number[][];
  n: number;
  currentStep: BacktrackingStep | null;
}> = ({ board, n, currentStep }) => {
  const cells: BoardCell[][] = board.map((row, ri) =>
    row.map((cell, ci) => {
      let state: BoardCell['state'] = cell === 1 ? 'queen' : 'empty';

      if (currentStep) {
        const { trying, backtrack: btInfo } = currentStep.state;
        if (trying && trying.row === ri && trying.col === ci) {
          state = 'trying';
        } else if (btInfo && btInfo.row === ri && btInfo.col === ci) {
          state = 'backtrack';
        }
        if (currentStep.type === 'solution') {
          if (cell === 1) state = 'solution';
        }
      }

      return { row: ri, col: ci, state };
    })
  );

  const getCellColor = (cell: BoardCell, isDark: boolean) => {
    const base = isDark ? 'bg-amber-200' : 'bg-amber-50';
    switch (cell.state) {
      case 'trying': return 'bg-yellow-300 border-yellow-500';
      case 'backtrack': return 'bg-red-300 border-red-500';
      case 'solution': return 'bg-green-300 border-green-500';
      case 'queen': return isDark ? 'bg-amber-300' : 'bg-amber-100';
      default: return base;
    }
  };

  const cellSize = Math.max(28, Math.min(56, 400 / n));

  return (
    <div className="inline-block border-2 border-amber-700 rounded overflow-hidden shadow-md">
      {cells.map((row, ri) => (
        <div key={ri} className="flex">
          {row.map((cell, ci) => {
            const isDark = (ri + ci) % 2 === 1;
            return (
              <div
                key={ci}
                className={`flex items-center justify-center border transition-all duration-200 ${getCellColor(cell, isDark)}`}
                style={{ width: cellSize, height: cellSize }}
              >
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

const NQueens: React.FC = () => {
  const [algorithm] = useState(() => new BacktrackingAlgorithm());
  const [playbackController] = useState(() => new PlaybackController<BacktrackingStep>(300));
  const [playbackState, setPlaybackState] = useState(playbackController.getState());
  const [boardSize, setBoardSize] = useState(4);
  const [isRunning, setIsRunning] = useState(false);
  const [solutions, setSolutions] = useState<number[][][]>([]);
  const [currentBoard, setCurrentBoard] = useState<number[][]>(
    Array(4).fill(0).map(() => Array(4).fill(0))
  );
  const runRef = useRef(false);

  useEffect(() => {
    const unsubscribe = playbackController.subscribe((state) => {
      setPlaybackState(state);
    });
    return () => unsubscribe();
  }, [playbackController]);

  useEffect(() => {
    const unsubscribe = algorithm.subscribe((state) => {
      if (state.solutions) {
        setSolutions([...state.solutions]);
      }
      if (state.steps.length > 0 && state.currentStep >= 0) {
        const step = state.steps.find(s => s.id === state.currentStep);
        if (step?.state?.board) {
          setCurrentBoard(step.state.board);
        }
      }
    });
    return () => unsubscribe();
  }, [algorithm]);

  const handleStart = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    runRef.current = true;
    playbackController.reset();
    algorithm.reset();
    setSolutions([]);
    setCurrentBoard(Array(boardSize).fill(0).map(() => Array(boardSize).fill(0)));

    algorithm.setDelay(0);
    await algorithm.nQueens(boardSize);

    const steps = algorithm.getState().steps;
    if (steps.length > 0) {
      playbackController.setSteps(steps);
      setCurrentBoard(steps[0].state.board || Array(boardSize).fill(0).map(() => Array(boardSize).fill(0)));
    }

    setIsRunning(false);
  }, [algorithm, playbackController, boardSize, isRunning]);

  useEffect(() => {
    const step = playbackState.currentStepIndex >= 0 && playbackState.currentStepIndex < playbackState.steps.length
      ? playbackState.steps[playbackState.currentStepIndex]
      : null;

    if (step?.state?.board) {
      setCurrentBoard(step.state.board);
    }
  }, [playbackState.currentStepIndex, playbackState.steps]);

  const handleReset = useCallback(() => {
    playbackController.reset();
    algorithm.reset();
    setSolutions([]);
    setCurrentBoard(Array(boardSize).fill(0).map(() => Array(boardSize).fill(0)));
  }, [playbackController, algorithm, boardSize]);

  const currentStep = playbackState.currentStepIndex >= 0 && playbackState.currentStepIndex < playbackState.steps.length
    ? playbackState.steps[playbackState.currentStepIndex]
    : null;

  const highlightLine = currentStep?.type === 'solution' ? 3
    : currentStep?.type === 'try' ? 6
    : currentStep?.type === 'backtrack' ? 8
    : -1;

  const variables: Record<string, string | number> = {};
  if (currentStep) {
    if (currentStep.state.trying) {
      variables['当前行'] = currentStep.state.trying.row;
      variables['当前列'] = currentStep.state.trying.col;
    }
    if (currentStep.state.backtrack) {
      variables['回溯行'] = currentStep.state.backtrack.row;
      variables['回溯列'] = currentStep.state.backtrack.col;
    }
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="border rounded-lg bg-white p-6 shadow-sm flex justify-center">
            <ChessBoard board={currentBoard} n={boardSize} currentStep={currentStep} />
          </div>

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
              <div className="text-xl font-bold text-blue-800">
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
            <h3 className="text-sm font-semibold text-gray-700">参数设置</h3>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 whitespace-nowrap">
                棋盘大小 N: {boardSize}
              </label>
              <input
                type="range" min="4" max="8" value={boardSize}
                onChange={(e) => {
                  const n = parseInt(e.target.value);
                  setBoardSize(n);
                  setCurrentBoard(Array(n).fill(0).map(() => Array(n).fill(0)));
                }}
                disabled={playbackState.isPlaying || isRunning}
                className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleStart}
                disabled={playbackState.isPlaying || isRunning}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50 text-sm"
              >
                {isRunning ? '计算中...' : '开始求解'}
              </button>
              <button
                onClick={handleReset}
                disabled={playbackState.isPlaying || isRunning}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-sm"
              >
                重置
              </button>
            </div>
          </div>

          {solutions.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">找到的解 ({solutions.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {solutions.slice(0, 12).map((sol, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-green-50 rounded border border-green-200 text-center"
                  >
                    <div className="text-xs text-green-600 mb-1">解 {idx + 1}</div>
                    <div className="text-xs font-mono text-green-800">
                      [{sol.map((row, ri) => row.indexOf(1)).filter(x => x >= 0).join(', ')}]
                    </div>
                  </div>
                ))}
                {solutions.length > 12 && (
                  <div className="p-2 bg-gray-50 rounded border border-gray-200 text-center text-xs text-gray-500 flex items-center justify-center">
                    还有 {solutions.length - 12} 个解...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <CodeSyncPanel
            title={NQUEENS_PSEUDOCODE.title}
            codeLines={NQUEENS_PSEUDOCODE.lines}
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
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">指标</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">复杂度</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">说明</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">时间</td>
                  <td className="px-4 py-2 text-sm text-gray-500 font-mono">O(N!)</td>
                  <td className="px-4 py-2 text-sm text-gray-500">最坏情况全排列</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">空间</td>
                  <td className="px-4 py-2 text-sm text-gray-500 font-mono">O(N)</td>
                  <td className="px-4 py-2 text-sm text-gray-500">递归深度</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
            <h4 className="text-sm font-semibold mb-2 text-yellow-700">算法说明</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p>N皇后问题是经典的回溯算法，逐行放置皇后并检查冲突。</p>
              <div className="mt-2">
                <h5 className="font-semibold">颜色说明：</h5>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><span className="text-yellow-500 font-medium">黄色</span> - 正在尝试放置</li>
                  <li><span className="text-red-500 font-medium">红色</span> - 回溯（撤销放置）</li>
                  <li><span className="text-green-500 font-medium">绿色</span> - 找到完整解</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h4 className="text-sm font-semibold mb-2 text-blue-700">解的数量参考</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <div className="grid grid-cols-2 gap-2 font-mono">
                <span>N=4: 2个解</span>
                <span>N=5: 10个解</span>
                <span>N=6: 4个解</span>
                <span>N=7: 40个解</span>
                <span>N=8: 92个解</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NQueens;
