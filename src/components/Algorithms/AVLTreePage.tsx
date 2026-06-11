/**
 * AVL树（自平衡二叉搜索树）可视化组件
 *
 * 【可视化策略】
 * 本组件是本系统中数据结构可视化的代表，采用纯 SVG 渲染二叉树结构。
 * AVL树的核心特性是自平衡——每次插入/删除后通过旋转操作保持平衡因子在 [-1, 1]：
 * - 使用 SVG 渲染树形结构：圆形节点 + 连线边
 * - 每个节点显示值和平衡因子（bf），平衡因子用颜色编码
 * - 四种旋转操作各有独特颜色标识：LL(紫)、RR(蓝)、LR(橙)、RL(粉)
 *
 * 【数据流向】Model → Step → UI
 * 1. 用户选择操作类型（insert/delete/search）并输入值 → algorithm.generateXxxSteps(val)
 * 2. Model 执行操作，每步生成 AVLTreeStep（包含完整 tree 快照）
 * 3. steps 注入 PlaybackController 并自动开始播放
 * 4. renderSVGTree() 将序列化的树数据转换为 SVG 元素
 *
 * 【核心渲染函数】
 * - layoutTree(): 递归将 SerializedAVLNode 转换为带坐标的 TreeLayoutNode（计算 x, y 位置）
 *   - 根节点居中 (x=350)，左右子树按 horizontalGap 偏移，每层 y 增加 70px
 *   - horizontalGap = max(60, 300/depth)，确保深层树也不会太挤
 * - getRotationColor(): 根据 message 文本判断旋转类型，返回对应颜色类名
 * - renderSVGTree(): 先序遍历生成 <line>（边）和 <g>（节点组）SVG 元素
 *
 * 【特殊交互设计】
 * - 三种操作模式切换按钮（插入/删除/查找）
 * - 支持回车键快捷执行
 * - 平衡因子颜色编码：绿色(|bf|=0)、橙色(|bf|=1)、红色(|bf|>1需旋转)
 * - 旋转类型颜色编码帮助理解四种旋转场景
 */
import React, { useState, useEffect, useCallback } from 'react';
import { AVLTreeStructure, AVLTreeStep, SerializedAVLNode } from '../../models/AVLTreeStructure';
import { PlaybackController } from '../../models/PlaybackController';
import PlaybackControls from '../Visualization/PlaybackControls';
import CodeSyncPanel from '../Visualization/CodeSyncPanel';
import VariableMonitorPanel from '../Visualization/VariableMonitorPanel';

/** AVL树插入伪代码定义 */
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

/**
 * 树布局节点接口（带屏幕坐标）
 * @property value - 节点存储的值
 * @property x / y - SVG 渲染坐标
 * @property balanceFactor - 平衡因子
 * @property left / right - 子节点引用
 */
interface TreeLayoutNode {
  value: number;
  x: number;
  y: number;
  balanceFactor: number;
  left: TreeLayoutNode | null;
  right: TreeLayoutNode | null;
}

/**
 * 递归计算树的布局坐标
 *
 * 采用「根居中、子树对称展开」的布局策略：
 * - 根节点固定在 (x, y)
 * - 左子树整体左偏 horizontalGap，右子树整体右偏 horizontalGap
 * - 每深入一层，horizontalGap 减半（越深的子节点越密集）
 * - y 坐标每层增加 70px
 */
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

/**
 * 根据旋转消息返回对应的 Tailwind 颜色类名
 * 用于高亮正在参与旋转操作的节点
 */
const getRotationColor = (message: string) => {
  if (message.includes('LL旋转')) return 'fill-purple-200 stroke-purple-500';
  if (message.includes('RR旋转')) return 'fill-blue-200 stroke-blue-500';
  if (message.includes('LR旋转')) return 'fill-orange-200 stroke-orange-500';
  if (message.includes('RL旋转')) return 'fill-pink-200 stroke-pink-500';
  return 'fill-indigo-100 stroke-indigo-400';  /* 默认颜色 */
};

/**
 * 将带坐标的树数据渲染为 SVG 元素
 *
 * 渲染顺序：先遍历生成所有边（<line>），再遍历生成所有节点（<g>）
 * 每个节点包含：<circle>（圆圈背景）、<text>（值）、<text>（平衡因子）
 *
 * 节点颜色逻辑：
 * 1. 如果当前步骤涉及旋转且该节点是 pivot → 使用旋转专用色
 * 2. 如果该节点在当前搜索路径上 → 黄色高亮
 * 3. 否则使用默认靛蓝色
 *
 * 平衡因子颜色逻辑：
 * - |bf| > 1 → 红色（需要旋转）
 * - |bf| ≠ 0 → 橙色（轻微不平衡但可接受）
 * - |bf| = 0 → 绿色（完全平衡）
 */
const renderSVGTree = (
  layoutNode: TreeLayoutNode | null,
  currentStep: AVLTreeStep | null
): React.ReactNode => {
  if (!layoutNode) return null;

  const nodes: React.ReactNode[] = [];
  const edges: React.ReactNode[] = [];
  let nodeId = 0;

  /* 先序遍历：先生成边，再生成节点 */
  const traverse = (node: TreeLayoutNode) => {
    const id = nodeId++;
    /* 生成到左子节点的边 */
    if (node.left) {
      edges.push(<line key={`edge-${id}-l`} x1={node.x} y1={node.y} x2={node.left.x} y2={node.left.y}
        className="stroke-gray-300" strokeWidth={2} />);
      traverse(node.left);
    }
    /* 生成到右子节点的边 */
    if (node.right) {
      edges.push(<line key={`edge-${id}-r`} x1={node.x} y1={node.y} x2={node.right.x} y2={node.right.y}
        className="stroke-gray-300" strokeWidth={2} />);
      traverse(node.right);
    }

    /* 判断节点是否是旋转操作的 pivot */
    const isRotating = currentStep?.message.includes('旋转') &&
      currentStep?.variables.pivot === node.value;
    /* 判断节点是否在当前操作路径上 */
    const isCurrentPath = currentStep?.variables.currentNode === node.value;

    /* 确定节点填充色 */
    const nodeFill = isRotating
      ? getRotationColor(currentStep?.message || '')
      : isCurrentPath
        ? 'fill-yellow-200 stroke-yellow-500'
        : 'fill-indigo-100 stroke-indigo-400';

    /* 确定平衡因子文字颜色 */
    const bfColor = Math.abs(node.balanceFactor) > 1
      ? 'fill-red-600'
      : node.balanceFactor !== 0
        ? 'fill-orange-500'
        : 'fill-green-600';

    /* 生成节点组：圆圈 + 值文本 + 平衡因子文本 */
    nodes.push(
      <g key={`node-${id}`}>
        <circle cx={node.x} cy={node.y} r={22}
          className={`${nodeFill} transition-all duration-300`} strokeWidth={2} />
        {/* 节点值 */}
        <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle"
          className="text-xs font-bold fill-gray-800 select-none" style={{ fontSize: '12px' }}>
          {node.value}
        </text>
        {/* 平衡因子（显示在节点右上角） */}
        <text x={node.x + 28} y={node.y - 12}
          className={`text-xs font-mono font-bold select-none ${bfColor}`} style={{ fontSize: '10px' }}>
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

/**
 * AVLTreePage 可视化主组件
 *
 * 架构特点：
 * - 支持三种操作：insert（插入）、delete（删除）、search（查找）
 * - 操作通过按钮组切换，输入框输入目标值
 * - 回车键或点击「执行」按钮触发操作
 * - 自动播放模式：执行后立即开始播放步骤动画
 */
const AVLTreePage: React.FC = () => {
  const [algorithm] = useState(() => new AVLTreeStructure());
  const [playbackController] = useState(() => new PlaybackController<AVLTreeStep>(600));
  const [playbackState, setPlaybackState] = useState(playbackController.getState());
  /* 用户输入的目标值 */
  const [inputValue, setInputValue] = useState('');
  /* 当前选择的操作类型 */
  const [operation, setOperation] = useState<'insert' | 'delete' | 'search'>('insert');

  /* Effect: 订阅播放控制器 */
  useEffect(() => {
    const unsubscribe = playbackController.subscribe((state) => setPlaybackState(state));
    return () => unsubscribe();
  }, [playbackController]);

  /**
   * 执行选定的操作
   * 从 inputValue 解析数值，根据 operation 类型调用对应的算法方法
   */
  const handleOperation = useCallback(() => {
    const val = parseInt(inputValue);
    if (isNaN(val)) return;

    if (operation === 'insert') algorithm.generateInsertSteps(val);
    else if (operation === 'delete') algorithm.generateDeleteSteps(val);
    else algorithm.generateSearchSteps(val);

    const steps = algorithm.getSteps();
    if (steps.length > 0) {
      playbackController.setSteps(steps);
      playbackController.play();
    }
    setInputValue('');
  }, [algorithm, playbackController, inputValue, operation]);

  /** 重置所有状态 */
  const handleReset = useCallback(() => {
    playbackController.reset();
    algorithm.reset();
  }, [playbackController, algorithm]);

  /* 从 playbackState 提取当前步骤数据 */
  const currentStep = playbackState.currentStepIndex >= 0 && playbackState.currentStepIndex < playbackState.steps.length
    ? playbackState.steps[playbackState.currentStepIndex]
    : null;
  const treeRoot = currentStep?.tree || algorithm.getState().root;
  const highlightLine = currentStep?.highlightLine ?? -1;
  const variables = currentStep?.variables || {};
  const message = currentStep?.message || '';

  /* 计算树深度以确定布局间距 */
  const treeDepth = algorithm.getDepth();
  const horizontalGap = Math.max(60, 300 / Math.max(treeDepth, 1));
  const layoutRoot = layoutTree(treeRoot, 350, 40, horizontalGap);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">AVL树可视化</h2>
      <p className="text-gray-600 mb-4 text-sm">自平衡二叉搜索树，通过旋转操作保持平衡因子在 [-1, 1] 范围内</p>

      {/* 三栏布局：左侧树展示占2栏，右侧信息占1栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 左侧区域（2栏宽）：SVG树 + 统计卡片 + 播放控制 + 操作设置 */}

        {/* 右侧区域（1栏宽）：代码同步 + 变量监控 + 复杂度 + 旋转说明 + 平衡因子说明 */}

      </div>
    </div>
  );
};

export default AVLTreePage;
