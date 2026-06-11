export interface ArrayElement {
  value: number;
  state: 'default' | 'searching' | 'found' | 'eliminated' | 'mid';
}

export interface BinarySearchStep {
  array: ArrayElement[];
  left: number;
  right: number;
  mid: number;
  message: string;
  highlightLine: number;
  variables: Record<string, string | number>;
}

export interface BinarySearchState {
  array: ArrayElement[];
  left: number;
  right: number;
  mid: number;
  message?: string;
  isComplete: boolean;
  foundIndex: number;
}

type Subscriber = (state: BinarySearchState) => void;

export class BinarySearchAlgorithm {
  private array: ArrayElement[];
  private left: number;
  private right: number;
  private mid: number;
  private foundIndex: number;
  private isComplete: boolean;
  private steps: BinarySearchStep[];
  private subscribers: Subscriber[];

  constructor(initialArray: number[] = []) {
    this.array = initialArray.map(value => ({ value, state: 'default' as const }));
    this.left = 0;
    this.right = 0;
    this.mid = -1;
    this.foundIndex = -1;
    this.isComplete = false;
    this.steps = [];
    this.subscribers = [];
  }

  private notify(message?: string) {
    const state: BinarySearchState = {
      array: [...this.array],
      left: this.left,
      right: this.right,
      mid: this.mid,
      message,
      isComplete: this.isComplete,
      foundIndex: this.foundIndex
    };
    this.subscribers.forEach(subscriber => subscriber(state));
  }

  subscribe(subscriber: Subscriber) {
    this.subscribers.push(subscriber);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== subscriber);
    };
  }

  getState(): BinarySearchState {
    return {
      array: [...this.array],
      left: this.left,
      right: this.right,
      mid: this.mid,
      isComplete: this.isComplete,
      foundIndex: this.foundIndex
    };
  }

  getSteps(): BinarySearchStep[] {
    return this.steps;
  }

  setArray(arr: number[]) {
    this.array = arr.map(value => ({ value, state: 'default' as const }));
    this.left = 0;
    this.right = arr.length - 1;
    this.mid = -1;
    this.foundIndex = -1;
    this.isComplete = false;
    this.steps = [];
    this.notify('数组已更新');
  }

  generateSortedArray(size: number, min: number = 1, max: number = 100): number[] {
    const set = new Set<number>();
    while (set.size < size) {
      set.add(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    const sorted = Array.from(set).sort((a, b) => a - b);
    this.setArray(sorted);
    return sorted;
  }

  reset() {
    for (let i = 0; i < this.array.length; i++) {
      this.array[i].state = 'default';
    }
    this.left = 0;
    this.right = this.array.length - 1;
    this.mid = -1;
    this.foundIndex = -1;
    this.isComplete = false;
    this.steps = [];
    this.notify('已重置');
  }

  private recordStep(message: string, highlightLine: number, variables: Record<string, string | number> = {}) {
    this.steps.push({
      array: this.array.map(el => ({ ...el })),
      left: this.left,
      right: this.right,
      mid: this.mid,
      message,
      highlightLine,
      variables
    });
  }

  private resetElementStates() {
    for (let i = 0; i < this.array.length; i++) {
      if (this.array[i].state !== 'eliminated' && this.array[i].state !== 'found') {
        this.array[i].state = 'default';
      }
    }
  }

  binarySearch(target: number): BinarySearchStep[] {
    this.steps = [];
    this.foundIndex = -1;
    this.isComplete = false;
    for (let i = 0; i < this.array.length; i++) {
      this.array[i].state = 'default';
    }

    this.left = 0;
    this.right = this.array.length - 1;

    this.recordStep('开始二分查找', 0, { target });

    while (this.left <= this.right) {
      this.resetElementStates();

      for (let i = this.left; i <= this.right; i++) {
        this.array[i].state = 'searching';
      }

      this.mid = Math.floor((this.left + this.right) / 2);
      this.array[this.mid].state = 'mid';

      this.recordStep(
        `搜索范围 [${this.left}, ${this.right}]，中间位置 ${this.mid}，值为 ${this.array[this.mid].value}`,
        1,
        { left: this.left, right: this.right, mid: this.mid, [`arr[${this.mid}]`]: this.array[this.mid].value }
      );

      if (this.array[this.mid].value === target) {
        this.array[this.mid].state = 'found';
        this.foundIndex = this.mid;
        this.isComplete = true;

        for (let i = 0; i < this.array.length; i++) {
          if (i !== this.mid && this.array[i].state !== 'eliminated') {
            this.array[i].state = 'eliminated';
          }
        }

        this.recordStep(
          `找到目标 ${target}，位于索引 ${this.mid}`,
          2,
          { left: this.left, right: this.right, mid: this.mid, foundIndex: this.mid }
        );
        this.notify('二分查找完成，已找到目标');
        return this.steps;
      }

      if (this.array[this.mid].value < target) {
        this.recordStep(
          `${this.array[this.mid].value} < ${target}，排除左半部分`,
          3,
          { left: this.left, right: this.right, mid: this.mid, [`arr[${this.mid}]`]: this.array[this.mid].value }
        );

        for (let i = this.left; i <= this.mid; i++) {
          this.array[i].state = 'eliminated';
        }

        this.left = this.mid + 1;

        this.recordStep(
          `更新搜索范围为 [${this.left}, ${this.right}]`,
          4,
          { left: this.left, right: this.right }
        );
      } else {
        this.recordStep(
          `${this.array[this.mid].value} > ${target}，排除右半部分`,
          5,
          { left: this.left, right: this.right, mid: this.mid, [`arr[${this.mid}]`]: this.array[this.mid].value }
        );

        for (let i = this.mid; i <= this.right; i++) {
          this.array[i].state = 'eliminated';
        }

        this.right = this.mid - 1;

        this.recordStep(
          `更新搜索范围为 [${this.left}, ${this.right}]`,
          6,
          { left: this.left, right: this.right }
        );
      }
    }

    this.isComplete = true;
    this.foundIndex = -1;

    for (let i = 0; i < this.array.length; i++) {
      this.array[i].state = 'eliminated';
    }

    this.recordStep(
      `未找到目标 ${target}`,
      7,
      { target, left: this.left, right: this.right }
    );
    this.notify('二分查找完成，未找到目标');
    return this.steps;
  }
}
