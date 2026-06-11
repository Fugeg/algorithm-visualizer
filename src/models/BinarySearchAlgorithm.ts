/**
 * @file BinarySearchAlgorithm.ts
 * @description 二分查找算法模型 —— 算法可视化核心组件之一
 *
 * 【模块定位】
 * 本模块实现二分查找（Binary Search）算法的完整执行引擎，是"分治法"思想的经典应用。
 * 在算法可视化项目中，它承担以下核心职责：
 *   1. 执行二分查找算法并记录每一步的中间状态（用于动画回放）
 *   2. 维护数组元素的5种视觉状态（default/searching/found/eliminated/mid），驱动前端高亮渲染
 *   3. 通过观察者模式（subscribe/notify）实时推送状态变更，实现响应式UI更新
 *   4. 提供随机有序数组的自动生成功能，方便用户快速开始演示
 *
 * 【设计模式】
 * - 观察者模式（Observer Pattern）：Subscriber机制允许外部组件（如React/Vue视图层）
 *   订阅算法状态变化，实现数据层与展示层的解耦
 * - 命令模式变体：binarySearch方法返回步骤数组（BinarySearchStep[]），
 *   支持正向播放、反向回退、跳转到任意步骤等交互需求
 * - 快照模式：每个步骤保存完整的数组状态副本，确保回放时的状态一致性
 *
 * 【算法原理 —— 二分查找】
 * 二分查找是一种在有序数组中查找目标值的高效算法：
 *   前提条件：数组必须按升序（或降序）排列
 *   核心思想：每次将搜索范围减半，通过比较中间元素与目标值决定排除哪一半
 *   时间复杂度：O(log n) —— 每次迭代排除一半候选空间
 *   空间复杂度：O(1) —— 仅使用常数个额外变量（迭代实现）
 *   对比线性搜索 O(n)：当 n=1000 时，二分最多需10次比较，线性最坏需1000次
 *
 * 【二分查找执行流程示例】
 * 数组: [1, 3, 5, 7, 9, 11, 13, 15], target = 7
 * ┌─────┬───────┬───────┬─────┬────────────────────────────────┐
 * │ 轮次│ left  │ right │ mid │           操作说明             │
 * ├─────┼───────┼───────┼─────┼────────────────────────────────┤
 * │  1  │   0   │   7   │  3  │ arr[3]=7 == target? → 找到!   │
 * └─────┴───────┴───────┴─────┴────────────────────────────────┘
 *
 * 【mid索引计算的安全写法】
 * 推荐使用: mid = left + Math.floor((right - left) / 2)
 * 而非:     mid = Math.floor((left + right) / 2)
 * 原因: 当left和right都接近Number.MAX_SAFE_INTEGER时，后者可能溢出。
 * 本项目因数组规模较小，采用简洁写法即可。
 */

/** ============================================================================
 *  接口定义区域
 *  ============================================================================ */

/**
 * 数组元素接口 —— 二分查找操作的基本单元
 *
 * 每个元素除了存储数值外，还携带一个"视觉状态"字段，
 * 用于驱动前端渲染时的高亮颜色、边框样式等视觉效果。
 *
 * 【状态转换图】
 * default ──→ searching ──→ mid ──→ found（成功路径）
 *    │                              │
 *    └──────────────────────────────┘
 *              eliminated（被排除的元素）
 */
export interface ArrayElement {
  /** 元素的数值内容，在有序数组中满足 arr[i] <= arr[i+1] */
  value: number;
  /**
   * 元素当前的视觉状态，共5种取值：
   * - 'default':      默认状态，未参与当前轮次的比较
   * - 'searching':    当前搜索范围内的活跃元素（高亮显示）
   * - 'found':        目标元素已被找到（绿色高亮）
   * - 'eliminated':   已被排除的元素（灰色淡化）
   * - 'mid':          当前轮次的中间位置元素（特殊高亮，如橙色）
   */
  state: 'default' | 'searching' | 'found' | 'eliminated' | 'mid';
}

/**
 * 二分查找单步快照接口 —— 记录算法执行的每一个离散步骤
 *
 * 每次调用 binarySearch() 会产生一系列 BinarySearchStep，
 * 这些步骤按时间顺序排列，前端可以逐个播放来实现"动画效果"。
 *
 * 【典型用途】
 * - 步骤播放器（Step Player）：逐帧展示算法进展
 * - 代码高亮联动：highlightLine 字段指示伪代码的当前执行行
 * - 变量监视器：variables 字段提供当前所有关键变量的快照
 */
export interface BinarySearchStep {
  /** 当前步骤的数组深拷贝，包含每个元素的value和state */
  array: ArrayElement[];
  /** 当前搜索范围的左边界索引（含），初始值为0 */
  left: number;
  /** 当前搜索范围的右边界索引（含），初始值为 array.length - 1 */
  right: number;
  /** 当前中间位置索引，未计算时为-1 */
  mid: number;
  /** 当前步骤的人类可读描述信息，用于在前端提示框或日志区展示 */
  message: string;
  /**
   * 高亮行号 —— 与前端的伪代码展示区联动
   * 当显示第N行伪代码时，该字段告诉前端应该高亮哪一行
   * 映射关系示例:
   *   0 → "开始二分查找"
   *   1 → "计算mid并比较"
   *   2 → "找到目标"
   *   3 → "排除左半部分"
   *   4 → "更新左边界"
   *   5 → "排除右半部分"
   *   6 → "更新右边界"
   *   7 → "未找到目标"
   */
  highlightLine: number;
  /**
   * 关键变量的键值对快照，用于前端的"变量监视面板"
   * 例如: { left: 0, right: 7, mid: 3, 'arr[3]': 7 }
   */
  variables: Record<string, string | number>;
}

/**
 * 二分查找算法的整体状态接口 —— 表示某一时刻算法的完整状态快照
 *
 * 与 BinarySearchStep 的区别：
 * - Step 是历史记录中的一个"帧"，不可变，用于回放
 * - State 是当前的"实时状态"，可变，用于订阅通知
 *
 * 典型应用场景：
 * - subscribe 回调函数接收的就是这个类型的对象
 * - getState() 方法返回当前时刻的状态快照
 */
export interface BinarySearchState {
  /** 当前数组及其各元素状态 */
  array: ArrayElement[];
  /** 左边界索引 */
  left: number;
  /** 右边界索引 */
  right: number;
  /** 中间位置索引 */
  mid: number;
  /** 可选的状态描述消息 */
  message?: string;
  /** 算法是否已终止（找到或确认不存在） */
  isComplete: boolean;
  /**
   * 目标元素的索引位置
   * - >= 0: 表示找到目标的索引
   * - -1:  表示目标不存在于数组中
   */
  foundIndex: number;
}

/**
 * 订阅者函数类型别名
 * 外部组件通过订阅此回调来接收算法状态变更通知
 * @param state - 最新的算法状态快照
 */
type Subscriber = (state: BinarySearchState) => void;

/** ============================================================================
 *  类定义区域
 *  ============================================================================ */

/**
 * 二分查找算法类 —— 核心算法引擎
 *
 * 【职责概述】
 * 本类封装了二分查找算法的完整生命周期管理：
 *   初始化 → 设置目标数组 → 执行查找 → 记录步骤 → 通知订阅者 → 支持重置
 *
 * 【内部状态管理】
 * 维护6个核心私有属性，共同描述算法的当前执行状态：
 *   - array:       待查找的有序数组（带状态标记）
 *   - left/right:  当前搜索窗口的左右边界
 *   - mid:         当前中间位置
 *   - foundIndex:  查找结果（-1表示未找到）
 *   - isComplete:  算法是否结束
 *   - steps:       已记录的所有步骤（用于回放）
 *
 * 【使用示例】
 * ```typescript
 * const algo = new BinarySearchAlgorithm();
 * algo.generateSortedArray(10);  // 生成10个随机有序数
 * algo.subscribe((state) => console.log(state.message));
 * const steps = algo.binarySearch(42);  // 查找42，返回所有步骤
 * // steps 可用于前端逐步播放
 * ```
 */
export class BinarySearchAlgorithm {
  /** 有序数组，每个元素携带视觉状态标记 */
  private array: ArrayElement[];

  /** 搜索范围左边界（含），初始为0 */
  private left: number;

  /** 搜索范围右边界（含），初始为数组末尾索引 */
  private right: number;

  /** 中间位置索引，-1表示尚未计算 */
  private mid: number;

  /**
   * 目标值的找到位置
   * - >= 0: 目标所在的索引
   * - -1:  目标不在数组中
   */
  private foundIndex: number;

  /** 算法是否已完成（无论成功还是失败） */
  private isComplete: boolean;

  /** 算法执行过程中记录的所有步骤快照，支持回放功能 */
  private steps: BinarySearchStep[];

  /** 观察者列表 —— 存储所有订阅了状态变更的外部回调函数 */
  private subscribers: Subscriber[];

  /**
   * 构造函数 —— 初始化二分查找算法实例
   *
   * @param initialArray - 初始的有序数值数组，默认为空数组
   *
   * 【初始化细节】
   * - 将纯数字数组转换为 ArrayElement[]，每个元素初始状态为 'default'
   * - 边界指针初始化为无效状态（right=0, mid=-1），等待 setArray() 或 generateSortedArray() 设置有效值
   * - foundIndex=-1 表示"尚未查找"或"未找到"
   * - subscribers 为空数组，后续通过 subscribe() 添加监听器
   *
   * 【设计考量】
   * 构造函数接受数字数组而非 ArrayElement[]，降低了使用门槛——
   * 用户无需关心内部的状态标记系统，只需传入普通数值即可。
   */
  constructor(initialArray: number[] = []) {
    /* 将每个原始数值包装为带默认状态的 ArrayElement 对象 */
    this.array = initialArray.map(value => ({ value, state: 'default' as const }));
    this.left = 0;
    this.right = 0;
    this.mid = -1;            /* -1 是"无效/未设置"的哨兵值 */
    this.foundIndex = -1;     /* -1 表示"未找到"或"尚未搜索" */
    this.isComplete = false;
    this.steps = [];
    this.subscribers = [];
  }

  /**
   * 内部通知方法 —— 向所有订阅者广播当前算法状态
   *
   * 【观察者模式的核心实现】
   * 此方法是发布-订阅机制的"发布端"，每次调用时会：
   *   1. 构建当前状态的深拷贝快照（防止外部修改影响内部状态）
   *   2. 遍历所有已注册的订阅者回调，逐一调用
   *
   * 【防御性拷贝的重要性】
   * array 使用展开运算符 `[...this.array]` 进行浅拷贝。
   * 由于 ArrayElement 的 state 属性可能被外部误改（虽然不应如此），
   * 更严格的实现可以使用 deep clone。本项目采用浅拷贝以平衡性能与安全性。
   *
   * @param message - 可选的状态描述文本，会附加到通知的 state.message 字段
   *
   * 【调用时机】
   * - setArray() 完成后: 通知"数组已更新"
   * - reset() 完成后:     通知"已重置"
   * - binarySearch() 结束后: 通知查找结果（成功/失败）
   */
  private notify(message?: string) {
    /* 构建完整的当前状态快照 */
    const state: BinarySearchState = {
      array: [...this.array],         /* 浅拷贝数组，隔离内外部状态 */
      left: this.left,
      right: this.right,
      mid: this.mid,
      message,
      isComplete: this.isComplete,
      foundIndex: this.foundIndex
    };
    /* 广播给所有订阅者 —— forEach 保证顺序执行 */
    this.subscribers.forEach(subscriber => subscriber(state));
  }

  /**
   * 订阅算法状态变更 —— 注册一个观察者回调
   *
   * 【观察者模式的"订阅端"】
   * 外部组件（如 React 组件、Vue 组件、控制台日志器等）
   * 通过此方法注册对算法状态变化的兴趣。
   *
   * @param subscriber - 回调函数，每当算法状态变更时会被调用，
   *                     接收最新的 BinarySearchState 作为参数
   * @returns 取消订阅的函数 —— 调用此函数可将该订阅者从列表中移除
   *         （遵循与 useEffect cleanup 类似的模式，避免内存泄漏）
   *
   * 【使用模式示例】
   * ```typescript
   * // 订阅
   * const unsubscribe = algo.subscribe((state) => {
   *   console.log(`搜索范围: [${state.left}, ${state.right}]`);
   * });
   * // ... 后续不再需要时取消订阅
   * unsubscribe();
   * ```
   *
   * 【取消订阅的实现方式】
   * 返回一个闭包函数，内部通过 filter 移除自身引用。
   * 这是 JavaScript 中标准的"手动清理"订阅模式。
   */
  subscribe(subscriber: Subscriber) {
    this.subscribers.push(subscriber);
    /* 返回取消订阅的闭包函数 */
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== subscriber);
    };
  }

  /**
   * 获取当前算法状态的只读快照
   *
   * @returns 当前时刻的完整状态副本，包含数组、边界、结果等信息
   *
   * 【与 notify() 的区别】
   * - notify(): 主动推送给所有订阅者
   * - getState(): 被动查询，供任意代码获取当前状态
   *
   * 【典型使用场景】
   * - React 组件在 mount 时调用一次，获取初始状态用于渲染
   * - 测试代码中断言检查某个时刻的状态是否符合预期
   */
  getState(): BinarySearchState {
    return {
      array: [...this.array],
      left: this.left,
      right: this.right,
      mid: this.mid,
      isComplete: this.isComplete,
      foundIndex: this.foundIndex
    };
  }

  /**
   * 获取算法执行过程中记录的所有步骤
   *
   * @returns 步骤快照数组，按执行时间顺序排列
   *
   * 【返回值的用途】
   * 前端的"步骤播放器"组件利用此返回值实现：
   *   - 逐步前进/后退（Step Forward / Step Backward）
   *   - 跳转到指定步骤（Jump to Step N）
   *   - 自动播放（Auto-play with configurable speed）
   *
   * 【注意】
   * 返回的是内部 steps 数组的引用。由于 BinarySearchStep 中的 array
   * 已经是深拷贝，外部修改不会影响内部状态，因此此处无需再次拷贝。
   */
  getSteps(): BinarySearchStep[] {
    return this.steps;
  }

  /**
   * 设置待查找的目标有序数组
   *
   * 【完整重置语义】
   * 此方法不仅替换数组，还会重置所有算法状态到"初始"状态：
   *   - 所有元素状态归为 'default'
   *   - 搜索边界恢复到覆盖全数组
   *   - 清空历史步骤（之前的查找记录作废）
   *   - 通知订阅者数组已更新
   *
   * @param arr - 新的有序数值数组（必须是升序排列，本方法不负责排序校验）
   *
   * 【前置条件】
   * 调用者应确保传入的数组是有序的。二分查找的正确性依赖于有序性前提。
   * 如果传入无序数组，算法行为未定义（可能找不到存在的元素）。
   *
   * 【与构造函数的关系】
   * 构造函数也可以接收初始数组，但 setArray 允许在对象生命周期内更换数组，
   * 无需销毁重建实例。这符合"开放-封闭原则"——对扩展开放，对修改封闭。
   */
  setArray(arr: number[]) {
    /* 将数值数组转换为带状态标记的元素数组 */
    this.array = arr.map(value => ({ value, state: 'default' as const }));
    /* 重置搜索范围为整个数组 */
    this.left = 0;
    this.right = arr.length - 1;
    /* 重置中间位置和查找结果为无效值 */
    this.mid = -1;
    this.foundIndex = -1;
    this.isComplete = false;
    /* 清空之前的历史步骤 */
    this.steps = [];
    /* 通知订阅者：新数组已就绪 */
    this.notify('数组已更新');
  }

  /**
   * 生成随机有序数组并设置为当前查找数组
   *
   * 【算法原理】
   * 采用"采样+排序"策略生成严格递增的无重复有序数组：
   *   1. 使用 Set 数据结构进行随机采样（自动去重保证唯一性）
   *   2. 将 Set 转换为数组后排序
   *   3. 通过 setArray() 将其设为当前工作数组
   *
   * 【为什么用 Set？】
   * Set 的两个关键特性完美适配此场景：
   *   - 自动去重: add() 相同值不会重复插入，避免二分查找中出现相同元素导致歧义
   *   - O(1) 查重: 内部使用哈希表，判断是否已存在某值是常数时间
   *
   * @param size - 要生成的元素数量（数组的长度）
   * @param min  - 随机数的下界（含），默认为1
   * @param max  - 随机数的上界（含），默认为100
   * @returns 生成的有序数组（升序排列，无重复元素）
   *
   * 【时间复杂度分析】
   * - 期望采样次数: O(size * (max-min+1)/(max-min+1-size)) ≈ O(n * log(n/(N-n)))
   *   当 max-min 远大于 size 时，几乎每次都能插入成功，接近 O(size)
   * - 排序: O(size * log(size)) （Set转数组后的标准排序）
   * - 总体: O(size * log(size)) （由排序主导）
   *
   * 【潜在问题】
   * 如果 size > (max - min + 1)，while 循环将永远不会终止（无法采集到足够的不同值）。
   * 生产环境应添加此边界检查。
   */
  generateSortedArray(size: number, min: number = 1, max: number = 100): number[] {
    /*
     * 使用 Set 进行不重复随机采样
     * Set 的特性保证了每个值只会出现一次，这对二分查找很重要
     * （虽然二分查找技术上可以处理重复值，但无重复使教学更清晰）
     */
    const set = new Set<number>();
    while (set.size < size) {
      /* 生成 [min, max] 范围内的随机整数 */
      set.add(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    /* Set → Array 并按升序排序，得到严格的有序数组 */
    const sorted = Array.from(set).sort((a, b) => a - b);
    /* 将生成的数组设置为当前工作数组 */
    this.setArray(sorted);
    return sorted;
  }

  /**
   * 重置算法状态 —— 清除上一次查找的所有痕迹，准备新一轮查找
   *
   * 【与 setArray() 的区别】
   * - setArray(): 更换数组内容 + 重置状态
   * - reset():     保持数组不变，仅清除查找痕迹（状态标记、边界、步骤等）
   *
   * 【具体重置项】
   * 1. 所有元素状态归为 'default'（但注意：不改变 value）
   * 2. 搜索边界恢复为全数组范围 [0, length-1]
   * 3. mid 和 foundIndex 归为无效值 (-1)
   * 4. isComplete 设为 false
   * 5. 清空历史步骤记录
   * 6. 通知订阅者
   *
   * 【何时调用】
   * - 用户点击"重新开始"按钮时
   * - 切换目标值准备再次查找时
   * - 在同一数组上进行多次对比实验时
   */
  reset() {
    /* 遍历数组，将所有元素状态重置为 'default' */
    for (let i = 0; i < this.array.length; i++) {
      this.array[i].state = 'default';
    }
    /* 恢复搜索边界到完整数组范围 */
    this.left = 0;
    this.right = this.array.length - 1;
    /* 清除中间位置和查找结果 */
    this.mid = -1;
    this.foundIndex = -1;
    this.isComplete = false;
    /* 清空历史步骤 */
    this.steps = [];
    /* 通知订阅者：已重置，可开始新的查找 */
    this.notify('已重置');
  }

  /**
   * 记录当前状态为一个查找步骤快照
   *
   * 【快照的内容】
   * 每个步骤保存的信息足以让前端完整还原该时刻的场景：
   *   - array:    数组的完整状态（每个元素的颜色/高亮情况）
   *   - left/right/mid: 三个关键指针的位置
   *   - message:  人类可读的操作说明
   *   - highlightLine:  伪代码高亮行号
   *   - variables: 变量监视面板的数据源
   *
   * 【深拷贝的必要性】
   * array 使用 map + 展开运算符 `{ ...el }` 创建每个元素的浅拷贝，
   * 这样后续对原数组元素的 state 修改不会影响已记录的步骤。
   * 这对于"回放"功能至关重要 —— 历史步骤必须是不可变的。
   *
   * @param message - 该步骤的文字描述
   * @param highlightLine - 对应的伪代码行号（用于前端代码高亮联动）
   * @param variables - 当前关键变量的快照，默认为空对象
   */
  private recordStep(message: string, highlightLine: number, variables: Record<string, string | number> = {}) {
    this.steps.push({
      /* 深拷贝数组：创建每个元素的新对象，防止后续修改污染历史记录 */
      array: this.array.map(el => ({ ...el })),
      left: this.left,
      right: this.right,
      mid: this.mid,
      message,
      highlightLine,
      variables
    });
  }

  /**
   * 重置非永久性元素状态 —— 每轮循环前的状态刷新
   *
   * 【设计意图】
   * 在二分查找的主循环中，每轮迭代开始时需要：
   *   - 清除上一轮遗留的 'searching' 和 'mid' 状态
   *   - 保留 'eliminated' 和 'found' 状态（这些是"永久的"结论性标记）
   *
   * 这确保了每轮迭代的视觉呈现都是"干净"的，
   * 用户不会被过期的状态标记所干扰。
   *
   * 【状态分类】
   * - 临时状态（每轮重置）: 'default', 'searching', 'mid'
   * - 永久状态（跨轮保持）: 'found', 'eliminated'
   *
   * 【为什么保留 eliminated？】
   * 'eliminated' 标记表示"该元素已被证明不可能包含目标值"，
   * 这是一个确定的结论，应该在后续所有轮次中都保持可见（通常以灰色显示），
   * 让用户直观感受到"搜索空间在不断缩小"的过程。
   */
  private resetElementStates() {
    for (let i = 0; i < this.array.length; i++) {
      /* 只重置临时状态，保留永久性的 eliminated 和 found 标记 */
      if (this.array[i].state !== 'eliminated' && this.array[i].state !== 'found') {
        this.array[i].state = 'default';
      }
    }
  }

  /**
   * 执行二分查找算法 —— 核心方法
   *
   * 【算法完整流程】
   * ┌─────────────────────────────────────────────────────────────┐
   * │  阶段1: 初始化                                              │
   * │    - 清空历史步骤                                            │
   * │    - 重置所有元素状态为 default                               │
   * │    - 设置搜索边界 [0, n-1]                                   │
   * │    - 记录"开始查找"步骤                                       │
   * ├─────────────────────────────────────────────────────────────┤
   * │  阶段2: 主循环 (while left <= right)                         │
   * │    ① 重置临时元素状态                                        │
   * │    ② 标记当前搜索范围为 'searching'                          │
   * │    ③ 计算 mid = floor((left + right) / 2)                   │
   * │    ④ 标记 mid 位置为 'mid'                                   │
   * │    ⑤ 比较 arr[mid] 与 target:                               │
   * │       - 相等 → 找到！记录并返回                              │
   * │       - arr[mid] < target → 排除左半区，left = mid + 1       │
   * │       - arr[mid] > target → 排除右半区，right = mid - 1      │
   * │    ⑥ 记录本轮步骤                                           │
   * ├─────────────────────────────────────────────────────────────┤
   * │  阶段3: 未找到处理                                           │
   * │    - 循环结束仍未找到 → 目标不存在                            │
   * │    - 标记所有元素为 eliminated                                │
   * │    - 记录最终步骤并返回                                       │
   * └─────────────────────────────────────────────────────────────┘
   *
   * @param target - 要查找的目标值
   * @returns 本次查找产生的所有步骤快照数组，可用于前端逐步播放
   *
   * 【时间复杂度】
   * - 最佳情况: O(1) —— 目标恰好在第一次检查的中间位置
   * - 最坏情况: O(log n) —— 目标不存在或位于边界附近
   * - 平均情况: O(log n) —— 每次排除一半候选空间
   *
   * 【空间复杂度】
   * - O(log n) 用于存储步骤记录（每轮产生固定数量的步骤）
   * - 若不计步骤记录，算法本身仅需 O(1) 额外空间
   *
   * 【执行示例】
   * 数组: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91], target = 23
   *
   * 第1轮: left=0, right=9, mid=4, arr[4]=16
   *        16 < 23 → 排除左半区 [0..4], left=5
   *
   * 第2轮: left=5, right=9, mid=7, arr[7]=56
   *        56 > 23 → 排除右半区 [7..9], right=6
   *
   * 第3轮: left=5, right=6, mid=5, arr[5]=23
   *        23 === 23 → 找到! 返回 index=5
   *
   * 总计3轮比较（log₂(10) ≈ 3.32，向上取整为4，实际用了3轮就找到了）
   */
  binarySearch(target: number): BinarySearchStep[] {
    /* ======== 阶段1: 初始化 ======== */

    /* 清空上次查找的历史步骤记录 */
    this.steps = [];
    /* 重置查找结果为"未找到"状态 */
    this.foundIndex = -1;
    this.isComplete = false;

    /* 将所有元素状态重置为 default（清除上一次查找留下的痕迹） */
    for (let i = 0; i < this.array.length; i++) {
      this.array[i].state = 'default';
    }

    /* 初始化搜索边界为整个数组范围 */
    this.left = 0;
    this.right = this.array.length - 1;

    /* 记录第一步："开始二分查找"，highlightLine=0 对应伪代码起始行 */
    this.recordStep('开始二分查找', 0, { target });

    /* ======== 阶段2: 主循环 ======== */
    /*
     * 循环条件: left <= right
     * 含义: 只要搜索范围不为空（至少还有一个元素未被排除），就继续查找
     * 当 left > right 时，搜索范围为空，可以确定目标不存在
     */
    while (this.left <= this.right) {

      /* 步骤①: 重置临时状态（清除上一轮的 searching/mid 标记，保留 eliminated/found） */
      this.resetElementStates();

      /* 步骤②: 将当前搜索范围内的所有元素标记为 'searching'（蓝色高亮） */
      for (let i = this.left; i <= this.right; i++) {
        this.array[i].state = 'searching';
      }

      /*
       * 步骤③: 计算中间位置
       * 使用向下取整确保 mid 为整数索引
       * 当搜索范围内有偶数个元素时，mid 偏左（例如 [0,1,2,3] 的 mid=1）
       */
      this.mid = Math.floor((this.left + this.right) / 2);

      /* 步骤④: 将中间位置元素标记为 'mid'（特殊颜色如橙色，突出显示当前比较对象） */
      this.array[this.mid].state = 'mid';

      /* 记录"计算mid"这一步骤，highlightLine=1 对应伪代码的比较行 */
      this.recordStep(
        `搜索范围 [${this.left}, ${this.right}]，中间位置 ${this.mid}，值为 ${this.array[this.mid].value}`,
        1,
        { left: this.left, right: this.right, mid: this.mid, [`arr[${this.mid}]`]: this.array[this.mid].value }
      );

      /*
       * 步骤⑤: 三路分支比较 —— 二分查找的核心决策点
       * 根据 arr[mid] 与 target 的关系，决定下一步行动
       */

      if (this.array[this.mid].value === target) {
        /* ----- 分支A: 找到目标 ----- */
        /* 将目标元素标记为 'found'（绿色高亮） */
        this.array[this.mid].state = 'found';
        this.foundIndex = this.mid;
        this.isComplete = true;

        /* 将其余所有非 eliminated 的元素也标记为 eliminated（表示"不需要再找了"） */
        for (let i = 0; i < this.array.length; i++) {
          if (i !== this.mid && this.array[i].state !== 'eliminated') {
            this.array[i].state = 'eliminated';
          }
        }

        /* 记录最终成功步骤，highlightLine=2 对应伪代码的"找到"行 */
        this.recordStep(
          `找到目标 ${target}，位于索引 ${this.mid}`,
          2,
          { left: this.left, right: this.right, mid: this.mid, foundIndex: this.mid }
        );
        /* 通知订阅者查找完成（成功），并立即返回步骤数组 */
        this.notify('二分查找完成，已找到目标');
        return this.steps;

      } else if (this.array[this.mid].value < target) {
        /* ----- 分支B: 中间值小于目标 → 目标在右半区 ----- */
        /*
         * 因为数组有序且 arr[mid] < target，
         * 所以 arr[left...mid] 都 < target（它们都 <= arr[mid]），
         * 可以安全地排除整个左半区
         */

        /* 记录"排除左半区"的决策步骤，highlightLine=3 */
        this.recordStep(
          `${this.array[this.mid].value} < ${target}，排除左半部分`,
          3,
          { left: this.left, right: this.right, mid: this.mid, [`arr[${this.mid}]`]: this.array[this.mid].value }
        );

        /* 将被排除的左半区元素标记为 'eliminated'（灰色淡化） */
        for (let i = this.left; i <= this.mid; i++) {
          this.array[i].state = 'eliminated';
        }

        /* 缩小搜索范围：左边界移到 mid 右侧一位 */
        this.left = this.mid + 1;

        /* 记录范围更新步骤，highlightLine=4 */
        this.recordStep(
          `更新搜索范围为 [${this.left}, ${this.right}]`,
          4,
          { left: this.left, right: this.right }
        );

      } else {
        /* ----- 分支C: 中间值大于目标 → 目标在左半区 ----- */
        /*
         * 因为数组有序且 arr[mid] > target，
         * 所以 arr[mid...right] 都 > target（它们都 >= arr[mid]），
         * 可以安全地排除整个右半区
         */

        /* 记录"排除右半区"的决策步骤，highlightLine=5 */
        this.recordStep(
          `${this.array[this.mid].value} > ${target}，排除右半部分`,
          5,
          { left: this.left, right: this.right, mid: this.mid, [`arr[${this.mid}]`]: this.array[this.mid].value }
        });

        /* 将被排除的右半区元素标记为 'eliminated'（灰色淡化） */
        for (let i = this.mid; i <= this.right; i++) {
          this.array[i].state = 'eliminated';
        }

        /* 缩小搜索范围：右边界移到 mid 左侧一位 */
        this.right = this.mid - 1;

        /* 记录范围更新步骤，highlightLine=6 */
        this.recordStep(
          `更新搜索范围为 [${this.left}, ${this.right}]`,
          6,
          { left: this.left, right: this.right }
        );
      }
      /* 循环继续：回到 while 条件检查，若 left <= right 则进入下一轮 */
    }

    /* ======== 阶段3: 未找到处理 ======== */
    /*
     * 退出循环的原因: left > right，即搜索范围为空
     * 结论: 目标值不存在于数组中的任何位置
     */

    /* 标记算法已完成（虽然结果是"未找到"） */
    this.isComplete = true;
    this.foundIndex = -1;

    /* 将所有元素标记为 eliminated（表示全部排查完毕，无一匹配） */
    for (let i = 0; i < this.array.length; i++) {
      this.array[i].state = 'eliminated';
    }

    /* 记录最终失败步骤，highlightLine=7 对应伪代码的"未找到"行 */
    this.recordStep(
      `未找到目标 ${target}`,
      7,
      { target, left: this.left, right: this.right }
    );
    /* 通知订阅者查找完成（失败），返回步骤数组 */
    this.notify('二分查找完成，未找到目标');
    return this.steps;
  }
}
