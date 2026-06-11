/**
 * @file LinkedListStructure.ts
 * @description 单向链表数据结构模型 - 算法可视化核心组件
 *
 * 【项目角色】
 * 本模块实现单向链表（Singly Linked List）的完整数据结构和操作逻辑，是算法可视化项目中
 * 链表相关算法的数据层。通过观察者模式支持实时状态广播，使 UI 层能够动态展示链表的
 * 插入、删除、搜索等操作过程，帮助用户理解链表的工作原理。
 *
 * 【设计模式】
 * - 观察者模式（Observer Pattern）：subscribe/notify 机制实现响应式状态更新
 * - 命令模式（Command Pattern）：每个操作封装为异步方法，支持分步动画展示
 * - 迭代器模式（Iterator Pattern）：内部使用节点遍历进行操作定位
 *
 * 【核心职责】
 * 1. 管理链表节点的创建、连接和销毁生命周期
 * 2. 实现链表的标准 CRUD 操作（prepend、append、insert、delete、search）
 * 3. 维护链表的结构完整性（头指针管理、边界条件处理）
 * 4. 将内部链式结构转换为数组形式供 UI 层渲染
 * 5. 通过高亮索引机制支持操作过程的可视化展示
 *
 * 【业务场景】
 * - 数据结构教学：演示链表与数组的区别（动态大小 vs 固定大小）
 * - 算法学习：展示链表操作的指针变化过程
 * - 内存管理理解：帮助理解节点分配和引用关系
 *
 * 【技术特点】
 * - 单向链表：每个节点只包含数据和指向下一个节点的引用
 * - 头插法/尾插法：支持从头部或尾部插入节点
 * - 动态扩容：无需预先分配固定大小的内存空间
 */

/**
 * 链表节点接口
 * @interface LinkedListNode
 * @description 定义链表中单个节点的数据结构
 */
interface LinkedListNode {
  /** 节点存储的数据值，支持任意类型 */
  value: any;
  /** 指向下一个节点的引用，null 表示链表尾部 */
  next: LinkedListNode | null;
}

/**
 * 链表操作类型枚举接口
 * @interface LinkedListOperation
 * @description 定义链表支持的所有操作类型标识
 */
interface LinkedListOperation {
  /** 操作类型：头部插入 | 尾部追加 | 中间插入 | 删除 | 搜索 */
  type: 'insert' | 'delete' | 'search' | 'append' | 'prepend';
  /** 操作目标位置索引（可选，用于 insert 和 delete 操作） */
  index?: number;
  /** 操作涉及的值（可选，用于 insert、append、prepend 和 search 操作） */
  value?: any;
}

/**
 * 链表状态接口
 * @interface LinkedListState
 * @description 向外部暴露的完整状态快照，将链式结构转换为线性数组
 */
interface LinkedListState {
  /** 链表所有节点的数组表示（按顺序排列） */
  nodes: LinkedListNode[];
  /** 当前正在执行的操作信息 */
  currentOperation: LinkedListOperation | null;
  /** 当前需要高亮显示的节点索引列表（用于动画效果） */
  highlightIndices: number[];
}

/**
 * 单向链表数据结构类
 * @class LinkedListStructure
 * @description 封装单向链表的完整实现，提供可视化支持的操作接口
 *
 * 【特性说明】
 * - 采用头指针（head）管理整个链表的入口
 * - 所有公共方法均为异步，支持逐步动画展示
 * - 内部维护高亮索引数组，标记当前操作涉及的位置
 * - 使用防御性拷贝保护内部状态不被外部修改
 *
 * 【内存布局示例】
 * head → [node0] → [node1] → [node2] → null
 *        value   value   value
 *        next    next    next→null
 *
 * 【时间复杂度参考】
 * - 头部插入/删除：O(1)
 * - 尾部插入：O(n)（需遍历到末尾）
 * - 按索引插入/删除：O(n)
 * - 按值搜索：O(n）
 */
export class LinkedListStructure {
  /**
   * 链表头指针
   * @private
   * @type {LinkedListNode | null}
   * @description 指向链表的第一个节点，null 表示空链表
   * 头指针是访问整个链表的唯一入口，必须妥善维护
   */
  private head: LinkedListNode | null = null;

  /**
   * 订阅者监听器列表
   * @private
   * @type {((state: LinkedListState) => void)[]}
   * @description 存储所有注册的状态变更回调函数
   */
  private listeners: ((state: LinkedListState) => void)[] = [];

  /**
   * 当前正在执行的操作信息
   * @private
   * @type {LinkedListOperation | null}
   */
  private currentOperation: LinkedListOperation | null = null;

  /**
   * 当前高亮显示的节点索引集合
   * @private
   * @type {number[]}
   * @description 用于标记当前操作涉及的节点位置，UI 层据此渲染特殊样式
   */
  private highlightIndices: number[] = [];

  /**
   * 构造函数
   * @constructor
   * @param {any[]} initialValues - 初始值数组，默认为空数组
   * @description 初始化链表实例，将初始值依次追加到链表尾部
   *
   * 【实现细节】
   * 使用 forEach 调用 append() 方法逐个添加元素，
   * 这样可以利用 append 方法的完整逻辑（包括通知机制）
   */
  constructor(initialValues: any[] = []) {
    initialValues.forEach(value => this.append(value));
  }

  /**
   * 通知所有订阅者状态已更新
   * @private
   * @returns {void}
   * @description 将链式结构转换为数组形式后通知所有监听器
   *
   * 【转换必要性】
   * 链表的内部存储是离散的节点对象，无法直接用于 UI 渲染。
   * 此方法调用 toArray() 将链表转换为连续的数组，便于：
   * - React/Vue 等框架的列表渲染
   * - 序列化和持久化
   * - 单元测试的状态断言
   */
  private notify() {
    // 将链式结构转换为数组表示
    const nodes = this.toArray();
    const state: LinkedListState = {
      nodes,                                    // 转换后的节点数组
      currentOperation: this.currentOperation,  // 当前操作信息
      highlightIndices: [...this.highlightIndices] // 深拷贝高亮索引
    };
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * 订阅状态变更事件
   * @param {(state: LinkedListState) => void} listener - 状态变更回调函数
   * @returns {() => void} 取消订阅的函数
   * @description 注册监听器以接收链表状态的实时更新
   *
   * 【设计考量】
   * 返回 unsubscribe 函数符合函数式编程的最佳实践，
   * 调用方无需保存原始 listener 引用即可取消订阅
   */
  subscribe(listener: (state: LinkedListState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 获取当前状态的快照
   * @returns {LinkedListState} 当前状态的完整副本
   * @description 返回包含节点数组、操作信息和高亮索引的状态对象
   */
  getState(): LinkedListState {
    return {
      nodes: this.toArray(),                    // 转换为节点数组
      currentOperation: this.currentOperation,
      highlightIndices: [...this.highlightIndices]
    };
  }

  /**
   * 将链表转换为数组
   * @private
   * @returns {LinkedListNode[]} 包含所有节点的数组
   * @description 遍历链表并将每个节点复制到数组中
   *
   * 【算法原理】
   * 1. 从 head 开始，初始化临时变量 current = head
   * 2. 循环直到 current 为 null：
   *     a. 将 current 节点复制到结果数组
   *     b. 移动 current = current.next
   * 3. 返回结果数组
   *
   * 【时间复杂度】O(n)，需要遍历所有节点
   * 【空间复杂度】O(n)，创建新数组存储所有节点
   *
   * 【注意】
   * 返回的是新创建的节点对象（浅拷贝），修改返回值不会影响原链表
   */
  private toArray(): LinkedListNode[] {
    const nodes: LinkedListNode[] = [];
    let current = this.head; // 从头节点开始遍历

    // 逐个遍历链表，直到到达末尾（current === null）
    while (current !== null) {
      // 创建节点的副本并加入数组（浅拷贝 value 和 next 引用）
      nodes.push({ value: current.value, next: current.next });
      current = current.next; // 移动到下一个节点
    }
    return nodes;
  }

  /**
   * 在链表头部插入节点（头插法）
   * @async
   * @param {any} value - 要插入的值
   * @returns {Promise<void>}
   * @description 在链表最前面插入一个新节点，成为新的头节点
   *
   * 【算法原理】
   * 1. 创建新节点，其 next 指向当前的 head
   * 2. 更新 head 指针指向新节点
   *
   * 【图示】
   * 插入前：head → [A] → [B] → null
   * 插入后：head → [new] → [A] → [B] → null
   *
   * 【时间复杂度】O(1)，只需修改两个引用，与链表长度无关
   * 【空间复杂度】O(1)，只创建一个新节点
   *
   * 【优势】
   * 头插法是最快的插入方式，常用于实现栈结构（LIFO）
   */
  async prepend(value: any) {
    this.currentOperation = { type: 'prepend', value };
    this.highlightIndices = [0]; // 高亮即将成为新头部的位置

    // 创建新节点，其 next 指向当前的头节点
    const newNode: LinkedListNode = { value, next: this.head };
    // 更新头指针指向新节点
    this.head = newNode;

    // 通知订阅者新状态
    this.notify();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 清除高亮
    this.highlightIndices = [];
    this.notify();
  }

  /**
   * 在链表尾部追加节点（尾插法）
   * @async
   * @param {any} value - 要追加的值
   * @returns {Promise<void>}
   * @description 在链表末尾插入一个新节点
   *
   * 【算法原理】
   * 分两种情况处理：
   * 1. 空链表（head === null）：直接设置 head 为新节点
   * 2. 非空链表：从头开始遍历到最后一个节点，将其 next 指向新节点
   *
   * 【图示】
   * 追加前：head → [A] → [B] → null
   * 追加后：head → [A] → [B] → [new] → null
   *
   * 【时间复杂度】O(n)，需要遍历到链表末尾
   * 【优化建议】
   * 可维护一个 tail 尾指针，使尾插法也达到 O(1) 时间复杂度
   *
   * 【边界情况】
   * - 空链表：直接设置 head，无需遍历
   * - 单节点链表：循环不执行，直接在头节点后追加
   */
  async append(value: any) {
    this.currentOperation = { type: 'append', value };

    // 创建新节点，next 默认为 null（作为尾节点）
    const newNode: LinkedListNode = { value, next: null };

    if (!this.head) {
      // 特殊情况：空链表，新节点即为头节点
      this.head = newNode;
      this.highlightIndices = [0];
    } else {
      // 一般情况：遍历找到最后一个节点
      let current = this.head;
      let index = 0;

      // 遍历直到找到最后一个节点（其 next 为 null）
      while (current.next !== null) {
        // 高亮当前正在访问的节点，展示遍历过程
        this.highlightIndices = [index];
        this.notify();
        await new Promise(resolve => setTimeout(resolve, 500));

        current = current.next; // 移动到下一个节点
        index++;
      }

      // 找到末尾节点，将新节点链接在其后面
      current.next = newNode;
      // 高亮新插入的节点位置
      this.highlightIndices = [index + 1];
    }

    // 通知最终状态
    this.notify();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 清除高亮
    this.highlightIndices = [];
    this.notify();
  }

  /**
   * 在指定位置插入节点
   * @async
   * @param {any} value - 要插入的值
   * @param {number} index - 目标位置的索引（从 0 开始）
   * @returns {Promise<void>}
   * @description 在链表的第 index 个位置之后插入新节点
   *
   * 【算法原理】
   * 1. 如果 index === 0，等同于 prepend 操作
   * 2. 否则，遍历找到第 (index-1) 个节点（前驱节点）
   * 3. 在前驱节点之后插入新节点
   *
   * 【图示】在位置 1 插入新节点
   * 插入前：head → [A] → [B] → [C] → null
   *                index=0  index=1
   * 插入后：head → [A] → [new] → [B] → [C] → null
   *
   * 【关键操作】修改两个指针
   * - newNode.next = currentNode.next（新节点指向后续节点）
   * - currentNode.next = newNode（前驱节点指向新节点）
   *
   * 【时间复杂度】O(n)，最坏情况需要遍历到链表末尾
   *
   * 【边界情况】
   * - index === 0：委托给 prepend 方法
   * - index >= length：自动转为 append 操作（追加到末尾）
   * - 空链表且 index > 0：也会转为 append 操作
   */
  async insert(value: any, index: number) {
    this.currentOperation = { type: 'insert', index, value };

    // 特殊情况：在位置 0 插入，等同于头插法
    if (index === 0) {
      return this.prepend(value);
    }

    let current = this.head;
    let currentIndex = 0;

    // 遍历找到要插入位置的前驱节点（第 index-1 个节点）
    // 循环条件：current 不为 null 且未到达前驱位置
    while (current !== null && currentIndex < index - 1) {
      // 高亮当前遍历到的节点，展示查找过程
      this.highlightIndices = [currentIndex];
      this.notify();
      await new Promise(resolve => setTimeout(resolve, 500));

      current = current.next; // 继续向后移动
      currentIndex++;
    }

    // 如果 current 为 null，说明 index 超出范围，转为尾插法
    if (current === null) {
      return this.append(value);
    }

    // 执行插入操作：
    // 1. 创建新节点，其 next 指向当前节点的下一个节点
    const newNode: LinkedListNode = { value, next: current.next };
    // 2. 当前节点的 next 指向新节点，完成链接
    current.next = newNode;

    // 高亮新插入的节点位置
    this.highlightIndices = [index];
    this.notify();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 清除高亮
    this.highlightIndices = [];
    this.notify();
  }

  /**
   * 删除指定位置的节点
   * @async
   * @param {number} index - 要删除节点的索引（从 0 开始）
   * @returns {Promise<void>}
   * @description 移除链表中指定位置的节点
   *
   * 【算法原理】
   * 分三种主要情况：
   * 1. 空链表或无效索引：直接返回
   * 2. 删除头节点（index === 0）：直接移动 head 指针
   * 3. 删除其他位置节点：找到前驱节点，修改其 next 指针跳过目标节点
   *
   * 【图示】删除位置 1 的节点
   * 删除前：head → [A] → [B] → [C] → null
   * 删除后：head → [A] → [C] → null
   *                 ↑
   *            A.next 直接指向 C，跳过 B
   *
   * 【关键操作】
   * - 前驱节点的 next 指向目标节点的 next（current.next = current.next.next）
   * - JavaScript 垃圾回收会自动释放被移除的节点
   *
   * 【时间复杂度】O(n），需要遍历找到前驱节点
   *
   * 【边界情况】
   * - 空链表：直接返回，无操作
   * - index < 0：视为无效输入，直接返回
   * - index === 0：特殊处理，只需修改 head 指针
   * - index >= length：current.next 为 null 时提前返回
   */
  async delete(index: number) {
    // 边界检查：空链表或无效索引
    if (!this.head || index < 0) return;

    this.currentOperation = { type: 'delete', index };

    // 特殊情况：删除头节点
    if (index === 0) {
      this.highlightIndices = [0]; // 高亮头节点
      this.notify();
      await new Promise(resolve => setTimeout(resolve, 500));

      // 将 head 移动到第二个节点，原头节点会被垃圾回收
      this.head = this.head.next;
      this.notify();
      return;
    }

    let current = this.head;
    let currentIndex = 0;

    // 遍历找到要删除节点的前驱节点（第 index-1 个节点）
    // 注意：检查 current.next 是为了确保要删除的节点存在
    while (current.next !== null && currentIndex < index - 1) {
      // 高亮当前遍历到的节点
      this.highlightIndices = [currentIndex];
      this.notify();
      await new Promise(resolve => setTimeout(resolve, 500));

      current = current.next;
      currentIndex++;
    }

    // 边界情况：要删除的位置不存在（超出链表长度）
    if (current.next === null) return;

    // 高亮即将被删除的节点
    this.highlightIndices = [index];
    this.notify();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 核心删除操作：前驱节点的 next 跳过目标节点，直接指向下下个节点
    // 这使得目标节点从链中断开，将被垃圾回收
    current.next = current.next.next;

    // 清除高亮并通知
    this.highlightIndices = [];
    this.notify();
  }

  /**
   * 按值搜索节点
   * @async
   * @param {any} value - 要搜索的目标值
   * @returns {Promise<number>} 找到返回索引，未找到返回 -1
   * @description 从头开始遍历链表，查找第一个匹配值的节点
   *
   * 【算法原理 - 线性搜索 Linear Search on Linked List】
   * 1. 从 head 节点开始，初始化索引 counter = 0
   * 2. 循环遍历每个节点：
   *     a. 高亮当前节点并暂停（动画效果）
   *     b. 比较 node.value 与目标值
   *     c. 匹配则返回当前索引
   *     d. 不匹配则继续下一个节点
   * 3. 到达链表末尾仍未找到，返回 -1
   *
   * 【时间复杂度】
   * - 最佳情况（首节点匹配）：O(1)
   * - 最坏情况（末尾或不存��）：O(n)
   * - 平均情况：O(n)
   *
   * 【空间复杂度】O(1)，仅使用常数额外空间（current 和 index 变量）
   *
   * 【与数组搜索的区别】
   * 数组可以通过下标 O(1) 随机访问，但链表只能顺序访问 O(n)。
   * 这是链表的主要性能劣势之一。
   */
  async search(value: any): Promise<number> {
    this.currentOperation = { type: 'search', value };

    let current = this.head; // 从头节点开始
    let index = 0;           // 当前节点索引

    // 顺序遍历链表
    while (current !== null) {
      // 高亮当前正在比较的节点
      this.highlightNodes = [index];
      this.notify();
      await new Promise(resolve => setTimeout(resolve, 500));

      // 使用严格相等运算符比较值
      if (current.value === value) {
        return index; // 找到目标，返回索引
      }

      // 移动到下一个节点
      current = current.next;
      index++;
    }

    // 遍历完成未找到目标
    this.highlightIndices = [];
    this.notify();
    return -1;
  }
}
