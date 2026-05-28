export interface DijkstraNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface DijkstraEdge {
  source: string;
  target: string;
  weight: number;
}

export interface DijkstraStep {
  id: number;
  type: 'init' | 'visit' | 'relax' | 'update' | 'complete';
  currentNode: string | null;
  distances: Record<string, number>;
  visited: string[];
  path: Record<string, string | null>;
  message: string;
  highlightLine: number;
  variables: Record<string, any>;
}

export interface DijkstraState {
  steps: DijkstraStep[];
  currentStep: number;
  message: string;
  isComplete: boolean;
  nodes: DijkstraNode[];
  edges: DijkstraEdge[];
  distances: Record<string, number>;
  visited: string[];
  path: Record<string, string | null>;
  solution: any;
}

type Subscriber = (state: DijkstraState) => void;

const DEFAULT_NODES: DijkstraNode[] = [
  { id: 'A', label: 'A', x: 300, y: 50 },
  { id: 'B', label: 'B', x: 150, y: 180 },
  { id: 'C', label: 'C', x: 450, y: 180 },
  { id: 'D', label: 'D', x: 80, y: 350 },
  { id: 'E', label: 'E', x: 300, y: 350 },
  { id: 'F', label: 'F', x: 520, y: 350 }
];

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

export class DijkstraAlgorithm {
  private state: DijkstraState;
  private subscribers: Subscriber[] = [];
  private delay: number = 500;
  private stepId: number = 0;
  private nodes: DijkstraNode[];
  private edges: DijkstraEdge[];
  private adjacencyList: Map<string, Map<string, number>>;

  constructor() {
    this.nodes = [...DEFAULT_NODES];
    this.edges = [...DEFAULT_EDGES];
    this.adjacencyList = new Map();
    this.buildAdjacencyList();
    this.state = this.createInitialState();
  }

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

  private buildAdjacencyList() {
    this.adjacencyList = new Map();
    for (const node of this.nodes) {
      this.adjacencyList.set(node.id, new Map());
    }
    for (const edge of this.edges) {
      this.adjacencyList.get(edge.source)!.set(edge.target, edge.weight);
      this.adjacencyList.get(edge.target)!.set(edge.source, edge.weight);
    }
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
      distances: { ...distances },
      visited: [...visited],
      path: { ...path },
      message,
      highlightLine,
      variables: JSON.parse(JSON.stringify(variables))
    };
    this.state.steps.push(step);
    this.state.currentStep = step.id;
    this.state.distances = { ...distances };
    this.state.visited = [...visited];
    this.state.path = { ...path };
    this.notify(message);
  }

  setGraph(nodes: DijkstraNode[], edges: DijkstraEdge[]) {
    this.nodes = [...nodes];
    this.edges = [...edges];
    this.buildAdjacencyList();
    this.reset();
  }

  async dijkstra(startNode: string) {
    this.reset();

    if (!this.adjacencyList.has(startNode)) {
      this.notify('起始节点不存在: ' + startNode);
      return;
    }

    const distances: Record<string, number> = {};
    const visited: string[] = [];
    const previous: Record<string, string | null> = {};
    const nodeIds = this.nodes.map(n => n.id);

    for (const nodeId of nodeIds) {
      distances[nodeId] = Infinity;
      previous[nodeId] = null;
    }
    distances[startNode] = 0;

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

    while (visited.length < nodeIds.length) {
      const unvisited = nodeIds.filter(id => !visited.includes(id));
      if (unvisited.length === 0) break;

      let minDist = Infinity;
      let currentNode: string | null = null;
      for (const nodeId of unvisited) {
        if (distances[nodeId] < minDist) {
          minDist = distances[nodeId];
          currentNode = nodeId;
        }
      }

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

      const neighbors = this.adjacencyList.get(currentNode)!;
      for (const [neighbor, weight] of neighbors) {
        if (visited.includes(neighbor)) continue;

        const tentativeDist = distances[currentNode] + weight;

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

        if (tentativeDist < distances[neighbor]) {
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

    const paths: Record<string, string[]> = {};
    for (const nodeId of nodeIds) {
      const pathNodes: string[] = [];
      let current: string | null = nodeId;
      while (current !== null) {
        pathNodes.unshift(current);
        current = previous[current];
      }
      paths[nodeId] = pathNodes;
    }

    this.state.solution = { distances, previous, paths };

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
