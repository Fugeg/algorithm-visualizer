/**
 * @file CodeSyncPanel.tsx
 * @description 代码同步面板组件 - 算法可视化管线的"代码视图"层
 *
 * 【管线位置】Model → Controller → View（本组件）
 * - 上游：接收 PlaybackController 传递的当前执行行号（highlightLine）
 * - 本层：渲染伪代码/源代码，并根据当前步骤高亮对应代码行
 * - 下游：通过视觉高亮引导用户理解算法当前执行的逻辑位置
 *
 * 【核心职责】
 * 1. 以类 IDE 的方式展示算法伪代码（带行号和缩进）
 * 2. 根据播放进度动态高亮当前正在执行的代码行（黄色背景 + 左侧边框）
 * 3. 内置 10 种常见排序算法的伪代码模板，支持快速切换
 *
 * 【与 PlaybackController 的协作】
 * - PlaybackController 在每步推进时更新 highlightLine 属性
 * - 本组件接收 highlightLine 后立即重新渲染高亮状态
 * - 高亮切换使用 CSS transition 实现平滑过渡效果（200ms）
 *
 * 【设计理念】
 * - 采用"代码-可视化"双栏同步的设计模式
 * - 用户在观察数据变化的同时，能看到对应的代码逻辑
 * - 这种同步展示显著降低了算法学习的认知负担
 */

import React from 'react';

/**
 * 单行代码的数据结构接口
 * @property {string} text - 该行的代码文本内容（不含前导空格）
 * @property {number} indent - 缩进层级（0 = 无缩进，1 = 一层缩进，以此类推），
 *   用于控制显示时的左侧空白宽度（每级缩进 = 16px）
 */
interface CodeLine {
  text: string;
  indent: number;
}

/**
 * CodeSyncPanel 组件属性接口
 * @property {string} title - 面板标题，通常显示算法名称（如"冒泡排序 伪代码"）
 * @property {CodeLine[]} codeLines - 代码行数组，每行包含文本内容和缩进信息
 * @property {number} highlightLine - 当前需要高亮的行索引（从 0 开始），
 *   值为 -1 或超出范围时不高亮任何行
 */
interface CodeSyncPanelProps {
  title: string;
  codeLines: CodeLine[];
  highlightLine: number;
}

/**
 * 代码同步面板组件 - 带行号和高亮功能的伪代码显示器
 *
 * 【渲染策略】
 * - 使用等宽字体（font-mono）模拟代码编辑器的外观
 * - 每行左侧显示行号（固定 8 宽度，右对齐，灰色显示）
 * - 行内容根据 indent 属性动态计算左内边距（indent × 16px + 8px 基础间距）
 * - 高亮行使用黄色背景（bg-yellow-200）+ 黄色左边框（border-yellow-500）
 *
 * 【高亮机制】
 * - 遍历 codeLines 数组，对比每行 index 与 highlightLine
 * - 匹配时应用高亮样式类名
 * - 未匹配行使用默认样式，hover 时显示浅灰背景
 * - 使用 CSS transition-colors duration-200 实现颜色渐变动画
 *
 * 【性能优化】
 * - 设置 max-h-96 限制最大高度，超长代码可滚动查看
 * - 使用 overflow-auto 启用滚动条
 * - 行号设置 select-none 防止意外选中
 *
 * @param props - 组件属性
 * @returns {JSX.Element} 代码同步面板 DOM 元素
 */
const CodeSyncPanel: React.FC<CodeSyncPanelProps> = ({ title, codeLines, highlightLine }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* 
       * 面板标题栏 - 深色背景（bg-gray-800）+ 浅色文字
       * 模拟代码编辑器的标签页或标题区域
       */}
      <div className="bg-gray-800 text-gray-200 px-4 py-2 text-sm font-medium">
        {title}
      </div>
      
      {/* 
       * 代码内容区域 - 等宽字体、可滚动、最大高度限制
       * 
       * 【布局结构】每行代码分为两部分：
       * 1. 行号区：固定宽度（w-8），右对齐，不可选中
       * 2. 代码区：根据缩进级别动态调整左边距
       */}
      <div className="p-0 font-mono text-sm overflow-auto max-h-96">
        {/* 
         * 遍历代码行数组生成每一行的 DOM 元素
         * 每行根据是否匹配 highlightLine 应用不同的样式
         */}
        {codeLines.map((line, index) => (
          <div
            key={index}
            className={`flex transition-colors duration-200 ${
              index === highlightLine
                ? 'bg-yellow-200 border-l-2 border-yellow-500'   // 高亮状态：黄色背景 + 左侧色条
                : 'bg-white border-l-2 border-transparent hover:bg-gray-50'  // 默认状态：透明边框 + hover 效果
            }`}
          >
            {/* 
             * 行号显示区
             * - 固定宽度 w-8（32px），确保多行行号对齐
             * - 右对齐（text-right），右侧留出 pr-2 间距
             * - 灰色小字（text-gray-400），使用 select-none 防止拖选
             * - 行号从 1 开始显示（index + 1）
             */}
            <span className="w-8 flex-shrink-0 text-right pr-2 text-gray-400 select-none text-xs leading-7">
              {index + 1}
            </span>
            
            {/* 
             * 代码文本显示区
             * - 动态左内边距：基础 8px + 缩进层级 × 16px
             * - 使用 whitespace-pre 保留原始空格格式
             * - leading-7（28px 行高）与行号区对齐
             */}
            <span className="pl-2 leading-7 whitespace-pre" style={{ paddingLeft: `${line.indent * 16 + 8}px` }}>
              {line.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 排序算法伪代码库 - 内置的常用排序算法伪代码模板集合
 *
 * 【设计目的】
 * - 提供开箱即用的算法伪代码，无需外部配置
 * - 支持快速切换不同算法进行对比学习
 * - 统一的代码格式规范（text + indent 结构）
 *
 * 【使用方式】
 * ```tsx
 * import { SORTING_PSEUDOCODE } from './CodeSyncPanel';
 * 
 * const bubbleCode = SORTING_PSEUDOCODE.bubble;
 * <CodeSyncPanel title={bubbleCode.title} codeLines={bubbleCode.lines} highlightLine={currentLine} />
 * ```
 *
 * 【覆盖算法列表】
 * 1. bubble - 冒泡排序（Bubble Sort）：O(n²) 稳定排序，适合小规模数据
 * 2. selection - 选择排序（Selection Sort）：O(n²) 不稳定排序，交换次数少
 * 3. insertion - 插入排序（Insertion Sort）：O(n²) 稳定排序，近乎有序时高效
 * 4. quick - 快速排序（Quick Sort）：O(n log n) 平均情况，分治策略
 * 5. merge - 归并排序（Merge Sort）：O(n log n) 稳定排序，额外空间 O(n)
 * 6. shell - 希尔排序（Shell Sort）：插入排序的改进版，使用增量序列
 * 7. heap - 堆排序（Heap Sort）：O(n log n) 不稳定排序，原地排序
 * 8. counting - 计数排序（Counting Sort）：O(n+k) 线性排序，适用于整数范围有限
 * 9. bucket - 桶排序（Bucket Sort）：O(n+k) 分布式排序，均匀分布时最优
 * 10. radix - 基数排序（Radix Sort）：O(d×n) 按位排序，不比较元素大小
 */
export const SORTING_PSEUDOCODE: Record<string, { title: string; lines: { text: string; indent: number }[] }> = {
  /**
   * 冒泡排序伪代码
   * 【算法特点】
   * - 通过相邻元素比较和交换，将最大值逐步"冒泡"到数组末尾
   * - 外层循环控制遍历轮数，内层循环执行相邻比较
   * - swapped 标志位优化：若某轮无交换则提前终止（已有序）
   */
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
  
  /**
   * 选择排序伪代码
   * 【算法特点】
   * - 每轮从未排序部分选择最小元素，放到已排序部分末尾
   * - 交换次数固定为 n-1 次（少于冒泡排序）
   * - 不稳定排序：可能改变相同元素的相对顺序
   */
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
  
  /**
   * 插入排序伪代码
   * 【算法特点】
   * - 类似整理扑克牌：将新元素插入到已排序序列的正确位置
   * - 对于近乎有序的数组，时间复杂度接近 O(n)
   * - 稳定排序，适合小规模数据和基本有序的场景
   */
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
  
  /**
   * 快速排序伪代码
   * 【算法特点】
   * - 分治法典型应用：选择基准值（pivot）分区递归排序
   * - 平均时间复杂度 O(n log n)，是最快的通用排序算法之一
   * - 不稳定排序，最坏情况退化为 O(n²)（已排序数组）
   */
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
  
  /**
   * 归并排序伪代码
   * 【算法特点】
   * - 分治法：递归分割成子数组，再合并有序子数组
   * - 时间复杂度稳定为 O(n log n)，不受输入数据影响
   * - 稳定排序，但需要 O(n) 额外空间
   */
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
  
  /**
   * 希尔排序伪代码
   * 【算法特点】
   * - 插入排序的高效改进版：先远距离比较，逐渐缩小间隔
   * - 间隔序列（gap sequence）的选择影响性能
   * - 时间复杂度取决于增量序列，介于 O(n log n) 和 O(n²) 之间
   */
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
  
  /**
   * 堆排序伪代码
   * 【算法特点】
   * - 利用堆数据结构（完全二叉树）进行选择
   * - 分两阶段：构建最大堆 + 逐个提取堆顶元素
   * - 原地排序（O(1) 额外空间），不稳定排序
   */
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
  
  /**
   * 计数排序伪代码
   * 【算法特点】
   * - 非比较型排序：统计每个值的出现次数
   * - 时间复杂度 O(n + k)，k 为数据范围大小
   * - 适用于整数范围有限的场景（如年龄、成绩）
   */
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
  
  /**
   * 桶排序伪代码
   * 【算法特点】
   * - 分布式排序：将元素分配到多个桶中，分别排序后合并
   * - 时间复杂度 O(n + k)，当数据均匀分布时效率最高
   * - 适用于浮点数或范围已知且分布均匀的数据
   */
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
  
  /**
   * 基数排序伪代码
   * 【算法特点】
   * - 按位数（个位、十位、百位...）逐位进行计数排序
   * - 时间复杂度 O(d × n)，d 为最大数的位数
   * - 不比较元素之间的大小关系，适用于整数或字符串
   */
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