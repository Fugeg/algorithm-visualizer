/**
 * @file AVLTreeStructure.ts
 * @description AVL 平衡二叉搜索树数据结构模型 - 算法可视化核心组件
 *
 * 【项目角色】
 * 本模块实现 AVL 树（Adelson-Velsky and Landis Tree）的完整数据结构和操作逻辑，
 * 是算法可视化项目中高级树形结构算法的数据层。通过步骤记录机制支持完整的操作过程回放，
 * 使 UI 层能够动态展示 AVL 树的插入、删除、旋转等平衡操作过程。
 *
 * 【设计模式】
 * - 观察者模式（Observer Pattern）：subscribe/notify 机制实现响应式状态更新
 * - 命令模式（Command Pattern）：每步操作记录为可回放的步骤
 * - 策略模式（Strategy Pattern）：四种旋转情况（LL/RR/LR/RL）的策略选择
 *
 * 【核心职责】
 * 1. 维护 AVL 树的平衡性质（任意节点左右子树高度差 ≤ 1）
 * 2. 实现带自动平衡的插入和删除操作
 * 3. 实现四种旋转操作的逻辑（左旋、右旋及组合）
 * 4. 记录详细的操作步骤用于可视化回放
 * 5. 提供树的统计信息（深度、节点数、平衡因子）
 *
 * 【业务场景】
 * - 数据库索引：演示 B+Tree 的简化版本原理
 * - 平衡算法教学：展示自平衡二叉搜索树的维护过程
 * - 性能对比：对比 BST 和 AVL 的查找效率差异
 * - 红黑树基础：AVL 是理解红黑树的良好起点
 *
 * 【AVL 树的核心特性】
 * - 平衡因子（Balance Factor）= 左子树高度 - 右子树高度
 * - 对于每个节点，|BF| ≤ 1，否则需要旋转调整
 * - 保证最坏情况下查找时间仍为 O(log n)
 * - 相比普通 BST 避免了退化成链表的问题
 */

/** AVL 树节点接口 */
export interface AVLTreeNode {
  /** 节点存储的数值 */
  value: number;
  /** 左子节点引用 */
  left: AVLTreeNode | null;
  /** 右子节点引用 */
  right: AVLTreeNode | null;
  /** 节点高度（用于计算平衡因子） */
  height: number;
}

/** 序列化后的 AVL 节点接口（包含额外的元信息） */
export interface SerializedAVLNode {
  value: number;
  left: SerializedAVLNode | null;
  right: SerializedAVLNode | null;
  height: number;
  /** 计算得到的平衡因子 */
  balanceFactor: number;
}

/** 单个操作步骤记录 */
export interface AVLTreeStep {
  /** 当前树结构的快照 */
  tree: SerializedAVLNode | null;
  /** 操作类型标识 */
  operation: string;
  /** 步骤描述消息 */
  message: string;
  /** 高亮的代码行号（对应伪代码行号） */
  highlightLine: number;
  /** 当前步骤涉及的变量值 */
  variables: Record<string, string | number>;
}

/** AVL 树完整状态接口 */
export interface AVLTreeState {
  /** 根节点的序列化表示 */
  root: SerializedAVLNode | null;
  /** 当前正在执行的操作名称 */
  currentOperation: string | null;
  /** 当前高亮的节点值列表 */
  highlightNodes: number[];
  /** 所有记录的操作步骤 */
  steps: AVLTreeStep[];
}

/** 支持的操作类型 */
export type AVLOperationType = 'insert' | 'delete' | 'search';

/** 默认初始值数组（用于构建示例树） */
const DEFAULT_VALUES = [30, 20, 40, 10, 25, 35, 50];

/**
 * AVL 树数据结构类
 * @class AVLTreeStructure
 * @description 封装 AVL 平衡二叉搜索树的完整实现
 *
 * 【与普通 BST 的区别】
 * - 每次插入/删除后检查并恢复平衡
 * - 维护每个节点的高度信息
 * - 通过旋转操作保持 O(log n) 的性能保证
 *
 * 【时间复杂度保证】
 * - 查找：O(log n) （始终平衡）
 * - 插入：O(log n) （最多 O(log n) 次旋转）
 * - 删除：O(log n) （最多 O(log n) 次旋转）
 */
export class AVLTreeStructure {
  private root: AVLTreeNode | null = null;
  private listeners: ((state: AVLTreeState) => void)[] = [];
  private currentOperation: string | null = null;
  private highlightNodes: number[] = [];
  private steps: AVLTreeStep[] = [];

  constructor(initialValues: number[] = DEFAULT_VALUES) {
    // 使用同步方法构建初始树（不触发步骤记录）
    for (const v of initialValues) {
      this.root = this.insertNode(this.root, v);
    }
  }

  /**
   * 获取节点高度
   * @private
   */
  private getHeight(node: AVLTreeNode | null): number {
    return node ? node.height : 0;
  }

  /**
   * 计算平衡因子
   * @private
   * @returns 左子树高度 - 右子树高度
   */
  private getBalanceFactor(node: AVLTreeNode | null): number {
    if (!node) return 0;
    return this.getHeight(node.left) - this.getHeight(node.right);
  }

  /**
   * 更新节点高度
   * @private
   * @description 基于子树高度重新计算当前节点的高度
   * 高度 = 1 + max(左子树高度, 右子树高度)
   */
  private updateHeight(node: AVLTreeNode): void {
    node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
  }

  /**
   * 右旋操作（Right Rotation / LL Rotation）
   * @private
   * @param {AVLTreeNode} y - 不平衡节点（平衡因子 > 1）
   * @returns {AVLTreeNode} 旋转后的新根节点
   *
   * 【图示】
   *     y                x
   *    / \              / \
   *   x   T3   →       T1  y
   *  / \                  / \
   * T1  T2              T2  T3
   *
   * 适用条件：LL 型不平衡（左子树的左侧过深）
   * 即 balanceFactor > 1 且插入值 < node.left.value
   *
   * 【时间复杂度】O(1)，只修改少量指针
   */
  private rightRotate(y: AVLTreeNode): AVLTreeNode {
    const x = y.left!;      // x 是 y 的左子节点
    const t2 = x.right;     // t2 是 x 的右子树

    // 执行旋转：x 成为新的根
    x.right = y;            // y 成为 x 的右子节点
    y.left = t2;            // t2 成为 y 的左子树

    // 更新高度（先更新 y 再更新 x，因为 y 现在是子节点）
    this.updateHeight(y);
    this.updateHeight(x);

    return x; // 返回新的根节点
  }

  /**
   * 左旋操作（Left Rotation / RR Rotation）
   * @private
   * @param {AVLTreeNode} x - 不平衡节点（平衡因子 < -1）
   * @returns {AVLTreeNode} 旋转后的新根节点
   *
   * 【图示】
   *   x                  y
   *  / \                / \
   * T1  y      →       x   T3
   *     / \           / \
   *    T2  T3        T1  T2
   *
   * 适用条件：RR 型不平衡（右子树的右侧过深）
   * 即 balanceFactor < -1 且插入值 > node.right.value
   *
   * 【时间复杂度】O(1)
   */
  private leftRotate(x: AVLTreeNode): AVLTreeNode {
    const y = x.right!;     // y 是 x 的右子节点
    const t2 = y.left;      // t2 是 y 的左子树

    // 执行旋转：y 成为新的根
    y.left = x;             // x 成为 y 的左子节点
    x.right = t2;           // t2 成为 x 的右子树

    // 更新高度
    this.updateHeight(x);
    this.updateHeight(y);

    return y; // 返回新的根节点
  }

  /**
   * 序列化节点（转换为包含元信息的格式）
   * @private
   */
  private serializeNode(node: AVLTreeNode | null): SerializedAVLNode | null {
    if (!node) return null;
    return {
      value: node.value,
      left: this.serializeNode(node.left),
      right: this.serializeNode(node.right),
      height: node.height,
      balanceFactor: this.getBalanceFactor(node),
    };
  }

  /**
   * 记录一个操作步骤
   * @private
   * @description 将当前状态保存到 steps 数组中，用于后续回放展示
   */
  private recordStep(operation: string, message: string, highlightLine: number, variables: Record<string, string | number> = {}): void {
    this.steps.push({
      tree: this.serializeNode(this.root),
      operation,
      message,
      highlightLine,
      variables,
    });
  }

  /**
   * 通知所有订阅者状态已更新
   * @private
   */
  private notify(): void {
    const state: AVLTreeState = {
      root: this.serializeNode(this.root),
      currentOperation: this.currentOperation,
      highlightNodes: [...this.highlightNodes],
      steps: [...this.steps],
    };
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  subscribe(listener: (state: AVLTreeState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getState(): AVLTreeState {
    return {
      root: this.serializeNode(this.root),
      currentOperation: this.currentOperation,
      highlightNodes: [...this.highlightNodes],
      steps: [...this.steps],
    };
  }

  getSteps(): AVLTreeStep[] {
    return this.steps;
  }

  /**
   * 重置树到默认状态
   */
  reset(): void {
    this.root = null;
    this.currentOperation = null;
    this.highlightNodes = [];
    this.steps = [];
    for (const v of DEFAULT_VALUES) {
      this.root = this.insertNode(this.root, v);
    }
    this.notify();
  }

  /**
   * 内部插入方法（同步版本，不记录步骤）
   * @private
   * @description 标准 AVL 插入算法，返回平衡后的子树根节点
   *
   * 【四种旋转情况】
   * 1. LL（左左）：右旋一次
   * 2. RR（右右）：左旋一次
   * 3. LR（左右）：先左旋左子节点，再右旋
   * 4. RL（右左）：先右旋右子节点，再左旋
   */
  private insertNode(node: AVLTreeNode | null, value: number): AVLTreeNode {
    // 标准 BST 插入
    if (!node) {
      return { value, left: null, right: null, height: 1 };
    }
    if (value < node.value) {
      node.left = this.insertNode(node.left, value);
    } else if (value > node.value) {
      node.right = this.insertNode(node.right, value);
    } else {
      return node; // 不允许重复值
    }

    // 更新高度
    this.updateHeight(node);

    // 获取平衡因子
    const balance = this.getBalanceFactor(node);

    // ★ 四种不平衡情况及对应的旋转策略 ★

    // LL Case：左子树左侧过深 → 右旋
    if (balance > 1 && value < node.left!.value) {
      return this.rightRotate(node);
    }
    // RR Case：右子树右侧过深 → 左旋
    if (balance < -1 && value > node.right!.value) {
      return this.leftRotate(node);
    }
    // LR Case：左子树右侧过深 → 先左旋左子节点，再右旋
    if (balance > 1 && value > node.left!.value) {
      node.left = this.leftRotate(node.left!);
      return this.rightRotate(node);
    }
    // RL Case：右子树左侧过深 → 先右旋右子节点，再左旋
    if (balance < -1 && value < node.right!.value) {
      node.right = this.rightRotate(node.right!);
      return this.leftRotate(node);
    }

    return node; // 已平衡，无需旋转
  }

  /**
   * 查找最小值节点
   * @private
   */
  private findMin(node: AVLTreeNode): AVLTreeNode {
    let current = node;
    while (current.left) {
      current = current.left;
    }
    return current;
  }

  /**
   * 内部删除方法（同步版本，不记录步骤）
   * @private
   */
  private deleteNode(node: AVLTreeNode | null, value: number): AVLTreeNode | null {
    if (!node) return null;

    // 标准 BST 删除
    if (value < node.value) {
      node.left = this.deleteNode(node.left, value);
    } else if (value > node.value) {
      node.right = this.deleteNode(node.right, value);
    } else {
      // 找到要删除的节点
      if (!node.left && !node.right) return null;         // 叶子节点
      else if (!node.left) return node.right;            // 只有右子节点
      else if (!node.right) return node.left;            // 只有左子节点
      else {
        // 有两个子节点：用中序后继替代
        const successor = this.findMin(node.right);
        node.value = successor.value;
        node.right = this.deleteNode(node.right, successor.value);
      }
    }

    // 更新高度和检查平衡
    this.updateHeight(node);
    const balance = this.getBalanceFactor(node);

    // ★ 删除后的四种旋转情况（使用子树平衡因子判断）★

    // LL
    if (balance > 1 && this.getBalanceFactor(node.left) >= 0) {
      return this.rightRotate(node);
    }
    // LR
    if (balance > 1 && this.getBalanceFactor(node.left) < 0) {
      node.left = this.leftRotate(node.left!);
      return this.rightRotate(node);
    }
    // RR
    if (balance < -1 && this.getBalanceFactor(node.right) <= 0) {
      return this.leftRotate(node);
    }
    // RL
    if (balance < -1 && this.getBalanceFactor(node.right) > 0) {
      node.right = this.rightRotate(node.right!);
      return this.leftRotate(node);
    }

    return node;
  }

  /**
   * 生成插入操作的所有步骤（用于可视化回放）
   * @param {number} value - 要插入的值
   */
  generateInsertSteps(value: number): void {
    this.steps = [];
    this.currentOperation = `insert(${value})`;
    this.highlightNodes = [];

    this.recordStep('insert', `开始插入 ${value}`, 0, { value });
    this.root = this.insertWithSteps(this.root, value);
    this.recordStep('insert', `插入 ${value} 完成`, 10, { value });
    this.notify();
  }

  /**
   * 带步骤记录的插入方法
   * @private
   */
  private insertWithSteps(node: AVLTreeNode | null, value: number): AVLTreeNode {
    if (!node) {
      this.recordStep('insert', `创建新节点 ${value}`, 1, { value });
      return { value, left: null, right: null, height: 1 };
    }

    if (value < node.value) {
      this.recordStep('insert', `${value} < ${node.value}，进入左子树`, 2, {
        value, currentNode: node.value, direction: 'left',
      });
      node.left = this.insertWithSteps(node.left, value);
    } else if (value > node.value) {
      this.recordStep('insert', `${value} > ${node.value}，进入右子树`, 3, {
        value, currentNode: node.value, direction: 'right',
      });
      node.right = this.insertWithSteps(node.right, value);
    } else {
      this.recordStep('insert', `${value} 已存在，跳过`, 4, { value });
      return node;
    }

    this.updateHeight(node);
    const balance = this.getBalanceFactor(node);

    this.recordStep('insert', `更新节点 ${node.value} 的高度为 ${node.height}，平衡因子为 ${balance}`, 5, {
      node: node.value, height: node.height, balanceFactor: balance,
    });

    // LL 旋转
    if (balance > 1) {
      if (value < node.left!.value) {
        this.recordStep('insert', `节点 ${node.value} 左子树过高 (BF=${balance})，${value} < ${node.left!.value} → LL旋转`, 6, {
          rotationType: 'LL', pivot: node.value, balanceFactor: balance,
        });
        return this.rightRotate(node);
      } else {
        // LR 旋转
        this.recordStep('insert', `节点 ${node.value} 左子树过高 (BF=${balance})，${value} > ${node.left!.value} → LR旋转`, 7, {
          rotationType: 'LR', pivot: node.value, balanceFactor: balance,
        });
        node.left = this.leftRotate(node.left!);
        return this.rightRotate(node);
      }
    }

    // RR 或 RL 旋转
    if (balance < -1) {
      if (value > node.right!.value) {
        this.recordStep('insert', `节点 ${node.value} 右子树过高 (BF=${balance})，${value} > ${node.right!.value} → RR旋转`, 8, {
          rotationType: 'RR', pivot: node.value, balanceFactor: balance,
        });
        return this.leftRotate(node);
      } else {
        // RL 旋转
        this.recordStep('insert', `节点 ${node.value} 右子树过高 (BF=${balance})，${value} < ${node.right!.value} → RL旋转`, 9, {
          rotationType: 'RL', pivot: node.value, balanceFactor: balance,
        });
        node.right = this.rightRotate(node.right!);
        return this.leftRotate(node);
      }
    }

    return node;
  }

  /**
   * 生成删除操作的所有步骤
   * @param {number} value - 要删除的值
   */
  generateDeleteSteps(value: number): void {
    this.steps = [];
    this.currentOperation = `delete(${value})`;
    this.highlightNodes = [];

    this.recordStep('delete', `开始删除 ${value}`, 0, { value });
    this.root = this.deleteWithSteps(this.root, value);
    this.recordStep('delete', `删除 ${value} 完成`, 10, { value });
    this.notify();
  }

  /**
   * 带步骤记录的删除方法
   * @private
   */
  private deleteWithSteps(node: AVLTreeNode | null, value: number): AVLTreeNode | null {
    if (!node) {
      this.recordStep('delete', `未找到节点 ${value}`, 1, { value });
      return null;
    }

    if (value < node.value) {
      this.recordStep('delete', `${value} < ${node.value}，进入左子树`, 2, {
        value, currentNode: node.value, direction: 'left',
      });
      node.left = this.deleteWithSteps(node.left, value);
    } else if (value > node.value) {
      this.recordStep('delete', `${value} > ${node.value}，进入右子树`, 3, {
        value, currentNode: node.value, direction: 'right',
      });
      node.right = this.deleteWithSteps(node.right, value);
    } else {
      this.recordStep('delete', `找到要删除的节点 ${value}`, 4, { value });

      if (!node.left && !node.right) {
        this.recordStep('delete', `节点 ${value} 是叶子节点，直接删除`, 5, { value });
        return null;
      } else if (!node.left) {
        this.recordStep('delete', `节点 ${value} 只有右子树，用右子树替代`, 5, { value });
        return node.right;
      } else if (!node.right) {
        this.recordStep('delete', `节点 ${value} 只有左子树，用左子树替代`, 5, { value });
        return node.left;
      } else {
        const successor = this.findMin(node.right);
        this.recordStep('delete', `节点 ${value} 有两个子节点，找到中序后继 ${successor.value}`, 6, {
          value, successor: successor.value,
        });
        node.value = successor.value;
        this.recordStep('delete', `将节点值替换为中序后继 ${successor.value}，然后删除后继节点`, 7, {
          replacedValue: successor.value,
        });
        node.right = this.deleteWithSteps(node.right, successor.value);
      }
    }

    this.updateHeight(node);
    const balance = this.getBalanceFactor(node);

    this.recordStep('delete', `回溯更新节点 ${node.value}，高度=${node.height}，平衡因子=${balance}`, 8, {
      node: node.value, height: node.height, balanceFactor: balance,
    });

    // 删除后的旋转处理（与 insert 类似但使用子树 BF 判断）
    if (balance > 1) {
      if (this.getBalanceFactor(node.left) >= 0) {
        this.recordStep('delete', `节点 ${node.value} 左子树过高 (BF=${balance})，左子树平衡因子=${this.getBalanceFactor(node.left)} → LL旋转`, 9, {
          rotationType: 'LL', pivot: node.value, balanceFactor: balance, leftBF: this.getBalanceFactor(node.left),
        });
        return this.rightRotate(node);
      } else {
        this.recordStep('delete', `节点 ${node.value} 左子树过高 (BF=${balance})，左子树平衡因子=${this.getBalanceFactor(node.left)} → LR旋转`, 9, {
          rotationType: 'LR', pivot: node.value, balanceFactor: balance, leftBF: this.getBalanceFactor(node.left),
        });
        node.left = this.leftRotate(node.left!);
        return this.rightRotate(node);
      }
    }

    if (balance < -1) {
      if (this.getBalanceFactor(node.right) <= 0) {
        this.recordStep('delete', `节点 ${node.value} 右子树过高 (BF=${balance})，右子树平衡因子=${this.getBalanceFactor(node.right)} → RR旋转`, 9, {
          rotationType: 'RR', pivot: node.value, balanceFactor: balance, rightBF: this.getBalanceFactor(node.right),
        });
        return this.leftRotate(node);
      } else {
        this.recordStep('delete', `节点 ${node.value} 右子树过高 (BF=${balance})，右子树平衡因子=${this.getBalanceFactor(node.right)} → RL旋转`, 9, {
          rotationType: 'RL', pivot: node.value, balanceFactor: balance, rightBF: this.getBalanceFactor(node.right),
        });
        node.right = this.rightRotate(node.right!);
        return this.leftRotate(node);
      }
    }

    return node;
  }

  /**
   * 生成搜索操作的所有步骤
   * @param {number} value - 要搜索的目标值
   */
  generateSearchSteps(value: number): void {
    this.steps = [];
    this.currentOperation = `search(${value})`;
    this.highlightNodes = [];

    this.recordStep('search', `开始搜索 ${value}`, 0, { value });

    let current = this.root;
    let depth = 0;

    while (current) {
      const balance = this.getBalanceFactor(current);
      this.recordStep('search', `访问节点 ${current.value}，高度=${current.height}，平衡因子=${balance}`, 1, {
        currentNode: current.value, depth, balanceFactor: balance,
      });

      if (value === current.value) {
        this.recordStep('search', `找到节点 ${value}，深度为 ${depth}`, 2, {
          found: 'true', value, depth,
        });
        this.notify();
        return;
      } else if (value < current.value) {
        this.recordStep('search', `${value} < ${current.value}，进入左子树`, 3, {
          value, currentNode: current.value, direction: 'left',
        });
        current = current.left;
      } else {
        this.recordStep('search', `${value} > ${current.value}，进入右子树`, 4, {
          value, currentNode: current.value, direction: 'right',
        });
        current = current.right;
      }
      depth++;
    }

    this.recordStep('search', `未找到节点 ${value}`, 5, { found: 'false', value });
    this.notify();
  }

  getDepth(): number {
    const calc = (node: AVLTreeNode | null): number => {
      if (!node) return 0;
      return 1 + Math.max(calc(node.left), calc(node.right));
    };
    return calc(this.root);
  }

  getSize(): number {
    const count = (node: AVLTreeNode | null): number => {
      if (!node) return 0;
      return 1 + count(node.left) + count(node.right);
    };
    return count(this.root);
  }
}
