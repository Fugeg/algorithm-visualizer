/**
 * @file astTraversal.ts
 * @description AST（抽象语法树）遍历与查询工具模块
 *
 * 【模块角色】
 * 本模块是算法可视化系统的"AST访问层"，提供对解析后的AST树进行深度优先遍历和节点查询的能力。
 * 它实现了经典的Visitor（访问者）设计模式，允许开发者以声明式的方式定义对不同类型节点的处理逻辑。
 *
 * 【设计目的】
 * 1. 提供通用的AST遍历基础设施，避免在业务代码中重复编写递归遍历逻辑
 * 2. 支持enter/exit两种回调时机，实现灵活的节点拦截和处理
 * 3. 为代码分析、转换、信息提取等操作提供统一的接口
 *
 * 【核心功能】
 * - 深度优先遍历（DFS）：自动递归访问AST中的每个节点
 * - Visitor模式：通过注册不同节点类型的处理器来定制行为
 * - 双向钩子：支持进入节点(enter)和离开节点(exit)两个时机的回调
 * - 上下文传递：在整个遍历过程中维护可变的状态对象(context)
 *
 * 【典型应用场景】
 * 1. **代码分析与统计**：
 *    - 统计代码中函数调用次数、变量使用频率、循环嵌套深度等
 *
 * 2. **AST信息提取**：
 *    - 提取所有变量声明、查找特定类型的表达式、收集函数名列表等
 *
 * 3. **代码转换**（需配合修改逻辑）：
 *    - 重命名变量、优化常量表达式、插入调试代码等
 *
 * 4. **可视化辅助**：
 *    - 在执行前标记关键节点位置，用于高亮显示当前执行的代码行
 *    - 构建节点到源码位置的映射关系
 *
 * 【设计模式说明 - Visitor Pattern（访问者模式）】
 * Visitor模式将算法（遍历逻辑）与对象结构（AST节点）分离：
 * - AST节点保持稳定，不需要知道会被如何访问
 * - 遍历逻辑封装在Visitor对象中，可以灵活组合和扩展
 * - 新增节点类型处理只需添加新的visitor条目，无需修改现有代码
 *
 * 【与其他模块的关系】
 * parser.ts → [生成AST] → astTraversal.ts [遍历查询] → 业务逻辑
 *                              ↓
 *                        executor.ts [执行]
 */

/**
 * Visitors - 访问者配置接口类型定义
 *
 * 【接口设计说明】
 * 这是一个字典(Dictionary)类型，键是AST节点的type字符串，
 * 值是该节点类型的访问者配置对象。
 *
 * 【数据结构示例】
 * const myVisitors: Visitors = {
 *   'FunctionDeclaration': {
 *     enter: (node, ctx) => { console.log('进入函数:', node.id.name); },
 *     exit: (node, ctx) => { console.log('离开函数'); }
 *   },
 *   'ReturnStatement': {
 *     enter: (node, ctx) => { ctx.returnCount++; }
 *   },
 *   // 其他节点类型...
 * };
 *
 * 【为什么使用索引签名 [key: string]？**
 * 因为AST节点类型众多（ESTree规范定义了100+种节点类型），
 * 使用索引签名允许动态添加任意节点类型的处理器，
 * 而不需要预先枚举所有可能的类型。
 */
interface Visitors {
  /**
   * 索引签名：以AST节点类型名称为键
   * @key - AST节点的type属性值，如'FunctionDeclaration'、'BinaryExpression'等
   * @value - 该节点类型的访问者配置，包含可选的enter和exit回调
   */
  [key: string]: {
    /**
     * enter - 进入节点时的回调函数（前序遍历时触发）
     *
     * 【触发时机】
     * 在访问某个节点的子节点之前调用。
     * 对于深度优先遍历(DFS)，这是首次到达该节点的时候。
     *
     * 【典型用途】
     * - 收集节点信息（如记录所有函数声明的名称）
     * - 统计节点出现次数（如计算循环语句的数量）
     * - 初始化该节点相关的上下文状态
     * - 决定是否跳过该节点的子树（通过修改context中的标志）
     *
     * @param node - 当前正在访问的AST节点对象
     *               包含type字段标识节点类型，以及其他节点特定的属性
     *               例如FunctionDeclaration节点会有id、params、body等属性
     * @param context - 用户传入的可变上下文对象
     *                  用于在遍历过程中传递和累积状态信息
     *                  例如：{ functionCount: 0, currentScope: 'global' }
     *                  回调函数可以自由地读取和修改此对象的属性
     * @returns void - 返回值被忽略（如需影响遍历，应修改context）
     *
     * @example
     * // 统计代码中所有的函数声明
     * const visitors = {
     *   'FunctionDeclaration': {
     *     enter: (node, ctx) => {
     *       ctx.functions.push(node.id.name);
     *       ctx.functionCount++;
     *     }
     *   }
     * };
     * traverse(ast, visitors, { functions: [], functionCount: 0 });
     */
    enter?: (node: any, context: any) => void;

    /**
     * exit - 离开节点时的回调函数（后序遍历时触发）
     *
     * 【触发时机】
     * 在访问完某个节点的所有子节点之后调用。
     * 此时该节点及其整个子树都已被完整处理过。
     *
     * 【与enter的区别】
     * - enter：先处理父节点，再处理子节点（自顶向下）
     * - exit：先处理子节点，再处理父节点（自底向上）
     *
     * 【典型用途】
     * - 汇总子节点的处理结果（如计算表达式的总复杂度）
     * - 清理作用域相关的上下文状态
     * - 进行需要完整子树信息的验证或转换
     * - 实现类似"折叠"(fold/reduce)的操作
     *
     * @param node - 当前正在离开的AST节点对象（与enter时是同一个引用）
     * @param context - 用户传入的可变上下文对象
     *                  可能已被enter回调或子节点的回调修改过
     * @returns void - 返回值被忽略
     *
     * @example
     * // 计算每个函数体内的语句数量
     * const visitors = {
     *   'FunctionDeclaration': {
     *     enter: (node, ctx) => { ctx.statementCount = 0; },  // 重置计数器
     *     exit: (node, ctx) => {
     *       console.log(`${node.id.name} 有 ${ctx.statementCount} 条语句`);
     *     }
     *   },
     *   'Statement': {  // 假设有一个通用的Statement类型
     *     enter: (node, ctx) => { ctx.statementCount++; }  // 累加计数
     *   }
     * };
     */
    exit?: (node: any, context: any) => void;
  };
}

/**
 * traverse - AST深度优先遍历函数（核心入口）
 *
 * 【业务逻辑概述】
 * 本函数实现对AST树的递归深度优先遍历(Depth-First Search, DFS)，
 * 并在遍历过程中根据Visitors配置调用相应的回调函数。
 *
 * 【遍历策略 - 深度优先搜索(DFS)】
 * 采用前序+后序混合的DFS策略：
 *
 *        A           遍历顺序（假设A、B、C都有enter和exit）：
 *       / \          enter(A) → enter(B) → exit(B) → enter(C) → exit(C) → exit(A)
 *      B   C
 *
 * 这种方式确保：
 * 1. 父节点总是在其子节点之前被进入(enter)
 * 2. 子节点总是在其父节点之前被完成(exit)
 * 3. 同级节点按从左到右的顺序处理
 *
 * 【执行流程详解】
 * 1. 检查当前节点是否有对应的visitor配置
 * 2. 如果有，调用enter回调（前序处理）
 * 3. 遍历当前节点的所有属性
 *    a. 如果属性值是数组，递归处理数组中的每个元素
 *    b. 如果属性值是单个AST节点（有type属性），递归处理它
 *    c. 否则跳过（原始值如字符串、数字、布尔值等）
 * 4. 如果有visitor配置，调用exit回调（后序处理）
 *
 * 【节点识别机制】
 * 如何判断一个对象是否是AST节点？
 * - 检查是否有type属性（typeof node[key].type !== 'undefined'）
 * - 这是ESTree规范的约定：所有AST节点都必须有type字段
 * - 这种启发式方法简单高效，适用于绝大多数情况
 *
 * 【跳过的属性类型】
 * 以下类型的属性不会被当作子节点遍历：
 * - 原始类型：string, number, boolean, null, undefined
 * - type字段本身（字符串）
 * - start/end位置信息（数字）
 * - name、value、operator等叶子属性
 *
 * @param node - 要遍历的AST根节点或任意子节点
 *               通常从parser.ts返回的Program节点开始
 *               也可以从任意中间节点开始进行局部遍历
 *               必须符合ESTree规范的结构（包含type属性）
 *
 * @param visitors - 访问者配置对象，定义对不同节点类型的处理逻辑
 *                   键为节点类型字符串（如'FunctionDeclaration'）
 *                   值为包含enter/exit回调的对象
 *                   可以只提供enter、只提供exit、或两者都提供
 *                   未配置的节点类型将被静默跳过（不报错）
 *
 * @param context - 可选的用户自定义上下文对象（默认为空对象{}）
 *                  用于在遍历过程中传递和共享状态
 *                  典型用途包括：
 *                  - 累积统计信息（计数器、集合）
 *                  - 维护作用域栈（scope stack）
 *                  - 收集结果列表
 *                  - 控制遍历行为（如设置skipChildren标志）
 *                  注意：此对象会被引用传递，所有回调共享同一实例
 *
 * @returns void - 本函数不返回有意义的值
 *          所有结果通常通过修改context对象来输出
 *          或者通过回调函数的副作用来实现（如console.log）
 *
 * @example
 * // 示例1：统计代码中各种语句的出现次数
 * const ast = parseCode(`
 *   function example() {
 *     if (true) {
 *       for (let i = 0; i < 10; i++) {
 *         console.log(i);
 *       }
 *     }
 *     return 42;
 *   }
 * `);
 *
 * const stats = {};
 * traverse(ast, {
 *   'IfStatement': { enter: (n, ctx) => { stats.ifCount = (stats.ifCount || 0) + 1; } },
 *   'ForStatement': { enter: (n, ctx) => { stats.forCount = (stats.forCount || 0) + 1; } },
 *   'ReturnStatement': { enter: (n, ctx) => { stats.returnCount = (stats.returnCount || 0) + 1; } },
 *   'CallExpression': { enter: (n, ctx) => { stats.callCount = (stats.callCount || 0) + 1; } }
 * });
 * console.log(stats); // { ifCount: 1, forCount: 1, returnCount: 1, callCount: 1 }
 *
 * @example
 * // 示例2：提取所有变量名（使用exit确保顺序）
 * const variables = [];
 * traverse(ast, {
 *   'VariableDeclarator': {
 *     enter: (node, ctx) => {
 *       // 进入变量声明器节点
 *       // 此时可以访问 node.id.name（变量名）和 node.init（初始值）
 *     },
 *     exit: (node, ctx) => {
 *       // 离开变量声明器节点
 *       // 此时其子节点（如init表达式）已全部处理完毕
 *       variables.push(node.id.name);
 *     }
 *   }
 * });
 *
 * @example
 * // 示例3：构建简单的AST可视化（缩进表示层级）
 * let output = '';
 * let indent = 0;
 * traverse(ast, {
 *   '*': {  // 通配符：对所有节点都生效
 *     enter: (node, ctx) => {
 *       output += '  '.repeat(indent) + node.type + '\n';
 *       indent++;
 *     },
 *     exit: (node, ctx) => {
 *       indent--;
 *     }
 *   }
 * });
 * console.log(output);
 * // 输出:
 * // Program
 * //   FunctionDeclaration
 * //     Identifier (example)
 * //     BlockStatement
 * //       IfStatement
 * //         ...
 *
 * @see https://github.com/estree/estree - ESTree节点类型参考文档
 * @see parser.ts - AST数据来源（本函数处理的输入）
 * @see executor.ts - AST的另一消费者（解释执行而非遍历分析）
 */
export function traverse(node: any, visitors: Visitors, context: any = {}) {
  /**
   * 步骤1：检查并执行enter回调（前序遍历阶段）
   *
   * 从visitors配置中查找当前节点类型的处理器。
   * 使用node.type作为key进行O(1)时间复杂度的查找。
   *
   * 为什么只在有visit配置时才调用？
   * - 性能优化：避免对未注册的节点类型创建不必要的调用栈帧
   * - 安全性：防止undefined.enter()导致的TypeError
   * - 灵活性：允许选择性关注特定节点类型，其他节点自动跳过
   */
  const visit = visitors[node.type];
  if (visit) {
    // 调用enter回调（如果存在），传入当前节点和上下文对象
    visit.enter && visit.enter(node, context);
  }

  /**
   * 步骤2：递归遍历子节点（核心递归逻辑）
   *
   * 【遍历策略】
   * 使用for...in循环遍历当前节点的所有自有 enumerable 属性。
   * 对每个属性的值进行类型判断，决定是否需要递归处理。
   *
   * 【三种情况的处理】
   *
   * 情况1：属性值是数组（Array.isArray判断）
   * 典型场景：
   * - node.body: BlockStatement或Program的语句数组
   * - node.params: 函数的参数数组
   * - node.arguments: 函数调用的参数数组
   * - node.elements: 数组字面量的元素数组
   * - node.properties: 对象字面量的属性数组
   *
   * 处理方式：遍历数组，对每个非null元素递归调用traverse
   * 注意：这里会过滤掉null/undefined元素（稀疏数组的空位）
   *
   * 情况2：属性值是单个AST节点（有type属性）
   * 典型场景：
   * - node.test: IfStatement/WhileStatement的条件表达式
   * - node.init/update: ForStatement的初始化/更新表达式
   * - node.consequent/alternate: IfStatement的两个分支
   * - node.left/right: BinaryExpression的左右操作数
   * - node.callee: CallExpression的被调用者
   * - node.argument: ReturnStatement/ThrowStatement的表达式
   * - node.object/property: MemberExpression的目标对象和属性
   * - node.id: FunctionDeclaration/VariableDeclarator的标识符
   *
   * 处理方式：直接对该子节点递归调用traverse
   *
   * 情况3：属性值是原始类型或其他非节点值
   * 包括：
   * - 字符串：name, operator, sourceType等
   * - 数字：start, end（位置信息）
   * - 布尔值：computed, prefix, async等
   * - null/undefined：可选属性缺失时
   *
   * 处理方式：跳过，不进行递归（这些是叶子节点的属性值）
   *
   * 【性能考虑】
   * - for...in比Object.keys().forEach()略快（省去数组创建）
   * - typeof检查比instanceof更通用（适用于跨框架场景）
   * - Array.isArray是检测数组的最可靠方法
   * - .type存在性检查是识别AST节点的标准方式
   */
  for (const key in node) {
    // 只处理对象类型的属性值（排除null、undefined和原始类型）
    if (node[key] && typeof node[key] === 'object') {

      // ----- 情况1：属性值是数组 -----
      // AST中很多属性是节点数组（如body、params、arguments等）
      if (Array.isArray(node[key])) {
        // 遍历数组中的每个元素，递归处理其中的AST节点
        // 过滤条件：el必须为truthy（排除null、undefined等空值）
        // 这是因为某些AST位置可能为空（如空函数体的body可能是空数组）
        node[key].forEach((child: any) => traverse(child, visitors, context));
      }
      // ----- 情况2：属性值是单个AST节点 -----
      // 通过检查.type属性的存在来判断是否为AST节点
      // 这是ESTree规范的核心约定：所有AST节点必须有type字段
      else if (node[key].type) {
        // 直接对单个子节点进行递归遍历
        traverse(node[key], visitors, context);
      }

      // 情况3隐式处理：既不是数组也没有type属性的对象
      // 这些通常是元数据或特殊结构，当前实现选择跳过
    }
  }

  /**
   * 步骤3：检查并执行exit回调（后序遍历阶段）
   *
   * 【触发时机保证】
   * 此回调保证在当前节点的所有子孙节点都被处理完毕后才执行。
   * 这使得exit回调可以进行"汇总"类操作：
   * - 收集子节点的处理结果
   * - 基于完整的子树信息做决策
   * - 执行清理工作（如弹出作用域栈）
   *
   * 【与enter的对称性】
   * enter和exit形成对称的"括号"结构：
   * enter(node) → ... 处理子节点 ... → exit(node)
   * 类似于HTML标签的 <div> ... </div> 结构
   *
   * 【为什么再次检查visit？】
   * 因为visit变量是在函数开头获取的，虽然在此处应该仍然有效，
   * 但显式检查是一种防御性编程实践，确保安全性。
   */
  if (visit) {
    // 调用exit回调（如果存在），此时所有子节点都已处理完毕
    visit.exit && visit.exit(node, context);
  }
}
