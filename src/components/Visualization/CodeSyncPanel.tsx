import React from 'react';

interface CodeLine {
  text: string;
  indent: number;
}

interface CodeSyncPanelProps {
  title: string;
  codeLines: CodeLine[];
  highlightLine: number;
}

const CodeSyncPanel: React.FC<CodeSyncPanelProps> = ({ title, codeLines, highlightLine }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-gray-800 text-gray-200 px-4 py-2 text-sm font-medium">
        {title}
      </div>
      <div className="p-0 font-mono text-sm overflow-auto max-h-96">
        {codeLines.map((line, index) => (
          <div
            key={index}
            className={`flex transition-colors duration-200 ${
              index === highlightLine
                ? 'bg-yellow-200 border-l-2 border-yellow-500'
                : 'bg-white border-l-2 border-transparent hover:bg-gray-50'
            }`}
          >
            <span className="w-8 flex-shrink-0 text-right pr-2 text-gray-400 select-none text-xs leading-7">
              {index + 1}
            </span>
            <span className="pl-2 leading-7 whitespace-pre" style={{ paddingLeft: `${line.indent * 16 + 8}px` }}>
              {line.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SORTING_PSEUDOCODE: Record<string, { title: string; lines: { text: string; indent: number }[] }> = {
  bubble: {
    title: '冒泡排序 伪代码',
    lines: [
      { text: 'function bubbleSort(arr):', indent: 0 },
      { text: 'n = arr.length', indent: 1 },
      { text: 'for i = 0 to n-2:', indent: 1 },
      { text: 'swapped = false', indent: 2 },
      { text: 'for j = 0 to n-i-2:', indent: 2 },
      { text: 'if arr[j] > arr[j+1]:', indent: 3 },
      { text: 'swap(arr[j], arr[j+1])', indent: 4 },
      { text: 'swapped = true', indent: 4 },
      { text: 'if not swapped: break', indent: 2 },
      { text: 'return arr', indent: 1 },
    ]
  },
  selection: {
    title: '选择排序 伪代码',
    lines: [
      { text: 'function selectionSort(arr):', indent: 0 },
      { text: 'n = arr.length', indent: 1 },
      { text: 'for i = 0 to n-2:', indent: 1 },
      { text: 'minIndex = i', indent: 2 },
      { text: 'for j = i+1 to n-1:', indent: 2 },
      { text: 'if arr[j] < arr[minIndex]:', indent: 3 },
      { text: 'minIndex = j', indent: 4 },
      { text: 'swap(arr[i], arr[minIndex])', indent: 2 },
      { text: 'return arr', indent: 1 },
    ]
  },
  insertion: {
    title: '插入排序 伪代码',
    lines: [
      { text: 'function insertionSort(arr):', indent: 0 },
      { text: 'arr[0] 已排序', indent: 1 },
      { text: 'for i = 1 to n-1:', indent: 1 },
      { text: 'current = arr[i]', indent: 2 },
      { text: 'j = i - 1', indent: 2 },
      { text: 'while j >= 0 and arr[j] > current:', indent: 2 },
      { text: 'arr[j+1] = arr[j]', indent: 3 },
      { text: 'j = j - 1', indent: 3 },
      { text: 'arr[j+1] = current', indent: 2 },
      { text: 'return arr', indent: 1 },
    ]
  },
  quick: {
    title: '快速排序 伪代码',
    lines: [
      { text: 'function quickSort(arr, start, end):', indent: 0 },
      { text: 'if start >= end: return', indent: 1 },
      { text: 'pivot = arr[end]', indent: 1 },
      { text: 'i = start - 1', indent: 1 },
      { text: 'for j = start to end-1:', indent: 1 },
      { text: 'if arr[j] < pivot:', indent: 2 },
      { text: 'i++; swap(arr[i], arr[j])', indent: 3 },
      { text: 'swap(arr[i+1], arr[end])', indent: 1 },
      { text: 'quickSort(arr, start, i)', indent: 1 },
      { text: 'quickSort(arr, i+2, end)', indent: 1 },
    ]
  },
  merge: {
    title: '归并排序 伪代码',
    lines: [
      { text: 'function mergeSort(arr, left, right):', indent: 0 },
      { text: 'if left >= right: return', indent: 1 },
      { text: 'mid = (left + right) / 2', indent: 1 },
      { text: 'mergeSort(arr, left, mid)', indent: 1 },
      { text: 'mergeSort(arr, mid+1, right)', indent: 1 },
      { text: 'merge(arr, left, mid, right)', indent: 1 },
      { text: 'function merge:', indent: 1 },
      { text: '比较左右子数组元素', indent: 2 },
      { text: '按序放回原数组', indent: 2 },
    ]
  },
  shell: {
    title: '希尔排序 伪代码',
    lines: [
      { text: 'function shellSort(arr):', indent: 0 },
      { text: 'gap = n / 2', indent: 1 },
      { text: 'while gap > 0:', indent: 1 },
      { text: 'for i = gap to n-1:', indent: 2 },
      { text: 'temp = arr[i]', indent: 3 },
      { text: 'while j >= gap and arr[j-gap] > temp:', indent: 3 },
      { text: 'arr[j] = arr[j-gap]', indent: 4 },
      { text: 'j -= gap', indent: 4 },
      { text: 'arr[j] = temp', indent: 3 },
      { text: 'gap = gap / 2', indent: 2 },
    ]
  },
  heap: {
    title: '堆排序 伪代码',
    lines: [
      { text: 'function heapSort(arr):', indent: 0 },
      { text: '构建最大堆', indent: 1 },
      { text: 'for i = n/2-1 downto 0:', indent: 1 },
      { text: 'heapify(arr, n, i)', indent: 2 },
      { text: 'for i = n-1 downto 1:', indent: 1 },
      { text: 'swap(arr[0], arr[i])', indent: 2 },
      { text: 'heapify(arr, i, 0)', indent: 2 },
      { text: 'function heapify(n, i):', indent: 1 },
      { text: '找到最大子节点并交换', indent: 2 },
    ]
  },
  counting: {
    title: '计数排序 伪代码',
    lines: [
      { text: 'function countingSort(arr):', indent: 0 },
      { text: '找到范围 [min, max]', indent: 1 },
      { text: '统计每个元素出现次数', indent: 1 },
      { text: '计算累加和', indent: 1 },
      { text: '从后向前放置元素', indent: 1 },
      { text: 'return sorted arr', indent: 1 },
    ]
  },
  bucket: {
    title: '桶排序 伪代码',
    lines: [
      { text: 'function bucketSort(arr):', indent: 0 },
      { text: '找到范围 [min, max]', indent: 1 },
      { text: '将元素分配到桶中', indent: 1 },
      { text: '对每个桶进行排序', indent: 1 },
      { text: '合并所有桶', indent: 1 },
      { text: 'return sorted arr', indent: 1 },
    ]
  },
  radix: {
    title: '基数排序 伪代码',
    lines: [
      { text: 'function radixSort(arr):', indent: 0 },
      { text: '找到最大值 max', indent: 1 },
      { text: 'for each digit position:', indent: 1 },
      { text: '按当前位进行计数排序', indent: 2 },
      { text: '统计当前位数字出现次数', indent: 3 },
      { text: '放置元素到正确位置', indent: 3 },
      { text: 'return sorted arr', indent: 1 },
    ]
  }
};

export default CodeSyncPanel;
