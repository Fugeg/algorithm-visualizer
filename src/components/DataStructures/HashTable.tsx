/**
 * @fileoverview 哈希表（Hash Table）数据结构可视化主页面组件
 *
 * 本组件是哈希表数据结构的顶层容器，负责：
 * 1. 初始化哈希表模型实例（HashTableStructure），设置初始容量为8
 * 2. 通过观察者模式订阅哈希表状态变化，实现键值对操作的实时可视化
 * 3. 提供哈希表的增（Set）、查（Get）、删（Delete）、清空（Clear）操作
 * 4. 展示哈希表的内部状态：桶数组、负载因子、冲突数等统计信息
 *
 * 可视化方式：
 * - 使用垂直排列的桶（Bucket）展示哈希表结构
 * - 每个桶可以包含多个键值对（链地址法解决冲突）
 * - 支持高亮显示正在操作的桶和具体条目
 *
 * 操作类型：
 * - Set(key, value): 插入或更新键值对
 * - Get(key): 根据键查找值
 * - Delete(key): 删除指定键的条目
 * - Clear(): 清空所有数据
 *
 * 与Model的绑定：通过 HashTableStructure 实例的 subscribe 方法建立观察者关系
 */

import React, { useState, useEffect } from 'react';
import { HashTableStructure } from '../../models/HashTableStructure';
import HashTableVisualizer from './HashTable/HashTableVisualizer';
import HashTableOperations from './HashTable/HashTableOperations';
import hashTableComplexity from './HashTable/HashTableComplexity';
import DataStructureLayout from '../Layout/DataStructureLayout';

/**
 * 哈希表主页面组件
 *
 * @component
 * @description 提供哈希表的完整交互界面，支持动态演示键值对的存储、冲突处理等过程
 *
 * @example
 * ```tsx
 * <HashTable />
 * ```
 */

const HashTable: React.FC = () => {
  /**
   * 初始化哈希表结构模型实例
   * 设置初始容量为8个桶（Bucket）
   * 该实例在组件生命周期内保持不变
   */
  const [hashTableStructure] = useState(() => new HashTableStructure(8));

  /**
   * 管理哈希表当前的可视化状态
   * 包含：
   * - buckets: 桶数组，每个桶存储键值对列表
   * - highlightBuckets: 需要高亮的桶索引数组
   * - highlightItems: 需要高亮的条目位置
   * - size: 当前存储的键值对数量
   * - capacity: 哈希表总容量（桶数）
   * - loadFactor: 负载因子（size/capacity）
   * - collisions: 哈希冲突总数
   * - message: 操作结果消息
   */
  const [state, setState] = useState(() => hashTableStructure.getState());

  /**
   * 订阅哈希表模型的状态变化（观察者模式）
   *
   * 工作原理：
   * - 组件挂载时订阅 HashTableStructure 的状态更新
   * - 当执行 Set/Get/Delete/Clear 操作后，模型会通知所有观察者
   * - 回调函数接收包含完整哈希表状态的新对象
   * - 卸载时取消订阅，避免内存泄漏
   */

  useEffect(() => {
    console.log('Subscribing to hash table structure updates');
    const unsubscribe = hashTableStructure.subscribe((newState) => {
      console.log('Hash table state updated:', newState);
      setState(newState);
    });
    return () => {
      console.log('Unsubscribing from hash table structure updates');
      unsubscribe();
    };
  }, [hashTableStructure]);

  /**
   * 处理设置键值对操作（Set）
   *
   * 操作逻辑：
   * 1. 计算键的哈希值，确定目标桶索引
   * 2. 如果桶中已存在该键，更新对应的值
   * 3. 如果不存在，在桶的链表末尾添加新的键值对
   * 4. 检查是否需要扩容（当负载因子超过阈值时）
   *
   * 时间复杂度：
   * - 平均情况：O(1) （假设哈希函数分布均匀）
   * - 最坏情况：O(n) （所有键都冲突到同一个桶）
   *
   * @param key - 键（字符串）
   * @param value - 值（字符串）
   * @returns {Promise<any>} 操作结果
   */
  const handleSet = async (key: string, value: string) => {
    return await hashTableStructure.set(key, value);
  };

  /**
   * 处理获取值操作（Get）
   *
   * 操作逻辑：
   * 1. 计算键的哈希值，定位到目标桶
   * 2. 在桶的链表中顺序查找匹配的键
   * 3. 找到则返回对应值，否则返回 undefined
   *
   * @param key - 要查找的键
   * @returns {Promise<any>} 找到的值或 undefined
   */
  const handleGet = async (key: string) => {
    return await hashTableStructure.get(key);
  };

  /**
   * 处理删除键值对操作（Delete）
   *
   * 操作逻辑：
   * 1. 计算键的哈希值，定位到目标桶
   * 2. 在桶的链表中查找并移除匹配的键值对
   *
   * @param key - 要删除的键
   * @returns {Promise<any>} 操作结果
   */
  const handleDelete = async (key: string) => {
    return await hashTableStructure.delete(key);
  };

  /**
   * 处理清空哈希表操作（Clear）
   *
   * 操作逻辑：
   * - 移除所有桶中的所有键值对
   * - 重置 size、collisions 等统计信息
   * - 保留容量设置不变
   */
  const handleClear = async () => {
    await hashTableStructure.clear();
  };

  const features = {
    title: "哈希表特点",
    items: [
      "支持快速的插入、查找和删除操作",
      "通过哈希函数将键映射到数组索引",
      "使用链地址法处理哈希冲突",
      "动态调整大小以保持性能"
    ]
  };

  return (
    <DataStructureLayout
      title="哈希表可视化"
      visualization={
        <HashTableVisualizer 
          buckets={state?.buckets || []}
          highlightBuckets={state?.highlightBuckets || []}
          highlightItems={state?.highlightItems || []}
        />
      }
      operations={
        <div>
          <HashTableOperations
            onSet={handleSet}
            onGet={handleGet}
            onDelete={handleDelete}
            onClear={handleClear}
          />
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <span className="text-gray-600">项目数量:</span>
                <span className="ml-2 font-semibold">{state?.size || 0}</span>
              </div>
              <div className="text-center">
                <span className="text-gray-600">容量:</span>
                <span className="ml-2 font-semibold">{state?.capacity || 0}</span>
              </div>
              <div className="text-center">
                <span className="text-gray-600">负载因子:</span>
                <span className="ml-2 font-semibold">
                  {((state?.loadFactor || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-center col-span-3">
                <span className="text-gray-600">冲突数:</span>
                <span className="ml-2 font-semibold">{state?.collisions || 0}</span>
              </div>
            </div>
          </div>
          {state?.message && (
            <div className="mt-4 p-2 bg-blue-100 text-blue-700 rounded">
              {state.message}
            </div>
          )}
        </div>
      }
      features={features}
      complexity={hashTableComplexity}
    />
  );
};

export default HashTable;
