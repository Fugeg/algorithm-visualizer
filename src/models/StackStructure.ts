/**
 * @file StackStructure.ts
 * @description 栈（Stack）数据结构模型 - 算法可视化核心组件
 *
 * 【项目角色】
 * 本模块实现栈（后进先出 LIFO）数据结构的完整逻辑，是算法可视化项目中
 * 栈相关算法的数据层。通过观察者模式支持实时状态广播，使 UI 层能够动态展示
 * 栈的入栈、出栈、查看栈顶等操作过程。
 *
 * 【设计模式】
 * - 观察者模式（Observer Pattern）：subscribe/notify 机制实现响应式状态更新
 * - 封装模式（Encapsulation Pattern）：隐藏内部实现细节，暴露标准接口
 *
 * 【核心职责】
 * 1. 维护栈的内部数据存储和容量限制
 * 2. 实现标准的栈操作接口（push、pop、peek）
 * 3. 提供栈的状态查询方法（size、isEmpty、isFull）
 * 4. 通过高亮索引机制支持操作过程的可视化展示
 * 5. 确保操作的边界安全性（溢出/下溢保护）
 *
 * 【业务场景】
 * - 函数调用管理：展示调用栈的工作原理
 * - 表达式求值：演示运算符优先级处理
 * - 撤销操作：展示撤销/重做功能的实现
 * - 浏览器历史：展示后退按钮的实现原理
 *
 * 【LIFO 原则】
 * Last In, First Out（后进先出）
 * - 最后插入的元素最先被取出
 * - 类似于一叠盘子，只能从顶部取放
 * - 插入和删除都只能在栈顶进行
 */

/**
 * 栈操作类型枚举接口
 * @interface StackOperation
 * @description 定义栈支持的所有操作类型标识
 */
interface StackOperation {
  /** 操作类型：入栈 | 出栈 | 查看栈顶 */
  type: 'push' | 'pop' | 'peek';
  /** 操作涉及的值（可选，用于 push 操作） */
  value?: any;
}

/**
 * 栈状态接口
 * @interface StackState
 * @description 向外部暴露的完整状态快照
 */
interface StackState {
  /** 当前栈中的所有元素（从底到顶排列） */
  items: any[];
  /** 当前正在执行的操作信息 */
  currentOperation: StackOperation | null;
  /** 当前需要高亮显示的索引列表（通常为栈顶位置） */
  highlightIndices: number[];
}

/**
 * 栈数据结构类
 * @class StackStructure
 * @description 封装栈的完整实现，提供可视化支持的操作接口
 *
 * 【特性说明】
 * - 基于数组实现，使用数组尾部作为栈顶（性能最优）
 * - 支持最大容量限制，防止无限增长
 * - 所有公共方法均为异步，支持逐步动画展示
 * - 内部维护高亮索引，标记当前操作的位置（通常是栈顶）
 *
 * 【时间复杂度参考】
 * - push（入栈）：O(1) 均摊
 * - pop（出栈）：O(1)
 * - peek（查看栈顶）：O(1)
 * - 其他查询：O(1)
 *
 * 【为什么选择数组尾部作为栈顶？】
 * JavaScript 数组的 push/pop 操作在尾部进行时效率最高，
 * 因为不需要移动其他元素。如果在头部操作，所有元素都需要移动。
 */
export class StackStructure {
  /**
   * 内部存储数组
   * @private
   * @type {any[]}
   * @description 使用数组存储栈元素，数组的末尾作为栈顶
   * 这样 push 和 pop 都可以在 O(1) 时间完成
   */
  private items: any[] = [];

  /**
   * 订阅者监听器列表
   * @private
   * @type {((state: StackState) => void)[]}
   */
  private listeners: ((state: StackState) => void)[] = [];

  /**
   * 当前正在执行的操作信息
   * @private
   * @type {StackOperation | null}
   */
  private currentOperation: StackOperation | null = null;

  /**
   * 当前高亮显示的索引集合
   * @private
   * @type {number[]}
   * @description 通常只包含栈顶元素的索引（items.length - 1 或新元素位置）
   */
  private highlightIndices: number[] = [];

  /**
   * 栈的最大容量
   * @private
   * @type {number}
   * @description 限制栈能容纳的最大元素数量
   * 防止内存溢出，也便于可视化展示固定大小的栈结构
   */
  private maxSize: number;

  /**
   * 构造函数
   * @constructor
   * @param {any[]} initialItems - 初始元素数组，默认为空数组
   * @param {number} maxSize - 最大容量，默认为 10
   * @description 初始化栈实例，设置初始数据和容量限制
   *
   * 【设计考量】
   * - 初始数据通过浅拷贝创建副本，避免外部引用影响
   * - 构造完成后立即通知订阅者初始状态
   * - maxSize 默认值 10 适合大多数教学演示场景
   */
  constructor(initialItems: any[] = [], maxSize: number = 10) {
    this.items = [...initialItems]; // 浅拷贝初始数据
    this.maxSize = maxSize;         // 设置最大容量
    this.notify();                  // 通知初始状态
  }

  /**
   * 通知所有订阅者状态已更新
   * @private
   * @returns {void}
   * @description 创建当前状态的深拷贝快照并通知所有监听器
   */
  private notify() {
    const state: StackState = {
      items: [...this.items],                    // 深拷贝元素数组
      currentOperation: this.currentOperation,
      highlightIndices: [...this.highlightIndices]
    };
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * 订阅状态变更事件
   * @param {(state: StackState) => void} listener - 状态变更回调函数
   * @returns {() => void} 取消订阅的函数
   */
  subscribe(listener: (state: StackState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 获取当前状态的快照
   * @returns {StackState} 当前状态的完整副本
   */
  getState(): StackState {
    return {
      items: [...this.items],
      currentOperation: this.currentOperation,
      highlightIndices: [...this.highlightIndices]
    };
  }

  /**
   * 入栈操作（Push）
   * @async
   * @param {any} value - 要压入栈顶的元素值
   * @returns {Promise<boolean>} 成功返回 true，栈满返回 false
   * @description 将元素添加到栈顶，遵循 LIFO 原则
   *
   * 【算法原理】
   * 1. 检查栈是否已满（达到 maxSize）
   * 2. 如果已满，返回 false 表示失败
   * 3. 否则将元素追加到数组末尾（栈顶）
   * 4. 更新状态并通知订阅者
   *
   * 【图示】
   * 入栈前：| | | | |     (栈顶在右)
   * 入栈(5)：| | | |5|
   *
   * 【时间复杂度】O(1) 均摊
   * JavaScript 的 Array.push() 在大多数情况下是 O(1) 操作
   * （偶尔扩容时为 O(n)，但均摊后仍为 O(1)）
   *
   * 【边界情况】
   * - 栈满：返回 false，不执行任何操作
   * - 正常情况：成功入栈并返回 true
   */
  async push(value: any): Promise<boolean> {
    // 边界检查：栈是否已满
    if (this.items.length >= this.maxSize) {
      return false; // 栈已满，无法入栈
    }

    // 设置操作信息和高亮位置（即将成为新的栈顶）
    this.currentOperation = { type: 'push', value };
    this.highlightIndices = [this.items.length]; // 新元素将在该位置

    // 执行入栈：将元素添加到数组末尾
    this.items.push(value);

    // 通知订阅者新状态（包含新元素）
    this.notify();

    // 延迟以便 UI 渲染动画效果
    await new Promise(resolve => setTimeout(resolve, 500));

    // 清除高亮
    this.highlightIndices = [];
    this.notify();
    return true; // 入栈成功
  }

  /**
   * 出栈操作（Pop）
   * @async
   * @returns {Promise<any>} 返回弹出的栈顶元素，栈空返回 undefined
   * @description 移除并返回栈顶元素，遵循 LIFO 原则
   *
   * 【算法原理】
   * 1. 检查栈是否为空
   * 2. 如果为空，返回 undefined（下溢保护）
   * 3. 否则移除并返回最后一个元素
   *
   * 【图示】
   * 出栈前：| | | |5|
   * 出栈后：| | | | |    返回值：5
   *
   * 【时间复杂度】O(1)
   * Array.pop() 直接移除并返回最后一个元素
   *
   * 【边界情况】
   * - 栈空：返回 undefined（安全处理下溢）
   * - 单元素：出栈后变为空栈
   */
  async pop(): Promise<any> {
    // 边界检查：栈是否为空
    if (this.items.length === 0) {
      return undefined; // 栈空，无法出栈（下溢保护）
    }

    // 设置操作信息和高亮位置（当前栈顶）
    this.currentOperation = { type: 'pop' };
    this.highlightIndices = [this.items.length - 1]; // 栈顶位置

    // 先通知（显示即将弹出的元素）
    this.notify();

    // 延迟以便 UI 展示即将出栈的元素
    await new Promise(resolve => setTimeout(resolve, 500));

    // 执行出栈：移除并返回最后一个元素
    const item = this.items.pop();

    // 清除高亮并通知最终状态
    this.highlightIndices = [];
    this.notify();

    return item; // 返回被弹出的元素
  }

  /**
   * 查看栈顶元素（Peek）
   * @async
   * @returns {Promise<any>} 返回栈顶元素但不移除，栈空返回 undefined
   * @description 获取栈顶元素的值，但不修改栈的内容
   *
   * 【与 Pop 的区别】
   * - Peek：只看不取，栈保持不变
   * - Pop：既看又取，栈顶元素被移除
   *
   * 【应用场景】
   * - 检查栈顶元素以决定下一步操作
   * - 调试时查看栈状态而不影响程序运行
   * - 实现表达式求值时的预览功能
   *
   * 【时间复杂度】O(1)，直接访问数组末尾元素
   */
  async peek(): Promise<any> {
    // 边界检查：栈是否为空
    if (this.items.length === 0) {
      return undefined;
    }

    // 设置操作信息和高亮位置（栈顶）
    this.currentOperation = { type: 'peek' };
    this.highlightIndices = [this.items.length - 1];

    // 通知当前状态
    this.notify();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 清除高亮并通知
    this.highlightIndices = [];
    this.notify();

    // 返回栈顶元素的值（不移除）
    return this.items[this.items.length - 1];
  }

  /**
   * 获取栈中元素的数量
   * @returns {number} 当前栈的大小（元素个数）
   * @description 返回栈中实际存储的元素数量
   *
   * 【时间复杂度】O(1)
   */
  size(): number {
    return this.items.length;
  }

  /**
   * 检查栈是否为空
   * @returns {boolean} 空栈返回 true，否则返回 false
   * @description 判断栈中是否没有任何元素
   *
   * 【应用场景】
   * - 出栈前检查是否会发生下溢
   * - 循环处理的终止条件
   * - 状态判断逻辑
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * 检查栈是否已满
   * @returns {boolean} 已满返回 true，否则返回 false
   * @description 判断栈是否达到了最大容量限制
   *
   * 【应用场景】
   * - 入栈前检查是否会发生上溢
   * - 动态调整策略的判断依据
   * - 内存管理的预警信号
   */
  isFull(): boolean {
    return this.items.length >= this.maxSize;
  }

  /**
   * 获取栈的最大容量
   * @returns {number} 最大容量值
   * @description 返回栈能容纳的最大元素数量
   */
  getMaxSize(): number {
    return this.maxSize;
  }
}
