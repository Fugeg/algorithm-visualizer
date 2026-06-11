/**
 * @file types.ts
 * @description 全局类型定义文件 - 定义项目中使用的核心数据结构和接口
 * 
 * 该文件是项目的类型系统基础，主要包含：
 * - 算法特性展示相关的数据结构
 * - 算法复杂度分析的数据模型
 * 
 * 这些类型定义被多个组件和服务引用，
 * 是保证整个应用类型安全和数据一致性的关键文件。
 * 
 * @module types
 */

/**
 * 算法/数据结构特性展示接口
 * 
 * 用于在UI中展示某个算法或数据结构的特性和功能点。
 * 典型使用场景：
 * - 首页的特性卡片展示
 * - 算法详情页的功能列表
 * - 数据结构页面的特点说明
 * 
 * @interface Feature
 */
export interface Feature {
  /** 特性标题，如"时间复杂度"、"空间优化"等 */
  title: string;
  /** 该特性下的具体条目列表，用于详细描述 */
  items: string[];
}

/**
 * 单个操作的复杂度分析接口
 * 
 * 描述算法在执行特定操作时的性能特征，
 * 用于构建完整的复杂度分析报告。
 * 
 * @interface ComplexityAnalysis
 */
export interface ComplexityAnalysis {
  /** 操作名称，如"查找"、"插入"、"删除"、"遍历"等 */
  operation: string;
  /** 时间复杂度表示，如"O(1)"、"O(n)"、"O(log n)"、"O(n²)"等 */
  timeComplexity: string;
  /** 空间复杂度表示，如"O(1)"、"O(n)"等 */
  spaceComplexity: string;
  /** 对该操作复杂度的文字说明和场景描述 */
  description: string;
}

/**
 * 完整的复杂度分析报告接口
 * 
 * 封装了算法或数据结构的全面复杂度信息，
 * 包括各操作的详细分析和整体总结。
 * 
 * 使用示例（二分查找）：
 * ```typescript
 * const binarySearchComplexity: Complexity = {
 *   title: '二分查找',
 *   items: [
 *     { operation: '查找', timeComplexity: 'O(log n)', spaceComplexity: 'O(1)', description: '...' }
 *   ],
 *   summary: {
 *     bestCase: 'O(1)',
 *     averageCase: 'O(log n)',
 *     worstCase: 'O(log n)',
 *     spaceComplexity: 'O(1)'
 *   }
 * };
 * ```
 * 
 * @interface Complexity
 */
export interface Complexity {
  /** 算法或数据结构名称，如"数组"、"二叉树"、"快速排序"等 */
  title: string;
  /** 各个操作的详细复杂度分析列表 */
  items: ComplexityAnalysis[];
  /**
   * 复杂度总结 - 提供三种情况的整体概览
   * 方便用户快速了解算法的性能特征
   */
  summary: {
    /** 最佳情况时间复杂度，如目标元素正好在中间位置 */
    bestCase: string;
    /** 平均情况时间复杂度，基于概率分布的期望值 */
    averageCase: string;
    /** 最坏情况时间复杂度，算法性能的下界保证 */
    worstCase: string;
    /** 整体空间复杂度，算法运行所需的额外空间 */
    spaceComplexity: string;
  };
}
