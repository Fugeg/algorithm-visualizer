/**
 * @fileoverview 动态规划算法步骤展示组件
 * @description 用于展示动态规划算法执行过程中的每一步操作记录。
 *              支持三种步骤类型：初始化（init）、计算（calculate）、求解（solution），
 *              每种类型使用不同的颜色和图标进行区分，帮助用户理解DP的填表过程。
 *
 * @note 此组件与DPTable组件配合使用，表格展示DP数组的状态变化，
 *       步骤列表展示对应的操作说明。
 */

import React from 'react';
import { DPStep } from '../../../models/DynamicProgramming';

/**
 * DPSteps组件属性接口
 * @interface DPStepsProps
 * @property steps - DP算法的所有执行步骤列表
 * @property currentStep - 当前正在执行的步骤ID（用于高亮显示）
 */
interface DPStepsProps {
  steps: DPStep[];
  currentStep: number;
}

/**
 * 动态规划步骤列表组件
 * @param props - 组件属性：steps（步骤列表）、currentStep（当前步骤索引）
 * @description 功能特点：
 *              1. 按时间顺序展示所有DP操作步骤
 *              2. 当前步骤使用加粗边框高亮
 *              3. 不同步骤类型使用不同颜色编码：
 *                 - init（初始化）：蓝色 - 表示DP表初始化操作
 *                 - calculate（计算）：绿色/黄色 - 表示状态值更新或保持不变
 *                 - solution（求解）：紫色 - 表示最终结果输出
 */
const DPSteps: React.FC<DPStepsProps> = ({ steps, currentStep }) => {
  /**
   * 根据步骤类型返回背景色和边框色类名
   * @param step - DP步骤对象
   * @returns Tailwind CSS类名字符串
   */
  const getStepColor = (step: DPStep) => {
    switch (step.type) {
      case 'init':
        return 'bg-blue-100 border-blue-500';      // 初始化步骤：蓝色系
      case 'calculate':
        // 计算步骤根据是否更新了值区分颜色
        return step.state.update
          ? 'bg-green-100 border-green-500'        // 值被更新：绿色
          : 'bg-yellow-100 border-yellow-500';     // 值未变：黄色
      case 'solution':
        return 'bg-purple-100 border-purple-500';  // 最终解：紫色
      default:
        return 'bg-gray-100 border-gray-500';       // 默认：灰色
    }
  };

  /**
   * 根据步骤类型返回对应的图标字符
   * @param step - DP步骤对象
   * @returns 图标字符串（emoji或符号）
   */
  const getStepIcon = (step: DPStep) => {
    switch (step.type) {
      case 'init': return '⚡';    // 初始化：闪电图标
      case 'calculate':
        return step.state.update ? '✓' : '🔄';  // 更新：勾选，未变：循环箭头
      case 'solution': return '★';  // 求解：星标
      default: return '•';         // 默认：圆点
    }
  };

  /**
   * 渲染单个步骤卡片
   * @param step - 要渲染的DP步骤对象
   * @returns JSX步骤卡片元素
   */
  const renderStep = (step: DPStep) => {
    const isCurrentStep = step.id === currentStep;  // 判断是否为当前活跃步骤
    const stepColor = getStepColor(step);
    const borderStyle = isCurrentStep ? 'border-2' : 'border';  // 当前步骤使用加粗边框

    return (
      <div
        key={step.id}
        className={`relative p-2 rounded-lg ${stepColor} ${borderStyle} mb-2`}
      >
        <div className="flex items-center space-x-2">
          {/* 步骤类型图标 */}
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

export default DPSteps;
