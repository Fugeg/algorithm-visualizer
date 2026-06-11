/**
 * @fileoverview 数组操作控制面板组件（ArrayOperations）
 *
 * 本组件提供数组的交互式操作界面，是用户与数组数据结构交互的"控制层"。
 *
 * 功能模块：
 * 1. 插入操作区：输入值 + 可选位置索引 → 触发 onInsert 回调
 * 2. 搜索操作区：输入搜索值 → 触发 onSearch 回调
 * 3. 删除操作区：输入删除位置 → 触发 onDelete 回调
 * 4. 批量操作区：排序按钮、反转按钮
 *
 * UI 布局：
 * - 使用垂直 flex 布局（flex-col），各操作区间距为 16px（space-y-4）
 * - 每个操作区使用水平布局（flex），内部元素间距为 8px（space-x-2）
 * - 输入框使用统一的边框样式和圆角
 * - 按钮使用不同颜色区分功能：蓝色(插入)、绿色(搜索)、紫色(排序)、靛蓝(反转)
 *
 * 输入验证：
 * - 插入操作：验证值非空后调用回调
 * - 搜索操作：验证搜索值非空后调用回调
 * - 删除位置：限制在有效范围内（0 到 maxIndex-1）
 */

import React, { useState } from 'react';

/**
 * ArrayOperations 组件的 Props 接口定义
 * @interface ArrayOperationsProps
 * @property {function} onInsert - 插入操作回调函数，参数：(value, index?)
 * @property {function} onDelete - 删除操作回调函数，参数：(index)
 * @property {function} onSearch - 搜索操作回调函数，参数：(value)
 * @property {function} onSort - 排序操作回调函数
 * @property {function} onReverse - 反转操作回调函数
 * @property {number} maxIndex - 当前数组长度，用于限制位置输入的有效范围
 */
interface ArrayOperationsProps {
  onInsert: (value: any, index?: number) => void;
  onDelete: (index: number) => void;
  onSearch: (value: any) => void;
  onSort: () => void;
  onReverse: () => void;
  maxIndex: number;
}

/**
 * 数组操作控制面板组件
 *
 * @component
 * @description 提供完整的数组操作界面，包括插入、搜索、删除、排序和反转功能
 *
 * @param {ArrayOperationsProps} props - 组件属性
 */

const ArrayOperations: React.FC<ArrayOperationsProps> = ({
  onInsert,
  onDelete,
  onSearch,
  onSort,
  onReverse,
  maxIndex
}) => {
  /** 插入操作的输入值状态 */
  const [value, setValue] = useState('');
  /** 插入操作的位置索引状态（可选） */
  const [index, setIndex] = useState('');
  /** 搜索操作的输入值状态 */
  const [searchValue, setSearchValue] = useState('');

  /**
   * 渲染操作面板UI
   *
   * UI 结构（从上到下）：
   * 1. 插入区：[值输入框] [位置输入框] [插入按钮]
   *    - 位置输入框为可选，留空则追加到末尾
   *    - 点击按钮后验证并调用 onInsert，然后清空输入
   *
   * 2. 搜索区：[搜索值输入框] [搜索按钮]
   *    - 验证非空后调用 onSearch，然后清空输入
   *
   * 3. 删除区：[删除位置输入框]
   *    - 使用 onChange 直接触发删除（实时响应）
   *    - min/max 属性限制输入范围
   *
   * 4. 批量操作区：[排序按钮] [反转按钮]
   *    - 无需参数，直接调用对应回调函数
   */

  return (
    <div className="flex flex-col space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex space-x-2">
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="输入值"
          className="border rounded px-2 py-1"
        />
        <input
          type="number"
          value={index}
          onChange={(e) => setIndex(e.target.value)}
          placeholder="位置(可选)"
          className="border rounded px-2 py-1 w-24"
          min="0"
          max={maxIndex}
        />
        <button
          onClick={() => {
            if (value) {
              onInsert(parseInt(value), index ? parseInt(index) : undefined);
              setValue('');
              setIndex('');
            }
          }}
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
        >
          插入
        </button>
      </div>

      <div className="flex space-x-2">
        <input
          type="number"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="搜索值"
          className="border rounded px-2 py-1"
        />
        <button
          onClick={() => {
            if (searchValue) {
              onSearch(parseInt(searchValue));
              setSearchValue('');
            }
          }}
          className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
        >
          搜索
        </button>
      </div>

      <div className="flex space-x-2">
        <input
          type="number"
          placeholder="删除位置"
          className="border rounded px-2 py-1"
          min="0"
          max={maxIndex - 1}
          onChange={(e) => onDelete(parseInt(e.target.value))}
        />
      </div>

      <div className="flex space-x-2">
        <button
          onClick={onSort}
          className="bg-purple-500 text-white px-4 py-1 rounded hover:bg-purple-600"
        >
          排序
        </button>
        <button
          onClick={onReverse}
          className="bg-indigo-500 text-white px-4 py-1 rounded hover:bg-indigo-600"
        >
          反转
        </button>
      </div>
    </div>
  );
};

export default ArrayOperations;