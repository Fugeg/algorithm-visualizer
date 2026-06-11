/**
 * 动态规划（Dynamic Programming, DP）算法可视化模型
 *
 * 【核心思想】动态规划的三大要素：
 *   1. 最优子结构：问题的最优解包含子问题的最优解（如背包的最大价值由子容量决定）
 *   2. 重叠子问题：递归过程中会反复计算相同的子问题（如 fib(3) 在递归树中出现多次）
 *   3. 状态转移方程：用数学公式描述如何从已知状态推导新状态
 *
 * 【教学职责】本类负责：
 *   - 执行 DP 算法并逐步记录每一步的状态快照
 *   - 通过 steps 数组支持播放器的前进/后退/回放功能
 *   - 维护 dp 二维表格供前端渲染为可视化的 DP 表格
 *   - 每一步都附带描述信息，帮助学生理解"当前在做什么"
 *
 * 【适用场景】LIS（最长递增子序列）、0/1 背包、编辑距离等经典 DP 问题
 */

/**
 * DPState —— 动态规划的全局状态
 *
 * 设计意图：
 *   - steps: 记录完整的算法执行轨迹，用于播放器的逐帧回放。
 *            每个元素是一次"快照"，学生可以像看视频一样回看 dp 数组的演变过程。
 *   - dp: 当前 dp 数组的实时副本，用于前端以表格形式展示。
 *         与 steps 的区别在于：steps 是历史记录，dp 是"当前帧"的数据源。
 */
export interface DPState {
  steps: DPStep[];
  currentStep: number;
  message: string;
  isComplete: boolean;
  solution: any;
  dp: number[][];
}

/**
 * DPStep —— 单步执行记录
 *
 * type 含义说明：
 *   - 'init':    初始化阶段。记录输入数据、dp 数组初始值等"起跑线"状态。
 *                教学要点：让学生先看清问题规模和初始条件，再开始计算。
 *   - 'calculate': 状态转移过程。每次更新一个或多个 dp 单元格时记录。
 *                  这是 DP 的核心——展示"如何从旧状态推出新状态"。
 *                  row/col 标记当前正在计算的单元格位置，前端可高亮显示。
 *   - 'solution': 最终结果。汇总最优解及重建的路径/方案。
 *                教学要点：DP 不只求值，还要能回溯出具体选择了什么。
 */
export interface DPStep {
  id: number;
  type: 'init' | 'calculate' | 'solution';
  state: any;
  description: string;
  row?: number;
  col?: number;
  highlightLine: number; // 对应伪代码的行号（0-indexed），用于前端同步高亮代码行
}

type Subscriber = (state: DPState) => void;

export class DynamicProgramming {
  private state: DPState;
  private subscribers: Subscriber[] = [];
  private delay: number = 500;
  private stepId: number = 0;

  constructor() {
    this.state = {
      steps: [],
      currentStep: -1,
      message: '',
      isComplete: false,
      solution: null,
      dp: []
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
   * addStep —— 核心的教学可视化方法
   *
   * 为什么每一步都要记录完整快照？
   *   DP 算法的精髓在于"表格的逐格填充"。如果只记录变化的部分，
   *   学生无法理解每个单元格的值是如何依赖于前面已填好的单元格的。
   *   深拷贝 state 确保每步都是独立的、可回溯的完整画面。
   *
   * 教学价值：
   *   学生通过对比相邻两步的 dp 表，可以直观看到：
   *   "哦！原来这个格子是从左上角/左边/上面那个格子推过来的！"
   */
  private addStep(type: DPStep['type'], state: any, description: string, highlightLine: number = -1, row?: number, col?: number) {
    const step: DPStep = {
      id: this.stepId++,
      type,
      // 深拷贝：确保后续修改不会污染已记录的历史快照
      state: JSON.parse(JSON.stringify(state)),
      description,
      row,
      col,
      highlightLine
    };
    this.state.steps.push(step);
    this.state.currentStep = step.id;
    this.notify(description);
  }

  /**
   * 最长递增子序列（Longest Increasing Subsequence, LIS）
   *
   * 【算法思想】
   *   dp[i] 定义：以 nums[i] 为结尾的最长递增子序列的长度（注意：必须包含 nums[i]）
   *   状态转移方程：dp[i] = max(dp[j] + 1)，其中 j < i 且 nums[j] < nums[i]
   *   时间复杂度：O(n²) —— 对每个元素 i，向前遍历所有可能的 predecessor j
   *
   * 【prev 数组的作用】
   *   dp 数组只记录了长度，不知道具体是哪些元素组成的序列。
   *   prev[i] 记录了"让 dp[i] 取得最大值时的前驱元素下标"，
   *   通过 prev 链可以回溯重建出完整的 LIS 序列。
   *
   * 【教学重点】
   *   让学生观察：为什么 dp[i] 初始化为 1？（至少包含自身）
   *   内层循环的"比较+更新"过程就是状态转移的可视化体现。
   */
  async longestIncreasingSubsequence(nums: number[]) {
    this.reset();
    const n = nums.length;
    const dp = new Array(n).fill(1); // dp[i] 表示以 nums[i] 结尾的最长递增子序列长度
    const prev = new Array(n).fill(-1); // 记录前驱节点，用于重建序列
    let maxLen = 1;
    let maxIndex = 0;

    this.state.dp = [dp.slice()];
    this.addStep('init', {
      nums,
      dp: dp.slice(),
      prev: prev.slice(),
      current: -1,
      comparing: -1
    }, '初始化 dp 数组，每个元素的初始长度为 1（至少包含自身）', 2);
    await this.wait();

    // 外层循环：遍历每个元素作为"子序列的末尾"
    // 教学要点：i 是"当前位置"，我们要确定以它结尾的最优解
    for (let i = 1; i < n; i++) {
      // 外层循环：遍历每个元素作为"子序列的末尾"
      // 教学要点：i 是"当前位置"，我们要确定以它结尾的最优解
      this.addStep('calculate', {
        nums,
        dp: dp.slice(),
        prev: prev.slice(),
        current: i,
        comparing: -1
      }, `处理第 ${i} 个元素 nums[${i}] = ${nums[i]}`, 3);
      await this.wait();

      // 内层循环：向前查找所有能接在 nums[i] 前面的递增元素
      // 教学要点：j 代表"候选前驱"。只有当 nums[j] < nums[i] 时，
      // nums[i] 才能接在 nums[j] 后面形成更长的递增子序列
      for (let j = 0; j < i; j++) {
        this.addStep('calculate', {
          nums,
          dp: dp.slice(),
          prev: prev.slice(),
          current: i,
          comparing: j
        }, `比较 nums[${i}] = ${nums[i]} 和 nums[${j}] = ${nums[j]}`, 4);
        await this.wait();

        if (nums[i] > nums[j] && dp[j] + 1 > dp[i]) {
          dp[i] = dp[j] + 1;
          prev[i] = j;
          this.state.dp[0] = dp.slice();

          this.addStep('calculate', {
            nums,
            dp: dp.slice(),
            prev: prev.slice(),
            current: i,
            comparing: j,
            update: true
          }, `更新 dp[${i}] = dp[${j}] + 1 = ${dp[i]}（找到更长的递增前缀）`, 5);
          await this.wait();

          if (dp[i] > maxLen) {
            maxLen = dp[i];
            maxIndex = i;
          }
        }
      }
    }

    // 通过 prev 链回溯重建最长递增子序列
    // 教学要点：这是 DP 中"路径重建"的标准技巧——从终点沿前驱指针往回走
    const sequence: number[] = [];
    for (let i = maxIndex; i !== -1; i = prev[i]) {
      sequence.unshift(nums[i]);
    }

    this.state.solution = sequence;
    this.addStep('solution', {
      nums,
      dp: dp.slice(),
      prev: prev.slice(),
      sequence,
      maxLen
    }, `最长递增子序列长度为 ${maxLen}，序列为 [${sequence.join(', ')}]`, 7);

    this.state.isComplete = true;
    this.notify('计算完成');
  }

  /**
   * 0/1 背包问题（0/1 Knapsack Problem）
   *
   * 【算法思想】
   *   使用二维 dp 表：dp[i][w] = 考虑前 i 个物品、背包容量为 w 时的最大价值
   *   行含义：第 i 个物品（1-indexed，第 0 行表示"不考虑任何物品"）
   *   列含义：背包容量 w（从 0 到 capacity）
   *
   * 【状态转移】对每个物品有两种选择：
   *   - 不选：dp[i][w] = dp[i-1][w]（继承上一行的值，容量不变）
   *   - 选：  dp[i][w] = values[i-1] + dp[i-1][w-weights[i-1]]（加上当前物品价值，减去其重量）
   *   取两者最大值：这就是"选还是不选"的决策过程
   *
   * 【教学重点】
   *   让学生看到二维表是"逐行填充"的——每一行只依赖上一行，
   *   这体现了 DP 的"无后效性"：当前决策不影响之前的决策结果。
   */
  async knapsack(weights: number[], values: number[], capacity: number) {
    this.reset();
    const n = weights.length;
    // dp[i][w]: 考虑前 i 个物品，容量为 w 时的最大价值
    const dp: number[][] = Array(n + 1).fill(0).map(() => Array(capacity + 1).fill(0));
    this.state.dp = dp.map(row => [...row]);

    this.addStep('init', {
      weights,
      values,
      capacity,
      dp: dp.map(row => [...row])
    }, '初始化二维 dp 表（行=物品数，列=容量），边界全为 0', 2);
    await this.wait();

    for (let i = 1; i <= n; i++) {
      // 外层循环：遍历每个物品
      this.addStep('calculate', {
        weights,
        values,
        dp: dp.map(row => [...row]),
        current: { item: i - 1, weight: -1 }
      }, `处理第 ${i} 个物品（重量：${weights[i-1]}，价值：${values[i-1]}）`, 3);
      await this.wait();

      for (let w = 0; w <= capacity; w++) {
        this.addStep('calculate', {
          weights,
          values,
          dp: dp.map(row => [...row]),
          current: { item: i - 1, weight: w }
        }, `考虑第 ${i} 个物品（重量：${weights[i-1]}，价值：${values[i-1]}）和容量 ${w}`, 4);
        await this.wait();

        if (weights[i - 1] <= w) {
          // 能装下：在"选"和"不选"中取最优
          dp[i][w] = Math.max(
            values[i - 1] + dp[i - 1][w - weights[i - 1]], // 选：当前物品价值 + 剩余容量的最优解
            dp[i - 1][w]                                    // 不选：直接继承
          );
          this.state.dp = dp.map(row => [...row]);
        } else {
          // 装不下：只能不选，继承上一行
          dp[i][w] = dp[i - 1][w];
          this.state.dp = dp.map(row => [...row]);
        }

        this.addStep('calculate', {
          weights,
          values,
          dp: dp.map(row => [...row]),
          current: { item: i - 1, weight: w },
          update: true
        }, `更新 dp[${i}][${w}] = ${dp[i][w]}`, 6);
        await this.wait();
      }
    }

    // 回溯找出选择了哪些物品
    // 教学要点：从 dp[n][capacity] 倒推，如果 dp[i][w] != dp[i-1][w]，说明第 i 个物品被选中了
    const selected: number[] = [];
    let i = n;
    let w = capacity;
    while (i > 0 && w > 0) {
      if (dp[i][w] !== dp[i - 1][w]) {
        selected.unshift(i - 1);
        w -= weights[i - 1];
      }
      i--;
    }

    this.state.solution = {
      maxValue: dp[n][capacity],
      selected
    };

    this.addStep('solution', {
      weights,
      values,
      dp: dp.map(row => [...row]),
      maxValue: dp[n][capacity],
      selected
    }, `最大价值为 ${dp[n][capacity]}，选择的物品索引为 [${selected.join(', ')}]`, 8);

    this.state.isComplete = true;
    this.notify('计算完成');
  }

  /**
   * 编辑距离 / Levenshtein 距离（Edit Distance）
   *
   * 【算法思想】
   *   将 word1 转换为 word2 所需的最少单字符操作次数
   *   三种基本操作及其对应的 DP 转移方向：
   *     - 删除 word1[i]：dp[i-1][j] + 1   （向上走，去掉一个字符）
   *     - 插入 word2[j]：dp[i][j-1] + 1   （向左走，添加一个字符）
   *     - 替换 word1[i]→word2[j]：dp[i-1][j-1] + 1（斜向走，替换一个字符）
   *   特殊情况：如果 word1[i] === word2[j]，无需操作，直接继承 dp[i-1][j-1]
   *
   * 【边界初始化的含义】
   *   dp[i][0] = i：将 word1[0..i-1] 变成空串需要删除 i 个字符
   *   dp[0][j] = j：将空串变成 word2[0..j-1] 需要插入 j 个字符
   *
   * 【教学重点】
   *   DP 表的对角线结构非常直观——主对角线代表"匹配"，
   *   偏离对角线代表"需要付出编辑代价"。
   *   学生应关注：三种操作如何在表中对应不同的移动方向。
   */
  async editDistance(word1: string, word2: string) {
    this.reset();
    const m = word1.length;
    const n = word2.length;
    const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
    this.state.dp = dp.map(row => [...row]);

    // 边界初始化：将一端变为空串所需的操作次数
    for (let i = 0; i <= m; i++) {
      dp[i][0] = i; // 删除 i 个字符使 word1 变空
    }
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j; // 插入 j 个字符使空串变 word2
    }
    this.state.dp = dp.map(row => [...row]);

    this.addStep('init', {
      word1,
      word2,
      dp: dp.map(row => [...row])
    }, '初始化 dp 表，边界值 = 将一端变为空串所需操作数', 3);
    await this.wait();

    for (let i = 1; i <= m; i++) {
      // 外层循环：遍历 word1 的每个字符
      this.addStep('calculate', {
        word1,
        word2,
        dp: dp.map(row => [...row]),
        current: { i: i - 1, j: -1 }
      }, `处理 word1[${i}] = '${word1[i-1]}'`, 5);
      await this.wait();

      for (let j = 1; j <= n; j++) {
        this.addStep('calculate', {
          word1,
          word2,
          dp: dp.map(row => [...row]),
          current: { i: i - 1, j: j - 1 }
        }, `比较 '${word1[i-1]}' 和 '${word2[j-1]}'`, 7);
        await this.wait();

        if (word1[i - 1] === word2[j - 1]) {
          // 字符相同：无需额外操作，继承左上角的值
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          // 字符不同：在删除、插入、替换三种操作中取最小代价
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,    // 删除 word1[i-1]
            dp[i][j - 1] + 1,    // 插入 word2[j-1]
            dp[i - 1][j - 1] + 1 // 替换 word1[i-1] → word2[j-1]
          );
        }
        this.state.dp = dp.map(row => [...row]);

        this.addStep('calculate', {
          word1,
          word2,
          dp: dp.map(row => [...row]),
          current: { i: i - 1, j: j - 1 },
          update: true
        }, `更新 dp[${i}][${j}] = ${dp[i][j]}`, 9);
        await this.wait();
      }
    }

    // 回溯重建具体的编辑操作序列
    const operations: string[] = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && word1[i - 1] === word2[j - 1]) {
        operations.unshift(`保持 ${word1[i - 1]}`);
        i--;
        j--;
      } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
        operations.unshift(`替换 ${word1[i - 1]} 为 ${word2[j - 1]}`);
        i--;
        j--;
      } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
        operations.unshift(`删除 ${word1[i - 1]}`);
        i--;
      } else {
        operations.unshift(`插入 ${word2[j - 1]}`);
        j--;
      }
    }

    this.state.solution = {
      distance: dp[m][n],
      operations
    };

    this.addStep('solution', {
      word1,
      word2,
      dp: dp.map(row => [...row]),
      distance: dp[m][n],
      operations
    }, `编辑距离为 ${dp[m][n]}，编辑步骤：${operations.join(' → ')}`, 11);

    this.state.isComplete = true;
    this.notify('计算完成');
  }

  reset() {
    this.state = {
      steps: [],
      currentStep: -1,
      message: '',
      isComplete: false,
      solution: null,
      dp: []
    };
    this.stepId = 0;
    this.notify();
  }
}
