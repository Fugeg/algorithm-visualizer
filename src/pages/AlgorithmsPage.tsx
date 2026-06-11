/**
 * @file 算法详情页面组件（完整版）
 * @description 算法可视化平台的核心页面，提供完整的算法浏览和学习体验
 * @route 路由位置: /algorithms (父路由)
 *
 * @功能特性:
 * ✅ 左侧分类导航栏（按算法类型分组展示）
 * ✅ 右侧内容区域（默认欢迎页 或 具体算法可视化）
 * ✅ 21种常用算法的完整支持
 * ✅ 响应式布局设计
 * ✅ 当前选中状态高亮显示
 *
 * @支持的算法分类（共7大类）:
 * 1. **排序算法** (10种): 冒泡、选择、插入、希尔、堆、归并、计数、桶、基数、快速排序
 * 2. **递归算法** (2种): 斐波那契数列、汉诺塔
 * 3. **回溯算法** (2种): 全排列、N皇后问题
 * 4. **贪心算法** (2种): 找零钱问题、活动选择问题
 * 5. **动态规划** (3种): 最长递增子序列、0/1背包问题、编辑距离
 * 6. **搜索算法** (1种): 二分查找
 * 7. **树结构** (1种): AVL树
 *
 * @页面结构:
 * ┌──────────────────────────────────────────────────┐
 * │  左侧导航栏（256px）│  右侧内容区（flex-1）       │
 * │  - 分类标题          │  ├─ 默认页: 算法卡片网格   │
 * │  - 算法列表项        │  └─ 详情页: 可视化组件    │
 * └──────────────────────────────────────────────────┘
 */

import React from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';

/* ===== 算法可视化组件导入 ===== */
// 排序算法组件
import BubbleSort from '../components/Algorithms/BubbleSort';
import SelectionSort from '../components/Algorithms/SelectionSort';
import QuickSort from '../components/Algorithms/QuickSort';
import InsertionSort from '../components/Algorithms/InsertionSort';
import ShellSort from '../components/Algorithms/ShellSort';
import HeapSort from '../components/Algorithms/HeapSort';
import MergeSort from '../components/Algorithms/MergeSort';
import CountingSort from '../components/Algorithms/CountingSort';
import BucketSort from '../components/Algorithms/BucketSort';
import RadixSort from '../components/Algorithms/RadixSort';

// 递归与回溯算法组件
import Fibonacci from '../components/Algorithms/Fibonacci';
import Hanoi from '../components/Algorithms/Hanoi';
import Permutations from '../components/Algorithms/Permutations';
import NQueens from '../components/Algorithms/NQueens';

// 贪心算法组件
import MakeChange from '../components/Algorithms/MakeChange';
import ActivitySelection from '../components/Algorithms/ActivitySelection';

// 动态规划算法组件
import LIS from '../components/Algorithms/LIS';
import Knapsack from '../components/Algorithms/Knapsack';
import EditDistance from '../components/Algorithms/EditDistance';

// 搜索与树结构算法组件
import BinarySearch from '../components/Algorithms/BinarySearch';
import AVLTreePage from '../components/Algorithms/AVLTreePage';

/**
 * 算法配置数据数组
 * @constant {Array<Object>}
 * @description 定义所有可用算法的元数据信息，用于生成导航列表和默认展示卡片
 *
 * @数据结构说明:
 * - path: URL路径标识符（用于路由匹配）
 * - name: 算法中文名称（用于界面显示）
 * - description: 算法功能描述（用于卡片展示和提示）
 * - category: 算法分类（用于左侧导航分组）
 *
 * @注意: 数组顺序影响默认页面的卡片展示顺序，建议按分类有序排列
 */
const algorithms = [
  // ==================== 排序算法 ====================
  {
    path: 'bubble-sort',
    name: '冒泡排序',
    description: '一种简单的排序算法，重复地遍历要排序的序列，一次比较两个元素，交换它们的位置。',
    category: '排序算法'
  },
  {
    path: 'selection-sort',
    name: '选择排序',
    description: '一种简单直观的排序算法，每次从未排序区间选择最小的元素放到已排序区间的末尾。',
    category: '排序算法'
  },
  {
    path: 'insertion-sort',
    name: '插入排序',
    description: '一种简单直观的排序算法，对于小规模数据或基本有序的数据效率很高。',
    category: '排序算法'
  },
  {
    path: 'shell-sort',
    name: '希尔排序',
    description: '插入排序的改进版本，通过设置增量分组来提高效率，对中等规模数据性能较好。',
    category: '排序算法'
  },
  {
    path: 'heap-sort',
    name: '堆排序',
    description: '一种基于堆数据结构的排序算法，具有稳定的时间复杂度，适合大规模数据排序。',
    category: '排序算法'
  },
  {
    path: 'merge-sort',
    name: '归并排序',
    description: '一种基于分治策略的排序算法，具有稳定的时间复杂度和稳定性，适合处理大规模数据。',
    category: '排序算法'
  },
  {
    path: 'counting-sort',
    name: '计数排序',
    description: '一种非比较性的整数排序算法，通过统计元素出现次数来实现排序，适用于数据范围较小的场景。',
    category: '排序算法'
  },
  {
    path: 'bucket-sort',
    name: '桶排序',
    description: '一种分治的排序算法，将元素分配到不同的桶中，再对每个桶分别排序，适合数据分布均匀的场景。',
    category: '排序算法'
  },
  {
    path: 'radix-sort',
    name: '基数排序',
    description: '一种非比较性的整数排序算法，基于数字的每一位进行排序，从最低位开始，依次处理到最高位。',
    category: '排序算法'
  },
  {
    path: 'quick-sort',
    name: '快速排序',
    description: '一种高效的排序算法，使用分治法策略，选择基准元素将序列分为两部分，递归排序。',
    category: '排序算法'
  },

  // ==================== 递归算法 ====================
  {
    path: 'fibonacci',
    name: '斐波那契数列',
    description: '经典的递归问题，每个数是前两个数的和，通过递归调用计算第n个斐波那契数。',
    category: '递归算法'
  },
  {
    path: 'hanoi',
    name: '汉诺塔',
    description: '经典的递归问题，通过递归方式将n个圆盘从一个柱子移动到另一个柱子，遵循大盘不能放在小盘上的规则。',
    category: '递归算法'
  },

  // ==================== 回溯算法 ====================
  {
    path: 'permutations',
    name: '全排列',
    description: '使用回溯算法生成一组数字的所有可能排列，通过不断尝试和回退来找到所有解。',
    category: '回溯算法'
  },

  // ==================== 贪心算法 ====================
  {
    path: 'make-change',
    name: '找零钱问题',
    description: '使用贪心策略选择最大面值的硬币来找零，每次都选择当前最优解。',
    category: '贪心算法'
  },
  {
    path: 'activity-selection',
    name: '活动选择问题',
    description: '在一组活动中选择最多的互不重叠的活动，通过按结束时间排序来贪心选择。',
    category: '贪心算法'
  },

  // ==================== 动态规划 ====================
  {
    path: 'lis',
    name: '最长递增子序列',
    description: '使用动态规划求解序列中最长的严格递增子序列，是一个经典的动态规划问题。',
    category: '动态规划'
  },
  {
    path: 'knapsack',
    name: '0/1背包问题',
    description: '在有限的容量下，选择物品使得总价值最大，每个物品只能选择一次，是动态规划的经典应用。',
    category: '动态规划'
  },
  {
    path: 'edit-distance',
    name: '编辑距离',
    description: '计算将一个字符串转换成另一个字符串所需的最少操作次数，包括插入、删除和替换操作。',
    category: '动态规划'
  },

  // ==================== 搜索算法 ====================
  {
    path: 'binary-search',
    name: '二分查找',
    description: '在有序数组中通过不断折半查找区间来定位目标元素，时间复杂度为 O(log n)。',
    category: '搜索算法'
  },

  // ==================== 树结构 ====================
  {
    path: 'avl-tree',
    name: 'AVL树',
    description: '自平衡二叉搜索树，通过旋转操作保持平衡，确保所有操作的时间复杂度为 O(log n)。',
    category: '树结构'
  },

  // ==================== 回溯算法（续）====================
  {
    path: 'n-queens',
    name: 'N皇后问题',
    description: '在N×N的棋盘上放置N个皇后，使其互不攻击，使用回溯算法求解。',
    category: '回溯算法'
  }
];

/**
 * 算法详情页面主组件（完整版）
 * @component
 * @returns {JSX.Element} 完整的算法浏览与可视化界面
 *
 * @核心功能:
 * 1. **路径追踪**: 使用 useLocation 监听URL变化，高亮当前选中的算法
 * 2. **导航编程**: 使用 useNavigate 实现卡片的点击跳转
 * 3. **智能分组**: 使用 reduce 将扁平的算法数组转换为分类对象
 * 4. **条件渲染**: 根据是否选中具体算法，切换显示欢迎页或可视化组件
 *
 * @交互流程:
 * 用户访问 /algorithms → 显示默认欢迎页（算法卡片网格）
 *     ↓ 点击某个算法卡片或左侧导航项
 * URL变为 /algorithms/{algorithm-path} → 右侧渲染对应的可视化组件
 *     ↓ 点击其他算法
 * 无刷新切换到新的可视化组件（保留左侧导航状态）
 */
const AlgorithmsPage: React.FC = () => {
  // 获取当前路由位置对象，用于提取当前选中的算法路径
  const location = useLocation();
  // 获取导航函数，用于编程式路由跳转（卡片点击场景）
  const navigate = useNavigate();
  
  // 从URL路径中提取最后一部分作为当前算法标识
  // 例如：'/algorithms/bubble-sort' → 'bubble-sort'
  const currentPath = location.pathname.split('/').pop();

  /**
   * 按类别对算法进行分组
   * @description 将扁平化的算法数组转换为以分类为键的对象结构
   * 
   * @转换示例:
   * 输入: [{category: '排序算法', ...}, {category: '递归算法', ...}]
   * 输出: {
   *   '排序算法': [{...}, {...}],
   *   '递归算法': [{...}]
   * }
   *
   * @用途: 用于左侧导航栏的分类展示，避免硬编码分类列表
   */
  const algorithmsByCategory = algorithms.reduce((acc, algo) => {
    // 如果该分类尚不存在，初始化为空数组
    if (!acc[algo.category]) {
      acc[algo.category] = [];
    }
    // 将当前算法添加到对应分类的数组中
    acc[algo.category].push(algo);
    return acc;
  }, {} as Record<string, typeof algorithms>);

  return (
    /* 主容器：全高 flex 布局 */
    <div className="flex h-full">
      {/* ===== 左侧导航栏开始 ===== */}
      {/* 固定宽度256px，浅灰背景，带右边框分隔 */}
      <div className="w-64 bg-gray-50 border-r p-4 overflow-y-auto">
        {/* 导航标题 */}
        <h2 className="text-lg font-semibold mb-4">算法列表</h2>
        
        {/* 遍历所有分类，生成分类导航组 */}
        {Object.entries(algorithmsByCategory).map(([category, algos]) => (
          /* 单个分类容器：底部间距24px */
          <div key={category} className="mb-6">
            {/* 分类标题：小号字体 + 灰色 + 大写字母间距 */
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
              {category}
            </h3>
            
            {/* 该分类下的算法列表 */}
            <ul className="space-y-1">
              {algos.map((algo) => (
                /* 单个算法导航项 */
                <li key={algo.path}>
                  <Link
                    to={`/algorithms/${algo.path}`}
                    className={`
                      block px-3 py-2 rounded-md text-sm font-medium
                      /* 条件样式：根据是否为当前选中项应用不同样式 */
                      ${currentPath === algo.path
                        ? 'bg-blue-500 text-white'           /* 选中状态：蓝色背景 + 白色文字 */
                        : 'text-gray-700 hover:bg-gray-100'  /* 未选中：灰色文字 + 悬停浅灰背景 */
                      }
                    `}
                  >
                    {algo.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {/* ===== 左侧导航栏结束 ===== */}

      {/* ===== 右侧内容区域开始 ===== */}
      <div className="flex-1 overflow-y-auto">
        {/* 条件渲染：判断用户是否访问了具体的算法页面 */}
        {location.pathname === '/algorithms' ? (
          /* ---------- 默认欢迎页开始 ---------- */
          /*
           * 当用户访问 /algorithms 根路径时显示
           * 展示所有算法的概览卡片，方便用户快速浏览和选择
           */
          <div className="p-8">
            {/* 页面主标题 */}
            <h1 className="text-3xl font-bold mb-6">算法可视化</h1>
            {/* 引导性描述文字 */}
            <p className="text-gray-600 mb-8">
              选择左侧的算法来查看其可视化演示和详细说明。
            </p>
            
            {/* 算法卡片网格：响应式三列布局 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {algorithms.map((algo) => (
                /* 单个算法卡片：可点击，点击后跳转到对应算法详情页 */
                <div
                  key={algo.path}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/algorithms/${algo.path}`)}
                >
                  {/* 算法名称 */}
                  <h3 className="text-xl font-semibold mb-2">{algo.name}</h3>
                  {/* 算法描述 */}
                  <p className="text-gray-600">{algo.description}</p>
                </div>
              ))}
            </div>
          </div>
          /* ---------- 默认欢迎页结束 ---------- */
        ) : (
          /* ---------- 算法可视化区域开始 ---------- */
          /*
           * 当用户访问 /algorithms/{algorithm-name} 时显示
           * 通过 React Router 渲染对应算法的可视化组件
           */
          <Routes>
            {/* 排序算法路由组 */}
            <Route path="bubble-sort" element={<BubbleSort />} />
            <Route path="selection-sort" element={<SelectionSort />} />
            <Route path="insertion-sort" element={<InsertionSort />} />
            <Route path="shell-sort" element={<ShellSort />} />
            <Route path="heap-sort" element={<HeapSort />} />
            <Route path="merge-sort" element={<MergeSort />} />
            <Route path="counting-sort" element={<CountingSort />} />
            <Route path="bucket-sort" element={<BucketSort />} />
            <Route path="radix-sort" element={<RadixSort />} />
            <Route path="quick-sort" element={<QuickSort />} />
            
            {/* 递归算法路由组 */}
            <Route path="fibonacci" element={<Fibonacci />} />
            <Route path="hanoi" element={<Hanoi />} />
            
            {/* 回溯算法路由组 */}
            <Route path="permutations" element={<Permutations />} />
            <Route path="n-queens" element={<NQueens />} />
            
            {/* 贪心算法路由组 */}
            <Route path="make-change" element={<MakeChange />} />
            <Route path="activity-selection" element={<ActivitySelection />} />
            
            {/* 动态规划路由组 */}
            <Route path="lis" element={<LIS />} />
            <Route path="knapsack" element={<Knapsack />} />
            <Route path="edit-distance" element={<EditDistance />} />
            
            {/* 搜索与树结构路由组 */}
            <Route path="binary-search" element={<BinarySearch />} />
            <Route path="avl-tree" element={<AVLTreePage />} />
          </Routes>
          /* ---------- 算法可视化区域结束 ---------- */
        )}
      </div>
      {/* ===== 右侧内容区域结束 ===== */}
    </div>
  );
};

export default AlgorithmsPage;