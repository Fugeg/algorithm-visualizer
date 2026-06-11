/**
 * 贪心算法（Greedy Algorithm）可视化模型
 *
 * 【核心思想】
 * 贪心算法在每一步选择中都采取当前状态下"最好"的选择（局部最优），
 * 希望通过一系列局部最优选择达到全局最优解。
 * 关键在于：局部最优选择不会影响后续选择的最优性。
 *
 * 【适用条件】——一个问题能用贪心法解决，必须同时满足：
 * 1. 贪心选择性质（Greedy Choice Property）：可以通过局部最优选择构造全局最优解，
 *    即做出贪心选择后，原问题简化为规模更小的子问题。
 * 2. 最优子结构（Optimal Substructure）：问题的最优解包含其子问题的最优解。
 *
 * 【本类支持的两个经典贪心问题】
 * - 找零钱问题（Coin Change）：用最少硬币凑出指定金额
 * - 活动选择问题（Activity Selection）：在互不冲突的前提下选取最多活动
 */

export interface GreedyState {
  steps: GreedyStep[];
  currentStep: number;
  message: string;
  isComplete: boolean;
  solution: any;
}

/**
 * 贪心算法的单步操作记录
 *
 * 每一步操作只能是以下三种类型之一：
 * - select：做出贪心选择——选中某个选项作为当前步的决策
 * - skip：跳过——该选项不满足贪心选择的条件（如面额过大、时间冲突等）
 * - solution：输出最终结果——所有步骤执行完毕后给出答案
 */
export interface GreedyStep {
  id: number;
  type: 'select' | 'skip' | 'solution';
  state: any;
  description: string;
  highlightLine: number;
}

type Subscriber = (state: GreedyState) => void;

export class GreedyAlgorithm {
  private state: GreedyState;
  private subscribers: Subscriber[] = [];
  private delay: number = 500;
  private stepId: number = 0;

  constructor() {
    this.state = {
      steps: [],
      currentStep: -1,
      message: '',
      isComplete: false,
      solution: null
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

  private addStep(type: GreedyStep['type'], state: any, description: string, highlightLine: number = -1) {
    const step: GreedyStep = {
      id: this.stepId++,
      type,
      state: JSON.parse(JSON.stringify(state)),
      description,
      highlightLine
    };
    this.state.steps.push(step);
    this.state.currentStep = step.id;
    this.notify(description);
  }

  /**
   * 找零钱问题（Coin Change Problem）
   *
   * 【贪心策略】优先使用最大面值的硬币来凑零钱。
   *
   * 【为什么对标准货币体系这一定是最优解？】
   * 标准货币体系（如人民币 1,2,5,10,20,50,100 或美元 1,5,10,25）
   * 具有"规范货币系统"（Canonical Coin System）的性质：
   * 每种较大面额都能被比它小的面额"整除表示"且不会产生更优的替代方案。
   * 具体来说，对于任意金额 x 和最大可用面额 c：
   * - 如果 c ≤ x，那么最优解中一定至少包含 ⌊x/c⌋ 个 c 面额硬币
   * - 因为如果不用这么多 c，就需要用更多的小面额硬币来弥补差额
   * - 这正是"贪心选择性质"的体现
   *
   * 反例：如果货币面额是 [1,3,4]，要找零 6 元：
   * 贪心法会选 4+1+1=3枚，但最优解是 3+3=2枚
   * 所以贪心法并非对所有面额组合都适用！
   */
  async makeChange(amount: number, coins: number[]) {
    this.reset();
    const sortedCoins = [...coins].sort((a, b) => b - a); // 从大到小排序
    const result: { coin: number; count: number }[] = [];
    let remaining = amount;

    for (const coin of sortedCoins) {
      if (remaining <= 0) break;

      // 计算当前大面额硬币最多能用几枚
      // Math.floor(remaining / coin) 的含义：尽可能多地使用当前面额的硬币
      // 这就是"贪心选择"——既然决定用这种面额，就用到不能再用的程度
      const count = Math.floor(remaining / coin);
      if (count > 0) {
        result.push({ coin, count });
        remaining -= coin * count;

        this.addStep('select', {
          coin,
          count,
          remaining,
          result: [...result]
        }, `使用 ${count} 个面值为 ${coin} 的硬币，剩余金额: ${remaining}`, 5);
        await this.wait();
      } else {
        this.addStep('skip', {
          coin,
          remaining,
          result: [...result]
        }, `跳过面值为 ${coin} 的硬币，因为它大于剩余金额 ${remaining}`, 3);
        await this.wait();
      }
    }

    if (remaining === 0) {
      this.state.solution = result;
      this.addStep('solution', {
        result: [...result],
        totalCoins: result.reduce((sum, { count }) => sum + count, 0)
      }, '找到最优解！', 7);
    } else {
      this.addStep('solution', {
        result: [...result],
        remaining
      }, `无法完全找零，剩余金额: ${remaining}`, 7);
    }

    this.state.isComplete = true;
    this.notify('找零完成');
  }

  /**
   * 活动选择问题（Activity Selection Problem）
   *
   * 【问题描述】有 n 个活动，每个活动有开始时间和结束时间，
   * 同一时刻只能参加一个活动，目标是选出最多的互不冲突的活动。
   *
   * 【贪心策略】按结束时间从早到晚排序后，依次选取与已选活动不冲突的活动。
   *
   * 【为什么这种策略是最优的？——交换论证法（Exchange Argument）】
   * 假设活动按结束时间排序为 a₁, a₂, ..., aₙ（end(a₁) ≤ end(a₂) ≤ ... ≤ end(aₙ)）
   * 设贪心法选出的第一个活动是 a₁（结束最早的活动）。
   * 考虑任意一个最优解 OPT：
   * - 如果 OPT 的第一个活动不是 a₁，设其为 a_k（k > 1，即结束更晚）
   * - 我们可以把 OPT 的第一个活动替换成 a₁，得到的新解仍然合法（因为 a₁ 结束得更早，
   *   所以它不会与后面的任何活动冲突），且活动数量不变
   * - 这说明"存在一个最优解包含 a₁"，即选择 a₁ 是安全的
   * - 对剩下的子问题重复同样的论证，即可证明贪心法的全局最优性
   *
   * 教学要点：交换论证是证明贪心策略正确性的经典方法——
   * 通过将最优解逐步"调整"为贪心解，证明两者等价。
   */
  async selectActivities(activities: { id: number; start: number; end: number }[]) {
    this.reset();
    // 按结束时间排序——这是贪心策略的关键预处理步骤
    const sortedActivities = [...activities].sort((a, b) => a.end - b.end);
    const selected: typeof activities = [];
    let lastEnd = 0;

    for (const activity of sortedActivities) {
      // 判断活动是否与已选集合兼容：
      // 如果当前活动的开始时间 >= 上一个选中活动的结束时间，
      // 说明两个活动不重叠（前一个已经结束了），可以安全选择
      if (activity.start >= lastEnd) {
        selected.push(activity);
        lastEnd = activity.end;

        this.addStep('select', {
          activity,
          selected: [...selected],
          lastEnd
        }, `选择活动 ${activity.id}（开始: ${activity.start}, 结束: ${activity.end}）`, 7);
        await this.wait();
      } else {
        this.addStep('skip', {
          activity,
          selected: [...selected],
          lastEnd
        }, `跳过活动 ${activity.id}，因为它与已选活动重叠`, 8);
        await this.wait();
      }
    }

    this.state.solution = selected;
    this.addStep('solution', {
      selected: [...selected],
      count: selected.length
    }, `共选择了 ${selected.length} 个活动`, 9);

    this.state.isComplete = true;
    this.notify('活动选择完成');
  }

  reset() {
    this.state = {
      steps: [],
      currentStep: -1,
      message: '',
      isComplete: false,
      solution: null
    };
    this.stepId = 0;
    this.notify();
  }
}
