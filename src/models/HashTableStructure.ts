/**
 * @file HashTableStructure.ts
 * @description 哈希表（Hash Table）数据结构模型 - 算法可视化核心组件
 *
 * 【项目角色】
 * 本模块实现哈希表（散列表）的完整数据结构和操作逻辑，是算法可视化项目中
 * 哈希相关算法的数据层。通过观察者模式支持实时状态广播，使 UI 层能够动态展示
 * 哈希计算、冲突处理、扩容等核心过程。
 *
 * 【设计模式】
 * - 观察者模式（Observer Pattern）：subscribe/notify 机制实现响应式状态更新
 * - 拉链法（Separate Chaining）：使用链表处理哈希冲突
 * - 动态扩容（Dynamic Resizing）：根据负载因子自动调整容量
 *
 * 【核心职责】
 * 1. 实现哈希函数将键映射到桶（bucket）索引
 * 2. 管理桶数组，每个桶是一个链表以处理冲突
 * 3. 实现 CRUD 操作（set、get、delete）
 * 4. 监控负载因子并在超过阈值时自动扩容
 * 5. 统计和展示碰撞次数等性能指标
 *
 * 【业务场景】
 * - 缓存系统：演示 Redis/Memcached 的底层原理
 * - 数据库索引：演示 B-Tree 以外的另一种索引方式
 * - 符号表：演示编译器中标识符的管理
 * - 去重统计：演示集合的唯一性保证机制
 *
 * 【核心概念】
 * - 哈希函数（Hash Function）：将任意大小的输入映射到固定范围的输出
 * - 冲突（Collision）：不同键映射到同一个桶的情况
 * - 负载因子（Load Factor）：元素数量 / 桶数量，衡量表的填充程度
 * - 拉链法（Chaining）：每个桶维护一个链表存储所有映射到该位置的元素
 */

/**
 * 哈希表项接口
 * @interface HashTableItem
 * @description 定义存储在哈希表中的单个键值对
 */
interface HashTableItem {
  /** 键（字符串类型），用于哈希计算和查找 */
  key: string;
  /** 值（字符串类型），与键关联的数据 */
  value: string;
  /** 计算得到的哈希值（可选，用于调试和可视化） */
  hash?: number;
}

/**
 * 哈希表状态接口
 * @interface HashTableState
 * @description 向外部暴露的完整状态快照
 */
interface HashTableState {
  /**
   * 桶数组（Bucket Array）
   * 每个元素是一个链表（HashTableItem[]），存储映射到该位置的所有项
   * 空桶表示为空数组 []
   */
  buckets: (HashTableItem[])[];
  /** 当前表中存储的键值对数量 */
  size: number;
  /** 当前桶数组的容量（桶的数量） */
  capacity: number;
  /** 当前高亮的桶索引列表（用于可视化） */
  highlightBuckets: number[];
  /** 当前高亮的项列表（用于可视化具体元素） */
  highlightItems: HashTableItem[];
  /** 当前的负载因子 = size / capacity */
  loadFactor: number;
  /** 累计发生的碰撞次数（用于性能分析） */
  collisions: number;
  /** 操作说明消息（用于 UI 提示） */
  message?: string;
}

/**
 * 哈希表数据结构类
 * @class HashTableStructure
 * @description 封装哈希表的完整实现，使用拉链法处理冲突
 *
 * 【特性说明】
 * - 采用拉链法（Separate Chaining）解决哈希冲突
 * - 支持动态扩容，当负载因子超过阈值时自动翻倍容量
 * - 所有公共方法均为异步，支持逐步动画展示
 * - 内置详细的统计信息（碰撞次数、负载因子等）
 *
 * 【时间复杂度参考】（平均情况 / 最坏情况）
 * - set（插入/更新）：O(1) / O(n)（所有元素都在一个桶时）
 * - get（查询）：O(1) / O(n)
 * - delete（删除）：O(1) / O(n)
 *
 * 【空间复杂度】O(n + m)，n 为元素数量，m 为桶数量
 */
export class HashTableStructure {
  /**
   * 桶数组
   * @private
   * @type {(HashTableItem[])[]}
   * @description 核心存储结构，每个桶是一个链表（数组实现）
   * 使用数组而非真正的链表是因为 JavaScript 数组操作更高效
   */
  private buckets: (HashTableItem[])[];

  /**
   * 当前存储的键值对总数
   * @private
   * @type {number}
   */
  private size: number;

  /**
   * 当前桶数组的容量
   * @private
   * @type {number}
   * @description 初始默认值为 8，扩容时翻倍
   */
  private capacity: number;

  /**
   * 订阅者监听器列表
   * @private
   */
  private listeners: ((state: HashTableState) => void)[] = [];

  /**
   * 当前高亮的桶索引
   * @private
   * @type {number[]}
   */
  private highlightBuckets: number[] = [];

  /**
   * 当前高亮的项
   * @private
   * @type {HashTableItem[]}
   */
  private highlightItems: HashTableItem[] = [];

  /**
   * 累计碰撞计数器
   * @private
   * @type {number}
   * @description 统计发生的总碰撞次数（用于教学演示和性能分析）
   * 当插入时目标桶已有其他元素，视为一次碰撞
   */
  private collisions: number = 0;

  /**
   * 负载因子阈值
   * @private
   * @readonly
   * @type {number}
   * @description 当 loadFactor 超过此值时触发自动扩容
   * 经验值 0.75 在空间效率和查询效率之间取得良好平衡
   */
  private readonly LOAD_FACTOR_THRESHOLD = 0.75;

  /**
   * 构造函数
   * @constructor
   * @param {number} initialCapacity - 初始容量，默认为 8
   * @description 初始化哈希表实例
   *
   * 【初始化细节】
   * - 创建指定数量的空桶（每个桶是空数组）
   * - 初始化 size 为 0（无任何元素）
   * - 默认容量 8 是 2 的幂次，便于取模优化
   */
  constructor(initialCapacity: number = 8) {
    this.capacity = initialCapacity; // 设置初始容量
    // 创建桶数组：每个位置初始化为空数组（空链表）
    this.buckets = Array(initialCapacity).fill(null).map(() => []);
    this.size = 0; // 初始无元素
  }

  /**
   * 通知所有订阅者状态已更新
   * @private
   * @param {string} [message] - 可选的操作说明消息
   * @returns {void}
   * @description 构建完整的状态对象并通知所有监听器
   */
  private notify(message?: string) {
    const state: HashTableState = {
      buckets: this.buckets,                       // 桶数组引用
      size: this.size,                             // 元素数量
      capacity: this.capacity,                      // 容量
      highlightBuckets: [...this.highlightBuckets], // 高亮桶
      highlightItems: [...this.highlightItems],     // 高亮项
      loadFactor: this.getLoadFactor(),             // 计算当前负载因子
      collisions: this.collisions,                  // 碰撞统计
      message                                      // 操作消息
    };
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * 订阅状态变更事件
   * @param {(state: HashTableState) => void} listener - 状态变更回调函数
   * @returns {() => void} 取消订阅的函数
   */
  subscribe(listener: (state: HashTableState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 获取当前状态的快照
   * @returns {HashTableState} 当前状态的完整副本
   */
  getState(): HashTableState {
    return {
      buckets: this.buckets,
      size: this.size,
      capacity: this.capacity,
      highlightBuckets: [...this.highlightBuckets],
      highlightItems: [...this.highlightItems],
      loadFactor: this.getLoadFactor(),
      collisions: this.collisions
    };
  }

  /**
   * 哈希函数（Hash Function）
   * @private
   * @param {string} key - 要计算的键
   * @returns {number} 该键对应的桶索引（0 到 capacity-1）
   * @description 将字符串键转换为有效的桶索引
   *
   * 【算法原理 - DJB2 哈希算法变体】
   * 本实现采用类似 DJB2 的简单哈希算法：
   * 1. 初始化 hash = 0
   * 2. 对字符串中的每个字符：
   *     a. hash = hash * 33 + charCode（等价于 (hash << 5) - hash + charCode）
   *     b. 使用位与运算 (& hash) 保持为 32 位整数
   * 3. 最终结果取绝对值并对 capacity 取模
   *
   * 【为什么使用 (hash << 5) - hash？】
   * 这等同于 hash * 31（因为 2^5 - 1 = 31）
   * 31 是一个质数，在哈希算法中使用质数乘数能更好地分散哈希值，
   * 减少碰撞的概率。
   *
   * 【取模运算的作用】
   * Math.abs(hash) % this.capacity 将任意整数映射到 [0, capacity-1] 范围内，
   * 确保返回值是合法的桶索引。
   *
   * 【时间复杂度】O(k)，k 为键的长度
   * 【空间复杂度】O(1)
   *
   * 【哈希函数的质量指标】
   * - 均匀性：相似的键应产生差异较大的哈希值
   * - 确定性：相同输入总是产生相同输出
   * - 效率：计算速度要快
   */
  private hash(key: string): number {
    let hash = 0;
    // 遍历键的每个字符，逐步累积哈希值
    for (let i = 0; i < key.length; i++) {
      // ★ 核心：使用位运算加速乘法和加法
      // (hash << 5) 相当于 hash * 32
      // (hash << 5) - hash 相当于 hash * 31
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      // 位与运算确保结果保持在 32 位有符号整数范围内
      hash = hash & hash;
    }
    // 取模映射到桶索引范围，取绝对值避免负数索引
    return Math.abs(hash) % this.capacity;
  }

  /**
   * 计算当前负载因子
   * @private
   * @returns {number} 负载因子值（0 到 1+）
   * @description 负载因子 α = n / m，其中 n 是元素数，m 是桶数
   *
   * 【负载因子的意义】
   * - α 接近 0：表很稀疏，空间浪费但查询快
   * - α 接近 1：表很稠密，空间利用率高但碰撞增多
   * - α > 1：平均每个桶有多个元素（拉链法允许）
   *
   * 【为什么选择 0.75 作为阈值？】
   * Java 的 HashMap 也使用 0.75 作为默认负载因子，
   * 这是时间和空间的良好折中点。实验表明：
   * - α < 0.5：空间浪费严重
   * - 0.5 < α < 0.75：性能较好
   * - α > 0.75：碰撞显著增加，性能下降
   * - α > 1.0：退化为链表遍历
   */
  private getLoadFactor(): number {
    return this.size / this.capacity;
  }

  /**
   * 动态扩容（Resizing/Rehashing）
   * @private
   * @async
   * @param {number} newCapacity - 新的容量（通常是原容量的 2 倍）
   * @returns {Promise<void>}
   * @description 创建更大的桶数组并重新分布所有现有元素
   *
   * 【扩容流程】
   * 1. 保存旧的桶数组引用
   * 2. 创建新的空桶数组（新容量）
   * 3. 重置 size 和 collisions 为 0
   * 4. 遍历旧数组的每个桶中的每个元素
   * 5. 对每个元素重新计算哈希值（因为容量变了）
   * 6. 将元素插入到新桶数组的正确位置
   *
   * 【为什么要重新哈希（Rehash）？】
   * 因为桶索引是通过 hash % capacity 计算的，
   * 当 capacity 改变后，原来的索引可能不再正确。
   * 例如：hash=13, oldCap=8 → index=5; newCap=16 → index=13
   *
   * 【时间复杂度】O(n)，需要重新插入所有元素
   * 【空间复杂度】O(m)，需要额外的旧数组和新数组
   *
   * 【扩容策略】
   * 通常选择 2 倍扩容（doubling strategy），
   * 这样可以保持 O(1) 的均摊插入成本
   */
  private async resize(newCapacity: number) {
    const oldBuckets = this.buckets;       // 保存旧桶数组
    this.capacity = newCapacity;           // 更新容量
    // 创建新的空桶数组
    this.buckets = Array(newCapacity).fill(null).map(() => []);
    this.size = 0;                        // 重置大小（会在 set 中递增）
    this.collisions = 0;                   // 重置碰撞计数

    // 遍历旧桶数组，重新插入所有元素
    for (const bucket of oldBuckets) {
      for (const item of bucket) {
        // 重新插入每个元素（会重新计算哈希值）
        // 注意：checkResize=false 防止递归扩容
        await this.set(item.key, item.value, false);
      }
    }
  }

  /**
   * 插入或更新键值对（Set）
   * @async
   * @param {string} key - 键
   * @param {string} value - 值
   * @param {boolean} [checkResize=true] - 是否检查并执行扩容
   * @returns {Promise<boolean>} 总是返回 true
   * @description 在哈希表中插入新键值对或更新已存在的键的值
   *
   * 【算法原理】
   * 1. 计算键的哈希值，确定目标桶
   * 2. 在该桶的链表中查找是否已存在该键
   * 3. 如果存在，更新其值（不增加 size）
   * 4. 如果不存在，追加到链表末尾（size++）
   * 5. 如果是新插入且桶非空，collisions++
   * 6. 检查负载因子，必要时触发扩容
   *
   * 【时间复杂度】
   * - 平均情况：O(1)（假设哈希函数均匀）
   * - 最坏情况：O(n)（所有元素在同一桶）
   *
   * 【参数 checkResize 的作用】
   * 在 resize() 方法内部调用 set() 时传入 false，
   * 防止在扩容过程中再次触发扩容（无限递归）
   */
  async set(key: string, value: string, checkResize: boolean = true): Promise<boolean> {
    // 步骤 1：计算哈希值，确定目标桶
    const hash = this.hash(key);
    const item: HashTableItem = { key, value, hash };

    // 高亮目标桶并通知
    this.highlightBuckets = [hash];
    this.notify('计算哈希值: ' + hash);
    await new Promise(resolve => setTimeout(resolve, 500));

    // 步骤 2：获取目标桶
    const bucket = this.buckets[hash];

    // 步骤 3：在桶中查找是否已存在相同的键
    const existingIndex = bucket.findIndex(item => item.key === key);

    if (existingIndex >= 0) {
      // ★ 情况 A：键已存在 → 更新值
      bucket[existingIndex].value = value;
      this.highlightItems = [bucket[existingIndex]];
      this.notify('更新现有键的值');
    } else {
      // ★ 情况 B：键不存在 → 插入新项

      // 检测碰撞：如果桶中已有其他元素，则发生碰撞
      if (bucket.length > 0) {
        this.collisions++; // 碰撞计数 +1
      }

      // 追加新项到桶的链表末尾
      bucket.push(item);
      this.size++; // 元素总数 +1
      this.highlightItems = [item];
      this.notify('添加新项到桶中');
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // 步骤 4：检查是否需要扩容
    if (checkResize && this.getLoadFactor() > this.LOAD_FACTOR_THRESHOLD) {
      this.notify('负载因子超过阈值，调整哈希表大小');
      // 执行扩容：容量翻倍
      await this.resize(this.capacity * 2);
    }

    // 清除高亮并通知最终状态
    this.highlightBuckets = [];
    this.highlightItems = [];
    this.notify();
    return true;
  }

  /**
   * 根据键获取值（Get）
   * @async
   * @param {string} key - 要查找的键
   * @returns {Promise<string | null>} 找到返回对应值，未找到返回 null
   * @description 在哈希表中查找指定键对应的值
   *
   * 【算法原理】
   * 1. 计算键的哈希值，确定目标桶
   * 2. 在该桶的链表中线性搜索匹配的键
   * 3. 找到则返回值，未找到则返回 null
   *
   * 【时间复杂度】
   * - 平均情况：O(1)
   * - 最坏情况：O(n)（所有元素在同一桶且是最后一个）
   */
  async get(key: string): Promise<string | null> {
    // 计算哈希值
    const hash = this.hash(key);

    // 高亮目标桶
    this.highlightBuckets = [hash];
    this.notify('计算哈希值: ' + hash);
    await new Promise(resolve => setTimeout(resolve, 500));

    // 在桶中查找键
    const bucket = this.buckets[hash];
    const item = bucket.find(item => item.key === key);

    if (item) {
      // 找到了！
      this.highlightItems = [item];
      this.notify('找到键值对');
      await new Promise(resolve => setTimeout(resolve, 500));

      this.highlightBuckets = [];
      this.highlightItems = [];
      this.notify();
      return item.value; // 返回对应的值
    }

    // 未找到
    this.highlightBuckets = [];
    this.notify('未找到键');
    return null;
  }

  /**
   * 根据键删除键值对（Delete）
   * @async
   * @param {string} key - 要删除的键
   * @returns {Promise<boolean>} 成功删除返回 true，键不存在返回 false
   * @description 从哈希表中移除指定的键值对
   *
   * 【算法原理】
   * 1. 计算哈希值确定目标桶
   * 2. 在桶中查找该键
   * 3. 找到则从链表中移除，size--
   * 4. 移除后如果桶仍有其他元素，collisions--（减少一个碰撞）
   *
   * 【时间复杂度】
   * - 平均情况：O(1)
   * - 最坏情况：O(n)
   */
  async delete(key: string): Promise<boolean> {
    // 计算哈希值
    const hash = this.hash(key);

    this.highlightBuckets = [hash];
    this.notify('计算哈希值: ' + hash);
    await new Promise(resolve => setTimeout(resolve, 500));

    // 在桶中查找键的位置
    const bucket = this.buckets[hash];
    const index = bucket.findIndex(item => item.key === key);

    if (index >= 0) {
      // 找到了，准备删除
      const item = bucket[index];
      this.highlightItems = [item];
      this.notify('找到要删除的项');
      await new Promise(resolve => setTimeout(resolve, 500));

      // 从链表中移除该项
      bucket.splice(index, 1);
      this.size--; // 元素数减 1

      // 更新碰撞计数：如果删除后桶还有其他元素，碰撞数减 1
      if (bucket.length > 0) {
        this.collisions--;
      }

      this.highlightBuckets = [];
      this.highlightItems = [];
      this.notify('项已删除');
      return true;
    }

    // 未找到该键
    this.highlightBuckets = [];
    this.notify('未找到要删除的键');
    return false;
  }

  /**
   * 清空哈希表
   * @async
   * @returns {Promise<void>}
   * @description 移除所有键值对，重置所有统计信息
   *
   * 【注意】
   * 此方法不会改变容量（capacity），只清空数据
   */
  async clear() {
    // 重新创建空的桶数组（保持原容量）
    this.buckets = Array(this.capacity).fill(null).map(() => []);
    this.size = 0;        // 重置元素数
    this.collisions = 0;  // 重置碰撞计数
    this.highlightBuckets = [];
    this.highlightItems = [];
    this.notify('哈希表已清空');
  }

  /**
   * 获取当前元素数量
   * @returns {number} 键值对的总数
   */
  getSize(): number {
    return this.size;
  }

  /**
   * 获取当前容量
   * @returns {number} 桶数组的长度
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * 获取累计碰撞次数
   * @returns {number} 发生的碰撞总数
   * @description 用于性能分析和教学演示
   */
  getCollisions(): number {
    return this.collisions;
  }
}
