/**
 * @fileoverview 动态规划表格可视化组件
 * @description 用于展示动态规划算法执行过程中DP数组（二维表）的状态变化。
 *              支持高亮当前正在计算的单元格，帮助用户理解DP的填表顺序和状态转移过程。
 *
 * @note 常见应用场景：
 *       - 最长递增子序列（LIS）：一维DP表
 *       - 0/1背包问题：二维DP表（物品×容量）
 *       - 编辑距离：二维DP表（字符串1×字符串2）
 */

import React from 'react';

/**
 * DPTable组件属性接口
 * @interface DPTableProps
 * @property dp - 二维DP数组数据（number[][]）
 * @property highlightCell - 当前高亮的单元格坐标 { row, col }（可选）
 * @property rowLabels - 行标签数组（可选，默认使用行索引）
 * @property colLabels - 列标签数组（可选，默认使用列索引）
 */
interface DPTableProps {
  dp: number[][];
  highlightCell?: { row: number; col: number };
  rowLabels?: string[];
  colLabels?: string[];
}

/**
 * 动态规划表格组件
 * @param props - 组件属性（见接口定义）
 * @description 渲染特性：
 *              1. 表格自动适应内容大小，支持水平滚动
 *              2. 行列标题可自定义（如显示字符、重量等）
 *              3. 当前计算单元格黄色高亮
 *              4. 非零值单元格浅蓝色背景（区分已计算和未计算状态）
 *              5. 使用等宽字体对齐数字
 */
const DPTable: React.FC<DPTableProps> = ({
  dp,
  highlightCell,
  rowLabels,
  colLabels
}) => {
  // 空数据保护：无数据时返回空
  if (!dp.length) return null;

  return (
    <div className="overflow-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            {/* 左上角空白单元格 */}
            <th className="p-2 border bg-gray-50"></th>
            {/* 列标题行：使用colLabels或默认列索引 */}
            {Array.from({ length: dp[0].length }, (_, i) => (
              <th
                key={i}
                className="p-2 border bg-gray-50 font-mono text-sm"
              >
                {colLabels ? colLabels[i] : i}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* 数据行遍历 */}
          {dp.map((row, i) => (
            <tr key={i}>
              {/* 行标题：使用rowLabels或默认行索引 */}
              <td className="p-2 border bg-gray-50 font-mono text-sm">
                {rowLabels ? rowLabels[i] : i}
              </td>
              {/* 单元格数据 */}
              {row.map((cell, j) => (
                <td
                  key={j}
                  // 动态样式：高亮单元格 > 非零值单元格 > 默认
                  className={`p-2 border text-center font-mono ${
                    highlightCell?.row === i && highlightCell?.col === j
                      ? 'bg-yellow-100'           // 当前正在计算的单元格：黄色高亮
                      : cell > 0
                      ? 'bg-blue-50'               // 已计算的非零单元格：浅蓝色
                      : ''                          // 未计算或零值：默认白色
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DPTable;
