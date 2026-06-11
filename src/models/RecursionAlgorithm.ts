/**
 * 递归算法可视化模型（Recursion Algorithm Visualizer）
 *
 * 【核心挑战】递归可视化的难点不在于"计算结果"，而在于展示**调用栈的展开与回溯过程**。
 *   - 展开阶段（递归调用）：函数不断深入，调用栈越来越深，像一棵树向下生长
 *   - 回溯阶段（递归返回）：子问题求解完毕，结果逐层返回并合并，像树从叶子向根收缩
 *
 * 【教学职责】本类负责：
 *   - 将每次函数调用建模为一个"步骤节点"，记录其参数、层级、父子关系
 *   - 通过 state 生命周期（pending → active → complete/returning）展示调用的完整生命周期
 *   - 利用 parent/children 构建递归树结构，前端可渲染为树形图
 *   - 让学生直观感受"递归到底在做什么"——不是魔法，而是有结构的自我调用
 *
 * 【适用场景】斐波那契数列、阶乘、汉诺塔等经典递归问题
 */

/**
 * RecursionState —— 递归算法的全局状态
 */
export interface RecursionState {
  steps: RecursionStep[];
  currentStep: number;
  message: string;
  isComplete: boolean;
}

/**
 * RecursionStep —— 单次递归调用的完整记录
 *
 * 字段含义：
 *   - level:    递归深度 / 树的层级。根调用为 0，每深入一层 +1。
 *               教学要点：level 直观反映了递归的"深度"，帮助理解栈空间消耗
 *   - parent:   父调用的 step id。通过 parentId 建立父子关系，形成递归树
 *   - children: 子调用的 step id 数组。一个节点可能有多个孩子（如 fib 调用两次）
 *
 * state 生命周期（教学重点——让学生理解一次递归调用经历了哪些阶段）：
 *   - pending:   刚创建，尚未开始执行（表示"这个调用即将发生"）
 *   - active:   正在执行中（对应代码执行到该函数体内）
 *   - returning: 子调用已全部完成，正在准备返回结果（回溯阶段的关键节点）
 *   - complete: 执行完毕，已获得最终结果（叶子节点直接从 active→complete）
 */
export interface RecursionStep {
  id: number;
  /** 递归深度，也对应树形可视化中的垂直层级 */
  level: number;
  /** 当前执行的函数名 */
  function: string;
  /** 函数参数列表 */
  args: any[];
  /** 返回值（仅在 complete 状态时有意义） */
  result?: any;
  /** 子调用 id 列表，用于构建递归树的分支 */
  children: number[];
  /** 父调用 id，根节点无 parent */
  parent?: number;
  /** 当前所处的生命周期阶段 */
  state: 'pending' | 'active' | 'complete' | 'returning';
  highlightLine: number;
}

type Subscriber = (state: RecursionState) => void;

export class RecursionAlgorithm {
  private state: RecursionState;
  private subscribers: Subscriber[] = [];
  private delay: number = 500;
  private stepId: number = 0;

  constructor() {
    this.state = {
      steps: [],
      currentStep: -1,
      message: '',
      isComplete: false
    };
  }

  subscribe(subscriber: Subscriber) {
    this.subscribers.push(subscriber);
    subscriber(this.state);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== subscriber);
    };
  }

  private notify(message: string = '') {
    this.state.message = message;
    this.subscribers.forEach(subscriber => subscriber(this.state));
  }

  setDelay(delay: number) {
    this.delay = delay;
  }

  getState() {
    return this.state;
  }

  private async wait() {
    await new Promise(resolve => setTimeout(resolve, this.delay));
  }

  /**
   * createStep —— 创建一个递归调用步骤节点
   *
   * parentId 如何构建父子关系？
   *   每次递归调用时，当前 step.id 作为 parentId 传给子调用。
   *   子调用在 createStep 中将自身 id 追加到父节点的 children 数组，
   *   同时记录自己的 parent 引用。这样就形成了一棵双向链接的递归树。
   *
   * 教学价值：
   *   前端可以根据这棵树画出递归调用图——学生能看到：
   *   "哦！原来 fibonacci(5) 调用了 fibonacci(4) 和 fibonacci(3)，
   *    而 fibonacci(4) 又调用了 fibonacci(3) 和 fibonacci(2)……"
   *   这就是"重叠子问题"的可视化证明！
   */
  private createStep(level: number, functionName: string, args: any[], parentId?: number, highlightLine: number = -1): RecursionStep {
    const step: RecursionStep = {
      id: this.stepId++,
      level,
      function: functionName,
      args,
      children: [],
      // 初始状态为 pending：表示"这次调用已被发起，但还未进入函数体"
      state: 'pending',
      highlightLine
    };

    if (parentId !== undefined) {
      step.parent = parentId;
      // 将当前步骤注册为父节点的子节点，建立树形关系
      const parentStep = this.state.steps.find(s => s.id === parentId);
      if (parentStep) {
        parentStep.children.push(step.id);
      }
    }

    this.state.steps.push(step);
    return step;
  }

  private updateStepState(stepId: number, state: RecursionStep['state'], result?: any, highlightLine?: number) {
    const step = this.state.steps.find(s => s.id === stepId);
    if (step) {
      step.state = state;
      if (result !== undefined) {
        step.result = result;
      }
      if (highlightLine !== undefined) {
        step.highlightLine = highlightLine;
      }
      this.notify();
    }
  }

  /**
   * 斐波那契数列（Fibonacci）—— 递归展开的经典教学案例
   *
   * 【为什么选 Fibonacci 作为递归入门？】
   *   递归定义极其简洁：fib(n) = fib(n-1) + fib(n-2)
   *   但它暴露了朴素递归的核心问题——**时间复杂度 O(2ⁿ)**！
   *   因为 fib(n) 的递归树是一棵完全二叉树，大量重复计算相同的子问题。
   *   例如 fib(5) 会计算 fib(3) 两次、fib(2) 三次……
   *
   * 【优化方向 —— Memoization 记忆化】
   *   如果缓存已计算的 fib(k) 结果，复杂度可降至 O(n)。
   *   这正是从"递归"过渡到"动态规划"的最佳桥梁。
   *
   * 【教学重点】
   *   学生应观察：递归树的形状、节点的重复情况、以及返回值的合并路径
   */
  async fibonacci(n: number, level: number = 0, parentId?: number): Promise<number> {
    const step = this.createStep(level, 'fibonacci', [n], parentId, 0);
    this.state.currentStep = step.id;
    this.notify(`计算 fibonacci(${n})`);
    // 标记为 active：正式进入函数体执行
    this.updateStepState(step.id, 'active', undefined, 0);
    await this.wait();

    /**
     * ★ 递归终止条件（Base Case）★
     *
     * 这是递归最重要的部分——没有终止条件会导致无限递归（栈溢出 Stack Overflow）。
     * 斐波那契的定义基础：fib(0)=0, fib(1)=1
     * 教学要点：任何递归都必须有"最小问题的直接答案"作为出口。
     * 叶子节点在这里直接从 active 变为 complete，不再产生新的子调用。
     */
    if (n <= 1) {
      const baseLine = n === 0 ? 1 : 2;
      this.updateStepState(step.id, 'complete', n, baseLine);
      return n;
    }

    // 两个递归分支：fib(n-1) 和 fib(n-2)，这就是递归树"分叉"的原因
    const result1 = await this.fibonacci(n - 1, level + 1, step.id);
    const result2 = await this.fibonacci(n - 2, level + 1, step.id);
    // 合并子结果——这是回溯阶段的体现
    const result = result1 + result2;

    // returning 状态：所有子调用已完成，当前节点准备向上返回
    this.updateStepState(step.id, 'returning', undefined, 5);
    await this.wait();
    // complete 状态：标记最终结果
    this.updateStepState(step.id, 'complete', result, 5);

    return result;
  }

  /**
   * 阶乘（Factorial）—— 尾递归特性的典型案例
   *
   * 【算法思想】n! = n × (n-1)!，定义简单且只有一条递归路径（不像 fib 有两条）
   *
   * 【尾递归特性】
   *   阶乘的递归调用是"尾调用"——递归调用是函数的最后一步操作，
   *   之后只需做一次乘法再返回。某些编译器/引擎可以将其优化为迭代（不增加栈帧）。
   *   对比 fibonacci 有两个递归分支，无法做尾调用优化。
   *
   * 【教学重点】
   *   与 fib 对比：阶乘的递归是一条链（线性），fib 是一棵树（指数级展开）。
   *   这帮助学生理解"递归的形状取决于定义中的分支数"。
   */
  async factorial(n: number, level: number = 0, parentId?: number): Promise<number> {
    const step = this.createStep(level, 'factorial', [n], parentId, 0);
    this.state.currentStep = step.id;
    this.notify(`计算 factorial(${n})`);
    this.updateStepState(step.id, 'active', undefined, 0);
    await this.wait();

    // Base Case：0! = 1! = 1
    if (n <= 1) {
      this.updateStepState(step.id, 'complete', 1, 1);
      return 1;
    }

    // 只有一个递归分支——线性递归链
    const subResult = await this.factorial(n - 1, level + 1, step.id);
    const result = n * subResult;

    this.updateStepState(step.id, 'returning', undefined, 3);
    await this.wait();
    this.updateStepState(step.id, 'complete', result, 3);

    return result;
  }

  /**
   * 汉诺塔（Tower of Hanoi）—— 分治策略的完美演示
   *
   * 【分治策略详解】
   *   目标：将 n 个盘子从 from 柱移动到 to 柱（借助 aux 辅助柱），遵守规则：
   *     1. 每次只能移动一个盘子
   *     2. 大盘子不能放在小盘子上面
   *
   *   核心分解思路（把大问题拆成三个小问题）：
   *     步骤① hanoi(n-1, from, aux, to)  —— 将上面 n-1 个盘子从 from 移到 aux（腾出空间）
   *     步骤② hanoi(1, from, to, aux)       —— 将最大的第 n 个盘子直接从 from 移到 to（核心操作）
   *     步骤③ hanoi(n-1, aux, to, from)  —— 将 aux 上的 n-1 个盘子移到 to（叠到大盘子上）
   *
   * 【为什么需要辅助柱 aux？】
   *   因为规则限制大盘不能压小盘。要把底部的最大盘移走，
   *   必须先把上面 n-1 个盘"暂存"到一个不影响的位置——这就是 aux 的作用。
   *   这体现了分治中"分解 → 解决子问题 → 合并结果"的标准范式。
   *
   * 【教学重点】
   *   时间复杂度 O(2ⁿ - 1)：每增加一个盘子，步数翻倍。
   *   学生应关注：三步递归调用的顺序不可颠倒，aux 和 to 的角色在步骤①和③中互换
   */
  async hanoi(n: number, from: string, to: string, aux: string, level: number = 0, parentId?: number): Promise<void> {
    const step = this.createStep(level, 'hanoi', [n, from, to, aux], parentId, 0);
    this.state.currentStep = step.id;
    this.notify(`移动 ${n} 个圆盘从 ${from} 到 ${to}`);
    this.updateStepState(step.id, 'active', undefined, 0);
    await this.wait();

    /**
     * Base Case：只剩 1 个盘子时，可以直接移动（无需递归分解）
     * 这是汉诺塔递归的最小原子操作
     */
    if (n === 1) {
      this.notify(`直接移动圆盘从 ${from} 到 ${to}`);
      this.updateStepState(step.id, 'complete', `${from} -> ${to}`, 2);
      return;
    }

    // 步骤①：将 n-1 个盘子从起始柱移到辅助柱（目标柱变成辅助）
    await this.hanoi(n - 1, from, aux, to, level + 1, step.id);
    // 步骤②：移动最大的盘子到目标柱（这是唯一的一次"直接移动大盘"的操作）
    this.notify(`移动最大的圆盘从 ${from} 到 ${to}`);
    await this.hanoi(1, from, to, aux, level + 1, step.id);
    // 步骤③：将 n-1 个盘子从辅助柱移到目标柱（起始柱变成辅助）
    await this.hanoi(n - 1, aux, to, from, level + 1, step.id);

    // 回溯：三个子任务都完成了，当前层级的任务也完成
    this.updateStepState(step.id, 'returning', undefined, 5);
    await this.wait();
    this.updateStepState(step.id, 'complete', `完成移动 ${n} 个圆盘`, 5);
  }

  reset() {
    this.state = {
      steps: [],
      currentStep: -1,
      message: '',
      isComplete: false
    };
    this.stepId = 0;
    this.notify();
  }
}
