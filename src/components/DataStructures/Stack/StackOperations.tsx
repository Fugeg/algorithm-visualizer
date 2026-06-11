/**
 * @fileoverview 栈操作控制面板组件（StackOperations）
 *
 * 本组件提供栈的交互式操作界面，支持入栈、出栈和查看栈顶操作。
 *
 * 功能特点：
 * - 入栈时检查栈是否已满，满时禁用按钮
 * - 出栈/查看时检查栈是否为空，空时禁用按钮
 * - 操作结果显示为消息提示，2秒后自动消失
 */

import React, { useState } from 'react';

/** StackOperations 组件的 Props 接口定义 */
interface StackOperationsProps {
  onPush: (value: any) => Promise<boolean>;
  onPop: () => Promise<any>;
  onPeek: () => Promise<any>;
  isFull: boolean;
  isEmpty: boolean;
}

/**
 * 栈操作控制面板组件
 */

const StackOperations: React.FC<StackOperationsProps> = ({
  onPush,
  onPop,
  onPeek,
  isFull,
  isEmpty
}) => {
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');

  const handlePush = async () => {
    if (!value) {
      setMessage('请输入一个值');
      return;
    }

    const success = await onPush(parseInt(value));
    if (success) {
      setValue('');
      setMessage('入栈成功');
    } else {
      setMessage('栈已满，无法入栈');
    }

    setTimeout(() => setMessage(''), 2000);
  };

  const handlePop = async () => {
    const value = await onPop();
    if (value !== undefined) {
      setMessage(`出栈元素: ${value}`);
    } else {
      setMessage('栈为空，无法出栈');
    }

    setTimeout(() => setMessage(''), 2000);
  };

  const handlePeek = async () => {
    const value = await onPeek();
    if (value !== undefined) {
      setMessage(`栈顶元素: ${value}`);
    } else {
      setMessage('栈为空');
    }

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
          disabled={isFull}
        />
        <button
          onClick={handlePush}
          disabled={isFull}
          className={`px-4 py-1 rounded text-white ${
            isFull
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          入栈 (Push)
        </button>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={handlePop}
          disabled={isEmpty}
          className={`px-4 py-1 rounded text-white ${
            isEmpty
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          出栈 (Pop)
        </button>
        <button
          onClick={handlePeek}
          disabled={isEmpty}
          className={`px-4 py-1 rounded text-white ${
            isEmpty
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          查看栈顶 (Peek)
        </button>
      </div>

      {message && (
        <div className="mt-2 p-2 bg-blue-100 text-blue-700 rounded">
          {message}
        </div>
      )}
    </div>
  );
};

export default StackOperations;
