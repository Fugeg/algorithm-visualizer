/**
 * @fileoverview 递归调用树可视化组件
 * @description 用于展示递归算法执行过程中的函数调用树结构。
 *              以缩进列表的形式模拟树形结构，展示每个递归调用的状态：
 *              - active（活跃）：正在执行的递归调用
 *              - complete（完成）：已返回结果的递归调用
 *              - returning（返回中）：正在返回结果到上层调用者
 *
 * @note 此组件与HanoiTower组件配合使用，汉诺塔可视化展示圆盘移动，
 *       递归树展示对应的函数调用过程，帮助理解递归的工作机制。
 */

import React from 'react';
import { RecursionStep } from '../../../models/RecursionAlgorithm';

/**
 * RecursionTree组件属性接口
 * @interface RecursionTreeProps
 * @property steps - 递归步骤列表（按执行顺序排列）
 * @property currentStep - 当前正在执行的步骤ID（用于高亮显示）
 */
interface RecursionTreeProps {
  steps: RecursionStep[];
  currentStep: number;
}

/**
 * 递归调用树组件
 * @param props - 组件属性：steps（步骤列表）、currentStep（当前步骤索引）
 * @description 功能特点：
 *              1. 按时间顺序展示所有递归调用记录
 *              2. 通过左侧缩进模拟树的层级结构（每层40px）
 *              3. 当前活跃节点使用加粗边框高亮
 *              4. 不同状态使用不同颜色编码：
 *                 - active（黄色）：正在执行的递归调用
 *                 - complete（绿色）：已完成并返回结果
 *                 - returning（蓝色）：正在向上层返回
 *              5. 显示函数名、参数和返回值
 */
const RecursionTree: React.FC<RecursionTreeProps> = ({ steps, currentStep }) => {
  /**
   * 根据递归步骤状态返回背景色和边框色类名
   * @param step - 递归步骤对象
   * @returns Tailwind CSS类名字符串
   */
  const getNodeColor = (step: RecursionStep) => {
    switch (step.state) {
      case 'active':
        return 'bg-yellow-100 border-yellow-500';   // 正在执行：黄色系
      case 'complete':
        return 'bg-green-100 border-green-500';      // 执行完成：绿色系
      case 'returning':
        return 'bg-blue-100 border-blue-500';        // 返回过程中：蓝色系
      default:
        return 'bg-gray-100 border-gray-500';         // 默认：灰色系
    }
  };

  /**
   * 渲染单个递归调用节点
   * @param step - 要渲染的递归步骤对象
   * @returns JSX节点卡片元素
   */
  const renderNode = (step: RecursionStep) => {
    const isCurrentStep = step.id === currentStep;     // 判断是否为当前活跃节点
    const nodeColor = getNodeColor(step);
    const borderStyle = isCurrentStep ? 'border-2' : 'border';  // 当前节点加粗边框

    return (
      <div
        key={step.id}
        className={`relative p-2 rounded-lg ${nodeColor} ${borderStyle} mb-2`}
        // 根据递归深度设置左缩进，每层缩进40px，形成视觉上的树形层级
        style={{ marginLeft: `${step.level * 40}px` }}
      >
        <div className="flex justify-between items-center">
          {/* 函数调用信息：函数名(参数列表) */}
          <div className="font-mono">
            {step.function}({step.args.join(', ')})
          </div>
          {/* 返回值（如果有） */}
          {step.result !== undefined && (
            <div className="ml-4 font-mono text-sm">
              = {step.result}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    /* 调用树容器：最大高度600px，超出时可滚动查看深层递归 */
    <div className="p-4 bg-white rounded-lg shadow overflow-auto max-h-[600px]">
      <div className="space-y-2">
        {steps.map(step => renderNode(step))}
      </div>
    </div>
  );
};

export default RecursionTree;
