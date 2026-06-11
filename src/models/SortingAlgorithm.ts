/**
 * ============================================================================
 * 排序算法可视化模型类 - SortingAlgorithm
 * ============================================================================
 *
 * 【排序算法分类】
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  比较排序（基于元素间的比较操作）                                       │
 * │  ├─ 冒泡排序    O(n²)      稳定   简单但效率低                         │
 * │  ├─ 选择排序    O(n²)      不稳定 简单但效率低                         │
 * │  ├─ 插入排序    O(n²)      稳定   小规模/近乎有序时高效                  │
 * │  ├─ 希尔排序    O(n^1.3)   不稳定 插入排序的改进版                      │
 * │  ├─ 快速排序    O(n log n) 不稳定 实际应用中最快（平均情况）              │
 * │  ├─ 归并排序    O(n log n) 稳定   需要额外空间                          │
 * │  └─ 堆排序      O(n log n) 不稳定 原地排序，空间O(1)                    │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │  非比较排序（不依赖元素间比较）                                         │
 * │  ├─ 计数排序    O(n+k)     稳定   k=值域大小，适合值域有限的整数          │
 * │  ├─ 桶排序      O(n+k)     稳定   k=桶数量，适合均匀分布的数据             │
 * │  └─ 基数排序    O(d×n)     稳定   d=位数，按位逐次排序                   │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * 【稳定性概念】
 * 稳定性：相等元素的相对顺序在排序后保持不变。
 * 例如：对 [(3,a), (1,b), (3,c), (2,d)] 排序，
 *       稳定排序结果中 (3,a) 仍在 (3,c) 前面。
 *
 * 【本类的核心职责】
 * 本类是排序算法的"录制器"——它不直接修改UI，而是：
 * 1. 接收初始数组，执行某种排序算法
 * 2. 在算法的每个关键节点调用 recordStep() "拍照"
 * 3. 最终生成完整的步骤序列（SortingStep[]）
 * 4. PlaybackController 负责读取这些步骤并逐帧播放给用户看
 *
 * 这种"录制-播放"分离的设计使得算法逻辑与展示逻辑完全解耦。
 * ============================================================================
 */

/**
 * 数组元素接口——每个元素不仅包含数值，还携带视觉状态信息
 *
 * 设计决策：将 value 和 state 绑定为对象而非分开存储，
 * 这样每一步的数组快照都能独立记录每个元素的颜色状态，
 * 播放时可以直接渲染而无需额外的状态映射表。
 */
export interface ArrayElement {
  /** 元素的数值 */
  value: number;
  /**
   * 元素的视觉状态/颜色标记，用于可视化时区分不同角色
   *
   * 各状态的含义：
   * - default:   默认状态（灰/白色），未参与当前操作的元素
   * - comparing: 正在被比较的两个元素（通常用红色高亮显示）
   * - sorted:    已确定最终位置（通常用绿色表示完成）
   * - swapping:  正在执行交换的两个元素（可用特殊动画效果）
   * - pivot:     快速排序中的基准元素（用醒目颜色如紫色标识）
   * - current:   当前正在处理的元素（如插入排序中被拿出来的元素）
   * - subarray:  归并/希尔排序中当前处理的子区间（用背景色区分）
   * - heap:      堆排序中正在调整的堆节点
   * - counting:  计数排序中正在统计的元素
   * - bucket:    桶排序中正在分配到桶的元素
   * - radix:     基数排序中正在按位处理的元素
   */
  state: 'default' | 'comparing' | 'sorted' | 'swapping' | 'pivot' | 'current' | 'subarray' | 'heap' | 'counting' | 'bucket' | 'radix';
}

/**
 * 排序步骤接口——算法执行过程中某一时刻的完整快照
 *
 * 每一个 SortingStep 代表动画的一帧。PlaybackController 会按顺序
 * 将这些步骤推送给 UI 层渲染，形成连续的排序过程动画。
 */
export interface SortingStep {
  /**
   * 当前时刻的完整数组快照（含每个元素的颜色状态）
   *
   * 关键设计：这里存储的是深拷贝后的数组，因此每一帧都是独立的，
   * 后续步骤不会影响已记录的历史帧。这保证了回退/跳转功能正确工作。
   */
  array: ArrayElement[];
  /** 累计比较次数——用于性能统计面板展示 */
  comparisons: number;
  /** 累计交换次数——用于性能统计面板展示 */
  swaps: number;
  /** 当前步骤的文字描述——显示在 UI 的提示区域，帮助用户理解正在发生什么 */
  message: string;
  /**
   * 高亮行号——与伪代码面板同步
   *
   * UI 侧会维护一份该算法的伪代码列表，此字段指示当前执行到哪一行，
   * 实现伪代码高亮与数组动画的同步联动。
   */
  highlightLine: number;
  /**
   * 变量监控面板数据——以键值对形式展示当前作用域内的变量
   *
   * 例如 { i: 0, j: 5, pivot: 42 }，UI 会将其渲染为变量监视表格，
   * 让用户实时观察算法内部变量的变化。
   */
  variables: Record<string, string | number>;
}

/** 内部状态接口——用于订阅通知机制，比 SortingStep 更轻量 */
interface SortingState {
  array: ArrayElement[];
  comparisons: number;
  swaps: number;
  message?: string;
}

export class SortingAlgorithm {
  private array: ArrayElement[];
  private listeners: ((state: SortingState) => void)[] = [];
  private comparisons: number = 0;
  private swaps: number = 0;
  private delay: number;
  private steps: SortingStep[] = [];
  private cancelled: boolean = false;

  constructor(initialArray: number[] = [], delay: number = 500) {
    this.array = initialArray.map(value => ({ value, state: 'default' }));
    this.delay = delay;
  }

  private notify(message?: string) {
    const state: SortingState = {
      array: [...this.array],
      comparisons: this.comparisons,
      swaps: this.swaps,
      message
    };
    this.listeners.forEach(listener => listener(state));
  }

  subscribe(listener: (state: SortingState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getState(): SortingState {
    return {
      array: [...this.array],
      comparisons: this.comparisons,
      swaps: this.swaps
    };
  }

  getSteps(): SortingStep[] {
    return this.steps;
  }

  setArray(newArray: number[]) {
    this.array = newArray.map(value => ({ value, state: 'default' }));
    this.comparisons = 0;
    this.swaps = 0;
    this.steps = [];
    this.notify('数组已更新');
  }

  /**
   * ========================================================================
   * recordStep —— 所有排序算法共用的步骤记录方法（核心基础设施）
   * ========================================================================
   *
   * 【为什么需要这个方法？】
   * 排序算法可视化的本质是将算法执行过程"离散化"为一组有序的快照。
   * 每当算法到达一个"有意义的时刻"（如比较、交换、分区完成等），
   * 就调用此方法将当前状态保存下来。
   *
   * 【深拷贝的设计决策】
   * 使用 `this.array.map(el => ({ ...el }))` 对每个 ArrayElement 进行浅拷贝，
   * 再通过 map 创建新数组，实现完整的深拷贝。这确保了：
   * - 步骤 N 的数组状态不会因为后续步骤的修改而被污染
   * - 用户可以自由地前进/后退/跳转到任意步骤，看到的都是正确的状态
   *
   * 【调用时机】
   * 算法作者需要在以下时机手动调用 recordStep：
   * 1. 算法开始/结束时（用于显示标题和总结）
   * 2. 比较操作前后（显示哪两个元素被比较）
   * 3. 交换操作前后（显示哪两个元素被交换）
   * 4. 循环轮次切换时（显示进度信息）
   * 5. 关键决策点（如快速排序选pivot、归并排序合并时）
   * ========================================================================
   */
  private recordStep(message: string, highlightLine: number, variables: Record<string, string | number> = {}) {
    this.steps.push({
      // 深拷贝：确保每一步的数组快照完全独立，不受后续操作影响
      array: this.array.map(el => ({ ...el })),
      comparisons: this.comparisons,
      swaps: this.swaps,
      message,
      highlightLine,
      variables
    });
  }

  private compare(i: number, j: number): boolean {
    this.comparisons++;
    this.array[i].state = 'comparing';
    this.array[j].state = 'comparing';
    const result = this.array[i].value > this.array[j].value;
    return result;
  }

  private swap(i: number, j: number) {
    this.swaps++;
    this.array[i].state = 'swapping';
    this.array[j].state = 'swapping';
    const temp = this.array[i];
    this.array[i] = this.array[j];
    this.array[j] = temp;
  }

  private resetStates() {
    for (let i = 0; i < this.array.length; i++) {
      if (this.array[i].state !== 'sorted') {
        this.array[i].state = 'default';
      }
    }
  }

  cancel() {
    this.cancelled = true;
  }

  /**
   * ========================================================================
   * 冒泡排序 (Bubble Sort) —— O(n²) 稳定
   * ========================================================================
   *
   * 【核心思想】
   * 想象一列竖直的气泡，每次从底部开始，相邻两个气泡两两比较：
   * - 如果下面的气泡更大（升序），则交换它们的位置
   * - 较大的气泡会像"冒泡"一样逐渐上升到顶端
   * - 每一轮遍历后，最大的未排序元素一定会"冒泡"到它应在的末尾位置
   *
   * 【直观示例】[5, 3, 8, 1]
   * 第1轮: 比较(5,3)→交换→[3,5,8,1] → 比较(5,8)→不变 → 比较(8,1)→交换→[3,5,1,8] ✓ 8到位
   * 第2轮: 比较(3,5)→不变 → 比较(5,1)→交换→[3,1,5,8] ✓ 5到位
   * 第3轮: 比较(3,1)→交换→[1,3,5,8] ✓ 全部有序
   *
   * 【优化点：swapped 标志提前退出】
   * 如果某一轮遍历中没有发生任何交换（swapped === false），
   * 说明数组已经完全有序，可以立即终止排序。
   * 最佳情况下（数组已有序），时间复杂度降为 O(n)。
   * ========================================================================
   */
  generateBubbleSortSteps() {
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.cancelled = false;
    this.resetStates();
    const n = this.array.length;

    this.recordStep('开始冒泡排序', 0, { n });

    // 外层循环控制轮次，共需 n-1 轮（最后一个元素自然有序）
    for (let i = 0; i < n - 1; i++) {
      if (this.cancelled) return;
      let swapped = false;  // 本轮是否发生交换的标志位，用于优化
      this.recordStep(`第 ${i + 1} 轮冒泡开始`, 1, { i, swapped: String(swapped) });

      // 内层循环：从头开始两两比较，范围逐渐缩小（末尾 i 个元素已就位）
      for (let j = 0; j < n - i - 1; j++) {
        if (this.cancelled) return;
        this.resetStates();
        const isGreater = this.compare(j, j + 1);
        this.recordStep(
          `比较 ${this.array[j].value} 和 ${this.array[j + 1].value}`,
          2,
          { i, j, [`arr[${j}]`]: this.array[j].value, [`arr[${j+1}]`]: this.array[j + 1].value }
        );

        if (isGreater) {
          this.swap(j, j + 1);
          swapped = true;
          this.recordStep(
            `交换 ${this.array[j].value} 和 ${this.array[j + 1].value}`,
            3,
            { i, j, swapped: String(swapped) }
          );
        }

        this.resetStates();
      }

      // 本轮结束后，位置 n-i-1 的元素已确定为最大值之一，标记为 sorted
      this.array[n - i - 1].state = 'sorted';
      this.recordStep(`第 ${i + 1} 轮冒泡完成`, 4, { i, swapped: String(swapped) });

      // 【优化】：若本轮无交换，数组已有序，提前结束
      if (!swapped) {
        for (let k = 0; k < n - i - 1; k++) {
          this.array[k].state = 'sorted';
        }
        this.recordStep('数组已经有序，提前结束', 5, {});
        break;
      }
    }

    if (this.array.length > 0) {
      this.array[0].state = 'sorted';
    }
    this.recordStep('冒泡排序完成', 6, {});
    this.notify('冒泡排序步骤已生成');
  }

  generateSelectionSortSteps() {
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.cancelled = false;
    this.resetStates();
    const n = this.array.length;

    this.recordStep('开始选择排序', 0, { n });

    for (let i = 0; i < n - 1; i++) {
      if (this.cancelled) return;
      let minIndex = i;
      this.array[i].state = 'current';
      this.recordStep(`寻找第 ${i + 1} 个最小元素`, 1, { i, minIndex });

      for (let j = i + 1; j < n; j++) {
        if (this.cancelled) return;
        this.resetStates();
        this.array[i].state = 'current';
        this.array[j].state = 'comparing';
        this.comparisons++;
        this.recordStep(
          `比较 ${this.array[j].value} 和当前最小值 ${this.array[minIndex].value}`,
          2,
          { i, j, minIndex, [`arr[${j}]`]: this.array[j].value, [`arr[${minIndex}]`]: this.array[minIndex].value }
        );

        if (this.array[j].value < this.array[minIndex].value) {
          minIndex = j;
          this.recordStep(`更新最小值索引为 ${minIndex}`, 3, { i, j, minIndex });
        }
      }

      if (minIndex !== i) {
        this.swap(i, minIndex);
        this.recordStep(`交换位置 ${i} 和 ${minIndex}`, 4, { i, minIndex });
      }

      this.resetStates();
      this.array[i].state = 'sorted';
      this.recordStep(`第 ${i + 1} 个最小元素已放置`, 5, { i });
    }

    if (n > 0) this.array[n - 1].state = 'sorted';
    this.recordStep('选择排序完成', 6, {});
    this.notify('选择排序步骤已生成');
  }

  generateInsertionSortSteps() {
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.cancelled = false;
    this.resetStates();
    const n = this.array.length;

    this.recordStep('开始插入排序', 0, { n });
    if (n > 0) this.array[0].state = 'sorted';
    this.recordStep('第一个元素默认已排序', 1, {});

    for (let i = 1; i < n; i++) {
      if (this.cancelled) return;
      const current = this.array[i].value;
      this.array[i].state = 'current';
      this.recordStep(`当前处理元素: ${current}`, 2, { i, current, j: i - 1 });

      let j = i - 1;
      while (j >= 0 && this.array[j].value > current) {
        if (this.cancelled) return;
        this.comparisons++;
        this.array[j].state = 'comparing';
        this.recordStep(
          `比较 ${this.array[j].value} > ${current}，后移`,
          3,
          { i, current, j, [`arr[${j}]`]: this.array[j].value }
        );

        this.array[j + 1].value = this.array[j].value;
        this.swaps++;
        this.array[j].state = 'sorted';
        j--;
      }
      if (j >= 0) this.comparisons++;

      this.array[j + 1].value = current;
      this.array[j + 1].state = 'sorted';
      for (let k = 0; k <= i; k++) this.array[k].state = 'sorted';
      this.recordStep(`元素 ${current} 插入到位置 ${j + 1}`, 4, { i, current, insertPos: j + 1 });
    }

    this.recordStep('插入排序完成', 5, {});
    this.notify('插入排序步骤已生成');
  }

  /**
   * ========================================================================
   * 快速排序 (Quick Sort) —— O(n log n) 平均 / O(n²) 最坏（不稳定）
   * ========================================================================
   *
   * 【分治策略总览】
   * 快速排序采用"分而治之"的思想，分为三个阶段：
   *
   *  ① 选基准 (Choose Pivot)
   *     → 从当前区间选一个元素作为"基准"(pivot)
   *     → 本实现选择区间的最后一个元素 arr[end] 作为 pivot
   *
   *  ② 分区 (Partition) ★★★ 这是快速排序的核心操作 ★★★
   *     → 将数组重新排列，使所有 < pivot 的元素在左边
   *     → 所有 > pivot 的元素在右边
   *     → pivot 放到最终的正确位置
   *     → 返回 pivot 的最终索引
   *
   *  ③ 递归 (Recurse)
   *     → 对 pivot 左边的子数组递归执行快速排序
   *     → 对 pivot 右边的子数组递归执行快速排序
   *
   * 【Partition 过程详解（Lomuto 分区方案）】
   * 以数组 [8, 3, 7, 1, 5] 为例，pivot = 5:
   *
   *   初始: [8, 3, 7, 1, 5ᵖ]   i=-1, j 从 0 遍历到 3
   *   j=0: 8 ≥ 5, 不动         [8, 3, 7, 1, 5ᵖ]   i=-1
   *   j=1: 3 < 5, i=0, 交换     [3, 8, 7, 1, 5ᵖ]   i=0
   *   j=2: 7 ≥ 5, 不动         [3, 8, 7, 1, 5ᵖ]   i=0
   *   j=3: 1 < 5, i=1, 交换     [3, 1, 7, 8, 5ᵖ]   i=1
   *   最后: pivot 放到 i+1=2     [3, 1, 5, 8, 7]   pivot 归位！
   *
   *   结果：左边 [3,1] 都 < 5，右边 [8,7] 都 > 5，5 在正确位置
   *
   * 【时间复杂度分析】
   * - 平均情况：每次 partition 将数组大致均分 → O(n log n)
   * - 最坏情况：每次 pivot 是最值（如已排序数组选末尾）→ O(n²)
   * - 可通过随机选择 pivot 或三数取中来避免最坏情况
   * ========================================================================
   */
  generateQuickSortSteps() {
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.cancelled = false;
    this.resetStates();

    this.recordStep('开始快速排序', 0, {});
    // 从整个数组范围开始递归
    this.quickSortHelper(0, this.array.length - 1);
    if (!this.cancelled) {
      for (let i = 0; i < this.array.length; i++) this.array[i].state = 'sorted';
      this.recordStep('快速排序完成', 6, {});
    }
    this.notify('快速排序步骤已生成');
  }

  /**
   * 快速排序递归辅助函数
   * @param start 当前子数组的起始索引（包含）
   * @param end   当前子数组的结束索引（包含）
   *
   * 递归终止条件：start >= end 表示子数组长度 ≤ 1，无需排序
   */
  private quickSortHelper(start: number, end: number) {
    if (this.cancelled || start >= end) return;
    // 核心：partition 操作返回 pivot 的最终位置
    const pivotIndex = this.partition(start, end);
    if (this.cancelled) return;
    // 递归处理 pivot 左侧的子数组（所有元素 < pivot）
    this.quickSortHelper(start, pivotIndex - 1);
    // 递归处理 pivot 右侧的子数组（所有元素 > pivot）
    this.quickSortHelper(pivotIndex + 1, end);
  }

  /**
   * Partition（分区）操作 —— 快速排序的核心
   *
   * 采用 Lomuto 分区方案（易于理解和实现）：
   *
   * 【算法步骤分解】
   * 1. 选择 arr[end] 作为基准值 (pivot)，将其标记为 'pivot' 状态
   * 2. 维护指针 i：指向"小于 pivot 的区域"的右边界（初始为 start-1）
   * 3. 用指针 j 遍历 [start, end-1] 范围内的每个元素：
   *    - 若 arr[j] < pivot：i 右移一位，然后交换 arr[i] 和 arr[j]
   *      （这相当于把又一个小于 pivot 的元素放到左侧区域的末尾）
   *    - 若 arr[j] ≥ pivot：什么都不做（它本来就该在右侧）
   * 4. 遍历结束后，交换 arr[i+1] 和 arr[end]（把 pivot 放到正确位置）
   * 5. 返回 i+1，即 pivot 的最终索引
   *
   * @param start 子数组起始索引
   * @param end   子数组结束索引（pivot 所在位置）
   * @returns pivot 的最终位置索引
   */
  private partition(start: number, end: number): number {
    // 步骤1：选取最后一个元素作为 pivot
    const pivotValue = this.array[end].value;
    this.array[end].state = 'pivot';
    this.recordStep(`选择基准元素: ${pivotValue}`, 1, { pivot: pivotValue, start, end });

    // i 指向"小于 pivot 区域"的边界，初始在 start 左边一位
    let i = start - 1;

    // 步骤3：j 指针扫描 [start, end-1]，寻找小于 pivot 的元素
    for (let j = start; j < end; j++) {
      if (this.cancelled) return start;
      this.resetStates();
      this.array[end].state = 'pivot';  // 保持 pivot 的高亮
      this.array[j].state = 'comparing';
      this.comparisons++;
      this.recordStep(
        `比较 ${this.array[j].value} 与基准 ${pivotValue}`,
        2,
        { pivot: pivotValue, i, j, [`arr[${j}]`]: this.array[j].value }
      );

      // 发现小于 pivot 的元素，扩展左区域
      if (this.array[j].value < pivotValue) {
        i++;  // 先扩展左区域边界
        if (i !== j) {
          // 把这个元素交换到左区域末尾
          this.swap(i, j);
          this.recordStep(`交换 ${this.array[i].value} 和 ${this.array[j].value}`, 3, { i, j });
        }
      }
      this.resetStates();
      this.array[end].state = 'pivot';
    }

    // 步骤4：将 pivot 放到正确的最终位置（左区域之后）
    const pivotPosition = i + 1;
    if (pivotPosition !== end) {
      this.swap(pivotPosition, end);
      this.recordStep(`基准 ${pivotValue} 放到位置 ${pivotPosition}`, 4, { pivotPosition });
    }
    // pivot 已就位，标记为 sorted（它在最终位置不会再移动）
    this.array[pivotPosition].state = 'sorted';
    this.recordStep(`基准 ${pivotValue} 已就位`, 5, { pivotPosition });

    return pivotPosition;
  }

  /**
   * ========================================================================
   * 归并排序 (Merge Sort) —— O(n log n) 稳定
   * ========================================================================
   *
   * 【分治策略总览】
   * 归并排序同样采用分治思想，但与快速排序的"先处理后递归"不同，
   * 它采用"先递归拆分，再合并"的策略：
   *
   *  ① 拆分 (Divide)
   *     → 将数组从中间一分为二
   *     → 递归地对左右两半继续拆分
   *     → 直到子数组长度为 1（天然有序）
   *
   *  ② 合并 (Merge) ★★★ 这是归并排序的核心操作 ★★★
   *     → 将两个已有序的子数组合并为一个更大的有序数组
   *     → 使用双指针技巧，每次取两个子数组头部较小的元素
   *
   * 【Merge 双指针技巧图解】
   * 左子数组 L = [2, 5, 8],  右子数组 R = [1, 3, 6]
   *
   *   L指针→[2, 5, 8]   R指针→[1, 3, 6]   输出: []
   *   ↑                        ↑
   *   2 > 1? 取R的1           输出: [1]
   *
   *   L指针→[2, 5, 8]   R指针→[1, 3, 6]   输出: [1]
   *   ↑                            ↑
   *   2 < 3? 取L的2            输出: [1, 2]
   *
   *   ...持续比较直到某一侧耗尽，剩余元素直接追加
   *
   *   最终输出: [1, 2, 3, 5, 6, 8] ✓
   *
   * 【特点】
   * - 时间复杂度稳定为 O(n log n)，不受输入数据影响
   * - 是稳定排序（相等元素保持原始顺序）
   * - 需要额外 O(n) 空间来存储临时数组
   * ========================================================================
   */
  generateMergeSortSteps() {
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.cancelled = false;
    this.resetStates();

    this.recordStep('开始归并排序', 0, {});
    // 从整个数组范围开始递归拆分
    this.mergeSortHelper(0, this.array.length - 1);
    if (!this.cancelled) {
      for (let i = 0; i < this.array.length; i++) this.array[i].state = 'sorted';
      this.recordStep('归并排序完成', 6, {});
    }
    this.notify('归并排序步骤已生成');
  }

  /**
   * 归并排序递归辅助函数——负责拆分阶段
   * @param left  当前子数组左边界（包含）
   * @param right 当前子数组右边界（包含）
   *
   * 执行流程：
   * 1. 找到中点 mid
   * 2. 递归排序左半部分 [left, mid]
   * 3. 递归排序右半部分 [mid+1, right]
   * 4. 合并两个有序部分 [left, mid] 和 [mid+1, right]
   */
  private mergeSortHelper(left: number, right: number) {
    if (this.cancelled || left >= right) return;
    // 取中点（向下取整），将区间一分为二
    const mid = Math.floor((left + right) / 2);

    // 标记当前正在处理的子区间，方便可视化
    for (let i = left; i <= right; i++) this.array[i].state = 'subarray';
    this.recordStep(`划分区间 [${left}, ${right}]，中点 ${mid}`, 1, { left, mid, right });

    // 先递归拆分左半部分
    this.mergeSortHelper(left, mid);
    // 再递归拆分右半部分
    this.mergeSortHelper(mid + 1, right);
    // 最后合并两个有序子数组
    this.merge(left, mid, right);
  }

  /**
   * Merge（合并）操作 —— 归并排序的核心
   *
   * 【前提条件】arr[left..mid] 和 arr[mid+1..right] 各自已经有序
   * 【目标】将这两个有序段合并为一个有序段 arr[left..right]
   *
   * 【算法步骤分解】
   * 1. 将两段分别复制到临时数组 L[] 和 R[]
   * 2. 用三个指针 i, j, k 分别指向 L、R、目标位置的当前位置
   * 3. 比较 L[i] 和 R[j]，将较小者放入 arr[k]，对应指针前移
   * 4. 重复步骤3直到 L 或 R 耗尽
   * 5. 将剩余元素（如果有）直接复制到目标数组尾部
   *
   * @param left  左半段起始索引
   * @param mid   左半段结束索引（分隔点）
   * @param right 右半段结束索引
   */
  private merge(left: number, mid: number, right: number) {
    if (this.cancelled) return;
    const n1 = mid - left + 1;  // 左半段长度
    const n2 = right - mid;     // 右半段长度
    const L: number[] = [];     // 左半段临时数组
    const R: number[] = [];     // 右半段临时数组

    // 步骤1：复制数据到临时数组，同时设置可视化状态
    for (let i = 0; i < n1; i++) { L[i] = this.array[left + i].value; this.array[left + i].state = 'current'; }
    for (let j = 0; j < n2; j++) { R[j] = this.array[mid + 1 + j].value; this.array[mid + 1 + j].state = 'comparing'; }

    this.recordStep(`合并 [${left},${mid}] 和 [${mid + 1},${right}]`, 2, { left, mid, right });

    // 步骤2&3：双指针合并——每次取较小者放入目标位置
    let i = 0, j = 0, k = left;
    while (i < n1 && j < n2) {
      if (this.cancelled) return;
      this.comparisons++;
      if (L[i] <= R[j]) {
        // 左半段的当前元素更小（或相等，保持稳定性取左侧）
        this.array[k].value = L[i]; i++;
      } else {
        // 右半段的当前元素更小
        this.array[k].value = R[j]; j++;
      }
      this.array[k].state = 'sorted';
      this.swaps++;
      this.recordStep(`放置 ${this.array[k].value} 到位置 ${k}`, 3, { k, i, j });
      k++;
    }
    // 步骤5：处理剩余元素（只会有一个半段还有剩余）
    while (i < n1) { this.array[k].value = L[i]; this.array[k].state = 'sorted'; i++; k++; this.swaps++; this.recordStep(`放置剩余 ${this.array[k-1].value}`, 3, { k: k-1 }); }
    while (j < n2) { this.array[k].value = R[j]; this.array[k].state = 'sorted'; j++; k++; this.swaps++; this.recordStep(`放置剩余 ${this.array[k-1].value}`, 3, { k: k-1 }); }

    // 清理非 sorted 状态
    for (let x = left; x <= right; x++) {
      if (this.array[x].state !== 'sorted') this.array[x].state = 'default';
    }
  }

  generateShellSortSteps() {
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.cancelled = false;
    this.resetStates();
    const n = this.array.length;

    this.recordStep('开始希尔排序', 0, { n });

    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
      if (this.cancelled) return;
      this.recordStep(`当前间隔: ${gap}`, 1, { gap });

      for (let i = gap; i < n; i++) {
        if (this.cancelled) return;
        const temp = this.array[i].value;
        this.array[i].state = 'current';
        let j = i;

        for (let k = i % gap; k < n; k += gap) {
          if (k !== i) this.array[k].state = 'subarray';
        }
        this.recordStep(`间隔 ${gap}，处理元素 ${temp}`, 2, { gap, i, temp });

        while (j >= gap && this.array[j - gap].value > temp) {
          if (this.cancelled) return;
          this.comparisons++;
          this.array[j - gap].state = 'comparing';
          this.recordStep(`比较 ${this.array[j - gap].value} > ${temp}`, 3, { gap, j, temp });

          this.array[j].value = this.array[j - gap].value;
          this.array[j - gap].state = 'default';
          this.swaps++;
          j -= gap;
        }
        if (j >= gap) this.comparisons++;

        this.array[j].value = temp;
        for (let k = i % gap; k < n; k += gap) {
          if (this.array[k].state === 'subarray') this.array[k].state = 'default';
        }
        this.recordStep(`元素 ${temp} 插入到间隔位置 ${j}`, 4, { gap, i, j, temp });
        this.resetStates();
      }
    }

    for (let i = 0; i < n; i++) this.array[i].state = 'sorted';
    this.recordStep('希尔排序完成', 5, {});
    this.notify('希尔排序步骤已生成');
  }

  /**
   * ========================================================================
   * 堆排序 (Heap Sort) —— O(n log n) 不稳定，原地排序
   * ========================================================================
   *
   * 【核心思想】利用二叉堆这种数据结构的特性来完成排序
   *
   * 二叉堆的性质（以最大堆为例）：
   * - 是一棵完全二叉树，可以用数组紧凑存储
   * - 对于索引 i 的节点：
   *   → 其左子节点索引 = 2*i + 1
   *   → 其右子节点索引 = 2*i + 2
   *   → 其父节点索引 = floor((i-1)/2)
   * - 最大堆性质：每个节点的值 ≥ 其子节点的值
   *   → 因此根节点（堆顶）是整个堆中的最大值
   *
   * 【堆排序的两个阶段】
   *
   * ═══ 阶段一：建堆 (Build Heap) —— O(n) ═══
   *   将无序数组调整为满足堆性质的完全二叉树
   *   - 从最后一个非叶节点（index = floor(n/2)-1）开始
   *   - 向前依次对每个节点执行 heapify（下沉操作）
   *   - 建堆完成后，arr[0] 就是整个数组的最大值
   *
   * ═══ 阶段二：排序 (Extract & Heapify) —— O(n log n) ═══
   *   重复执行以下操作 n-1 次：
   *   a) 将堆顶（当前最大值）与未排序区的末尾元素交换
   *      → 最大值被放到其最终位置（数组末尾）
   *   b) 缩小堆的范围（末尾元素已就位，不再参与堆操作）
   *   c) 对新的堆顶执行 heapify，恢复堆性质
   *
   * 【Heapify（堆化/下沉）操作详解】
   *   给定节点 i，假设其左右子树都已满足堆性质，
   *   但节点 i 本身可能违反堆性质：
   *   1. 找到 i、左孩子、右孩子三者中的最大值
   *   2. 如果最大值不是 i 本身，则将 i 与最大孩子交换
   *   3. 递归地对被交换的孩子节点继续 heapify（下沉）
   *   4. 如果 i 已经是最大的，则停止（满足堆性质）
   *
   * 【示例】对 [4, 10, 3, 5, 1] 进行堆排序
   *   建堆后: [10, 5, 3, 4, 1] （最大堆，堆顶=10）
   *   第1次: 交换 10↔1 → [1, 5, 3, 4, 10] → heapify → [5, 4, 3, 1, 10] ✓10到位
   *   第2次: 交换 5↔1 → [1, 4, 3, 5, 10] → heapify → [4, 1, 3, 5, 10] ✓5到位
   *   ...以此类推直到全部有序
   * ========================================================================
   */
  generateHeapSortSteps() {
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.cancelled = false;
    this.resetStates();
    const n = this.array.length;

    this.recordStep('开始堆排序', 0, { n });
    this.recordStep('构建最大堆', 1, {});

    // ═══ 阶段一：建堆 ═══
    // 从最后一个非叶子节点开始，向前依次 heapify
    // 最后一个非叶子节点 = floor(n/2) - 1（因为节点 i 的左孩子是 2i+1，需满足 2i+1 < n）
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      if (this.cancelled) return;
      this.heapifySteps(n, i);
    }
    this.recordStep('最大堆构建完成', 2, {});

    // ═══ 阶段二：逐次取出堆顶，放到已排序区 ═══
    for (let i = n - 1; i > 0; i--) {
      if (this.cancelled) return;
      // 标记即将交换的两个元素
      this.array[0].state = 'current';   // 堆顶（当前最大值）
      this.array[i].state = 'comparing'; // 未排序区末尾
      this.recordStep(`将堆顶 ${this.array[0].value} 移到位置 ${i}`, 3, { i });

      // 步骤a：交换堆顶与未排序区末尾
      this.swap(0, i);
      // 交换后，位置 i 的元素已确定为其最终位置
      this.array[i].state = 'sorted';
      this.recordStep(`交换完成，调整堆`, 4, { i });

      // 步骤c：对缩小后的堆（范围 [0, i)）重新 heapify
      this.heapifySteps(i, 0);
    }

    if (n > 0) this.array[0].state = 'sorted';
    this.recordStep('堆排序完成', 5, {});
    this.notify('堆排序步骤已生成');
  }

  /**
   * Heapify（堆化/下沉）操作 —— 维护堆性质的核心方法
   *
   * 【前置假设】节点 i 的左右子树都已经满足最大堆性质
   * 【任务】将以 i 为根的子树调整为最大堆
   *
   * 【操作流程】
   * 1. 设 largest = i（暂假定 i 是最大的）
   * 2. 比较与左孩子 (2i+1)：若左孩子存在且更大，则 largest = left
   * 3. 比较与右孩子 (2i+2)：若右孩子存在且更大，则 largest = right
   * 4. 若 largest !== i：
   *    - 交换 i 与 largest（让较大的元素上浮到父节点位置）
   *    - 递归对 largest 继续 heapify（被交换下去的元素可能还需要继续下沉）
   * 5. 若 largest === i：堆性质已满足，停止
   *
   * @param n 堆的大小（有效范围 [0, n)）
   * @param i 需要执行 heapify 的节点索引
   */
  private heapifySteps(n: number, i: number) {
    if (this.cancelled) return;
    let largest = i;              // 假设当前节点最大
    const left = 2 * i + 1;       // 左孩子索引
    const right = 2 * i + 2;      // 右孩子索引

    // 标记当前正在调整的节点
    this.array[i].state = 'current';
    this.recordStep(`调整节点 ${this.array[i].value}`, 6, { i, largest, left, right });

    // 与左孩子比较
    if (left < n) {
      this.comparisons++;
      this.array[left].state = 'heap';
      if (this.array[left].value > this.array[largest].value) largest = left;
    }
    // 与右孩子比较
    if (right < n) {
      this.comparisons++;
      this.array[right].state = 'heap';
      if (this.array[right].value > this.array[largest].value) largest = right;
    }

    // 如果某个孩子更大，需要交换并继续下沉
    if (largest !== i) {
      this.swap(i, largest);
      this.recordStep(`交换 ${this.array[i].value} 和 ${this.array[largest].value}`, 7, { i, largest });
      this.resetStates();
      // 递归下沉：对被交换到下层的节点继续 heapify
      this.heapifySteps(n, largest);
    } else {
      // 已经满足堆性质，标记为 heap 状态
      this.array[i].state = 'heap';
    }
  }

  /**
   * ========================================================================
   * 计数排序 (Counting Sort) —— O(n+k) 稳定，k 为值域范围
   * ========================================================================
   *
   * 【核心思想】—— 不是通过比较元素大小来排序，而是"数数"
   *
   * 适用场景：当待排序的**整数值域有限**时（例如成绩 0~100、年龄 0~150），
   * 可以用一个计数数组统计每个值出现的次数，然后直接输出有序结果。
   *
   * 【算法步骤】
   * 1. 找出数组中的最小值 min 和最大值 max，确定值域范围
   * 2. 创建计数数组 count[size]，其中 size = max - min + 1
   * 3. 遍历原数组，统计每个值出现的次数 → count[value-min]++
   * 4. 对计数数组求前缀和（累加），得到每个值的"最终位置范围"
   * 5. **反向遍历**原数组，根据 count 确定每个元素的最终位置
   *    → 反向遍历是保证稳定性的关键！
   *
   * 【为什么反向遍历？——稳定性保证】
   * 正向遍历会导致相同值的元素输出顺序与原始顺序相反；
   * 反向遍历确保相同值的元素保持原始相对顺序（后出现的先放，占据更后面的位置）。
   *
   * 【局限性】
   * - 只能用于整数（或可映射为整数的数据）
   * - 当值域范围 k 远大于 n 时，空间浪费严重（如对 [1, 1000000] 排序）
   * ========================================================================
   */
  generateCountingSortSteps() {
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.cancelled = false;
    this.resetStates();
    const n = this.array.length;
    if (n <= 1) { if (n === 1) this.array[0].state = 'sorted'; return; }

    // 步骤1：确定值域范围 [min, max]
    let max = this.array[0].value, min = this.array[0].value;
    for (let i = 1; i < n; i++) {
      if (this.array[i].value > max) max = this.array[i].value;
      if (this.array[i].value < min) min = this.array[i].value;
    }
    this.recordStep(`找到范围: [${min}, ${max}]`, 0, { min, max });

    // 步骤2：创建计数数组并统计频次
    const range = max - min + 1;
    const count = new Array(range).fill(0);
    for (let i = 0; i < n; i++) {
      count[this.array[i].value - min]++;
      this.array[i].state = 'counting';
      this.recordStep(`统计 ${this.array[i].value} 出现次数`, 1, { [`count[${this.array[i].value - min}]`]: count[this.array[i].value - min] });
    }

    // 步骤4：计算前缀和（累加），得到每个值的"结束位置"
    for (let i = 1; i < range; i++) count[i] += count[i - 1];
    this.recordStep('计算累加和', 2, {});

    // 步骤5：反向遍历，放置元素到最终位置
    const output = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      const value = this.array[i].value;
      const index = count[value - min] - 1;
      output[index] = { value, state: 'default' as const };
      count[value - min]--;
      this.swaps++;
      this.recordStep(`放置 ${value} 到位置 ${index}`, 3, { value, index });
    }

    // 将结果写回原数组
    for (let i = 0; i < n; i++) {
      this.array[i].value = output[i].value;
      this.array[i].state = 'sorted';
    }
    this.recordStep('计数排序完成', 4, {});
    this.notify('计数排序步骤已生成');
  }

  /**
   * ========================================================================
   * 桶排序 (Bucket Sort) —— O(n+k) 平均情况，稳定
   * ========================================================================
   *
   * 【核心思想】—— 分而治之的空间版本
   *
   * 将元素分散到若干个"桶"中，每个桶内部单独排序，最后依次合并。
   * 当数据**均匀分布**时，每个桶内的元素很少，排序代价极低。
   *
   * 【算法步骤】
   * 1. 确定值域范围 [min, max]
   * 2. 创建若干个空桶（桶的数量 = (max-min)/bucketSize + 1）
   * 3. 遍历数组，将每个元素映射到对应的桶中
   *    → 映射公式：bucketIndex = floor((value - min) / bucketSize)
   * 4. 对每个桶内部单独排序（通常使用插入排序，因为桶内元素少）
   * 5. 按桶的顺序依次取出所有元素，即为有序结果
   *
   * 【适用场景 vs 不适用场景】
   * ✅ 适合：数据均匀分布在某个范围内（如 [0, 1000] 的浮点数）
   * ❌ 不适合：数据高度倾斜（如大部分元素集中在某一个桶里）
   *
   * 【参数说明】
   * bucketSize = 5：每个桶覆盖的数值范围大小
   * 例如 bucketSize=5 时，值 7 会落入桶 floor(7/5)=1，即桶1覆盖 [5,9]
   * ========================================================================
   */
  generateBucketSortSteps() {
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.cancelled = false;
    this.resetStates();
    const n = this.array.length;
    const bucketSize = 5;  // 每个桶的容量范围
    if (n <= 1) { if (n === 1) this.array[0].state = 'sorted'; return; }

    // 步骤1：确定值域
    let max = this.array[0].value, min = this.array[0].value;
    for (let i = 1; i < n; i++) {
      if (this.array[i].value > max) max = this.array[i].value;
      if (this.array[i].value < min) min = this.array[i].value;
    }
    this.recordStep(`范围: [${min}, ${max}]`, 0, { min, max });

    // 步骤2：创建空桶
    const bucketCount = Math.floor((max - min) / bucketSize) + 1;
    const buckets: number[][] = Array.from({ length: bucketCount }, () => []);

    // 步骤3：分配元素到各桶
    for (let i = 0; i < n; i++) {
      const bucketIndex = Math.floor((this.array[i].value - min) / bucketSize);
      buckets[bucketIndex].push(this.array[i].value);
      this.array[i].state = 'bucket';
      this.recordStep(`${this.array[i].value} 放入桶 ${bucketIndex}`, 1, { bucketIndex });
    }

    // 步骤4&5：对各桶内排序，然后依次放回原数组
    let currentIndex = 0;
    for (let i = 0; i < bucketCount; i++) {
      // 桶内使用原生 sort 排序（实际应用中常用插入排序）
      buckets[i].sort((a, b) => { this.comparisons++; return a - b; });
      for (const value of buckets[i]) {
        this.array[currentIndex].value = value;
        this.array[currentIndex].state = 'sorted';
        this.swaps++;
        currentIndex++;
        this.recordStep(`桶 ${i} 元素 ${value} 放回位置 ${currentIndex - 1}`, 2, { bucket: i });
      }
    }
    this.recordStep('桶排序完成', 3, {});
    this.notify('桶排序步骤已生成');
  }

  /**
   * ========================================================================
   * 基数排序 (Radix Sort) —— O(d × (n + k)) 稳定，d=位数，k=基数
   * ========================================================================
   *
   * 【核心思想】—— 按位排序，从低位到高位逐次进行
   *
   * 基数排序不直接比较数值大小，而是按照数字的"位数"逐位排序。
   * 类似于将卡片按个位排好，再按十位排好，再按百位……
   * 由于每一步都使用稳定的计数排序，经过 d 轮后整体有序。
   *
   * 【算法步骤】（以十进制为例）
   * 1. 找出数组中的最大值，确定其位数 d
   * 2. 按个位（exp=1）对所有数进行一次稳定的计数排序
   * 3. 按十位（exp=10）对所有数进行一次稳定的计数排序
   * 4. 按百位（exp=100）……
   * 5. 重复直到最高位处理完毕
   *
   * 【为什么从低位到高位？】
   * 低位排序的结果会被高位排序"覆盖"修正。
   * 例如：按个位排完后，再按十位排时，相同十位的数字会保持个位的顺序（稳定性）。
   * 如果从高位到低位，则需要更复杂的处理。
   *
   * 【示例】排序 [170, 45, 75, 90, 802, 24, 2, 66]
   * 按个位: [170, 90, 802, 2, 24, 45, 75, 66]
   * 按十位: [802, 2, 24, 45, 66, 170, 75, 90]
   * 按百位: [2, 24, 45, 66, 75, 90, 170, 802] ✓ 有序!
   *
   * 【局限性】
   * - 只适用于整数（或可表示为整数的数据）
   * - 需要知道数据的基数（如十进制基数为10）
   * ========================================================================
   */
  generateRadixSortSteps() {
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.cancelled = false;
    this.resetStates();
    const n = this.array.length;
    if (n <= 1) { if (n === 1) this.array[0].state = 'sorted'; return; }

    // 步骤1：找出最大值以确定位数
    let max = this.array[0].value;
    for (let i = 1; i < n; i++) if (this.array[i].value > max) max = this.array[i].value;
    this.recordStep(`最大值: ${max}`, 0, { max });

    // 步骤2-5：从低位到高位，逐位进行计数排序
    let exp = 1;        // 当前处理的位权（1=个位, 10=十位, 100=百位...）
    let digitPos = 1;   // 当前是第几位（用于显示）
    while (Math.floor(max / exp) > 0) {
      if (this.cancelled) return;
      this.recordStep(`处理第 ${digitPos} 位`, 1, { exp, digitPos });
      // 对当前位使用计数排序（这是基数排序的核心子程序）
      this.countingSortByDigitSteps(exp);
      exp *= 10;        // 进位：个位→十位→百位...
      digitPos++;
      if (max < exp) break;  // 所有位都处理完毕
    }

    for (let i = 0; i < n; i++) this.array[i].state = 'sorted';
    this.recordStep('基数排序完成', 4, {});
    this.notify('基数排序步骤已生成');
  }

  /**
   * 按指定位进行计数排序 —— 基数排序的内部子程序
   *
   * @param exp 位权（1=个位, 10=十位, 100=百位...）
   *
   * 与普通计数排序的区别：
   * - 固定使用大小为 10 的计数数组（十进制 0~9 共 10 个数字）
   * - 比较的不是元素本身，而是 (element / exp) % 10（当前位的数字）
   */
  private countingSortByDigitSteps(exp: number) {
    const n = this.array.length;
    // 十进制只有 0~9 共 10 个数字，所以计数数组固定大小为 10
    const count = new Array(10).fill(0);
    const output: ArrayElement[] = new Array(n);

    // 统计当前位上各数字的出现次数
    for (let i = 0; i < n; i++) {
      const digit = Math.floor(this.array[i].value / exp) % 10;  // 取出当前位的数字
      count[digit]++;
      this.array[i].state = 'radix';
      this.recordStep(`元素 ${this.array[i].value} 当前位: ${digit}`, 2, { [`digit`]: digit });
    }

    // 计算前缀和（累加）
    for (let i = 1; i < 10; i++) count[i] += count[i - 1];

    // 反向遍历，根据当前位的数字将元素放到正确位置
    for (let i = n - 1; i >= 0; i--) {
      const digit = Math.floor(this.array[i].value / exp) % 10;
      const index = count[digit] - 1;
      output[index] = { value: this.array[i].value, state: 'default' };
      count[digit]--;
      this.swaps++;
      this.recordStep(`${this.array[i].value} 放到位置 ${index}`, 3, { digit, index });
    }

    // 将排序结果写回原数组
    for (let i = 0; i < n; i++) {
      this.array[i].value = output[i].value;
      this.array[i].state = 'default';
    }
  }

  generateRandomArray(size: number, min: number = 1, max: number = 100) {
    const newArray = Array.from({ length: size }, () =>
      Math.floor(Math.random() * (max - min + 1)) + min
    );
    this.setArray(newArray);
    return newArray;
  }

  setDelay(ms: number) {
    this.delay = ms;
  }

  async bubbleSort() {
    this.generateBubbleSortSteps();
  }

  async selectionSort() {
    this.generateSelectionSortSteps();
  }

  async quickSort() {
    this.generateQuickSortSteps();
  }

  async insertionSort() {
    this.generateInsertionSortSteps();
  }

  async shellSort() {
    this.generateShellSortSteps();
  }

  async heapSort() {
    this.generateHeapSortSteps();
  }

  async mergeSort() {
    this.generateMergeSortSteps();
  }

  async countingSort() {
    this.generateCountingSortSteps();
  }

  async bucketSort() {
    this.generateBucketSortSteps();
  }

  async radixSort() {
    this.generateRadixSortSteps();
  }
}
