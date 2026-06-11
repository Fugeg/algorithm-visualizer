/**
 * @fileoverview 二叉树（Binary Tree）数据结构可视化主页面组件
 *
 * 本组件是二叉树数据结构的顶层容器，负责：
 * 1. 管理二叉树的节点数据结构（使用嵌套对象表示树形结构）
 * 2. 实现二叉搜索树（BST）的插入、删除、搜索操作
 * 3. 通过高亮显示搜索路径，帮助用户理解树的遍历过程
 * 4. 协调树形可视化展示与操作控制面板
 *
 * 可视化方式：使用层级布局展示二叉树结构，根节点在顶部，子节点向下展开
 * 操作类型：插入(Insert)、删除(Delete)、搜索(Search)
 * 特点：本组件直接管理树的状态（非观察者模式），适合演示纯函数式树操作
 */

import React, { useState } from 'react';
import DataStructureLayout from '../Layout/DataStructureLayout';
import BinaryTreeVisualizer from './BinaryTree/BinaryTreeVisualizer';
import BinaryTreeOperations from './BinaryTree/BinaryTreeOperations';

/**
 * 二叉树节点接口定义
 * @interface TreeNode
 * @property {any} value - 节点存储的值
 * @property {TreeNode} [left] - 左子节点引用
 * @property {TreeNode} [right] - 右子节点引用
 */
interface TreeNode {
  value: any;
  left?: TreeNode;
  right?: TreeNode;
}

/**
 * 二叉树主页面组件
 *
 * @component
 * @description 提供二叉搜索树的完整交互界面，支持动态演示节点的增删查操作
 *
 * @example
 * ```tsx
 * <BinaryTree />
 * ```
 */

const BinaryTree: React.FC = () => {
  /**
   * 管理二叉树的根节点
   * 初始状态为一个包含7个节点的完全二叉树：
   *        1
   *       / \
   *      2   3
   *     / \ / \
   *    4  5 6  7
   */
  const [root, setRoot] = useState<TreeNode>({
    value: 1,
    left: {
      value: 2,
      left: { value: 4 },
      right: { value: 5 }
    },
    right: {
      value: 3,
      left: { value: 6 },
      right: { value: 7 }
    }
  });

  /**
   * 管理需要高亮显示的节点路径
   * 存储格式为字符串数组，如 ['0', '0L', '0LR'] 表示从根到目标节点的路径
   * 用于搜索操作时可视化展示搜索路径
   */
  const [highlightNodes, setHighlightNodes] = useState<string[]>([]);

  /**
   * 处理节点插入操作（遵循二叉搜索树规则）
   *
   * 算法逻辑（递归实现）：
   * 1. 如果当前节点为空，创建新节点并返回
   * 2. 如果新值小于当前节点值，递归插入到左子树
   * 3. 如果新值大于等于当前节点值，递归插入到右子树
   * 4. 使用展开运算符创建新的树结构（不可变更新）
   *
   * 时间复杂度：O(log n) 平衡情况下，O(n) 最坏情况（退化为链表）
   *
   * @param value - 要插入的节点值
   */
    const insertNode = (node: TreeNode | undefined, newValue: number): TreeNode => {
      if (!node) {
        return { value: newValue };
      }
      if (newValue < node.value) {
        return { ...node, left: insertNode(node.left, newValue) };
      }
      return { ...node, right: insertNode(node.right, newValue) };
    };
    setRoot(insertNode(root, value));
  };

  /**
   * 处理节点删除操作（遵循二叉搜索树规则）
   *
   * 算法逻辑（递归实现）：
   * 1. 递归查找要删除的节点
   * 2. 情况1：节点无左子节点，直接返回右子树
   * 3. 情况2：节点无右子节点，直接返回左子树
   * 4. 情况3：节点有两个子节点，找到右子树的最小值替代当前节点，
   *        然后递归删除右子树中的该最小值节点
   *
   * 时间复杂度：O(log n) 平衡情况下
   *
   * @param value - 要删除的节点值
   */
    const findMin = (node: TreeNode): number => {
      let current = node;
      while (current.left) {
        current = current.left;
      }
      return current.value;
    };

    const deleteNode = (node: TreeNode | undefined, value: number): TreeNode | undefined => {
      if (!node) return undefined;

      if (value < node.value) {
        return { ...node, left: deleteNode(node.left, value) };
      }
      if (value > node.value) {
        return { ...node, right: deleteNode(node.right, value) };
      }

      // 找到要删除的节点
      if (!node.left) return node.right;
      if (!node.right) return node.left;

      // 有两个子节点的情况
      const minValue = findMin(node.right);
      return {
        ...node,
        value: minValue,
        right: deleteNode(node.right, minValue)
      };
    };

    setRoot(deleteNode(root, value) || null);
  };

  /**
   * 处理节点搜索操作（带路径可视化）
   *
   * 算法逻辑：
   * 1. 从根节点开始，按照 BST 规则递归查找
   * 2. 记录访问路径（'L'表示向左，'R'表示向右）
   * 3. 找到目标值后，高亮显示整条搜索路径
   * 4. 2秒后自动清除高亮效果
   *
   * 可视化效果：用户可以清晰看到搜索算法如何通过比较快速定位目标
   *
   * @param value - 要搜索的目标值
   * @returns {Promise<boolean>} 是否找到目标值
   */
    const searchPath: string[] = [];

    const searchNode = (node: TreeNode | undefined, value: number, path: string): boolean => {
      if (!node) return false;
      searchPath.push(path);
      if (node.value === value) {
        setHighlightNodes(searchPath);
        setTimeout(() => setHighlightNodes([]), 2000);
        return true;
      }
      if (value < node.value) {
        return searchNode(node.left, value, path + 'L');
      }
      return searchNode(node.right, value, path + 'R');
    };

    return searchNode(root, value, '0');
  };

  return (
    <DataStructureLayout
      title="二叉树"
      visualization={
        <BinaryTreeVisualizer 
          root={root}
          highlightNodes={highlightNodes}
        />
      }
      operations={
        <BinaryTreeOperations 
          onInsert={handleInsert}
          onDelete={handleDelete}
          onSearch={handleSearch}
        />
      }
      features={{
        title: "二叉树特点",
        items: [
          "每个节点最多有两个子节点",
          "具有层级结构",
          "可以是空树",
          "适用于表示层级关系数据"
        ]
      }}
      complexity={{
        title: "性能分析",
        items: [
          { operation: "插入 (Insert)", timeComplexity: "O(log n)", spaceComplexity: "O(1)", description: "平衡树的情况下，每次比较后树高减半" },
          { operation: "删除 (Delete)", timeComplexity: "O(log n)", spaceComplexity: "O(1)", description: "需要找到并重新连接节点" },
          { operation: "搜索 (Search)", timeComplexity: "O(log n)", spaceComplexity: "O(1)", description: "每次比较后排除一半节点" },
          { operation: "遍历 (Traversal)", timeComplexity: "O(n)", spaceComplexity: "O(h)", description: "需要访问所有节点，h为树高" }
        ],
        summary: {
          bestCase: "O(log n)",
          averageCase: "O(log n)",
          worstCase: "O(n)",
          spaceComplexity: "O(n)"
        }
      }}
    />
  );
};

export default BinaryTree;
