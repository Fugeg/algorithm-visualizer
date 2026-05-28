export interface AVLTreeNode {
  value: number;
  left: AVLTreeNode | null;
  right: AVLTreeNode | null;
  height: number;
}

export interface SerializedAVLNode {
  value: number;
  left: SerializedAVLNode | null;
  right: SerializedAVLNode | null;
  height: number;
  balanceFactor: number;
}

export interface AVLTreeStep {
  tree: SerializedAVLNode | null;
  operation: string;
  message: string;
  highlightLine: number;
  variables: Record<string, string | number>;
}

export interface AVLTreeState {
  root: SerializedAVLNode | null;
  currentOperation: string | null;
  highlightNodes: number[];
  steps: AVLTreeStep[];
}

export type AVLOperationType = 'insert' | 'delete' | 'search';

const DEFAULT_VALUES = [30, 20, 40, 10, 25, 35, 50];

export class AVLTreeStructure {
  private root: AVLTreeNode | null = null;
  private listeners: ((state: AVLTreeState) => void)[] = [];
  private currentOperation: string | null = null;
  private highlightNodes: number[] = [];
  private steps: AVLTreeStep[] = [];

  constructor(initialValues: number[] = DEFAULT_VALUES) {
    for (const v of initialValues) {
      this.root = this.insertNode(this.root, v);
    }
  }

  private getHeight(node: AVLTreeNode | null): number {
    return node ? node.height : 0;
  }

  private getBalanceFactor(node: AVLTreeNode | null): number {
    if (!node) return 0;
    return this.getHeight(node.left) - this.getHeight(node.right);
  }

  private updateHeight(node: AVLTreeNode): void {
    node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
  }

  private rightRotate(y: AVLTreeNode): AVLTreeNode {
    const x = y.left!;
    const t2 = x.right;
    x.right = y;
    y.left = t2;
    this.updateHeight(y);
    this.updateHeight(x);
    return x;
  }

  private leftRotate(x: AVLTreeNode): AVLTreeNode {
    const y = x.right!;
    const t2 = y.left;
    y.left = x;
    x.right = t2;
    this.updateHeight(x);
    this.updateHeight(y);
    return y;
  }

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

  private recordStep(operation: string, message: string, highlightLine: number, variables: Record<string, string | number> = {}): void {
    this.steps.push({
      tree: this.serializeNode(this.root),
      operation,
      message,
      highlightLine,
      variables,
    });
  }

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

  private insertNode(node: AVLTreeNode | null, value: number): AVLTreeNode {
    if (!node) {
      return { value, left: null, right: null, height: 1 };
    }

    if (value < node.value) {
      node.left = this.insertNode(node.left, value);
    } else if (value > node.value) {
      node.right = this.insertNode(node.right, value);
    } else {
      return node;
    }

    this.updateHeight(node);

    const balance = this.getBalanceFactor(node);

    if (balance > 1 && value < node.left!.value) {
      return this.rightRotate(node);
    }
    if (balance < -1 && value > node.right!.value) {
      return this.leftRotate(node);
    }
    if (balance > 1 && value > node.left!.value) {
      node.left = this.leftRotate(node.left!);
      return this.rightRotate(node);
    }
    if (balance < -1 && value < node.right!.value) {
      node.right = this.rightRotate(node.right!);
      return this.leftRotate(node);
    }

    return node;
  }

  private findMin(node: AVLTreeNode): AVLTreeNode {
    let current = node;
    while (current.left) {
      current = current.left;
    }
    return current;
  }

  private deleteNode(node: AVLTreeNode | null, value: number): AVLTreeNode | null {
    if (!node) return null;

    if (value < node.value) {
      node.left = this.deleteNode(node.left, value);
    } else if (value > node.value) {
      node.right = this.deleteNode(node.right, value);
    } else {
      if (!node.left && !node.right) {
        return null;
      } else if (!node.left) {
        return node.right;
      } else if (!node.right) {
        return node.left;
      } else {
        const successor = this.findMin(node.right);
        node.value = successor.value;
        node.right = this.deleteNode(node.right, successor.value);
      }
    }

    this.updateHeight(node);

    const balance = this.getBalanceFactor(node);

    if (balance > 1 && this.getBalanceFactor(node.left) >= 0) {
      return this.rightRotate(node);
    }
    if (balance > 1 && this.getBalanceFactor(node.left) < 0) {
      node.left = this.leftRotate(node.left!);
      return this.rightRotate(node);
    }
    if (balance < -1 && this.getBalanceFactor(node.right) <= 0) {
      return this.leftRotate(node);
    }
    if (balance < -1 && this.getBalanceFactor(node.right) > 0) {
      node.right = this.rightRotate(node.right!);
      return this.leftRotate(node);
    }

    return node;
  }

  generateInsertSteps(value: number): void {
    this.steps = [];
    this.currentOperation = `insert(${value})`;
    this.highlightNodes = [];

    this.recordStep('insert', `开始插入 ${value}`, 0, { value });
    this.root = this.insertWithSteps(this.root, value);
    this.recordStep('insert', `插入 ${value} 完成`, 10, { value });
    this.notify();
  }

  private insertWithSteps(node: AVLTreeNode | null, value: number): AVLTreeNode {
    if (!node) {
      this.recordStep('insert', `创建新节点 ${value}`, 1, { value });
      return { value, left: null, right: null, height: 1 };
    }

    if (value < node.value) {
      this.recordStep('insert', `${value} < ${node.value}，进入左子树`, 2, {
        value,
        currentNode: node.value,
        direction: 'left',
      });
      node.left = this.insertWithSteps(node.left, value);
    } else if (value > node.value) {
      this.recordStep('insert', `${value} > ${node.value}，进入右子树`, 3, {
        value,
        currentNode: node.value,
        direction: 'right',
      });
      node.right = this.insertWithSteps(node.right, value);
    } else {
      this.recordStep('insert', `${value} 已存在，跳过`, 4, { value });
      return node;
    }

    this.updateHeight(node);
    const balance = this.getBalanceFactor(node);

    this.recordStep('insert', `更新节点 ${node.value} 的高度为 ${node.height}，平衡因子为 ${balance}`, 5, {
      node: node.value,
      height: node.height,
      balanceFactor: balance,
    });

    if (balance > 1) {
      if (value < node.left!.value) {
        this.recordStep('insert', `节点 ${node.value} 左子树过高 (BF=${balance})，${value} < ${node.left!.value} → LL旋转`, 6, {
          rotationType: 'LL',
          pivot: node.value,
          balanceFactor: balance,
        });
        return this.rightRotate(node);
      } else {
        this.recordStep('insert', `节点 ${node.value} 左子树过高 (BF=${balance})，${value} > ${node.left!.value} → LR旋转`, 7, {
          rotationType: 'LR',
          pivot: node.value,
          balanceFactor: balance,
        });
        node.left = this.leftRotate(node.left!);
        return this.rightRotate(node);
      }
    }

    if (balance < -1) {
      if (value > node.right!.value) {
        this.recordStep('insert', `节点 ${node.value} 右子树过高 (BF=${balance})，${value} > ${node.right!.value} → RR旋转`, 8, {
          rotationType: 'RR',
          pivot: node.value,
          balanceFactor: balance,
        });
        return this.leftRotate(node);
      } else {
        this.recordStep('insert', `节点 ${node.value} 右子树过高 (BF=${balance})，${value} < ${node.right!.value} → RL旋转`, 9, {
          rotationType: 'RL',
          pivot: node.value,
          balanceFactor: balance,
        });
        node.right = this.rightRotate(node.right!);
        return this.leftRotate(node);
      }
    }

    return node;
  }

  generateDeleteSteps(value: number): void {
    this.steps = [];
    this.currentOperation = `delete(${value})`;
    this.highlightNodes = [];

    this.recordStep('delete', `开始删除 ${value}`, 0, { value });
    this.root = this.deleteWithSteps(this.root, value);
    this.recordStep('delete', `删除 ${value} 完成`, 10, { value });
    this.notify();
  }

  private deleteWithSteps(node: AVLTreeNode | null, value: number): AVLTreeNode | null {
    if (!node) {
      this.recordStep('delete', `未找到节点 ${value}`, 1, { value });
      return null;
    }

    if (value < node.value) {
      this.recordStep('delete', `${value} < ${node.value}，进入左子树`, 2, {
        value,
        currentNode: node.value,
        direction: 'left',
      });
      node.left = this.deleteWithSteps(node.left, value);
    } else if (value > node.value) {
      this.recordStep('delete', `${value} > ${node.value}，进入右子树`, 3, {
        value,
        currentNode: node.value,
        direction: 'right',
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
          value,
          successor: successor.value,
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
      node: node.value,
      height: node.height,
      balanceFactor: balance,
    });

    if (balance > 1) {
      if (this.getBalanceFactor(node.left) >= 0) {
        this.recordStep('delete', `节点 ${node.value} 左子树过高 (BF=${balance})，左子树平衡因子=${this.getBalanceFactor(node.left)} → LL旋转`, 9, {
          rotationType: 'LL',
          pivot: node.value,
          balanceFactor: balance,
          leftBF: this.getBalanceFactor(node.left),
        });
        return this.rightRotate(node);
      } else {
        this.recordStep('delete', `节点 ${node.value} 左子树过高 (BF=${balance})，左子树平衡因子=${this.getBalanceFactor(node.left)} → LR旋转`, 9, {
          rotationType: 'LR',
          pivot: node.value,
          balanceFactor: balance,
          leftBF: this.getBalanceFactor(node.left),
        });
        node.left = this.leftRotate(node.left!);
        return this.rightRotate(node);
      }
    }

    if (balance < -1) {
      if (this.getBalanceFactor(node.right) <= 0) {
        this.recordStep('delete', `节点 ${node.value} 右子树过高 (BF=${balance})，右子树平衡因子=${this.getBalanceFactor(node.right)} → RR旋转`, 9, {
          rotationType: 'RR',
          pivot: node.value,
          balanceFactor: balance,
          rightBF: this.getBalanceFactor(node.right),
        });
        return this.leftRotate(node);
      } else {
        this.recordStep('delete', `节点 ${node.value} 右子树过高 (BF=${balance})，右子树平衡因子=${this.getBalanceFactor(node.right)} → RL旋转`, 9, {
          rotationType: 'RL',
          pivot: node.value,
          balanceFactor: balance,
          rightBF: this.getBalanceFactor(node.right),
        });
        node.right = this.rightRotate(node.right!);
        return this.leftRotate(node);
      }
    }

    return node;
  }

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
        currentNode: current.value,
        depth,
        balanceFactor: balance,
      });

      if (value === current.value) {
        this.recordStep('search', `找到节点 ${value}，深度为 ${depth}`, 2, {
          found: 'true',
          value,
          depth,
        });
        this.notify();
        return;
      } else if (value < current.value) {
        this.recordStep('search', `${value} < ${current.value}，进入左子树`, 3, {
          value,
          currentNode: current.value,
          direction: 'left',
        });
        current = current.left;
      } else {
        this.recordStep('search', `${value} > ${current.value}，进入右子树`, 4, {
          value,
          currentNode: current.value,
          direction: 'right',
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
