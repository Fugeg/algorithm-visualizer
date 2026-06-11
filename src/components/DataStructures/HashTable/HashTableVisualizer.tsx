/**
 * @fileoverview 哈希表可视化展示组件（HashTableVisualizer）
 *
 * 本组件负责将哈希表的桶数组结构渲染为可视化的列表形式。
 *
 * 可视化原理：
 * - 使用垂直布局展示每个桶（Bucket）
 * - 每个桶显示索引号和包含的键值对列表
 * - 空桶显示"空桶"提示
 * - 支持高亮显示正在操作的桶和具体条目
 *
 * 渲染逻辑：
 * 1. 遍历 buckets 二维数组（每个元素是一个键值对数组）
 * 2. 为每个桶创建行容器，左侧显示桶索引（灰色方块）
 * 3. 右侧显示该桶包含的所有键值对（白色卡片）
 * 4. 每个键值对卡片显示：键、值、哈希值（如果有）
 * 5. 高亮的桶使用浅蓝背景，高亮的条目使用蓝色背景
 */

import React from 'react';

/** 哈希表条目接口定义 */
interface HashTableItem {
  key: string;
  value: string;
  hash?: number;
}

/** HashTableVisualizer 组件的 Props 接口定义 */
interface HashTableVisualizerProps {
  buckets: (HashTableItem[])[];
  highlightBuckets: number[];
  highlightItems: HashTableItem[];
}

/**
 * 哈希表可视化组件
 */

const HashTableVisualizer: React.FC<HashTableVisualizerProps> = ({
  buckets,
  highlightBuckets,
  highlightItems
}) => {
  return (
    <div className="border rounded-lg bg-white p-4 shadow-sm overflow-x-auto">
      <div className="min-w-max">
        {buckets.map((bucket, index) => (
          <div
            key={index}
            className={`flex items-start mb-2 p-2 rounded ${
              highlightBuckets.includes(index) ? 'bg-blue-100' : 'bg-gray-50'
            }`}
          >
            <div className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded mr-4">
              {index}
            </div>
            <div className="flex-1">
              {bucket.length === 0 ? (
                <div className="h-12 flex items-center text-gray-400">空桶</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {bucket.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className={`
                        p-2 rounded border
                        ${highlightItems.some(hi => hi.key === item.key)
                          ? 'bg-blue-500 text-white border-blue-600'
                          : 'bg-white border-gray-200'
                        }
                      `}
                    >
                      <div className="text-sm font-medium">
                        键: {item.key}
                      </div>
                      <div className="text-sm">
                        值: {item.value}
                      </div>
                      {item.hash !== undefined && (
                        <div className="text-xs opacity-75">
                          哈希: {item.hash}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HashTableVisualizer;
