/**
 * @file CodeVisualizer.tsx
 * @description 代码可视化器组件 - 算法可视化管线的"代码分析视图"层
 *
 * 【管线位置】Model → Controller → View（本组件）
 * - 上游：接收用户输入的源代码字符串（initialCode）
 * - 本层：解析代码生成 AST，提供代码编辑、高亮显示、AST 可视化、执行过程追踪
 * - 下游：通过 ASTVisualizer 子组件展示抽象语法树结构
 *
 * 【核心职责】
 * 1. 提供交互式代码编辑器，支持实时修改源代码
 * 2. 集成语法高亮和当前行高亮的代码显示器（CodeDisplay）
 * 3. 调用解析器将源代码转换为抽象语法树（AST）
 * 4. 通过 AST 遍历器追踪代码执行流程，记录进入/离开每个语句的过程
 * 5. 以树形图形式展示 AST 结构（委托给 ASTVisualizer 组件）
 *
 * 【与 PlaybackController 的协作】
 * - 本组件是独立的分析工具，不直接依赖 PlaybackController
 * - 更适合用于"静态分析"场景：用户编写/粘贴代码后点击"可视化执行"
 * - 与动态播放模式（PlaybackControls）互补，提供不同的学习视角
 *
 * 【技术架构】
 * ┌─────────────────────────────────────────────┐
 * │              CodeVisualizer                  │
 * ├──────────────┬──────────────┬───────────────┤
 * │  代码编辑器   │  代码显示器  │   执行输出    │
 * │ (textarea)   │(CodeDisplay)│  (pre 标签)    │
 * ├──────────────┴──────────────┴───────────────┤
 * │            ASTVisualizer (ReactFlow)          │
 * └─────────────────────────────────────────────┘
 */

import React, { useState, useEffect } from 'react';
import { parseCode } from '../../utils/parser';
import { traverse } from '../../utils/astTraversal';
import ASTVisualizer from './ASTVisualizer';
import CodeDisplay from '../CodeDisplay';

/**
 * CodeVisualizer 组件属性接口
 * @property {string} initialCode - 初始源代码字符串，
 *   通常由父组件传入的示例代码或用户之前编辑的内容
 */
interface CodeVisualizerProps {
  initialCode: string;
}

/**
 * 代码可视化器组件 - 集成代码编辑、语法高亮、AST 分析和执行追踪的综合工具
 *
 * 【状态管理策略】
 * 本组件使用 4 个 useState 钩子管理内部状态：
 * 
 * 1. code: string - 当前编辑的源代码文本
 *    - 由 textarea 的 onChange 事件驱动更新
 *    - 当 externalCode prop 变化时通过 useEffect 同步
 * 
 * 2. ast: any | null - 解析后的抽象语法树对象
 *    - 初始值为 null，表示尚未解析
 *    - 点击"可视化执行"按钮后由 parseCode() 生成
 *    - 用于传递给 ASTVisualizer 组件渲染
 * 
 * 3. output: string - AST 遍历过程的文字输出
 *    - 记录遍历过程中每个节点的进入/离开事件
 *    - 格式示例："进入函数: bubbleSort\n离开函数: bubbleSort\n..."
 * 
 * 4. currentLine: number - 当前正在执行的代码行号（从 0 开始）
 *    - 初始值为 -1，表示无高亮
 *    - 在 AST 遍历过程中由 visitors 回调实时更新
 *    - 传递给 CodeDisplay 组件实现行级高亮
 *
 * 【渲染布局】
 * 采用上下分区布局：
 * - 上半区：左右双栏（代码编辑器 | 代码高亮显示）
 * - 中间：操作按钮栏
 * - 下半区：AST 树形图 + 执行过程输出
 *
 * @param props - 组件属性
 * @returns {JSX.Element} 代码可视化器完整界面 DOM 元素
 */
const CodeVisualizer: React.FC<CodeVisualizerProps> = ({ initialCode }) => {
  /**
   * 当前源代码状态
   * 用户可在 textarea 中自由编辑，变更立即反映到此状态
   */
  const [code, setCode] = useState(initialCode);
  
  /**
   * 抽象语法树状态
   * 存储解析后的 AST 对象，用于 ReactFlow 渲染
   * 类型为 any 是因为 AST 结构随语言和解析器而异
   */
  const [ast, setAst] = useState<any>(null);
  
  /**
   * 执行过程输出状态
   * 累积 AST 遍历过程中产生的日志信息
   * 每次点击"可视化执行"时清空并重新生成
   */
  const [output, setOutput] = useState('');
  
  /**
   * 当前高亮行号状态
   * 用于标记代码显示器中当前正在执行的行
   * 值为 -1 时表示不高亮任何行
   */
  const [currentLine, setCurrentLine] = useState(-1);

  // 监听外部传入的初始代码变化，同步到内部状态
  // 这确保了当父组件切换示例代码时，编辑器内容会自动更新
  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  /**
   * 可视化执行处理函数
   * 
   * 【执行流程】
   * 1. 调用 parseCode(code) 将源代码字符串解析为 AST 对象
   * 2. 定义访问者（visitors）对象，注册对关键节点类型的观察回调：
   *    - FunctionDeclaration: 函数声明节点（进入/离开时记录函数名和行号）
   *    - IfStatement: 条件语句节点（进入/离开时记录行号）
   *    - ForStatement: 循环语句节点（进入/离开时记录行号）
   * 3. 调用 traverse(ast, visitors) 开始深度优先遍历 AST
   * 4. 遍历过程中，每个 visitor 回调会：
   *    - 追加描述性文字到 visualizationOutput
   *    - 调用 setCurrentLine 更新高亮行号
   * 5. 遍历完成后，将输出结果存储到 output 状态
   * 
   * 【注意】
   * - 由于 JavaScript 是单线程的，traverse() 会同步完成整个遍历
   * - 因此 currentLine 的多次更新会被批量处理，最终只显示最后一个值
   * - 如需看到逐行高亮动画效果，需要改用异步遍历或 requestAnimationFrame
   */
  const visualizeCode = () => {
    // 第一步：解析源代码为 AST
    const parsedAst = parseCode(code);
    setAst(parsedAst);

    // 初始化输出缓冲区和行号追踪变量
    let visualizationOutput = '';
    let lineNumber = 0;

    /**
     * 访问者（Visitor）配置对象
     * 
     * 【设计模式】采用访问者模式（Visitor Pattern）
     * - 将遍历逻辑与操作逻辑分离
     * - 支持对不同类型的 AST 节点定义差异化处理
     * - 每个节点类型可定义 enter 和 exit 两个生命周期钩子
     * 
     * 【支持的节点类型】
     * 目前实现了 3 种核心控制流节点的访问器，
     * 可根据需要扩展更多类型（如 WhileStatement、SwitchCase 等）
     */
    const visitors = {
      /**
       * 函数声明节点访问器
       * 触发时机：遇到 function 关键字声明的函数
       * 用途：追踪函数调用入口和出口，帮助理解递归或嵌套调用
       */
      FunctionDeclaration: {
        enter: (node: any) => {
          // 进入函数时：记录函数名称和起始行号
          visualizationOutput += `进入函数: ${node.id.name}\n`;
          setCurrentLine(node.loc.start.line - 1);  // 转换为 0-based 索引
        },
        exit: (node: any) => {
          // 离开函数时：记录函数名称和结束行号
          visualizationOutput += `离开函数: ${node.id.name}\n`;
          setCurrentLine(node.loc.end.line - 1);
        }
      },
      
      /**
       * 条件语句节点访问器
       * 触发时机：遇到 if / else if / else 语句块
       * 用途：追踪条件判断的执行路径，帮助理解分支逻辑
       */
      IfStatement: {
        enter: (node: any) => {
          visualizationOutput += `进入条件语句\n`;
          setCurrentLine(node.loc.start.line - 1);
        },
        exit: (node: any) => {
          visualizationOutput += `离开条件语句\n`;
          setCurrentLine(node.loc.end.line - 1);
        }
      },
      
      /**
       * 循环语句节点访问器
       * 触发时机：遇到 for 循环语句
       * 用途：追踪循环体的进入和退出，帮助理解迭代过程
       */
      ForStatement: {
        enter: (node: any) => {
          visualizationOutput += `进入循环\n`;
          setCurrentLine(node.loc.start.line - 1);
        },
        exit: (node: any) => {
          visualizationOutput += `离开循环\n`;
          setCurrentLine(node.loc.end.line - 1);
        }
      },
      // 可在此处添加更多节点类型的访问器...
      // 例如：WhileStatement、SwitchCase、TryCatchStatement 等
    };

    // 第二步：使用配置好的访问者对象遍历 AST
    // traverse 函数会递归访问 AST 的每个节点，
    // 并在匹配到已注册的节点类型时触发对应的 enter/exit 回调
    traverse(parsedAst, visitors);
    
    // 第三步：将累积的输出内容保存到状态中，触发 UI 重绘
    setOutput(visualizationOutput);
  };

  return (
    <div className="code-visualizer">
      {/* 
       * 上半区：代码编辑器和代码显示器的双栏布局
       * - 左栏（w-1/2）：原始代码编辑器（textarea）
       * - 右栏（w-1/2）：带语法高亮的代码显示器（CodeDisplay）
       * 
       * 【设计目的】
       * 左右对比展示让用户同时看到：
       * 1. 可编辑的纯文本代码
       * 2. 带语法着色和行高亮的渲染结果
       */}
      <div className="flex mb-4">
        {/* 
         * 左栏：代码编辑器
         * 使用原生 textarea 实现，支持直接编辑代码
         * 编辑内容通过 onChange 实时同步到 code 状态
         */}
        <div className="w-1/2 pr-2">
          <h3 className="text-lg font-semibold mb-2">代码编辑器</h3>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={15}
            className="w-full p-2 border rounded font-mono"
          />
        </div>
        
        {/* 
         * 右栏：代码高亮显示器
         * 接收 code 和 currentLine props，渲染带语法高亮的代码
         * currentLine 用于高亮显示当前正在执行的代码行
         */}
        <div className="w-1/2 pl-2">
          <h3 className="text-lg font-semibold mb-2">代码高亮显示</h3>
          <CodeDisplay code={code} language="javascript" currentLine={currentLine} />
        </div>
      </div>

      {/* 
       * 操作按钮 - 触发代码解析和 AST 遍历
       * 点击后执行 visualizeCode() 函数，启动完整的分析流程
       */}
      <button 
        onClick={visualizeCode}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        可视化执行
      </button>

      {/* 
       * AST 可视化区域 - 仅在 AST 解析成功后显示
       * 使用 ReactFlow 库将 AST 渲染为可交互的节点-边图
       * 支持缩放、拖拽、节点点击等交互操作
       */}
      {ast && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">抽象语法树</h3>
          <ASTVisualizer ast={ast} />
        </div>
      )}

      {/* 
       * 执行过程输出区域 - 显示 AST 遍历的文字日志
       * 使用 <pre> 标签保留换行和空格格式
       * 内容格式："进入函数: xxx\n离开函数: xxx\n进入循环\n..."
       */}
      <div className="output">
        <h3 className="text-lg font-semibold mb-2">执行过程:</h3>
        <pre className="bg-gray-100 p-2 rounded">{output}</pre>
      </div>
    </div>
  );
};

export default CodeVisualizer;