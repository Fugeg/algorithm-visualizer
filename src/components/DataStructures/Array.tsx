/**
 * @fileoverview 数组（Array）数据结构可视化主页面组件
 *
 * 本组件是数组数据结构的顶层容器，负责：
 * 1. 初始化数组模型实例并管理其生命周期
 * 2. 通过观察者模式订阅数组状态变化，实现响应式更新
 * 3. 协调可视化展示层、操作面板和复杂度分析三个子模块
 * 4. 提供数组的增删查改等核心操作的入口
 *
 * 可视化方式：使用水平排列的矩形块展示数组元素，支持高亮显示操作位置
 * 操作类型：插入、删除、搜索、排序、反转
 * 与Model的绑定：通过 ArrayStructure 实例的 subscribe 方法建立观察者关系
 */

import React, { useState, useEffect } from 'react';
import { ArrayStructure } from '../../models/ArrayStructure';
import ArrayVisualizer from './Array/ArrayVisualizer';
import ArrayOperations from './Array/ArrayOperations';
import ArrayComplexity from './Array/ArrayComplexity';
import DataStructureLayout from '../Layout/DataStructureLayout';

/**
 * 数组主页面组件
 *
 * @component
 * @description 提供数组的完整可视化交互界面，包含数据展示、操作控制和复杂度分析
 *
 * @example
 * ```tsx
 * <Array />
 * ```
 */
const Array: React.FC = () => {
  /**
   * 初始化数组结构模型实例
   * 使用 useState 的惰性初始化函数，创建包含初始数据 [10, 20, 30, 40, 50] 的数组
   * 该实例在整个组件生命周期内保持不变（通过 useState 的引用稳定性）
   */
  const [arrayStructure] = useState(() => {
    const initialArray = new ArrayStructure([10, 20, 30, 40, 50]);
    return initialArray;
  });

  /**
   * 管理数组当前的可视化状态
   * 包含：data（数组数据）、highlightIndices（高亮索引位置）
   * 该状态会在 arrayStructure 发出更新通知时自动刷新
   */
  const [state, setState] = useState(() => arrayStructure.getState());

  /**
   * 订阅数组模型的状态变化（观察者模式核心）
   *
   * 工作原理：
   * - 组件挂载时，通过 arrayStructure.subscribe() 注册回调函数
   * - 当模型内部状态变化时（如执行插入/删除操作），会调用此回调
   * - 回调接收最新的 newState，通过 setState 触发组件重新渲染
   * - 组件卸载时，调用 unsubscribe() 取消订阅，防止内存泄漏
   *
   * 这种模式实现了 Model → View 的单向数据流，确保视图始终与数据同步
   */
  useEffect(() => {
    console.log('Subscribing to array structure updates');
    const unsubscribe = arrayStructure.subscribe((newState) => {
      console.log('Array state updated:', newState);
      setState(newState);
    });
    return () => {
      console.log('Unsubscribing from array structure updates');
      unsubscribe();
    };
  }, [arrayStructure]);

  /**
   * 处理数组插入操作
   * @param value - 要插入的值
   * @param index - 可选，插入位置索引（默认追加到末尾）
   * 调用模型的 insert 方法，模型内部会更新状态并通知观察者
   */
  const handleInsert = async (value: any, index?: number) => {
    await arrayStructure.insert(value, index);
  };

  /**
   * 处理数组删除操作
   * @param index - 要删除元素的索引位置
   * 删除后后续元素会向前移动填补空位
   */
  const handleDelete = async (index: number) => {
    await arrayStructure.delete(index);
  };

  /**
   * 处理数组搜索操作
   * @param value - 要搜索的目标值
   * 模型会执行线性搜索或二分搜索（取决于数组是否有序），并高亮匹配位置
   */
  const handleSearch = async (value: any) => {
    await arrayStructure.search(value);
  };

  /**
   * 处理数组排序操作
   * 将数组元素按升序排列，可视化过程会展示排序算法的每一步比较和交换
   */
  const handleSort = async () => {
    await arrayStructure.sort();
  };

  /**
   * 处理数组反转操作
   * 将数组元素顺序完全颠倒，首尾元素互换
   */
  const handleReverse = async () => {
    await arrayStructure.reverse();
  };

  /**
   * 数组数据结构的特点说明
   * 用于在界面侧边栏展示数组的核心特性，帮助用户理解何时使用数组
   */
  const features = {
    title: '数组特点',
    items: [
      '连续的内存空间',
      '支持随机访问',
      '插入和删除需要移动元素',
      '大小固定'
    ]
  };

  /**
   * 构建数组可视化展示区域
   *
   * 渲染逻辑：
   * - 使用 flex 布局将 ArrayVisualizer 组件居中显示
   * - ArrayVisualizer 接收两个关键 props：
   *   1. data: 当前数组的完整数据，用于渲染每个元素块
   *   2. highlightIndices: 需要高亮显示的索引数组（如搜索命中位置、操作位置）
   * - 当 state 为空时（初始化阶段），提供空数组作为默认值防止报错
   */
  const visualization = (
    <div className="h-full flex items-center justify-center">
      <ArrayVisualizer
        data={state?.data || []}
        highlightIndices={state?.highlightIndices || []}
      />
    </div>
  );

  /**
   * 构建数组操作控制面板
   *
   * 通过 props 将事件处理函数传递给 ArrayOperations 子组件：
   * - onInsert: 触发插入操作（可指定位置）
   * - onDelete: 触发删除操作（需指定索引）
   * - onSearch: 触发搜索操作
   * - onSort: 触发排序操作
   * - onReverse: 触发反转操作
   * - maxIndex: 当前数组长度，用于限制用户输入的有效范围
   */
  const operations = (
    <ArrayOperations
      onInsert={handleInsert}
      onDelete={handleDelete}
      onSearch={handleSearch}
      onSort={handleSort}
      onReverse={handleReverse}
      maxIndex={state?.data ? state.data.length : 0}
    />
  );

  return (
    <DataStructureLayout
      title="数组"
      visualization={visualization}
      operations={operations}
      features={features}
      complexity={ArrayComplexity}
    />
  );
};

export default Array;