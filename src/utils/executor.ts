/**
 * @file executor.ts
 * @description AST（抽象语法树）执行引擎 - 算法可视化核心解释器
 *
 * 【模块角色】
 * 本模块是算法可视化系统的"运行时引擎"，负责将解析器生成的AST节点树进行逐步解释执行。
 * 它模拟了JavaScript引擎的核心功能，支持变量作用域管理、函数调用、控制流、运算表达式等。
 *
 * 【设计目的】
 * 1. 实现代码的逐语句/逐表达式执行，为算法可视化提供精确的执行状态快照
 * 2. 支持断点调试和单步执行，便于展示算法的每一步变化过程
 * 3. 提供轻量级的JS子集解释能力，覆盖算法演示所需的常见语法结构
 *
 * 【核心功能】
 * - 变量声明与赋值（const/let/var，支持复合赋值运算符）
 * - 函数定义与调用（支持闭包作用域）
 * - 控制流语句（if/else、while、for/for-in/for-of）
 * - 运算表达式（二元/一元/逻辑/更新/条件/成员访问）
 * - 异常处理（try-catch-finally、throw）
 * - 内置函数与对象方法调用
 *
 * 【使用场景】
 * 当用户在算法可视化编辑器中输入算法代码时，系统会：
 * 1. 使用parser.ts将代码解析为AST
 * 2. 使用本模块的executeNode函数递归执行AST节点
 * 3. 在执行过程中记录每一步的状态变化，用于可视化渲染
 */

/**
 * ReturnValue - 函数返回值包装类
 *
 * 【设计原理】
 * 在解释执行器中，需要一种机制来区分"正常的表达式求值结果"和"函数的return语句返回值"。
 * 因为在BlockStatement（块语句）中执行多条语句时，如果遇到return语句，
 * 需要立即终止当前函数的执行并向上层传递返回值。
 *
 * 通过使用特殊的ReturnValue类实例作为标记，可以在递归调用栈中正确识别和处理return语义：
 * - executeNode遇到ReturnStatement时，创建ReturnValue实例包裹返回值
 * - 外层的BlockStatement检测到ReturnValue实例时，立即停止执行并解包返回
 *
 * 【类比】
 * 这类似于JavaScript引擎内部使用的"完成记录(Completion Record)"概念中的"return"类型。
 */
class ReturnValue {
  /**
   * 构造函数 - 创建返回值包装对象
   * @param value - 被包裹的实际返回值，可以是任意类型（数字、字符串、对象、undefined等）
   */
  constructor(public value: any) {}
}

/**
 * executeNode - AST节点递归执行函数（核心入口）
 *
 * 【业务逻辑概述】
 * 本函数是整个AST执行引擎的核心，采用递归下降的解释执行策略：
 * 1. 接收一个AST节点和当前的执行上下文（变量环境）
 * 2. 根据节点的type字段分发到对应的处理逻辑
 * 3. 对于复合节点（如块语句、循环），递归调用自身处理子节点
 * 4. 返回该节点执行后的求值结果（或undefined对于纯语句）
 *
 * 【执行上下文(context)设计】
 * context是一个简单的JavaScript对象，用于模拟词法作用域(Lexical Scope)：
 * - 键(key)：变量名（字符串）
 * - 值(value)：变量的当前值（任意类型）
 * - 函数调用时会创建新的context副本，实现闭包语义
 *
 * 【支持的AST节点类型完整列表】
 * 声明类：FunctionDeclaration, VariableDeclaration
 * 语句类：BlockStatement, ReturnStatement, ExpressionStatement, IfStatement,
 *         WhileStatement, ForStatement, ForInStatement, ForOfStatement,
 *         BreakStatement, ContinueStatement, ThrowStatement, TryStatement
 * 表达式类：AssignmentExpression, BinaryExpression, LogicalExpression,
 *           UnaryExpression, UpdateExpression, ConditionalExpression,
 *           CallExpression, MemberExpression, ArrayExpression, ObjectExpression,
 *           SequenceExpression, Identifier, Literal
 *
 * @param node - 要执行的AST节点，符合ESTree规范的结构
 *               必须包含type字段标识节点类型
 * @param context - 当前执行上下文（变量作用域对象）
 *                  包含当前可见的所有变量及其值
 *                  函数调用时会基于外层context创建新副本以实现作用域隔离
 * @returns 执行结果，具体含义取决于节点类型：
 *          - 表达式节点：返回求值结果（数字、字符串、布尔值、对象等）
 *          - 语句节点：通常返回undefined，或返回ReturnValue实例（遇到return时）
 *          - 控制流节点：可能返回特殊标记（如break/continue的Symbol）
 *
 * @throws {Error} 当遇到不支持的节点类型或运算符时抛出错误
 * @throws {任意类型} 当执行ThrowStatement时，抛出被throw的表达式值
 *
 * @example
 * // 执行一个简单的二元加法表达式
 * const ast = { type: 'BinaryExpression', operator: '+', left: {...}, right: {...} };
 * const result = executeNode(ast, { x: 10, y: 20 }); // 返回 30
 *
 * @example
 * // 执行函数声明并调用
 * const funcAst = { type: 'FunctionDeclaration', id: { name: 'add' }, ... };
 * executeNode(funcAst, {}); // 将add函数注册到context中
 */
export function executeNode(node: any, context: any): any {
  // 根据AST节点类型进行分发处理（类似于虚拟机的指令分派）
  switch (node.type) {

    // ==================== 函数声明 ====================
    case 'FunctionDeclaration': {
      /**
       * 【函数声明处理逻辑】
       * 将函数注册到当前作用域中，函数体采用闭包方式延迟执行
       *
       * 实现原理：
       * 1. 在context中以函数名作为key，存储一个包装后的JavaScript函数
       * 2. 该包装函数在被调用时：
       *    a. 创建新的执行上下文（继承当前context的所有变量）- 实现闭包
       *    b. 将形参绑定到新context中（按位置映射实参）
       *    c. 递归执行函数体（body节点）
       *
       * 注意：这里使用展开运算符{...context}实现浅拷贝，
       * 保证函数内部的变量修改不会影响外部作用域（基本类型）
       */
      context[node.id.name] = function(...args: any[]) {
        // 创建新的函数级作用域，继承外层所有变量（闭包基础）
        const newContext = { ...context };

        // 将实参按顺序绑定到形参名上
        // 例如：function add(a, b) { return a + b; } 调用 add(1, 2)
        // 则 newContext.a = 1, newContext.b = 2
        node.params.forEach((param: any, index: number) => {
          newContext[param.name] = args[index];
        });

        // 执行函数体（通常是BlockStatement）
        return executeNode(node.body, newContext);
      };
      // 函数声明是语句，没有有意义的返回值
      return;
    }

    // ==================== 块语句 ====================
    case 'BlockStatement': {
      /**
       * 【块语句处理逻辑】
       * 顺序执行块内的所有语句，支持提前返回（return语句）
       *
       * 业务场景：
       * - 函数体通常是一个BlockStatement
       * - if/else的分支体也是BlockStatement
       * - for/while的循环体同样如此
       *
       * 实现要点：
       * 1. 遍历body数组中的每个语句节点
       * 2. 依次执行每个语句
       * 3. 检测ReturnValue实例以支持return语句的穿透效果
       * 4. 返回最后一条语句的结果（或return的值）
       */
      let result;
      for (const statement of node.body) {
        // 递归执行当前语句
        result = executeNode(statement, context);

        // 关键：检测是否遇到return语句
        // 如果当前语句产生了ReturnValue，立即终止块执行并向上传播
        if (result instanceof ReturnValue) return result.value;
      }
      // 正常结束：返回最后一条语句的执行结果
      return result;
    }

    // ==================== 返回语句 ====================
    case 'ReturnStatement': {
      /**
       * 【返回语句处理逻辑】
       * 创建ReturnValue包装实例，用于在调用栈中传播返回值
       *
       * 设计考量：
       * 不能直接返回expression的值，因为这样无法区分
       * "表达式的正常计算结果"和"应该终止函数的return指令"
       *
       * 例如：在 if(true) { return 5; } 中，
       * BlockStatement需要知道这是return而非普通表达式5
       */
      return new ReturnValue(executeNode(node.argument, context));
    }

    // ==================== 变量声明 ====================
    // 变量声明：支持 const / let / var
    case 'VariableDeclaration': {
      /**
       * 【变量声明处理逻辑】
       * 处理变量声明语句，支持单个或多个变量声明（逗号分隔）
       *
       * 支持的语法形式：
       * - let x;                    （无初始化，值为undefined）
       * - const y = 10;             （带初始化表达式）
       * - let a = 1, b = 2, c = 3;  （多变量声明）
       *
       * 实现步骤：
       * 1. 遍历declarations数组（每个元素代表一个变量声明）
       * 2. 如果有初始化表达式(init)，先求值再赋值
       * 3. 如果没有初始化，赋值为undefined
       * 4. 将变量写入当前context
       *
       * 注意：本解释器不区分const/let/var的作用域差异，
       * 统一作为函数级/全局变量处理
       */
      for (const decl of node.declarations) {
        if (decl.init) {
          // 有初始化表达式：先递归求值，再存入context
          // 例如：let x = 1 + 2; 会先计算1+2得到3，再赋给x
          context[decl.id.name] = executeNode(decl.init, context);
        } else {
          // 无初始化：设为undefined（如 let x;）
          context[decl.id.name] = undefined;
        }
      }
      // 变量声明语句本身没有有意义的返回值
      return;
    }

    // ==================== 表达式语句 ====================
    // 表达式语句（如赋值表达式作为语句使用的情况）
    case 'ExpressionStatement':
      /**
       * 【表达式语句处理逻辑】
       * 将表达式作为语句执行，丢弃返回值（或用于副作用）
       *
       * 典型场景：
       * - 函数调用语句：console.log('hello');
       * - 赋值语句：x = 10;
       * - 自增/自减语句：i++;
       *
       * 实现：直接委托给executeNode处理内部表达式
       */
      return executeNode(node.expression, context);

    // ==================== 赋值表达式 ====================
    // 赋值表达式：支持 =, +=, -=, *=, /=
    case 'AssignmentExpression': {
      /**
       * 【赋值表达式处理逻辑】
       * 处理各种赋值操作，包括简单赋值和复合赋值运算符
       *
       * 支持的赋值目标类型：
       * 1. 标识符（Identifier）： x = 10, x += 5
       * 2. 成员表达式（MemberExpression）： obj.prop = 10, arr[0] = 5
       *
       * 处理流程：
       * 1. 先对右侧表达式(right)求值（确保只计算一次）
       * 2. 判断左侧(left)的类型
       * 3. 根据operator执行对应的赋值操作
       * 4. 返回赋值后的值（JavaScript赋值表达式的值就是所赋的值）
       */
      const rightValue = executeNode(node.right, context); // 先计算右值

      // ----- 情况1：赋值目标是简单变量标识符 -----
      if (node.left.type === 'Identifier') {
        switch (node.operator) {
          case '=':
            // 直接赋值：用右值完全替换左值的当前内容
            context[node.left.name] = rightValue;
            break;
          case '+=':
            // 加法赋值：左值 + 右值，注意处理左值为undefined的情况（默认为0）
            context[node.left.name] = (context[node.left.name] || 0) + rightValue;
            break;
          case '-=':
            // 减法赋值
            context[node.left.name] = (context[node.left.name] || 0) - rightValue;
            break;
          case '*=':
            // 乘法赋值
            context[node.left.name] = (context[node.left.name] || 0) * rightValue;
            break;
          case '/=':
            // 除法赋值
            context[node.left.name] = (context[node.left.name] || 0) / rightValue;
            break;
          default:
            throw new Error(`Unsupported assignment operator: ${node.operator}`);
        }
      }
      // ----- 情况2：赋值目标是对象属性或数组元素 -----
      else if (node.left.type === 'MemberExpression') {
        /**
         * 成员赋值处理
         * 需要先解析出目标对象和属性名，然后进行属性赋值
         */
        // 计算目标对象引用（如 obj in obj.prop 或 arr in arr[0]）
        const obj = executeNode(node.left.object, context);
        // 计算属性名：computed=true表示[]语法（动态求值），false表示.语法（直接取名称）
        const prop = node.left.computed ? executeNode(node.left.property, context) : node.left.property.name;

        switch (node.operator) {
          case '=':
            obj[prop] = rightValue;
            break;
          case '+=':
            obj[prop] = (obj[prop] || 0) + rightValue;
            break;
          case '-=':
            obj[prop] = (obj[prop] || 0) - rightValue;
            break;
          default:
            throw new Error(`Unsupported assignment operator on member: ${node.operator}`);
        }
      }

      // 赋值表达式的返回值就是被赋予的值（链式赋值的基础：a = b = c = 10）
      return rightValue;
    }

    // ==================== 二元运算表达式 ====================
    // 二元运算表达式
    case 'BinaryExpression': {
      /**
       * 【二元运算处理逻辑】
       * 处理两个操作数之间的二元运算
       *
       * 支持的运算符类别：
       * 1. 算术运算：+, -, *, /, %, **
       * 2. 比较运算：<, <=, >, >=, ===, !==, ==, !=
       * 3. 逻辑运算：&&, ||（注意：这里也处理了短路逻辑，但LogicalExpression更专业）
       *
       * 执行顺序：
       * 1. 先分别计算左操作数和右操作数（从左到右）
       * 2. 应用运算符得到结果
       * 3. 返回计算结果
       *
       * 注意：JavaScript的运算符优先级已在AST构建阶段由解析器处理，
       * 这里不需要考虑优先级问题，只需执行即可
       */
      const left = executeNode(node.left, context);   // 计算左操作数
      const right = executeNode(node.right, context);  // 计算右操作数

      switch (node.operator) {
        // ---- 算术运算符 ----
        case '+': return left + right;     // 加法（也可用于字符串拼接）
        case '-': return left - right;     // 减法
        case '*': return left * right;     // 乘法
        case '/': return left / right;     // 除法
        case '%': return left % right;     // 取模（求余数）
        case '**': return left ** right;   // 幂运算（ES2016）

        // ---- 关系比较运算符 ----
        case '<': return left < right;     // 小于
        case '<=': return left <= right;   // 小于等于
        case '>': return left > right;     // 大于
        case '>=': return left >= right;   // 大于等于

        // ---- 相等性比较运算符 ----
        case '===': return left === right; // 严格相等（推荐）
        case '!==': return left !== right; // 严格不等
        case '==': return left == right;   // 宽松相等（会做类型转换）
        case '!=': return left != right;   // 宽松不等

        // ---- 逻辑运算符（非短路版本）----
        case '&&': return left && right;   // 逻辑与
        case '||': return left || right;   // 逻辑或

        default:
          throw new Error(`Unsupported binary operator: ${node.operator}`);
      }
    }

    // ==================== 逻辑表达式（短路求值）====================
    // 逻辑表达式（短路求值）
    case 'LogicalExpression': {
      /**
       * 【逻辑表达式处理逻辑】
       * 实现JavaScript的逻辑与(&&)和逻辑或(||)的**短路求值**语义
       *
       * 【短路求值原理】
       * 与BinaryExpression中的&&/||不同，这里实现了真正的短路行为：
       *
       * 1. 逻辑与 (&&):
       *    - 先计算左操作数
       *    - 如果左操作数为falsy（false, 0, '', null, undefined, NaN），
       *      直接返回左操作数，**不再计算右操作数**
       *    - 只有左操作数为truthy时，才计算并返回右操作数
       *    - 典型应用：if (obj && obj.property) { ... }
       *
       * 2. 逻辑或 (||):
       *    - 先计算左操作数
       *    - 如果左操作数为truthy，直接返回左操作数，**跳过右操作数**
       *    - 只有左操作数为falsy时，才计算并返回右操作数
       *    - 典型应用：const result = defaultValue || fallbackValue;
       *
       * 为什么需要单独处理而不是放在BinaryExpression中？
       * 因为短路求值要求**有条件地**评估第二个操作数，
       * 这对于有副作用的表达式至关重要（如函数调用）
       */
      if (node.operator === '&&') {
        // 逻辑与短路求值
        const left = executeNode(node.left, context);
        // JavaScript的&&运算：左值为falsy则直接返回左值（短路）
        // 否则继续计算右值并返回
        return left && executeNode(node.right, context);
      }
      if (node.operator === '||') {
        // 逻辑或短路求值
        const left = executeNode(node.left, context);
        // JavaScript的||运算：左值为truthy则直接返回左值（短路）
        // 否则继续计算右值并返回
        return left || executeNode(node.right, context);
      }
      throw new Error(`Unsupported logical operator: ${node.operator}`);
    }

    // ==================== 一元运算表达式 ====================
    // 一元运算表达式
    case 'UnaryExpression': {
      /**
       * 【一元运算处理逻辑】
       * 处理只有一个操作数的运算符
       *
       * 支持的一元运算符：
       * 1. ! (逻辑非)：将操作数转为布尔值后取反
       * 2. - (算术负号)：取负数（如 -x）
       * 3. + (算术正号)：转为数字（如 +"123" → 123）
       * 4. typeof：返回操作数的类型字符串
       *
       * 执行流程：
       * 1. 对唯一的操作数(argument)进行求值
       * 2. 应用一元运算符
       * 3. 返回运算结果
       */
      if (node.operator === '!') return !executeNode(node.argument, context);     // 逻辑非
      if (node.operator === '-') return -executeNode(node.argument, context);     // 取负
      if (node.operator === '+') return +executeNode(node.argument, context);     // 转数字
      if (node.operator === 'typeof') return typeof executeNode(node.argument, context); // 类型检查
      throw new Error(`Unsupported unary operator: ${node.operator}`);
    }

    // ==================== 更新表达式 ====================
    // 更新表达式 (i++, ++i, i--, --i)
    case 'UpdateExpression': {
      /**
       * 【更新表达式处理逻辑】
       * 处理自增(++)和自减(--)运算符
       *
       * 【前置 vs 后置的区别】
       * 这是更新表达式最关键的部分：
       *
       * 1. 前缀运算（prefix=true）：++i 或 --i
       *    - 先修改变量的值
       *    - 返回**修改后**的新值
       *    - 场景：常用于循环计数器的初始化或独立表达式
       *
       * 2. 后置运算（prefix=false）：i++ 或 i--
       *    - 先返回变量的**当前**旧值
       *    - 再修改变量的值
       *    - 场景：常用于在表达式中同时使用当前值并递增（如 arr[i++]）
       *
       * 【示例对比】
       * let i = 5;
       * let a = ++i;  // a=6, i=6  (前置：先增后用)
       * let b = j++;  // b=5, j=6  (后置：先用后增)
       */
      const value = executeNode(node.argument, context); // 获取变量当前值
      const name = node.argument.name;                   // 获取变量名

      if (node.prefix) {
        // ====== 前缀模式：++i / --i ======
        // 计算新值（原值+1或-1）
        const newValue = node.operator === '++' ? value + 1 : value - 1;
        // 更新context中的变量
        context[name] = newValue;
        // 返回更新后的新值
        return newValue;
      } else {
        // ====== 后置模式：i++ / i-- ======
        // 先更新context中的变量（但返回的是旧值）
        context[name] = node.operator === '++' ? value + 1 : value - 1;
        // 返回更新前的原始值（这是后置运算的关键特征）
        return value;
      }
    }

    // ==================== 标识符引用 ====================
    // 标识符引用
    case 'Identifier': {
      /**
       * 【标识符处理逻辑】
       * 从当前执行上下文中查找并返回变量的值
       *
       * 这是变量访问的最基本操作：
       * 当AST中出现一个标识符（变量名）时，
       * 解释器需要在context对象中查找对应的值
       *
       * 【作用域查找规则】
       * 由于本解释器使用简单的扁平context对象（非作用域链），
       * 变量查找仅限于当前传入的context。
       * 函数调用时通过{...context}创建新对象来模拟作用域隔离。
       *
       * 【潜在问题】
       * 如果变量未定义，这里会返回undefined，
       * 与真实JavaScript的ReferenceError行为略有不同
       */
      return context[node.name];
    }

    // ==================== 字面量 ====================
    // 字面量
    case 'Literal': {
      /**
       * 【字面量处理逻辑】
       * 直接返回字面量的值，无需任何计算
       *
       * 字面量(Literal)是源代码中表示固定值的符号：
       * - 数字：42, 3.14, -100
       * - 字符串：'hello', "world"
       * - 布尔值：true, false
       * - null：null
       * - 正则表达式：/pattern/flags（如果解析器支持）
       *
       * 这是AST中最简单的叶子节点，直接返回其value属性即可
       */
      return node.value;
    }

    // ==================== 条件语句 ====================
    // 条件语句
    case 'IfStatement': {
      /**
       * 【if语句处理逻辑】
       * 实现条件分支控制流
       *
       * 【语法结构】
       * if (test) {
       *   consequent  // then分支
       * } else {
       *   alternate   // else分支（可选）
       * }
       *
       * 【执行流程】
       * 1. 计算条件表达式(test)的值
       * 2. 如果为truthy（真），执行consequent（then分支）
       * 3. 如果为falsy（假）且存在alternate，执行alternate（else分支）
       * 4. 都不存在或不满足时，不执行任何操作
       *
       * 【注意】
       * JavaScript的truthy/falsy规则：
       * - falsy: false, 0, -0, 0n, "", null, undefined, NaN
       * - truthy: 所有其他值（包括空对象、空数组等）
       */
      const test = executeNode(node.test, context); // 求值条件表达式

      if (test) {
        // 条件为真：执行then分支
        return executeNode(node.consequent, context);
      } else if (node.alternate) {
        // 条件为假且存在else分支：执行else部分
        return executeNode(node.alternate, context);
      }
      // 无匹配分支：返回undefined
      return;
    }

    // ==================== 条件三元表达式 ====================
    // 条件三元表达式
    case 'ConditionalExpression': {
      /**
       * 【三元表达式处理逻辑】
       * 实现三元运算符 (条件 ? 表达式1 : 表达式2)
       *
       * 【与if语句的区别】
       * 三元表达式是**表达式**（有返回值），而if是**语句**（无返回值）
       * 因此三元表达式可以嵌套在其他表达式中使用
       *
       * 【典型用法】
       * const status = age >= 18 ? 'adult' : 'minor';
       * const max = a > b ? a : b;
       *
       * 【执行流程】
       * 与IfStatement类似，但必须返回两个分支之一的值
       */
      return executeNode(node.test, context)
        ? executeNode(node.consequent, context)   // 条件真：返回consequent的值
        : executeNode(node.alternate, context);    // 条件假：返回alternate的值
    }

    // ==================== while 循环 ====================
    // while 循环
    case 'WhileStatement': {
      /**
       * 【while循环处理逻辑】
       * 实现先判断后执行的while循环结构
       *
       * 【语法结构】
       * while (test) {
       *   body  // 循环体
       * }
       *
       * 【执行流程】
       * 1. 计算条件表达式(test)
       * 2. 如果为true，执行循环体(body)
       * 3. 回到步骤1重复
       * 4. 如果为false，退出循环
       *
       * 【特殊情况处理】
       * - 循环体内遇到return语句（ReturnValue实例）：立即返回返回值
       * - 循环体内遇到break/continue：通过Symbol标记处理（见对应case）
       *
       * 【注意】
       * while循环可能永远不会执行（初始条件就为false），
       * 也可能无限循环（条件永远为true）
       */
      let result;
      // 循环：每次迭代都重新计算条件
      while (executeNode(node.test, context)) {
        // 执行循环体
        result = executeNode(node.body, context);

        // 检测return语句：如果在循环体内遇到return，立即退出函数
        if (result instanceof ReturnValue) return result.value;
      }
      // 循环正常结束：返回最后一次迭代的result（或undefined）
      return result;
    }

    // ==================== for 循环 ====================
    // for 循环 (for(;;), for...in, for...of)
    case 'ForStatement': {
      /**
       * 【for循环处理逻辑】
       * 实现经典的C风格for循环
       *
       * 【语法结构】
       * for (init; test; update) {
       *   body  // 循环体
       * }
       *
       * 【四个组成部分】
       * 1. init（初始化）：循环开始前执行一次（通常声明计数器变量）
       * 2. test（条件）：每次迭代前检查，为false时退出
       * 3. update（更新）：每次迭代后执行（通常递增/递减计数器）
       * 4. body（循环体）：每次迭代执行的语句块
       *
       * 【执行流程】
       * 1. 执行init（仅一次）
       * 2. 检查test（如果没有test则视为true，即无限循环）
       * 3. 如果test为真，执行body
       * 4. 执行update
       * 5. 回到步骤2
       *
       * 【等价于while循环】
       * for (init; test; update) { body }
       * 等价于：
       * init; while (test) { body; update; }
       */
      // 步骤1：执行初始化表达式（仅执行一次）
      if (node.init) executeNode(node.init, context);

      let result;
      // 步骤2-5：循环（条件检查 → 循环体 → 更新）
      // 如果没有test表达式，默认为true（无限循环）
      while (node.test ? executeNode(node.test, context) : true) {
        // 执行循环体
        result = executeNode(node.body, context);

        // 检测return语句
        if (result instanceof ReturnValue) return result.value;

        // 步骤4：执行更新表达式（如 i++, i += 2 等）
        if (node.update) executeNode(node.update, context);
      }
      // 循环结束
      return result;
    }

    // ==================== for...in 循环 ====================
    case 'ForInStatement': {
      /**
       * 【for...in循环处理逻辑】
       * 遍历对象的可枚举属性（键名）
       *
       * 【语法结构】
       * for (key in object) {
       *   body  // 循环体
       * }
       *
       * 【业务场景】
       * - 遍历对象的属性名
       * - 检查对象有哪些键
       * - 注意：也会遍历继承的可枚举属性（原型链上的）
       *
       * 【执行流程】
       * 1. 计算右侧对象表达式
       * 2. 使用JavaScript的for...in遍历所有可枚举属性
       * 3. 每次迭代将当前属性名赋给左侧变量
       * 4. 执行循环体
       *
       * 【注意】
       * for...in遍历的顺序不保证（虽然大多数引擎按插入顺序）
       * 且会包含非整数索引的属性和继承的属性
       */
      let result;
      // 计算要遍历的对象
      for (const key in executeNode(node.right, context)) {
        // 将当前属性名(key)赋给循环变量
        context[node.left.name] = key;
        // 执行循环体
        result = executeNode(node.body, context);
        // 检测return语句
        if (result instanceof ReturnValue) return result.value;
      }
      return result;
    }

    // ==================== for...of 循环 ====================
    case 'ForOfStatement': {
      /**
       * 【for...of循环处理逻辑】
       * 遍历可迭代对象的值（不是键）
       *
       * 【语法结构】
       * for (value of iterable) {
       *   body  // 循环体
       * }
       * 或：
       * for (const value of iterable) { ... }
       *
       * 【与for...in的区别】
       * - for...in：遍历对象的键（字符串），适用于普通对象
       * - for...of：遍历可迭代对象的值，适用于Array、Map、Set、String等
       *
       * 【支持的左侧模式】
       * 1. 标识符：for (x of array)  →  直接赋值给x
       * 2. 变量声明：for (const x of array)  →  声明并赋值
       *
       * 【典型用法】
       * 遍历数组元素（最常用场景）：
       * for (const num of [1, 2, 3]) { console.log(num); }
       * 输出：1, 2, 3（而非0, 1, 2这种索引）
       */
      let result;
      // 计算可迭代对象（数组、字符串、Map、Set等）
      for (const value of executeNode(node.right, context)) {
        // 处理两种左侧声明模式
        if (node.left.type === 'VariableDeclaration') {
          // 左侧是变量声明（如 const item of items）
          // 提取声明中的变量名并赋值
          context[node.left.declarations[0].id.name] = value;
        } else {
          // 左侧是简单标识符（如 item of items）
          context[node.left.name] = value;
        }
        // 执行循环体
        result = executeNode(node.body, context);
        // 检测return语句
        if (result instanceof ReturnValue) return result.value;
      }
      return result;
    }

    // ==================== 函数调用 ====================
    // 函数调用
    case 'CallExpression': {
      /**
       * 【函数调用处理逻辑】
       * 处理函数或方法的调用表达式
       *
       * 【调用类型支持】
       * 1. 直接函数调用：func(arg1, arg2)
       *    - callee是Identifier，从context中查找函数
       *
       * 2. 方法调用：object.method(arg1, arg2)
       *    - callee是MemberExpression，先获取对象再调用方法
       *
       * 3. 内置函数调用：console.log(), Math.max()等
       *    - 通过MemberExpression路径找到内置对象的方法
       *
       * 【执行流程】
       * 1. 解析被调用的函数引用(callee)
       * 2. 从左到右计算所有参数(arguments)的值
       * 3. 判断函数类型并执行调用
       * 4. 返回函数的返回值
       *
       * 【参数求值顺序】
       * JavaScript规范保证参数从左到右求值，
       * 这里使用map保持这个顺序
       */
      // 步骤1：解析被调用的函数引用
      const func = executeNode(node.callee, context);
      // 步骤2：计算所有实际参数的值（从左到右）
      const args = node.arguments.map((arg: any) => executeNode(arg, context));

      // ----- 类型1：普通JavaScript函数 -----
      // 包括用户自定义函数（通过FunctionDeclaration注册到context的）和内置函数
      if (typeof func === 'function') {
        // 使用spread运算符将参数数组展开为独立的函数参数
        return func(...args);
      }

      // ----- 类型2：对象方法调用 -----
      // 如 console.log(), array.push(), Math.max() 等
      if (node.callee.type === 'MemberExpression') {
        // 解析方法所属的对象
        const obj = executeNode(node.callee.object, context);
        // 解析方法名：computed=true表示[]语法（动态属性），否则取属性名字符串
        const method = node.callee.computed
          ? executeNode(node.callee.property, context)
          : node.callee.property?.name;

        // 安全检查：确保对象和方法都存在且方法是可调用的
        if (obj && typeof obj[method] === 'function') {
          // 调用对象的方法，注意this绑定（这里简化处理，未严格绑定this）
          return obj[method](...args);
        }
      }

      // 无法识别的调用目标：抛出错误
      throw new Error(`Unable to call non-function: ${typeof func}`);
    }

    // ==================== 成员访问表达式 ====================
    // 成员访问表达式 (obj.prop, obj[prop])
    case 'MemberExpression': {
      /**
       * 【成员访问处理逻辑】
       * 实现对象属性的读取（点语法和方括号语法）
       *
       * 【两种访问语法】
       * 1. 点语法（computed=false）：obj.property
       *    - 属性名是固定的标识符
       *    - 如：user.name, array.length
       *
       * 2. 方括号语法（computed=true）：obj[expression]
       *    - 属性名是动态计算的任意表达式
       *    - 如：array[index], obj['first-name'], data[key]
       *    - 支持变量属性名：obj[propertyName]
       *
       * 【执行流程】
       * 1. 计算对象引用(object)
       * 2. 根据computed标志决定如何获取属性名
       * 3. 返回对象上该属性的值
       *
       * 【安全处理】
       * 如果对象为null或undefined，返回undefined而不是抛出TypeError
       * （真实JS会抛出Cannot read property of null/undefined）
       */
      // 计算目标对象
      const obj = executeNode(node.object, context);
      // 获取属性名
      const property = node.computed
        ? executeNode(node.property, context)  // 方括号语法：动态计算属性名
        : node.property?.name;                // 点语法：直接使用属性名字符串

      // 安全检查：防止null/undefined上的属性访问导致崩溃
      if (obj == null) return undefined;

      // 返回属性值
      return obj[property];
    }

    // ==================== 数组表达式 ====================
    // 数组表达式 [a, b, c]
    case 'ArrayExpression': {
      /**
       * 【数组表达式处理逻辑】
       * 创建数组字面量
       *
       * 【语法示例】
       * []              → 空数组
       * [1, 2, 3]       → 数字数组
       * [a, b+c, fn()]  → 元素可以是任意表达式
       * [1, , 3]        → 稀疏数组（中间有空位，此处返回null）
       *
       * 【执行流程】
       * 1. 遍历elements数组
       * 2. 对每个非null元素递归求值
       * 3. null元素（稀疏数组空位）转为null
       * 4. 返回组装好的数组
       *
       * 【注意】
       * 真实JavaScript的稀疏数组空位是empty（undefined的特殊状态），
       * 这里简化处理为null
       */
      return node.elements.map((el: any) => el ? executeNode(el, context) : null);
    }

    // ==================== 对象表达式 ====================
    // 对象表达式 { a: 1, b: 2 }
    case 'ObjectExpression': {
      /**
       * 【对象表达式处理逻辑】
       * 创建对象字面量
       *
       * 【语法示例】
       * {}                           → 空对象
       * { name: 'Tom', age: 18 }     → 简单键值对
       * { ['comp' + 'uted']: 1 }     → 计算属性名（ES2015+）
       * { fn() {} }                  → 方法定义（简写）
       *
       * 【支持的属性键类型】
       * 1. 标识符(Identifier)：{ name: value }  → key = 'name'
       * 2. 字面量(Literal)：{ 1: value }       → key = 1
       * （计算属性名由解析器预先处理为Literal）
       *
       * 【执行流程】
       * 1. 创建空对象
       * 2. 遍历properties数组
       * 3. 对每个Property节点提取key并求值value
       * 4. 组装成最终对象返回
       */
      const obj: Record<string, any> = {};
      for (const prop of node.properties) {
        if (prop.type === 'Property') {
          // 提取属性键：标识符取name，字面量取value
          const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value;
          // 计算属性值并赋值
          obj[key] = executeNode(prop.value, context);
        }
      }
      return obj;
    }

    // ==================== 序列表达式 ====================
    // 序列表达式 (a, b, c) — 返回最后一个表达式的值
    case 'SequenceExpression': {
      /**
       * 【序列表达式处理逻辑】
       * 实现逗号运算符：从左到右计算多个表达式，返回最后一个的值
       *
       * 【语法示例】
       * (a, b, c)        → 依次计算a、b、c，返回c的值
       * (x = 1, y = 2)   → 赋值x=1，赋值y=2，返回2
       * (i++, arr[i])    → 先自增i，再用新的i作为索引
       *
       * 【典型应用场景】
       * 1. for循环的更新表达式：for(i=0, j=10; ...)
       * 2. 在只能写一个表达式的地方执行多个操作
       * 3. IIFE中的初始化序列
       *
       * 【注意】
       * 序列表达式主要用于副作用（前面的表达式），
       * 最终值只由最后一个表达式决定
       */
      let lastResult;
      // 从左到右依次计算每个表达式
      for (const expr of node.expressions) {
        lastResult = executeNode(expr, context);
      }
      // 返回最后一个表达式的值（前面表达式的值被丢弃，但副作用保留）
      return lastResult;
    }

    // ==================== break 语句 ====================
    // break / continue (在循环中处理)
    case 'BreakStatement': {
      /**
       * 【break语句处理逻辑】
       * 终止当前所在的循环或switch语句
       *
       * 【实现方式】
       * 使用唯一Symbol作为标记，因为Symbol具有以下特性：
       * 1. 全局唯一：不会与其他任何值冲突
       * 2. 可辨识：instanceof/typeof无法误判
       * 3. 轻量：不需要创建额外的类
       *
       * 【工作原理】
       * 1. BreakStatement返回Symbol('break')
       * 2. 外层循环(for/while)的执行代码检测到这个Symbol
       * 3. 循环跳出，不再继续迭代
       *
       * 【注意】
       * 当前实现的break检测逻辑需要在使用处（循环语句）显式检查
       */
      return Symbol('break');
    }

    // ==================== continue 语句 ====================
    case 'ContinueStatement': {
      /**
       * 【continue语句处理逻辑】
       * 跳过当前循环迭代的剩余部分，进入下一次迭代
       *
       * 【实现方式】
       * 与BreakStatement类似，使用Symbol标记
       *
       * 【工作原理】
       * 1. ContinueStatement返回Symbol('continue')
       * 2. 外层循环检测到此标记后，跳过本次剩余代码
       * 3. 直接进入下一次迭代的条件检查
       *
       * 【注意】
       * 当前实现需要在循环语句中添加对continue Symbol的检测逻辑
       */
      return Symbol('continue');
    }

    // ==================== throw 语句 ====================
    // throw 语句
    case 'ThrowStatement': {
      /**
       * 【throw语句处理逻辑】
       * 抛出异常，中断正常执行流程
       *
       * 【语法示例】
       * throw new Error('Something went wrong');
       * throw 'Invalid input';
       * throw 404;
       *
       * 【执行流程】
       * 1. 计算throw后面的表达式（异常对象/值）
       * 2. 使用JavaScript的原生throw抛出该值
       * 3. 异常会沿着调用栈向上传播
       * 4. 直到被catch捕获或导致程序终止
       *
       * 【与TryStatement配合】
       * throw抛出的异常会被最近的外层try-catch捕获
       * 见下方TryStatement的处理逻辑
       */
      throw executeNode(node.argument, context);
    }

    // ==================== try-catch-finally 语句 ====================
    // try-catch 语句
    case 'TryStatement': {
      /**
       * 【try-catch-finally处理逻辑】
       * 实现异常处理结构
       *
       * 【语法结构】
       * try {
       *   block       // 可能抛出异常的代码块
       * } catch (param) {
       *   handler     // 异常处理代码（可选）
       * } finally {
       *   finalizer   // 无论是否异常都会执行的清理代码（可选）
       * }
       *
       * 【执行流程详解】
       *
       * 正常情况（无异常）：
       * 1. 执行block
       * 2. 执行finalizer（如果有）
       * 3. 返回block的结果
       *
       * 有异常且有catch：
       * 1. 开始执行block
       * 2. block内某处抛出异常e
       * 3. 中断block的执行
       * 4. 创建catch专用的context（继承原context）
       * 5. 将异常e绑定到catch参数(param)上
       * 6. 执行handler（catch块）
       * 7. 执行finalizer（如果有）
       * 8. 返回handler的结果
       *
       * 有异常但无catch：
       * 1. 执行finalizer（如果有）
       * 2. 重新抛出异常e（向外层传播）
       *
       * 【finally的特殊性】
       * finally块无论是否有异常都会执行，
       * 即使catch中有return语句，finally也会在return之前执行
       */
      try {
        // 尝试执行try块
        return executeNode(node.block, context);
      } catch (e) {
        // 捕获到异常
        if (node.handler) {
          // 有catch处理器：创建新的catch作用域
          const catchContext = { ...context }; // 继承原作用域
          // 将异常对象绑定到catch参数名（如 catch (err) 中的err）
          if (node.handler.param) {
            catchContext[node.handler.param.name] = e;
          }
          // 执行catch块
          return executeNode(node.handler.body, catchContext);
        }
        // 无catch但有finally：先执行finally，再重新抛出异常
        if (node.finalizer) executeNode(node.finalizer, context);
        throw e; // 向外层传播异常
      } finally {
        // finally块：无论try/catch如何结束都会执行
        if (node.finalizer) executeNode(node.finalizer, context);
      }
    }

    // ==================== 未识别的节点类型 ====================
    default: {
      /**
       * 【未知节点类型处理】
       * 当遇到未实现的AST节点类型时，抛出明确的错误信息
       *
       * 这有助于开发者快速定位不支持的语言特性
       * 并决定是否需要扩展解释器的能力
       */
      throw new Error(`Unsupported node type: ${node.type}`);
    }
  }
}
