export interface ArrayElement {
  value: number;
  state: 'default' | 'comparing' | 'sorted' | 'swapping' | 'pivot' | 'current' | 'subarray' | 'heap' | 'counting' | 'bucket' | 'radix';
}

export interface SortingStep {
  array: ArrayElement[];
  comparisons: number;
  swaps: number;
  message: string;
  highlightLine: number;
  variables: Record<string, string | number>;
}

interface SortingState {
  array: ArrayElement[];
  comparisons: number;
  swaps: number;
  message?: string;
}

export class SortingAlgorithm {
  private array: ArrayElement[];
  private listeners: ((state: SortingState) => void)[] = [];
  private comparisons: number = 0;
  private swaps: number = 0;
  private delay: number;
  private steps: SortingStep[] = [];
  private cancelled: boolean = false;

  constructor(initialArray: number[] = [], delay: number = 500) {
    this.array = initialArray.map(value => ({ value, state: 'default' }));
    this.delay = delay;
  }

  private notify(message?: string) {
    const state: SortingState = {
      array: [...this.array],
      comparisons: this.comparisons,
      swaps: this.swaps,
      message
    };
    this.listeners.forEach(listener => listener(state));
  }

  subscribe(listener: (state: SortingState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getState(): SortingState {
    return {
      array: [...this.array],
      comparisons: this.comparisons,
      swaps: this.swaps
    };
  }

  getSteps(): SortingStep[] {
    return this.steps;
  }

  setArray(newArray: number[]) {
    this.array = newArray.map(value => ({ value, state: 'default' }));
    this.comparisons = 0;
    this.swaps = 0;
    this.steps = [];
    this.notify('数组已更新');
  }

  private recordStep(message: string, highlightLine: number, variables: Record<string, string | number> = {}) {
    this.steps.push({
      array: this.array.map(el => ({ ...el })),
      comparisons: this.comparisons,
      swaps: this.swaps,
      message,
      highlightLine,
      variables
    });
  }

  private compare(i: number, j: number): boolean {
    this.comparisons++;
    this.array[i].state = 'comparing';
    this.array[j].state = 'comparing';
    const result = this.array[i].value > this.array[j].value;
    return result;
  }

  private swap(i: number, j: number) {
    this.swaps++;
    this.array[i].state = 'swapping';
    this.array[j].state = 'swapping';
    const temp = this.array[i];
    this.array[i] = this.array[j];
    this.array[j] = temp;
  }

  private resetStates() {
    for (let i = 0; i < this.array.length; i++) {
      if (this.array[i].state !== 'sorted') {
        this.array[i].state = 'default';
      }
    }
  }

  cancel() {
    this.cancelled = true;
  }

  generateBubbleSortSteps() {
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.cancelled = false;
    this.resetStates();
    const n = this.array.length;

    this.recordStep('开始冒泡排序', 0, { n });

    for (let i = 0; i < n - 1; i++) {
      if (this.cancelled) return;
      let swapped = false;
      this.recordStep(`第 ${i + 1} 轮冒泡开始`, 1, { i, swapped: String(swapped) });

      for (let j = 0; j < n - i - 1; j++) {
        if (this.cancelled) return;
        this.resetStates();
        const isGreater = this.compare(j, j + 1);
        this.recordStep(
          `比较 ${this.array[j].value} 和 ${this.array[j + 1].value}`,
          2,
          { i, j, [`arr[${j}]`]: this.array[j].value, [`arr[${j+1}]`]: this.array[j + 1].value }
        );

        if (isGreater) {
          this.swap(j, j + 1);
          swapped = true;
          this.recordStep(
            `交换 ${this.array[j].value} 和 ${this.array[j + 1].value}`,
            3,
            { i, j, swapped: String(swapped) }
          );
        }

        this.resetStates();
      }

      this.array[n - i - 1].state = 'sorted';
      this.recordStep(`第 ${i + 1} 轮冒泡完成`, 4, { i, swapped: String(swapped) });

      if (!swapped) {
        for (let k = 0; k < n - i - 1; k++) {
          this.array[k].state = 'sorted';
        }
        this.recordStep('数组已经有序，提前结束', 5, {});
        break;
      }
    }

    if (this.array.length > 0) {
      this.array[0].state = 'sorted';
    }
    this.recordStep('冒泡排序完成', 6, {});
    this.notify('冒泡排序步骤已生成');
  }

  generateSelectionSortSteps() {
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.cancelled = false;
    this.resetStates();
    const n = this.array.length;

    this.recordStep('开始选择排序', 0, { n });

    for (let i = 0; i < n - 1; i++) {
      if (this.cancelled) return;
      let minIndex = i;
      this.array[i].state = 'current';
      this.recordStep(`寻找第 ${i + 1} 个最小元素`, 1, { i, minIndex });

      for (let j = i + 1; j < n; j++) {
        if (this.cancelled) return;
        this.resetStates();
        this.array[i].state = 'current';
        this.array[j].state = 'comparing';
        this.comparisons++;
        this.recordStep(
          `比较 ${this.array[j].value} 和当前最小值 ${this.array[minIndex].value}`,
          2,
          { i, j, minIndex, [`arr[${j}]`]: this.array[j].value, [`arr[${minIndex}]`]: this.array[minIndex].value }
        );

        if (this.array[j].value < this.array[minIndex].value) {
          minIndex = j;
          this.recordStep(`更新最小值索引为 ${minIndex}`, 3, { i, j, minIndex });
        }
      }

      if (minIndex !== i) {
        this.swap(i, minIndex);
        this.recordStep(`交换位置 ${i} 和 ${minIndex}`, 4, { i, minIndex });
      }

      this.resetStates();
      this.array[i].state = 'sorted';
      this.recordStep(`第 ${i + 1} 个最小元素已放置`, 5, { i });
    }

    if (n > 0) this.array[n - 1].state = 'sorted';
    this.recordStep('选择排序完成', 6, {});
    this.notify('选择排序步骤已生成');
  }

  generateInsertionSortSteps() {
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.cancelled = false;
    this.resetStates();
    const n = this.array.length;

    this.recordStep('开始插入排序', 0, { n });
    if (n > 0) this.array[0].state = 'sorted';
    this.recordStep('第一个元素默认已排序', 1, {});

    for (let i = 1; i < n; i++) {
      if (this.cancelled) return;
      const current = this.array[i].value;
      this.array[i].state = 'current';
      this.recordStep(`当前处理元素: ${current}`, 2, { i, current, j: i - 1 });

      let j = i - 1;
      while (j >= 0 && this.array[j].value > current) {
        if (this.cancelled) return;
        this.comparisons++;
        this.array[j].state = 'comparing';
        this.recordStep(
          `比较 ${this.array[j].value} > ${current}，后移`,
          3,
          { i, current, j, [`arr[${j}]`]: this.array[j].value }
        );

        this.array[j + 1].value = this.array[j].value;
        this.swaps++;
        this.array[j].state = 'sorted';
        j--;
      }
      if (j >= 0) this.comparisons++;

      this.array[j + 1].value = current;
      this.array[j + 1].state = 'sorted';
      for (let k = 0; k <= i; k++) this.array[k].state = 'sorted';
      this.recordStep(`元素 ${current} 插入到位置 ${j + 1}`, 4, { i, current, insertPos: j + 1 });
    }

    this.recordStep('插入排序完成', 5, {});
    this.notify('插入排序步骤已生成');
  }

  generateQuickSortSteps() {
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.cancelled = false;
    this.resetStates();

    this.recordStep('开始快速排序', 0, {});
    this.quickSortHelper(0, this.array.length - 1);
    if (!this.cancelled) {
      for (let i = 0; i < this.array.length; i++) this.array[i].state = 'sorted';
      this.recordStep('快速排序完成', 6, {});
    }
    this.notify('快速排序步骤已生成');
  }

  private quickSortHelper(start: number, end: number) {
    if (this.cancelled || start >= end) return;
    const pivotIndex = this.partition(start, end);
    if (this.cancelled) return;
    this.quickSortHelper(start, pivotIndex - 1);
    this.quickSortHelper(pivotIndex + 1, end);
  }

  private partition(start: number, end: number): number {
    const pivotValue = this.array[end].value;
    this.array[end].state = 'pivot';
    this.recordStep(`选择基准元素: ${pivotValue}`, 1, { pivot: pivotValue, start, end });

    let i = start - 1;
    for (let j = start; j < end; j++) {
      if (this.cancelled) return start;
      this.resetStates();
      this.array[end].state = 'pivot';
      this.array[j].state = 'comparing';
      this.comparisons++;
      this.recordStep(
        `比较 ${this.array[j].value} 与基准 ${pivotValue}`,
        2,
        { pivot: pivotValue, i, j, [`arr[${j}]`]: this.array[j].value }
      );

      if (this.array[j].value < pivotValue) {
        i++;
        if (i !== j) {
          this.swap(i, j);
          this.recordStep(`交换 ${this.array[i].value} 和 ${this.array[j].value}`, 3, { i, j });
        }
      }
      this.resetStates();
      this.array[end].state = 'pivot';
    }

    const pivotPosition = i + 1;
    if (pivotPosition !== end) {
      this.swap(pivotPosition, end);
      this.recordStep(`基准 ${pivotValue} 放到位置 ${pivotPosition}`, 4, { pivotPosition });
    }
    this.array[pivotPosition].state = 'sorted';
    this.recordStep(`基准 ${pivotValue} 已就位`, 5, { pivotPosition });

    return pivotPosition;
  }

  generateMergeSortSteps() {
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.cancelled = false;
    this.resetStates();

    this.recordStep('开始归并排序', 0, {});
    this.mergeSortHelper(0, this.array.length - 1);
    if (!this.cancelled) {
      for (let i = 0; i < this.array.length; i++) this.array[i].state = 'sorted';
      this.recordStep('归并排序完成', 6, {});
    }
    this.notify('归并排序步骤已生成');
  }

  private mergeSortHelper(left: number, right: number) {
    if (this.cancelled || left >= right) return;
    const mid = Math.floor((left + right) / 2);

    for (let i = left; i <= right; i++) this.array[i].state = 'subarray';
    this.recordStep(`划分区间 [${left}, ${right}]，中点 ${mid}`, 1, { left, mid, right });

    this.mergeSortHelper(left, mid);
    this.mergeSortHelper(mid + 1, right);
    this.merge(left, mid, right);
  }

  private merge(left: number, mid: number, right: number) {
    if (this.cancelled) return;
    const n1 = mid - left + 1;
    const n2 = right - mid;
    const L: number[] = [];
    const R: number[] = [];

    for (let i = 0; i < n1; i++) { L[i] = this.array[left + i].value; this.array[left + i].state = 'current'; }
    for (let j = 0; j < n2; j++) { R[j] = this.array[mid + 1 + j].value; this.array[mid + 1 + j].state = 'comparing'; }

    this.recordStep(`合并 [${left},${mid}] 和 [${mid + 1},${right}]`, 2, { left, mid, right });

    let i = 0, j = 0, k = left;
    while (i < n1 && j < n2) {
      if (this.cancelled) return;
      this.comparisons++;
      if (L[i] <= R[j]) {
        this.array[k].value = L[i]; i++;
      } else {
        this.array[k].value = R[j]; j++;
      }
      this.array[k].state = 'sorted';
      this.swaps++;
      this.recordStep(`放置 ${this.array[k].value} 到位置 ${k}`, 3, { k, i, j });
      k++;
    }
    while (i < n1) { this.array[k].value = L[i]; this.array[k].state = 'sorted'; i++; k++; this.swaps++; this.recordStep(`放置剩余 ${this.array[k-1].value}`, 3, { k: k-1 }); }
    while (j < n2) { this.array[k].value = R[j]; this.array[k].state = 'sorted'; j++; k++; this.swaps++; this.recordStep(`放置剩余 ${this.array[k-1].value}`, 3, { k: k-1 }); }

    for (let x = left; x <= right; x++) {
      if (this.array[x].state !== 'sorted') this.array[x].state = 'default';
    }
  }

  generateShellSortSteps() {
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.cancelled = false;
    this.resetStates();
    const n = this.array.length;

    this.recordStep('开始希尔排序', 0, { n });

    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
      if (this.cancelled) return;
      this.recordStep(`当前间隔: ${gap}`, 1, { gap });

      for (let i = gap; i < n; i++) {
        if (this.cancelled) return;
        const temp = this.array[i].value;
        this.array[i].state = 'current';
        let j = i;

        for (let k = i % gap; k < n; k += gap) {
          if (k !== i) this.array[k].state = 'subarray';
        }
        this.recordStep(`间隔 ${gap}，处理元素 ${temp}`, 2, { gap, i, temp });

        while (j >= gap && this.array[j - gap].value > temp) {
          if (this.cancelled) return;
          this.comparisons++;
          this.array[j - gap].state = 'comparing';
          this.recordStep(`比较 ${this.array[j - gap].value} > ${temp}`, 3, { gap, j, temp });

          this.array[j].value = this.array[j - gap].value;
          this.array[j - gap].state = 'default';
          this.swaps++;
          j -= gap;
        }
        if (j >= gap) this.comparisons++;

        this.array[j].value = temp;
        for (let k = i % gap; k < n; k += gap) {
          if (this.array[k].state === 'subarray') this.array[k].state = 'default';
        }
        this.recordStep(`元素 ${temp} 插入到间隔位置 ${j}`, 4, { gap, i, j, temp });
        this.resetStates();
      }
    }

    for (let i = 0; i < n; i++) this.array[i].state = 'sorted';
    this.recordStep('希尔排序完成', 5, {});
    this.notify('希尔排序步骤已生成');
  }

  generateHeapSortSteps() {
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.cancelled = false;
    this.resetStates();
    const n = this.array.length;

    this.recordStep('开始堆排序', 0, { n });
    this.recordStep('构建最大堆', 1, {});

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      if (this.cancelled) return;
      this.heapifySteps(n, i);
    }
    this.recordStep('最大堆构建完成', 2, {});

    for (let i = n - 1; i > 0; i--) {
      if (this.cancelled) return;
      this.array[0].state = 'current';
      this.array[i].state = 'comparing';
      this.recordStep(`将堆顶 ${this.array[0].value} 移到位置 ${i}`, 3, { i });

      this.swap(0, i);
      this.array[i].state = 'sorted';
      this.recordStep(`交换完成，调整堆`, 4, { i });

      this.heapifySteps(i, 0);
    }

    if (n > 0) this.array[0].state = 'sorted';
    this.recordStep('堆排序完成', 5, {});
    this.notify('堆排序步骤已生成');
  }

  private heapifySteps(n: number, i: number) {
    if (this.cancelled) return;
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    this.array[i].state = 'current';
    this.recordStep(`调整节点 ${this.array[i].value}`, 6, { i, largest, left, right });

    if (left < n) {
      this.comparisons++;
      this.array[left].state = 'heap';
      if (this.array[left].value > this.array[largest].value) largest = left;
    }
    if (right < n) {
      this.comparisons++;
      this.array[right].state = 'heap';
      if (this.array[right].value > this.array[largest].value) largest = right;
    }

    if (largest !== i) {
      this.swap(i, largest);
      this.recordStep(`交换 ${this.array[i].value} 和 ${this.array[largest].value}`, 7, { i, largest });
      this.resetStates();
      this.heapifySteps(n, largest);
    } else {
      this.array[i].state = 'heap';
    }
  }

  generateCountingSortSteps() {
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.cancelled = false;
    this.resetStates();
    const n = this.array.length;
    if (n <= 1) { if (n === 1) this.array[0].state = 'sorted'; return; }

    let max = this.array[0].value, min = this.array[0].value;
    for (let i = 1; i < n; i++) {
      if (this.array[i].value > max) max = this.array[i].value;
      if (this.array[i].value < min) min = this.array[i].value;
    }
    this.recordStep(`找到范围: [${min}, ${max}]`, 0, { min, max });

    const range = max - min + 1;
    const count = new Array(range).fill(0);
    for (let i = 0; i < n; i++) {
      count[this.array[i].value - min]++;
      this.array[i].state = 'counting';
      this.recordStep(`统计 ${this.array[i].value} 出现次数`, 1, { [`count[${this.array[i].value - min}]`]: count[this.array[i].value - min] });
    }

    for (let i = 1; i < range; i++) count[i] += count[i - 1];
    this.recordStep('计算累加和', 2, {});

    const output = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      const value = this.array[i].value;
      const index = count[value - min] - 1;
      output[index] = { value, state: 'default' as const };
      count[value - min]--;
      this.swaps++;
      this.recordStep(`放置 ${value} 到位置 ${index}`, 3, { value, index });
    }

    for (let i = 0; i < n; i++) {
      this.array[i].value = output[i].value;
      this.array[i].state = 'sorted';
    }
    this.recordStep('计数排序完成', 4, {});
    this.notify('计数排序步骤已生成');
  }

  generateBucketSortSteps() {
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.cancelled = false;
    this.resetStates();
    const n = this.array.length;
    const bucketSize = 5;
    if (n <= 1) { if (n === 1) this.array[0].state = 'sorted'; return; }

    let max = this.array[0].value, min = this.array[0].value;
    for (let i = 1; i < n; i++) {
      if (this.array[i].value > max) max = this.array[i].value;
      if (this.array[i].value < min) min = this.array[i].value;
    }
    this.recordStep(`范围: [${min}, ${max}]`, 0, { min, max });

    const bucketCount = Math.floor((max - min) / bucketSize) + 1;
    const buckets: number[][] = Array.from({ length: bucketCount }, () => []);

    for (let i = 0; i < n; i++) {
      const bucketIndex = Math.floor((this.array[i].value - min) / bucketSize);
      buckets[bucketIndex].push(this.array[i].value);
      this.array[i].state = 'bucket';
      this.recordStep(`${this.array[i].value} 放入桶 ${bucketIndex}`, 1, { bucketIndex });
    }

    let currentIndex = 0;
    for (let i = 0; i < bucketCount; i++) {
      buckets[i].sort((a, b) => { this.comparisons++; return a - b; });
      for (const value of buckets[i]) {
        this.array[currentIndex].value = value;
        this.array[currentIndex].state = 'sorted';
        this.swaps++;
        currentIndex++;
        this.recordStep(`桶 ${i} 元素 ${value} 放回位置 ${currentIndex - 1}`, 2, { bucket: i });
      }
    }
    this.recordStep('桶排序完成', 3, {});
    this.notify('桶排序步骤已生成');
  }

  generateRadixSortSteps() {
    this.steps = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.cancelled = false;
    this.resetStates();
    const n = this.array.length;
    if (n <= 1) { if (n === 1) this.array[0].state = 'sorted'; return; }

    let max = this.array[0].value;
    for (let i = 1; i < n; i++) if (this.array[i].value > max) max = this.array[i].value;
    this.recordStep(`最大值: ${max}`, 0, { max });

    let exp = 1;
    let digitPos = 1;
    while (Math.floor(max / exp) > 0) {
      if (this.cancelled) return;
      this.recordStep(`处理第 ${digitPos} 位`, 1, { exp, digitPos });
      this.countingSortByDigitSteps(exp);
      exp *= 10;
      digitPos++;
      if (max < exp) break;
    }

    for (let i = 0; i < n; i++) this.array[i].state = 'sorted';
    this.recordStep('基数排序完成', 4, {});
    this.notify('基数排序步骤已生成');
  }

  private countingSortByDigitSteps(exp: number) {
    const n = this.array.length;
    const count = new Array(10).fill(0);
    const output: ArrayElement[] = new Array(n);

    for (let i = 0; i < n; i++) {
      const digit = Math.floor(this.array[i].value / exp) % 10;
      count[digit]++;
      this.array[i].state = 'radix';
      this.recordStep(`元素 ${this.array[i].value} 当前位: ${digit}`, 2, { [`digit`]: digit });
    }

    for (let i = 1; i < 10; i++) count[i] += count[i - 1];

    for (let i = n - 1; i >= 0; i--) {
      const digit = Math.floor(this.array[i].value / exp) % 10;
      const index = count[digit] - 1;
      output[index] = { value: this.array[i].value, state: 'default' };
      count[digit]--;
      this.swaps++;
      this.recordStep(`${this.array[i].value} 放到位置 ${index}`, 3, { digit, index });
    }

    for (let i = 0; i < n; i++) {
      this.array[i].value = output[i].value;
      this.array[i].state = 'default';
    }
  }

  generateRandomArray(size: number, min: number = 1, max: number = 100) {
    const newArray = Array.from({ length: size }, () =>
      Math.floor(Math.random() * (max - min + 1)) + min
    );
    this.setArray(newArray);
    return newArray;
  }

  setDelay(ms: number) {
    this.delay = ms;
  }

  async bubbleSort() {
    this.generateBubbleSortSteps();
  }

  async selectionSort() {
    this.generateSelectionSortSteps();
  }

  async quickSort() {
    this.generateQuickSortSteps();
  }

  async insertionSort() {
    this.generateInsertionSortSteps();
  }

  async shellSort() {
    this.generateShellSortSteps();
  }

  async heapSort() {
    this.generateHeapSortSteps();
  }

  async mergeSort() {
    this.generateMergeSortSteps();
  }

  async countingSort() {
    this.generateCountingSortSteps();
  }

  async bucketSort() {
    this.generateBucketSortSteps();
  }

  async radixSort() {
    this.generateRadixSortSteps();
  }
}
