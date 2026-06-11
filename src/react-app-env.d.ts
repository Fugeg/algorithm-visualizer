/**
 * @file react-app-env.d.ts
 * @description React应用环境类型声明文件 - 扩展TypeScript类型定义以支持第三方库
 * 
 * 该文件的作用：
 * - 为缺少或类型不完整的第三方库提供TypeScript类型声明
 * - 扩展全局模块的类型系统，让TypeScript能正确识别库的API
 * - 避免在代码中使用any类型，保持类型安全
 * 
 * 本项目中的主要用途：
 * - 为ReactFlow库（流程图/节点图可视化库）提供完整的类型定义
 * - 解决原库类型声明缺失或不匹配的问题
 * 
 * 技术背景：
 * - .d.ts是TypeScript的声明文件（Declaration File）
 * - 不会编译成JavaScript，仅用于静态类型检查
 * - 使用"declare module"语法扩展已有模块的类型
 * - 类似于C/C++的头文件，提供接口定义但不包含实现
 * 
 * 为什么需要这个文件：
 * ReactFlow库可能因为版本问题、安装方式或自定义配置导致
 * 类型声明不完整，此文件补充了项目中实际使用的类型定义。
 * 
 * @module types/react-app-env
 */

/// <reference types="react-scripts" />
/**
 * 引用react-scripts的类型定义
 * 这是Create React App提供的标准引用，
 * 包含了React、ReactDOM、DOM API等基础类型声明
 * 确保项目可以使用所有React相关的类型
 */

/**
 * ReactFlow模块类型声明扩展
 * 
 * ReactFlow是一个基于React的流程图和节点编辑器库，
 * 本项目用于可视化数据结构（如二叉树、图等）的节点关系。
 * 
 * 声明内容包括：
 * - ReactFlow主组件的Props接口
 * - Node（节点）的数据结构
 * - Edge（边/连线）的数据结构
 * - ReactFlowProvider上下文提供者
 */
declare module 'reactflow' {
  // 引入React的基础类型，用于定义组件属性
  import { ComponentType, ReactNode } from 'react';
  
  /**
   * ReactFlow组件的属性接口
   * 定义了创建流程图时可以传入的配置选项
   * 
   * @interface ReactFlowProps
   */
  export interface ReactFlowProps {
    /** 节点数组 - 定义图中所有的节点（位置、样式、数据等） */
    nodes: Node[];
    /** 边数组 - 定义节点之间的连接关系 */
    edges: Edge[];
    /** 是否自动调整视图以适应所有节点（默认false） */
    fitView?: boolean;
    // 可根据需要添加其他使用的属性
    // 如: onNodeClick, onEdgeClick, onConnect, snapToGrid 等
  }

  /**
   * ReactFlow主组件
   * 流程图渲染的核心组件，负责：
   * - 渲染节点和边
   * 处理用户交互（拖拽、缩放、选择等）
   * - 提供画布控制功能
   * 
   * 使用示例：
   * ```tsx
   * <ReactFlow 
   *   nodes={nodes} 
   *   edges={edges}
   *   fitView={true}
   * />
   * ```
   */
  const ReactFlow: ComponentType<ReactFlowProps>;
  
  // 导出默认组件，支持 import ReactFlow from 'reactflow' 方式导入
  export default ReactFlow;

  /**
   * 节点（Node）数据结构
   * 表示流程图中的一个可视元素
   * 
   * 在本项目中的应用场景：
   * - 二叉树的每个节点
   * - 图的顶点（Vertex）
   * - 链表的每个元素
   * 
   * @interface Node
   */
  export interface Node {
    /** 节点唯一标识符，用于关联边和状态管理 */
    id: string;
    /** 节点类型，如'input'、'output'、'default'或自定义类型 */
    type?: string;
    /** 节点携带的自定义数据（如显示文本、颜色、图标等） */
    data?: any;  // any类型允许灵活存储各种节点数据
    /** 节点在画布上的坐标位置（像素单位） */
    position: { x: number; y: number };
  }
  
  /**
   * 边（Edge）数据结构
   * 表示两个节点之间的连接关系
   * 
   * 在本项目中的应用场景：
   * - 二叉树的父子关系边
   * - 图的有向/无向边
   * - 链表元素的next指针可视化
   * 
   * @interface Edge
   */
  export interface Edge {
    /** 边的唯一标识符 */
    id: string;
    /** 起始节点的ID */
    source: string;
    /** 目标节点的ID */
    target: string;
    /** 边的类型，如'straight'、'step'、'smoothstep'、'bezier'等 */
    type?: string;
  }

  /**
   * ReactFlow上下文提供者组件
   * 必须包裹使用ReactHook的子组件，提供共享状态
   * 
   * 主要作用：
   * - 提供useReactFlow、useNodesState、useEdgesState等Hooks
   * - 管理内部状态（节点、边、视口等）
   * - 支持多个ReactFlow实例共存时的隔离
   * 
   * 使用示例：
   * ```tsx
   * <ReactFlowProvider>
   *   <MyComponent />  {/* 内部可使用 useReactFlow() */}
   * </ReactFlowProvider>
   * ```
   * 
   * @property {ReactNode} children - 子组件，通常是使用ReactFlow Hooks的组件
   */
  export const ReactFlowProvider: ComponentType<{ children: ReactNode }>;
}
