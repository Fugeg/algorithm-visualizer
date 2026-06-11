/**
 * @file ASTVisualizer.tsx
 * @description 抽象语法树（AST）可视化器组件 - 算法可视化管线的"结构分析视图"层
 *
 * 【管线位置】Model → Controller → View（本组件）
 * - 上游：接收 CodeVisualizer 解析生成的抽象语法树对象（AST）
 * - 本层：将 AST 的嵌套对象结构转换为 ReactFlow 可渲染的节点-边图数据
 * - 下游：通过 ReactFlow 库渲染交互式树形图（支持缩放、拖拽、节点操作）
 *
 * 【核心职责】
 * 1. 将任意深度的 AST 对象递归遍历，生成扁平化的节点和边数组
 * 2. 为每个 AST 节点计算合适的屏幕坐标位置（基于深度和水平偏移）
 * 3. 使用 ReactFlow 提供专业级的图形渲染能力（平滑曲线、自动布局）
 * 4. 支持交互式探索：用户可缩放查看细节，拖拽调整视角
 *
 * 【与 PlaybackController 的协作】
 * - 本组件是静态分析工具的一部分，不参与播放控制流程
 * - 与 CodeVisualizer 配合使用：CodeVisualizer 负责解析和遍历，
 *   本组件负责将遍历结果以图形化方式呈现
 *
 * 【技术选型】
 * - 使用 ReactFlow（基于 react-flow-renderer）作为图形渲染引擎
 * - 选择原因：
 *   1. 原生支持节点的拖拽、缩放、选择等交互
 *   2. 内置多种边类型（直线、曲线、阶梯等）
 *   3. 性能优秀，支持大规模节点图（虚拟化渲染）
 *   4. TypeScript 支持完善
 */

import React from 'react';
import ReactFlow, { Node, Edge, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

/**
 * ASTVisualizer 组件属性接口
 * @property {any} ast - 抽象语法树根节点对象
 * 
 * 【AST 对象的典型结构】（以 JavaScript 为例）：
 * {
 *   type: 'Program',                    // 节点类型标识符
 *   body: [                             // 子节点数组
 *     {
 *       type: 'FunctionDeclaration',
 *       id: { type: 'Identifier', name: 'foo' },
 *       params: [...],
 *       body: { type: 'BlockStatement', body: [...] }
 *     }
 *   ],
 *   sourceType: 'module',               // 源码类型
 *   loc: { start: { line, column }, end: { line, column } }  // 位置信息
 * }
 * 
 * 【类型使用 any 的原因】
 * - 不同语言的 AST 结构差异很大（JavaScript vs Python vs C++）
 * - 即使同一语言，不同解析器（Acorn vs Babel vs Espree）的结构也有差异
 * - 使用 any 类型提供最大灵活性，避免过度约束
 */
interface ASTVisualizerProps {
  ast: any;
}

/**
 * AST 可视化器组件 - 将抽象语法树渲染为交互式节点-边图
 *
 * 【渲染策略】
 * 1. 接收 AST 对象后，调用 convertASTToElements() 进行一次性转换
 * 2. 转换结果包含 nodes（节点数组）和 edges（边数组）
 * 3. 将数据传递给 <ReactFlow> 组件进行实际渲染
 * 4. 使用 ReactFlowProvider 包裹以提供上下文依赖
 *
 * 【布局算法说明】
 * 采用简化的层级布局（Layered Layout）策略：
 * - X轴（水平）：根据兄弟节点的顺序递增，每节点间隔 150px
 * - Y轴（垂直）：根据树的深度递增，每层间隔 100px
 * - 根节点位于 (0, 0)，子节点依次向右下方展开
 * 
 * 【注意】
 * - 当前实现未使用复杂的树布局算法（如 Sugiyama 算法）
 * - 对于深层或宽树可能出现节点重叠或过于稀疏的问题
 * - 生产环境建议集成 dagre 或 elkjs 等专业布局库
 *
 * 【性能考虑】
 * - convertASTToElements() 在每次渲染时都会执行
 * - 对于大型 AST（如数千行的代码），可能需要优化（如 memoization）
 * - ReactFlow 内部使用虚拟化渲染，只渲染视口内的节点
 *
 * @param props - 组件属性
 * @returns {JSX.Element} ReactFlow 图形容器 DOM 元素
 */
const ASTVisualizer: React.FC<ASTVisualizerProps> = ({ ast }) => {
  // 将 AST 对象转换为 ReactFlow 所需的 nodes 和 edges 数据结构
  const { nodes, edges } = convertASTToElements(ast);

  return (
    // 
     * ReactFlowProvider - 必须的外层包裹组件
     * 提供 ReactFlow 运行所需的 Context（状态管理、事件系统等）
     * 确保在复杂组件树中 ReactFlow 能正常工作
     //
    <ReactFlowProvider>
      {/* 
       * 固定尺寸容器 - ReactFlow 需要明确的宽高才能正确初始化
       * 高度设为 500px 以容纳中等规模的 AST 树
       * 宽度 100% 自适应父容器
       */}
      <div style={{ height: '500px', width: '100%' }}>
        {/* 
         * ReactFlow 核心组件 - 渲染节点-边图
         * 
         * 【关键 props 说明】
         * - nodes: 节点数据数组，每个节点包含 id、type、position、data 等属性
         * - edges: 边数据数组，定义节点间的连接关系
         * - fitView: 自动调整视口以显示所有节点（初始缩放和平移）
         * 
         * 【内置功能】
         * - 鼠标滚轮缩放
         * - 拖拽画布平移
         * - 拖拽节点移动位置
         * - 双击画布适应视口
         * - 点击节点/边触发选中事件
         */}
        <ReactFlow nodes={nodes} edges={edges} fitView />
      </div>
    </ReactFlowProvider>
  );
};

/**
 * AST 到 ReactFlow 元素的转换函数
 * 
 * 【核心任务】
 * 将嵌套的 AST 对象结构转换为 ReactFlow 所需的扁平化数据格式：
 * - Nodes 数组：每个 AST 节点对应一个图形节点
 * - Edges 数组：父子关系对应一条连接边
 *
 * 【转换规则】
 * 1. 节点 ID：使用全局递增计数器生成唯一字符串标识
 * 2. 节点标签：显示 AST 节点的 type 属性（如 "FunctionDeclaration"）
 * 3. 节点位置：基于深度（Y坐标）和水平偏移（X坐标）计算
 * 4. 边的类型：使用 smoothstep（阶梯式曲线），视觉效果优于直线
 * 5. 边的 ID 格式："e{sourceId}-{targetId}"，确保唯一性
 *
 * 【遍历策略】
 * 采用递归深度优先搜索（DFS）遍历 AST：
 * - 访问当前节点，创建对应的 Node 和 Edge（如果有父节点）
 * - 遍历当前对象的所有属性值
 * - 如果属性值是对象且具有 type 属性，视为子节点并递归处理
 * - 如果属性值是数组，遍历数组中的每个元素并递归处理
 *
 * 【参数说明】
 * @param {any} ast - AST 根节点对象
 * @returns {{ nodes: Node[], edges: Edge[] }} ReactFlow 渲染所需的节点和边数组
 *
 * 【示例输出】
 * ```javascript
 * {
 *   nodes: [
 *     { id: "0", type: "default", data: { label: "Program" }, position: { x: 0, y: 0 } },
 *     { id: "1", type: "default", data: { label: "FunctionDeclaration" }, position: { x: 0, y: 100 } },
 *     ...
 *   ],
 *   edges: [
 *     { id: "e0-1", source: "0", target: "1", type: "smoothstep" },
 *     ...
 *   ]
 * }
 * ```
 */
function convertASTToElements(ast: any): { nodes: Node[], edges: Edge[] } {
  // 初始化节点和边的存储数组
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // 全局节点 ID 计数器，确保每个节点有唯一标识
  let id = 0;

  /**
   * 递归遍历函数 - 深度优先访问 AST 的每个节点
   * 
   * @param {any} node - 当前正在访问的 AST 节点
   * @param {string | null} parentId - 父节点的 ID，根节点为 null
   * @param {number} depth - 当前节点在树中的深度（从 0 开始），用于 Y 坐标计算
   * @param {number} horizontalPosition - 当前节点的水平位置索引，用于 X 坐标计算
   */
  function traverse(node: any, parentId: string | null = null, depth: number = 0, horizontalPosition: number = 0) {
    // 为当前节点分配唯一 ID（字符串形式）
    const currentId = (id++).toString();
    
    // 创建 ReactFlow 节点对象并添加到 nodes 数组
    nodes.push({
      id: currentId,
      type: 'default',  // 使用默认节点样式（圆角矩形 + 文字标签）
      
      // 节点显示的文本内容：取 AST 节点的 type 属性
      // 这是最具辨识度的属性，能直观表示节点语义（如 FunctionDeclaration、IfStatement 等）
      data: { label: node.type },
      
      // 计算节点在画布上的绝对位置
      // X 坐标：水平位置索引 × 150px（控制节点间距）
      // Y 坐标：树深度 × 100px（控制层间距）
      // 这种简单的线性布局适合小型到中型 AST
      position: { x: horizontalPosition * 150, y: depth * 100 },
    });

    // 如果当前节点有父节点，创建一条从父节点到当前节点的连接边
    if (parentId !== null) {
      edges.push({
        // 边的唯一标识，格式为 "e{父节点ID}-{子节点ID}"
        id: `e${parentId}-${currentId}`,
        
        // 边的起点和终点（对应节点的 ID）
        source: parentId,
        target: currentId,
        
        // 边的样式类型：smoothstep 表示阶梯式曲线
        // 相比于 straight（直线）和 bezier（贝塞尔曲线），
        // smoothstep 在树形结构中视觉上更清晰自然
        type: 'smoothstep',
      });
    }

    // 初始化当前层的子节点水平位置计数器
    let childPosition = 0;
    
    // 遍历当前 AST 节点的所有属性，查找子节点
    for (const key in node) {
      // 只处理对象类型的属性值（跳过基本类型如 string、number、boolean）
      if (node[key] && typeof node[key] === 'object') {
        
        // 情况1：属性值是数组（AST 中常见的如 body[]、params[]、arguments[]）
        if (Array.isArray(node[key])) {
          // 遍历数组的每个元素，对每个元素递归调用 traverse
          // childPosition++ 确保同级兄弟节点在水平方向上依次排列
          node[key].forEach((child: any) => {
            traverse(child, currentId, depth + 1, horizontalPosition + childPosition);
            childPosition++;
          });
          
        // 情况2：属性值是单个对象且有 type 属性（符合 AST 节点的特征）
        // 这是判断一个对象是否为 AST 子节点的核心条件
        } else if (node[key].type) {
          traverse(node[key], currentId, depth + 1, horizontalPosition + childPosition);
          childPosition++;  // 移动到下一个水平位置
        }
        // 其他类型的对象（如 loc 位置信息对象）会被忽略，不创建节点
      }
    }
  }

  // 从 AST 根节点开始递归遍历
  // 初始参数：无父节点(null)、深度为 0、水平位置为 0
  traverse(ast);
  
  // 返回转换完成的节点和边数组
  return { nodes, edges };
}

export default ASTVisualizer;