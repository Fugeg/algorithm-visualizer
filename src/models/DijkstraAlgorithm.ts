/**
 * @file DijkstraAlgorithm.ts
 * @description Dijkstra 最短路径算法模型 - 算法可视化核心组件
 *
 * 【项目角色】
 * 本模块实现 Dijkstra（迪杰斯特拉）最短路径算法的完整逻辑，是算法可视化项目中
 * 图论算法的数据层。通过步骤记录机制支持完整的算法执行过程回放，使 UI 层能够动态展示
 * 距离初始化、节点选择、松弛操作等核心步骤。
 *
 * 【设计模式】
 * - 观察者模式（Observer Pattern）：subscribe/notify 机制实现响应式状态更新
 * - 快照模式（Snapshot Pattern）：每步记录完整状态用于回放
 * - 贪心策略（Greedy Strategy）：每次选择当前距离最小的未访问节点
 *
 * 【核心职责】
 * 1. 管理加权有向/无向图的邻接表结构
 * 2. 实现 Dijkstra 算法的完整执行流程
 * 3. 记录每一步的状态快照（距离、访问顺序、路径等）
 * 4. 维护并输出最终的最短路径结果
 * 5. 支持自定义图结构输入
 *
 * 【业务场景】
 * - GPS 导航：演示地图导航的最短路径计算
 * - 网络路由：展示 OSPF/RIP 协议的路由选择原理
 * - 游戏开发：A* 算法的基础变体
 * - 社交网络：展示"六度分隔"理论的最短连接路径
 *
 * 【Dijkstra 算法核心思想】
 * 从起点出发，逐步扩展已知最短距离的节点集合 S。
 * 每次从 V-S 中选择距离起点最近的节点 u 加入 S，
 * 然后对 u 的所有邻居 v 进行松弛操作（Relaxation）：
 *   如果 d[u] + w(u,v) < d[v]，则更新 d[v] = d[u] + w(u,v)
 * 重复直到所有节点都加入 S，或剩余节点均不可达。
 *
 * 【时间复杂度】O((V + E) log V)（使用优先队列优化）
 * 本实现使用简单数组查找最小值，时间复杂度为 O(V²)
 *
 * 【前置条件】
 * - 图中不能包含负权边！（否则应使用 Bellman-Ford 算法）
 * - 图必须是连通的（或能处理不连通情况）
 */

/** 图节点接口 */
export interface DijkstraNode {
  /** 节点唯一标识符 */
  id: string;
  /** 显示标签 */
  label: string;
  /** x 坐标（可视化布局用） */
  x: number;
  /** y 坐标（可视化布局用） */
  y: number;
}

/** 加权边接口 */
export interface DijkstraEdge {
  /** 边的起始节点 ID */
  source: string;
  /** 边的目标节点 ID */
  target: string;
  /** 边的权重（必须为正数） */
  weight: number;
}

/** 单个算法步骤记录 */
export interface DijkstraStep {
  /** 步骤唯一 ID（自增） */
  id: number;
  /** 步骤类型标识 */
  type: 'init' | 'visit' | 'relax' | 'update' | 'complete';
  /** 当前正在处理的节点 */
  currentNode: string | null;
  /** 当前各节点的距离记录 */
  distances: Record<string, number>;
  /** 已访问节点的有序列表 */
  visited: string[];
  /** 各节点的前驱映射（用于重构路径） */
  path: Record<string, string | null>;
  /** 步骤描述消息 */
  message: string;
  /** 高亮的伪代码行号 */
  highlightLine: number;
  /** 当前步骤涉及的变量值 */
  variables: Record<string, any>;
}

/** 完整状态接口 */
export interface DijkstraState {
  /** 所有记录的步骤 */
  steps: DijkstraStep[];
  /** 当前步骤索引 */
  currentStep: number;
  /** 操作说明消息 */
  message: string;
  /** 算法是否执行完毕 */
  isComplete: boolean;
  /** 图的所有节点 */
  nodes: DijkstraNode[];
  /** 图的所有边 */
  edges: DijkstraEdge[];
  /** 当前距离数组快照 */
  distances: Record<string, number>;
  /** 当前已访问节点列表 */
  visited: string[];
  /** 当前前驱映射 */
  path: Record<string, string | null>;
  /** 最终解决方案（路径和距离） */
  solution: any;
}

/** 订阅者类型定义 */
type Subscriber = (state: DijkstraState) => void;

/** 默认示例图的节点配置 */
const DEFAULT_NODES: DijkstraNode[] = [
  { id: 'A', label: 'A', x: 300, y: 50 },
  { id: 'B', label: 'B', x: 150, y: 180 },
  { id: 'C', label: 'C', x: 450, y: 180 },
  { id: 'D', label: 'D', x: 80, y: 350 },
  { id: 'E', label: 'E', x: 300, y: 350 },
  { id: 'F', label: 'F', x: 520, y: 350 }
];

/** 默认示例图的边配置（无向加权图） */
const DEFAULT_EDGES: DijkstraEdge[] = [
  { source: 'A', target: 'B', weight: 4 },
  { source: 'A', target: 'C', weight: 2 },
  { source: 'B', target: 'C', weight: 1 },
  { source: 'B', target: 'D', weight: 5 },
  { source: 'C', target: 'E', weight: 3 },
  { source: 'C', target: 'D', weight: 8 },
  { source: 'D', target: 'E', weight: 2 },
  { source: 'D', target: 'F', weight: 6 },
  { source: 'E', target: 'F', weight: 1 }
];

/**
 * Dijkstra 算法类
 * @class DijkstraAlgorithm
 * @description 封装完整的 Dijkstra 最短路径算法实现，带可视化支持
 *
 * 【默认图结构】
 * 使用 DEFAULT_NODES 和 DEFAULT_EDGES 构建如下无向加权图：
 *
 *       A(0)
 *      / \
 *   4/   \2
 *   /     \
 * B---1---C
 * |\     /|
 * 5 \   /3| 8
 *   \ /   |
 *    D----E
 *    |\  /|
 *   6| /1|2
 *    \|/  |
 *     F---
 *
 * 【算法正确性保证】
 * Dijkstra 算法的正确性基于贪心选择性质：
 * 每次选择的距离最小节点 u，其距离 d[u] 已经是最优的，
 * 因为任何经过其他未访问节点的路径长度都不可能更短
 * （所有边权非负保证了这一点）
 */
export class DijkstraAlgorithm {
  /** 完整状态对象 */
  private state: DijkstraState;

  /** 订阅者列表 */
  private subscribers: Subscriber[] = [];

  /** 动画延迟时间（毫秒） */
  private delay: number = 500;

  /** 步骤 ID 自增计数器 */
  private stepId: number = 0;

  /** 当前图节点数据 */
  private nodes: DijkstraNode[];

  /** 当前图边数据 */
  private edges: DijkstraEdge[];

  /** 邻接表存储结构 */
  private adjacencyList: Map<string, Map<string, number>>;

  constructor() {
    this.nodes = [...DEFAULT_NODES];
    this.edges = [...DEFAULT_EDGES];
    this.adjacencyList = new Map();
    this.buildAdjacencyList();
    this.state = this.createInitialState();
  }

  /**
   * 创建初始状态
   * @private
   */
  private createInitialState(): DijkstraState {
    return {
      steps: [],
      currentStep: -1,
      message: '',
      isComplete: false,
      nodes: [...this.nodes],
      edges: [...this.edges],
      distances: {},
      visited: [],
      path: {},
      solution: null
    };
  }

  /**
   * 构建邻接表
   * @private
   * @description 将边数组转换为便于查询的邻接表结构
   */
  private buildAdjacencyList() {
    this.adjacencyList = new Map();
    // 初始化每个节点的邻居映射
    for (const node of this.nodes) {
      this.adjacencyList.set(node.id, new Map());
    }
    // 填充邻接关系（无向图双向存储）
    for (const edge of this.edges) {
      this.adjacencyList.get(edge.source)!.set(edge.target, edge.weight);
      this.adjacencyList.get(edge.target)!.set(edge.source, edge.weight);
    }
  }

  subscribe(subscriber: Subscriber) {
    this.subscribers.push(subscriber);
    subscriber(this.state); // 立即发送当前状态
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== subscriber);
    };
  }

  /**
   * 通知订阅者状态更新
   * @private
   */
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

  /**
   * 异步等待工具方法
   * @private
   */
  private async wait() {
    await new Promise(resolve => setTimeout(resolve, this.delay));
  }

  /**
   * 记录一个算法步骤
   * @private
   * @description 创建步骤快照并更新全局状态
   */
  private addStep(
    type: DijkstraStep['type'],
    currentNode: string | null,
    distances: Record<string, number>,
    visited: string[],
    path: Record<string, string | null>,
    message: string,
    highlightLine: number,
    variables: Record<string, any> = {}
  ) {
    const step: DijkstraStep = {
      id: this.stepId++,
      type,
      currentNode,
      distances: { ...distances },           // 深拷贝
      visited: [...visited],                 // 深拷贝
      path: { ...path },                     // 深拷贝
      message,
      highlightLine,
      variables: JSON.parse(JSON.stringify(variables)) // 深拷贝变量
    };
    this.state.steps.push(step);
    this.state.currentStep = step.id;
    this.state.distances = { ...distances };
    this.state.visited = [...visited];
    this.state.path = { ...path };
    this.notify(message);
  }

  /**
   * 设置自定义图结构
   * @param {DijkstraNode[]} nodes - 新的节点列表
   * @param {DijkstraEdge[]} edges - 新的边列表
   */
  setGraph(nodes: DijkstraNode[], edges: DijkstraEdge[]) {
    this.nodes = [...nodes];
    this.edges = [...edges];
    this.buildAdjacencyList();
    this.reset();
  }

  /**
   * 执行 Dijkstra 算法
   * @async
   * @param {string} startNode - 起始节点 ID
   * @description 从指定起点开始计算到所有其他节点的最短路径
   *
   * 【算法流程详解】
   *
   * 阶段 1：初始化（Initialization）
   * - 将起点的距离设为 0
   * - 将所有其他节点的距离设为 ∞（Infinity）
   * - 清空已访问集合和前驱映射
   *
   * 阶段 2：主循环（Main Loop）
   * 当还有未访问节点时循环：
   *   a. 选择阶段（Selection）：
   *      - 在未访问节点中找到距离最小的节点 u
   *      - 如果最小距离为 ∞，说明剩余节点不可达，提前终止
   *   b. 访问阶段（Visitation）：
   *      - 将 u 标记为已访问
   *   c. 松弛阶段（Relaxation）：
   *      - 对于 u 的每个邻居 v：
   *        i. 计算试探距离 tentativeDist = d[u] + w(u,v)
   *        ii. 如果 tentativeDist < d[v]：
   *            - 更新 d[v] = tentativeDist
   *            - 设置 predecessor[v] = u
   *        iii. 否则保持不变
   *
   * 阶段 3：路径重构（Path Reconstruction）
   * - 对每个节点，通过前驱映射回溯到起点
   * - 得到从起点到该节点的完整最短路径
   *
   * 【松弛操作 Relaxation 的数学含义】
   * 三角不等式：d[u] + w(u,v) ≥ d[v]
   * 松弛就是检查这个不等式是否成立，
   * 如果不成立则更新 d[v]，使其满足三角不等式
   *
   * 【示例】（使用默认图，起点 A）
   * 初始：d[A]=0, d[其他]=∞
   * 第1轮：选 A(0), 松弛 B(4), C(2)
   * 第2轮：选 C(2), 松弛 E(5), D(10)
   * 第3轮：选 B(4), 松弛 D(9), 更新!
   * 第4轮：选 E(5), 松弛 F(6)
   * 第5轮：选 D(9), 无更优松弛
   * 第6轮：选 F(6), 完成
   * 结果：A→C→E→F=6, A→C→E=5, A→B=4, A→C→B→D=9
   */
  async dijkstra(startNode: string) {
    // 重置状态
    this.reset();

    // 验证起始节点存在性
    if (!this.adjacencyList.has(startNode)) {
      this.notify('起始节点不存在: ' + startNode);
      return;
    }

    // ★★★ 阶段 1：初始化 ★★★
    const distances: Record<string, number> = {};
    const visited: string[] = [];
    const previous: Record<string, string | null> = {};
    const nodeIds = this.nodes.map(n => n.id);

    // 所有节点距离初始化为无穷大
    for (const nodeId of nodeIds) {
      distances[nodeId] = Infinity;  // 表示尚未到达
      previous[nodeId] = null;         // 前驱未知
    }
    distances[startNode] = 0;          // 起点到自身距离为 0

    // 记录初始化步骤
    this.addStep(
      'init',
      null,
      distances,
      visited,
      previous,
      `初始化：将所有节点距离设为 ∞，起始节点 ${startNode} 距离设为 0`,
      1,
      { startNode, unvisited: nodeIds.filter(id => id !== startNode) }
    );
    await this.wait();

    // ★★★ 阶段 2：主循环 ★★★
    while (visited.length < nodeIds.length) {
      const unvisited = nodeIds.filter(id => !visited.includes(id));
      if (unvisited.length === 0) break;

      // ★ 选择阶段：在未访问节点中找距离最小的
      let minDist = Infinity;
      let currentNode: string | null = null;
      for (const nodeId of unvisited) {
        if (distances[nodeId] < minDist) {
          minDist = distances[nodeId];
          currentNode = nodeId;
        }
      }

      // 检查是否所有剩余节点都不可达
      if (currentNode === null || distances[currentNode] === Infinity) {
        this.addStep(
          'visit',
          null,
          distances,
          visited,
          previous,
          '剩余未访问节点均不可达，算法提前结束',
          4,
          { unvisited }
        );
        break;
      }

      // 记录选择步骤
      this.addStep(
        'visit',
        currentNode,
        distances,
        visited,
        previous,
        `选择未访问节点中距离最小的节点 ${currentNode}（距离: ${distances[currentNode]}）`,
        4,
        { unvisited, minDist }
      );
      await this.wait();

      // ★ 访问阶段：将选中节点标记为已访问
      visited.push(currentNode);

      this.addStep(
        'visit',
        currentNode,
        distances,
        visited,
        previous,
        `将节点 ${currentNode} 标记为已访问`,
        5,
        { visited: [...visited] }
      );
      await this.wait();

      // ★ 松弛阶段：检查所有出边
      const neighbors = this.adjacencyList.get(currentNode)!;
      for (const [neighbor, weight] of neighbors) {
        if (visited.includes(neighbor)) continue; // 跳过已访问节点

        // 计算经过 currentNode 到达 neighbor 的试探距离
        const tentativeDist = distances[currentNode] + weight;

        // 记录松弛检查步骤
        this.addStep(
          'relax',
          currentNode,
          distances,
          visited,
          previous,
          `检查边 ${currentNode} → ${neighbor}（权重: ${weight}），试探距离: ${distances[currentNode]} + ${weight} = ${tentativeDist}`,
          6,
          { neighbor, weight, tentativeDist, currentDist: distances[neighbor] }
        );
        await this.wait();

        // ★ 核心判断：试探距离是否优于当前已知距离
        if (tentativeDist < distances[neighbor]) {
          // 执行松弛：更新距离和前驱
          distances[neighbor] = tentativeDist;
          previous[neighbor] = currentNode;

          this.addStep(
            'update',
            currentNode,
            distances,
            visited,
            previous,
            `更新节点 ${neighbor} 的距离: ${tentativeDist}（经由 ${currentNode}），前驱设为 ${currentNode}`,
            8,
            { neighbor, newDist: tentativeDist, via: currentNode }
          );
          await this.wait();
        } else {
          // 不需要更新
          this.addStep(
            'relax',
            currentNode,
            distances,
            visited,
            previous,
            `节点 ${neighbor} 的当前距离 ${distances[neighbor]} ≤ 试探距离 ${tentativeDist}，不更新`,
            8,
            { neighbor, currentDist: distances[neighbor], tentativeDist }
          );
          await this.wait();
        }
      }
    }

    // ★★★ 阶段 3：路径重构 ★★★
    const paths: Record<string, string[]> = {};
    for (const nodeId of nodeIds) {
      // 通过前驱映射回溯路径
      const pathNodes: string[] = [];
      let current: string | null = nodeId;
      while (current !== null) {
        pathNodes.unshift(current); // 从头部插入（逆序构建）
        current = previous[current];  // 移动到前驱
      }
      paths[nodeId] = pathNodes;
    }

    // 保存最终解决方案
    this.state.solution = { distances, previous, paths };

    // 记录完成步骤
    this.addStep(
      'complete',
      null,
      distances,
      visited,
      previous,
      `算法完成！从节点 ${startNode} 到各节点的最短距离: ${nodeIds
        .map(id => `${id}=${distances[id] === Infinity ? '∞' : distances[id]}`)
        .join(', ')}`,
      9,
      { distances: { ...distances }, paths }
    );

    this.state.isComplete = true;
    this.notify('Dijkstra 算法执行完成');
  }

  reset() {
    this.stepId = 0;
    this.state = this.createInitialState();
    this.notify();
  }
}
