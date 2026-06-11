/**
 * @file GraphStructure.ts
 * @description 图（Graph）数据结构模型 - 算法可视化核心组件
 *
 * 【项目角色】
 * 本模块实现图（Graph）数据结构的完整逻辑，是算法可视化项目中图论算法的数据层。
 * 通过观察者模式支持实时状态广播，使 UI 层能够动态展示图的构建、遍历（DFS/BFS）
 * 等操作过程。
 *
 * 【设计模式】
 * - 观察者模式（Observer Pattern）：subscribe/notify 机制实现响应式状态更新
 * - 邻接表模式（Adjacency List）：使用 Map<nodeId, Map<neighborId, weight>> 存储图结构
 *
 * 【核心职责】
 * 1. 管理图节点（Vertex）和边（Edge）的生命周期
 * 2. 维护邻接表结构以高效存储和查询邻接关系
 * 3. 实现标准的图操作（addNode、removeNode、addEdge、removeEdge）
 * 4. 实现经典图遍历算法的可视化版本（DFS、BFS）
 * 5. 提供图的统计信息（节点数、边数、度数等）
 *
 * 【业务场景】
 * - 社交网络：展示用户之间的关系网络
 * - 路径规划：演示地图导航的最短路径算法
 * - 网络拓扑：展示计算机网络的结构
 * - 依赖关系：展示任务调度或包依赖的有向无环图
 *
 * 【技术特点】
 * - 无向图（Undirected Graph）：边没有方向，A→B 等价于 B→A
 * - 加权图（Weighted Graph）：每条边可以有权重值
 * - 邻接表存储：空间效率高，适合稀疏图
 */

/**
 * 图节点接口
 * @interface GraphNode
 * @description 定义图中单个节点的数据结构
 */
interface GraphNode {
  /** 节点唯一标识符 */
  id: string;
  /** 节点显示标签 */
  label: string;
  /** 节点的 x 坐标（用于可视化布局，可选） */
  x?: number;
  /** 节点的 y 坐标（用于可视化布局，可选） */
  y?: number;
}

/**
 * 图边接口
 * @interface GraphEdge
 * @description 定义图中连接两个节点的边
 */
interface GraphEdge {
  /** 边的起始节点 ID */
  source: string;
  /** 边的目标节点 ID */
  target: string;
  /** 边的权重（可选，用于加权图算法） */
  weight?: number;
}

/**
 * 图操作类型枚举接口
 * @interface GraphOperation
 * @description 定义图支持的所有操作类型标识
 */
interface GraphOperation {
  /** 操作类型：添加节点 | 添加边 | 删除节点 | 删除边 | DFS | BFS */
  type: 'addNode' | 'addEdge' | 'removeNode' | 'removeEdge' | 'dfs' | 'bfs';
  /** 操作涉及的节点 ID（可选） */
  nodeId?: string;
  /** 操作涉及的边（可选） */
  edge?: GraphEdge;
  /** 已访问的节点列表（用于 DFS/BFS 可视化） */
  visitedNodes?: string[];
  /** 已访问的边列表（用于 DFS/BFS 可视化） */
  visitedEdges?: GraphEdge[];
}

/**
 * 图状态接口
 * @interface GraphState
 * @description 向外部暴露的完整状态快照
 */
interface GraphState {
  /** 所有节点的数组 */
  nodes: GraphNode[];
  /** 所有边的数组 */
  edges: GraphEdge[];
  /** 当前正在执行的操作信息 */
  currentOperation: GraphOperation | null;
  /** 当前高亮的节点 ID 列表 */
  highlightNodes: string[];
  /** 当前高亮的边列表 */
  highlightEdges: GraphEdge[];
  /** 操作说明消息（用于 UI 提示） */
  message?: string;
}

/**
 * 图数据结构类
 * @class GraphStructure
 * @description 封装无向加权图的完整实现，提供可视化支持的操作接口
 *
 * 【特性说明】
 * - 采用邻接表（Adjacency List）存储图结构
 * - 支持无向图：添加边时同时更新两个方向的邻接关系
 * - 支持边的权重：可用于最短路径等算法
 * - 实现 DFS 和 BFS 遍历算法的可视化版本
 *
 * 【存储结构 - 邻接表 Adjacency List】
 * 使用嵌套 Map 结构：
 * ```
 * adjacencyList = Map<sourceId, Map<targetId, weight>>
 * ```
 * 例如：A --3-- B --2-- C 表示为：
 * ```
 * Map {
 *   'A' => Map { 'B' => 3 },
 *   'B' => Map { 'A' => 3, 'C' => 2 },
 *   'C' => Map { 'B' => 2 }
 * }
 * ```
 *
 * 【时间复杂度参考】
 * - 添加/删除节点：O(1) / O(V+E)
 * - 添加/删除边：O(1)
 * - 检查两节点是否相邻：O(deg(v))，v 的度数
 * - 遍历所有邻居：O(deg(v))
 * - DFS/BFS 遍历：O(V+E)
 *
 * 【空间复杂度】O(V + E)，V 为节点数，E 为边数
 */
export class GraphStructure {
  /**
   * 节点集合
   * @private
   * @type {Map<string, GraphNode>}
   * @description 使用 Map 存储所有节点，key 为节点 ID，便于 O(1) 查找
   */
  private nodes: Map<string, GraphNode>;

  /**
   * 邻接表
   * @private
   * @type {Map<string, Map<string, number>>}
   * @description 核心存储结构
   * 外层 Map 的 key 是源节点 ID
   * 内层 Map 的 key 是目标节点 ID，value 是边的权重
   */
  private adjacencyList: Map<string, Map<string, number>>;

  /**
   * 订阅者监听器列表
   * @private
   */
  private listeners: ((state: GraphState) => void)[] = [];

  /**
   * 当前正在执行的操作信息
   * @private
   */
  private currentOperation: GraphOperation | null = null;

  /**
   * 当前高亮的节点 ID 集合
   * @private
   */
  private highlightNodes: string[] = [];

  /**
   * 当前高亮的边集合
   * @private
   */
  private highlightEdges: GraphEdge[] = [];

  /**
   * 构造函数
   * @constructor
   * @description 初始化空的图实例
   */
  constructor() {
    this.nodes = new Map();           // 空的节点集合
    this.adjacencyList = new Map();   // 空的邻接表
  }

  /**
   * 通知所有订阅者状态已更新
   * @private
   * @param {string} [message] - 可选的操作说明消息
   * @returns {void}
   * @description 构建完整的状态对象并通知所有监听器
   */
  private notify(message?: string) {
    const state: GraphState = {
      nodes: Array.from(this.nodes.values()), // 将 Map 转换为数组
      edges: this.getEdges(),                 // 从邻接表生成边数组
      currentOperation: this.currentOperation,
      highlightNodes: [...this.highlightNodes],
      highlightEdges: [...this.highlightEdges],
      message
    };
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * 订阅状态变更事件
   * @param {(state: GraphState) => void} listener - 状态变更回调函数
   * @returns {() => void} 取消订阅的函数
   */
  subscribe(listener: (state: GraphState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 获取当前状态的快照
   * @returns {GraphState} 当前状态的完整副本
   */
  getState(): GraphState {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.getEdges(),
      currentOperation: this.currentOperation,
      highlightNodes: [...this.highlightNodes],
      highlightEdges: [...this.highlightEdges]
    };
  }

  /**
   * 从邻接表生成边数组
   * @private
   * @returns {GraphEdge[]} 所有无向边的数组
   * @description 遍历邻接表，将每条邻接关系转换为边对象
   *
   * 【注意】
   * 由于是无向图，每条边在邻接表中会被存储两次（A→B 和 B→A），
   * 但此方法会返回完整的边列表（包含重复），由 UI 层决定如何去重显示
   */
  private getEdges(): GraphEdge[] {
    const edges: GraphEdge[] = [];
    // 遍历每个源节点及其邻居
    this.adjacencyList.forEach((neighbors, source) => {
      neighbors.forEach((weight, target) => {
        // 为每个邻接关系创建一条边
        edges.push({ source, target, weight });
      });
    });
    return edges;
  }

  /**
   * 添加节点
   * @async
   * @param {string} id - 节点唯一标识符
   * @param {string} label - 节点显示标签
   * @returns {Promise<boolean>} 成功返回 true，节点已存在返回 false
   * @description 向图中添加一个新节点
   *
   * 【算法原理】
   * 1. 检查节点是否已存在（通过 ID）
   * 2. 如果已存在，返回 false（不允许重复）
   * 3. 否则创建新节点并加入 nodes Map
   * 4. 在邻接表中为新节点创建空的邻居 Map
   *
   * 【时间复杂度】O(1)，Map 的插入和查找都是常数时间
   */
  async addNode(id: string, label: string) {
    // 检查节点是否已存在
    if (this.nodes.has(id)) {
      return false; // 节点已存在，不重复添加
    }

    // 设置操作类型
    this.currentOperation = { type: 'addNode', nodeId: id };

    // 添加到节点集合
    this.nodes.set(id, { id, label });

    // 在邻接表中初始化该节点的邻居映射（空 Map）
    this.adjacencyList.set(id, new Map());

    // 高亮新节点并通知
    this.highlightNodes = [id];
    this.notify('添加节点: ' + label);

    await new Promise(resolve => setTimeout(resolve, 500));

    // 清除高亮
    this.highlightNodes = [];
    this.notify();
    return true;
  }

  /**
   * 添加边
   * @async
   * @param {string} source - 边的起始节点 ID
   * @param {string} target - 边的目标节点 ID
   * @param {number} [weight=1] - 边的权重，默认为 1
   * @returns {Promise<boolean>} 成功返回 true，任一节点不存在返回 false
   * @description 在两个节点之间添加一条无向边
   *
   * 【算法原理】
   * 1. 检查两个节点是否都存在
   * 2. 在 source 的邻居 Map 中添加 <target, weight>
   * 3. 在 target 的邻居 Map 中添加 <source, weight>（无向图双向存储）
   *
   * 【为什么双向存储？】
   * 无向图中 A-B 边意味着可以从 A 到 B，也可以从 B 到 A。
   * 双向存储使得从任意节点出发都能找到所有相邻节点。
   *
   * 【时间复杂度】O(1)
   *
   * 【注意】
   * 本实现允许平行边（multigraph）：同一对节点之间可以有多条不同权重的边
   * （后添加的边会覆盖先前的权重）
   */
  async addEdge(source: string, target: string, weight: number = 1) {
    // 检查两个端点节点是否存在
    if (!this.nodes.has(source) || !this.nodes.has(target)) {
      return false; // 任一节点不存在，无法添加边
    }

    // 创建边对象
    const edge: GraphEdge = { source, target, weight };
    this.currentOperation = { type: 'addEdge', edge };

    // ★ 无向图：双向添加邻接关系
    // source → target
    this.adjacencyList.get(source)?.set(target, weight);
    // target → source（反向）
    this.adjacencyList.get(target)?.set(source, weight);

    // 高亮涉及的节点和边
    this.highlightNodes = [source, target];
    this.highlightEdges = [edge];
    this.notify('添加边: ' + source + ' - ' + target);

    await new Promise(resolve => setTimeout(resolve, 500));

    // 清除高亮
    this.highlightNodes = [];
    this.highlightEdges = [];
    this.notify();
    return true;
  }

  /**
   * 删除节点
   * @async
   * @param {string} id - 要删除的节点 ID
   * @returns {Promise<boolean>} 成功返回 true，节点不存在返回 false
   * @description 从图中移除指定节点及其所有关联的边
   *
   * 【算法原理】
   * 1. 检查节点是否存在
   * 2. 遍历所有其他节点，移除指向该节点的边
   * 3. 从邻接表中删除该节点的条目
   * 4. 从节点集合中删除该节点
   *
   * 【级联删除】
   * 删除节点时必须同时删除所有与之相连的边，
   * 否则邻接表中会出现悬空引用（dangling references）。
   *
   * 【时间复杂度】O(V + E)，需要检查所有节点和边
   */
  async removeNode(id: string) {
    // 检查节点是否存在
    if (!this.nodes.has(id)) {
      return false;
    }

    this.currentOperation = { type: 'removeNode', nodeId: id };
    this.highlightNodes = [id];
    this.notify('删除节点: ' + id);

    await new Promise(resolve => setTimeout(resolve, 500));

    // ★ 步骤 1：删除所有与该节点相关的边
    // 遍历所有节点的邻居列表，移除指向被删节点的引用
    this.adjacencyList.forEach(neighbors => {
      neighbors.delete(id); // 从每个邻居列表中移除该节点
    });

    // ★ 步骤 2：删除节点本身
    this.adjacencyList.delete(id); // 从邻接表中移除
    this.nodes.delete(id);          // 从节点集合中移除

    this.highlightNodes = [];
    this.notify();
    return true;
  }

  /**
   * 删除边
   * @async
   * @param {string} source - 边的起始节点 ID
   * @param {string} target - 边的目标节点 ID
   * @returns {Promise<boolean>} 成功返回 true，边不存在返回 false
   * @description 移除连接两个节点的边
   *
   * 【算法原理】
   * 1. 检查边是否存在（通过邻接表查找）
   * 2. 从 source 的邻居中移除 target
   * 3. 从 target 的邻居中移除 source（无向图双向移除）
   *
   * 【时间复杂度】O(1)，Map 的 delete 操作是常数时间
   */
  async removeEdge(source: string, target: string) {
    // 检查边是否存在
    if (!this.adjacencyList.get(source)?.has(target)) {
      return false; // 边不存在
    }

    const edge: GraphEdge = { source, target };
    this.currentOperation = { type: 'removeEdge', edge };

    // 高亮要删除的边
    this.highlightNodes = [source, target];
    this.highlightEdges = [edge];
    this.notify('删除边: ' + source + ' - ' + target);

    await new Promise(resolve => setTimeout(resolve, 500));

    // ★ 双向移除邻接关系
    this.adjacencyList.get(source)?.delete(target);
    this.adjacencyList.get(target)?.delete(source);

    this.highlightNodes = [];
    this.highlightEdges = [];
    this.notify();
    return true;
  }

  /**
   * 深度优先搜索（DFS - Depth First Search）
   * @async
   * @param {string} startId - 起始节点的 ID
   * @returns {Promise<void>}
   * @description 从指定节点开始进行深度优先遍历
   *
   * 【算法原理 - DFS】
   * 核心思想：沿着一条路径尽可能深入，遇到死胡同后回溯
   *
   * 具体步骤（递归实现）：
   * 1. 访问起始节点，标记为已访问
   * 2. 对于该节点的每个未访问邻居：
   *     a. 记录经过的边
   *     b. 递归访问该邻居
   * 3. 所有邻居都访问完毕后回溯
   *
   * 【图示】
   *       A
   *      / \
   *     B   C
   *    / \   \
   *   D   E   F
   *
   * DFS(A) 的访问顺序可能是：A → B → D → E → C → F
   * （取决于邻居的迭代顺序）
   *
   * 【时间复杂度】O(V + E)，每个节点和边都被访问一次
   * 【空间复杂度】O(V)，递归调用栈的最大深度（最坏情况为 V）
   *
   * 【应用场景】
   * - 检测连通分量
   * - 拓扑排序
   * - 检测环路
   * - 路径查找
   * - 迷宫求解
   */
  async dfs(startId: string) {
    // 检查起始节点是否存在
    if (!this.nodes.has(startId)) {
      return;
    }

    this.currentOperation = { type: 'dfs', nodeId: startId };
    const visited = new Set<string>();        // 已访问节点集合
    const visitedEdges: GraphEdge[] = [];      // 已遍历的边集合

    /**
     * DFS 递归辅助函数
     * @param {string} nodeId - 当前正在访问的节点 ID
     */
    const dfsHelper = async (nodeId: string) => {
      // 标记当前节点为已访问
      visited.add(nodeId);

      // 更新高亮状态并通知
      this.highlightNodes = Array.from(visited);
      this.highlightEdges = [...visitedEdges];
      this.notify('DFS 访问节点: ' + nodeId);

      await new Promise(resolve => setTimeout(resolve, 500));

      // 获取当前节点的所有邻居
      const neighbors = this.adjacencyList.get(nodeId) || new Map();

      // 遍历邻居（顺序取决于 Map 的迭代顺序）
      for (const [neighbor] of neighbors) {
        if (!visited.has(neighbor)) {
          // 未访问过的邻居：记录边并递归访问
          visitedEdges.push({ source: nodeId, target: neighbor });
          await dfsHelper(neighbor); // ★ 递归深入
        }
        // 已访问的邻居：跳过（避免重复访问和无限循环）
      }
    };

    // 从起始节点开始 DFS
    await dfsHelper(startId);

    // 清除高亮并通知完成
    this.highlightNodes = [];
    this.highlightEdges = [];
    this.notify();
  }

  /**
   * 广度优先搜索（BFS - Breadth First Search）
   * @async
   * @param {string} startId - 起始节点的 ID
   * @returns {Promise<void>}
   * @description 从指定节点开始进行广度优先遍历
   *
   * 【算法原理 - BFS】
   * 核心思想：按层次逐层访问，先访问所有直接邻居，再访问邻居的邻居
   *
   * 具体步骤（使用队列实现）：
   * 1. 将起始节点入队，标记为已访问
   * 2. 当队列不为空时循环：
   *     a. 出队一个节点，"访问"它
   *     b. 将其所有未访问邻居入队
   *     c. 标记这些邻居为已访问
   *     d. 记录遍历的边
   * 3. 队列为空时遍历完成
   *
   * 【图示】（同上图的树结构）
   * BFS(A) 的访问顺序：A → B → C → D → E → F
   * （按层级：第0层[A]，第1层[B,C]，第2层[D,E,F]）
   *
   * 【时间复杂度】O(V + E)
   * 【空间复杂度】O(V)，队列最多存储一层的所有节点
   *
   * 【与 DFS 的对比】
   * - DFS 使用栈（递归调用栈），BFS 使用显式队列
   * - DFS 优先深度，BFS 优先广度
   * - DFS 适合找路径，BFS 适合找最短路径（无权图）
   *
   * 【应用场景】
   * - 无权图的最短路径
   * - 社交网络的"六度分隔"
   * - 网络爬虫的网页抓取
   * - GPS 导航的最近地点搜索
   */
  async bfs(startId: string) {
    // 检查起始节点是否存在
    if (!this.nodes.has(startId)) {
      return;
    }

    this.currentOperation = { type: 'bfs', nodeId: startId };
    const visited = new Set<string>();        // 已访问节点集合
    const visitedEdges: GraphEdge[] = [];      // 已遍历的边集合
    const queue: string[] = [startId];         // BFS 队列

    // 起始节点立即标记为已访问并入队
    visited.add(startId);

    // 主循环：处理队列中的节点
    while (queue.length > 0) {
      // 出队：取出队首元素（FIFO）
      const nodeId = queue.shift()!;

      // 更新高亮状态并通知
      this.highlightNodes = Array.from(visited);
      this.highlightEdges = [...visitedEdges];
      this.notify('BFS 访问节点: ' + nodeId);

      await new Promise(resolve => setTimeout(resolve, 500));

      // 获取当前节点的所有邻居
      const neighbors = this.adjacencyList.get(nodeId) || new Map();

      // 遍历邻居
      for (const [neighbor] of neighbors) {
        if (!visited.has(neighbor)) {
          // 未访问过：标记、入队、记录边
          visited.add(neighbor);
          queue.push(neighbor);              // 入队等待后续处理
          visitedEdges.push({ source: nodeId, target: neighbor });
        }
      }
    }

    // 清除高亮并通知完成
    this.highlightNodes = [];
    this.highlightEdges = [];
    this.notify();
  }

  /**
   * 获取节点总数
   * @returns {number} 图中节点的数量
   */
  getNodeCount(): number {
    return this.nodes.size;
  }

  /**
   * 获取边总数
   * @returns {number} 图中边的数量
   * @description 由于是无向图且双边存储，结果需除以 2
   */
  getEdgeCount(): number {
    let count = 0;
    this.adjacencyList.forEach(neighbors => {
      count += neighbors.size;
    });
    // 无向图中每条边被计算了两次（A→B 和 B→A），所以除以 2
    return count / 2;
  }

  /**
   * 获取指定节点的度数
   * @param {string} nodeId - 目标节点 ID
   * @returns {number} 该节点的度数（与其相连的边数），节点不存在返回 0
   * @description 度数是指与该节点直接相连的边的数量
   *
   * 【度的分类】
   * - 无向图：度（Degree）= 邻居数量
   * - 有向图：入度（In-degree）+ 出度（Out-degree）
   *
   * 【应用】
   * - 度数为 0：孤立节点（Isolated vertex）
   * - 度数为 1：叶子节点（Leaf/Pendant vertex）
   * - 高度数节点：枢纽节点（Hub）
   */
  getDegree(nodeId: string): number {
    return this.adjacencyList.get(nodeId)?.size || 0;
  }
}
