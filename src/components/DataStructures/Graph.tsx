/**
 * @fileoverview 图（Graph）数据结构可视化主页面组件
 *
 * 本组件是图数据结构的顶层容器，负责：
 * 1. 管理图的顶点（Node）和边（Edge）数据结构
 * 2. 提供图的增删操作：添加/删除顶点、添加边
 * 3. 使用 SVG 绘制图的可视化展示，支持交互式节点选择
 * 4. 展示图的基本特性和时间复杂度分析
 *
 * 可视化方式：
 * - 使用 SVG <circle> 绘制顶点，<line> 绘制边
 * - 支持点击选择节点（高亮显示）
 * - 边显示为连接两个顶点的线段
 *
 * 操作类型：
 * - 添加顶点（Add Node）：在随机位置创建新顶点
 * - 添加边（Add Edge）：连接两个已存在的顶点
 * - 删除顶点（Remove Node）：移除顶点及其关联的所有边
 *
 * 数据结构：
 * - Node: { id, x, y } - 顶点ID和屏幕坐标
 * - Edge: { from, to } - 有向边的起点和终点ID
 */

import React, { useState } from 'react';
import DataStructureLayout from '../Layout/DataStructureLayout';

/**
 * 图顶点接口定义
 * @interface Node
 * @property {string} id - 顶点唯一标识符
 * @property {number} x - 顶点的X坐标（用于SVG渲染）
 * @property {number} y - 顶点的Y坐标（用于SVG渲染）
 */
interface Node {
  id: string;
  x: number;
  y: number;
}

/**
 * 图边接口定义
 * @interface Edge
 * @property {string} from - 边的起始顶点ID
 * @property {string} to - 边的终止顶点ID
 */
interface Edge {
  from: string;
  to: string;
}

/**
 * 图主页面组件
 *
 * @component
 * @description 提供图结构的完整交互界面，支持动态演示顶点和边的增删操作
 *
 * @example
 * ```tsx
 * <Graph />
 * ```
 */

const Graph: React.FC = () => {
  /**
   * 管理图的所有顶点
   * 初始状态包含3个顶点（A、B、C），形成三角形布局
   */
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'A', x: 100, y: 100 },
    { id: 'B', x: 200, y: 100 },
    { id: 'C', x: 150, y: 200 }
  ]);

  /**
   * 管理图的所有边
   * 初始状态包含3条边，形成环形结构：A→B, B→C, C→A
   */
  const [edges, setEdges] = useState<Edge[]>([
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' },
    { from: 'C', to: 'A' }
  ]);

  /** 当前选中的顶点ID（用于删除操作） */
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  /** 用户输入的新顶点ID */
  const [nodeId, setNodeId] = useState('');
  /** 用户输入的边的起始顶点ID */
  const [fromNode, setFromNode] = useState('');
  /** 用户输入的边的终止顶点ID */
  const [toNode, setToNode] = useState('');

  /**
   * 添加新顶点到图中
   *
   * 操作逻辑：
   * 1. 验证顶点ID非空且唯一
   * 2. 在随机位置（0-300像素范围内）生成新顶点坐标
   * 3. 将新顶点添加到 nodes 数组
   *
   * 时间复杂度：O(1) 添加操作，O(n) ID唯一性检查
   */
    if (!nodeId) {
      alert('请输入节点ID');
      return;
    }
    if (nodes.some(node => node.id === nodeId)) {
      alert('节点ID已存在');
      return;
    }
    const newNode: Node = {
      id: nodeId,
      x: Math.random() * 300,
      y: Math.random() * 300
    };
    setNodes([...nodes, newNode]);
    setNodeId('');
  };

  /**
   * 添加新边到图中
   *
   * 操作逻辑：
   * 1. 验证起始和终止顶点ID非空且存在
   * 2. 检查边是否已存在（防止重复边）
   * 3. 将新边添加到 edges 数组
   *
   * 时间复杂度：O(1) 添加操作，O(e) 边唯一性检查
   */
  const addEdge = () => {
    if (!fromNode || !toNode) {
      alert('请选择起始和终止节点');
      return;
    }
    if (!nodes.some(node => node.id === fromNode) || !nodes.some(node => node.id === toNode)) {
      alert('节点不存在');
      return;
    }
    if (edges.some(edge => edge.from === fromNode && edge.to === toNode)) {
      alert('边已存在');
      return;
    }
    setEdges([...edges, { from: fromNode, to: toNode }]);
    setFromNode('');
    setToNode('');
  };

  /**
   * 删除指定顶点及其所有关联边
   *
   * 操作逻辑：
   * 1. 从 nodes 数组中过滤掉目标顶点
   * 2. 从 edges 数组中过滤掉所有与该顶点相关的边（无论是起点还是终点）
   *
   * 时间复杂度：O(n + e)，n为顶点数，e为边数
   *
   * @param id - 要删除的顶点ID
   */
  const removeNode = (id: string) => {
    setNodes(nodes.filter(node => node.id !== id));
    setEdges(edges.filter(edge => edge.from !== id && edge.to !== id));
  };

  /**
   * 渲染图的可视化展示（SVG绘制）
   *
   * 渲染原理：
   * 1. 使用 <svg> 元素创建 400x400 的画布
   * 2. 先绘制边（<line>元素），再绘制顶点（<circle>+<text>），确保顶点在边的上层
   *
   * 边的渲染：
   * - 遍历 edges 数组，查找每条边的起止顶点坐标
   * - 使用 <line x1,y1,x2,y2> 绘制线段，设置灰色描边
   *
   * 顶点的渲染：
   * - 遍历 nodes 数组，使用 <g> 分组每个顶点
   * - <circle cx,cy,r=20> 绘制圆形节点
   * - 选中的节点使用浅蓝色填充，未选中为白色
   * - 点击事件更新 selectedNode 状态
   * - <text> 在圆心位置显示顶点ID
   *
   * @returns {JSX.Element} SVG 图形元素
   */
  const renderGraph = () => (
    <svg width="400" height="400" className="border rounded bg-white">
      {/* 绘制边 */}
      {edges.map((edge, index) => {
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);
        if (!fromNode || !toNode) return null;
        return (
          <line
            key={index}
            x1={fromNode.x}
            y1={fromNode.y}
            x2={toNode.x}
            y2={toNode.y}
            stroke="gray"
            strokeWidth="2"
          />
        );
      })}

      {/* 绘制节点 */}
      {nodes.map(node => (
        <g key={node.id}>
          <circle
            cx={node.x}
            cy={node.y}
            r="20"
            fill={selectedNode === node.id ? 'lightblue' : 'white'}
            stroke="blue"
            strokeWidth="2"
            onClick={() => setSelectedNode(node.id)}
            className="cursor-pointer"
          />
          <text
            x={node.x}
            y={node.y}
            textAnchor="middle"
            dy=".3em"
            className="select-none"
          >
            {node.id}
          </text>
        </g>
      ))}
    </svg>
  );

  return (
    <DataStructureLayout
      title="图"
      visualization={renderGraph()}
      operations={
        <div className="flex flex-col space-y-4 p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              placeholder="节点ID"
              className="border rounded px-2 py-1"
            />
            <button
              onClick={addNode}
              className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              添加节点
            </button>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={fromNode}
              onChange={(e) => setFromNode(e.target.value)}
              placeholder="起始节点"
              className="border rounded px-2 py-1"
            />
            <input
              type="text"
              value={toNode}
              onChange={(e) => setToNode(e.target.value)}
              placeholder="终止节点"
              className="border rounded px-2 py-1"
            />
            <button
              onClick={addEdge}
              className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              添加边
            </button>
          </div>
          {selectedNode && (
            <button
              onClick={() => {
                removeNode(selectedNode);
                setSelectedNode(null);
              }}
              className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              删除选中节点
            </button>
          )}
        </div>
      }
      features={{
        title: "图特点",
        items: [
          "由节点和边组成",
          "可以表示复杂的关系",
          "支持有向和无向",
          "适用于网络、路径等问题"
        ]
      }}
      complexity={{
        title: "性能分析",
        items: [
          { operation: "添加顶点 (Add Vertex)", timeComplexity: "O(1)", spaceComplexity: "O(1)", description: "直接添加新顶点" },
          { operation: "添加边 (Add Edge)", timeComplexity: "O(1)", spaceComplexity: "O(1)", description: "在邻接表中添加边" },
          { operation: "删除顶点 (Remove Vertex)", timeComplexity: "O(V + E)", spaceComplexity: "O(1)", description: "需要删除所有相关边" },
          { operation: "删除边 (Remove Edge)", timeComplexity: "O(1)", spaceComplexity: "O(1)", description: "从邻接表中删除边" },
          { operation: "深度优先搜索 (DFS)", timeComplexity: "O(V + E)", spaceComplexity: "O(V)", description: "访问所有顶点和边" },
          { operation: "广度优先搜索 (BFS)", timeComplexity: "O(V + E)", spaceComplexity: "O(V)", description: "访问所有顶点和边" }
        ],
        summary: {
          bestCase: "O(1)",
          averageCase: "O(V + E)",
          worstCase: "O(V + E)",
          spaceComplexity: "O(V + E)"
        }
      }}
    />
  );
};

export default Graph;
