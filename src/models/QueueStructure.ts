/**
 * @file QueueStructure.ts
 * @description 队列（Queue）数据结构模型 - 算法可视化核心组件
 *
 * 【项目角色】
 * 本模块实现队列（先进先出 FIFO）数据结构的完整逻辑，是算法可视化项目中
 * 队列相关算法的数据层。通过观察者模式支持实时状态广播，使 UI 层能够动态展示
 * 队列的入队、出队、查看队首等操作过程。
 *
 * 【设计模式】
 * - 观察者模式（Observer Pattern）：subscribe/notify 机制实现响应式状态更新
 * - 环形缓冲区模式（Circular Buffer）：使用循环数组高效利用存储空间
 *
 * 【核心职责】
 * 1. 维护队列的内部数据存储（基于环形数组实现）
 * 2. 管理队首（front）和队尾（rear）指针的位置
 * 3. 实现标准的队列操作接口（enqueue、dequeue、peek）
 * 4. 提供队列的状态查询方法（size、isEmpty、isFull）
 * 5. 通过高亮索引机制支持操作过程的可视化展示
 *
 * 【业务场景】
 * - 任务调度：展示操作系统进程调度的原理
 * - 消息队列：演示消息的顺序处理机制
 * - BFS 算法：展示广度优先搜索的层级遍历过程
 * - 打印队列：展示打印任务的排队处理
 *
 * 【FIFO 原则】
 * First In, First Out（先进先出）
 * - 最先插入的元素最先被取出
 * - 类似于银行排队，先到先服务
 * - 插入在队尾进行，删除在队首进行
 *
 * 【技术特点 - 环形队列 Circular Queue】
 * 本实现采用环形数组（Circular Array）而非普通数组：
 * - 避免出队时的数据搬移开销
 * - 通过取模运算 (%) 实现数组末尾到开头的循环
 * - front 和 rear 指针单向移动，不会回退
 * - 空间利用率更高，删除后的位置可被复用
 */

/**
 * 队列操作类型枚举接口
 * @interface QueueOperation
 * @description 定义队列支持的所有操作类型标识
 */
interface QueueOperation {
  /** 操作类型：入队 | 出队 | 查看队首 */
  type: 'enqueue' | 'dequeue' | 'peek';
  /** 操作涉及的值（可选，用于 enqueue 操作） */
  value?: any;
}

/**
 * 队列状态接口
 * @interface QueueState
 * @description 向外部暴露的完整状态快照
 */
interface QueueState {
  /** 当前队列中的所有元素（包含空位 null） */
  items: any[];
  /** 当前正在执行的操作信息 */
  currentOperation: QueueOperation | null;
  /** 当前需要高亮显示的索引列表 */
  highlightIndices: number[];
  /** 队首指针位置 */
  front: number;
  /** 队尾指针位置 */
  rear: number;
}

/**
 * 队列数据结构类
 * @class QueueStructure
 * @description 封装队列的完整实现，使用环形数组提供可视化支持的操作接口
 *
 * 【特性说明】
 * - 基于环形数组（Circular Array）实现，避免数据搬移
 * - 使用 front 和 rear 双指针管理队列边界
 * - 支持最大容量限制，防止无限增长
 * - 所有公共方法均为异步，支持逐步动画展示
 *
 * 【时间复杂度参考】
 * - enqueue（入队）：O(1)
 * - dequeue（出队）：O(1)
 * - peek（查看队首）：O(1)
 * - 其他查询：O(1)
 *
 * 【环形数组工作原理】
 * 数组被视为一个环，当指针到达末尾时自动回到开头：
 * ```
 *   0  1  2  3  4     (maxSize = 5)
 *  [C][D][ ][A][B]
 *       ↑         ↑
 *      rear      front
 * ```
 * 元素按 A→B→C→D 的顺序入队，front=4, rear=1
 * 下一个元素将放在 rear+1=2 的位置
 */
export class QueueStructure {
  /**
   * 内部存储数组（固定大小的环形缓冲区）
   * @private
   * @type {any[]}
   * @description 使用固定长度的数组作为环形缓冲区
   * 初始化时所有位置填充 null，表示空闲状态
   */
  private items: any[];

  /**
   * 队首指针
   * @private
   * @type {number}
   * @description 指向队列中第一个元素的位置
   * 出队操作时从该位置移除元素
   * 特殊值 -1 表示空队列
   */
  private front: number;

  /**
   * 队尾指针
   * @private
   * @type {number}
   * @description 指向队列中最后一个元素的位置
   * 入队操作时在该位置的下一个位置添加新元素
   * 特殊值 -1 表示空队列
   */
  private rear: number;

  /**
   * 队列的最大容量
   * @private
   * @type {number}
   * @description 环形数组的固定大小，决定了队列能容纳的最大元素数量
   */
  private maxSize: number;

  /**
   * 订阅者监听器列表
   * @private
   * @type {((state: QueueState) => void)[]}
   */
  private listeners: ((state: QueueState) => void)[] = [];

  /**
   * 当前正在执行的操作信息
   * @private
   * @type {QueueOperation | null}
   */
  private currentOperation: QueueOperation | null = null;

  /**
   * 当前高亮显示的索引集合
   * @private
   * @type {number[]}
   * @description 标记当前操作的元素位置（通常是队首或队尾）
   */
  private highlightIndices: number[] = [];

  /**
   * 构造函数
   * @constructor
   * @param {number} maxSize - 最大容量，默认为 10
   * @description 初始化队列实例，创建固定大小的环形数组
   *
   * 【初始化细节】
   * - 创建长度为 maxSize 的数组，全部填充 null
   * - front 和 rear 都设为 -1，表示空队列状态
   * - 构造完成后立即通知订阅者初始状态
   *
   * 【为什么初始值为 -1 而不是 0？】
   * 使用 -1 作为特殊标记可以区分"空队列"和"队列满"的状态，
   * 配合 isFull() 的判断条件 (rear + 1) % maxSize === front 可以正确识别这两种情况
   */
  constructor(maxSize: number = 10) {
    // 创建固定大小的数组，所有位置初始化为 null（表示空闲）
    this.items = new Array(maxSize).fill(null);
    this.front = -1;  // 队首指针初始化为 -1（空队列标志）
    this.rear = -1;   // 队尾指针初始化为 -1（空队列标志）
    this.maxSize = maxSize; // 记录最大容量
    this.notify();    // 通知初始状态
  }

  /**
   * 通知所有订阅者状态已更新
   * @private
   * @returns {void}
   * @description 创建当前状态的深拷贝快照并通知所有监听器
   */
  private notify() {
    const state: QueueState = {
      items: [...this.items],                    // 深拷贝元素数组（保留 null 占位）
      currentOperation: this.currentOperation,
      highlightIndices: [...this.highlightIndices],
      front: this.front,                          // 包含队首指针位置
      rear: this.rear                             // 包含队尾指针位置
    };
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * 订阅状态变更事件
   * @param {(state: QueueState) => void} listener - 状态变更回调函数
   * @returns {() => void} 取消订阅的函数
   */
  subscribe(listener: (state: QueueState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 获取当前状态的快照
   * @returns {QueueState} 当前状态的完整副本
   */
  getState(): QueueState {
    return {
      items: [...this.items],
      currentOperation: this.currentOperation,
      highlightIndices: [...this.highlightIndices],
      front: this.front,
      rear: this.rear
    };
  }

  /**
   * 入队操作（Enqueue）
   * @async
   * @param {any} value - 要添加到队尾的元素值
   * @returns {Promise<boolean>} 成功返回 true，队列满返回 false
   * @description 将元素添加到队列尾部，遵循 FIFO 原则
   *
   * 【算法原理 - 环形队列入队】
   * 1. 检查队列是否已满
   * 2. 如果是第一次入队（空队列），设置 front = 0
   * 3. 计算新的 rear 位置：(rear + 1) % maxSize（实现环形循环）
   * 4. 在 rear 位置放入新元素
   * 5. 更新状态并通知
   *
   * 【图示】
   * 入队前：[A][B][ ]  front=0, rear=1
   * 入队(C)：[A][B][C]  front=0, rear=2
   *
   * 【关键公式 - 环形递增】
   * rear = (rear + 1) % maxSize
   * 这个公式确保了：
   * - 正常情况下 rear 向后移动一位
   * - 当 rear 到达数组末尾时，自动回到索引 0
   *
   * 【时间复杂度】O(1)，直接计算索引并赋值
   *
   * 【边界情况】
   * - 队列满：返回 false
   * - 空队列：同时设置 front 和 rear
   */
  async enqueue(value: any): Promise<boolean> {
    // 边界检查：队列是否已满
    if (this.isFull()) {
      return false; // 队列已满，无法入队
    }

    // 设置操作类型
    this.currentOperation = { type: 'enqueue', value };

    // 特殊处理：如果当前是空队列，需要重置 front 指针
    if (this.isEmpty()) {
      this.front = 0; // 第一个元素将在位置 0
    }

    // ★ 核心：计算新的队尾位置（环形递增）
    // 取模运算 % 确保 rear 在到达 maxSize-1 后回到 0
    this.rear = (this.rear + 1) % this.maxSize;

    // 在新位置存入元素
    this.items[this.rear] = value;

    // 高亮新插入的位置
    this.highlightIndices = [this.rear];
    this.notify();

    // 延迟以便 UI 渲染动画效果
    await new Promise(resolve => setTimeout(resolve, 500));

    // 清除高亮并通知最终状态
    this.highlightIndices = [];
    this.notify();

    return true; // 入队成功
  }

  /**
   * 出队操作（Dequeue）
   * @async
   * @returns {Promise<any>} 返回移除的队首元素，队列空返回 undefined
   * @description 移除并返回队列头部的元素，遵循 FIFO 原则
   *
   * 【算法原理 - 环形队列出队】
   * 1. 检查队列是否为空
   * 2. 如果为空，返回 undefined（下溢保护）
   * 3. 读取 front 位置的元素
   * 4. 将该位置设为 null（释放空间）
   * 5. 如果这是最后一个元素，重置 front 和 rear 为 -1
   * 6. 否则移动 front 指针：(front + 1) % maxSize
   *
   * 【图示】
   * 出队前：[A][B][C]  front=0, rear=2
   * 出队后：[ ][B][C]  front=1, rear=2  返回 A
   *
   * 【时间复杂度】O(1），直接读取并移动指针
   *
   * 【与普通数组的区别】
   * 普通数组出队需要移动所有剩余元素（O(n)），
   * 环形队列只需移动 front 指针（O(1)），效率更高
   */
  async dequeue(): Promise<any> {
    // 边界检查：队列是否为空
    if (this.isEmpty()) {
      return undefined; // 队列为空，无法出队（下溢保护）
    }

    // 设置操作类型和高亮队首位置
    this.currentOperation = { type: 'dequeue' };
    this.highlightIndices = [this.front]; // 高亮即将出队的元素

    // 先通知（显示即将出队的元素）
    this.notify();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 读取队首元素的值
    const value = this.items[this.front];

    // 释放该位置（设为 null 表示空闲）
    this.items[this.front] = null;

    // ★ 关键：检查是否出队了最后一个元素
    if (this.front === this.rear) {
      // 队列变空：重置两个指针为 -1
      this.front = -1;
      this.rear = -1;
    } else {
      // 还有其他元素：移动 front 指针（环形递增）
      this.front = (this.front + 1) % this.maxSize;
    }

    // 清除高亮并通知最终状态
    this.highlightIndices = [];
    this.notify();

    return value; // 返回被移除的元素
  }

  /**
   * 查看队首元素（Peek）
   * @async
   * @returns {Promise<any>} 返回队首元素但不移除，队列空返回 undefined
   * @description 获取队列头部元素的值，但不修改队列内容
   *
   * 【应用场景】
   * - 检查下一个要处理的任务
   * - 调试时查看队列状态
   * - 条件判断而不消费元素
   *
   * 【时间复杂度】O(1)，直接访问 front 位置的元素
   */
  async peek(): Promise<any> {
    // 边界检查
    if (this.isEmpty()) {
      return undefined;
    }

    // 设置操作信息和高亮队首位置
    this.currentOperation = { type: 'peek' };
    this.highlightIndices = [this.front];

    this.notify();
    await new Promise(resolve => setTimeout(resolve, 500));

    this.highlightIndices = [];
    this.notify();

    // 返回队首元素的值（不移除）
    return this.items[this.front];
  }

  /**
   * 获取队列中元素的数量
   * @returns {number} 当前队列的大小（元素个数）
   * @description 根据 front 和 rear 的位置计算实际元素数量
   *
   * 【计算公式】
   * 由于是环形数组，需要分两种情况：
   * 1. rear >= front：（正常情况）rear - front + 1
   * 2. rear < front：（环绕情况）maxSize - (front - rear - 1)
   *
   * 【示例】
   * 情况1：[A][B][C]  front=0, rear=2 → size = 2-0+1 = 3
   * 情况2：[C][ ][A][B]  front=2, rear=0 → size = 4-(2-0-1) = 3
   *
   * 【时间复杂度】O(1)
   */
  size(): number {
    // 空队列特殊情况
    if (this.isEmpty()) {
      return 0;
    }
    // 正常情况：rear 在 front 后面
    if (this.rear >= this.front) {
      return this.rear - this.front + 1;
    }
    // 环绕情况：rear 回到了数组前面
    return this.maxSize - (this.front - this.rear - 1);
  }

  /**
   * 检查队列是否为空
   * @returns {boolean} 空队列返回 true
   * @description 通过检查 front 是否为 -1 来判断
   *
   * 【设计选择】
   * 使用 front === -1 而非 front === rear 来判断空队列，
   * 因为后者在某些情况下可能产生歧义
   */
  isEmpty(): boolean {
    return this.front === -1;
  }

  /**
   * 检查队列是否已满
   * @returns {boolean} 已满返回 true
   * @description 通过检查 rear 的下一个位置是否是 front 来判断
   *
   * 【判断条件解析】
   * (rear + 1) % maxSize === front
   *
   * 这个条件的含义：
   * - 如果 rear 的下一个位置（环形意义下）正好是 front
   * - 说明没有空闲位置可以存放新元素
   * - 因此队列已满
   *
   * 【为什么浪费一个位置？】
   * 为了区分"空队列"和"满队列"两种状态，
   * 我们故意不填满整个数组，始终保留一个空位。
   * 这样 front === -1 表示空，(rear+1)%max===front 表示满。
   *
   * 【示例】maxSize=5，最多存 4 个元素
   * 满：[A][B][C][D][ ]  front=0, rear=3
   *     (3+1)%5 = 4 ≠ 0？不对，让我重新理解...
   *     实际上 (rear+1)%maxSize === front 时为满
   */
  isFull(): boolean {
    return (this.rear + 1) % this.maxSize === this.front;
  }

  /**
   * 获取队列的最大容量
   * @returns {number} 最大容量值
   */
  getMaxSize(): number {
    return this.maxSize;
  }

  /**
   * 获取队首指针位置
   * @returns {number} front 指针的当前值
   * @description 用于调试和可视化显示
   */
  getFront(): number {
    return this.front;
  }

  /**
   * 获取队尾指针位置
   * @returns {number} rear 指针的当前值
   * @description 用于调试和可视化显示
   */
  getRear(): number {
    return this.rear;
  }
}
