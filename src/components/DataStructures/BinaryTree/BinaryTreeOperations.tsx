/**
 * @fileoverview 二叉树操作控制面板组件（BinaryTreeOperations）
 *
 * 本组件提供二叉搜索树（BST）的交互式操作界面。
 *
 * 功能：
 * - 插入节点：输入值后按BST规则插入到合适位置
 * - 删除节点：输入值后删除对应节点并重新平衡
 * - 搜索节点：输入值后高亮显示搜索路径
 * - 随机插入：自动生成随机值并插入
 *
 * UI特点：
 * - 操作结果以消息形式显示，2秒后自动消失
 * - 按钮颜色区分功能：蓝色(插入)、红色(删除)、绿色(搜索)、紫色(随机)
 */

import React, { useState } from 'react';

/** BinaryTreeOperations 组件的 Props 接口定义 */
interface BinaryTreeOperationsProps {
  onInsert: (value: number) => Promise<void>;
  onDelete: (value: number) => Promise<void>;
  onSearch: (value: number) => Promise<boolean>;
}

/**
 * 二叉树操作控制面板组件
 */

const BinaryTreeOperations: React.FC<BinaryTreeOperationsProps> = ({
  onInsert,
  onDelete,
  onSearch
}) => {
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');

  const handleInsert = async () => {
    if (!value) {
      setMessage('请输入一个值');
      return;
    }

    await onInsert(parseInt(value));
    setValue('');
    setMessage('插入成功');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleDelete = async () => {
    if (!value) {
      setMessage('请输入要删除的值');
      return;
    }

    await onDelete(parseInt(value));
    setValue('');
    setMessage('删除成功');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleSearch = async () => {
    if (!value) {
      setMessage('请输入要搜索的值');
      return;
    }

    const found = await onSearch(parseInt(value));
    setMessage(found ? '找到节点！' : '节点不存在');
    setTimeout(() => setMessage(''), 2000);
  };

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
        <button
          onClick={handleInsert}
          className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          插入
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          删除
        </button>
        <button
          onClick={handleSearch}
          className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600"
        >
          搜索
        </button>
      </div>

      {/* 随机插入按钮 */}
      <div>
        <button
          onClick={async () => {
            const randomValue = Math.floor(Math.random() * 100);
            await onInsert(randomValue);
            setMessage(`插入随机值: ${randomValue}`);
            setTimeout(() => setMessage(''), 2000);
          }}
          className="px-4 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          插入随机值
        </button>
      </div>

      {/* 操作提示信息 */}
      {message && (
        <div className="mt-2 p-2 bg-blue-100 text-blue-700 rounded">
          {message}
        </div>
      )}
    </div>
  );
};

export default BinaryTreeOperations;
