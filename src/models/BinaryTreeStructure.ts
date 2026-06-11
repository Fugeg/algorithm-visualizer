/**
 * @file BinaryTreeStructure.ts
 * @description 二叉搜索树（BST）数据结构模型 - 算法可视化核心组件
 *
 * 【项目角色】
 * 本模块实现二叉搜索树（Binary Search Tree, BST）的完整数据结构和操作逻辑，
 * 是算法可视化项目中树形结构算法的数据层。通过观察者模式支持实时状态广播，
 * 使 UI 层能够动态展示树的构建、搜索、删除等操作过程。
 *
 * 【设计模式】
 * - 观察者模式（Observer Pattern）：subscribe/notify 机制实现响应式状态更新
 * - 递归模式（Recursion Pattern）：插入、删除、遍历等操作采用递归实现
 * - 访问者模式（Visitor Pattern）：convertToArray 方法将树形结构转换为线性表示
 *
 * 【核心职责】
 * 1. 维护二叉搜索树的结构完整性（左 < 根 < 右 的性质）
 * 2. 实现标准 BST 操作（insert、search、delete）
 * 3. 将树形结构转换为数组形式供 UI 层渲染（层序遍历）
 * 4. 提供树的统计信息（深度、节点数）
 * 5. 通过高亮节点机制支持操作过程的可视化展示
 *
 * 【业务场景】
 * - 数据结构教学：演示二叉搜索树的性质和操作原理
 * - 算法学习：展示递归算法在树结构中的应用
 * - 性能分析：对比平衡树与非平衡树的效率差异
 *
 * 【BST 性质】
 * 对于树中的每个节点：
 * - 其左子树中所有节点的值都小于该节点的值
 * - 其右子树中所有节点的值都大于该节点的值
 * - 左右子树也分别是二叉搜索树
 */

/**
 * 二叉树节点接口
 * @interface TreeNode
 * @description 定义二叉树中单个节点的数据结构
 */
interface TreeNode {
  /** 节点存储的数值（本实现限定为 number 类型以支持比较） */
  value: number;
  /** 左子节点引用，null 表示无左子树 */
  left: TreeNode | null;
  /** 右子节点引用，null 表示无右子树 */
  right: TreeNode | null;
}

/**
 * 树操作类型枚举接口
 * @interface TreeOperation
 * @description 定义树支持的所有操作类型标识
 */
interface TreeOperation {
  /** 操作类型：插入 | 删除 | 搜索 */
  type: 'insert' | 'delete' | 'search';
  /** 操作涉及的值（可选） */
  value?: number;
  /** 从根到当前节点的路径索引数组（用于可视化追踪） */
  path?: number[];
}

/**
 * 树状态接口
 * @interface TreeState
 * @description 向外部暴露的完整状态快照
 */
interface TreeState {
  /** 根节点的引用 */
  root: TreeNode | null;
  /** 当前正在执行的操作信息 */
  currentOperation: TreeOperation | null;
  /** 当前需要高亮显示的节点索引列表（用于动画效果） */
  highlightNodes: number[];
  /**
   * 树的数组表示（层序遍历结果）
   * 使用数组模拟完全二叉树的结构，便于 UI 渲染
   * 对于位置 i 的节点：
   * - 左子节点在 2*i+1
   * - 右子节点在 2*i+2
   */
  treeArray: (number | null)[];
  /** 树的最大深度（层数） */
  maxDepth: number;
}

/**
 * 二叉搜索树数据结构类
 * @class BinaryTreeStructure
 * @description 封装二叉搜索树的完整实现，提供可视化支持的操作接口
 *
 * 【特性说明】
 * - 采用根指针（root）管理整个树的入口
 * - 所有公共方法均为异步，支持逐步动画展示
 * - 内部维护高亮节点数组，标记当前操作的路径
 * - 使用数组索引系统定位节点位置（基于完全二叉树性质）
 *
 * 【时间复杂度参考】（平均情况 / 最坏情况）
 * - 插入：O(log n) / O(n)
 * - 搜索：O(log n) / O(n)
 * - 删除：O(log n) / O(n)
 *
 * 【最坏情况】
 * 当输入序列有序时，树退化为链表，所有操作变为 O(n)
 */
export class BinaryTreeStructure {
  /**
   * 根节点指针
   * @private
   * @type {TreeNode | null}
   * @description 指向树的根节点，null 表示空树
   * 根节点是访问整个树的唯一入口
   */
  private root: TreeNode | null = null;

  /**
   * 订阅者监听器列表
   * @private
   * @type {((state: TreeState) => void)[]}
   */
  private listeners: ((state: TreeState) => void)[] = [];

  /**
   * 当前正在执行的操作信息
   * @private
   * @type {TreeOperation | null}
   */
  private currentOperation: TreeOperation | null = null;

  /**
   * 当前高亮显示的节点索引集合
   * @private
   * @type {number[]}
   * @description 基于完全二叉树数组表示的索引，用于标记当前操作涉及的节点
   */
  private highlightNodes: number[] = [];

  /**
   * 构造函数
   * @constructor
   * @param {number[]} initialValues - 初始值数组，默认为空数组
   * @description 初始化树实例，将初始值依次插入到树中
   *
   * 【注意】
   * 构造函数中的 insert 调用不会触发通知（因为是同步调用），
   * 如果需要可视化初始构建过程，应在构造后手动逐个调用 insert
   */
  constructor(initialValues: number[] = []) {
    initialValues.forEach(value => this.insert(value));
  }

  /**
   * 通知所有订阅者状态已更新
   * @private
   * @returns {void}
   * @description 将树形结构转换为数组形式后通知所有监听器
   *
   * 【转换必要性】
   * 树的内部存储是层次化的节点对象，无法直接用于 UI 渲染。
   * 此方法调用 convertToArray() 进行层序遍历，生成适合渲染的数组表示。
   */
  private notify() {
    const { treeArray, maxDepth } = this.convertToArray();
    const state: TreeState = {
      root: this.root,
      currentOperation: this.currentOperation,
      highlightNodes: [...this.highlightNodes],
      treeArray,    // 层序遍历结果
      maxDepth      // 树的最大深度
    };
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * 订阅状态变更事件
   * @param {(state: TreeState) => void} listener - 状态变更回调函数
   * @returns {() => void} 取消订阅的函数
   */
  subscribe(listener: (state: TreeState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 获取当前状态的快照
   * @returns {TreeState} 当前状态的完整副本
   */
  getState(): TreeState {
    const { treeArray, maxDepth } = this.convertToArray();
    return {
      root: this.root,
      currentOperation: this.currentOperation,
      highlightNodes: [...this.highlightNodes],
      treeArray,
      maxDepth
    };
  }

  /**
   * 将二叉树转换为数组表示（层序遍历/BFS）
   * @private
   * @returns {{ treeArray: (number | null)[], maxDepth: number }} 数组表示和最大深度
   * @description 使用广度优先搜索将树转换为数组，模拟完全二叉树的存储方式
   *
   * 【算法原理 - 层序遍历 Level Order Traversal】
   * 1. 使用队列辅助进行 BFS 遍历
   * 2. 从根节点开始，按从上到下、从左到右的顺序访问每个节点
   * 3. 对于空节点位置，在数组中填充 null 以保持索引关系
   * 4. 最终移除数组末尾多余的 null 值
   *
   * 【数组索引关系】（基于完全二叉树性质）
   * 对于位置 i 的节点：
   * - 父节点索引：(i - 1) / 2 （向下取整）
   * - 左子节点索引：2 * i + 1
   * - 右子节点索引：2 * i + 2
   *
   * 【示例】
   *        5          → [5, 3, 7, null, 4]
   *       / \
   *      3   7
   *       \
   *        4
   *
   * 【时间复杂度】O(n)，访问每个节点一次
   * 【空间复杂度】O(n)，队列和结果数组的空间开销
   *
   * 【用途】
   * - UI 层根据此数组绘制树的可视化图形
   * - 通过索引快速定位父子关系
   * - 序列化和传输树结构
   */
  private convertToArray(): { treeArray: (number | null)[]; maxDepth: number } {
    // 空树的特殊处理
    if (!this.root) {
      return { treeArray: [], maxDepth: 0 };
    }

    const treeArray: (number | null)[] = [];
    // 使用队列实现 BFS，初始化时放入根节点
    const queue: (TreeNode | null)[] = [this.root];

    let maxDepth = 1;              // 最大深度计数器
    let level = 0;                 // 当前层级
    let nodesInCurrentLevel = 1;   // 当前层的节点数
    let nodesInNextLevel = 0;      // 下一层的非空节点数

    // BFS 主循环：处理队列中的所有节点
    while (queue.length > 0) {
      const levelSize = queue.length; // 当前层的节点总数
      let hasNonNullNode = false;      // 标记当前层是否有非空节点

      // 处理当前层的所有节点
      for (let i = 0; i < levelSize; i++) {
        const node = queue.shift(); // 取出队首节点

        if (node === null) {
          // 空节点：在数组中填充 null，并为其虚拟子节点占位
          treeArray.push(null);
          queue.push(null);  // 左子节点（空）
          queue.push(null);  // 右子节点（空）
        } else {
          // 非空节点：记录值，并将真实子节点加入队列
          treeArray.push(node.value);
          queue.push(node.left);   // 左子节点
          queue.push(node.right);  // 右子节点

          // 统计下一层的非空节点数
          if (node.left) nodesInNextLevel++;
          if (node.right) nodesInNextLevel++;
          hasNonNullNode = true; // 标记当前层有实际内容
        }
      }

      // 更新最大深度（只有当该层有非空节点时才计入）
      if (hasNonNullNode) maxDepth = level + 1;

      // 进入下一层
      level++;
      nodesInCurrentLevel = nodesInNextLevel;
      nodesInNextLevel = 0;

      // 优化：如果当前层全为空节点，说明后续层也都是空的，可以提前终止
      if (nodesInCurrentLevel === 0) break;
    }

    // 后处理：移除数组末尾连续的 null 值（不影响树结构的完整性）
    while (treeArray[treeArray.length - 1] === null) {
      treeArray.pop();
    }

    return { treeArray, maxDepth };
  }

  /**
   * 插入新节点到二叉搜索树
   * @async
   * @param {number} value - 要插入的值
   * @returns {Promise<void>}
   * @description 根据 BST 性质将新值插入到正确的位置
   *
   * 【算法原理 - BST 插入】
   * 1. 如果树为空，创建根节点
   * 2. 否则从根开始比较：
   *     a. 若 value < node.value，进入左子树
   *     b. 若 value > node.value，进入右子树
   *     c. 若 value === node.value，通常选择不插入或更新（本实现跳过）
   * 3. 找到空位置（null 引用），创建新节点并链接
   *
   * 【图示】插入值 25 到以下树中
   *       30               30
   *      /  \             /  \
   *    20    40    →    20    40
   *          /               \
   *        35                35
   *
   * 【时间复杂度】
   * - 平均情况：O(log n)，树相对平衡时
   * - 最坏情况：O(n)，树退化成链表时
   *
   * 【索引计算】
   * 使用完全二叉树索引公式跟踪当前位置：
   * - 向左走：index = 2 * index + 1
   * - 向右走：index = 2 * index + 2
   */
  async insert(value: number) {
    this.currentOperation = { type: 'insert', value };
    this.highlightNodes = [];

    // 特殊情况：空树，直接创建根节点
    if (!this.root) {
      this.root = { value, left: null, right: null };
      this.highlightNodes = [0]; // 高亮根节点位置（索引 0）
      this.notify();
      await new Promise(resolve => setTimeout(resolve, 500));
      this.highlightNodes = [];
      this.notify();
      return;
    }

    let current = this.root;         // 当前比较的节点
    let path: number[] = [0];        // 从根到当前节点的路径索引
    let index = 0;                   // 当前节点的数组索引

    // 循环查找插入位置
    while (true) {
      // 高亮当前正在访问的节点
      this.highlightNodes = [index];
      this.notify();
      await new Promise(resolve => setTimeout(resolve, 500));

      if (value < current.value) {
        // 目标值较小，应该进入左子树
        if (current.left === null) {
          // 找到插入位置：创建左子节点
          current.left = { value, left: null, right: null };
          index = 2 * index + 1; // 计算左子节点索引
          this.highlightNodes = [index];
          this.notify();
          await new Promise(resolve => setTimeout(resolve, 500));
          break; // 插入完成，退出循环
        }
        // 继续向左子树深入
        current = current.left;
        index = 2 * index + 1; // 更新索引
        path.push(index);      // 记录路径
      } else {
        // 目标值较大（或相等），应该进入右子树
        if (current.right === null) {
          // 找到插入位置：创建右子节点
          current.right = { value, left: null, right: null };
          index = 2 * index + 2; // 计算右子节点索引
          this.highlightNodes = [index];
          this.notify();
          await new Promise(resolve => setTimeout(resolve, 500));
          break; // 插入完成，退出循环
        }
        // 继续向右子树深入
        current = current.right;
        index = 2 * index + 2; // 更新索引
        path.push(index);      // 记录路径
      }
    }

    // 清除高亮并通知最终状态
    this.highlightNodes = [];
    this.notify();
  }

  /**
   * 在二叉搜索树中搜索指定值
   * @async
   * @param {number} value - 要搜索的目标值
   * @returns {Promise<boolean>} 找到返回 true，未找到返回 false
   * @description 利用 BST 性质进行高效搜索
   *
   * 【算法原理 - BST 搜索】
   * 类似于二分查找的思想：
   * 1. 从根节点开始比较
   * 2. 若目标值等于当前节点值，找到！
   * 3. 若目标值小于当前节点值，去左子树找
   * 4. 若目标值大于当前节点值，去右子树找
   * 5. 到达 null（叶子节点的子节点），未找到
   *
   * 【时间复杂度】
   * - 平均情况：O(log n)
   * - 最坏情况：O(n)（退化链表）
   *
   * 【与线性搜索的对比】
   * BST 搜索利用了有序性，每次排除一半的可能性，
   * 这与数组的二分查找思想相同，但不需要数组支持随机访问
   */
  async search(value: number): Promise<boolean> {
    this.currentOperation = { type: 'search', value };
    this.highlightNodes = [];

    // 空树特殊情况
    if (!this.root) {
      return false;
    }

    let current = this.root; // 从根节点开始
    let index = 0;           // 当前节点索引

    // 循环搜索直到到达叶子节点下方
    while (current !== null) {
      // 高亮当前正在比较的节点
      this.highlightNodes = [index];
      this.notify();
      await new Promise(resolve => setTimeout(resolve, 500));

      if (value === current.value) {
        // 找到目标值！
        await new Promise(resolve => setTimeout(resolve, 500)); // 额外停顿以便观察
        this.highlightNodes = [];
        this.notify();
        return true;
      }

      // 根据比较结果决定搜索方向
      if (value < current.value) {
        // 目标值较小，去左子树搜索
        current = current.left;
        index = 2 * index + 1; // 左子节点索引
      } else {
        // 目标值较大，去右子树搜索
        current = current.right;
        index = 2 * index + 2; // 右子节点索引
      }
    }

    // 搜索完成，未找到目标
    this.highlightNodes = [];
    this.notify();
    return false;
  }

  /**
   * 删除指定值的节点
   * @async
   * @param {number} value - 要删除的目标值
   * @returns {Promise<void>}
   * @description 从 BST 中移除指定节点，同时保持 BST 性质
   *
   * 【算法原理 - BST 删除（三种情况）】
   *
   * 情况 1：删除叶子节点（无子节点）
   * - 直接删除，将父节点的对应引用设为 null
   *
   * 情况 2：删除只有一个子节点的节点
   * - 用其子节点替代它（提升子节点）
   *
   * 情况 3：删除有两个子节点的节点 ⭐（最复杂）
   * - 找到右子树的最小值节点（中序后继 In-order Successor）
   * - 或找到左子树的最大值节点（中序前驱 In-order Predecessor）
   * - 用后继/前驱的值替换要删除节点的值
   * - 然后删除后继/前缀节点（它最多只有一个右/左子节点）
   *
   * 【为什么选择中序后继？】
   * 中序后继是右子树中最小的节点，它满足：
   * - 大于被删节点左子树的所有值
   * - 小于被删节点右子树的其他值
   * 因此用它替换能保持 BST 性质不变
   *
   * 【时间复杂度】O(h)，h 为树的高度
   * - 平均：O(log n)
   * - 最坏：O(n)
   *
   * 【实现方式】
   * 使用递归函数 deleteNode，返回修改后的子树根节点
   */
  async delete(value: number) {
    this.currentOperation = { type: 'delete', value };
    this.highlightNodes = [];

    /**
     * 递归删除节点的内部方法
     * @param {TreeNode | null} node - 当前检查的子树根节点
     * @param {number} value - 要删除的目标值
     * @param {number} index - 当前节点的数组索引（用于高亮）
     * @returns {Promise<TreeNode | null>} 删除后的子树根节点
     */
    const deleteNode = async (node: TreeNode | null, value: number, index: number = 0): Promise<TreeNode | null> => {
      // 递归基例：到达空节点，说明未找到目标
      if (node === null) return null;

      // 高亮当前正在检查的节点
      this.highlightNodes = [index];
      this.notify();
      await new Promise(resolve => setTimeout(resolve, 500));

      if (value < node.value) {
        // 目标值较小，在左子树中递归删除
        node.left = await deleteNode(node.left, value, 2 * index + 1);
      } else if (value > node.value) {
        // 目标值较大，在右子树中递归删除
        node.right = await deleteNode(node.right, value, 2 * index + 2);
      } else {
        // ★★★ 找到要删除的节点！根据三种情况处理 ★★★

        if (node.left === null && node.right === null) {
          // 情况 1：叶子节点，直接删除（返回 null）
          return null;
        } else if (node.left === null) {
          // 情况 2a：只有右子节点，用右子节点替代
          return node.right;
        } else if (node.right === null) {
          // 情况 2b：只有左子节点，用左子节点替代
          return node.left;
        } else {
          // ★ 情况 3：有两个子节点，使用中序后继策略 ★

          // 寻找右子树的最小值节点（一直向左走到底）
          let minIndex = 2 * index + 2; // 右子节点的起始索引
          let minNode = node.right;      // 从右子节点开始
          let minParent = node;          // 记住最小值节点的父节点

          // 向左遍历直到到达最小值节点（没有左子节点）
          while (minNode.left !== null) {
            minParent = minNode;                    // 移动父节点指针
            minNode = minNode.left;                 // 继续向左
            minIndex = 2 * minIndex + 1;            // 更新索引

            // 高亮查找过程
            this.highlightNodes = [minIndex];
            this.notify();
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          // 用后继节点的值替换当前节点的值
          // 注意：只复制值，不移动节点本身
          if (minParent !== node) {
            // 一般情况：后继节点不是直接右子节点
            minParent.left = minNode.right; // 后继节点最多有一个右子节点
          } else {
            // 特殊情况：右子节点就是后继节点（它没有左子节点）
            minParent.right = minNode.right;
          }

          // 将后继节点的值复制到当前节点
          node.value = minNode.value;
        }
      }

      // 返回修改后的子树（可能已被简化）
      return node;
    };

    // 从根节点开始执行删除
    this.root = await deleteNode(this.root, value);

    // 清除高亮并通知最终状态
    this.highlightNodes = [];
    this.notify();
  }

  /**
   * 获取树的深度（高度）
   * @returns {number} 树的深度（空树返回 0）
   * @description 计算从根节点到最远叶子节点的最长路径上的节点数
   *
   * 【算法原理 - 递归求深度】
   * 1. 空节点的深度为 0
   * 2. 非空节点的深度 = 1 + max(左子树深度, 右子树深度)
   *
   * 【时间复杂度】O(n)，需要访问每个节点
   * 【空间复杂度】O(h)，递归调用栈的深度（h 为树高）
   *
   * 【应用场景】
   * - 判断树是否平衡（左右子树深度差 <= 1）
   * - 计算 BST 的性能指标
   * - 可视化时确定树的布局空间
   */
  getDepth(): number {
    /**
     * 递归计算深度的辅助函数
     * @param {TreeNode | null} node - 当前计算的子树根节点
     * @returns {number} 该子树的深度
     */
    const calculateDepth = (node: TreeNode | null): number => {
      if (node === null) return 0; // 空树深度为 0
      // 递归计算：当前节点(1) + 子树的最大深度
      return 1 + Math.max(calculateDepth(node.left), calculateDepth(node.right));
    };

    return calculateDepth(this.root);
  }

  /**
   * 获取树的节点总数
   * @returns {number} 节点数量（空树返回 0）
   * @description 统计树中所有节点的个数
   *
   * 【算法原理 - 递归计数】
   * 1. 空树的节点数为 0
   * 2. 非空树的节点数 = 1(自身) + 左子树节点数 + 右子树节点数
   *
   * 【时间复杂度】O(n)，需要访问每个节点
   * 【空间复杂度】O(h)，递归调用栈的深度
   *
   * 【应用场景】
   * - 显示树的规模统计
   * - 计算空间占用
   * - 判断是否需要重新平衡
   */
  getSize(): number {
    /**
     * 递归计数的辅助函数
     * @param {TreeNode | null} node - 当前计数的子树根节点
     * @returns {number} 该子树的节点数
     */
    const countNodes = (node: TreeNode | null): number => {
      if (node === null) return 0; // 空树节点数为 0
      // 递归计算：当前节点(1) + 左子树 + 右子树
      return 1 + countNodes(node.left) + countNodes(node.right);
    };

    return countNodes(this.root);
  }
}
