/**
 * @fileoverview 贪心算法步骤展示组件
 * @description 用于展示贪心算法执行过程中的每一步决策记录。
 *              支持三种步骤类型：选择（select）、跳过（skip）、求解（solution），
 *              每种类型使用不同的颜色和图标进行区分，帮助用户理解贪心策略的
 *              选择过程（为什么选这个、为什么不选那个）。
 *
 * @note 贪心算法的核心在于"选择"和"放弃"的决策过程，
 *       此组件通过颜色编码直观展示每一步的决策结果。
 */

import React from 'react';
import { GreedyStep } from '../../../models/GreedyAlgorithm';

/**
 * GreedySteps组件属性接口
 * @interface GreedyStepsProps
 * @property steps - 贪心算法的所有执行步骤列表
 * @property currentStep - 当前正在执行的步骤ID（用于高亮显示）
 */
interface GreedyStepsProps {
  steps: GreedyStep[];
  currentStep: number;
}

/**
 * 贪心算法步骤列表组件
 * @param props - 组件属性：steps（步骤列表）、currentStep（当前步骤索引）
 * @description 功能特点：
 *              1. 按时间顺序展示所有贪心决策步骤
 *              2. 当前步骤使用加粗边框高亮
 *              3. 不同步骤类型使用不同颜色编码：
 *                 - select（选择）：绿色 - 表示该选项被纳入当前解
 *                 - skip（跳过）：红色 - 表示该选项被舍弃（与已选冲突或不优）
 *                 - solution（求解）：蓝色 - 表示最终解输出
 */
const GreedySteps: React.FC<GreedyStepsProps> = ({ steps, currentStep }) => {
  /**
   * 根据步骤类型返回背景色和边框色类名
   * @param step - 贪心步骤对象
   * @returns Tailwind CSS类名字符串
   */
  const getStepColor = (step: GreedyStep) => {
    switch (step.type) {
      case 'select':
        return 'bg-green-100 border-green-500';    // 被选中：绿色系
      case 'skip':
        return 'bg-red-100 border-red-500';        // 被跳过：红色系
      case 'solution':
        return 'bg-blue-100 border-blue-500';      // 最终解：蓝色系
      default:
        return 'bg-gray-100 border-gray-500';       // 默认：灰色系
    }
  };

  /**
   * 根据步骤类型返回对应的图标字符
   * @param step - 贪心步骤对象
   * @returns 图标字符串（符号或emoji）
   */
  const getStepIcon = (step: GreedyStep) => {
    switch (step.type) {
      case 'select': return '✓';     // 选中：勾号
      case 'skip': return '✗';       // 跳过：叉号
      case 'solution': return '★';   // 解出：星标
      default: return '•';           // 默认：圆点
    }
  };

  /**
   * 渲染单个步骤卡片
   * @param step - 要渲染的贪心步骤对象
   * @returns JSX步骤卡片元素
   */
  const renderStep = (step: GreedyStep) => {
    const isCurrentStep = step.id === currentStep;  // 判断是否为当前活跃步骤
    const stepColor = getStepColor(step);
    const borderStyle = isCurrentStep ? 'border-2' : 'border';  // 当前步骤加粗边框

    return (
      <div
        key={step.id}
        className={`relative p-2 rounded-lg ${stepColor} ${borderStyle} mb-2`}
      >
        <div className="flex items-center space-x-2">
          {/* 决策类型图标 */}
          <span className="font-mono">{getStepIcon(step)}</span>
          {/* 步骤描述文字 */}
          <span className="flex-1">{step.description}</span>
        </div>
      </div>
    );
  };

  return (
    /* 步骤列表容器：最大高度600px，超出时可滚动 */
    <div className="p-4 bg-white rounded-lg shadow overflow-auto max-h-[600px]">
      <div className="space-y-2">
        {steps.map(step => renderStep(step))}
      </div>
    </div>
  );
};

export default GreedySteps;
