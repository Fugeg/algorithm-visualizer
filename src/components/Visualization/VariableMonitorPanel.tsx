/**
 * @file VariableMonitorPanel.tsx
 * @description 变量监控面板组件 - 算法可视化管线的"数据监视视图"层
 *
 * 【管线位置】Model → Controller → View（本组件）
 * - 上游：接收 PlaybackController 传递的当前步骤变量快照（variables 对象）
 * - 本层：将键值对形式的变量数据渲染为网格式的监控卡片
 * - 下游：通过视觉化展示帮助用户追踪算法执行过程中的状态变化
 *
 * 【核心职责】
 * 1. 实时显示算法执行过程中所有变量的当前值
 * 2. 以卡片式布局（2列网格）清晰展示变量名和对应值
 * 3. 处理空数据状态：当无变量时显示友好的占位提示
 * 4. 支持自定义面板标题，适应不同的使用场景
 *
 * 【与 PlaybackController 的协作】
 * - PlaybackController 在每步推进时，从算法执行器获取当前作用域的变量快照
 * - 快照以 Record<string, string | number> 的形式传递给本组件
 * - 本组件完全受控，不维护任何内部状态，确保与播放进度同步
 *
 * 【典型应用场景】
 * 1. 排序算法：监控循环变量 i、j、临时变量 temp、交换标志 swapped 等
 * 2. 搜索算法：监控左右边界 left/right、中间点 mid、目标值 target 等
 * 3. 图算法：监控访问数组 visited[]、距离数组 dist[]、队列 queue 状态等
 * 4. 动态规划：监控 DP 表 dp[][] 的填充过程
 *
 * 【设计理念】
 * 采用"仪表盘"式设计，让用户像查看汽车仪表盘一样一目了然地掌握程序状态。
 * 这种实时反馈机制显著提升了算法学习的直观性和可理解性。
 */

import React from 'react';
import { FiEye } from 'react-icons/fi';

/**
 * VariableMonitorPanel 组件属性接口
 * @property {Record<string, string | number>} variables - 变量字典对象，
 *   key 为变量名称（string），value 为变量的当前值（string 或 number）
 *   
 *   【典型数据结构示例】
 *   ```javascript
 *   {
 *     i: 3,           // 循环计数器
 *     j: 7,           // 内层循环索引
 *     temp: 42,       // 临时存储值
 *     swapped: true,  // 交换标志
 *     array: "[3,1,4,1,5,9,2,6]"  // 数组快照（序列化为字符串）
 *   }
 *   ```
 * 
 * @property {string} [title='变量监控'] - 面板标题文字，
 *   默认值为"变量监控"，可自定义为"循环变量"、"状态监视器"等
 */
interface VariableMonitorPanelProps {
  variables: Record<string, string | number>;
  title?: string;
}

/**
 * 变量监控面板组件 - 实时显示算法执行中的变量状态
 *
 * 【渲染策略】
 * 根据变量数据的存在与否，采用两种不同的 UI 渲染模式：
 * 
 * 模式1：空数据状态（entries.length === 0）
 * - 显示简化的面板结构（无底部边框）
 * - 包含标题栏 + 占位提示文字"暂无变量数据"
 * - 使用较浅的文字颜色（text-gray-400）表示无数据状态
 * 
 * 模式2：有数据状态（entries.length > 0）
 * - 显示完整的面板结构（带底部边框分隔）
 * - 标题栏使用浅灰背景（bg-gray-50）+ 底部边框区分内容区
 * - 内容区使用 2 列网格布局（grid-cols-2）展示变量卡片
 * 
 * 【变量卡片设计】
 * 每个变量显示为一个独立的卡片单元：
 * - 外观：浅灰背景（bg-gray-50）+ 圆角 + 细边框
 * - 上半部分：变量名（小字、灰色、超长时截断显示）
 * - 下半部分：变量值（稍大字、等宽字体、主色调、超长时截断显示）
 * 
 * 【截断处理】
 * 变量名和值都使用了 truncate 类实现文本溢出省略，
 * 并通过 title 属性提供完整的悬浮提示，确保信息不丢失
 *
 * 【性能优化】
 * - 使用 Object.entries() 一次性转换对象为数组，避免多次遍历
 * - 使用 grid 布局而非 flexbox，浏览器对网格渲染有原生优化
 * - 文本截断使用 CSS 而非 JS 计算，减少主线程负担
 *
 * @param props - 组件属性
 * @returns {JSX.Element} 变量监控面板 DOM 元素
 */
const VariableMonitorPanel: React.FC<VariableMonitorPanelProps> = ({ variables, title = '变量监控' }) => {
  // 将变量对象转换为 [key, value] 二元组数组
  // 这样可以方便地使用 map 进行遍历渲染
  const entries = Object.entries(variables);

  // 
   * 空数据状态的渲染分支
   * 当没有任何变量需要显示时，展示友好的占位界面
   //
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        {/* 
         * 标题栏区域 - 包含图标和标题文字
         * 图标使用 FiEye（眼睛图标），象征"观察/监视"的语义
         */}
        <div className="flex items-center gap-2 mb-2">
          <FiEye className="text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        </div>
        
        {/* 
         * 空状态提示 - 告知用户当前没有可监控的变量
         * 可能的原因：
         * 1. 算法尚未开始执行
         * 2. 当前步骤没有产生新的变量赋值
         * 3. 执行器未配置变量捕获功能
         */}
        <p className="text-xs text-gray-400">暂无变量数据</p>
      </div>
    );
  }

  // 
   * 有数据状态的渲染分支
   * 展示完整的变量监控面板，包含标题栏和变量网格
   //
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* 
       * 标题栏 - 使用浅灰背景和底部分隔线
       * 与空数据状态的标题栏相比，增加了背景色和边框以区分内容区
       */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b">
        {/* 
         * 监视图标 - 固定尺寸（w-4 h-4），蓝色主题
         * 使用 FiEye 图标强化"实时监控"的视觉语义
         */}
        <FiEye className="text-blue-500 w-4 h-4" />
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      
      {/* 
       * 变量网格容器 - 使用 CSS Grid 实现 2 列等宽布局
       * 
       * 【布局参数说明】
       * - grid-cols-2：固定 2 列布局，适合大多数变量数量（4-12 个）
       * - gap-2：单元格间距 8px（0.5rem），保持视觉呼吸感
       * - p-3：内边距 12px（0.75rm），给内容留出舒适空间
       * 
       * 【响应式考虑】
       * 当前实现固定为 2 列，在极窄屏幕上可能显得拥挤
       * 可根据需要改为响应式布局（如 sm:grid-cols-1 md:grid-cols-2）
       */}
      <div className="p-3">
        <div className="grid grid-cols-2 gap-2">
          {/* 
           * 遍历变量条目数组，为每个变量生成一个监控卡片
           * 
           * 【key 的选择】使用变量名作为 React 的 reconciliation key
           * 这是合理的，因为在同一作用域内变量名是唯一的
           * 如果变量可能重复出现，应改用 index 作为 key
           */}
          {entries.map(([key, value]) => (
            // 
             * 单个变量卡片 - 包含变量名和变量值的紧凑展示
             //
            <div key={key} className="bg-gray-50 rounded px-3 py-2 border border-gray-100">
              {/* 
               * 变量名显示区
               * - 文字样式：超小号（text-xs）、灰色（text-gray-500）
               * - 截断处理：truncate 类在超出宽度时显示省略号
               * - 悬浮提示：title={key} 鼠标悬停时显示完整变量名
               */}
              <div className="text-xs text-gray-500 truncate" title={key}>{key}</div>
              
              {/* 
               * 变量值显示区
               * - 文字样式：小号（text-sm）、加粗（font-semibold）、等宽字体（font-mono）
               * - 颜色：主色调 indigo-700，突出显示重要数据
               * - 截断处理：同变量名，防止长字符串破坏布局
               * - 类型转换：String(value) 确保数字类型也能正确显示
               */}
              <div className="text-sm font-mono font-semibold text-indigo-700 truncate" title={String(value)}>
                {String(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VariableMonitorPanel;