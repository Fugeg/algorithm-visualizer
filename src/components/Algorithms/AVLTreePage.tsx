import React, { useState, useEffect, useCallback } from 'react';
import { AVLTreeStructure, AVLTreeStep, SerializedAVLNode } from '../../models/AVLTreeStructure';
import { PlaybackController } from '../../models/PlaybackController';
import PlaybackControls from '../Visualization/PlaybackControls';
import CodeSyncPanel from '../Visualization/CodeSyncPanel';
import VariableMonitorPanel from '../Visualization/VariableMonitorPanel';

const AVL_PSEUDOCODE = {
  title: 'AVL树插入 伪代码',
  lines: [
    { text: 'function insert(node, value):', indent: 0 },
    { text: 'if node is null:', indent: 1 },
    { text: 'return new Node(value)', indent: 2 },
    { text: 'if value < node.value:', indent: 1 },
    { text: 'node.left = insert(node.left, value)', indent: 2 },
    { text: 'else if value > node.value:', indent: 1 },
    { text: 'node.right = insert(node.right, value)', indent: 2 },
    { text: 'else: return node', indent: 1 },
    { text: 'updateHeight(node)', indent: 1 },
    { text: 'balance = getBalance(node)', indent: 1 },
    { text: 'if balance > 1: left rotations', indent: 1 },
    { text: 'if balance < -1: right rotations', indent: 1 },
  ]
};

interface TreeLayoutNode {
  value: number;
  x: number;
  y: number;
  balanceFactor: number;
  left: TreeLayoutNode | null;
  right: TreeLayoutNode | null;
}

const layoutTree = (
  node: SerializedAVLNode | null,
  x: number,
  y: number,
  horizontalGap: number
): TreeLayoutNode | null => {
  if (!node) return null;
  return {
    value: node.value,
    x,
    y,
    balanceFactor: node.balanceFactor,
    left: layoutTree(node.left, x - horizontalGap, y + 70, horizontalGap / 2),
    right: layoutTree(node.right, x + horizontalGap, y + 70, horizontalGap / 2),
  };
};

const getRotationColor = (message: string) => {
  if (message.includes('LL旋转')) return 'fill-purple-200 stroke-purple-500';
  if (message.includes('RR旋转')) return 'fill-blue-200 stroke-blue-500';
  if (message.includes('LR旋转')) return 'fill-orange-200 stroke-orange-500';
  if (message.includes('RL旋转')) return 'fill-pink-200 stroke-pink-500';
  return 'fill-indigo-100 stroke-indigo-400';
};

const renderSVGTree = (
  layoutNode: TreeLayoutNode | null,
  currentStep: AVLTreeStep | null
): React.ReactNode => {
  if (!layoutNode) return null;

  const nodes: React.ReactNode[] = [];
  const edges: React.ReactNode[] = [];
  let nodeId = 0;

  const traverse = (node: TreeLayoutNode) => {
    const id = nodeId++;
    if (node.left) {
      edges.push(
        <line
          key={`edge-${id}-l`}
          x1={node.x} y1={node.y}
          x2={node.left.x} y2={node.left.y}
          className="stroke-gray-300" strokeWidth={2}
        />
      );
      traverse(node.left);
    }
    if (node.right) {
      edges.push(
        <line
          key={`edge-${id}-r`}
          x1={node.x} y1={node.y}
          x2={node.right.x} y2={node.right.y}
          className="stroke-gray-300" strokeWidth={2}
        />
      );
      traverse(node.right);
    }

    const isRotating = currentStep?.message.includes('旋转') &&
      currentStep?.variables.pivot === node.value;
    const isCurrentPath = currentStep?.variables.currentNode === node.value;

    const nodeFill = isRotating
      ? getRotationColor(currentStep?.message || '')
      : isCurrentPath
        ? 'fill-yellow-200 stroke-yellow-500'
        : 'fill-indigo-100 stroke-indigo-400';

    const bfColor = Math.abs(node.balanceFactor) > 1
      ? 'fill-red-600'
      : node.balanceFactor !== 0
        ? 'fill-orange-500'
        : 'fill-green-600';

    nodes.push(
      <g key={`node-${id}`}>
        <circle
          cx={node.x} cy={node.y} r={22}
          className={`${nodeFill} transition-all duration-300`}
          strokeWidth={2}
        />
        <text
          x={node.x} y={node.y + 1}
          textAnchor="middle" dominantBaseline="middle"
          className="text-xs font-bold fill-gray-800 select-none"
          style={{ fontSize: '12px' }}
        >
          {node.value}
        </text>
        <text
          x={node.x + 28} y={node.y - 12}
          className={`text-xs font-mono font-bold select-none ${bfColor}`}
          style={{ fontSize: '10px' }}
        >
          {node.balanceFactor}
        </text>
      </g>
    );
  };

  traverse(layoutNode);

  return (
    <svg width="100%" height="100%" viewBox="0 0 700 400" className="overflow-visible">
      {edges}
      {nodes}
    </svg>
  );
};

const AVLTreePage: React.FC = () => {
  const [algorithm] = useState(() => new AVLTreeStructure());
  const [playbackController] = useState(() => new PlaybackController<AVLTreeStep>(600));
  const [playbackState, setPlaybackState] = useState(playbackController.getState());
  const [inputValue, setInputValue] = useState('');
  const [operation, setOperation] = useState<'insert' | 'delete' | 'search'>('insert');

  useEffect(() => {
    const unsubscribe = playbackController.subscribe((state) => {
      setPlaybackState(state);
    });
    return () => unsubscribe();
  }, [playbackController]);

  const handleOperation = useCallback(() => {
    const val = parseInt(inputValue);
    if (isNaN(val)) return;

    if (operation === 'insert') {
      algorithm.generateInsertSteps(val);
    } else if (operation === 'delete') {
      algorithm.generateDeleteSteps(val);
    } else {
      algorithm.generateSearchSteps(val);
    }

    const steps = algorithm.getSteps();
    if (steps.length > 0) {
      playbackController.setSteps(steps);
      playbackController.play();
    }
    setInputValue('');
  }, [algorithm, playbackController, inputValue, operation]);

  const handleReset = useCallback(() => {
    playbackController.reset();
    algorithm.reset();
  }, [playbackController, algorithm]);

  const currentStep = playbackState.currentStepIndex >= 0 && playbackState.currentStepIndex < playbackState.steps.length
    ? playbackState.steps[playbackState.currentStepIndex]
    : null;

  const treeRoot = currentStep?.tree || algorithm.getState().root;
  const highlightLine = currentStep?.highlightLine ?? -1;
  const variables = currentStep?.variables || {};
  const message = currentStep?.message || '';

  const treeDepth = algorithm.getDepth();
  const horizontalGap = Math.max(60, 300 / Math.max(treeDepth, 1));
  const layoutRoot = layoutTree(treeRoot, 350, 40, horizontalGap);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">AVL树可视化</h2>
      <p className="text-gray-600 mb-4 text-sm">自平衡二叉搜索树，通过旋转操作保持平衡因子在 [-1, 1] 范围内</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="border rounded-lg bg-white p-4 shadow-sm" style={{ minHeight: '420px' }}>
            {layoutRoot ? (
              renderSVGTree(layoutRoot, currentStep)
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-400">
                空AVL树
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-indigo-50 rounded-lg p-3">
              <div className="text-xs text-indigo-600">节点数</div>
              <div className="text-xl font-bold text-indigo-800">{algorithm.getSize()}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-600">树高度</div>
              <div className="text-xl font-bold text-blue-800">{treeDepth}</div>
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
                handleOperation();
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
            <h3 className="text-sm font-semibold text-gray-700">操作设置</h3>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {(['insert', 'delete', 'search'] as const).map((op) => (
                  <button
                    key={op}
                    onClick={() => setOperation(op)}
                    className={`px-3 py-1.5 text-sm rounded transition-colors ${
                      operation === op
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {op === 'insert' ? '插入' : op === 'delete' ? '删除' : '查找'}
                  </button>
                ))}
              </div>
              <input
                type="number" value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleOperation()}
                placeholder="输入值"
                disabled={playbackState.isPlaying}
                className="border rounded px-3 py-1.5 text-sm w-24"
              />
              <button
                onClick={handleOperation}
                disabled={playbackState.isPlaying || !inputValue}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50 text-sm"
              >
                执行
              </button>
              <button
                onClick={handleReset}
                disabled={playbackState.isPlaying}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-sm"
              >
                重置
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <CodeSyncPanel
            title={AVL_PSEUDOCODE.title}
            codeLines={AVL_PSEUDOCODE.lines}
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
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">操作</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">时间</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">空间</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">说明</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">插入</td>
                  <td className="px-4 py-2 text-sm text-gray-500 font-mono">O(log n)</td>
                  <td className="px-4 py-2 text-sm text-gray-500 font-mono">O(log n)</td>
                  <td className="px-4 py-2 text-sm text-gray-500">查找+旋转</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">删除</td>
                  <td className="px-4 py-2 text-sm text-gray-500 font-mono">O(log n)</td>
                  <td className="px-4 py-2 text-sm text-gray-500 font-mono">O(log n)</td>
                  <td className="px-4 py-2 text-sm text-gray-500">查找+旋转</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">查找</td>
                  <td className="px-4 py-2 text-sm text-gray-500 font-mono">O(log n)</td>
                  <td className="px-4 py-2 text-sm text-gray-500 font-mono">O(1)</td>
                  <td className="px-4 py-2 text-sm text-gray-500">BST查找</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
            <h4 className="text-sm font-semibold mb-2 text-yellow-700">旋转类型说明</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><span className="text-purple-500 font-medium">LL旋转</span> - 左子树左倾，右旋</li>
                <li><span className="text-blue-500 font-medium">RR旋转</span> - 右子树右倾，左旋</li>
                <li><span className="text-orange-500 font-medium">LR旋转</span> - 左子树右倾，先左旋再右旋</li>
                <li><span className="text-pink-500 font-medium">RL旋转</span> - 右子树左倾，先右旋再左旋</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h4 className="text-sm font-semibold mb-2 text-blue-700">平衡因子说明</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><span className="text-green-600 font-medium">绿色</span> - 平衡因子 = 0</li>
                <li><span className="text-orange-500 font-medium">橙色</span> - 平衡因子 = ±1</li>
                <li><span className="text-red-600 font-medium">红色</span> - 平衡因子 &gt; ±1 (需旋转)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AVLTreePage;
