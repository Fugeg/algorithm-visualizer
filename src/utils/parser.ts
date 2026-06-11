/**
 * @file parser.ts
 * @description JavaScript源代码解析器 - AST（抽象语法树）生成模块
 *
 * 【模块角色】
 * 本模块是算法可视化系统的"编译器前端"，负责将用户输入的JavaScript源代码字符串
 * 转换为结构化的AST（Abstract Syntax Tree，抽象语法树）。
 *
 * 【设计目的】
 * 1. 提供代码文本到结构化数据（AST）的转换能力
 * 2. 为后续的解释执行（executor.ts）提供标准化的输入格式
 * 3. 支持现代JavaScript语法特性（ES2020+），满足算法演示代码的编写需求
 *
 * 【核心功能】
 * - 将JavaScript源代码字符串解析为符合ESTree规范的AST节点树
 * - 支持ECMAScript 2020（ES11）语法规范
 * - 支持模块化代码（import/export语句）
 *
 * 【技术选型说明】
 * 使用Acorn作为底层解析引擎：
 * - Acorn是一个轻量级、高性能的JavaScript解析器
 * - 完全支持ES2020语法，体积小巧（~50KB minified）
 * - 输出符合ESTree标准的AST格式，与大多数JS工具链兼容
 * - 相比Babel Parser（@babel/parser），Acorn更轻量且无外部依赖
 *
 * 【在项目中的位置】
 * 用户代码 → [parser.ts 解析] → AST → [executor.ts 执行] → 可视化渲染
 *
 * 【使用场景示例】
 * 用户在编辑器中输入：
 *   function bubbleSort(arr) {
 *     for (let i = 0; i < arr.length; i++) {
 *       for (let j = 0; j < arr.length - i - 1; j++) {
 *         if (arr[j] > arr[j + 1]) {
 *           [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
 *         }
 *       }
 *     }
 *     return arr;
 *   }
 *
 * 本模块将其转换为包含FunctionDeclaration、ForStatement、IfStatement等节点的AST树。
 */

/**
 * 引入Acorn解析器库
 *
 * Acorn是一个用纯JavaScript编写的高性能JavaScript解析器，
 * 由Marijn Haverbeke（CodeMirror作者）开发和维护。
 *
 * 主要特点：
 * - 极快的解析速度（比Esprima快约2-3倍）
 * - 输出完全兼容ESTree规范的AST
 * - 支持通过插件扩展（如JSX、TypeScript、Flow等）
 * - 零依赖，适合浏览器和Node.js环境
 */
import * as acorn from 'acorn';

/**
 * parseCode - JavaScript源代码解析函数
 *
 * 【业务逻辑概述】
 * 本函数是对Acorn解析器的封装，将原始的JavaScript代码字符串转换为AST对象。
 * 它配置了适当的解析选项以支持现代JavaScript语法。
 *
 * 【解析流程详解】
 * 1. 接收JavaScript源代码字符串作为输入
 * 2. 配置Acorn解析选项（ECMAScript版本、源码类型）
 * 3. 调用Acorn进行词法分析和语法分析
 * 4. 返回完整的AST根节点（Program节点）
 *
 * 【AST结构说明】
 * 生成的AST遵循ESTree（European Computer Manufacturers Association Standard for Tree）规范，
 * 是一个嵌套的JSON-like对象结构。典型结构如下：
 *
 * {
 *   type: 'Program',           // 根节点类型：程序
 *   sourceType: 'module',      // 源码类型：模块或脚本
 *   body: [                    // 顶层语句数组
 *     {                        // 示例：一个函数声明
 *       type: 'FunctionDeclaration',
 *       id: { type: 'Identifier', name: 'myFunc' },
 *       params: [...],
 *       body: { type: 'BlockStatement', body: [...] }
 *     },
 *     ...
 *   ]
 * }
 *
 * 【支持的语法特性】（基于ecmaVersion: 2020配置）
 * - 变量声明：let, const, var
 * - 箭头函数：(args) => expression
 * - 异步/等待：async/await, Promise
 * - 解构赋值：const {a, b} = obj, const [x, y] = arr
 * - 展开运算符：...args, {...obj}
 * - 可选链操作符：obj?.prop?.method()
 * - 空值合并操作符：value ?? defaultValue
 * - BigInt字面量：100n
 * - 动态导入：import('./module.js')
 * - for...of循环（含异步版本for await...of）
 * - 类定义：class MyClass extends BaseClass {}
 * - 模板字符串：`Hello ${name}!`
 * - 标签模板：tag`template`
 *
 * @param code - 要解析的JavaScript源代码字符串
 *               可以是单行表达式、多行函数、完整脚本或模块
 *               例如："function add(a, b) { return a + b; }"
 *               或："const x = 10; console.log(x);"
 *
 * @returns {Program} 符合ESTree规范的AST根节点对象
 *          包含以下主要属性：
 *          - type: 固定为'Program'（程序节点）
 *          - sourceType: 'module' | 'script'（源码类型）
 *          - body: Array<Statement>（顶层语句数组）
 *          - 其他元信息（sourceFile、comments、tokens等，取决于配置）
 *
 * @throws {SyntaxError} 当源代码存在语法错误时抛出
 *         错误信息包含：
 *         - 错误描述（如"Unexpected token"）
 *         - 出错位置（行号和列号）
 *         - 相关的源代码片段
 *
 * @example
 * // 基本用法：解析简单的算术表达式
 * const ast = parseCode('1 + 2');
 * // 返回:
 * // {
 * //   type: 'Program',
 * //   body: [{
 * //     type: 'ExpressionStatement',
 * //     expression: {
 * //       type: 'BinaryExpression',
 * //       operator: '+',
 * //       left: { type: 'Literal', value: 1 },
 * //       right: { type: 'Literal', value: 2 }
 * //     }
 * //   }]
 * // }
 *
 * @example
 * // 解析函数声明
 * const ast = parseCode(`
 *   function factorial(n) {
 *     if (n <= 1) return 1;
 *     return n * factorial(n - 1);
 *   }
 * `);
 * // 返回包含FunctionDeclaration节点的AST
 *
 * @example
 * // 解析现代ES2020语法（可选链、空值合并等）
 * const ast = parseCode('const name = user?.profile?.name ?? "Anonymous";');
 *
 * @see https://github.com/acornjs/acorn - Acorn官方仓库
 * @see https://github.com/estree/estree - ESTree规范文档
 * @see executor.ts - 解析后的AST会传递给执行引擎进行解释执行
 */
export function parseCode(code: string) {
  /**
   * 调用Acorn的parse方法进行实际的解析工作
   *
   * 【解析器配置选项说明】
   *
   * ecmaVersion: 2020
   * - 指定要使用的ECMAScript语言版本
   * - 2020对应ECMAScript第11版（ES11），发布于2020年6月
   * - 选择此版本的原因：
   *   a. 覆盖了算法演示所需的大部分现代语法特性
   *   b. 包括可选链(?.)、空值合并(??)、BigInt等实用功能
   *   c. 兼容性好，主流浏览器均已支持
   * - 其他可选项：5(ES5), 2015(ES6), 2016-2019, 2021, 2022, 'latest'
   *
   * sourceType: 'module'
   * - 指定源代码的类型模式
   * - 'module': 启用严格模式，支持import/export语句
   * - 'script': 传统脚本模式，不支持模块语法
   * - 选择'module'的原因：
   *   a. 算法可视化可能需要引入辅助模块
   *   b. 自动启用严格模式（避免一些不安全的行为）
   *   c. 更符合现代JavaScript开发习惯
   *
   * 【内部处理流程】
   * 1. 词法分析(Lexical Analysis/Tokenization):
    *    将字符流转换为标记(Token)流
   *    例如："let x = 10;" → [LetKeyword, Identifier(x), Punctuation(=), Number(10), Semicolon]
   *
   * 2. 语法分析(Syntactic Analysis/Parsing):
   *    根据JavaScript语法规则，将标记流组织成AST树形结构
   *    应用运算符优先级、结合性规则构建正确的表达式树
   *
   * 3. 语义验证(Semantic Validation):
   *    在解析过程中检查基本的语义正确性
   *    如：break必须在循环内、标识符合法性等
   *
   * 4. AST构建(AST Construction):
   *    生成最终的ESTree兼容的AST对象
   */
  return acorn.parse(code, {
    /**
     * ECMAScript版本设置为2020（第11版）
     * 支持的关键特性包括：
     * - String.prototype.matchAll (ES2020)
     * - import() 动态导入 (ES2020)
     * - BigInt (ES2020)
     * - Promise.allSettled (ES2020)
     * - globalThis (ES2020)
     * - 可选链操作符 ?. (ES2020)
     * - 空值合并操作符 ?? (ES2020)
     */
    ecmaVersion: 2020,

    /**
     * 源代码类型设为'module'（模块模式）
     *
     * 与'script'（脚本模式）的区别：
     * 1. 自动启用严格模式（'use strict'隐式生效）
     * 2. 允许在顶层使用import/export语句
     * 3. this在顶层指向undefined而非window/global
     * 4. 不允许使用with语句
     * 5. 函数参数不能有同名属性
     */
    sourceType: 'module'
  });
}
