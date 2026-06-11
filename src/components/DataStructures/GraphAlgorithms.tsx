/**
 * @fileoverview 图算法（Graph Algorithms）可视化主页面组件
 *
 * 本组件是图算法可视化的顶层容器，负责：
 * 1. 支持三种经典图算法的演示：Dijkstra最短路径、BFS广度优先搜索、DFS深度优先搜索
 * 2. 管理算法执行过程的状态机（通过 PlaybackController 实现步骤控制）
 * 3. 提供丰富的可视化展示：图结构、距离表、遍历信息、伪代码同步高亮、变量监控
 * 4. 实现算法步骤的播放控制：开始、暂停、单步前进/后退、跳转、速度调节
 *
 * 可视化方式：
 * - 使用 SVG 绘制带权重的有向图（节点+边+权重标签）
 * - 节点颜色编码：白色(未访问)、黄色(当前)、绿色(已访问)
 * - 边的颜色和粗细表示是否被访问
 * - Dijkstra模式下显示每个节点的距离值（d=...）
 *
 * 操作类型：
 * - Dijkstra: 单源最短路径算法，使用优先队列优化
 * - BFS: 广度优先遍历，使用队列辅助，按层次访问
 * - DFS: 深度优先遍历，使用栈辅助，沿深度方向探索
 *
 * 架构特点：
 * - 使用观察者模式订阅 PlaybackController 的状态变化
 * - 每个算法生成独立的步骤数组（Steps），供回放控制器使用
 * - 支持伪代码行级高亮同步，帮助理解算法执行流程
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DijkstraAlgorithm, DijkstraStep, DijkstraNode, DijkstraEdge } from '../../models/DijkstraAlgorithm';
import { PlaybackController } from '../../models/PlaybackController';
import PlaybackControls from '../Visualization/PlaybackControls';
import CodeSyncPanel from '../Visualization/CodeSyncPanel';
import VariableMonitorPanel from '../Visualization/VariableMonitorPanel';
import DataStructureLayout from '../Layout/DataStructureLayout';

/**
 * 算法模式枚举类型
 * @type {'dijkstra' | 'bfs' | 'dfs'}
 */
type AlgorithmMode = 'dijkstra' | 'bfs' | 'dfs';

/**
 * 遍历步骤接口定义（用于BFS和DFS）
 * @interface TraversalStep
 * @property {number} id - 步骤唯一标识
 * @property {string} type - 步骤类型：visit(访问)/enqueue(入队)/dequeue(出队)/push(压栈)/pop(弹栈)/complete(完成)
 * @property {string} currentNode - 当前正在处理的节点ID
 * @property {string[]} visited - 已访问节点列表
 * @property {string[]} [queue] - 当前队列状态（BFS专用）
 * @property {string[]} [stack] - 当前栈状态（DFS专用）
 * @property {string} message - 步骤描述信息
 * @property {number} highlightLine - 需要高亮的伪代码行号（-1表示不高亮）
 * @property {Record<string, string | number>} variables - 当前变量状态快照
 */
interface TraversalStep {
  id: number;
  type: 'visit' | 'enqueue' | 'dequeue' | 'push' | 'pop' | 'complete';
  currentNode: string;
  visited: string[];
  queue?: string[];
  stack?: string[];
  message: string;
  highlightLine: number;
  variables: Record<string, string | number>;
}

/**
 * Dijkstra算法伪代码配置
 * 用于 CodeSyncPanel 组件的代码高亮同步展示
 */
const DIJKSTRA_PSEUDOCODE = {
  lines: [
    { text: 'function dijkstra(G, start):', indent: 0 },
    { text: 'dist[v] = ∞ for all v; dist[start] = 0', indent: 1 },
    { text: 'visited = {}', indent: 1 },
    { text: 'while unvisited nodes exist:', indent: 1 },
    { text: 'u = unvisited node with min dist[u]', indent: 2 },
    { text: 'mark u as visited', indent: 2 },
    { text: 'for each neighbor v of u:', indent: 2 },
    { text: 'alt = dist[u] + weight(u,v)', indent: 3 },
    { text: 'if alt < dist[v]: dist[v] = alt', indent: 3 },
    { text: 'return dist[]', indent: 1 },
  ]
};

const BFS_PSEUDOCODE = {
  title: 'BFS 伪代码',
  lines: [
    { text: 'function BFS(G, start):', indent: 0 },
    { text: 'queue = [start]; visited = {start}', indent: 1 },
    { text: 'while queue not empty:', indent: 1 },
    { text: 'node = queue.dequeue()', indent: 2 },
    { text: 'for each neighbor of node:', indent: 2 },
    { text: 'if not visited: mark visited; enqueue', indent: 3 },
  ]
};

const DFS_PSEUDOCODE = {
  title: 'DFS 伪代码',
  lines: [
    { text: 'function DFS(G, start):', indent: 0 },
    { text: 'push start; visited = {}', indent: 1 },
    { text: 'while stack not empty:', indent: 1 },
    { text: 'node = stack.pop()', indent: 2 },
    { text: 'if not visited: mark visited', indent: 2 },
    { text: 'for each neighbor of node:', indent: 2 },
    { text: 'if not visited: push neighbor', indent: 3 },
  ]
};

const DEFAULT_NODES: DijkstraNode[] = [
  { id: 'A', label: 'A', x: 300, y: 50 },
  { id: 'B', label: 'B', x: 150, y: 180 },
  { id: 'C', label: 'C', x: 450, y: 180 },
  { id: 'D', label: 'D', x: 80, y: 350 },
  { id: 'E', label: 'E', x: 300, y: 350 },
  { id: 'F', label: 'F', x: 520, y: 350 }
];

const DEFAULT_EDGES: DijkstraEdge[] = [
  { source: 'A', target: 'B', weight: 4 },
  { source: 'A', target: 'C', weight: 2 },
  { source: 'B', target: 'C', weight: 1 },
  { source: 'B', target: 'D', weight: 5 },
  { source: 'C', target: 'E', weight: 3 },
  { source: 'C', target: 'D', weight: 8 },
  { source: 'D', target: 'E', weight: 2 },
  { source: 'D', target: 'F', weight: 6 },
  { source: 'E', target: 'F', weight: 1 }
];

const GraphAlgorithms: React.FC = () => {
  /** 当前选择的算法模式：dijkstra/bfs/dfs */
  const [algorithmMode, setAlgorithmMode] = useState<AlgorithmMode>('dijkstra');

  /** Dijkstra算法模型实例（单例，组件生命周期内保持不变） */
  const [dijkstraAlgorithm] = useState(() => new DijkstraAlgorithm());

  /**
   * 播放控制器实例
   * 负责管理算法步骤的播放、暂停、前进、后退等控制
   * 泛型参数为联合类型：DijkstraStep | TraversalStep
   */
  const [playbackController] = useState(() => new PlaybackController<DijkstraStep | TraversalStep>(500));

  /** 播放控制器的当前状态（当前步骤索引、总步骤数、是否正在播放等） */
  const [playbackState, setPlaybackState] = useState(playbackController.getState());

  /** 算法的起始节点（默认为'A'） */
  const [startNode, setStartNode] = useState<string>('A');

  /** 标记算法是否正在执行（用于禁用UI控件） */
  const [isRunning, setIsRunning] = useState(false);

  /**
   * 以下状态用于可视化展示：
   * - visitedNodes: 已访问节点列表（用于节点着色）
   * - currentNode: 当前正在处理的节点（黄色高亮）
   * - distances: Dijkstra算法的距离表（节点ID → 距离值）
   * - path: Dijkstra算法的前驱表（节点ID → 前驱节点ID）
   */
  const [highlightLine, setHighlightLine] = useState(-1);
  const [variables, setVariables] = useState<Record<string, string | number>>({});
  const [message, setMessage] = useState('');
  const [traversalOrder, setTraversalOrder] = useState<string[]>([]);
  const [queueState, setQueueState] = useState<string[]>([]);
  const [stackState, setStackState] = useState<string[]>([]);
  const [visitedNodes, setVisitedNodes] = useState<string[]>([]);
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [distances, setDistances] = useState<Record<string, number>>({});
  const [path, setPath] = useState<Record<string, string>>({});

  const nodesRef = useRef(DEFAULT_NODES);
  const edgesRef = useRef(DEFAULT_EDGES);

  useEffect(() => {
    const unsubscribe = playbackController.subscribe((state) => {
      setPlaybackState(state);
      const step = state.steps[state.currentStepIndex];
      if (step) {
        applyStep(step);
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackController]);

  const applyStep = (step: DijkstraStep | TraversalStep) => {
    if (algorithmMode === 'dijkstra' && 'distances' in step) {
      const ds = step as DijkstraStep;
      setVisitedNodes(ds.visited);
      setCurrentNode(ds.currentNode);
      setDistances(ds.distances);
      setPath(ds.path);
      setHighlightLine(ds.highlightLine);
      setVariables(ds.variables || {});
      setMessage(ds.message);
      setTraversalOrder(ds.visited);
    } else if (algorithmMode !== 'dijkstra' && 'visited' in step) {
      const ts = step as TraversalStep;
      setVisitedNodes(ts.visited);
      setCurrentNode(ts.currentNode);
      setHighlightLine(ts.highlightLine);
      setVariables(ts.variables || {});
      setMessage(ts.message);
      setTraversalOrder(ts.visited);
      if (ts.queue) setQueueState(ts.queue);
      if (ts.stack) setStackState(ts.stack);
    }
  };

  const generateDijkstraSteps = useCallback(async () => {
    playbackController.reset();
    setIsRunning(true);
    dijkstraAlgorithm.setGraph(nodesRef.current, edgesRef.current);

    const stateUnsubscribe = dijkstraAlgorithm.subscribe((state) => {
      if (state.steps.length > 0) {
        playbackController.setSteps([...state.steps]);
      }
    });

    await dijkstraAlgorithm.dijkstra(startNode);
    stateUnsubscribe();
    setIsRunning(false);
  }, [dijkstraAlgorithm, playbackController, startNode]);

  const generateBFSteps = useCallback(() => {
    playbackController.reset();
    const steps: TraversalStep[] = [];
    const adjacencyList = new Map<string, string[]>();

    nodesRef.current.forEach(n => adjacencyList.set(n.id, []));
    edgesRef.current.forEach(e => {
      adjacencyList.get(e.source)?.push(e.target);
      adjacencyList.get(e.target)?.push(e.source);
    });

    const visited = new Set<string>();
    const queue: string[] = [startNode];
    visited.add(startNode);
    let stepId = 0;

    steps.push({
      id: stepId++,
      type: 'enqueue',
      currentNode: startNode,
      visited: Array.from(visited),
      queue: [...queue],
      message: `将起始节点 ${startNode} 入队，标记为已访问`,
      highlightLine: 1,
      variables: { queue: `[${queue.join(', ')}]`, visited: `{${Array.from(visited).join(', ')}}` }
    });

    while (queue.length > 0) {
      const node = queue.shift()!;

      steps.push({
        id: stepId++,
        type: 'dequeue',
        currentNode: node,
        visited: Array.from(visited),
        queue: [...queue],
        message: `出队节点 ${node}`,
        highlightLine: 3,
        variables: { currentNode: node, queue: `[${queue.join(', ')}]`, visited: `{${Array.from(visited).join(', ')}}` }
      });

      const neighbors = adjacencyList.get(node) || [];
      for (const neighbor of neighbors) {
        steps.push({
          id: stepId++,
          type: 'visit',
          currentNode: neighbor,
          visited: Array.from(visited),
          queue: [...queue],
          message: `检查节点 ${node} 的邻居 ${neighbor}`,
          highlightLine: 4,
          variables: { currentNode: node, neighbor, isVisited: visited.has(neighbor) ? '是' : '否', queue: `[${queue.join(', ')}]` }
        });

        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);

          steps.push({
            id: stepId++,
            type: 'enqueue',
            currentNode: neighbor,
            visited: Array.from(visited),
            queue: [...queue],
            message: `节点 ${neighbor} 未访问，标记并加入队列`,
            highlightLine: 5,
            variables: { neighbor, queue: `[${queue.join(', ')}]`, visited: `{${Array.from(visited).join(', ')}}` }
          });
        }
      }
    }

    steps.push({
      id: stepId++,
      type: 'complete',
      currentNode: '',
      visited: Array.from(visited),
      queue: [],
      message: `BFS 遍历完成！访问顺序: ${Array.from(visited).join(' → ')}`,
      highlightLine: -1,
      variables: { traversalOrder: Array.from(visited).join(' → ') }
    });

    playbackController.setSteps(steps);
  }, [playbackController, startNode]);

  const generateDFSSteps = useCallback(() => {
    playbackController.reset();
    const steps: TraversalStep[] = [];
    const adjacencyList = new Map<string, string[]>();

    nodesRef.current.forEach(n => adjacencyList.set(n.id, []));
    edgesRef.current.forEach(e => {
      adjacencyList.get(e.source)?.push(e.target);
      adjacencyList.get(e.target)?.push(e.source);
    });

    const visited = new Set<string>();
    const stack: string[] = [startNode];
    let stepId = 0;

    steps.push({
      id: stepId++,
      type: 'push',
      currentNode: startNode,
      visited: Array.from(visited),
      stack: [...stack],
      message: `将起始节点 ${startNode} 压入栈`,
      highlightLine: 1,
      variables: { stack: `[${stack.join(', ')}]`, visited: `{${Array.from(visited).join(', ')}}` }
    });

    while (stack.length > 0) {
      const node = stack.pop()!;

      steps.push({
        id: stepId++,
        type: 'pop',
        currentNode: node,
        visited: Array.from(visited),
        stack: [...stack],
        message: `弹出节点 ${node}`,
        highlightLine: 3,
        variables: { currentNode: node, stack: `[${stack.join(', ')}]`, visited: `{${Array.from(visited).join(', ')}}` }
      });

      if (!visited.has(node)) {
        visited.add(node);

        steps.push({
          id: stepId++,
          type: 'visit',
          currentNode: node,
          visited: Array.from(visited),
          stack: [...stack],
          message: `节点 ${node} 未访问，标记为已访问`,
          highlightLine: 4,
          variables: { currentNode: node, stack: `[${stack.join(', ')}]`, visited: `{${Array.from(visited).join(', ')}}` }
        });

        const neighbors = (adjacencyList.get(node) || []).slice().reverse();
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            stack.push(neighbor);

            steps.push({
              id: stepId++,
              type: 'push',
              currentNode: neighbor,
              visited: Array.from(visited),
              stack: [...stack],
              message: `将邻居节点 ${neighbor} 压入栈`,
              highlightLine: 6,
              variables: { neighbor, stack: `[${stack.join(', ')}]`, visited: `{${Array.from(visited).join(', ')}}` }
            });
          }
        }
      }
    }

    steps.push({
      id: stepId++,
      type: 'complete',
      currentNode: '',
      visited: Array.from(visited),
      stack: [],
      message: `DFS 遍历完成！访问顺序: ${Array.from(visited).join(' → ')}`,
      highlightLine: -1,
      variables: { traversalOrder: Array.from(visited).join(' → ') }
    });

    playbackController.setSteps(steps);
  }, [playbackController, startNode]);

  const handleStart = useCallback(() => {
    if (algorithmMode === 'dijkstra') {
      generateDijkstraSteps();
    } else if (algorithmMode === 'bfs') {
      generateBFSteps();
    } else {
      generateDFSSteps();
    }
  }, [algorithmMode, generateDijkstraSteps, generateBFSteps, generateDFSSteps]);

  const handleReset = useCallback(() => {
    playbackController.reset();
    dijkstraAlgorithm.reset();
    setVisitedNodes([]);
    setCurrentNode(null);
    setDistances({});
    setPath({});
    setHighlightLine(-1);
    setVariables({});
    setMessage('');
    setTraversalOrder([]);
    setQueueState([]);
    setStackState([]);
    setIsRunning(false);
  }, [playbackController, dijkstraAlgorithm]);

  const handleModeChange = useCallback((mode: AlgorithmMode) => {
    handleReset();
    setAlgorithmMode(mode);
  }, [handleReset]);

  const getNodeColor = (nodeId: string): string => {
    if (currentNode === nodeId) return '#FBBF24';
    if (visitedNodes.includes(nodeId)) return '#34D399';
    return '#FFFFFF';
  };

  const getNodeStroke = (nodeId: string): string => {
    if (currentNode === nodeId) return '#D97706';
    if (visitedNodes.includes(nodeId)) return '#059669';
    return '#6366F1';
  };

  const getPseudocode = () => {
    switch (algorithmMode) {
      case 'dijkstra': return DIJKSTRA_PSEUDOCODE;
      case 'bfs': return BFS_PSEUDOCODE;
      case 'dfs': return DFS_PSEUDOCODE;
    }
  };

  const renderGraph = () => {
    const svgWidth = 600;
    const svgHeight = 420;
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const drawnEdges = new Set<string>();

    return (
      <svg width={svgWidth} height={svgHeight} className="w-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        {edges.map((edge, index) => {
          const source = nodes.find(n => n.id === edge.source);
          const target = nodes.find(n => n.id === edge.target);
          if (!source || !target) return null;

          const edgeKey1 = `${edge.source}-${edge.target}`;
          const edgeKey2 = `${edge.target}-${edge.source}`;
          if (drawnEdges.has(edgeKey2)) return null;
          drawnEdges.add(edgeKey1);

          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          const isHighlighted = (visitedNodes.includes(edge.source) && visitedNodes.includes(edge.target));

          return (
            <g key={index}>
              <line
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={isHighlighted ? '#6366F1' : '#CBD5E1'}
                strokeWidth={isHighlighted ? 3 : 2}
              />
              <rect
                x={midX - 14}
                y={midY - 10}
                width={28}
                height={20}
                rx={4}
                fill={isHighlighted ? '#EEF2FF' : '#F8FAFC'}
                stroke={isHighlighted ? '#6366F1' : '#E2E8F0'}
                strokeWidth={1}
              />
              <text
                x={midX}
                y={midY + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-semibold"
                fill={isHighlighted ? '#4338CA' : '#64748B'}
              >
                {edge.weight}
              </text>
            </g>
          );
        })}

        {nodes.map(node => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={24}
              fill={getNodeColor(node.id)}
              stroke={getNodeStroke(node.id)}
              strokeWidth={3}
              className="transition-all duration-300"
            />
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-sm font-bold select-none"
              fill={currentNode === node.id ? '#78350F' : visitedNodes.includes(node.id) ? '#065F46' : '#312E81'}
            >
              {node.label}
            </text>
            {algorithmMode === 'dijkstra' && distances[node.id] !== undefined && (
              <text
                x={node.x}
                y={node.y + 36}
                textAnchor="middle"
                className="text-xs font-mono select-none"
                fill={distances[node.id] === Infinity ? '#9CA3AF' : '#4338CA'}
              >
                d={distances[node.id] === Infinity ? '∞' : distances[node.id]}
              </text>
            )}
          </g>
        ))}
      </svg>
    );
  };

  const renderDistanceTable = () => {
    if (algorithmMode !== 'dijkstra') return null;
    const nodes = nodesRef.current;

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b">
          <h3 className="text-sm font-semibold text-gray-700">距离表</h3>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">节点</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">距离</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">前驱</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {nodes.map(node => {
              const dist = distances[node.id];
              const prev = path[node.id];
              const isVisited = visitedNodes.includes(node.id);
              const isCurrent = currentNode === node.id;

              return (
                <tr key={node.id} className={`${isCurrent ? 'bg-yellow-50' : isVisited ? 'bg-green-50' : ''}`}>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{node.id}</td>
                  <td className="px-4 py-2 text-sm font-mono text-gray-600">
                    {dist === undefined ? '—' : dist === Infinity ? '∞' : dist}
                  </td>
                  <td className="px-4 py-2 text-sm font-mono text-gray-600">{prev || '—'}</td>
                  <td className="px-4 py-2">
                    {isCurrent ? (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">当前</span>
                    ) : isVisited ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">已访问</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">未访问</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTraversalInfo = () => {
    if (algorithmMode === 'dijkstra') return null;

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b">
          <h3 className="text-sm font-semibold text-gray-700">
            {algorithmMode === 'bfs' ? 'BFS 遍历信息' : 'DFS 遍历信息'}
          </h3>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <span className="text-xs text-gray-500">遍历顺序:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {traversalOrder.map((nodeId, index) => (
                <React.Fragment key={index}>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded font-mono">
                    {nodeId}
                  </span>
                  {index < traversalOrder.length - 1 && (
                    <span className="text-gray-400 text-xs flex items-center">→</span>
                  )}
                </React.Fragment>
              ))}
              {traversalOrder.length === 0 && (
                <span className="text-xs text-gray-400">尚未开始</span>
              )}
            </div>
          </div>

          {algorithmMode === 'bfs' && (
            <div>
              <span className="text-xs text-gray-500">当前队列:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {queueState.map((nodeId, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-mono">
                    {nodeId}
                  </span>
                ))}
                {queueState.length === 0 && (
                  <span className="text-xs text-gray-400">空</span>
                )}
              </div>
            </div>
          )}

          {algorithmMode === 'dfs' && (
            <div>
              <span className="text-xs text-gray-500">当前栈:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {stackState.map((nodeId, index) => (
                  <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded font-mono">
                    {nodeId}
                  </span>
                ))}
                {stackState.length === 0 && (
                  <span className="text-xs text-gray-400">空</span>
                )}
              </div>
            </div>
          )}

          <div>
            <span className="text-xs text-gray-500">已访问节点:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {visitedNodes.map((nodeId, index) => (
                <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-mono">
                  {nodeId}
                </span>
              ))}
              {visitedNodes.length === 0 && (
                <span className="text-xs text-gray-400">无</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderShortestPaths = () => {
    if (algorithmMode !== 'dijkstra' || Object.keys(path).length === 0) return null;

    const nodes = nodesRef.current;
    const reconstructPath = (targetId: string): string[] => {
      const result: string[] = [];
      let current: string | null = targetId;
      while (current !== null) {
        result.unshift(current);
        current = path[current] ?? null;
      }
      return result;
    };

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b">
          <h3 className="text-sm font-semibold text-gray-700">最短路径</h3>
        </div>
        <div className="p-4 space-y-2">
          {nodes.filter(n => n.id !== startNode).map(node => {
            const p = reconstructPath(node.id);
            const dist = distances[node.id];
            return (
              <div key={node.id} className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-700 w-6">{node.id}</span>
                <span className="text-gray-400">:</span>
                <span className="font-mono text-indigo-600">
                  {p.length > 1 ? p.join(' → ') : '不可达'}
                </span>
                {dist !== Infinity && dist !== undefined && (
                  <span className="text-xs text-gray-500">(距离: {dist})</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const pseudocode = getPseudocode();

  const visualization = (
    <div>
      <div className="p-4">
        {renderGraph()}
        {message && (
          <div className="mt-3 p-3 bg-indigo-50 text-indigo-700 rounded-lg text-sm border border-indigo-100">
            {message}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 pb-4">
        <div className="space-y-4">
          {renderDistanceTable()}
          {renderTraversalInfo()}
          {renderShortestPaths()}
        </div>
        <div className="space-y-4">
          <CodeSyncPanel
            title={pseudocode.title}
            codeLines={pseudocode.lines}
            highlightLine={highlightLine}
          />
          <VariableMonitorPanel variables={variables} />
        </div>
      </div>
    </div>
  );

  const operations = (
    <div className="space-y-4 p-4">
      <div className="flex gap-2">
        {(['dijkstra', 'bfs', 'dfs'] as AlgorithmMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => handleModeChange(mode)}
            disabled={isRunning}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              algorithmMode === mode
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {mode === 'dijkstra' ? 'Dijkstra' : mode === 'bfs' ? 'BFS' : 'DFS'}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">起始节点:</label>
        <select
          value={startNode}
          onChange={(e) => { setStartNode(e.target.value); handleReset(); }}
          disabled={isRunning || playbackState.isPlaying}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {nodesRef.current.map(node => (
            <option key={node.id} value={node.id}>{node.label}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleStart}
          disabled={isRunning || playbackState.isPlaying}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors ${
            isRunning || playbackState.isPlaying
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          }`}
        >
          开始
        </button>
        <button
          onClick={handleReset}
          className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          重置
        </button>
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

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-blue-600">已访问</div>
          <div className="text-xl font-bold text-blue-800">{visitedNodes.length}</div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-3">
          <div className="text-xs text-indigo-600">总节点</div>
          <div className="text-xl font-bold text-indigo-800">{nodesRef.current.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-xs text-green-600">步骤进度</div>
          <div className="text-xl font-bold text-green-800">
            {playbackState.currentStepIndex + 1}/{playbackState.totalSteps}
          </div>
        </div>
      </div>
    </div>
  );

  const features = {
    title: '图算法特点',
    items: [
      'Dijkstra 算法用于求解单源最短路径问题',
      'BFS 按层次遍历，适用于无权图最短路径',
      'DFS 沿深度方向遍历，适用于连通性检测和拓扑排序',
      'Dijkstra 要求边权重非负',
      'BFS 使用队列（FIFO），DFS 使用栈（LIFO）',
      '三种算法的时间复杂度均为 O(V + E) 或更高'
    ]
  };

  const complexity = {
    title: '复杂度分析',
    items: [
      { operation: 'Dijkstra（邻接表+优先队列）', timeComplexity: 'O((V+E) log V)', spaceComplexity: 'O(V)', description: '使用优先队列优化的 Dijkstra 算法' },
      { operation: 'Dijkstra（邻接矩阵）', timeComplexity: 'O(V²)', spaceComplexity: 'O(V)', description: '朴素实现的 Dijkstra 算法' },
      { operation: 'BFS', timeComplexity: 'O(V + E)', spaceComplexity: 'O(V)', description: '广度优先搜索，每个顶点和边最多访问一次' },
      { operation: 'DFS', timeComplexity: 'O(V + E)', spaceComplexity: 'O(V)', description: '深度优先搜索，每个顶点和边最多访问一次' }
    ],
    summary: {
      bestCase: 'O(V + E)',
      averageCase: 'O(V + E)',
      worstCase: 'O(V²)',
      spaceComplexity: 'O(V)'
    }
  };

  return (
    <DataStructureLayout
      title="图算法可视化"
      visualization={visualization}
      operations={operations}
      features={features}
      complexity={complexity}
    />
  );
};

export default GraphAlgorithms;
