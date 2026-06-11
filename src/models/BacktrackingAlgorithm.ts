/**
 * 回溯算法（Backtracking Algorithm）可视化模型
 *
 * 【核心框架】回溯法 = 深度优先搜索（DFS）+ 剪枝（Pruning）+ 状态恢复（State Restoration）
 * 它是一种系统地搜索问题解空间的算法，本质上是"试探-失败-返回重试"的过程：
 * 1. 从一条路径出发，逐步做出选择，深入探索
 * 2. 当发现当前路径无法到达目标（违反约束或已穷尽），则"回溯"到上一个决策点
 * 3. 撤销上一步的选择，换一种可能继续尝试
 * 4. 直到找到所有解或确认无解
 *
 * 【与暴力搜索的区别】
 * - 暴力搜索：枚举所有可能的组合，最后统一检查是否合法
 * - 回溯法：在构建解的过程中就进行约束检查（剪枝），提前排除不可能的分支
 *   这大大减少了实际需要探索的节点数
 *
 * 【适用场景】
 * - 组合优化问题：需要在所有可能的组合中找最优/全部可行解（如全排列、子集）
 * - 约束满足问题（CSP）：需要满足一组约束条件的解（如 N皇后、数独、图着色）
 * 共同特征：问题可以分解为多步决策，每步有若干选择，且存在明确的约束条件
 *
 * 【本类支持的三种经典回溯问题】
 * - 全排列（Permutations）：生成 n 个元素的所有排列
 * - N皇后（N-Queens）：在 n×n 棋盘上放置 n 个互不攻击的皇后
 * - 数独（Sudoku）：求解 9×9 数独谜题
 */

export interface BacktrackingState {
  steps: BacktrackingStep[];
  currentStep: number;
  message: string;
  isComplete: boolean;
  solutions: any[];
  currentSolution: any;
}

/**
 * 回溯算法的单步操作记录
 *
 * 每一步操作对应回溯过程中的一个关键动作：
 * - try：尝试——在当前决策点做出一个选择（如放置皇后、填入数字、选取元素）
 *        这是"向下探索"的动作，进入下一层递归
 * - backtrack：回溯——撤销上一步的选择，恢复到之前的状态
 *              这是"向上返回"的动作，说明当前分支走不通或已遍历完
 * - solution：找到一个完整可行的解——当递归到达边界条件时触发
 */
export interface BacktrackingStep {
  id: number;
  level: number;          // 当前递归深度（对应决策树的层数）
  type: 'try' | 'backtrack' | 'solution';
  state: any;
  description: string;
  highlightLine: number;
}

type Subscriber = (state: BacktrackingState) => void;

export class BacktrackingAlgorithm {
  private state: BacktrackingState;
  private subscribers: Subscriber[] = [];
  private delay: number = 500;
  private stepId: number = 0;

  constructor() {
    this.state = {
      steps: [],
      currentStep: -1,
      message: '',
      isComplete: false,
      solutions: [],
      currentSolution: null
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

  private addStep(type: BacktrackingStep['type'], level: number, state: any, description: string, highlightLine: number = -1) {
    const step: BacktrackingStep = {
      id: this.stepId++,
      level,
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
   * 全排列生成（Permutations）
   *
   * 【回溯思路】将全排列看作 n 个位置的填充问题：
   * - 第 1 个位置可以从 n 个数字中任选一个
   * - 第 2 个位置从剩下的 n-1 个数字中任选一个
   * - ...以此类推
   * 用递归实现：每次选择一个未使用的数字放入当前位置，然后递归处理下一个位置。
   * 当所有位置都填满时，就得到了一个完整的排列。
   *
   * 【时间复杂度分析】O(n × n!)
   * - 共有 n! 种排列（第一层 n 个选择，第二层 n-1 个...最后一层 1 个）
   * - 每找到一个完整排列需要 O(n) 时间来复制结果
   * - 决策树是一棵 n 层的完全 n 叉树（每层可选数逐渐减少），共 n! 个叶节点
   */
  async permutations(nums: number[]) {
    this.state.solutions = [];
    // used[i] = true 表示 nums[i] 已经被选入当前排列中
    // 这就是"状态记录"——避免同一元素被重复使用
    const used: boolean[] = new Array(nums.length).fill(false);
    // current 数组记录当前正在构建的排列（从左到右依次填充）
    const current: number[] = [];

    /**
     * 回溯函数：尝试填充第 level 个位置（0-indexed）
     *
     * 【三个关键要素】
     * - used 数组：标记哪些元素已经被选中，确保每个元素只用一次（排列的定义）
     * - current 数组：当前已做出的选择序列，长度代表已填充的位置数
     * - base case（终止条件）：当 current.length === nums.length 时，
     *   说明所有位置都已填满，找到了一个完整的排列
     */
    const backtrack = async (level: number) => {
      // Base case：所有位置都已填满，找到一个完整的排列
      if (current.length === nums.length) {
        this.state.solutions.push([...current]);
        this.addStep('solution', level, {
          current: [...current],
          used: [...used]
        }, `找到一个解: [${current.join(', ')}]`, 9);
        await this.wait();
        return;
      }

      // 遍历所有可能的候选元素，尝试放入当前位置
      for (let i = 0; i < nums.length; i++) {
        // 剪枝：如果该元素已经在当前排列中使用过，跳过
        if (used[i]) continue;

        // 【try 做出选择】：标记为已使用，加入当前排列
        used[i] = true;
        current.push(nums[i]);

        this.addStep('try', level, {
          current: [...current],
          used: [...used],
          trying: i
        }, `尝试将 ${nums[i]} 放在位置 ${current.length - 1}`, 13);
        await this.wait();

        // 【递归深入】：去填充下一个位置
        await backtrack(level + 1);

        // 【backtrack 撤销选择】：恢复状态，以便尝试其他可能性
        // 这一步是回溯法的核心——必须把状态还原到选择之前的样子
        used[i] = false;
        current.pop();

        this.addStep('backtrack', level, {
          current: [...current],
          used: [...used],
          backtrack: i
        }, `回溯，移除 ${nums[i]}`, 15);
        await this.wait();
      }
    };

    await backtrack(0);
    this.state.isComplete = true;
    this.notify('全排列生成完成');
  }

  /**
   * N皇后问题（N-Queens Problem）
   *
   * 【问题描述】在 n×n 的国际象棋棋盘上放置 n 个皇后，
   * 使得任意两个皇后都不互相攻击（即不在同一行、同一列、同一对角线上）。
   *
   * 【约束条件】
   * - 行约束：每行只能放一个皇后（我们的算法按行逐行放置，天然满足）
   * - 列约束：每列只能放一个皇后
   * - 对角线约束：两条主对角线方向各只能有一个皇后
   *
   * 【搜索空间大小】
   * 理论上从 n² 个格子中选 n 个放置：C(n², n)
   * 但由于每行只放一个，实际是 n^n（每行有 n 个列可选）
   * 加上列约束后降为 P(n,n) = n!（排列数，因为每列也只能用一次）
   * 再加上对角线约束（剪枝），实际探索量远小于 n!
   *
   * 【教学要点】N皇后是理解"约束传播"和"剪枝效果"的最佳例子——
   * 随着棋盘增大，对角线约束能剪掉的节点比例急剧增加。
   */
  async nQueens(n: number) {
    this.state.solutions = [];
    // board[row][col] = 1 表示该位置放了皇后，0 表示空
    const board: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    /**
     * 检查在 (row, col) 放置皇后是否合法
     *
     * 【三种冲突检测】——只需检查上方（已放置的行），因为下方还没放
     * 1. 列冲突：检查同一列是否有皇后（垂直方向）
     * 2. 主对角线冲突（左上↘右下）：同一主对角线上的格子满足 row-col 为常数
     *    例如 (0,2), (1,3), (2,4) 都在主对角线上，row-col 都等于 -2
     * 3. 副对角线冲突（右上↙左下）：同一副对角线上的格子满足 row+col 为常数
     *    例如 (0,0), (1,1), (2,2) 都在副对角线上，row+col 都等于 0
     *
     * 教学要点：用 row±col 的恒定性来判断对角线冲突是一个重要的技巧，
     * 避免了逐格检查对角线的 O(n) 开销（虽然这里还是 O(n)，但可以用数组优化到 O(1)）。
     */
    const isValid = (row: number, col: number): boolean => {
      // 检查同列：遍历当前列的所有已放置行（0 到 row-1）
      for (let i = 0; i < row; i++) {
        if (board[i][col] === 1) return false;
      }

      // 检查主对角线（左上方向）：同时减小 row 和 col
      for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
        if (board[i][j] === 1) return false;
      }

      // 检查副对角线（右上方向）：减小 row，增加 col
      for (let i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) {
        if (board[i][j] === 1) return false;
      }

      return true;
    };

    /**
     * 回溯函数：尝试在第 row 行放置皇后
     * 按行逐行放置，所以不需要再检查行冲突
     */
    const backtrack = async (row: number) => {
      // Base case：所有行都成功放置了皇后，找到一个解
      if (row === n) {
        const solution = board.map(row => [...row]);
        this.state.solutions.push(solution);
        this.addStep('solution', row, {
          board: solution
        }, `找到一个解`, 6);
        await this.wait();
        return;
      }

      // 尝试在当前行的每一列放置皇后
      for (let col = 0; col < n; col++) {
        // 剪枝：如果放置后与已有皇后冲突，跳过这一列
        if (!isValid(row, col)) continue;

        // 【try 做出选择】：在该位置放置皇后
        board[row][col] = 1;
        this.addStep('try', row, {
          board: board.map(row => [...row]),
          trying: { row, col }
        }, `尝试在位置 (${row}, ${col}) 放置皇后`, 9);
        await this.wait();

        // 【递归深入】：去处理下一行
        await backtrack(row + 1);

        // 【backtrack 撤销选择】：移除皇后，恢复空位
        board[row][col] = 0;
        this.addStep('backtrack', row, {
          board: board.map(row => [...row]),
          backtrack: { row, col }
        }, `回溯，移除位置 (${row}, ${col}) 的皇后`, 12);
        await this.wait();
      }
    };

    await backtrack(0);
    this.state.isComplete = true;
    this.notify('N皇后问题解决完成');
  }

  /**
   * 数独求解（Sudoku Solver）
   *
   * 【问题描述】给定一个部分填充的 9×9 数独棋盘，
   * 填充空白格使得每行、每列、每个 3×3 宫内都包含数字 1-9 且不重复。
   *
   * 【作为约束满足问题（CSP）的理解】
   * - 变量：81 个格子，每个变量的取值域是 {1,2,...,9}（已填格子的域为单元素集）
   * - 约束：
   *   (1) 行约束：每行的 9 个格子取值互不相同
   *   (2) 列约束：每列的 9 个格子取值互不相同
   *   (3) 宫约束：每个 3×3 宫内的 9 个格子取值互不相同
   * - 目标：找到满足所有约束的赋值
   *
   * 【回溯解法】按顺序扫描每个空白格，依次尝试填入 1-9 中不违反约束的数字，
   * 填入后递归处理下一个空白格；如果某个格子所有数字都试完仍无法继续，则回溯。
   * 与纯暴力搜索的区别在于：每次填数前都做合法性检查（前向检查/forward checking），
   * 大量不可能的分支在早期就被剪掉了。
   *
   * 【教学要点】数独展示了回溯法在实际应用中的典型模式：
   * 约束检查 + 递归 + 失败回溯，这也是许多 AI 搜索算法的基础。
   */
  async sudoku(board: number[][]) {
    /**
     * 检查在 (row, col) 位置填入 num 是否合法
     * 需要同时满足行、列、宫三个方向的约束
     */
    const isValid = (row: number, col: number, num: number): boolean => {
      // 检查行约束：当前行不能有重复的 num
      for (let x = 0; x < 9; x++) {
        if (board[row][x] === num) return false;
      }

      // 检查列约束：当前列不能有重复的 num
      for (let x = 0; x < 9; x++) {
        if (board[x][col] === num) return false;
      }

      // 检查 3×3 宫约束
      // 通过整除运算定位所属宫的左上角坐标：(startRow, startCol)
      const startRow = Math.floor(row / 3) * 3;
      const startCol = Math.floor(col / 3) * 3;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (board[i + startRow][j + startCol] === num) return false;
        }
      }

      return true;
    };

    /**
     * 回溯函数：尝试填充从 (row, col) 开始的下一个空白格
     *
     * 使用"逐格扫描"策略而非"仅处理空白格列表"，这样更直观地展示回溯过程。
     * 返回值表示从当前位置开始是否能找到解（用于提前终止）。
     */
    const backtrack = async (row: number, col: number): Promise<boolean> => {
      // 当前行已扫描完毕，移动到下一行的起始列
      if (col === 9) {
        return await backtrack(row + 1, 0);
      }

      // Base case：所有格子都处理完毕，找到解！
      if (row === 9) {
        this.state.solutions = [board.map(row => [...row])];
        this.addStep('solution', 0, {
          board: board.map(row => [...row])
        }, '找到数独解', 7);
        await this.wait();
        return true;
      }

      // 如果当前格子已有数字（题目给定的初始值），跳过，直接处理下一个格子
      if (board[row][col] !== 0) {
        return await backtrack(row, col + 1);
      }

      // 尝试填入 1-9 中的每个数字
      for (let num = 1; num <= 9; num++) {
        // 剪枝：如果填入 num 会违反约束，跳过
        if (!isValid(row, col, num)) continue;

        // 【try 做出选择】：填入数字
        board[row][col] = num;
        this.addStep('try', 0, {
          board: board.map(row => [...row]),
          trying: { row, col, num }
        }, `尝试在位置 (${row}, ${col}) 填入数字 ${num}`, 3);
        await this.wait();

        // 【递归深入】：处理下一个格子
        // 注意：数独通常只有一个解，找到后通过返回值提前终止
        if (await backtrack(row, col + 1)) {
          return true;
        }

        // 【backtrack 撤销选择】：清除填入的数字，恢复为空白格
        board[row][col] = 0;
        this.addStep('backtrack', 0, {
          board: board.map(row => [...row]),
          backtrack: { row, col, num }
        }, `回溯，移除位置 (${row}, ${col}) 的数字 ${num}`, 6);
        await this.wait();
      }

      // 所有数字都试过了，没有可行的选择——向上一层报告失败，触发回溯
      return false;
    };

    await backtrack(0, 0);
    this.state.isComplete = true;
    this.notify('数独问题解决完成');
  }

  reset() {
    this.state = {
      steps: [],
      currentStep: -1,
      message: '',
      isComplete: false,
      solutions: [],
      currentSolution: null
    };
    this.stepId = 0;
    this.notify();
  }
}
