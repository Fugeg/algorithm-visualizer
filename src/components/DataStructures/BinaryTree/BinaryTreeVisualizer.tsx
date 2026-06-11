/**
 * @fileoverview 二叉树可视化展示组件（BinaryTreeVisualizer）
 *
 * 本组件负责将二叉树数据结构渲染为层级化的树形图，是二叉树的"视图层"。
 *
 * 可视化原理：
 * - 使用 DOM 操作（非 SVG/Canvas）动态创建节点和连接线
 * - 采用递归算法计算每个节点的屏幕坐标位置
 * - 根节点居中显示，子节点按层次向下展开
 * - 左子节点在左侧，右子节点在右侧
 *
 * 渲染技术：
 * 1. 使用 useEffect + useRef 在容器中动态创建 DOM 元素
 * 2. 节点使用 <div> 渲染为圆形，支持高亮和悬停效果
 * 3. 连接线使用绝对定位的 <div>，通过 CSS transform: rotate() 实现任意角度
 * 4. 自动缩放：根据树的大小和容器尺寸计算缩放比例
 *
 * 坐标计算逻辑：
 * - 根节点位于容器顶部中央
 * - 每层的水平间距 = 上层间距 / 2（指数衰减）
 * - 垂直间距固定为节点大小的2倍
 * - 路径记录：'0' → '0L' → '0LR' 表示从根到当前节点的路径
 */

import React, { useEffect, useRef, useState } from 'react';
import './BinaryTreeVisualizer.css';

/**
 * 二叉树节点接口定义
 * @interface TreeNode
 * @property {number | string} value - 节点值
 * @property {TreeNode} [left] - 左子节点
 * @property {TreeNode} [right] - 右子节点
 */
interface TreeNode {
  value: number | string;
  left?: TreeNode;
  right?: TreeNode;
}

/**
 * BinaryTreeVisualizer 组件的 Props 接口定义
 */
interface BinaryTreeVisualizerProps {
  root: TreeNode | null;
  highlightNodes: string[];
}

/**
 * 二叉树可视化组件
 *
 * @component
 * @description 将二叉树数据渲染为层级化的树形结构，支持路径高亮
 */

const BinaryTreeVisualizer: React.FC<BinaryTreeVisualizerProps> = ({
  root,
  highlightNodes = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // 使用 forceUpdate 触发重渲染以应用新的缩放比例（state 值本身不需要读取）
  const [, forceUpdate] = useState(0);

  // 获取树的深度和每层节点数
  const getTreeInfo = (node: TreeNode | null): { depth: number; widths: number[] } => {
    const widths: number[] = [];
    
    const traverse = (node: TreeNode | null, level: number): number => {
      if (!node) return 0;
      widths[level] = (widths[level] || 0) + 1;
      return 1 + Math.max(
        traverse(node.left, level + 1),
        traverse(node.right, level + 1)
      );
    };

    const depth = traverse(node, 0);
    return { depth, widths };
  };

  // 计算适当的缩放比例
  const calculateScale = (containerWidth: number, containerHeight: number, treeWidth: number, treeHeight: number): number => {
    const horizontalScale = containerWidth / treeWidth;
    const verticalScale = containerHeight / treeHeight;
    return Math.min(1, horizontalScale, verticalScale) * 0.9; // 留出10%边距
  };

  // 绘制连接线
  const drawLine = (
    container: HTMLElement,
    parentX: number,
    parentY: number,
    childX: number,
    childY: number,
    nodeSize: number
  ) => {
    const line = document.createElement('div');
    line.className = 'line absolute bg-gray-300 transition-all duration-300';
    
    const startX = parentX;
    const startY = parentY + (nodeSize / 2);
    const endX = childX;
    const endY = childY - (nodeSize / 2);
    
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    
    line.style.width = `${length}px`;
    line.style.height = '2px';
    line.style.transformOrigin = '0 0';
    line.style.transform = `translate(${startX}px, ${startY}px) rotate(${angle}deg)`;
    
    container.appendChild(line);
  };

  // 渲染节点
  const renderNode = (
    container: HTMLElement,
    node: TreeNode,
    x: number,
    y: number,
    level: number,
    maxDepth: number,
    nodeSize: number,
    horizontalSpacing: number,
    path: string = '0'
  ) => {
    const nodeDiv = document.createElement('div');
    nodeDiv.className = `node absolute rounded-full border-2 
      ${highlightNodes.includes(path) ? 'border-blue-500 bg-blue-100' : 'border-gray-300 bg-white'}
      flex items-center justify-center cursor-pointer transition-all duration-300
      transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 hover:shadow-lg hover:bg-gray-50`;
    
    nodeDiv.style.width = `${nodeSize}px`;
    nodeDiv.style.height = `${nodeSize}px`;
    nodeDiv.style.left = `${x}px`;
    nodeDiv.style.top = `${y}px`;
    nodeDiv.style.fontSize = `${Math.max(nodeSize / 3, 12)}px`;
    nodeDiv.textContent = String(node.value);
    
    container.appendChild(nodeDiv);

    // 计算子节点位置
    const verticalGap = nodeSize * 2; // 垂直间距随节点大小缩放
    
    if (node.left) {
      const childX = x - horizontalSpacing;
      const childY = y + verticalGap;
      drawLine(container, x, y, childX, childY, nodeSize);
      renderNode(container, node.left, childX, childY, level + 1, maxDepth, nodeSize, horizontalSpacing / 2, path + 'L');
    }

    if (node.right) {
      const childX = x + horizontalSpacing;
      const childY = y + verticalGap;
      drawLine(container, x, y, childX, childY, nodeSize);
      renderNode(container, node.right, childX, childY, level + 1, maxDepth, nodeSize, horizontalSpacing / 2, path + 'R');
    }
  };

  useEffect(() => {
    if (!containerRef.current || !root) return;

    // 清除之前的内容
    containerRef.current.innerHTML = '';

    // 获取容器尺寸
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // 获取树的信息
    const { depth, widths } = getTreeInfo(root);
    const maxLevelWidth = Math.max(...widths);

    // 计算理想的树尺寸
    const baseNodeSize = 40; // 基础节点大小
    const baseHorizontalSpacing = baseNodeSize * 3; // 基础水平间距
    const idealTreeWidth = maxLevelWidth * baseHorizontalSpacing;
    const idealTreeHeight = depth * (baseNodeSize * 2.5);

    // 计算缩放比例
    const newScale = calculateScale(containerWidth, containerHeight, idealTreeWidth, idealTreeHeight);
    forceUpdate(n => n + 1); // 触发重渲染以应用新的缩放比例

    // 应用缩放后的尺寸
    const nodeSize = baseNodeSize * newScale;
    const horizontalSpacing = baseHorizontalSpacing * newScale;

    // 计算起始位置（居中）
    const startX = containerWidth / 2;
    const startY = nodeSize; // 留出顶部空间

    // 创建内容容器
    const contentDiv = document.createElement('div');
    contentDiv.className = 'relative w-full h-full';
    containerRef.current.appendChild(contentDiv);

    // 渲染树
    renderNode(contentDiv, root, startX, startY, 0, depth, nodeSize, horizontalSpacing);
    
    // 清理函数：组件卸载或重新渲染时移除手动创建的DOM节点
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, highlightNodes]);

  return root ? (
    <div 
      ref={containerRef}
      className="relative border rounded-lg bg-white overflow-hidden p-4 animate-fade-in"
      style={{ height: '400px' }}
    />
  ) : (
    <div className="relative border rounded-lg bg-white overflow-hidden p-4 flex items-center justify-center text-gray-500" style={{ height: '400px' }}>
      空二叉树
    </div>
  );
};

export default BinaryTreeVisualizer;
