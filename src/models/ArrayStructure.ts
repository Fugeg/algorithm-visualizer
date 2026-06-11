/**
 * @file ArrayStructure.ts
 * @description 数组数据结构模型 - 算法可视化核心组件
 *
 * 【项目角色】
 * 本模块是算法可视化项目中数组相关算法的数据层实现，负责管理数组数据的完整生命周期，
 * 包括数据存储、状态管理、操作执行和变更通知。作为 MVC 架构中的 Model 层，它为 View 层
 * 提供标准化的状态接口，支持实时可视化展示数组操作过程。
 *
 * 【设计模式】
 * - 观察者模式（Observer Pattern）：通过 subscribe/notify 机制实现状态变更的响应式通知
 * - 命令模式（Command Pattern）：每个操作封装为独立的异步方法，支持逐步执行和动画展示
 *
 * 【核心职责】
 * 1. 维护数组的内部数据状态（data、currentOperation、highlightIndices）
 * 2. 提供标准的 CRUD 操作接口（insert、delete、search）
 * 3. 实现常用算法的可视化版本（sort、reverse）
 * 4. 通过发布-订阅机制向外部组件广播状态变更
 * 5. 管理高亮索引以支持动画效果
 *
 * 【业务场景】
 * - 教学演示：展示数组的基本操作原理（插入、删除、查找）
 * - 算法学习：可视化排序算法（冒泡排序）和反转算法的执行过程
 * - 性能分析：通过时间延迟模拟真实计算耗时，帮助理解算法复杂度
 */

/**
 * 数组操作类型枚举接口
 * @description 定义数组支持的所有操作类型，用于标识当前正在执行的操作
 */
interface ArrayOperation {
  /** 操作类型：插入 | 删除 | 查找 | 排序 | 反转 */
  type: 'insert' | 'delete' | 'search' | 'sort' | 'reverse';
  /** 操作目标索引（可选，用于 insert 和 delete 操作） */
  index?: number;
  /** 操作涉及的值（可选，用于 insert 和 search 操作） */
  value?: any;
}

/**
 * 数组状态接口
 * @description 定义向外部暴露的完整状态快照，包含数据和元信息
 */
interface ArrayState {
  /** 当前数组的完整数据副本（深拷贝，防止外部修改） */
  data: any[];
  /** 当前正在执行的操作信息 */
  currentOperation: ArrayOperation | null;
  /** 当前需要高亮显示的索引列表（用于动画效果） */
  highlightIndices: number[];
}

/**
 * 数组数据结构类
 * @class ArrayStructure
 * @description 封装数组的核心数据结构和操作逻辑，提供完整的可视化支持
 *
 * 【特性说明】
 * - 所有公共操作均为异步方法，支持动画延迟
 * - 内部维护操作状态和高亮索引，便于 UI 层渲染
 * - 采用观察者模式，任何状态变更都会自动通知所有订阅者
 * - 数据采用防御性拷贝，确保内部状态不被外部篡改
 */
export class ArrayStructure {
  /**
   * 内部存储的数组数据
   * @private
   * @type {any[]}
   */
  private data: any[] = [];

  /**
   * 订阅者监听器列表
   * @private
   * @type {((state: ArrayState) => void)[]}
   * @description 存储所有注册的状态变更回调函数
   */
  private listeners: ((state: ArrayState) => void)[] = [];

  /**
   * 当前正在执行的操作信息
   * @private
   * @type {ArrayOperation | null}
   */
  private currentOperation: ArrayOperation | null = null;

  /**
   * 当前高亮显示的索引集合
   * @private
   * @type {number[]}
   * @description 用于标记当前操作涉及的位置，UI 层可根据此数组渲染特殊样式
   */
  private highlightIndices: number[] = [];

  /**
   * 构造函数
   * @constructor
   * @param {any[]} initialData - 初始数据数组，默认为空数组
   * @description 初始化数组实例，创建数据副本并立即通知订阅者初始状态
   *
   * 【设计考量】
   * 使用展开运算符 [...initialData] 进行浅拷贝，避免外部引用影响内部状态。
   * 构造完成后立即调用 notify()，确保订阅者能获取到初始状态进行首次渲染。
   */
  constructor(initialData: any[] = []) {
    this.data = [...initialData];
    // 初始化时立即通知状态，让订阅者能够渲染初始视图
    this.notify();
  }

  /**
   * 通知所有订阅者状态已更新
   * @private
   * @returns {void}
   * @description 创建当前状态的深拷贝快照，并逐个调用所有监听器回调
   *
   * 【实现细节】
   * - 对 data 和 highlightIndices 使用展开运算符创建新数组，防止外部直接修改内部状态
   * - 遍历 listeners 数组调用每个回调，实现一对多的消息分发
   * - 此方法在每次状态变更后必须调用，是观察者模式的核心方法
   */
  private notify() {
    const state: ArrayState = {
      data: [...this.data],                    // 深拷贝数据数组
      currentOperation: this.currentOperation, // 当前操作引用
      highlightIndices: [...this.highlightIndices] // 深拷贝高亮索引
    };
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * 订阅状态变更事件
   * @param {(state: ArrayState) => void} listener - 状态变更回调函数
   * @returns {() => void} 取消订阅的函数（遵循 unsubscribe 模式）
   * @description 注册一个监听器，当数组状态发生任何变更时自动调用该回调
   *
   * 【使用示例】
   * ```typescript
   * const unsubscribe = arrayStructure.subscribe((state) => {
   *   console.log('新状态:', state.data);
   * });
   * // 后续可调用 unsubscribe() 取消订阅
   * ```
   *
   * 【设计模式】
   * 返回取消订阅函数，符合 React useEffect 的清理模式，避免内存泄漏
   */
  subscribe(listener: (state: ArrayState) => void) {
    this.listeners.push(listener);
    // 返回取消订阅的闭包函数，通过 filter 移除特定监听器引用
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 在指定位置或末尾插入元素
   * @async
   * @param {any} value - 要插入的元素值
   * @param {number} [index] - 插入位置索引（可选），未指定则追加到末尾
   * @returns {Promise<void>}
   * @description 执行数组插入操作，更新状态并通知订阅者
   *
   * 【算法原理】
   * 1. 设置当前操作类型为 'insert'
   * 2. 计算并设置高亮索引（未指定 index 时使用数组长度作为尾部位置）
   * 3. 根据 index 参数选择插入策略：
   *    - 未指定：使用 push() 追加到末尾，时间复杂度 O(1)
   *    - 已指定：使用 splice(index, 0, value) 在指定位置插入，时间复杂度 O(n)
   * 4. 通知订阅者状态变更
   *
   * 【时间复杂度】
   * - 最佳情况（尾部插入）：O(1)
   * - 最坏情况（头部插入）：O(n)，需要移动 n 个元素
   * - 平均情况：O(n)
   *
   * 【业务逻辑】
   * 使用 nullish coalescing operator (??) 处理 undefined 值，
   * 当 index 为 undefined 时自动使用 this.data.length 作为默认值
   */
  async insert(value: any, index?: number) {
    this.currentOperation = { type: 'insert', index, value };
    // 设置高亮索引：如果未指定位置则高亮末尾位置，否则高亮指定位置
    this.highlightIndices = [index ?? this.data.length];

    if (index === undefined) {
      // 尾部插入：直接使用 push 方法
      this.data.push(value);
    } else {
      // 中间/头部插入：使用 splice 方法在指定位置插入
      // splice 的第二个参数为 0 表示不删除元素，只插入
      this.data.splice(index, 0, value);
    }

    // 通知订阅者数据已更新
    this.notify();
  }

  /**
   * 删除指定位置的元素
   * @async
   * @param {number} index - 要删除元素的索引位置
   * @returns {Promise<void>}
   * @description 从数组中移除指定索引处的元素，并触发状态更新
   *
   * 【算法原理】
   * 1. 设置当前操作类型为 'delete'
   * 2. 高亮要删除的位置
   * 3. 调用 splice(index, 1) 删除一个元素
   * 4. 通知订阅者状态变更
   *
   * 【时间复杂度】O(n)
   * 删除元素后，后续所有元素需要向前移动一位
   *
   * 【边界情况】
   * - index < 0 或 index >= length：splice 会自动处理越界情况
   * - 空数组删除：不会报错，但无实际效果
   */
  async delete(index: number) {
    this.currentOperation = { type: 'delete', index };
    // 高亮即将被删除的元素位置
    this.highlightIndices = [index];

    // splice(index, 1)：从 index 位置开始删除 1 个元素
    this.data.splice(index, 1);
    this.notify();
  }

  /**
   * 线性搜索查找元素
   * @async
   * @param {any} value - 要搜索的目标值
   * @returns {Promise<number>} 找到返回索引，未找到返回 -1
   * @description 逐个比较数组元素，支持动画展示搜索过程
   *
   * 【算法原理 - 线性搜索 Linear Search】
   * 1. 从索引 0 开始依次遍历数组
   * 2. 每次比较前高亮当前位置并暂停 500ms（动画效果）
   * 3. 如果找到匹配项，立即返回当前索引
   * 4. 遍历结束仍未找到，返回 -1
   *
   * 【时间复杂度】
   * - 最佳情况（首元素即匹配）：O(1)
   * - 最坏情况（末尾或不存��）：O(n)
   * - 平均情况：O(n)
   *
   * 【空间复杂度】O(1)，仅使用常数额外空间
   *
   * 【适用场景】
   * - 小规模数据集
   * - 无序数组（无法使用二分查找优化）
   * - 教学演示线性搜索原理
   */
  async search(value: any): Promise<number> {
    this.currentOperation = { type: 'search', value };

    // 线性遍历：从第一个元素开始逐一比较
    for (let i = 0; i < this.data.length; i++) {
      // 高亮当前正在比较的位置
      this.highlightIndices = [i];
      this.notify();

      // 延迟 500ms 以便 UI 层渲染动画效果
      await new Promise(resolve => setTimeout(resolve, 500));

      // 使用严格相等运算符 (===) 进行值比较
      if (this.data[i] === value) {
        return i; // 找到目标，返回索引
      }
    }

    // 遍历完成未找到，清除高亮并返回 -1
    this.highlightIndices = [];
    this.notify();
    return -1;
  }

  /**
   * 冒泡排序算法（带可视化）
   * @async
   * @returns {Promise<void>}
   * @description 使用冒泡排序对数组进行升序排列，每步操作都有动画展示
   *
   * 【算法原理 - 冒泡排序 Bubble Sort】
   * 核心思想：重复遍历数组，比较相邻元素并在顺序错误时交换
   *
   * 具体步骤：
   * 1. 外层循环控制遍历轮数（共 n-1 轮）
   * 2. 内层循环比较相邻元素对 (j, j+1)
   * 3. 如果前者大于后者，交换两者位置
   * 4. 每轮结束后最大元素"冒泡"到数组末尾
   * 5. 下一轮可以减少一次比较（因为末尾已有序）
   *
   * 【时间复杂度】
   * - 最坏情况（逆序数组）：O(n²)，需要进行 n*(n-1)/2 次比较和交换
   * - 最佳情况（已排序数组）：O(n²)，但可以通过优化标志位提升至 O(n)
   * - 平均情况：O(n²)
   *
   * 【空间复杂度】O(1)，原地排序，仅需常数额外空间
   *
   * 【稳定性】稳定排序（相等元素的相对位置不变）
   *
   * 【优化建议】
   * 可添加 swapped 标志位检测是否发生交换，若某轮无交换则提前终止
   */
  async sort() {
    this.currentOperation = { type: 'sort' };
    this.highlightIndices = [];

    // 外层循环：控制排序轮数
    // 每轮将当前最大元素放到正确位置，因此共需 n-1 轮
    for (let i = 0; i < this.data.length; i++) {
      // 内层循环：相邻元素比较和交换
      // 注意：j < this.data.length - i - 1 是因为最后 i 个元素已经有序
      for (let j = 0; j < this.data.length - i - 1; j++) {
        // 高亮当前比较的两个相邻元素
        this.highlightIndices = [j, j + 1];
        this.notify();
        await new Promise(resolve => setTimeout(resolve, 500));

        // 如果前一个元素大于后一个元素，则交换它们
        if (this.data[j] > this.data[j + 1]) {
          // 使用解构赋值进行交换，简洁且高效
          [this.data[j], this.data[j + 1]] = [this.data[j + 1], this.data[j]];
          this.notify(); // 通知交换后的状态
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    // 排序完成，清除高亮
    this.highlightIndices = [];
    this.notify();
  }

  /**
   * 反转数组（带可视化）
   * @async
   * @returns {Promise<void>}
   * @description 使用双指针技术反转数组元素顺序，支持动画展示
   *
   * 【算法原理 - 双指针反转 Double Pointer Reversal】
   * 核心思想：使用左右两个指针从两端向中间靠拢，同时交换对应位置的元素
   *
   * 具体步骤：
   * 1. 初始化左指针 left=0，右指针 right=length-1
   * 2. 当 left < right 时循环：
   *     a. 高亮 left 和 right 位置
   *     b. 交换这两个位置的元素
   *     c. left++ 向右移动，right-- 向左移动
   * 3. 当 left >= right 时停止（奇数长度时两指针相遇，偶数长度时交叉）
   *
   * 【时间复杂度】O(n)
   * 只需遍历数组一半（n/2 次），每次操作都是 O(1)
   *
   * 【空间复杂度】O(1)，原地操作，仅使用两个指针变量
   *
   * 【边界情况处理】
   * - 空数组：while 条件不满足，直接跳过
   * - 单元素数组：left=0, right=0，条件不满足，无需操作
   * - 双元素数组：只需一次交换
   */
  async reverse() {
    this.currentOperation = { type: 'reverse' };
    // 左指针：从数组起始位置开始
    let left = 0;
    // 右指针：从数组末尾位置开始
    let right = this.data.length - 1;

    // 循环直到两指针相遇或交叉
    while (left < right) {
      // 高亮当前要交换的两个位置
      this.highlightIndices = [left, right];
      this.notify();
      await new Promise(resolve => setTimeout(resolve, 500));

      // 使用解构赋值交换左右指针对应的元素
      [this.data[left], this.data[right]] = [this.data[right], this.data[left]];

      // 移动指针：左指针右移，右指针左移
      left++;
      right--;

      // 通知交换后的新状态
      this.notify();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 反转完成，清除高亮
    this.highlightIndices = [];
    this.notify();
  }

  /**
   * 获取当前状态的快照
   * @returns {ArrayState} 当前状态的完整副本
   * @description 返回包含数据、操作信息和高亮索引的状态对象
   *
   * 【使用场景】
   * - 订阅者需要在非回调时机主动获取最新状态
   * - 外部组件初始化时获取初始数据进行渲染
   * - 调试和测试时检查内部状态
   *
   * 【数据安全】
   * 返回的所有数组都是深拷贝，修改返回值不会影响内部状态
   */
  getState(): ArrayState {
    return {
      data: [...this.data],                      // 深拷贝数据数组
      currentOperation: this.currentOperation,   // 当前操作引用
      highlightIndices: [...this.highlightIndices] // 深拷贝高亮索引
    };
  }

  /**
   * 重置操作状态
   * @returns {void}
   * @description 清除当前操作信息和高亮索引，恢复到空闲状态
   *
   * 【业务场景】
   * - 完成一次操作后准备下一次操作
   * - 用户点击"重置"按钮时
   * - 错误处理后恢复正常状态
   *
   * 【注意】
   * 此方法不会清空数据数组，只重置操作相关的元信息
   */
  reset() {
    this.currentOperation = null;       // 清除当前操作
    this.highlightIndices = [];         // 清空高亮索引
    this.notify();                      // 通知订阅者状态已重置
  }
}
