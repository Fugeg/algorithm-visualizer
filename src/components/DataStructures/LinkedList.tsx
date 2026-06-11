/**
 * @fileoverview 链表（Linked List）数据结构可视化主页面组件
 *
 * 本组件是链表数据结构的顶层容器，负责：
 * 1. 初始化链表模型实例（LinkedListStructure）
 * 2. 通过观察者模式订阅链表状态变化，实现节点增删的实时可视化
 * 3. 提供链表的头部插入、尾部插入、指定位置插入和删除操作
 * 4. 协调链表节点可视化展示与操作控制面板
 *
 * 可视化方式：使用带箭头的节点序列展示链表结构，每个节点显示值和指针
 * 操作类型：头部插入(Prepend)、尾部插入(Append)、位置插入(Insert)、位置删除(Delete)
 * 与Model的绑定：通过 LinkedListStructure 实例的 subscribe 方法建立观察者关系
 */

import React, { useState, useEffect } from 'react';
import { LinkedListStructure } from '../../models/LinkedListStructure';
import LinkedListVisualizer from './LinkedList/LinkedListVisualizer';
import DataStructureLayout from '../Layout/DataStructureLayout';

/**
 * 链表主页面组件
 *
 * @component
 * @description 提供链表的完整交互界面，支持动态演示节点的插入和删除过程
 *
 * @example
 * ```tsx
 * <LinkedList />
 * ```
 */

const LinkedList: React.FC = () => {
  /**
   * 初始化链表结构模型实例
   * 使用惰性初始化创建空的链表结构
   * 该实例在组件生命周期内保持不变
   */
  const [linkedListStructure] = useState(() => new LinkedListStructure());

  /**
   * 管理链表当前的可视化状态
   * 包含：nodes（节点数组，每个节点包含value和next指针信息）、highlightIndices（高亮位置）
   */
  const [state, setState] = useState(() => linkedListStructure.getState());

  /** 用户输入的要插入的节点值 */
  const [inputValue, setInputValue] = useState('');
  /** 用户输入的操作位置索引 */
  const [position, setPosition] = useState('');

  /**
   * 订阅链表模型的状态变化（观察者模式）
   *
   * 工作原理：
   * - 组件挂载时订阅 linkedListStructure 的状态更新
   * - 当执行插入/删除操作后，模型会通知所有观察者
   * - 回调函数接收新状态并更新本地 state，触发重新渲染
   * - 卸载时取消订阅，避免内存泄漏
   */

  useEffect(() => {
    console.log('Subscribing to linked list structure updates');
    const unsubscribe = linkedListStructure.subscribe((newState) => {
      console.log('Linked List state updated:', newState);
      setState(newState);
    });
    return () => {
      console.log('Unsubscribing from linked list structure updates');
      unsubscribe();
    };
  }, [linkedListStructure]);

  /**
   * 处理头部插入操作（Prepend）
   *
   * 操作逻辑：
   * 1. 验证输入值是否为有效数字
   * 2. 调用模型的 prepend 方法，在链表头部插入新节点
   * 3. 时间复杂度：O(1)，只需修改头指针
   *
   * 可视化效果：新节点出现在链表最左侧，原有节点依次后移
   */
  const handleInsertAtHead = async () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) {
      alert('请输入有效的数值');
      return;
    }
    await linkedListStructure.prepend(value);
  };

  /**
   * 处理尾部插入操作（Append）
   *
   * 操作逻辑：
   * 1. 验证输入值
   * 2. 调用模型的 append 方法，遍历到链表末尾后插入新节点
   * 3. 时间复杂度：O(n)，需要从头遍历到尾部（单链表情况）
   *
   * 可视化效果：新节点出现在链表最右侧
   */
  const handleInsertAtTail = async () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) {
      alert('请输入有效的数值');
      return;
    }
    await linkedListStructure.append(value);
  };

  /**
   * 处理指定位置插入操作（Insert at Position）
   *
   * 操作逻辑：
   * 1. 验证输入值和位置索引的有效性
   * 2. 调用模型的 insert 方法，在指定索引位置插入新节点
   * 3. 时间复杂度：O(n)，需要遍历到目标位置
   *
   * 可视化效果：新节点插入到指定位置，后续节点后移
   */
  const handleInsertAtPosition = async () => {
    const value = parseInt(inputValue);
    const pos = parseInt(position);
    if (isNaN(value) || isNaN(pos)) {
      alert('请输入有效的数值和位置');
      return;
    }
    await linkedListStructure.insert(value, pos);
  };

  /**
   * 处理指定位置删除操作（Delete at Position）
   *
   * 操作逻辑：
   * 1. 验证位置索引的有效性
   * 2. 调用模型的 delete 方法，移除指定位置的节点
   * 3. 时间复杂度：O(n)，需要找到目标节点的前驱节点以调整指针
   *
   * 可视化效果：目标节点从链表中移除，前后节点重新连接
   */
  const handleDeleteAtPosition = async () => {
    const pos = parseInt(position);
    if (isNaN(pos)) {
      alert('请输入有效的位置');
      return;
    }
    await linkedListStructure.delete(pos);
  };

  const visualization = (
    <div className="h-full flex items-center justify-center">
      <LinkedListVisualizer
        nodes={state?.nodes || []}
        highlightIndices={state?.highlightIndices || []}
      />
    </div>
  );

  const operations = (
    <div className="flex flex-col space-y-4 p-4">
      <div className="flex space-x-2">
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="输入值"
          className="border rounded px-2 py-1"
        />
        <input
          type="number"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="位置"
          className="border rounded px-2 py-1 w-20"
        />
      </div>
      <div className="flex space-x-2">
        <button
          onClick={handleInsertAtHead}
          className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          头部插入
        </button>
        <button
          onClick={handleInsertAtTail}
          className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600"
        >
          尾部插入
        </button>
        <button
          onClick={handleInsertAtPosition}
          className="px-4 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          指定位置插入
        </button>
        <button
          onClick={handleDeleteAtPosition}
          className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          删除位置
        </button>
      </div>
    </div>
  );

  return (
    <DataStructureLayout
      title="链表"
      visualization={visualization}
      operations={operations}
      features={{
        title: "链表特点",
        items: [
          "动态大小",
          "不需要连续内存",
          "插入和删除灵活",
          "适用于频繁插入删除的场景"
        ]
      }}
      complexity={{
        title: "性能分析",
        items: [
          { operation: "头部插入 (Prepend)", timeComplexity: "O(1)", spaceComplexity: "O(1)", description: "在链表头部插入新节点" },
          { operation: "尾部插入 (Append)", timeComplexity: "O(n)", spaceComplexity: "O(1)", description: "需要遍历到链表尾部" },
          { operation: "指定位置插入 (Insert)", timeComplexity: "O(n)", spaceComplexity: "O(1)", description: "需要遍历到指定位置" },
          { operation: "删除节点 (Delete)", timeComplexity: "O(n)", spaceComplexity: "O(1)", description: "需要遍历到目标节点" },
          { operation: "搜索 (Search)", timeComplexity: "O(n)", spaceComplexity: "O(1)", description: "需要遍历链表查找目标值" }
        ],
        summary: {
          bestCase: "O(1)",
          averageCase: "O(n)",
          worstCase: "O(n)",
          spaceComplexity: "O(n)"
        }
      }}
    />
  );
};

export default LinkedList;
