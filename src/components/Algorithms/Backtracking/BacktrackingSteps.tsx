/**
 * @fileoverview 回溯算法步骤展示组件
 * @description 用于展示回溯算法执行过程中的探索和回溯操作记录。
 *              支持三种步骤类型：
 *              1. try（尝试）- 尝试将某个元素放入当前解中
 *              2. solution（解出）- 找到一个有效解
 *              3. backtrack（回溯）- 发现当前路径无效，撤销选择返回上层
 *
 * @note 回溯算法的核心在于"试探-检查-回溯"的循环过程，
 *       此组件通过颜色编码和缩进层级直观展示这一过程，
 *       帮助用户理解回溯算法的搜索树遍历机制。
 */

import React from 'react';
import { BacktrackingStep } from '../../../models/BacktrackingAlgorithm';

/**
 * BacktrackingSteps组件属性接口
 * @interface BacktrackingStepsProps
 * @property steps - 回溯算法的所有执行步骤列表
 * @property currentStep - 当前正在执行的步骤ID（用于高亮显示）
 */
interface BacktrackingStepsProps {
  steps: BacktrackingStep[];
  currentStep: number;
}

/**
 * 回溯算法步骤列表组件
 * @param props - 组件属性：steps（步骤列表）、currentStep（当前步骤索引）
 * @description 功能特点：
 *              1. 按时间顺序展示所有回溯操作步骤
 *              2. 当前步骤使用加粗边框高亮
 *              3. 通过左侧缩进模拟递归深度（每层20px）
 *              4. 不同步骤类型使用不同颜色编码：
 *                 - try（尝试）：黄色 - 正在尝试某个选择
 *                 - solution（解出）：绿色 - 找到有效解
 *                 - backtrack（回溯）：红色 - 撤销选择，返回上层
 */
const BacktrackingSteps: React.FC<BacktrackingStepsProps> = ({ steps, currentStep }) => {
  /**
   * 根据步骤类型返回背景色和边框色类名
   * @param step - 回溯步骤对象
   * @returns Tailwind CSS类名字符串
   */
  const getStepColor = (step: BacktrackingStep) => {
    switch (step.type) {
      case 'try':
        return 'bg-yellow-100 border-yellow-500';   // 尝试选择：黄色系
      case 'solution':
        return 'bg-green-100 border-green-500';      // 找到解：绿色系
      case 'backtrack':
        return 'bg-red-100 border-red-500';          // 回溯退回：红色系
      default:
        return 'bg-gray-100 border-gray-500';         // 默认：灰色系
    }
  };

  /**
   * 根据步骤类型返回对应的图标字符
   * @param step - 回溯步骤对象
   * @returns 图标字符串（方向性符号）
   */
  const getStepIcon = (step: BacktrackingStep) => {
    switch (step.type) {
      case 'try': return '→';     // 尝试：向右箭头（前进）
      case 'solution': return '✓'; // 解出：勾号（成功）
      case 'backtrack': return '←'; // 回溯：向左箭头（后退）
      default: return '•';         // 默认：圆点
    }
  };

  /**
   * 渲染单个步骤卡片
   * @param step - 要渲染的回溯步骤对象
   * @returns JSX步骤卡片元素
   */
  const renderStep = (step: BacktrackingStep) => {
    const isCurrentStep = step.id === currentStep;  // 判断是否为当前活跃步骤
    const stepColor = getStepColor(step);
    const borderStyle = isCurrentStep ? 'border-2' : 'border';  // 当前步骤加粗边框

    return (
      <div
        key={step.id}
        className={`relative p-2 rounded-lg ${stepColor} ${borderStyle} mb-2`}
        // 根据递归深度设置左缩进，每层20px，形成视觉上的搜索树层级
        style={{ marginLeft: `${step.level * 20}px` }}
      >
        <div className="flex items-center space-x-2">
          {/* 操作方向图标 */}
          <span className="font-mono">{getStepIcon(step)}</span>
          {/* 步骤描述文字 */}
          <span className="flex-1">{step.description}</span>
        </div>
      </div>
    );
  };

  return (
    /* 步骤列表容器：最大高度600px，超出时可滚动查看深层回溯 */
    <div className="p-4 bg-white rounded-lg shadow overflow-auto max-h-[600px]">
      <div className="space-y-2">
        {steps.map(step => renderStep(step))}
      </div>
    </div>
  );
};

export default BacktrackingSteps;
